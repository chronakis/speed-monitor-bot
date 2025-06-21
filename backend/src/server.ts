import app from './app';
import { supabase } from './config/supabase';
import { configService } from './services/configService';

const PORT = process.env.PORT || 3001;

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Initialize system configuration and test Supabase connection
  await initializeServices();
});

async function initializeServices() {
  try {
    // Test Supabase connection first
    const { error } = await supabase
      .from('system_config')
      .select('config_key')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return;
    } else {
      console.log('✅ Supabase connected successfully');
    }

    // Initialize system configuration
    await configService.initializeSystemConfig();
    
  } catch (err) {
    console.error('❌ Service initialization error:', err);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app; 