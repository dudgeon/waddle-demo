# Waddle Demo

A full-stack demo for blended agentic tool calling and human in the loop interactions, featuring an Express.js backend with OpenAI Agents SDK and a React frontend with real-time streaming.

## Overview

This project demonstrates advanced AI agent workflows using a modern full-stack architecture:

**Backend (Express.js + OpenAI Agents SDK)**:
- **Express.js API server** with TypeScript
- **OpenAI Agents SDK integration** for AI agent management
- **Server-Sent Events (SSE)** for real-time streaming
- **Singleton agent management** with retry logic and graceful shutdown
- **Health monitoring** and self-test endpoints

**Frontend (React + TypeScript)**:
- **Real-time chat interface** with EventSource streaming
- **Environment-aware API client** with retry logic and health checks
- **Modern UI** with responsive design and error handling
- **Hot module replacement** for fast development

## Project Structure

```
waddle-demo/
├── server/                       # Express.js backend
│   ├── src/
│   │   ├── config/
│   │   │   └── persona.ts       # Agent configuration and persona
│   │   ├── lib/
│   │   │   ├── agent.ts         # Agent manager with OpenAI SDK
│   │   │   └── loadTools.ts     # Tool loading utilities
│   │   ├── routes/
│   │   │   └── chat.ts          # Chat API endpoints (GET/POST)
│   │   ├── types/
│   │   │   └── agent.ts         # TypeScript type definitions
│   │   └── index.ts             # Express server entry point
│   ├── package.json             # Backend dependencies
│   └── tsconfig.json            # Backend TypeScript config
├── src/                          # React/TypeScript frontend
│   ├── components/
│   │   └── BlogPage.tsx         # Main blog page component
│   ├── constants/
│   │   └── flowSteps.ts         # Workflow step definitions
│   ├── types/
│   │   └── index.ts             # Frontend type definitions
│   └── utils/
│       ├── api.ts               # API client with environment detection
│       ├── streamingService.ts  # EventSource streaming service
│       └── styleHelpers.ts      # Styling utilities
├── chat-service-demo.tsx        # Main chat interface component
├── package.json                 # Frontend dependencies and scripts
└── .env                         # Environment variables (project root)
```

## Quick Start

### Full-Stack Development

1. **Install dependencies**:
   ```bash
   npm install          # Frontend dependencies
   cd server && npm install && cd ..  # Backend dependencies
   ```

2. **Set up environment**:
   ```bash
   # Create .env file in project root
   echo "OPENAI_API_KEY=sk-your-api-key-here" > .env
   ```

3. **Start both frontend and backend**:
   ```bash
   npm run dev          # Starts both servers concurrently
   ```

4. **View the demo**:
   - Frontend: http://localhost:5174
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/health

### Individual Component Development

#### Backend Only
```bash
cd server
npm install
npm run dev          # Starts Express server on port 3001
```

#### Frontend Only
```bash
npm install
npm run dev:frontend # Starts Vite dev server on port 5174
```

## API Endpoints

### Backend Server (port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check endpoint |
| `GET` | `/api/chat/test` | Agent self-test endpoint |
| `GET` | `/api/chat?message=...&stream=true` | EventSource streaming chat |
| `POST` | `/api/chat` | JSON chat API (streaming and non-streaming) |

### Example API Usage

```bash
# Health check
curl http://localhost:3001/health

# Agent self-test
curl http://localhost:3001/api/chat/test

# Non-streaming chat
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "sessionId": "test", "stream": false}'

# Streaming chat
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "Hello", "sessionId": "test", "stream": true}' \
  --no-buffer
```

## Features

### Backend Features
- **Express.js API server** with TypeScript and comprehensive error handling
- **OpenAI Agents SDK integration** with singleton pattern and retry logic
- **Dual streaming support**: Server-Sent Events (GET) and JSON streaming (POST)
- **Environment variable management** with dotenv configuration
- **Graceful shutdown** with proper cleanup and signal handling
- **Health monitoring** with self-test capabilities
- **Process management** with cleanup scripts for development

### Frontend Features
- **Real-time streaming chat** with EventSource and automatic reconnection
- **Environment-aware API client** with base URL detection and health checks
- **Comprehensive error handling** with retry logic and exponential backoff
- **Responsive design** with mobile warning overlay
- **Modern UI** with Tailwind CSS styling and loading states
- **Hot module replacement** with Vite for fast development

### Agent Capabilities
- **Customer service persona** with specialized knowledge
- **Streaming responses** for real-time interaction
- **Session management** with conversation context
- **Error recovery** with automatic retry and fallback handling
- **Configurable models** via environment variables

## Environment Variables

Create a `.env` file in the **project root** (not in server/):

```bash
# Required: OpenAI API key
OPENAI_API_KEY=sk-your-api-key-here

# Optional: Custom model (defaults to gpt-4o-mini)
AGENT_MODEL=gpt-4o

# Optional: Frontend API URL override (auto-detected in development)
VITE_API_URL=http://localhost:3001
```

