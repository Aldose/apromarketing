#!/bin/bash

# A-Pro Marketing Startup Script
# Starts both demo application and Ghost CMS for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEMO_PORT="${DEMO_PORT:-3000}"
GHOST_PORT="${GHOST_PORT:-2368}"
DEMO_DIR="${DEMO_DIR:-$(pwd)}"
GHOST_DIR="${GHOST_DIR:-$(pwd)/ghost}"

# PID files for tracking processes
DEMO_PID_FILE="/tmp/apromarketing-demo.pid"
GHOST_PID_FILE="/tmp/apromarketing-ghost.pid"

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

# Check if port is available
check_port() {
    local port="$1"
    local service="$2"

    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        error "Port $port is already in use (needed for $service)"
        error "Use 'netstat -tuln | grep :$port' to find what's using it"
        return 1
    fi
    log "Port $port is available for $service"
    return 0
}

# Start demo application
start_demo() {
    heading "Starting Demo Application"

    check_port "$DEMO_PORT" "Demo Application"

    if [[ ! -f "$DEMO_DIR/server/index.js" ]]; then
        error "Demo application not found at $DEMO_DIR/server/index.js"
        error "Are you in the correct directory?"
        return 1
    fi

    if [[ ! -f "$DEMO_DIR/package.json" ]]; then
        error "package.json not found. Installing dependencies..."
        cd "$DEMO_DIR"
        npm install
    fi

    log "Starting demo application on port $DEMO_PORT..."
    cd "$DEMO_DIR"

    # Set environment variables
    export PORT="$DEMO_PORT"
    export NODE_ENV="${NODE_ENV:-development}"

    # Start in background and save PID
    nohup node server/index.js > /tmp/demo-app.log 2>&1 &
    echo $! > "$DEMO_PID_FILE"

    sleep 2

    # Check if it's still running
    if kill -0 "$(cat $DEMO_PID_FILE)" 2>/dev/null; then
        log "Demo application started successfully (PID: $(cat $DEMO_PID_FILE))"
        log "Access at: http://localhost:$DEMO_PORT"
        log "Logs: tail -f /tmp/demo-app.log"
        return 0
    else
        error "Demo application failed to start"
        error "Check logs: cat /tmp/demo-app.log"
        return 1
    fi
}

# Start Ghost CMS
start_ghost() {
    heading "Starting Ghost CMS"

    check_port "$GHOST_PORT" "Ghost CMS"

    if [[ ! -d "$GHOST_DIR" ]]; then
        warn "Ghost directory not found at $GHOST_DIR"
        log "Would you like to create a new Ghost installation? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            setup_ghost_local
        else
            error "Ghost directory required. Run './install.sh' for full setup."
            return 1
        fi
    fi

    cd "$GHOST_DIR"

    # Check if Ghost CLI is installed
    if ! command -v ghost &> /dev/null; then
        error "Ghost CLI not found. Installing..."
        sudo npm install ghost-cli@latest -g
    fi

    log "Starting Ghost CMS on port $GHOST_PORT..."

    # Start Ghost in development mode
    ghost start --development --port "$GHOST_PORT" > /tmp/ghost.log 2>&1 &
    echo $! > "$GHOST_PID_FILE"

    sleep 5

    # Check if Ghost is responding
    if curl -s "http://localhost:$GHOST_PORT" > /dev/null 2>&1; then
        log "Ghost CMS started successfully"
        log "Access at: http://localhost:$GHOST_PORT"
        log "Admin at: http://localhost:$GHOST_PORT/ghost/"
        log "Logs: tail -f /tmp/ghost.log"
        return 0
    else
        error "Ghost CMS failed to start"
        error "Check logs: cat /tmp/ghost.log"
        return 1
    fi
}

# Setup local Ghost installation
setup_ghost_local() {
    heading "Setting up Ghost Locally"

    log "Creating Ghost directory: $GHOST_DIR"
    mkdir -p "$GHOST_DIR"
    cd "$GHOST_DIR"

    # Check if Ghost CLI is installed
    if ! command -v ghost &> /dev/null; then
        log "Installing Ghost CLI..."
        sudo npm install ghost-cli@latest -g
    fi

    log "Installing Ghost in development mode..."
    ghost install local --port "$GHOST_PORT"

    log "Ghost setup complete"
}

# Stop services
stop_services() {
    heading "Stopping Services"

    # Stop demo app
    if [[ -f "$DEMO_PID_FILE" ]]; then
        local demo_pid
        demo_pid=$(cat "$DEMO_PID_FILE")
        if kill -0 "$demo_pid" 2>/dev/null; then
            log "Stopping demo application (PID: $demo_pid)..."
            kill "$demo_pid"
            rm -f "$DEMO_PID_FILE"
        else
            warn "Demo application PID file found but process not running"
            rm -f "$DEMO_PID_FILE"
        fi
    else
        log "Demo application not running"
    fi

    # Stop Ghost
    if [[ -f "$GHOST_PID_FILE" ]]; then
        local ghost_pid
        ghost_pid=$(cat "$GHOST_PID_FILE")
        if kill -0 "$ghost_pid" 2>/dev/null; then
            log "Stopping Ghost CMS (PID: $ghost_pid)..."
            kill "$ghost_pid"
            rm -f "$GHOST_PID_FILE"
        else
            warn "Ghost PID file found but process not running"
            rm -f "$GHOST_PID_FILE"
        fi
    else
        # Try Ghost CLI stop
        if [[ -d "$GHOST_DIR" ]]; then
            cd "$GHOST_DIR"
            ghost stop 2>/dev/null || log "Ghost not running via CLI"
        fi
    fi

    log "All services stopped"
}

