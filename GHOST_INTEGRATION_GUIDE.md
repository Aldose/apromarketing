# Ghost CMS Integration Guide

Complete guide for integrating Ghost CMS with A-Pro Marketing's demo form functionality.

## Overview

This integration provides:
- **Ghost CMS** for blog content management
- **Injectable demo form** that appears on all Ghost pages
- **Secure API endpoints** with origin authentication and rate limiting
- **Real-time analysis results** via Server-Sent Events (SSE)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ghost CMS     │    │ Bun/Express API │    │   AI Service    │
│   Port 2368     │    │   Port 8888     │    │   Port 8000     │
│                 │    │                 │    │                 │
│  • Blog Content │    │  • Demo API     │    │  • Analysis     │
│  • Admin Panel  │    │  • Ghost API    │    │  • Processing   │
│  • Content API  │────│  • Security     │────│  • Results      │
│  • Phase 2 Data│    │  • Rate Limiting│    │  • SSE Streams  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │    MongoDB      │
                       │   Port 27017    │
                       │                 │
                       │  • Newsletter   │
                       │  • User Data    │
                       │  • Demo Logs    │
                       └─────────────────┘
```

## Recent Updates (December 2025)

### Phase 2 UI Animation Implementation

A major enhancement was implemented to provide real-time blog content display during demo analysis:

**New Features:**
- **Phase 2 Animation**: Blog panel slides in from the right during demo processing
- **Real Ghost Data**: Fetches actual blog posts from Ghost CMS (no mocks)
- **Side-by-Side Layout**: Demo results and blog content displayed together
- **Responsive Positioning**: Panels adjust to viewport size with proper spacing

**Technical Implementation:**
```javascript
// New Ghost API endpoint in server/index.js
app.get('/api/ghost-posts', async (req, res) => {
  // Fetches 6 real blog posts for Phase 2 animation
  const apiKey = process.env.CONTENT_API_KEY || Bun.env.CONTENT_API_KEY;
  const response = await fetch(`http://localhost:2368/ghost/api/content/posts/?key=${apiKey}&limit=6`);
  // Returns formatted posts for frontend display
});
```

**CSS Layout:**
- Demo form section: 48% width with left positioning
- Blog panel: 45% width with 2% gap spacing
- Absolute positioning with smooth slide-in animations
- Mobile-responsive breakpoints for different screen sizes

### Security Architecture Refactor

The demo API endpoints have been completely refactored for enhanced security:

**File Structure Changes:**
```
server/
├── index.js                    # Main server (demo routes removed)
├── data/                       # Static data files (pricing, etc.)
├── i18n/                       # Internationalization files
├── middleware/                 # Custom middleware
├── models/                     # Database models
├── public/                     # Static assets (CSS, images, etc.)
├── routes/
│   ├── demoRoute.js           # Original demo routes (legacy)
│   ├── demoRouteSecure.js     # New secure demo endpoints
│   ├── articleListRoute.js    # Article/blog related routes
│   └── authRoute.js           # Authentication routes
├── templates/                  # Email/document templates
├── views/                      # Pug template files
├── .env                       # Environment variables
├── package.json               # Dependencies and scripts
└── sitemapGen.js              # Sitemap generation utility
```

**Security Enhancements:**

1. **Origin Authentication**
   ```javascript
   const ALLOWED_ORIGINS = [
     'http://localhost:2368',    // Local Ghost development
     'https://blog.a-pro.ai',    // Production Ghost domain
     'https://a-pro.ai',         // Main site domain
     'http://localhost:8888',    // Development server
   ];
   ```

2. **Rate Limiting**
   - 10 requests per 5 minutes per IP address
   - In-memory store for development (Redis recommended for production)
   - Automatic cleanup of expired rate limit entries

3. **Input Validation**
   - URL format validation using Joi schema
   - Sanitization of user inputs
   - Error handling with security-focused messages

4. **Enhanced Logging**
   ```javascript
   console.log('✅ Demo access granted from origin: http://localhost:8888/');
   console.log('🚫 Demo access denied from origin: malicious-site.com');
   ```

**Migration Notes:**
- All demo endpoints moved from `server/index.js` to `server/routes/demoRouteSecure.js`
- 119 lines of demo code refactored with security middleware
- Ghost API integration added for Phase 2 animations
- Backward compatibility maintained for existing frontend code

**Environment Variables Required:**
```bash
# server/.env file
APP_URL=http://localhost:8888
MONGO_URI=mongodb://localhost:27017/apromarketing_test
NODE_ENV=development

