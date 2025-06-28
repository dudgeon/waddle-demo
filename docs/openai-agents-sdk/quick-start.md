# OpenAI Agents SDK Quick Start Guide

## Prerequisites

- Python 3.9 or higher
- OpenAI API key

## Installation

1. **Install the SDK**:
   ```bash
   pip install openai-agents
   ```

2. **Set your API key**:
   ```bash
   export OPENAI_API_KEY=sk-your-api-key-here
   ```

## Your First Agent (5 minutes)

### Step 1: Basic Agent

Create a simple assistant agent:

```python
from agents import Agent, Runner

# Create an agent
agent = Agent(
    name="My Assistant",
    instructions="You are a helpful assistant that provides clear, concise answers."
)

# Run the agent
result = Runner.run_sync(agent, "What is Python?")
print(result.final_output)
```

### Step 2: Add Function Tools

Give your agent custom capabilities:

```python
from agents import Agent, Runner, function_tool

@function_tool
def calculate_area(length: float, width: float) -> str:
    """Calculate the area of a rectangle"""
    area = length * width
    return f"The area is {area} square units"

@function_tool
def get_current_time() -> str:
    """Get the current time"""
    from datetime import datetime
    return f"Current time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

# Create agent with tools
agent = Agent(
    name="Calculator Assistant",
    instructions="You are a helpful assistant with calculation and time tools.",
    tools=[calculate_area, get_current_time]
)

# Test the tools
result = Runner.run_sync(agent, "What's the area of a 5x3 rectangle?")
print(result.final_output)

result = Runner.run_sync(agent, "What time is it?")
print(result.final_output)
```

### Step 3: Structured Output

Get structured data from your agent:

```python
from pydantic import BaseModel
from typing import List

class MovieRecommendation(BaseModel):
    title: str
    genre: str
    year: int
    rating: float
    reasons: List[str]

agent = Agent(
    name="Movie Recommender",
    instructions="Recommend movies based on user preferences.",
    output_type=MovieRecommendation
)

result = Runner.run_sync(agent, "Recommend a sci-fi movie from the 2010s")
movie = result.final_output

print(f"Title: {movie.title}")
print(f"Genre: {movie.genre}")
print(f"Year: {movie.year}")
print(f"Rating: {movie.rating}")
print(f"Reasons: {', '.join(movie.reasons)}")
```

## Multi-Agent Setup (10 minutes)

Create a system with multiple specialized agents:

```python
from agents import Agent, Runner

# Create specialist agents
code_agent = Agent(
    name="Code Expert",
    instructions="You are a programming expert. Provide code examples and technical explanations."
)

writing_agent = Agent(
    name="Writing Expert", 
    instructions="You are a writing expert. Help with content creation, editing, and communication."
)

math_agent = Agent(
    name="Math Expert",
    instructions="You are a mathematics expert. Solve problems and explain mathematical concepts."
)

# Create a router agent
router_agent = Agent(
    name="Expert Router",
    instructions="""You are a smart routing agent. Based on the user's question, handoff to the appropriate expert:
    - Programming/coding questions → Code Expert
    - Writing/content questions → Writing Expert  
    - Math/calculation questions → Math Expert
    Always handoff to the most suitable expert.""",
    handoffs=[code_agent, writing_agent, math_agent]
)

# Test the routing
questions = [
    "How do I sort a list in Python?",
    "Help me write a professional email",
    "What's the derivative of x^2?"
]

for question in questions:
    print(f"\nQuestion: {question}")
    result = Runner.run_sync(router_agent, question)
    print(f"Answer: {result.final_output}")
```

## Async Operations (5 minutes)

Handle multiple requests concurrently:

```python
import asyncio
from agents import Agent, Runner

agent = Agent(
    name="Research Assistant",
    instructions="You are a research assistant that provides informative answers."
)

async def run_concurrent_queries():
    # Multiple questions at once
    tasks = [
        Runner.run(agent, "What is machine learning?"),
        Runner.run(agent, "Explain blockchain technology"),
        Runner.run(agent, "What are the benefits of renewable energy?")
    ]
    
    results = await asyncio.gather(*tasks)
    
    for i, result in enumerate(results, 1):
        print(f"\nResult {i}: {result.final_output}")

# Run the async function
asyncio.run(run_concurrent_queries())
```