# Check status of services
check_status() {
    heading "Service Status"

    # Check demo app
    if [[ -f "$DEMO_PID_FILE" ]]; then
        local demo_pid
        demo_pid=$(cat "$DEMO_PID_FILE")
        if kill -0 "$demo_pid" 2>/dev/null; then
            log "Demo application: Running (PID: $demo_pid, Port: $DEMO_PORT)"
            log "  URL: http://localhost:$DEMO_PORT"
        else
            warn "Demo application: PID file exists but process not running"
            rm -f "$DEMO_PID_FILE"
        fi
    else
        warn "Demo application: Not running"
    fi

    # Check Ghost
    if [[ -f "$GHOST_PID_FILE" ]]; then
        local ghost_pid
        ghost_pid=$(cat "$GHOST_PID_FILE")
        if kill -0 "$ghost_pid" 2>/dev/null; then
            log "Ghost CMS: Running (PID: $ghost_pid, Port: $GHOST_PORT)"
            log "  URL: http://localhost:$GHOST_PORT"
            log "  Admin: http://localhost:$GHOST_PORT/ghost/"
        else
            warn "Ghost CMS: PID file exists but process not running"
            rm -f "$GHOST_PID_FILE"
        fi
    else
        if [[ -d "$GHOST_DIR" ]]; then
            cd "$GHOST_DIR"
            if ghost ls 2>/dev/null | grep -q "running"; then
                log "Ghost CMS: Running (via Ghost CLI)"
                log "  URL: http://localhost:$GHOST_PORT"
                log "  Admin: http://localhost:$GHOST_PORT/ghost/"
            else
                warn "Ghost CMS: Not running"
            fi
        else
            warn "Ghost CMS: Not installed"
        fi
    fi

    # Check ports
    echo ""
    log "Port Status:"
    if netstat -tuln 2>/dev/null | grep -q ":$DEMO_PORT "; then
        log "  Port $DEMO_PORT: In use (Demo App)"
    else
        warn "  Port $DEMO_PORT: Available"
    fi

    if netstat -tuln 2>/dev/null | grep -q ":$GHOST_PORT "; then
        log "  Port $GHOST_PORT: In use (Ghost CMS)"
    else
        warn "  Port $GHOST_PORT: Available"
    fi
}

# Show logs
show_logs() {
    local service="$1"

    case "$service" in
        "demo"|"app")
            if [[ -f "/tmp/demo-app.log" ]]; then
                echo "=== Demo Application Logs ==="
                tail -f /tmp/demo-app.log
            else
                error "Demo app log file not found"
            fi
            ;;
        "ghost"|"cms")
            if [[ -f "/tmp/ghost.log" ]]; then
                echo "=== Ghost CMS Logs ==="
                tail -f /tmp/ghost.log
            else
                error "Ghost log file not found"
            fi
            ;;
        *)
            error "Unknown service: $service"
            error "Use: demo, app, ghost, or cms"
            ;;
    esac
}

# Show help
show_help() {
    cat << EOF
A-Pro Marketing Startup Script

Usage: $0 <command> [options]

Commands:
  start         Start both demo app and Ghost CMS
  stop          Stop all services
  restart       Stop and start all services
  status        Show status of all services
  logs <service> Show logs for specific service (demo/ghost)

  start-demo    Start only demo application
  start-ghost   Start only Ghost CMS
  stop-demo     Stop only demo application
  stop-ghost    Stop only Ghost CMS

Environment Variables:
  DEMO_PORT     Demo application port (default: 3000)
  GHOST_PORT    Ghost CMS port (default: 2368)
  DEMO_DIR      Demo application directory (default: current)
  GHOST_DIR     Ghost installation directory (default: ./ghost)
  NODE_ENV      Node environment (default: development)

Examples:
  $0 start                    # Start both services
  $0 status                   # Check service status
  $0 logs demo               # Show demo app logs
  DEMO_PORT=3001 $0 start    # Start with custom port
  $0 stop                    # Stop all services

Log Files:
  Demo App: /tmp/demo-app.log
  Ghost CMS: /tmp/ghost.log
EOF
}

# Main command handler
case "${1:-start}" in
    start)
        start_demo
        start_ghost
        echo ""
        check_status
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        start_demo
        start_ghost
        echo ""
        check_status
        ;;
    status)
        check_status
        ;;
    logs)
        show_logs "$2"
        ;;
    start-demo)
        start_demo
        ;;
    start-ghost)
        start_ghost
        ;;
    stop-demo)
        if [[ -f "$DEMO_PID_FILE" ]]; then
            kill "$(cat "$DEMO_PID_FILE")" 2>/dev/null || true
            rm -f "$DEMO_PID_FILE"
            log "Demo application stopped"
        fi
        ;;
    stop-ghost)
        if [[ -f "$GHOST_PID_FILE" ]]; then
            kill "$(cat "$GHOST_PID_FILE")" 2>/dev/null || true
            rm -f "$GHOST_PID_FILE"
        fi
        if [[ -d "$GHOST_DIR" ]]; then
            cd "$GHOST_DIR" && ghost stop 2>/dev/null || true
        fi
        log "Ghost CMS stopped"
        ;;
    --help|-h|help)
        show_help
        ;;
    *)
        error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac