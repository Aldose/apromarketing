#!/bin/bash

# A-Pro Marketing Installation Script
# Sets up demo page and Ghost CMS on a single server
# Usage: ./install.sh [--domain example.com] [--ghost-port 2368] [--demo-port 3000]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DOMAIN="localhost"
GHOST_PORT="2368"
DEMO_PORT="3000"
INSTALL_DIR="/opt/apromarketing"
GHOST_DIR="/opt/apromarketing/ghost"
DEMO_DIR="/opt/apromarketing/demo"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --domain)
      DOMAIN="$2"
      shift 2
      ;;
    --ghost-port)
      GHOST_PORT="$2"
      shift 2
      ;;
    --demo-port)
      DEMO_PORT="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  --domain DOMAIN     Domain name (default: localhost)"
      echo "  --ghost-port PORT   Ghost port (default: 2368)"
      echo "  --demo-port PORT    Demo app port (default: 3000)"
      echo "  --help             Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

heading() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
        error "Please run as a regular user with sudo privileges"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    heading "Checking System Requirements"

    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        error "Cannot determine OS version"
        exit 1
    fi

    source /etc/os-release
    log "Detected OS: $PRETTY_NAME"

    # Check if Ubuntu/Debian
    if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
        warn "This script is designed for Ubuntu/Debian. Proceeding anyway..."
    fi

    # Check available ports
    if netstat -tuln | grep -q ":$GHOST_PORT "; then
        error "Port $GHOST_PORT is already in use"
        exit 1
    fi

    if netstat -tuln | grep -q ":$DEMO_PORT "; then
        error "Port $DEMO_PORT is already in use"
        exit 1
    fi

    log "System requirements check passed"
}

# Install system dependencies
install_dependencies() {
    heading "Installing System Dependencies"

    log "Updating package lists..."
    sudo apt update

    log "Installing required packages..."
    sudo apt install -y \
        curl \
        wget \
        gnupg2 \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        lsb-release \
        nginx \
        certbot \
        python3-certbot-nginx \
        unzip \
        sqlite3 \
        git
}

# Install Node.js
install_nodejs() {
    heading "Installing Node.js"

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log "Node.js already installed: $NODE_VERSION"

        # Check if version is 18 or higher
        MAJOR_VERSION=$(echo $NODE_VERSION | sed 's/v//' | cut -d. -f1)
        if [[ $MAJOR_VERSION -lt 18 ]]; then
            warn "Node.js version is too old, installing latest LTS..."
        else
            log "Node.js version is compatible"
            return 0
        fi
    fi

    log "Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs

    log "Node.js installed: $(node --version)"
    log "npm installed: $(npm --version)"
}

# Create application directories
create_directories() {
    heading "Creating Application Directories"

    log "Creating installation directory: $INSTALL_DIR"
    sudo mkdir -p "$INSTALL_DIR"
    sudo chown $(whoami):$(whoami) "$INSTALL_DIR"

    mkdir -p "$GHOST_DIR"
    mkdir -p "$DEMO_DIR"

    log "Directories created successfully"
}

# Install Ghost CMS
install_ghost() {
    heading "Installing Ghost CMS"

    log "Installing Ghost CLI globally..."
    sudo npm install ghost-cli@latest -g

    log "Setting up Ghost in $GHOST_DIR..."
    cd "$GHOST_DIR"

    if [[ "$DOMAIN" == "localhost" ]]; then
        # Local development setup
        ghost install local --port $GHOST_PORT
    else
        # Production setup
        ghost install --url "https://$DOMAIN" --port $GHOST_PORT --no-prompt \
            --dbhost localhost --dbuser ghost --dbname ghost_production \
            --process systemd --no-setup-ssl
    fi

    log "Ghost CMS installed successfully"
}

# Set up demo application
setup_demo_app() {
    heading "Setting up Demo Application"

    log "Copying demo application files..."
    cd "$DEMO_DIR"

    # Copy the current project files (excluding node_modules and ghost)
    rsync -av --exclude='node_modules' --exclude='ghost' --exclude='.git' \
        "$(dirname "$0")/" ./

    log "Installing demo app dependencies..."
    npm install

    # Create environment file
    cat > .env << EOF
PORT=$DEMO_PORT
NODE_ENV=production
GHOST_URL=http://localhost:$GHOST_PORT
EOF

    log "Demo application setup complete"
}

# Configure Nginx
configure_nginx() {
    heading "Configuring Nginx"

    if [[ "$DOMAIN" == "localhost" ]]; then
        log "Skipping Nginx configuration for localhost setup"
        return 0
    fi

    log "Creating Nginx configuration for $DOMAIN..."

    # Create Nginx site configuration
    sudo tee "$NGINX_SITES/$DOMAIN" > /dev/null << EOF
# A-Pro Marketing - $DOMAIN
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL configuration (certificates will be added by certbot)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Demo application (main site)
    location / {
        proxy_pass http://localhost:$DEMO_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Ghost blog
    location /blog {
        rewrite ^/blog(.*) \$1 break;
        proxy_pass http://localhost:$GHOST_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Ghost admin
    location /blog/ghost {
        proxy_pass http://localhost:$GHOST_PORT/ghost;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    log "Enabling site configuration..."
    sudo ln -sf "$NGINX_SITES/$DOMAIN" "$NGINX_ENABLED/$DOMAIN"

    # Remove default site if it exists
    sudo rm -f "$NGINX_ENABLED/default"

    log "Testing Nginx configuration..."
    sudo nginx -t

    log "Restarting Nginx..."
    sudo systemctl restart nginx
}

# Set up SSL certificates
setup_ssl() {
    heading "Setting up SSL Certificates"

    if [[ "$DOMAIN" == "localhost" ]]; then
        log "Skipping SSL setup for localhost"
        return 0
    fi

    log "Obtaining SSL certificate for $DOMAIN..."
    sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN"

    log "Setting up automatic certificate renewal..."
    sudo systemctl enable certbot.timer
    sudo systemctl start certbot.timer
}

# Create systemd services
create_services() {
    heading "Creating Systemd Services"

    # Demo app service
    log "Creating demo app service..."
    sudo tee /etc/systemd/system/apromarketing-demo.service > /dev/null << EOF
[Unit]
Description=A-Pro Marketing Demo Application
Documentation=https://github.com/apromarketing
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$DEMO_DIR
Environment=NODE_ENV=production
Environment=PORT=$DEMO_PORT
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10
KillMode=mixed

[Install]
WantedBy=multi-user.target
EOF

    log "Enabling and starting services..."
    sudo systemctl daemon-reload
    sudo systemctl enable apromarketing-demo
    sudo systemctl start apromarketing-demo

    # Ghost service should already be created by Ghost CLI
    sudo systemctl enable ghost_production || true
    sudo systemctl start ghost_production || true
}

# Configure firewall
configure_firewall() {
    heading "Configuring Firewall"

    if ! command -v ufw &> /dev/null; then
        log "UFW not installed, skipping firewall configuration"
        return 0
    fi

    log "Configuring UFW firewall..."
    sudo ufw --force enable
    sudo ufw default deny incoming
    sudo ufw default allow outgoing

    # Allow SSH
    sudo ufw allow OpenSSH

    if [[ "$DOMAIN" == "localhost" ]]; then
        # Local development ports
        sudo ufw allow $GHOST_PORT
        sudo ufw allow $DEMO_PORT
    else
        # Production - only HTTP/HTTPS
        sudo ufw allow 'Nginx Full'
    fi

    log "Firewall configured"
}

# Import WordPress content
import_wordpress_content() {
    heading "Importing WordPress Content"

    if [[ ! -f "$DEMO_DIR/ghost-import.json" ]]; then
        warn "No Ghost import file found, skipping content import"
        return 0
    fi

    log "Copying WordPress images to Ghost content directory..."
    sudo mkdir -p "$GHOST_DIR/content/images"
    sudo cp -r "$DEMO_DIR/images/"* "$GHOST_DIR/content/images/" 2>/dev/null || true
    sudo chown -R ghost:ghost "$GHOST_DIR/content/images" 2>/dev/null || true

    log "WordPress content prepared for import"
    log "To complete the import:"
    log "  1. Visit http://$DOMAIN:$GHOST_PORT/ghost/ (or https://$DOMAIN/blog/ghost/)"
    log "  2. Go to Settings → Labs"
    log "  3. Import the file: $DEMO_DIR/ghost-import.json"
}

# Final status and instructions
show_final_status() {
    heading "Installation Complete!"

    echo -e "${GREEN}"
    echo "✅ A-Pro Marketing has been successfully installed!"
    echo ""
    echo "Services Status:"
    echo "=================="

    # Check service status
    if systemctl is-active --quiet apromarketing-demo; then
        echo "✅ Demo Application: Running on port $DEMO_PORT"
    else
        echo "❌ Demo Application: Failed to start"
    fi

    if systemctl is-active --quiet ghost_production 2>/dev/null || \
       systemctl is-active --quiet ghost_localhost 2>/dev/null; then
        echo "✅ Ghost CMS: Running on port $GHOST_PORT"
    else
        echo "❌ Ghost CMS: Failed to start"
    fi

    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx: Running"
    else
        echo "❌ Nginx: Not running"
    fi

    echo ""
    echo "Access Information:"
    echo "=================="

    if [[ "$DOMAIN" == "localhost" ]]; then
        echo "🌐 Demo Application: http://localhost:$DEMO_PORT"
        echo "📝 Ghost CMS: http://localhost:$GHOST_PORT"
        echo "⚙️  Ghost Admin: http://localhost:$GHOST_PORT/ghost/"
    else
        echo "🌐 Demo Application: https://$DOMAIN"
        echo "📝 Ghost Blog: https://$DOMAIN/blog"
        echo "⚙️  Ghost Admin: https://$DOMAIN/blog/ghost/"
    fi

    echo ""
    echo "Useful Commands:"
    echo "================"
    echo "• Check demo app logs: sudo journalctl -u apromarketing-demo -f"
    echo "• Check Ghost logs: sudo journalctl -u ghost_production -f"
    echo "• Restart demo app: sudo systemctl restart apromarketing-demo"
    echo "• Restart Ghost: sudo systemctl restart ghost_production"
    echo "• Check Nginx status: sudo systemctl status nginx"
    echo ""

    if [[ "$DOMAIN" != "localhost" ]]; then
        echo "Security Notes:"
        echo "==============="
        echo "• SSL certificates will auto-renew via certbot"
        echo "• Firewall (UFW) is enabled and configured"
        echo "• Change default Ghost admin password on first login"
        echo ""
    fi

    echo -e "${NC}"
}

# Cleanup function
cleanup() {
    if [[ $? -ne 0 ]]; then
        error "Installation failed. Cleaning up..."

        # Stop services if they were started
        sudo systemctl stop apromarketing-demo 2>/dev/null || true
        sudo systemctl stop ghost_production 2>/dev/null || true

        # Remove service files
        sudo rm -f /etc/systemd/system/apromarketing-demo.service
        sudo systemctl daemon-reload

        # Remove nginx site
        sudo rm -f "$NGINX_ENABLED/$DOMAIN"
        sudo nginx -t && sudo systemctl reload nginx 2>/dev/null || true
    fi
}

# Main installation process
main() {
    trap cleanup EXIT

    log "Starting A-Pro Marketing installation..."
    log "Domain: $DOMAIN"
    log "Ghost Port: $GHOST_PORT"
    log "Demo Port: $DEMO_PORT"

    check_root
    check_requirements
    install_dependencies
    install_nodejs
    create_directories
    install_ghost
    setup_demo_app
    configure_nginx
    setup_ssl
    create_services
    configure_firewall
    import_wordpress_content
    show_final_status
}

# Run main function
main "$@"