## Streaming Responses (5 minutes)

Get real-time streaming responses:

```python
import asyncio
from agents import Agent, Runner

agent = Agent(
    name="Story Teller",
    instructions="You are a creative storyteller."
)

async def stream_story():
    print("Streaming story...")
    
    result = Runner.run_streamed(agent, "Tell me a short story about a robot")
    
    async for event in result.stream_events():
        if hasattr(event, 'data') and hasattr(event.data, 'delta'):
            print(event.data.delta, end="", flush=True)
    
    print("\n\nStory complete!")

asyncio.run(stream_story())
```

## Common Patterns

### Pattern 1: Agent with Database Access

```python
@function_tool
def query_database(sql_query: str) -> str:
    """Execute a SQL query (mock implementation)"""
    # In real implementation, connect to your database
    return f"Query results for: {sql_query}"

db_agent = Agent(
    name="Database Agent",
    instructions="You help users query and analyze database information.",
    tools=[query_database]
)
```

### Pattern 2: Agent with API Integration

```python
import requests

@function_tool
def fetch_weather(city: str) -> str:
    """Get weather information for a city"""
    # Mock API call - replace with real weather API
    return f"Weather in {city}: Sunny, 72°F"

@function_tool
def fetch_news(topic: str) -> str:
    """Get latest news on a topic"""
    # Mock API call - replace with real news API
    return f"Latest news on {topic}: [Mock news headlines]"

api_agent = Agent(
    name="API Agent",
    instructions="You provide real-time information using external APIs.",
    tools=[fetch_weather, fetch_news]
)
```

### Pattern 3: Agent with File Operations

```python
@function_tool
def read_file(filename: str) -> str:
    """Read contents of a file"""
    try:
        with open(filename, 'r') as f:
            return f.read()
    except FileNotFoundError:
        return f"File {filename} not found"

@function_tool
def write_file(filename: str, content: str) -> str:
    """Write content to a file"""
    with open(filename, 'w') as f:
        f.write(content)
    return f"Content written to {filename}"

file_agent = Agent(
    name="File Agent",
    instructions="You help users read and write files.",
    tools=[read_file, write_file]
)
```

## Error Handling

Always handle potential errors:

```python
from agents.exceptions import AgentException, MaxTurnsExceeded

try:
    result = Runner.run_sync(agent, "Complex query", max_turns=5)
    print(result.final_output)
except MaxTurnsExceeded:
    print("Agent took too many turns - consider simplifying the query")
except AgentException as e:
    print(f"Agent error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

## Environment Setup

Create a `.env` file for your API key:

```bash
# .env file
OPENAI_API_KEY=sk-your-api-key-here
```

Load it in your Python code:

```python
import os
from dotenv import load_dotenv

load_dotenv()
# API key is now available in os.environ["OPENAI_API_KEY"]
```

## Next Steps

1. **Explore Examples**: Check out `examples.py` for more complex patterns
2. **Read API Reference**: See `api-reference.md` for detailed documentation
3. **Build Your Use Case**: Start with a simple agent and gradually add complexity
4. **Monitor with Tracing**: Use built-in tracing to debug and optimize
5. **Join the Community**: Check GitHub discussions and issues

## Troubleshooting

### Common Issues

1. **Import Error**: Make sure you installed with `pip install openai-agents`
2. **API Key Error**: Ensure your `OPENAI_API_KEY` environment variable is set
3. **Python Version**: Requires Python 3.9+
4. **Dependency Conflicts**: Try creating a fresh virtual environment

### Getting Help

- [GitHub Issues](https://github.com/openai/openai-agents-python/issues)
- [Official Documentation](https://openai.github.io/openai-agents-python/)
- [OpenAI Community](https://community.openai.com/)

## Resources

- [Full Documentation](./README.md)
- [API Reference](./api-reference.md)
- [Code Examples](./examples.py)
- [GitHub Repository](https://github.com/openai/openai-agents-python) 