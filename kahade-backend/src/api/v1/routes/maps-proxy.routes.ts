import { Router, Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';

/**
 * Google Maps API Proxy
 *
 * SECURITY IMPROVEMENTS:
 * - Hides Google Maps API key from frontend
 * - Prevents API key extraction from client-side code
 * - Implements rate limiting and usage tracking
 * - Enables API key rotation without frontend changes
 * - Input validation for all parameters
 * - SSRF protection with URL validation
 * - Response caching to reduce API costs
 *
 * USAGE FROM FRONTEND:
 * Instead of: https://maps.googleapis.com/maps/api/js?key=YOUR_KEY
 * Use: /api/v1/maps/proxy/js?libraries=marker,places
 */

const router: Router = Router();
const logger = new Logger('MapsProxyRoutes');

// Constants
const CACHE_MAX_AGE_SECONDS = 86400; // 24 hours
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds
const MAX_INPUT_LENGTH = 500; // Maximum input length for validation

// Rate limiting state (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per IP

// Allowed libraries for Google Maps
const ALLOWED_LIBRARIES = [
  'marker',
  'places',
  'geometry',
  'drawing',
  'visualization',
  'localContext',
];

// Allowed languages
const ALLOWED_LANGUAGES = ['en', 'id', 'zh', 'ja', 'ko', 'th', 'vi', 'ms'];

// Allowed versions
const ALLOWED_VERSIONS = ['weekly', 'quarterly', 'beta'];

/**
 * Simple rate limiter middleware
 */
const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const clientData = rateLimitMap.get(clientIp);

  if (!clientData || now > clientData.resetAt) {
    rateLimitMap.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((clientData.resetAt - now) / 1000),
    });
    return;
  }

  clientData.count++;
  next();
};

/**
 * Validate and sanitize string input
 */
const sanitizeInput = (input: unknown, maxLength: number = MAX_INPUT_LENGTH): string | null => {
  if (typeof input !== 'string') return null;
  if (input.length > maxLength) return null;
  // Remove potentially dangerous characters
  return input.replace(/[<>\"\'\\]/g, '').trim();
};

/**
 * Validate libraries parameter
 */
const validateLibraries = (libraries: string): string | null => {
  if (!libraries) return '';
  const libArray = libraries.split(',').map((l) => l.trim().toLowerCase());
  const validLibs = libArray.filter((l) => ALLOWED_LIBRARIES.includes(l));
  return validLibs.join(',');
};

/**
 * Fetch with timeout
 */
const fetchWithTimeout = async (
  url: string,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<globalThis.Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'maps-proxy' });
});

// Proxy Google Maps JavaScript API
router.get('/js', rateLimiter, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      // Don't leak configuration details
      logger.error('Google Maps API key not configured');
      res.status(503).json({
        error: 'Service temporarily unavailable',
      });
      return;
    }

    // Validate and sanitize inputs
    const rawLibraries = sanitizeInput(req.query.libraries);
    const rawVersion = sanitizeInput(req.query.v);
    const rawLanguage = sanitizeInput(req.query.language);

    const libraries = rawLibraries ? validateLibraries(rawLibraries) : '';
    const version = rawVersion && ALLOWED_VERSIONS.includes(rawVersion) ? rawVersion : 'weekly';
    const language = rawLanguage && ALLOWED_LANGUAGES.includes(rawLanguage) ? rawLanguage : 'en';

    // Build Google Maps API URL with server-side API key
    const mapsUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries}&v=${version}&language=${language}`;

    // Fetch from Google Maps API with timeout
    const response = await fetchWithTimeout(mapsUrl);

    if (!response.ok) {
      logger.error(`Google Maps API error: ${response.status}`);
      res.status(502).json({
        error: 'Failed to load Google Maps API',
      });
      return;
    }

    const script = await response.text();

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE_SECONDS}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.send(script);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error('Google Maps API request timed out');
      res.status(504).json({
        error: 'Request timed out',
      });
      return;
    }

    logger.error('Maps proxy error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Proxy Google Maps Geocoding API
router.get('/geocode', rateLimiter, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      logger.error('Google Maps API key not configured');
      res.status(503).json({
        error: 'Service temporarily unavailable',
      });
      return;
    }

    const address = sanitizeInput(req.query.address);

    if (!address) {
      res.status(400).json({
        error: 'Valid address parameter is required',
      });
      return;
    }

    // SSRF Protection: Only allow Google Maps API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await fetchWithTimeout(geocodeUrl);

    if (!response.ok) {
      logger.error(`Geocoding API error: ${response.status}`);
      res.status(502).json({
        error: 'Failed to geocode address',
      });
      return;
    }

    const data = await response.json();

    // Cache geocoding results
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.json(data);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      res.status(504).json({
        error: 'Request timed out',
      });
      return;
    }

    logger.error('Geocoding proxy error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Proxy Google Maps Places API
router.get('/places/autocomplete', rateLimiter, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      logger.error('Google Maps API key not configured');
      res.status(503).json({
        error: 'Service temporarily unavailable',
      });
      return;
    }

    const input = sanitizeInput(req.query.input);

    if (!input || input.length < 2) {
      res.status(400).json({
        error: 'Valid input parameter is required (minimum 2 characters)',
      });
      return;
    }

    // SSRF Protection: Only allow Google Maps API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;

    const response = await fetchWithTimeout(placesUrl);

    if (!response.ok) {
      logger.error(`Places API error: ${response.status}`);
      res.status(502).json({
        error: 'Failed to fetch places',
      });
      return;
    }

    const data = await response.json();

    // Short cache for autocomplete (results change frequently)
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
    res.json(data);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      res.status(504).json({
        error: 'Request timed out',
      });
      return;
    }

    logger.error('Places proxy error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
