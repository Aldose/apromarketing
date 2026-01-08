#!/bin/bash

# A-Pro Marketing Health Check Script
# Monitors the status of all services and components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GHOST_PORT="${GHOST_PORT:-2368}"
DEMO_PORT="${DEMO_PORT:-3000}"
INSTALL_DIR="${INSTALL_DIR:-/opt/apromarketing}"

# Check if we're monitoring localhost or a domain
if [[ -n "$DOMAIN" && "$DOMAIN" != "localhost" ]]; then
    GHOST_URL="https://$DOMAIN/blog"
    DEMO_URL="https://$DOMAIN"
    GHOST_ADMIN_URL="https://$DOMAIN/blog/ghost"
else
    GHOST_URL="http://localhost:$GHOST_PORT"
    DEMO_URL="http://localhost:$DEMO_PORT"
    GHOST_ADMIN_URL="http://localhost:$GHOST_PORT/ghost"
fi

log() {
    echo -e "${GREEN}[OK]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

check_service() {
    local service_name="$1"
    local display_name="$2"

    if systemctl is-active --quiet "$service_name"; then
        log "$display_name service is running"
        return 0
    else
        error "$display_name service is not running"
        return 1
    fi
}

check_port() {
    local port="$1"
    local service_name="$2"

    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        log "$service_name is listening on port $port"
        return 0
    else
        error "$service_name is not listening on port $port"
        return 1
    fi
}

check_url() {
    local url="$1"
    local service_name="$2"
    local expected_status="${3:-200}"

    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$url" 2>/dev/null || echo "000")

    if [[ "$status_code" == "$expected_status" ]]; then
        log "$service_name is responding correctly ($status_code)"
        return 0
    else
        error "$service_name returned status $status_code (expected $expected_status)"
        return 1
    fi
}

check_disk_space() {
    local path="$1"
    local min_space_gb="$2"

    if [[ ! -d "$path" ]]; then
        error "Directory $path does not exist"
        return 1
    fi

    local available_gb
    available_gb=$(df "$path" | awk 'NR==2 {print int($4/1024/1024)}')

    if [[ "$available_gb" -ge "$min_space_gb" ]]; then
        log "Sufficient disk space available: ${available_gb}GB (minimum: ${min_space_gb}GB)"
        return 0
    else
        warn "Low disk space: ${available_gb}GB available (minimum: ${min_space_gb}GB recommended)"
        return 1
    fi
}

check_memory() {
    local min_memory_mb="$1"

    local available_mb
    available_mb=$(free -m | awk 'NR==2 {print $7}')

    if [[ "$available_mb" -ge "$min_memory_mb" ]]; then
        log "Sufficient memory available: ${available_mb}MB (minimum: ${min_memory_mb}MB)"
        return 0
    else
        warn "Low memory: ${available_mb}MB available (minimum: ${min_memory_mb}MB recommended)"
        return 1
    fi
}

check_ssl_certificate() {
    local domain="$1"

    if [[ -z "$domain" || "$domain" == "localhost" ]]; then
        info "Skipping SSL check for localhost"
        return 0
    fi

    local expiry_date
    expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

    if [[ -n "$expiry_date" ]]; then
        local expiry_timestamp
        expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp
        current_timestamp=$(date +%s)
        local days_until_expiry
        days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))

        if [[ "$days_until_expiry" -gt 30 ]]; then
            log "SSL certificate is valid (expires in $days_until_expiry days)"
            return 0
        elif [[ "$days_until_expiry" -gt 0 ]]; then
            warn "SSL certificate expires soon (in $days_until_expiry days)"
            return 1
        else
            error "SSL certificate has expired"
            return 1
        fi
    else
        error "Could not check SSL certificate"
        return 1
    fi
}

