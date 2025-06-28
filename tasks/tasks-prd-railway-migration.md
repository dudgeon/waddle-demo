## Relevant Files

- `server/src/index.ts` - Express server entry point and main application setup
- `server/src/routes/chat.ts` - Chat endpoints: GET for EventSource streaming, POST for regular/non-streaming requests
- `server/src/routes/approvals.ts` - Future approvals endpoint for tool support
- `server/src/lib/agent.ts` - Agent configuration ported from existing frontend implementation
- `server/src/lib/loadTools.ts` - Tool discovery system for OpenAI Agents SDK
- `server/src/types/agent.ts` - TypeScript interfaces for backend agent types
- `server/package.json` - Backend-specific dependencies and scripts
- `server/tsconfig.json` - Backend TypeScript configuration
- `src/utils/api.ts` - Updated API client for connecting to Express backend
- `src/utils/streamingService.ts` - Modified streaming service for SSE handling
- `package.json` - Root monorepo package.json with unified scripts
- `railway.json` - Railway deployment configuration
- `.cursor/mcp.json` - MCP server configuration for Railway and Stagehand integration
- `.env` - Environment variables for OpenAI API key, agent persona, and Railway API key
- `README.md` - Updated documentation for new development and deployment workflow

### Files to be Deleted (Cleanup Phase)
- `vercel.json` - Vercel deployment configuration (to be removed)
- `src/lib/vercel-agent.ts` - Vercel SDK integration (to be removed)
- `src/lib/vercel-cli-helper.ts` - Vercel CLI helper functions (to be removed)
- `src/lib/ai-agent-vercel-integration.ts` - Vercel AI agent integration (to be removed)
- `src/types/agent.ts` - Frontend agent types with OpenAI SDK imports (to be removed in task 2.4.1)
- `src/config/` directory - Empty directory after persona.ts moved to backend (to be removed in task 2.4.1)
- `docs/VERCEL_AI_AGENTS_SETUP.md` - Vercel-specific documentation (to be removed)
- `.vercel/` directory - Vercel project configuration (to be removed if exists)

### Notes

- The migration maintains all existing frontend components and only updates the API integration layer
- Backend tests will be added in future iterations; focus is on functional migration first
- Use `npm run dev` to run both frontend and backend concurrently during development
- Railway deployment uses the root `package.json` build and start scripts
- Railway MCP server is configured in `.cursor/mcp.json` for programmatic deployment operations
- Stagehand MCP server is configured for automated browser testing of deployments
- Use Railway MCP for deployment, environment variable management, and service monitoring
- Use Stagehand MCP to automatically test deployments before asking user to verify
- Phase 7 includes comprehensive cleanup of all Vercel-related code, dependencies, and configuration files
- After cleanup, the codebase will be Railway-only with no Vercel dependencies or references

## Tasks

- [x] 1.0 Create Express.js Backend Server Architecture
  - [x] 1.1 Create `server/` directory structure with src, routes, lib, and types subdirectories
  - [x] 1.2 Initialize backend `package.json` with Express.js, TypeScript, and OpenAI Agents SDK dependencies
  - [x] 1.3 Set up TypeScript configuration (`tsconfig.json`) for backend with proper compilation settings
  - [x] 1.4 Create Express server entry point (`server/src/index.ts`) with basic middleware setup
  - [x] 1.5 Configure CORS middleware for frontend-backend communication
  - [x] 1.6 Set up environment variable loading with dotenv configuration
  - [x] 1.7 Add static file serving middleware for built frontend assets
  - [x] 1.8 **DEV CHECKPOINT**: Test basic Express server runs locally on port 3001
- [x] 2.0 Port Agent Integration to Backend
  - [x] 2.1 Create `server/src/lib/agent.ts` by porting existing `src/lib/agent.ts` functionality
  - [x] 2.2 Implement `server/src/lib/loadTools.ts` for tool discovery system (empty array initially)
  - [x] 2.3 Create `server/src/types/agent.ts` with TypeScript interfaces for agent configuration
  - [x] 2.4 Configure agent initialization with personal loading from persona.ts
  - [x] 2.4.1 **CLEANUP**: Remove vestigial frontend code from Vercel migration
    - Remove `src/lib/vercel-agent.ts` (3.0KB, Vercel SDK integration)
    - Remove `src/lib/vercel-cli-helper.ts` (4.3KB, Vercel CLI wrapper)  
    - Remove `src/lib/ai-agent-vercel-integration.ts` (6.2KB, AI Agent + Vercel integration)
    - Remove `src/types/agent.ts` (217 lines, OpenAI Agents SDK imports - not needed in frontend)
    - Remove empty `src/config/` directory (persona.ts moved to backend)
    - Verify frontend only imports simple UI types from `src/types/index.ts`
  - [x] 2.5 Implement agent lifecycle management and error handling
