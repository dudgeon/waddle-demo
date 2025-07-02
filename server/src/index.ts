import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration for frontend-backend communication
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://quiet-sound-684.fly.dev'] // Fly.io domain
    : ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server and other local ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check endpoint
app.get('/health', (_req, res) => {
  console.log('[Health] Health check requested');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple test endpoint
app.get('/test', (_req, res) => {
  console.log('[Test] Test endpoint requested');
  res.json({ message: 'Server is responding' });
});

// Check critical environment variables
console.log('[Server] Checking environment variables...');
const requiredEnvVars = ['OPENAI_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('💡 Check your .env file');
  process.exit(1);
}
console.log('[Server] Environment variables OK');

// API routes - Multi-agent system
console.log('[Server] Loading routes...');
import multiAgentChatRoutes from './routes/multi-agent-chat.js';
console.log('[Server] Routes imported successfully');
app.use('/api', multiAgentChatRoutes);
console.log('[Server] Routes registered successfully');

// Serve static files from built frontend (production only)
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../../dist');
  app.use(express.static(staticPath));
  
  // Fallback to index.html for SPA routing
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(staticPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
}

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Global error handlers for debugging
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('❌ This may be causing silent server crashes');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('❌ Server will exit');
  process.exit(1);
});

process.on('exit', (code) => {
  console.log(`[Process] Process exiting with code: ${code}`);
});

process.on('SIGTERM', () => {
  console.log('[Process] Received SIGTERM');
});

process.on('SIGINT', () => {
  console.log('[Process] Received SIGINT');
});

// Enhanced server startup with error handling
const startServer = async () => {
  try {
    console.log('[Server] About to call app.listen()...');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🎉 [Server] Listen callback reached - server is actually listening!');
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 Also try: http://127.0.0.1:${PORT}/health`);
      
      // Immediately test server connectivity
      setTimeout(() => {
        console.log('[Server] Testing internal connectivity...');
        fetch(`http://127.0.0.1:${PORT}/health`)
          .then(res => res.json())
          .then(data => console.log('[Server] ✅ Internal health check succeeded:', data))
          .catch(err => console.error('[Server] ❌ Internal health check failed:', err.message));
      }, 100);
    });
    
    console.log('[Server] app.listen() call completed, waiting for callback...');

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        console.error('💡 Try running: npm run dev-clean');
        console.error('💡 Or check for other processes: lsof -ti:3001');
        process.exit(1);
      } else {
        console.error('❌ Server failed to start:', error.message);
        process.exit(1);
      }
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer(); 