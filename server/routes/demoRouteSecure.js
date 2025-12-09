import express from 'express';
const router = express.Router();

// AI-NOTES: Refactored demo routes with origin authentication and enhanced security

// Configuration for allowed origins
const ALLOWED_ORIGINS = [
  'http://localhost:2368',    // Local Ghost development
  'https://blog.a-pro.ai',    // Production Ghost domain
  'https://a-pro.ai',         // Main site domain
  'http://localhost:8888',    // Development server (for testing)
];

// Rate limiting configuration (in-memory store for demo)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_REQUESTS = 10; // Max requests per window per IP

// Middleware to check origin and implement security measures
const securityMiddleware = (req, res, next) => {
  const origin = req.get('Origin') || req.get('Referer');
  const userIP = req.ip || req.connection.remoteAddress;

  // Check if origin is allowed
  const isAllowedOrigin = ALLOWED_ORIGINS.some(allowedOrigin => {
    if (origin) {
      return origin.startsWith(allowedOrigin);
    }
    return false;
  });

  // Allow localhost in development
  const isLocalhost = origin && (
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.includes('0.0.0.0')
  );

  // Check environment
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (!isAllowedOrigin && !(isDevelopment && isLocalhost)) {
    console.log(`🚫 Demo access denied from origin: ${origin}`);
    return res.status(403).json({
      error: 'Access denied: Unauthorized origin',
      code: 'UNAUTHORIZED_ORIGIN'
    });
  }

  // Rate limiting check
  const now = Date.now();
  const userKey = userIP;

  if (!rateLimitStore.has(userKey)) {
    rateLimitStore.set(userKey, { count: 1, firstRequest: now });
  } else {
    const userData = rateLimitStore.get(userKey);

    // Reset if window has passed
    if (now - userData.firstRequest > RATE_LIMIT_WINDOW) {
      rateLimitStore.set(userKey, { count: 1, firstRequest: now });
    } else {
      userData.count++;

      if (userData.count > RATE_LIMIT_MAX_REQUESTS) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - userData.firstRequest)) / 1000)
        });
      }
    }
  }

  // Log successful access
  console.log(`✅ Demo access granted from origin: ${origin} (IP: ${userIP})`);

  next();
};

// Input validation middleware
const validateDemoInput = (req, res, next) => {
  const { url } = req.method === 'GET' ? req.query : req.body;

  if (!url) {
    return res.status(400).json({
      error: 'URL parameter is required',
      code: 'MISSING_URL'
    });
  }

  // Basic URL validation
  try {
    const urlObj = new URL(url);

    // Check for valid protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid protocol');
    }

    // Check for blacklisted domains (optional security measure)
    const blacklistedDomains = ['localhost', '127.0.0.1', '0.0.0.0', '10.', '192.168.', '172.'];
    const hostname = urlObj.hostname.toLowerCase();

    if (blacklistedDomains.some(blocked => hostname.includes(blocked))) {
      return res.status(400).json({
        error: 'Internal/private URLs are not allowed',
        code: 'INVALID_URL'
      });
    }

  } catch (error) {
    return res.status(400).json({
      error: 'Invalid URL format',
      code: 'INVALID_URL'
    });
  }

  next();
};

// POST /demo - For form submissions with SSE response
router.post('/demo', securityMiddleware, validateDemoInput, async (req, res) => {
  try {
    const { url } = req.body;

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': req.get('Origin') || '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({
      status: 'connected',
      message: 'Analysis starting...',
      step: 'init',
      progress: 0
    })}\n\n`);

    // Make request to the AI analysis service
    const response = await fetch('http://localhost:8000/demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ website: url })
    });

    if (!response.ok) {
      throw new Error(`Analysis service error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim()) {
              // Validate and sanitize the data before forwarding
              try {
                const parsedData = JSON.parse(data);
                res.write(`data: ${JSON.stringify(parsedData)}\n\n`);
              } catch (parseError) {
                console.error('Error parsing upstream data:', parseError);
                // Continue without forwarding malformed data
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Send completion signal
    res.write(`data: ${JSON.stringify({
      status: 'complete',
      message: 'Analysis finished successfully'
    })}\n\n`);

  } catch (error) {
    console.error('Demo endpoint error:', error);

    // Send error via SSE
    res.write(`data: ${JSON.stringify({
      error: 'Analysis service temporarily unavailable. Please try again later.',
      code: 'SERVICE_ERROR'
    })}\n\n`);
  } finally {
    res.end();
  }
});

// GET /demo-stream - Alternative SSE endpoint for URL parameter
router.get('/demo-stream', securityMiddleware, validateDemoInput, async (req, res) => {
  try {
    const { url } = req.query;

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': req.get('Origin') || '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no'
    });

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({
      status: 'connected',
      message: 'Analysis starting...',
      step: 'init',
      progress: 0
    })}\n\n`);

    // Make request to the AI analysis service
    const response = await fetch('http://localhost:8000/demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ website: url })
    });

    if (!response.ok) {
      throw new Error(`Analysis service error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim()) {
              try {
                const parsedData = JSON.parse(data);
                res.write(`data: ${JSON.stringify(parsedData)}\n\n`);
              } catch (parseError) {
                console.error('Error parsing upstream data:', parseError);
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

  } catch (error) {
    console.error('Demo stream endpoint error:', error);

    res.write(`data: ${JSON.stringify({
      error: 'Analysis service temporarily unavailable. Please try again later.',
      code: 'SERVICE_ERROR'
    })}\n\n`);
  } finally {
    res.end();
  }
});

// Health check endpoint for monitoring
router.get('/demo/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    rateLimitActive: rateLimitStore.size > 0
  });
});

// Cleanup rate limit store periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, userData] of rateLimitStore.entries()) {
    if (now - userData.firstRequest > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW); // Clean up every rate limit window

export default router;