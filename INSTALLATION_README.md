# A-Pro Marketing Server Installation Guide

This guide will help you set up the complete A-Pro Marketing platform with both the demo application and Ghost CMS on a single server.

## 🚀 Quick Start

### Prerequisites

- **Operating System**: Ubuntu 20.04+ or Debian 10+ (recommended)
- **RAM**: Minimum 1GB, recommended 2GB+
- **Storage**: Minimum 10GB free space
- **Network**: Internet connection for package downloads
- **User**: Non-root user with sudo privileges

### One-Line Installation

```bash
# For localhost development
curl -fsSL https://raw.githubusercontent.com/apromarketing/install.sh | bash

# For production with custom domain
curl -fsSL https://raw.githubusercontent.com/apromarketing/install.sh | bash -s -- --domain yourdomain.com
```

### Manual Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd apromarketing
   ```

2. **Run the installation script:**
   ```bash
   # Development setup (localhost)
   ./install.sh

   # Production setup
   ./install.sh --domain yourdomain.com

   # Custom ports
   ./install.sh --domain yourdomain.com --ghost-port 2369 --demo-port 3001
   ```

## 📋 Installation Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--domain` | Domain name for the server | `localhost` | `--domain example.com` |
| `--ghost-port` | Port for Ghost CMS | `2368` | `--ghost-port 2369` |
| `--demo-port` | Port for demo application | `3000` | `--demo-port 3001` |
| `--help` | Show help message | - | `--help` |

## 🏗️ What Gets Installed

### System Dependencies
- **Node.js** (Latest LTS) - Runtime for applications
- **Nginx** - Web server and reverse proxy
- **SQLite3** - Database for Ghost CMS
- **Certbot** - SSL certificate management
- **UFW** - Firewall configuration

### Applications
- **Ghost CMS** - Content management system for blogs
- **Demo Application** - A-Pro marketing demo interface
- **WordPress Import Tools** - Scripts to migrate from WordPress

### Services Created
- `apromarketing-demo.service` - Demo application service
- `ghost_production.service` - Ghost CMS service (production)
- `ghost_localhost.service` - Ghost CMS service (development)

## 🌐 Access Points

### Development Setup (localhost)
- **Demo Application**: http://localhost:3000
- **Ghost CMS**: http://localhost:2368
- **Ghost Admin**: http://localhost:2368/ghost/

### Production Setup (with domain)
- **Demo Application**: https://yourdomain.com
- **Ghost Blog**: https://yourdomain.com/blog
- **Ghost Admin**: https://yourdomain.com/blog/ghost/

## 🔧 Post-Installation Setup

### 1. Complete Ghost Setup
1. Visit the Ghost Admin panel
2. Create your admin account
3. Configure your site settings
4. Import WordPress content (if available):
   - Go to Settings → Labs
   - Import the file: `/opt/apromarketing/demo/ghost-import.json`

### 2. Configure Demo Application
1. Check if the demo app is running: `sudo systemctl status apromarketing-demo`
2. View logs: `sudo journalctl -u apromarketing-demo -f`
3. Restart if needed: `sudo systemctl restart apromarketing-demo`

### 3. SSL Certificate (Production Only)
SSL certificates are automatically obtained and configured. They will auto-renew via certbot.

## 📁 Directory Structure

```
/opt/apromarketing/
├── demo/                    # Demo application files
│   ├── server/             # Server-side code
│   ├── public/             # Static assets
│   ├── images/             # WordPress imported images
│   ├── ghost-import.json   # Ghost import file
│   └── .env                # Environment configuration
└── ghost/                  # Ghost CMS installation
    ├── content/            # Ghost content and themes
    ├── versions/           # Ghost version files
    └── config.*.json       # Ghost configuration
```

## 🛠️ Management Commands

### Service Management
```bash
# Demo Application
sudo systemctl start apromarketing-demo
sudo systemctl stop apromarketing-demo
sudo systemctl restart apromarketing-demo
sudo systemctl status apromarketing-demo

# Ghost CMS
sudo systemctl start ghost_production
sudo systemctl stop ghost_production
sudo systemctl restart ghost_production
sudo systemctl status ghost_production

# Nginx
sudo systemctl reload nginx
sudo systemctl restart nginx
sudo systemctl status nginx
```