- [x] 3.0 Implement Server-Sent Events Streaming
  - [x] 3.1 Create `server/src/routes/chat.ts` with POST endpoint for chat messages
  - [x] 3.2 Set up SSE headers (Content-Type, Cache-Control, Connection, CORS)
  - [x] 3.3 Implement OpenAI Agents SDK runner integration with streaming response handling
  - [x] 3.4 Add proper error handling and client disconnection management
  - [x] 3.5 Create heartbeat mechanism to maintain SSE connection stability
  - [x] 3.6 Test SSE streaming with various message sizes and connection scenarios
  - [x] 3.7 **DEV CHECKPOINT**: Test `/api/chat` endpoint locally with curl/Postman
- [x] 4.0 Update Frontend API Integration
  - [x] 4.1 Create or update `src/utils/api.ts` with new Express backend API client
  - [x] 4.2 Modify `src/utils/streamingService.ts` to handle SSE instead of fetch streaming
  - [x] 4.3 Update API base URL configuration for development and production environments
  - [x] 4.4 Ensure existing chat interface components work with new backend integration
  - [x] 4.5 Add proper error handling for backend connection failures
  - [x] 4.6 **Debug 500 error** (blocking issue):
    Hypothesis: agent creation failing. Investigate with detailed logging.
    
    **RESOLUTION**: Fixed environment variable loading - dotenv was looking for `.env` in `server/` directory but file was in project root. Updated `dotenv.config()` to use `path.join(__dirname, '../../.env')` in both `server/src/index.ts` and `server/src/lib/agent.ts`.
    
    - [x] 4.6.1 Add `npm run dev-clean` script to kill orphaned processes on port 3001.
    - [x] 4.6.2 Enhance startup error handling in `server/src/index.ts` (EADDRINUSE detection, graceful shutdown).
    - [x] 4.6.3 Harden error logging in `server/src/routes/chat.ts` (capture OpenAI-specific errors, log full stack traces in dev).
    - [x] 4.6.4 Add env var `AGENT_MODEL` (default `gpt-4o-mini`). Allow override; fall back to `gpt-4o` if first choice fails.
    - [x] 4.6.5 Implement a lightweight *self-test* util ( `/api/chat/test` ) that calls the agent with "ping" and returns either "pong" or the failure reason – used by CI & manual debugging.
    - [x] 4.6.6 End-to-end test: clean dev start (`npm run dev`), curl `/api/chat` non-stream & stream, observe successful 200 / SSE events.
    - [x] 4.6.7 Document troubleshooting steps in README (common port issues, model errors, how to clean processes).

    Once 4.6.x passes (agent replies successfully in dev), proceed to 4.7 DEV CHECKPOINT.
  - [x] 4.7 **DEV CHECKPOINT**: Frontend + Backend Integration Complete
    **STATUS**: ✅ COMPLETED - Both non-streaming and streaming endpoints working perfectly
    
    **Test Results**:
    - Health check: ✅ `GET /health` returns 200 OK
    - Self-test: ✅ `GET /api/chat/test` returns agent response
    - Non-streaming: ✅ `POST /api/chat` with `stream: false` returns JSON response
    - Streaming: ✅ `POST /api/chat` with `stream: true` returns SSE events
    
    **Key Fixes Applied**:
    - Fixed environment variable loading from project root
    - Added process cleanup script (`npm run dev-clean`)
    - Enhanced error handling and logging
    - Added comprehensive troubleshooting documentation
    - **CRITICAL**: Added GET `/api/chat` endpoint for EventSource streaming (EventSource can only make GET requests, but original design only accepted POST)
  - [x] 4.8 **DEV CHECKPOINT**: Verify streaming responses work in local development
    **STATUS**: ✅ COMPLETED - Streaming SSE responses verified working perfectly
    
    **Verification Results**:
    - SSE connection established successfully
    - Text deltas received in real-time
    - Proper event formatting (id, event, data)
    - Connection lifecycle managed correctly
    - Heartbeat mechanism working
    - Clean disconnection handling
