## Relevant Files

- `api/chat.ts` - Vercel Edge Function that processes chat requests and streams responses using the OpenAI Agents SDK
- `api/approvals.ts` - Vercel Edge Function for handling tool approval/rejection decisions
- `src/lib/loadTools.ts` - Tool discovery helper that auto-imports all *.tool.ts files from src/tools/
- `src/lib/agent.ts` - Agent configuration and initialization with TypeScript Agents SDK
- `src/config/persona.ts` - Agent persona instructions and behavioral configuration
- `src/types/agent.ts` - TypeScript interfaces for agent, tools, and approval events
- `src/tools/` - Directory for auto-discovered tool definitions (empty for v0.1)
- `src/components/chat-service-demo.tsx` - Existing chat UI component (to be integrated)
- `vercel.json` - Vercel configuration for Edge Functions
- `.env` - Environment variables including persona instructions and API keys

### Notes

- The existing `chat-service-demo.tsx` will be modified to integrate with the new agent system
- Tool files should follow the pattern `*.tool.ts` and export default functionTool
- All routes are unauthenticated for this demo release
- The system must work with zero tools initially
- API functions live in the root `api/` directory, not inside `src/`

## Tasks

- [x] 1.0 Set up OpenAI Agents SDK Integration and Core Agent System
  - [x] 1.1 Install @openai/agents TypeScript SDK and configure dependencies
  - [x] 1.2 Create src/lib/agent.ts with Agent instantiation using gpt-4o-mini model
  - [x] 1.3 Set up configurable persona instructions (environment variable or config)
  - [x] 1.4 Create TypeScript interfaces in src/types/agent.ts for agent configuration
  - [x] 1.5 Initialize agent with empty tools array and verify basic functionality
- [ ] 2.0 Create Vercel Edge Functions and Integrate with Existing Chat UI
  - [ ] 2.1 Create api/chat.ts as Vercel Edge Function with proper config export
  - [ ] 2.2 Implement Runner.runStream integration for streaming responses
  - [ ] 2.3 Set up Server-Sent Events (SSE) streaming to client
  - [ ] 2.4 Create vercel.json with Edge Runtime configuration
  - [ ] 2.5 Modify chat-service-demo.tsx to connect to new /api/chat endpoint
  - [ ] 2.6 Test end-to-end chat flow with agent responses streaming to UI
  - [ ] 2.7 Ensure dual-persona demo functionality continues to work
- [ ] 3.0 Implement Tool Discovery and Auto-Loading System
  - [ ] 3.1 Create src/lib/loadTools.ts with glob import functionality for *.tool.ts files
  - [ ] 3.2 Set up src/tools/ directory structure for auto-discovered tools
  - [ ] 3.3 Implement tool loading that returns empty array when no tools exist
  - [ ] 3.4 Integrate loadTools() into agent initialization
  - [ ] 3.5 Test that system operates normally with zero tools
  - [ ] 3.6 Create example stub tool file to verify auto-discovery works
- [ ] 4.0 Create Tool Approvals Vercel Edge Function (for future extensibility)
  - [ ] 4.1 Create api/approvals.ts as Vercel Edge Function
  - [ ] 4.2 Implement approveToolCall and rejectToolCall handlers
  - [ ] 4.3 Set up basic logging for approval events (no UI modal yet)
  - [ ] 4.4 Ensure approval logic remains dormant when no tools are present
  - [ ] 4.5 Add Edge Runtime config to vercel.json for approvals endpoint