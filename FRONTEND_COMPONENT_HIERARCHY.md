# Frontend Component Hierarchy

This document provides a visual representation of the DOM structure with all the descriptive IDs for easy reference when making UI changes.

## 📱 Page Structure

```
#blog-page-container
├── #mobile-warning-overlay (mobile only)
│   └── #mobile-warning-modal
│       ├── #desktop-icon
│       ├── #mobile-warning-title ("Best Viewed on Desktop")
│       ├── #mobile-warning-message
│       └── #continue-anyway-button
│
└── #main-content-layout (two-column layout)
    ├── #article-content (left column - 40%)
    │   └── #waddle-demo-article
    │       ├── #article-header
    │       │   ├── #waddle-servicing-demo (main title)
    │       │   ├── #demonstrating-hybrid-agentic-tool-calling-and-human-in-the-loop (subtitle)
    │       │   └── #author-byline
    │       │       ├── #author-avatar ("GD")
    │       │       └── #author-info (name + date)
    │       └── Article sections (#context, #concepts, #demo, etc.)
    │
    └── #demo-sidebar (right column - 60%)
        └── #sticky-demo-container
            └── #demo-card
                └── #chat-demo-wrapper
                    └── #chat-service-demo-container
```

## 🔧 Chat Service Demo Structure

```
#chat-service-demo-container (three-panel layout)
├── #customer-chat-panel (left - 30%)
│   ├── #customer-chat-header
│   │   ├── #customer-support-icon
│   │   └── #chat-session-info ("Chat Session #1234")
│   │
│   ├── #customer-messages-area
│   │   └── #customer-messages-list
│   │       ├── #customer-message-{id} (dynamic per message)
│   │       ├── #streaming-response-message (when streaming)
│   │       │   └── #streaming-indicator (animated dots)
│   │       └── #agent-processing-indicator (when processing)
│   │
│   └── #customer-input-area
│       ├── #customer-message-input
│       └── #customer-send-button
│
├── #agent-runtime-panel (center - 40% or 60% when approval disabled)
│   ├── #agent-runtime-header
│   │   ├── #agent-runtime-icon
│   │   └── #processing-pipeline-info
│   │
│   └── #flow-steps-container
│       └── #flow-steps-list
│           └── #flow-step-{stepId} (dynamic per flow step)
│               ├── Message Ingestion (#flow-step-receive)
│               ├── Triage Agent (#flow-step-triage)
│               ├── Tool Execution (#tools - parent container)
│               │   ├── Tool Substeps (3-column grid)
│               │   │   ├── Local Tool 1 (#flow-step-localtool1)
│               │   │   ├── Local Tool 2 (#flow-step-localtool2)  
│               │   │   └── MCP Server (#flow-step-mcp)
│               │   ├── Animated connection lines (purple)
│               │   └── Tool activation indicators
│               ├── Human Review (#flow-step-humanreview) - conditionally rendered
│               └── Send Response (#flow-step-respond)
│
└── #agent-dashboard-panel (right - 30%)
    ├── #agent-dashboard-header
    │   ├── #agent-dashboard-icon
    │   └── #agent-status-info (agent name + status)
    │
    ├── #agent-messages-area
    │   └── #agent-messages-list
    │       ├── #agent-message-{id} (dynamic per message)
    │       └── #approval-required-panel (when approval needed)
    │           ├── #approval-header ("Approval Required")
    │           ├── #pending-response-preview
    │           └── #approval-buttons
    │               ├── #approve-send-button
    │               └── #modify-response-button
    │
    └── #agent-input-area
        ├── #agent-message-input
        └── #agent-send-button
```

## 🎨 Visual Layout Reference

