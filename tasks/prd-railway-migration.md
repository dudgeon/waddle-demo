# Product Requirements Document: Railway Migration for Waddle Demo

## Introduction/Overview

The Waddle Demo project needs to migrate from Vercel Edge Functions to Railway with a standard Node.js backend. The primary driver for this migration is that the **OpenAI Agents SDK is incompatible with Vercel Edge Runtime**, which only supports Web APIs and not the full Node.js APIs required by the SDK. This migration will enable the demonstration of the OpenAI Agents SDK, which is the primary goal of the project.

**Problem Statement:** The current Vercel Edge Function architecture prevents the use of the OpenAI Agents SDK, resulting in 13+ failed deployments with "referencing unsupported modules" errors.

**Solution:** Migrate to Railway using Express.js backend with full Node.js runtime support while maintaining the existing Vite frontend.

## Goals

1. **Primary Goal:** Enable successful deployment and demonstration of the OpenAI Agents SDK
2. **Maintain Functionality:** Preserve all existing chat interface and streaming capabilities
3. **Simplify Development:** Create a straightforward development workflow with hot reload
4. **Cost Optimization:** Reduce hosting costs compared to Vercel's pricing model
5. **Future-Proof:** Build a foundation that can easily accommodate additional features

## User Stories

### Core User Stories
- **As a developer**, I want to demonstrate the OpenAI Agents SDK functionality so that I can showcase its capabilities
- **As a user**, I want to interact with the AI agent through a chat interface so that I can experience the agent's responses
- **As a user**, I want to see streaming responses in real-time so that I have immediate feedback during conversations
- **As a developer**, I want a simple development environment so that I can iterate quickly without complex setup

### Technical User Stories
- **As a developer**, I want the backend to run on standard Node.js so that I can use the full OpenAI Agents SDK
- **As a developer**, I want hot reload for both frontend and backend so that I can develop efficiently
- **As a deployment engineer**, I want a single-command deployment so that I can easily publish changes
- **As a developer**, I want clear separation between frontend and backend so that I can work on each independently

## Functional Requirements

### 1. Backend Server Architecture
1.1. **Express.js Server Setup**
   - Create a new `server/` directory with Express.js application
   - Implement TypeScript support with proper build configuration
   - Set up CORS handling for frontend-backend communication
   - Configure environment variable loading from `.env` file

1.2. **API Routes Implementation**
   - Create `/api/chat` endpoint that replaces the Vercel Edge Function
   - Implement Server-Sent Events (SSE) for streaming responses
   - Maintain the same request/response format as the current implementation
   - Handle OpenAI Agents SDK integration with proper error handling

1.3. **Agent Integration**
   - Port existing `src/lib/agent.ts` functionality to backend
   - Maintain agent persona configuration from environment variables
   - Preserve tool discovery system (currently empty but ready for future tools)
   - Implement proper agent lifecycle management

### 2. Frontend Modifications
2.1. **API Client Updates**
   - Update chat service to connect to Express backend instead of Vercel Edge Functions
   - Modify API base URL configuration for different environments (dev/production)
   - Maintain existing streaming response handling
   - Preserve all existing UI components and functionality

2.2. **Build Configuration**
   - Keep Vite for frontend build process
   - Configure static file serving from Express server
   - Set up proper environment variable handling for frontend

### 3. Development Environment
3.1. **Monorepo Structure**
   - Organize project as monorepo with frontend and backend
   - Create unified development scripts for running both services
   - Implement concurrent development server startup
   - Configure hot reload for both frontend and backend

3.2. **Development Scripts**
   - `npm run dev` - Start both frontend and backend in development mode
   - `npm run build` - Build both frontend and backend for production
   - `npm run start` - Start production server
   - Individual scripts for frontend-only and backend-only development

### 4. Deployment Configuration
4.1. **Railway Setup**
   - Create `railway.json` configuration file
   - Configure build and start commands for Railway
   - Set up environment variable management
   - Configure automatic deployments from Git

4.2. **Production Optimization**
   - Static file serving from Express for built frontend
   - Proper error handling and logging
   - Health check endpoints for Railway monitoring
   - Graceful shutdown handling

### 5. Streaming Implementation
5.1. **Server-Sent Events**
   - Implement SSE streaming for OpenAI Agents SDK responses
   - Maintain connection stability and error recovery
   - Handle client disconnections gracefully
   - Preserve existing streaming message format

### 6. Environment Configuration
6.1. **Environment Variables**
   - Port existing OpenAI API key configuration
   - Add Railway-specific environment variables
   - Configure different API URLs for development and production
   - Maintain agent persona configuration flexibility

