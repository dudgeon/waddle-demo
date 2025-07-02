# "Waddle" Servicing Demo {#waddle-servicing-demo}

## Demonstrating hybrid agentic tool calling and human in the loop {#demonstrating-hybrid-agentic-tool-calling-and-human-in-the-loop}

**Author:** Geoff Dudgeon  
**Date:** June 2025  
**Reading Time:** 8 min read

---

## Context {#context}

Lots of context.

## Concepts {#concepts}

Lots of concepts.

## Demo {#demo}

Description of the demo

1. Customer Chat UI
2. Agentic Runtime/Processing
3. Agent Chat UI for HITL

### 1. Customer Chat UI {#customer-chat-ui}

Customers can send chat messages to the system and receive responses.

### 2. Agentic Runtime/Processing {#agentic-runtime-processing}

#### Message Ingestion {#message-ingestion}

#### Triage Agent {#triage-agent}

#### Internally Defined Tools {#internally-defined-tools}

Call APIs directly; encode or reference API business logic directly.

API business logic not generally available for use in other agentic systems.

#### Externally Accessed Tools (i.e. MCP Servers) {#externally-accessed-tools-mcp-servers}

External to the agent, may be hosted within the company.

External toolsets may be used by multiple agents and applications. In our example, our Waddle Agent is just one of many clients (others could be associate-facing tooling, legacy chatbots, externally hosted IVR providers, etc.)

### 3. Agent Chat UI for HITL {#agent-chat-ui-for-hitl}

Validate and send responses