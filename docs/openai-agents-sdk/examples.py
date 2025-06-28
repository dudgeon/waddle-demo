"""
OpenAI Agents SDK Examples
Comprehensive examples demonstrating various usage patterns
"""

import os
import asyncio
from typing import List, Dict, Any
from pydantic import BaseModel
from agents import Agent, Runner, function_tool
from agents.tracing import trace

# Set up environment
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY", "your-api-key-here")

# Example 1: Basic Agent
def basic_agent_example():
    """Simple agent that responds to queries"""
    agent = Agent(
        name="Assistant",
        instructions="You are a helpful assistant that provides clear, concise answers."
    )
    
    result = Runner.run_sync(agent, "Explain what machine learning is in simple terms.")
    print("Basic Agent Response:", result.final_output)

# Example 2: Function Tools
@function_tool
def calculate_tip(bill_amount: float, tip_percentage: float = 15.0) -> str:
    """Calculate tip amount and total bill"""
    tip = bill_amount * (tip_percentage / 100)
    total = bill_amount + tip
    return f"Tip: ${tip:.2f}, Total: ${total:.2f}"

@function_tool
def get_weather_info(city: str, country: str = "US") -> str:
    """Get weather information for a city (mock implementation)"""
    weather_data = {
        "New York": "Sunny, 72°F",
        "London": "Cloudy, 15°C",
        "Tokyo": "Rainy, 20°C",
        "Paris": "Partly cloudy, 18°C"
    }
    return weather_data.get(city, f"Weather data not available for {city}")

def function_tools_example():
    """Agent with custom function tools"""
    agent = Agent(
        name="Utility Agent",
        instructions="You are a helpful assistant with access to utility functions. Use the available tools to help users.",
        tools=[calculate_tip, get_weather_info]
    )
    
    # Test tip calculation
    result1 = Runner.run_sync(agent, "Calculate a 20% tip on a $85 restaurant bill")
    print("Tip Calculation:", result1.final_output)
    
    # Test weather
    result2 = Runner.run_sync(agent, "What's the weather like in Tokyo?")
    print("Weather Info:", result2.final_output)

# Example 3: Structured Output
class TaskAnalysis(BaseModel):
    task_type: str
    complexity: str  # "low", "medium", "high"
    estimated_time: str
    required_skills: List[str]
    priority: str  # "low", "medium", "high"

def structured_output_example():
    """Agent that returns structured data"""
    agent = Agent(
        name="Task Analyzer",
        instructions="Analyze the given task and provide structured information about it.",
        output_type=TaskAnalysis
    )
    
    task = "Build a web application with user authentication, database integration, and real-time notifications"
    result = Runner.run_sync(agent, task)
    
    print("Structured Analysis:")
    print(f"Task Type: {result.final_output.task_type}")
    print(f"Complexity: {result.final_output.complexity}")
    print(f"Time: {result.final_output.estimated_time}")
    print(f"Skills: {', '.join(result.final_output.required_skills)}")
    print(f"Priority: {result.final_output.priority}")

# Example 4: Multi-Agent Handoffs
def multi_agent_handoffs_example():
    """Demonstrate agent handoffs for specialized tasks"""
    
    # Specialized agents
    technical_agent = Agent(
        name="Technical Specialist",
        instructions="You are a technical expert who provides detailed technical explanations and solutions."
    )
    
    creative_agent = Agent(
        name="Creative Specialist", 
        instructions="You are a creative expert who helps with brainstorming, design, and artistic solutions."
    )
    
    business_agent = Agent(
        name="Business Specialist",
        instructions="You are a business expert who provides strategic advice, market analysis, and business solutions."
    )
    
    # Triage agent that routes to specialists
    triage_agent = Agent(
        name="Triage Agent",
        instructions="""You are a smart routing agent. Analyze the user's request and handoff to the appropriate specialist:
        - Technical questions → Technical Specialist
        - Creative/design questions → Creative Specialist  
        - Business/strategy questions → Business Specialist
        Always handoff to the most appropriate specialist.""",
        handoffs=[technical_agent, creative_agent, business_agent]
    )
    
    # Test different types of questions
    questions = [
        "How do I optimize a Python function for better performance?",
        "I need ideas for a logo design for my coffee shop",
        "What's the best pricing strategy for a SaaS product?"
    ]
    
    for question in questions:
        print(f"\nQuestion: {question}")
        result = Runner.run_sync(triage_agent, question)
        print(f"Response: {result.final_output}")