## Non-Goals (Out of Scope)

1. **Database Integration** - Not required for this migration; focus on maintaining current functionality
2. **User Authentication** - Project has zero users and authentication is not needed for demo
3. **WebSocket Implementation** - SSE is sufficient for current needs; WebSocket can be added later
4. **Tool Implementation** - Focus on migration; tool development is separate task
5. **UI/UX Changes** - Maintain existing interface; only update API integration
6. **Performance Optimization** - Basic optimization only; detailed performance tuning is future work
7. **Monitoring/Analytics** - Basic logging only; comprehensive monitoring is future enhancement

## Technical Considerations

### Architecture Decisions
- **Express.js over Fastify**: Choose Express.js for simplicity and widespread familiarity
- **SSE over WebSockets**: Server-Sent Events are simpler and sufficient for one-way streaming
- **Monorepo Approach**: Keep frontend and backend together for simplicity in early stage
- **TypeScript**: Maintain TypeScript throughout for type safety and development experience

### Dependencies
- **Backend**: Express.js, @openai/agents, TypeScript, dotenv, cors
- **Frontend**: Keep existing Vite + React setup
- **Development**: Concurrently for running multiple services, nodemon for backend hot reload

### Migration Strategy
1. **Phase 1**: Create Express server with basic chat endpoint
2. **Phase 2**: Port agent integration from existing code
3. **Phase 3**: Update frontend to connect to new backend
4. **Phase 4**: Configure Railway deployment
5. **Phase 5**: Test end-to-end functionality

### Risk Mitigation
- **OpenAI Agents SDK Compatibility**: Verify SDK works in standard Node.js environment before full migration
- **Streaming Reliability**: Test SSE implementation thoroughly with various message sizes
- **Development Workflow**: Ensure hot reload works properly for both services
- **Deployment Simplicity**: Keep Railway configuration minimal to avoid deployment issues

## Success Metrics

### Primary Success Criteria
1. **Functional Deployment**: Successful deployment on Railway with zero build errors
2. **OpenAI Agents SDK Integration**: Agent responses streaming successfully through chat interface
3. **Development Experience**: Hot reload working for both frontend and backend changes
4. **Response Time**: Streaming responses begin within 2 seconds of user message

### Secondary Success Criteria
1. **Cost Reduction**: Lower monthly hosting costs compared to Vercel projections
2. **Deployment Speed**: Deployment time under 5 minutes from git push
3. **Error Rate**: Zero critical errors in basic chat functionality
4. **Code Maintainability**: Clear separation of concerns between frontend and backend

### Validation Tests
1. Send a chat message and receive streaming response
2. Verify agent persona is properly configured and reflected in responses
3. Test frontend hot reload when modifying React components
4. Test backend hot reload when modifying Express routes
5. Deploy to Railway and verify production functionality

## Open Questions

1. **Tool Discovery**: Should we implement the tool discovery system during migration or defer to separate task?
   - **Recommendation**: Implement basic structure but keep tools array empty for now

2. **Error Handling**: What level of error handling and logging should be implemented?
   - **Recommendation**: Basic error handling with console logging; comprehensive logging can be added later

3. **Database Future**: Should we design the architecture with future database integration in mind?
   - **Recommendation**: Keep architecture simple for now; database integration is separate concern

4. **Frontend Build**: Should the Express server serve the built frontend files or use separate static hosting?
   - **Recommendation**: Express serves static files for simplicity; can optimize later if needed

5. **Environment Configuration**: How should we handle different environment configurations (dev/staging/prod)?
   - **Recommendation**: Start with dev/production only; add staging if needed later

## Implementation Notes

- **Preserve Existing Code**: Reuse as much existing agent configuration and frontend code as possible
- **Incremental Migration**: Implement in phases to minimize risk and enable testing at each step
- **Documentation**: Update README with new development and deployment instructions
- **Testing Strategy**: Manual testing initially; automated tests can be added in future iterations
- **Rollback Plan**: Keep Vercel configuration files for potential rollback if needed

---

## Appendix: Railway Implementation Guide

### Overview

This appendix provides detailed technical implementation guidance for migrating from Vercel Edge Functions to Railway with Express.js backend. The migration enables full Node.js runtime support for the OpenAI Agents SDK.

### Architecture Transition

#### From (Planned Vercel):
- Next.js App Router
- Vercel Edge Functions
- Edge Runtime API routes

