# Product Requirements Document: **Triage-Agent Scaffold v0.1**

## Introduction / Overview
The **Triage-Agent Scaffold v0.1** is a chat-first triage layer that plugs into the existing customer-support chat interface (`chat-service-demo.tsx`). It returns coherent LLM replies **today** while laying down an auto-discovery architecture for future *local* tools. Human-in-the-loop hooks are wired but dormant until real tools are added.

## Goals
1. **Immediate Functionality** – return helpful LLM answers in the current UI.
2. **Human Oversight Ready** – stream `RunToolApprovalItem` events so approvals can be enabled later.
3. **Zero-Refactor Extensibility** – drop new `*.tool.ts` files; everything just works.
4. **Demo-Friendly** – support dual personas (customer / agent) for live walkthroughs.

## User Stories
*As a customer* I send a chat message and get a fast, useful answer.
*As a demo “customer”* I can showcase the experience.
*As a demo “agent”* I can approve or reject tool calls (once tools exist).
*As a developer* I extend capability by adding a file under `src/tools/`.

## Functional Requirements

### Core Agent System
1. Instantiate with **TypeScript Agents SDK**:

   ```ts
   const agent = new Agent({
     model: "gpt-4.1-nano",           // fastest, cheapest GPT-4.1 tier [oai_citation:0‡openai.com](https://openai.com/index/gpt-4-1/?utm_source=chatgpt.com)
     tools: loadTools(),              // auto-discovery, may be []
     instructions: bankPersona        // configurable persona
   });
```

2.  Agent must answer any inbound text.
3.  Persona instructions must be editable (env or config).

### **Tool Discovery & Loading**

4.  loadTools() glob-imports all src/tools/\*\*/\*.tool.ts.
5.  Returns \[\] if none found.
6.  System operates normally with zero tools.
7.  Adding a tool == create src/tools/foo.tool.ts; no other edits.

### **Human-in-the-Loop Approval**

8.  Stream every RunToolApprovalItem to /api/approvals.
9.  Front-end logs approval events for now; modal UI comes in a later sprint.
10.  Backend route accepts approveToolCall / rejectToolCall.
11.  No-tool scenario: approval logic lies dormant.
12.  Edge function processes approval decisions.

### **API & Runtime**

13.  **Next.js (App Router) / Vercel edge** handler at src/app/api/chat/route.ts.
14.  Handler calls Runner.runStream and pipes Server-Sent Events to the React chat UI.
15.  Must stream partial and final messages in real time.
16.  All routes are unauthenticated for this demo release.

### **State Management**

17.  UI tracks runId per conversation.
18.  Streamed events append to history.
19.  Approval route updates run state when decisions arrive.

### **Integration with Existing Demo**

20.  Seamless drop-in to chat-service-demo.tsx.
21.  Customer text ⟶ agent processing pipeline.
22.  Agent reply renders in chat.
23.  Dual-persona demo flow continues to work.

## **Non-Goals (Out of Scope)**

-   Authentication / authorisation
-   PII redaction
-   Event persistence
-   Performance tuning
-   Hot-reloading tools
-   Tool versioning
-   Production data handling

## **Technical Considerations**

### **Architecture Dependencies**

-   **@openai/agents (TS SDK)**
-   **Vercel Edge Runtime**
-   **React / Next.js App Router**
-   **SSE** for chat streaming

### **Integration Points**

-   Existing chat UI
-   Existing state store / message tracker
-   Optional flow-visualisation component

### **File Structure**

```
src/
  tools/                # Auto-discovered tool defs (empty for v0.1)
    *.tool.ts
  app/
    api/
      chat/route.ts     # Edge handler -> Runner.runStream
      approvals/route.ts# Approval endpoint
  lib/
    loadTools.ts        # Tool discovery helper
```

## **Success Metrics**

### **Primary**

1.  Customer sends text → LLM answer appears.
2.  Dual-persona demo works end-to-end.
3.  Adding a \*.tool.ts file triggers auto-registration without edits.

### **Technical**

1.  /api/chat streams responses successfully.
2.  Conversation state remains consistent across turns.
3.  Backend handles empty tool configuration gracefully.

## **Open Questions**

1.  **Tool interface** – Each file should export default functionTool(async (args)=>…).
2.  **Persona location** – Environment variable vs. config file?
3.  **Failure handling** – Strategy for tool errors.
4.  **Sample assets** – Include stub tool examples?
5.  **Approval timeout** – Define expiration behaviour for pending approvals.

## **Implementation Notes**

The scaffold prioritises developer ergonomics: an empty tool directory still yields a working chat demo. All wiring for streaming, approvals, and extensibility is in place, so future tools bolt on without touching core code.
