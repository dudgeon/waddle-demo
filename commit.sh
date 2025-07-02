#!/bin/sh
git add server/src/routes/multi-agent-chat.ts server/src/lib/multi-agent-manager.ts server/src/lib/mcp-tool-wrapper.ts
git commit -F- <<'EOF'
fix: restore agent context for MCP tool approvals to prevent N/A flow

The issue was that tool approvals were happening in the streaming route
handler, outside the agent's execution context. This caused OpenAI traces
to show "N/A" flow instead of "triage-agent" flow.

Changes made:
1. Removed approval handling from streaming route (multi-agent-chat.ts)
   - Removed event.item.approvalState.approve() calls
   - Kept UI notification logic for real-time updates
   - Prevents approvals outside agent context

2. Restored original MultiAgentManager interruption handling
   - Approvals now happen within agent context after run() call
   - Same logic for both streaming and non-streaming modes
   - Maintains proper flow attribution in traces

3. Added test function for non-approval MCP tools
   - makeInstrumentedMcpToolWithoutApproval() for comparison testing

Testing needed:
1. Start backend: cd server && npm run dev
2. Test with MCP tool: "check my balance"
3. Verify in OpenAI traces:
   - Tool shows "triage-agent" flow (not "N/A")
   - Tool executes successfully (not hanging)
   - No "awaiting approval" status
4. Verify UI behavior:
   - MCP flow visualization (orange globe) activates
   - Correct tool name displayed (e.g., "check-my-balance")
   - Activation timing is correct

Next steps if still broken:
- Check if interruptions array is populated in streaming mode
- Investigate if SDK expects different approval handling for streaming
- Consider alternative: remove requireApproval and use event detection

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF