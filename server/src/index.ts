import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

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
    ? ['https://your-railway-domain.railway.app'] // Will be updated with actual domain
    : ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server and other local ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
import chatRoutes from './routes/chat';
app.use('/api', chatRoutes);

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

// Enhanced server startup with port conflict handling
const startServer = async () => {
  try {
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

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