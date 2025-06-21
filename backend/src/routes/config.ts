import { Router, Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { configService } from '../services/configService'

const router = Router()

// Get all system configuration (admin only for now)
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const configs = await configService.getAllConfigs()
    
    return res.json({
      success: true,
      data: configs,
      count: Object.keys(configs).length
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get system configuration'
    })
  }
}))

// Get a specific configuration value
router.get('/:key', asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params
  
  if (!key) {
    return res.status(400).json({
      success: false,
      message: 'Configuration key is required'
    })
  }
  
  try {
    const value = await configService.getConfig(key)
    
    if (value === null) {
      return res.status(404).json({
        success: false,
        message: `Configuration key '${key}' not found`
      })
    }
    
    return res.json({
      success: true,
      data: {
        key,
        value
      }
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get configuration value'
    })
  }
}))

// Update a configuration value (admin only - add proper auth later)
router.put('/:key', asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params
  const { value } = req.body
  
  if (!key) {
    return res.status(400).json({
      success: false,
      message: 'Configuration key is required'
    })
  }
  
  if (!value && value !== '') {
    return res.status(400).json({
      success: false,
      message: 'Value is required'
    })
  }
  
  try {
    await configService.updateConfig(key, value.toString())
    
    return res.json({
      success: true,
      message: `Configuration '${key}' updated successfully`,
      data: {
        key,
        value: value.toString()
      }
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update configuration'
    })
  }
}))

// Get HERE API configuration
router.get('/here/api', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const hereConfig = await configService.getHereApiConfig()
    
    // Don't expose the actual API key in responses
    const safeConfig = {
      ...hereConfig,
      apiKey: hereConfig.apiKey ? '***CONFIGURED***' : null
    }
    
    return res.json({
      success: true,
      data: safeConfig
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get HERE API configuration'
    })
  }
}))

// Check maintenance mode
router.get('/maintenance/status', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const isMaintenanceMode = await configService.isMaintenanceMode()
    
    return res.json({
      success: true,
      data: {
        maintenanceMode: isMaintenanceMode
      }
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to check maintenance status'
    })
  }
}))

// Refresh configuration cache
router.post('/refresh', asyncHandler(async (_req: Request, res: Response) => {
  try {
    await configService.refreshCache()
    
    return res.json({
      success: true,
      message: 'Configuration cache refreshed successfully'
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to refresh configuration cache'
    })
  }
}))

export default router 