## Development

### Development Scripts

```bash
# Full-stack development (recommended)
npm run dev              # Starts both frontend and backend

# Individual components
npm run dev:frontend     # Frontend only (port 5174)
npm run dev:backend      # Backend only (port 3001)

# Backend utilities
cd server
npm run dev-clean        # Kill orphaned processes
npm run build            # Build backend for production
npm run start            # Start production backend

# Frontend utilities
npm run build            # Build frontend for production
npm run preview          # Preview production build
```

### Development Workflow

1. **Start development**: `npm run dev` (runs both servers)
2. **Make changes**: Edit files with hot reload
3. **Test streaming**: Use the chat interface at http://localhost:5174
4. **Debug backend**: Check logs in terminal or visit health endpoints
5. **Clean restart**: Use `npm run dev-clean` in server/ if needed

## Key Technologies

### Backend Stack
- **Runtime**: Node.js 22+ with TypeScript
- **Framework**: Express.js with async/await patterns
- **AI/ML**: OpenAI Agents SDK (TypeScript), GPT-4o-mini
- **Streaming**: Server-Sent Events (SSE) and JSON streaming
- **Configuration**: dotenv, path resolution, graceful shutdown

### Frontend Stack
- **Framework**: React 18 with TypeScript and hooks
- **Build Tool**: Vite with hot module replacement
- **Styling**: Tailwind CSS with responsive design
- **HTTP Client**: Custom API client with EventSource streaming
- **State Management**: React hooks with error boundaries

### Development Tools
- **TypeScript**: Strict mode with comprehensive type checking
- **Process Management**: tsx for TypeScript execution, concurrently for multi-server dev
- **Hot Reload**: Vite frontend HMR, tsx watch for backend
- **Process Cleanup**: Custom dev-clean scripts for port conflict resolution

## Use Cases

This demo showcases patterns for:

1. **Real-time Customer Support**: Streaming agent responses with conversation context
2. **Full-stack AI Applications**: Express backend with React frontend integration
3. **Production-ready Architecture**: Health monitoring, graceful shutdown, error recovery
4. **Development Workflow**: Hot reload, process management, environment configuration
5. **API Design**: RESTful endpoints with streaming and non-streaming variants

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **OpenAI API Key**: Ensure your API key is set correctly
2. **Node.js Version**: Requires Node.js 22 or higher
3. **Dependencies**: Try deleting `node_modules` and running `npm install`
4. **Port Conflicts**: Vite will automatically find an available port

### Backend Development Issues

#### Port Conflicts (EADDRINUSE)
If you encounter "Port 3001 is already in use" errors:

```bash
# Clean up orphaned processes
cd server
npm run dev-clean

# Or manually kill processes
lsof -ti:3001 | xargs kill -9

# Check for running processes
lsof -i:3001
```

#### Environment Variables Not Loading
If the server can't find `OPENAI_API_KEY`:

1. **Check .env file location**: Ensure `.env` is in the project root (not in `server/`)
2. **Verify .env contents**:
   ```bash
   cat .env
   # Should show: OPENAI_API_KEY=sk-...
   ```
3. **Check dotenv configuration**: The server loads `.env` from project root via `dotenv.config({ path: path.join(__dirname, '../../.env') })`

#### Agent Initialization Failures
If the agent fails to initialize:

1. **Test the self-test endpoint**:
   ```bash
   curl http://localhost:3001/api/chat/test
   ```
2. **Check API key format**: Should start with `sk-proj-` or `sk-`
3. **Verify model availability**: Default is `gpt-4o-mini`, override with `AGENT_MODEL` env var
4. **Check server logs**: Look for detailed error messages in console

#### Streaming Issues
If Server-Sent Events (SSE) don't work:

1. **Test non-streaming first**:
   ```bash
   curl -X POST http://localhost:3001/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "test", "sessionId": "test", "stream": false}'
   ```
2. **Test streaming**:
   ```bash
   curl -X POST http://localhost:3001/api/chat \
     -H "Content-Type: application/json" \
     -H "Accept: text/event-stream" \
     -d '{"message": "test", "sessionId": "test", "stream": true}' \
     --no-buffer
   ```

#### Development Workflow
For clean development restarts:

```bash
# Backend
cd server
npm run dev-clean  # Kill orphaned processes
npm run dev        # Start with clean slate

# Frontend (separate terminal)
cd ..
npm run dev
```

#### Health Checks
Monitor backend health:

```bash
# Basic health check
curl http://localhost:3001/health

# Agent self-test
curl http://localhost:3001/api/chat/test
```

## License

This project is open source. Check individual dependencies for their respective licenses.

## Acknowledgments

- [OpenAI](https://openai.com/) for the Agents SDK
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) teams
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Zod](https://zod.dev/) for schema validation
