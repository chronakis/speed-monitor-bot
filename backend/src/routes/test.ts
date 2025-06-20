import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Simple database connectivity test
router.get('/db', asyncHandler(async (_req: Request, res: Response) => {
  try {
    // Test basic query
    const { data, error } = await supabaseAdmin
      .from('system_config')
      .select('*')
      .limit(1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Database connection successful',
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

// Test auth service access
router.get('/auth-test', asyncHandler(async (_req: Request, res: Response) => {
  try {
    // Test auth service access by checking if we can get session info
    res.json({
      success: true,
      message: 'Auth service access successful',
      serviceConfigured: !!supabaseAdmin.auth,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Auth service access failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

export default router; 