- [ ] 5.0 Configure Railway Deployment and Environment
  - [ ] 5.1 Create `railway.json` configuration file with build and deployment settings
  - [ ] 5.2 Update root `package.json` with monorepo scripts (dev, build, start, postinstall)
  - [ ] 5.3 Use Railway MCP to create new project and configure initial deployment
  - [ ] 5.4 Configure environment variables using Railway MCP (OPENAI_API_KEY, AGENT_PERSONA, etc.)
  - [ ] 5.5 Deploy initial backend-only version to Railway and verify server starts
  - [ ] 5.6 **AUTOMATED TEST**: Use Stagehand MCP to test backend `/api/chat` endpoint in production
  - [ ] 5.7 **PRODUCTION CHECKPOINT 1**: Verify automated test results and manually test if needed
  - [ ] 5.8 Deploy full application (backend + frontend) to Railway
  - [ ] 5.9 **AUTOMATED TEST**: Use Stagehand MCP to test complete chat interface in production
  - [ ] 5.10 **PRODUCTION CHECKPOINT 2**: Verify automated test results and manually test if needed
  - [ ] 5.11 Use Railway MCP to monitor deployment status and logs
  - [ ] 5.12 **AUTOMATED TEST**: Use Stagehand MCP to test streaming responses in production
  - [ ] 5.13 **PRODUCTION CHECKPOINT 3**: Verify automated streaming test results and manually test if needed
  - [ ] 5.14 Set up automatic deployment from Git repository using Railway MCP
  - [ ] 5.15 Update README.md with new development setup and deployment instructions
- [ ] 6.0 Production Validation and Monitoring
  - [ ] 6.1 **AUTOMATED TEST**: Use Stagehand MCP to test agent persona functionality in production
  - [ ] 6.2 **PRODUCTION CHECKPOINT 4**: Verify automated persona test results and manually test if needed
  - [ ] 6.3 Use Railway MCP to check application metrics and performance
  - [ ] 6.4 **AUTOMATED TEST**: Use Stagehand MCP to test error handling with malformed requests
  - [ ] 6.5 **PRODUCTION CHECKPOINT 5**: Verify frontend hot reload works in development
  - [ ] 6.6 **PRODUCTION CHECKPOINT 6**: Verify backend hot reload works in development
  - [ ] 6.7 Use Railway MCP to set up monitoring alerts for production issues
  - [ ] 6.8 **INITIAL AUTOMATED TEST**: Use Stagehand MCP to perform complete end-to-end user journey test
  - [ ] 6.9 **INITIAL PRODUCTION VALIDATION**: Review automated test results and perform manual verification
- [ ] 7.0 Clean Up Vercel References and Dependencies
  - [ ] 7.1 Remove Vercel-specific dependencies from `package.json` (@vercel/node, @vercel/sdk, vercel CLI)
  - [ ] 7.2 Delete `vercel.json` configuration file
  - [ ] 7.3 Remove Vercel-related scripts from `package.json` (deploy, deploy:preview, vercel:link, vercel:env)
  - [ ] 7.4 Delete Vercel-related files in `src/lib/` (vercel-agent.ts, vercel-cli-helper.ts, ai-agent-vercel-integration.ts)
  - [ ] 7.5 Remove Vercel MCP server configuration from `.cursor/mcp.json`
  - [ ] 7.6 Delete `docs/VERCEL_AI_AGENTS_SETUP.md` documentation file
  - [ ] 7.7 Remove Vercel environment variables from `.env` (VERCEL_TOKEN, VERCEL_TEAM_ID, VERCEL_PROJECT_ID)
  - [ ] 7.8 Clean up any Vercel references in `README.md` and replace with Railway instructions
  - [ ] 7.9 Remove any Vercel imports or references from remaining source files
  - [ ] 7.10 Delete any `.vercel/` directory if it exists
  - [ ] 7.11 **CLEANUP VERIFICATION**: Ensure no Vercel references remain in codebase using grep search
  - [ ] 7.12 **POST-CLEANUP BUILD TEST**: Verify application builds successfully after cleanup
  - [ ] 7.13 **POST-CLEANUP DEV TEST**: Verify development environment works after cleanup
- [ ] 8.0 Final Testing and Validation After Cleanup
  - [ ] 8.1 **AUTOMATED TEST**: Use Stagehand MCP to test backend `/api/chat` endpoint after cleanup
  - [ ] 8.2 **AUTOMATED TEST**: Use Stagehand MCP to test complete chat interface after cleanup
  - [ ] 8.3 **AUTOMATED TEST**: Use Stagehand MCP to test streaming responses after cleanup
  - [ ] 8.4 **AUTOMATED TEST**: Use Stagehand MCP to test agent persona functionality after cleanup
  - [ ] 8.5 **AUTOMATED TEST**: Use Stagehand MCP to test error handling after cleanup
  - [ ] 8.6 **AUTOMATED TEST**: Use Stagehand MCP to perform complete end-to-end user journey test after cleanup
  - [ ] 8.7 **FINAL PRODUCTION VALIDATION**: Review all post-cleanup automated test results
  - [ ] 8.8 **MANUAL VERIFICATION**: Perform final manual testing to confirm everything works correctly
  - [ ] 8.9 **DEPLOYMENT CONFIRMATION**: Confirm Railway deployment is stable and performant 