#### To (Railway Compatible):
- Keep Vite for frontend (static build)
- Express.js backend server
- Standard Node.js runtime
- Server-Sent Events for streaming

### Detailed Implementation Plan

#### 1. Backend Server Directory Structure

Create a new `server` directory with the following structure:

```
server/
├── src/
│   ├── index.ts          # Express server entry point
│   ├── routes/
│   │   ├── chat.ts       # Chat endpoint (replaces Vercel edge route)
│   │   └── approvals.ts  # Approvals endpoint (future tool support)
│   ├── lib/
│   │   ├── agent.ts      # Agent configuration (port from src/lib/agent.ts)
│   │   └── loadTools.ts  # Tool discovery system
│   └── types/
│       └── agent.ts      # TypeScript interfaces
├── package.json          # Backend-specific dependencies
└── tsconfig.json         # Backend TypeScript configuration
```

#### 2. Express.js Chat Route Implementation

```typescript
// server/src/routes/chat.ts
import express from 'express';
import { Agent, Runner } from '@openai/agents';
import { loadTools } from '../lib/loadTools';

export const chatRouter = express.Router();

chatRouter.post('/chat', async (req, res) => {
  try {
    // Set up Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Create agent instance
    const agent = new Agent({
      model: 'gpt-4o-mini', // Match existing configuration
      tools: await loadTools(),
      instructions: process.env.AGENT_PERSONA || 'You are a helpful assistant.'
    });

    // Start agent runner with user messages
    const runner = agent.run({
      messages: req.body.messages
    });

    // Stream responses using SSE
    for await (const event of runner) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### 3. Frontend API Client Updates

```typescript
// src/utils/api.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function sendChatMessage(messages: Message[]) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
}

// Handle SSE streaming on frontend
export function handleChatStream(response: Response, onMessage: (data: any) => void) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  async function readStream() {
    if (!reader) return;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            onMessage(data);
          }
        }
      }
    } catch (error) {
      console.error('Stream reading error:', error);
    }
  }

  readStream();
}
```

#### 4. Railway Deployment Configuration

##### `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

##### Root `package.json` (Monorepo Setup):
```json
{
  "name": "waddle-demo-monorepo",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "vite",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "cd server && npm run build",
    "start": "cd server && npm start",
    "postinstall": "cd server && npm install"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

##### Server `package.json`:
```json
{
  "name": "waddle-demo-server",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@openai/agents": "^0.0.10",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "typescript": "^5.2.0",
    "tsx": "^4.0.0",
    "nodemon": "^3.0.0"
  }
}
```

#### 5. Environment Variables Configuration

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...

# Agent Configuration (use existing persona from .env)
AGENT_PERSONA="You are a helpful customer service agent..."

# Server Configuration
PORT=3001
NODE_ENV=production

# Frontend Build Configuration
VITE_API_URL=https://your-app.railway.app
```

#### 6. Server-Sent Events Implementation Details

Since WebSockets can be complex on Railway, SSE provides a simpler streaming solution:

```typescript
// Alternative SSE endpoint for simpler implementation
chatRouter.get('/chat/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    res.write('data: {"type": "heartbeat"}\n\n');
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});
```

### Benefits of Railway Architecture

1. **No Edge Runtime Limitations** - Full Node.js capabilities enable OpenAI Agents SDK
2. **Better Debugging** - Standard Node.js debugging tools and error handling
3. **More Flexible** - Can use any Node.js libraries without restrictions
4. **Railway Native** - Designed specifically for Railway's infrastructure
5. **Cost Effective** - Railway's pricing model favors long-running services over function invocations

### Migration Execution Path

1. **Phase 1**: Keep all existing frontend code (Vite + React components)
2. **Phase 2**: Create new `server` directory with Express.js setup
3. **Phase 3**: Port agent integration from `src/lib/agent.ts` to backend
4. **Phase 4**: Update frontend API calls to target Express backend
5. **Phase 5**: Deploy as monorepo to Railway with static file serving
6. **Phase 6**: Configure environment variables and test end-to-end

### Technical Considerations

- **Static File Serving**: Express serves built frontend files from `dist` directory
- **CORS Configuration**: Properly configured for development and production environments
- **Error Handling**: Comprehensive error handling for agent failures and network issues
- **Hot Reload**: Both frontend (Vite) and backend (nodemon) support hot reload in development
- **Build Process**: Frontend builds to static files, backend compiles TypeScript to JavaScript

This approach maintains all functionality from the original Vercel implementation while being fully compatible with Railway's platform and enabling the OpenAI Agents SDK demonstration. 