### Viewing Logs
```bash
# Demo app logs
sudo journalctl -u apromarketing-demo -f

# Ghost logs
sudo journalctl -u ghost_production -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Ghost CLI Commands
```bash
cd /opt/apromarketing/ghost

# Check Ghost status
ghost status

# Update Ghost
ghost update

# Restart Ghost
ghost restart

# View Ghost logs
ghost log
```

## 🔒 Security Features

### Firewall Configuration
- **UFW** firewall is enabled and configured
- Only necessary ports are opened:
  - SSH (22)
  - HTTP (80) and HTTPS (443) for production
  - Custom ports for development

### SSL/TLS
- **Let's Encrypt** SSL certificates (production)
- Automatic certificate renewal
- Strong SSL configuration with modern protocols

### Security Headers
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Content Security Policy
- HSTS (HTTP Strict Transport Security)

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Quick status check
sudo systemctl is-active apromarketing-demo ghost_production nginx

# Check open ports
sudo netstat -tuln | grep -E ':(80|443|2368|3000)'

# Check disk space
df -h

# Check memory usage
free -h
```

### Backup Recommendations
```bash
# Backup Ghost content
sudo tar -czf ghost-backup-$(date +%Y%m%d).tar.gz /opt/apromarketing/ghost/content

# Backup demo app configuration
sudo tar -czf demo-backup-$(date +%Y%m%d).tar.gz /opt/apromarketing/demo

# Backup Nginx configuration
sudo tar -czf nginx-backup-$(date +%Y%m%d).tar.gz /etc/nginx/sites-available /etc/nginx/sites-enabled
```

## 🐛 Troubleshooting

### Common Issues

#### Demo App Won't Start
```bash
# Check logs for errors
sudo journalctl -u apromarketing-demo -n 50

# Verify Node.js and npm
node --version
npm --version

# Check if port is available
sudo netstat -tuln | grep :3000
```

#### Ghost Won't Start
```bash
# Check Ghost status
cd /opt/apromarketing/ghost && ghost status

# Check Ghost logs
ghost log

# Restart Ghost
ghost restart
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew --dry-run

# Check Nginx configuration
sudo nginx -t
```

#### Port Already in Use
```bash
# Find what's using the port
sudo lsof -i :3000
sudo lsof -i :2368

# Kill the process if necessary
sudo kill -9 <PID>
```

### Log Locations
- **Demo App**: `sudo journalctl -u apromarketing-demo`
- **Ghost**: `sudo journalctl -u ghost_production`
- **Nginx Access**: `/var/log/nginx/access.log`
- **Nginx Error**: `/var/log/nginx/error.log`
- **System**: `/var/log/syslog`

## 🔄 Updates and Maintenance

### Updating the Demo Application
```bash
cd /opt/apromarketing/demo
git pull origin main
npm install
sudo systemctl restart apromarketing-demo
```

### Updating Ghost CMS
```bash
cd /opt/apromarketing/ghost
ghost update
```

### Updating System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo systemctl restart apromarketing-demo
```

## 📞 Support

For issues and support:

1. **Check the logs** first using the commands above
2. **Review the troubleshooting section**
3. **Create an issue** on the GitHub repository with:
   - Error messages from logs
   - System information (`uname -a`, `lsb_release -a`)
   - Steps to reproduce the issue

## 🚮 Uninstallation

To completely remove the installation:

```bash
# Stop services
sudo systemctl stop apromarketing-demo ghost_production
sudo systemctl disable apromarketing-demo ghost_production

# Remove service files
sudo rm /etc/systemd/system/apromarketing-demo.service
sudo systemctl daemon-reload

# Remove installation directory
sudo rm -rf /opt/apromarketing

# Remove Nginx configuration
sudo rm /etc/nginx/sites-available/yourdomain.com
sudo rm /etc/nginx/sites-enabled/yourdomain.com
sudo systemctl reload nginx

# Remove SSL certificates (optional)
sudo certbot delete --cert-name yourdomain.com
```

---

**Note**: This installation script is designed for Ubuntu/Debian systems. For other distributions, manual installation may be required.