main() {
    echo "🏥 A-Pro Marketing Health Check"
    echo "================================"
    echo "Timestamp: $(date)"
    echo "URLs:"
    echo "  Demo: $DEMO_URL"
    echo "  Ghost: $GHOST_URL"
    echo "  Ghost Admin: $GHOST_ADMIN_URL"
    echo ""

    local checks_passed=0
    local checks_failed=0

    # System resource checks
    echo "🖥️  System Resources:"
    check_disk_space "$INSTALL_DIR" 2 && ((checks_passed++)) || ((checks_failed++))
    check_memory 512 && ((checks_passed++)) || ((checks_failed++))
    echo ""

    # Service status checks
    echo "🔧 Service Status:"
    check_service "apromarketing-demo" "Demo Application" && ((checks_passed++)) || ((checks_failed++))

    if systemctl list-unit-files | grep -q "ghost_production"; then
        check_service "ghost_production" "Ghost CMS (Production)" && ((checks_passed++)) || ((checks_failed++))
    elif systemctl list-unit-files | grep -q "ghost_localhost"; then
        check_service "ghost_localhost" "Ghost CMS (Development)" && ((checks_passed++)) || ((checks_failed++))
    else
        error "No Ghost service found"
        ((checks_failed++))
    fi

    if systemctl list-unit-files | grep -q "nginx"; then
        check_service "nginx" "Nginx Web Server" && ((checks_passed++)) || ((checks_failed++))
    else
        info "Nginx not installed (development setup)"
    fi
    echo ""

    # Port availability checks
    echo "🌐 Port Availability:"
    check_port "$DEMO_PORT" "Demo Application" && ((checks_passed++)) || ((checks_failed++))
    check_port "$GHOST_PORT" "Ghost CMS" && ((checks_passed++)) || ((checks_failed++))
    echo ""

    # URL response checks
    echo "🌍 URL Response Checks:"
    check_url "$DEMO_URL" "Demo Application" && ((checks_passed++)) || ((checks_failed++))
    check_url "$GHOST_URL" "Ghost CMS" && ((checks_passed++)) || ((checks_failed++))
    check_url "$GHOST_ADMIN_URL" "Ghost Admin" 200 && ((checks_passed++)) || ((checks_failed++))
    echo ""

    # SSL certificate check (if applicable)
    if [[ -n "$DOMAIN" && "$DOMAIN" != "localhost" ]]; then
        echo "🔒 SSL Certificate:"
        check_ssl_certificate "$DOMAIN" && ((checks_passed++)) || ((checks_failed++))
        echo ""
    fi

    # File system checks
    echo "📁 File System:"
    if [[ -f "$INSTALL_DIR/demo/ghost-import.json" ]]; then
        log "Ghost import file exists"
        ((checks_passed++))
    else
        warn "Ghost import file not found"
        ((checks_failed++))
    fi

    if [[ -d "$INSTALL_DIR/demo/images" ]]; then
        local image_count
        image_count=$(find "$INSTALL_DIR/demo/images" -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.gif" \) | wc -l)
        log "WordPress images directory exists ($image_count images)"
        ((checks_passed++))
    else
        warn "WordPress images directory not found"
        ((checks_failed++))
    fi
    echo ""

    # Summary
    echo "📊 Health Check Summary:"
    echo "========================"
    echo "✅ Checks Passed: $checks_passed"
    echo "❌ Checks Failed: $checks_failed"

    if [[ "$checks_failed" -eq 0 ]]; then
        log "All systems operational!"
        exit 0
    elif [[ "$checks_failed" -lt "$checks_passed" ]]; then
        warn "Some issues detected, but system is mostly operational"
        exit 1
    else
        error "Critical issues detected!"
        exit 2
    fi
}

# Show help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "A-Pro Marketing Health Check Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Environment Variables:"
    echo "  DOMAIN       - Domain name (default: localhost)"
    echo "  GHOST_PORT   - Ghost CMS port (default: 2368)"
    echo "  DEMO_PORT    - Demo app port (default: 3000)"
    echo "  INSTALL_DIR  - Installation directory (default: /opt/apromarketing)"
    echo ""
    echo "Exit Codes:"
    echo "  0 - All checks passed"
    echo "  1 - Some issues detected"
    echo "  2 - Critical issues detected"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Check localhost setup"
    echo "  DOMAIN=example.com $0                # Check production setup"
    echo "  GHOST_PORT=2369 DEMO_PORT=3001 $0   # Check custom ports"
    exit 0
fi

# Run main function
main "$@"