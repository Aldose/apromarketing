#!/bin/bash

# Deploy nginx configuration for apromarketing.com
# This script safely updates the nginx configuration with critical SSE support

set -e  # Exit on any error

echo "🔧 Deploying nginx configuration for apromarketing.com..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration paths
NGINX_SITES_DIR="/etc/nginx/sites-available"
CONFIG_NAME="apromarketing.com"
BACKUP_SUFFIX="backup-$(date +%Y%m%d-%H%M%S)"
NEW_CONFIG="./nginx-config-updated.conf"

echo -e "${YELLOW}📋 Pre-deployment checklist:${NC}"
echo "✓ New configuration includes critical SSE support for /demo routes"
echo "✓ Added caching for static assets and API routes"
echo "✓ Added SEO optimizations for blog and sitemap"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
    exit 1
fi

# Check if new config file exists
if [ ! -f "$NEW_CONFIG" ]; then
    echo -e "${RED}❌ New config file not found: $NEW_CONFIG${NC}"
    exit 1
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ nginx is not installed${NC}"
    exit 1
fi

# Backup current configuration
echo -e "${YELLOW}📦 Creating backup of current configuration...${NC}"
if [ -f "$NGINX_SITES_DIR/$CONFIG_NAME" ]; then
    cp "$NGINX_SITES_DIR/$CONFIG_NAME" "$NGINX_SITES_DIR/$CONFIG_NAME.$BACKUP_SUFFIX"
    echo -e "${GREEN}✓ Backup created: $CONFIG_NAME.$BACKUP_SUFFIX${NC}"
else
    echo -e "${YELLOW}⚠️  No existing configuration found${NC}"
fi

# Copy new configuration
echo -e "${YELLOW}📝 Installing new configuration...${NC}"
cp "$NEW_CONFIG" "$NGINX_SITES_DIR/$CONFIG_NAME"
echo -e "${GREEN}✓ New configuration installed${NC}"

# Test nginx configuration
echo -e "${YELLOW}🧪 Testing nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ Configuration test passed${NC}"
else
    echo -e "${RED}❌ Configuration test failed!${NC}"
    echo -e "${YELLOW}🔄 Restoring backup...${NC}"

    if [ -f "$NGINX_SITES_DIR/$CONFIG_NAME.$BACKUP_SUFFIX" ]; then
        cp "$NGINX_SITES_DIR/$CONFIG_NAME.$BACKUP_SUFFIX" "$NGINX_SITES_DIR/$CONFIG_NAME"
        echo -e "${GREEN}✓ Backup restored${NC}"
    fi

    exit 1
fi

# Reload nginx
echo -e "${YELLOW}🔄 Reloading nginx...${NC}"
if systemctl reload nginx; then
    echo -e "${GREEN}✓ nginx reloaded successfully${NC}"
else
    echo -e "${RED}❌ Failed to reload nginx!${NC}"
    echo -e "${YELLOW}🔄 Restoring backup...${NC}"

    if [ -f "$NGINX_SITES_DIR/$CONFIG_NAME.$BACKUP_SUFFIX" ]; then
        cp "$NGINX_SITES_DIR/$CONFIG_NAME.$BACKUP_SUFFIX" "$NGINX_SITES_DIR/$CONFIG_NAME"
        systemctl reload nginx
        echo -e "${GREEN}✓ Backup restored and nginx reloaded${NC}"
    fi

    exit 1
fi

# Success message
echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Test the demo functionality at https://apromarketing.com"
echo "2. Verify the loading animations work smoothly (SSE should be working)"
echo "3. Check blog functionality and caching headers"
echo "4. Monitor nginx error logs: tail -f /var/log/nginx/error.log"
echo ""
echo -e "${YELLOW}🔍 Key improvements deployed:${NC}"
echo "• ✅ Critical SSE support for /demo and /demo-stream routes"
echo "• ✅ Static asset caching (1 year expiry)"
echo "• ✅ Ghost API route optimization with 5-minute caching"
echo "• ✅ Blog/tag page caching for SEO performance"
echo "• ✅ SEO file handling (robots.txt, sitemap.xml)"
echo ""
echo -e "${GREEN}Configuration backup saved as: $CONFIG_NAME.$BACKUP_SUFFIX${NC}"
echo -e "${YELLOW}To rollback if needed: sudo cp $NGINX_SITES_DIR/$CONFIG_NAME.$BACKUP_SUFFIX $NGINX_SITES_DIR/$CONFIG_NAME && sudo systemctl reload nginx${NC}"