# Root .env file (for Ghost API keys)
CONTENT_API_KEY=your_ghost_content_api_key
ADMIN_API_KEY=your_ghost_admin_api_key
```

**API Endpoints:**
```
GET  /demo-stream?url=<website_url>  # Secure SSE endpoint with origin validation
POST /demo                           # Alternative demo endpoint for POST requests
GET  /api/ghost-posts               # Ghost CMS blog posts for Phase 2 animation
```

## Quick Start

### Development Setup

1. **Prerequisites**
   ```bash
   # Install Bun (if not installed)
   curl -fsSL https://bun.sh/install | bash

   # Install Ghost CLI globally
   npm install -g ghost-cli

   # Clone and setup project
   cd /path/to/apromarketing
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment files
   cp .env.example .env  # Root directory for Ghost API keys
   cp server/.env.example server/.env  # Server config

   # Edit .env files with your values
   # Root .env: Add Ghost API keys
   # server/.env: Update MongoDB URI, APP_URL
   ```

3. **Start Development Services**
   ```bash
   # Option 1: Use automation script
   ./scripts/start-dev.sh

   # Option 2: Manual startup
   cd server && bun install && bun run dev  # Start Express API (port 8888)
   ghost start --development                # Start Ghost (port 2368)
   # AI service should be running on port 8000
   ```

   The start-dev script will:
   - Check prerequisites (Bun, Ghost CLI)
   - Install dependencies
   - Set up Ghost CMS if needed
   - Start all three services
   - Monitor logs in real-time

4. **Access Services**
   - Ghost Admin: http://localhost:2368/ghost
   - Ghost Site: http://localhost:2368
   - Express API: http://localhost:8888
   - Demo Health Check: http://localhost:8888/demo/health

5. **Configure Ghost Code Injection**
   - Open Ghost Admin Panel
   - Go to Settings > Code injection
   - Copy contents from `ghost-assets/ghost-header-injection.html`
   - Paste into **Site Header** field
   - Update `apiBaseUrl` to `http://localhost:8888`
   - Save changes

