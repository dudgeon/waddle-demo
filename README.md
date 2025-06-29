# Waddle Demo

A full-stack demo for blended agentic tool calling and human in the loop interactions, featuring an Express.js backend with OpenAI Agents SDK and a React frontend with real-time streaming.

**🚀 Live Demo:** https://quiet-sound-684.fly.dev/

**📋 Frontend Component Reference:** [FRONTEND_COMPONENT_HIERARCHY.md](./FRONTEND_COMPONENT_HIERARCHY.md)

**🤖 Agent Architecture Guide:** [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md)

## Overview

This project demonstrates advanced AI agent workflows using a modern full-stack architecture:

**Backend (Express.js + OpenAI Agents SDK)**:
- **Express.js API server** with TypeScript
- **OpenAI Agents SDK integration** with multi-agent architecture
- **Server-Sent Events (SSE)** for real-time streaming
- **Dynamic agent registry** with context injection and tool loading
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
│   │   ├── agents/              # Agent definitions and registry
│   │   │   ├── index.ts         # Agent registry and discovery
│   │   │   ├── types.ts         # Agent interfaces and types
│   │   │   └── triage-agent.ts  # Triage agent implementation
│   │   ├── lib/
│   │   │   ├── multi-agent-manager.ts  # Multi-agent lifecycle
│   │   │   └── loadTools.ts     # Tool loading and registry
│   │   ├── routes/
│   │   │   └── multi-agent-chat.ts  # Multi-agent API endpoints
│   │   ├── types/
│   │   │   └── agent.ts         # Core type definitions
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

## Deployment

This application is deployed on **Fly.io** with auto-scaling and HTTPS enabled.

**Live URL:** https://quiet-sound-684.fly.dev/

### Deployment Architecture

- **Platform**: Fly.io with multi-region support
- **Auto-scaling**: Machines stop when idle, start on demand
- **HTTPS**: Force HTTPS with automatic SSL certificates
- **Build**: Multi-stage Docker build for optimal image size
- **Environment**: Production environment variables configured as secrets

### Deployment Files

- `Dockerfile`: Multi-stage build configuration
- `fly.toml`: Fly.io application configuration
- Environment variables stored as Fly.io secrets

## Quick Start

### Local Development

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
- **Multi-agent architecture** with dynamic agent registry
- **Context-aware agents** with session and user data injection
- **Tool integration** ready with extensible tool loading system
- **Streaming responses** for real-time interaction
- **Error recovery** with automatic retry and fallback handling
- **Configurable models** via environment variables

For detailed agent architecture and development guides, see [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md).

## Environment Variables

Create a `.env` file in the **project root** (not in server/):

```bash
# Required: OpenAI API key
OPENAI_API_KEY=sk-your-api-key-here

# Optional: Custom model (defaults to gpt-4o-mini)
AGENT_MODEL=gpt-4o

# Optional: Specific agent model override
TRIAGE_AGENT_MODEL=gpt-4o

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

# Production builds
npm run build            # Build both frontend and backend
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only
npm run start            # Start production server

# Backend utilities
cd server
npm run dev-clean        # Kill orphaned processes
npm run build            # Build backend for production
npm run start            # Start production backend

# Frontend utilities
npm run preview          # Preview production build
```

### Fly.io Deployment Commands

```bash
# Install Fly.io CLI (macOS)
curl -L https://fly.io/install.sh | sh

# Deploy to Fly.io
flyctl deploy --remote-only

# Check app status
flyctl status

# View logs
flyctl logs

# Open deployed app
flyctl open
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

### Deployment & Infrastructure
- **Platform**: Fly.io with global deployment
- **Containerization**: Multi-stage Docker builds
- **Scaling**: Auto-scaling machines (stop on idle, start on demand)
- **SSL/TLS**: Automatic HTTPS with force redirect
- **Environment**: Production secrets management

### Development Tools
- **TypeScript**: Strict mode with comprehensive type checking
- **Process Management**: tsx for TypeScript execution, concurrently for multi-server dev
- **Hot Reload**: Vite frontend HMR, tsx watch for backend
- **Process Cleanup**: Custom dev-clean scripts for port conflict resolution
- **Deployment**: Fly.io CLI with remote builds

## Use Cases

This demo showcases patterns for:

1. **Real-time Customer Support**: Streaming agent responses with conversation context
2. **Full-stack AI Applications**: Express backend with React frontend integration
3. **Production-ready Architecture**: Health monitoring, graceful shutdown, error recovery
4. **Development Workflow**: Hot reload, process management, environment configuration
5. **API Design**: RESTful endpoints with streaming and non-streaming variants

## Frontend Development

### Component Structure
See [FRONTEND_COMPONENT_HIERARCHY.md](./FRONTEND_COMPONENT_HIERARCHY.md) for a complete visual guide to all frontend components and their IDs. This document includes:

- Visual tree structure of all DOM elements
- Three-panel layout documentation (customer/runtime/agent)  
- ID naming conventions and quick reference table
- ASCII layout diagrams for easy reference

### Making UI Changes
All major DOM elements have descriptive IDs (e.g., `#customer-send-button`, `#flow-steps-container`) making it easy to reference specific components when requesting modifications.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Resources
- **Adding new agents**: See the [Creating New Agents](./AGENT_ARCHITECTURE.md#creating-new-agents) guide
- **Adding new tools**: See the [Creating New Tools](./AGENT_ARCHITECTURE.md#creating-new-tools) guide
- **Frontend components**: See [FRONTEND_COMPONENT_HIERARCHY.md](./FRONTEND_COMPONENT_HIERARCHY.md)
- **Architecture overview**: See [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md)

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
