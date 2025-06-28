# OpenAI Agents SDK API Reference

## Core Classes

### Agent

The main class for creating AI agents.

```python
from agents import Agent

agent = Agent(
    name: str,                    # Agent name
    instructions: str,            # System instructions
    model: str = "gpt-4o-mini",  # Model to use
    tools: List[Tool] = None,     # Available tools
    handoffs: List[Agent] = None, # Agents to handoff to
    output_type: Type = None,     # Structured output type
    guardrails: List = None,      # Safety guardrails
    model_settings: ModelSettings = None  # Model configuration
)
```

#### Parameters

- **name**: Unique identifier for the agent
- **instructions**: System prompt defining agent behavior
- **model**: OpenAI model to use (default: "gpt-4o-mini")
- **tools**: List of function tools the agent can use
- **handoffs**: List of other agents this agent can delegate to
- **output_type**: Pydantic model for structured output
- **guardrails**: Input/output validation rules
- **model_settings**: Temperature, max_tokens, etc.

### Runner

Static class for executing agent workflows.

```python
from agents import Runner

# Synchronous execution
result = Runner.run_sync(agent, input_message)

# Asynchronous execution  
result = await Runner.run(agent, input_message, max_turns=10)

# Streaming execution
stream = Runner.run_streamed(agent, input_message)
async for event in stream.stream_events():
    # Process streaming events
    pass
```

#### Methods

- **run_sync(agent, input, max_turns=10)**: Synchronous execution
- **run(agent, input, max_turns=10)**: Asynchronous execution
- **run_streamed(agent, input, max_turns=10)**: Streaming execution

#### Parameters

- **agent**: The Agent instance to run
- **input**: User input string
- **max_turns**: Maximum number of agent loop iterations

### function_tool

Decorator to convert Python functions into agent tools.

```python
from agents import function_tool

@function_tool
def my_tool(param1: str, param2: int = 10) -> str:
    """Tool description for the agent"""
    return f"Result: {param1} with {param2}"

# With custom name/description
@function_tool(
    name_override="custom_name",
    description_override="Custom description"
)
def another_tool(data: str) -> str:
    return f"Processed: {data}"
```

## Model Settings

Configure model behavior with ModelSettings.

```python
from agents import ModelSettings

settings = ModelSettings(
    temperature=0.7,           # Creativity (0-2)
    max_tokens=1000,          # Max response length
    top_p=1.0,                # Nucleus sampling
    frequency_penalty=0.0,     # Reduce repetition
    presence_penalty=0.0,      # Encourage new topics
    parallel_tool_calls=True,  # Enable parallel tool execution
    tool_choice="auto"         # Tool usage behavior
)

agent = Agent(
    name="Configured Agent",
    instructions="...",
    model_settings=settings
)
```

## Tracing

Built-in tracing for monitoring and debugging.

```python
from agents.tracing import trace

# Manual tracing
with trace("Workflow Name", metadata={"user": "john"}) as workflow_trace:
    print(f"Trace ID: {workflow_trace.trace_id}")
    result = await Runner.run(agent, "Hello")

# Automatic tracing (enabled by default)
# View traces at: https://platform.openai.com/traces
```

## Structured Output

Use Pydantic models for structured responses.

```python
from pydantic import BaseModel
from typing import List

class UserProfile(BaseModel):
    name: str
    age: int
    interests: List[str]
    location: str

agent = Agent(
    name="Profile Extractor",
    instructions="Extract user profile information",
    output_type=UserProfile
)

result = Runner.run_sync(agent, "I'm John, 25, love hiking and coding, from NYC")
profile = result.final_output  # UserProfile instance
```

## Handoffs

Enable agent-to-agent delegation.

```python
# Specialist agents
tech_agent = Agent(name="Tech", instructions="Technical expert")
biz_agent = Agent(name="Business", instructions="Business expert")

# Router agent
router = Agent(
    name="Router",
    instructions="Route to appropriate specialist",
    handoffs=[tech_agent, biz_agent]
)

result = Runner.run_sync(router, "How do I scale my database?")
# Automatically routes to tech_agent
```

## Error Handling

```python
from agents.exceptions import AgentException, MaxTurnsExceeded

try:
    result = Runner.run_sync(agent, "Complex query", max_turns=5)
except MaxTurnsExceeded:
    print("Agent exceeded maximum turns")
except AgentException as e:
    print(f"Agent error: {e}")
```

## Advanced Features

### Custom Tool Schemas

```python
from agents import function_tool
from pydantic import Field

@function_tool
def advanced_tool(
    query: str = Field(description="Search query"),
    limit: int = Field(default=10, description="Max results")
) -> str:
    """Advanced tool with detailed parameter descriptions"""
    return f"Found {limit} results for '{query}'"
```

### Model Context Protocol (MCP)

```python
# Connect to MCP servers for external tool integration
from agents.mcp import MCPServer

# This would connect to an MCP server
# Implementation details depend on specific MCP server setup
```

### Guardrails (Conceptual)

```python
# Guardrails implementation may vary
# Check official docs for current implementation

agent = Agent(
    name="Safe Agent",
    instructions="...",
    # guardrails configuration would go here
)
```

## Common Patterns

### Agent as Tool Pattern

```python
# Use one agent as a tool for another
@function_tool
async def specialist_agent_tool(query: str) -> str:
    result = await Runner.run(specialist_agent, query)
    return result.final_output

main_agent = Agent(
    name="Main Agent",
    instructions="Use specialist when needed",
    tools=[specialist_agent_tool]
)
```

### Parallel Tool Execution

```python
settings = ModelSettings(parallel_tool_calls=True)

agent = Agent(
    name="Parallel Agent",
    instructions="Use multiple tools efficiently",
    tools=[tool1, tool2, tool3],
    model_settings=settings
)
```

### Streaming with Processing

```python
async def process_stream(agent, query):
    result = Runner.run_streamed(agent, query)
    full_response = ""
    
    async for event in result.stream_events():
        if hasattr(event, 'data') and hasattr(event.data, 'delta'):
            chunk = event.data.delta
            full_response += chunk
            print(chunk, end="", flush=True)
    
    return full_response
```

## Environment Variables

```bash
# Required
export OPENAI_API_KEY=sk-...

# Optional tracing configuration
export OPENAI_TRACE_ENABLED=true
export OPENAI_TRACE_ENDPOINT=https://api.openai.com/v1/traces
```

## Best Practices

1. **Agent Design**: Keep instructions clear and specific
2. **Tool Functions**: Use descriptive docstrings and type hints
3. **Error Handling**: Always handle potential exceptions
4. **Tracing**: Use tracing for debugging and monitoring
5. **Structured Output**: Use Pydantic models for complex data
6. **Performance**: Use parallel_tool_calls for independent operations
7. **Security**: Validate inputs and sanitize outputs

## Links

- [Official Documentation](https://openai.github.io/openai-agents-python/)
- [GitHub Repository](https://github.com/openai/openai-agents-python)
- [Examples](./examples.py) 