6. **Test Integration**
   - Visit any Ghost page (http://localhost:2368)
   - Demo form should appear after 2 seconds
   - Test with a website URL
   - Verify real-time progress updates
   - **Phase 2**: Blog panel slides in from right during analysis
   - Confirm Ghost blog posts display in side panel

**Note**: Phase 2 animations are currently implemented and working. Blog content is fetched from real Ghost CMS data (no mocks) as per AGENTS.md requirements.

### Production Deployment

1. **Deploy to Production Server**
   ```bash
   ./scripts/deploy-production.sh
   ```

   This script will:
   - Install system dependencies
   - Configure Ghost for production
   - Set up Express API server
   - Create PM2 process configuration
   - Configure Nginx reverse proxy

2. **Configure DNS**
   - Point `blog.apromarketing.com` to your server IP
   - Point `apromarketing.com` to your server IP

3. **Set up SSL**
   ```bash
   sudo certbot --nginx -d apromarketing.com -d www.apromarketing.com -d blog.apromarketing.com
   ```

4. **Update Production Settings**
   - Edit `server/.env.production` with your configuration
   - Update Ghost code injection with production API URL

## Component Details

### 1. Injectable Form Component

**Location**: `ghost-assets/injectable-demo-form.html`

Features:
- Self-contained HTML/CSS/JavaScript
- Responsive design
- Real-time progress tracking
- Error handling and recovery
- Keyboard shortcuts (ESC to close)

**Customization**:
- Modify styles in the `<style>` section
- Update form fields and validation
- Adjust display timing and behavior
- Change progress steps and messages

### 2. Ghost Code Injection

**Location**: `ghost-assets/ghost-header-injection.html`

Features:
- Compact ~15KB script
- Vanilla JavaScript (no dependencies)
- Auto-show with configurable timing
- Mobile-responsive
- Admin page exclusion

**Configuration Options**:
```javascript
const APRO_CONFIG = {
  apiBaseUrl: 'http://localhost:8888',  // API server URL
  autoShow: true,                       // Auto-show widget
  autoShowDelay: 2000,                  // Delay in milliseconds
  showOnScroll: false,                  // Show on scroll instead
  scrollThreshold: 100                  // Scroll trigger distance
};
```

### 3. Secure API Endpoints

**Location**: `server/routes/demoRouteSecure.js`

Security Features:
- **Origin Authentication**: Validates requests from allowed domains
- **Rate Limiting**: 10 requests per 5-minute window per IP
- **Input Validation**: URL format and blacklist validation
- **CORS Configuration**: Proper headers for Ghost integration
- **Error Handling**: Graceful error responses

**Endpoints**:
- `POST /demo` - Form submission with SSE response
- `GET /demo-stream` - Alternative SSE endpoint
- `GET /demo/health` - Service health check

### 4. Nginx Configuration

**Location**: `nginx-ghost-integrated.conf`

Features:
- **Multi-domain Support**: Separate domains for blog, main site, app
- **SSE Optimization**: Proper headers for Server-Sent Events
- **Static Content Caching**: Optimized Ghost asset delivery
- **SSL Ready**: HTTPS configuration templates included
- **CORS Headers**: Proper CORS for API access from Ghost

**Domains**:
- `blog.apromarketing.com` → Ghost CMS + Demo API access
- `apromarketing.com` → Express API Server
- `app.apromarketing.com` → Frontend App

## API Integration

### Request Flow

1. **User submits form** on Ghost page
2. **JavaScript validates** URL format
3. **SSE connection** opened to `/demo-stream?url=...`
4. **Origin validation** checks request source
5. **Rate limiting** applied per IP address
6. **Request forwarded** to AI service (port 8000)
7. **Real-time updates** streamed back to client
8. **Results displayed** in form widget

### Error Handling

- **Network errors**: Automatic retry with exponential backoff
- **Rate limiting**: User-friendly messages with retry timing
- **Invalid URLs**: Client and server-side validation
- **Service unavailable**: Graceful degradation with error messages

### Security Measures

- **Origin whitelisting**: Only Ghost domain can access API
- **Input sanitization**: URL validation and blacklisting
- **Rate limiting**: Prevents abuse and DoS attacks
- **CORS policies**: Restricted to necessary headers/methods

## Customization Guide

### Styling the Form Widget

```css
/* In ghost-header-injection.html */
#apro-demo-widget {
  /* Main widget styling */
  background: white;
  border: 3px solid #0fffad;
  border-radius: 15px;
  /* ... */
}

/* Button hover effects */
#apro-submit-btn:hover {
  background: #00e6a0;
  transform: translateY(-1px);
}
```

### Modifying Form Behavior

```javascript
// Widget display settings
const APRO_CONFIG = {
  autoShow: true,           // Show automatically
  autoShowDelay: 2000,      // 2 second delay
  showOnScroll: false,      // Don't use scroll trigger
  scrollThreshold: 100      // Scroll distance if enabled
};

// Manual control
window.aproDemo.show()     // Show widget
window.aproDemo.hide()     // Hide widget
window.aproDemo.reset()    // Reset form
```

### Adding Custom Progress Steps

```javascript
// In the injectable form component
const CONFIG = {
  steps: [
    { key: 'init', icon: '🚀', text: 'Starting analysis...' },
    { key: 'custom', icon: '🔬', text: 'Custom analysis step...' },
    // Add your custom steps here
  ]
};
```

### Configuring API Origins

```javascript
// In server/routes/demoRouteSecure.js
const ALLOWED_ORIGINS = [
  'http://localhost:2368',     // Local Ghost
  'https://blog.a-pro.ai',     // Production Ghost
  'https://your-domain.com',   // Add your domain
];
```

## Monitoring and Maintenance

### Development Monitoring

```bash
# View real-time logs
tail -f logs/ghost.log logs/express.log

# Check service status
ps aux | grep -E "(ghost|bun)"

# Test API health
curl http://localhost:8888/demo/health
```

### Production Monitoring

```bash
# PM2 process management
pm2 status              # Check all services
pm2 logs               # View logs
pm2 restart all        # Restart services
pm2 monit              # Real-time monitoring

# Nginx status
sudo nginx -t          # Test configuration
sudo systemctl status nginx
```

### Performance Optimization

1. **Enable Caching**
   - Static content caching in Nginx
   - Ghost admin API caching
   - Express response caching for non-demo endpoints

2. **Monitor Resource Usage**
   - Ghost memory consumption
   - Express API response times
   - Database query performance

3. **SSL/HTTP2 Configuration**
   - Enable HTTP/2 for better performance
   - Optimize SSL settings
   - Use SSL session caching

## Troubleshooting

### Common Issues

**Widget Not Appearing**
- Check browser console for JavaScript errors
- Verify Ghost code injection is saved in Site Header
- Confirm API server is running and accessible
- Check for ad blockers or content blockers

**Form Submission Fails**
- Verify `apiBaseUrl` points to correct server
- Check CORS configuration in API server
- Test API endpoint directly: `curl http://localhost:8888/demo/health`
- Review server logs for error details

**SSE Connection Problems**
- Confirm EventSource is supported (modern browsers)
- Check proxy settings don't block SSE
- Verify nginx SSE configuration (`proxy_buffering off`)
- Test direct SSE connection

**Rate Limiting Issues**
- Check IP address in logs
- Adjust rate limits in `demoRouteSecure.js`
- Clear rate limit store by restarting API server
- Verify rate limit logic for your use case

### Debug Commands

```bash
# Test Ghost API
curl http://localhost:2368/ghost/api/v4/content/posts/

# Test Express API
curl http://localhost:8888/demo/health

# Test demo endpoint
curl -X POST http://localhost:8888/demo \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Check port usage
netstat -tulpn | grep -E "(2368|8888|8000)"

# Ghost status (in ghost directory)
cd ghost && ghost status
```

## Security Best Practices

1. **Keep Software Updated**
   - Update Ghost CMS regularly
   - Update Node.js and dependencies
   - Monitor security advisories

2. **Environment Configuration**
   - Use environment variables for secrets
   - Enable Ghost's built-in security headers
   - Configure proper SSL/TLS

3. **Access Control**
   - Restrict Ghost admin access
   - Use strong passwords/2FA
   - Monitor access logs

4. **API Security**
   - Implement additional authentication if needed
   - Monitor API usage patterns
   - Set up alerts for unusual activity

## Performance Benchmarks

Expected performance targets:

- **Ghost page load**: < 2 seconds
- **Demo form display**: < 1 second after trigger
- **API response time**: < 500ms for health check
- **Analysis completion**: 30-60 seconds (depends on AI service)
- **Memory usage**: Ghost ~200MB, Express ~100MB

Monitor these metrics and optimize as needed based on your traffic patterns and server resources.

## Support and Documentation

For additional help:

1. **Ghost Documentation**: https://ghost.org/docs/
2. **Express.js Guide**: https://expressjs.com/
3. **Server-Sent Events**: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
4. **Nginx Configuration**: https://nginx.org/en/docs/

Check the project's GitHub issues for common problems and solutions.