```
┌─────────────────────────────────────────────────────────────────────────┐
│ #blog-page-container                                                    │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ #main-content-layout                                                │ │
│ │ ┌─────────────────┐ ┌─────────────────────────────────────────────┐ │ │
│ │ │ #article-content│ │ #demo-sidebar                               │ │ │
│ │ │                 │ │ ┌─────────────────────────────────────────┐ │ │ │
│ │ │ Article Text    │ │ │ #chat-service-demo-container            │ │ │ │
│ │ │ Content         │ │ │ ┌──────┐┌────────────┐┌──────────────┐ │ │ │ │
│ │ │                 │ │ │ │Customer││   Agent   ││    Agent     │ │ │ │ │
│ │ │                 │ │ │ │ Chat  ││  Runtime  ││  Dashboard   │ │ │ │ │
│ │ │                 │ │ │ │ Panel ││   Flow    ││    Panel     │ │ │ │ │
│ │ │                 │ │ │ │(30%)  ││   (40%)   ││    (30%)     │ │ │ │ │
│ │ │                 │ │ │ └──────┘└────────────┘└──────────────┘ │ │ │ │
│ │ │                 │ │ └─────────────────────────────────────────┘ │ │ │
│ │ └─────────────────┘ └─────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🏷️ ID Naming Conventions

### Patterns Used:
- **Panel containers**: `{function}-panel` (e.g., `customer-chat-panel`)
- **Headers**: `{section}-header` (e.g., `agent-dashboard-header`)
- **Input areas**: `{section}-input-area` (e.g., `customer-input-area`)
- **Message lists**: `{section}-messages-list` (e.g., `agent-messages-list`)
- **Individual messages**: `{section}-message-{id}` (e.g., `customer-message-1`)
- **Action buttons**: `{action}-button` (e.g., `approve-send-button`)
- **Flow steps**: `flow-step-{stepId}` (e.g., `flow-step-triage`)

### Functional Groupings:
- **Customer Chat**: `customer-*` (blue theme)
- **Agent Runtime**: `agent-runtime-*` or `flow-*` (purple theme)  
- **Agent Dashboard**: `agent-*` (green theme)
- **Layout**: `*-container`, `*-wrapper`, `*-layout`
- **Mobile**: `mobile-*`

## 🔄 Flow Step Activation System

### State Management Architecture
- **activeSteps**: Array of currently active step IDs (allows concurrent activation)
- **Helper Functions**:
  - `addActiveStep(stepId)`: Adds step to active array
  - `removeActiveStep(stepId)`: Removes step from active array  
  - `isStepActive(stepId)`: Checks if step is in activeSteps array
  - `clearAllActiveSteps()`: Removes all active steps

### Activation Flow
1. **receive** → Activated immediately on message start
2. **triage** → Activated when agent connects, stays active during processing
3. **Tool Steps** → Added concurrently while triage remains active:
   - **localtool1** → Local database/order tools
   - **localtool2** → Local CRM/customer tools
   - **mcp** → External MCP server tools (hostedMcpTools)
4. **respond** → Activated when text streaming begins
5. **Clear All** → Final result clears all steps

### Visual Indicators
- **Active Steps**: Scale transform, colored rings, animated dots
- **Connection Lines**: Purple animated SVG paths between active tools
- **Debug Info**: Real-time activeSteps array display (development)

## 🎯 Quick Reference for Common Elements

| Element | ID | Purpose |
|---------|-----|---------|
| Send customer message | `#customer-send-button` | Trigger customer message |
| Customer input field | `#customer-message-input` | Type customer messages |
| Agent approval buttons | `#approve-send-button` | Approve/reject responses |
| Flow visualization | `#flow-steps-container` | Shows agent processing |
| MCP step component | `#flow-step-mcp` | External MCP tool activation |
| Tool substeps grid | Tool substeps (3-column grid) | Tool execution visualization |
| Mobile warning | `#mobile-warning-overlay` | Mobile device warning |
| Main demo area | `#chat-service-demo-container` | Entire interactive demo |
| Article content | `#article-content` | Blog post text content |
| Streaming indicator | `#streaming-response-message` | Live AI responses |

## 🐛 Known Issues

### MCP Step Activation Issue
- **Status**: Active investigation
- **Symptoms**: flow-step-mcp component not visually activating despite:
  - ✅ Successful tool detection and execution
  - ✅ Correct state management (activeSteps array updated)
  - ✅ Proper console logging
- **Root Cause**: Disconnect between state updates and visual rendering
- **Next Steps**: External review needed for rendering system

This hierarchy makes it easy to reference any UI element when requesting changes or modifications to the frontend.