# A-Pro Marketing Demo Application

A comprehensive marketing analysis demo application built with Express.js, Vue.js, and Ghost CMS integration.

## 🚀 Quick Start

### Prerequisites

- **Bun** - JavaScript runtime and package manager
- **Node.js** - Required for Ghost CMS
- **MongoDB** - Database (optional for development)
- **nginx** - Web server for production deployment

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd apromarketing
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Starting the Application

#### Development Mode

**Option 1: Use the startup script (recommended)**
```bash
# Start both demo app and Ghost CMS
./startup.sh start

# Check status
./startup.sh status

# View logs
./startup.sh logs demo    # Demo app logs
./startup.sh logs ghost   # Ghost CMS logs

# Stop all services
./startup.sh stop
```

**Option 2: Manual startup**
```bash
# Start demo application (port 8888)
bun server/index.js

# Start Ghost CMS (port 2368) - in separate terminal
cd ghost
ghost start --development
```

#### Production Mode

1. **Deploy nginx configuration**:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/apromarketing.com
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **Start application**:
   ```bash
   NODE_ENV=production ./startup.sh start
   ```

## 🏗️ Architecture

### Application Structure
```
├── server/
│   ├── index.js              # Main Express server
│   ├── routes/               # API routes
│   ├── views/                # Pug templates
│   ├── models/               # Database models
│   └── middleware/           # Custom middleware
├── public/                   # Static assets
├── ghost/                    # Ghost CMS installation
├── nginx.conf               # nginx configuration
├── startup.sh              # Development startup script
└── package.json            # Dependencies
```

### Key Features

- **Real-time Demo**: Interactive website analysis with Server-Sent Events (SSE)
- **Blog Integration**: Ghost CMS for dynamic blog content
- **Multilingual**: i18n support for multiple languages
- **Responsive Design**: Mobile-first responsive layout
- **Performance Optimized**: Caching and optimization for production

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Application
PORT=8888
NODE_ENV=development
APP_URL=http://localhost:8888

# Ghost CMS
GHOST_URL=http://localhost:2368
GHOST_API_KEY=your_ghost_content_api_key

# Database
MONGO_URI=mongodb://localhost:27017/apromarketing

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
```

### Ghost CMS Setup

1. **Install Ghost CLI**:
   ```bash
   npm install ghost-cli@latest -g
   ```

2. **Set up Ghost locally**:
   ```bash
   mkdir ghost
   cd ghost
   ghost install local --port 2368
   ```

3. **Access Ghost admin**:
   - Navigate to `http://localhost:2368/ghost/`
   - Create admin account
   - Get Content API key from Settings → Integrations

## 🌐 API Endpoints

### Demo Routes
- `POST /demo` - Website analysis with SSE response
- `GET /demo-stream` - Alternative SSE endpoint

### Ghost Integration
- `GET /api/ghost-posts` - Fetch blog posts for demo panel
- `GET /api/ghost-post/:slug` - Fetch individual blog post
- `GET /blog/:slug` - Render blog article page
- `GET /tag/:slug` - Render tag archive page

### Utility Routes
- `GET /` - Homepage with demo
- `POST /newsletter-signup` - Newsletter subscription
- `GET /robots.txt` - SEO robots file
- `GET /sitemap.xml` - Generated sitemap

## 🎨 Frontend Features

### Demo Functionality
- **Fade-out Animation**: Demo button smoothly fades during analysis
- **Side-by-side Layout**: Loading panel and blog articles display together
- **Real-time Updates**: SSE streams for live progress updates
- **Interactive Blog Panel**: Click to expand articles

### Technologies Used
- **Vue.js 3**: Reactive frontend framework
- **Pug**: Template engine for server-side rendering
- **CSS3**: Modern styling with animations
- **Bootstrap**: Responsive grid system

## 📱 Development

### Available Scripts

```bash
# Development
./startup.sh start          # Start all services
./startup.sh status         # Check service status
./startup.sh restart        # Restart all services

# Individual services
./startup.sh start-demo     # Start only demo app
./startup.sh start-ghost    # Start only Ghost CMS
./startup.sh stop-demo      # Stop demo app
./startup.sh stop-ghost     # Stop Ghost CMS

# Logs
./startup.sh logs demo      # View demo app logs
./startup.sh logs ghost     # View Ghost CMS logs

# Help
./startup.sh --help         # Show all options
```

### Environment Variables for Development
```bash
# Custom ports
DEMO_PORT=3001 ./startup.sh start

# Different Ghost directory
GHOST_DIR=./my-ghost ./startup.sh start

# Development with specific environment
NODE_ENV=development ./startup.sh start
```

## 🚀 Production Deployment

### System Requirements
- Ubuntu/Debian server
- nginx web server
- Node.js and Bun runtime
- SSL certificates (Let's Encrypt recommended)

### Deployment Steps

1. **Clone and configure**:
   ```bash
   git clone <repository-url>
   cd apromarketing
   git checkout apro-33  # Use latest feature branch
   bun install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

3. **Deploy nginx configuration**:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/apromarketing.com
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Start application**:
   ```bash
   NODE_ENV=production ./startup.sh start
   ```

### nginx Configuration

The included `nginx.conf` provides:
- **SSE Support**: Critical for real-time demo functionality
- **Static Asset Caching**: 1-year expiry for performance
- **Ghost API Routing**: Proper proxying to Ghost CMS
- **SSL/HTTPS**: Ready for Let's Encrypt integration

### Production Monitoring

```bash
# Check application status
./startup.sh status

# Monitor logs
tail -f /tmp/demo-app.log
tail -f /tmp/ghost.log
sudo tail -f /var/log/nginx/error.log

# Process monitoring
ps aux | grep bun
ps aux | grep ghost
```

## 🔍 Troubleshooting

### Common Issues

**Demo not loading blog articles**:
- Check Ghost CMS is running: `./startup.sh status`
- Verify Ghost API key in `.env`
- Check Ghost URL configuration

**SSE streaming not working**:
- Ensure nginx configuration is deployed
- Check for `proxy_buffering off` in nginx
- Verify browser console for connection errors

**Port conflicts**:
- Check what's using ports: `netstat -tuln | grep :8888`
- Use custom ports: `DEMO_PORT=3001 ./startup.sh start`

### Log Locations
- **Demo App**: `/tmp/demo-app.log`
- **Ghost CMS**: `/tmp/ghost.log`
- **nginx**: `/var/log/nginx/error.log`

### Development Reset
```bash
# Complete reset
./startup.sh stop
rm -rf node_modules ghost
bun install
./startup.sh start
```

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test with `./startup.sh start`
4. Submit a pull request

## 📄 License

Copyright © A-Pro Marketing. All rights reserved.

---

## Support

For support or questions:
- Check logs: `./startup.sh logs demo`
- Review configuration: `./startup.sh status`
- Contact development team

**Made with ❤️ using Bun, Express.js, Vue.js, and Ghost CMS**