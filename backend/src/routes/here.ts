import { Router, Request, Response } from 'express';
import { configService } from '../services/configService';

const router = Router();

/**
 * Proxy for HERE Traffic API - keeps API key secure on backend
 * GET /api/here/flow?in=bbox:west,south,east,north&units=metric&responseattributes=sh&locationReferencing=tmc,shape
 */
router.get('/flow', async (req: Request, res: Response) => {
  try {
    // Get HERE API configuration
    const hereConfig = await configService.getHereApiConfig();
    
    if (!hereConfig.apiKey) {
      return res.status(500).json({
        error: 'HERE API key not configured on server'
      });
    }

    // Extract and validate query parameters
    const { in: bboxParam, units = 'imperial', responseattributes = 'sh', locationReferencing = 'tmc,shape' } = req.query;
    
    if (!bboxParam || typeof bboxParam !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameter: in (bounding box)'
      });
    }

    // Validate bbox format: bbox:west,south,east,north
    if (!bboxParam.startsWith('bbox:')) {
      return res.status(400).json({
        error: 'Invalid bbox format. Expected: bbox:west,south,east,north'
      });
    }

    const bboxCoords = bboxParam.replace('bbox:', '').split(',');
    if (bboxCoords.length !== 4 || bboxCoords.some(coord => isNaN(parseFloat(coord)))) {
      return res.status(400).json({
        error: 'Invalid bbox coordinates. Expected: bbox:west,south,east,north with numeric values'
      });
    }

    // Validate units
    if (units !== 'metric' && units !== 'imperial') {
      return res.status(400).json({
        error: 'Invalid units. Must be "metric" or "imperial"'
      });
    }

    // Build HERE API request URL
    const hereApiUrl = new URL('https://data.traffic.hereapi.com/v7/flow');
    hereApiUrl.searchParams.set('apikey', hereConfig.apiKey);
    hereApiUrl.searchParams.set('in', bboxParam);
    hereApiUrl.searchParams.set('units', units as string);
    hereApiUrl.searchParams.set('responseattributes', responseattributes as string);
    hereApiUrl.searchParams.set('locationReferencing', locationReferencing as string);

    console.log(`🚗 Fetching traffic data for bbox: ${bboxParam}, units: ${units}`);

    // Make request to HERE API
    const hereResponse = await fetch(hereApiUrl.toString());
    
    if (!hereResponse.ok) {
      const errorText = await hereResponse.text();
      console.error('HERE API Error:', hereResponse.status, errorText);
      
      let errorMessage = `HERE API Error: ${hereResponse.status} ${hereResponse.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error && errorData.error.description) {
          errorMessage = errorData.error.description;
        }
      } catch (parseError) {
        // Use default error message if JSON parsing fails
      }
      
      return res.status(hereResponse.status).json({
        error: errorMessage,
        details: errorText
      });
    }

    const trafficData = await hereResponse.json() as any;
    
    // Log success
    const resultCount = trafficData.results ? trafficData.results.length : 0;
    console.log(`✅ Successfully fetched ${resultCount} traffic flow results`);
    
    // Return the traffic data (API key is never exposed)
    return res.json(trafficData);

  } catch (error) {
    console.error('Error in HERE flow proxy:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching traffic data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get HERE API configuration info (without exposing the actual key)
 * GET /api/here/config
 */
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const hereConfig = await configService.getHereApiConfig();
    
    return res.json({
      hasApiKey: !!hereConfig.apiKey,
      dailyLimit: hereConfig.dailyLimit,
      hourlyLimit: hereConfig.hourlyLimit,
      perUserDailyLimit: hereConfig.perUserDailyLimit,
      initialBbox: hereConfig.initialBbox
    });
  } catch (error) {
    console.error('Error getting HERE config:', error);
    return res.status(500).json({
      error: 'Failed to get HERE API configuration'
    });
  }
});

/**
 * Health check for HERE API connectivity
 * GET /api/here/health
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const hereConfig = await configService.getHereApiConfig();
    
    if (!hereConfig.apiKey) {
      return res.status(503).json({
        status: 'error',
        message: 'HERE API key not configured'
      });
    }

    // Test with a minimal request to London area
    const testUrl = new URL('https://data.traffic.hereapi.com/v7/flow');
    testUrl.searchParams.set('apikey', hereConfig.apiKey);
    testUrl.searchParams.set('in', 'bbox:-0.1915,51.5003,-0.0739,51.5321'); // Small London area
    testUrl.searchParams.set('units', 'metric');
    testUrl.searchParams.set('responseattributes', 'sh');
    testUrl.searchParams.set('locationReferencing', 'tmc');

    const testResponse = await fetch(testUrl.toString());
    
    if (testResponse.ok) {
      return res.json({
        status: 'healthy',
        message: 'HERE API is accessible'
      });
    } else {
      return res.status(503).json({
        status: 'error',
        message: `HERE API returned ${testResponse.status}: ${testResponse.statusText}`
      });
    }
  } catch (error) {
    console.error('HERE API health check failed:', error);
    return res.status(503).json({
      status: 'error',
      message: 'HERE API health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 