# OpenAI Agents SDK Documentation

## Overview

The OpenAI Agents SDK is a lightweight yet powerful framework for building multi-agent workflows. It's a production-ready upgrade of OpenAI's previous experimentation for agents, called Swarm.

## Installation

```bash
pip install openai-agents
```

For voice support:
```bash
pip install 'openai-agents[voice]'
```

## Core Concepts

### 1. Agents
LLMs equipped with instructions, tools, guardrails, and handoffs.

### 2. Handoffs
A specialized tool call used by the Agents SDK for transferring control between agents.

### 3. Guardrails
Configurable safety checks for input and output validation.

### 4. Tracing
Built-in tracking of agent runs, allowing you to view, debug and optimize your workflows.

## Key Features

- **Agent loop**: Built-in agent loop that handles calling tools, sending results to the LLM, and looping until the LLM is done
- **Python-first**: Use built-in language features to orchestrate and chain agents
- **Handoffs**: Coordinate and delegate between multiple agents
- **Guardrails**: Run input validations and checks in parallel to your agents
- **Function tools**: Turn any Python function into a tool, with automatic schema generation
- **Tracing**: Built-in tracing for visualization, debugging and monitoring

## Environment Setup

Ensure you set your OpenAI API key:
```bash
export OPENAI_API_KEY=sk-...
```

## Basic Usage

### Hello World Example

```python
from agents import Agent, Runner

agent = Agent(name="Assistant", instructions="You are a helpful assistant")

result = Runner.run_sync(agent, "Write a haiku about recursion in programming.")
print(result.final_output)

# Output:
# Code within the code,
# Functions calling themselves,
# Infinite loop's dance.
```

### Function Tools Example

```python
import asyncio
from agents import Agent, Runner, function_tool

@function_tool
def get_weather(city: str) -> str:
    return f"The weather in {city} is sunny."

agent = Agent(
    name="Weather Agent",
    instructions="You are a helpful weather assistant.",
    tools=[get_weather],
)

async def main():
    result = await Runner.run(agent, input="What's the weather in Tokyo?")
    print(result.final_output)
    # The weather in Tokyo is sunny.

if __name__ == "__main__":
    asyncio.run(main())
```

### Multi-Agent Handoffs

```python
from agents import Agent, Runner
import asyncio

spanish_agent = Agent(
    name="Spanish agent",
    instructions="You only speak Spanish.",
)

english_agent = Agent(
    name="English agent",
    instructions="You only speak English",
)

triage_agent = Agent(
    name="Triage agent",
    instructions="Handoff to the appropriate agent based on the language of the request.",
    handoffs=[spanish_agent, english_agent],
)

async def main():
    result = await Runner.run(triage_agent, input="Hola, ¿cómo estás?")
    print(result.final_output)
    # ¡Hola! Estoy bien, gracias por preguntar. ¿Y tú, cómo estás?

if __name__ == "__main__":
    asyncio.run(main())
```

## Agent Loop

When you call `Runner.run()`, the SDK runs a loop until it gets a final output:

1. Call the LLM using the model and settings on the agent, and the message history
2. The LLM returns a response, which may include tool calls
3. If the response has a final output, return it and end the loop
4. If the response has a handoff, set the agent to the new agent and go back to step 1
5. Process the tool calls (if any) and append the tool responses messages, then go to step 1

## Running Methods

- `Runner.run()` – Async method for non-blocking execution
- `Runner.run_sync()` – Sync (blocking) method for running the agent in a linear flow
- `Runner.run_streamed()` – Async method that streams responses back to the user

## Structured Output

```python
from pydantic import BaseModel
from agents import Agent, Runner

class PersonInfo(BaseModel):
    name: str
    age: int
    city: str

agent = Agent(
    name="Data Extractor",
    instructions="Extract person information from the input.",
    output_type=PersonInfo
)

result = Runner.run_sync(agent, "My name is John, I'm 30 years old and live in New York")
print(result.final_output)
# PersonInfo(name='John', age=30, city='New York')
```

## Guardrails

Guardrails ensure that all inputs and outputs going through the agent are sanitized:

- **Input guardrail**: Checks user queries to ensure they're safe for processing
- **Output guardrail**: Ensures that the results from the LLM are appropriate and safe

## Tracing

The SDK includes built-in tracing that allows you to visualize and monitor the entire agent flow. Tracing is extensible and supports various external destinations including:

- Logfire
- AgentOps
- Braintrust
- Scorecard
- Keywords AI

## Links

- [Official Documentation](https://openai.github.io/openai-agents-python/)
- [GitHub Repository](https://github.com/openai/openai-agents-python)
- [PyPI Package](https://pypi.org/project/openai-agents/)
- [Multi-Agent Portfolio Collaboration Example](https://cookbook.openai.com/examples/agents_sdk/multi-agent-portfolio-collaboration/multi_agent_portfolio_collaboration) 