import { Router } from 'express';

/**
 * Google Maps API Proxy
 * 
 * SECURITY IMPROVEMENT:
 * - Hides Google Maps API key from frontend
 * - Prevents API key extraction from client-side code
 * - Allows backend to implement rate limiting and usage tracking
 * - Enables API key rotation without frontend changes
 * 
 * USAGE FROM FRONTEND:
 * Instead of: https://maps.googleapis.com/maps/api/js?key=YOUR_KEY
 * Use: /api/v1/maps/proxy/js?libraries=marker,places
 */

const router: import("express").Router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'maps-proxy' });
});

// Proxy Google Maps JavaScript API
router.get('/js', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        error: 'Google Maps API key not configured',
      });
    }

    // Build Google Maps API URL with server-side API key
    const libraries = req.query.libraries || '';
    const version = req.query.v || 'weekly';
    const language = req.query.language || 'en';
    
    const mapsUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries}&v=${version}&language=${language}`;

    // Fetch from Google Maps API
    const response = await fetch(mapsUrl);
    const script = await response.text();

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    res.send(script);
  } catch (error) {
    console.error('Maps proxy error:', error);
    res.status(500).json({
      error: 'Failed to load Google Maps API',
    });
  }
});

// Proxy Google Maps Geocoding API
router.get('/geocode', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        error: 'Google Maps API key not configured',
      });
    }

    const address = req.query.address as string;
    
    if (!address) {
      return res.status(400).json({
        error: 'Address parameter is required',
      });
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await fetch(geocodeUrl);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error('Geocoding proxy error:', error);
    res.status(500).json({
      error: 'Failed to geocode address',
    });
  }
});

// Proxy Google Maps Places API
router.get('/places/autocomplete', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        error: 'Google Maps API key not configured',
      });
    }

    const input = req.query.input as string;
    
    if (!input) {
      return res.status(400).json({
        error: 'Input parameter is required',
      });
    }

    const placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;

    const response = await fetch(placesUrl);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error('Places proxy error:', error);
    res.status(500).json({
      error: 'Failed to fetch places',
    });
  }
});

export default router;