# Example 5: Async Operations
async def async_agent_example():
    """Demonstrate async agent operations"""
    agent = Agent(
        name="Async Agent",
        instructions="You are a helpful assistant that processes requests asynchronously."
    )
    
    # Multiple concurrent requests
    tasks = [
        Runner.run(agent, "What are the benefits of renewable energy?"),
        Runner.run(agent, "Explain quantum computing in simple terms"),
        Runner.run(agent, "What are the key principles of good UI design?")
    ]
    
    results = await asyncio.gather(*tasks)
    
    for i, result in enumerate(results, 1):
        print(f"\nAsync Result {i}: {result.final_output}")

# Example 6: Streaming Responses
async def streaming_example():
    """Demonstrate streaming responses"""
    agent = Agent(
        name="Streaming Agent",
        instructions="You are a helpful assistant that provides detailed explanations."
    )
    
    print("Streaming response:")
    result = Runner.run_streamed(agent, "Write a short story about a robot learning to paint")
    
    async for event in result.stream_events():
        if hasattr(event, 'data') and hasattr(event.data, 'delta'):
            print(event.data.delta, end="", flush=True)
    print()  # New line after streaming

# Example 7: Tracing
async def tracing_example():
    """Demonstrate tracing capabilities"""
    agent = Agent(
        name="Traced Agent",
        instructions="You are a helpful assistant."
    )
    
    with trace("Example Workflow", metadata={"user": "demo"}) as workflow_trace:
        print(f"Trace ID: {workflow_trace.trace_id}")
        
        result = await Runner.run(agent, "Explain the concept of machine learning")
        print(f"Result: {result.final_output}")

# Example 8: Agent with Guardrails (conceptual)
def guardrails_example():
    """Example showing how guardrails might be used"""
    # Note: This is a conceptual example - actual guardrails implementation may vary
    
    agent = Agent(
        name="Safe Agent",
        instructions="You are a helpful assistant that provides safe, appropriate responses.",
        # guardrails would be configured here in actual implementation
    )
    
    # Safe query
    result = Runner.run_sync(agent, "How do I bake a chocolate cake?")
    print("Safe query result:", result.final_output)

# Example 9: Complex Multi-Step Workflow
class ResearchPlan(BaseModel):
    topic: str
    key_questions: List[str]
    research_methods: List[str]
    timeline: str

@function_tool
def search_academic_papers(query: str) -> str:
    """Mock function to search academic papers"""
    return f"Found 15 relevant papers for query: {query}"

@function_tool
def analyze_data(data_description: str) -> str:
    """Mock function to analyze data"""
    return f"Analysis complete for: {data_description}. Key insights: [mock insights]"

def complex_workflow_example():
    """Complex multi-step research workflow"""
    
    # Research planner agent
    planner = Agent(
        name="Research Planner",
        instructions="Create a structured research plan for the given topic.",
        output_type=ResearchPlan
    )
    
    # Research executor agent
    executor = Agent(
        name="Research Executor", 
        instructions="Execute research tasks using available tools.",
        tools=[search_academic_papers, analyze_data]
    )
    
    # Create research plan
    topic = "The impact of artificial intelligence on healthcare outcomes"
    plan_result = Runner.run_sync(planner, f"Create a research plan for: {topic}")
    plan = plan_result.final_output
    
    print("Research Plan:")
    print(f"Topic: {plan.topic}")
    print(f"Key Questions: {plan.key_questions}")
    print(f"Methods: {plan.research_methods}")
    print(f"Timeline: {plan.timeline}")
    
    # Execute research steps
    for question in plan.key_questions[:2]:  # Execute first 2 questions
        result = Runner.run_sync(executor, f"Research this question: {question}")
        print(f"\nResearch Result for '{question}': {result.final_output}")

# Main execution
if __name__ == "__main__":
    print("=== OpenAI Agents SDK Examples ===\n")
    
    # Run synchronous examples
    print("1. Basic Agent Example:")
    basic_agent_example()
    
    print("\n2. Function Tools Example:")
    function_tools_example()
    
    print("\n3. Structured Output Example:")
    structured_output_example()
    
    print("\n4. Multi-Agent Handoffs Example:")
    multi_agent_handoffs_example()
    
    print("\n5. Guardrails Example:")
    guardrails_example()
    
    print("\n6. Complex Workflow Example:")
    complex_workflow_example()
    
    # Run async examples
    print("\n7. Running Async Examples...")
    asyncio.run(async_agent_example())
    
    print("\n8. Running Streaming Example...")
    asyncio.run(streaming_example())
    
    print("\n9. Running Tracing Example...")
    asyncio.run(tracing_example())
    
    print("\n=== Examples Complete ===") 