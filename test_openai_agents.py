#!/usr/bin/env python3
"""
Test script for OpenAI Agents SDK
Verifies installation and basic functionality
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_installation():
    """Test if the OpenAI Agents SDK is properly installed"""
    try:
        from agents import Agent, Runner, function_tool
        print("✅ OpenAI Agents SDK imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Failed to import OpenAI Agents SDK: {e}")
        return False

def test_api_key():
    """Test if OpenAI API key is available"""
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and api_key.startswith("sk-"):
        print("✅ OpenAI API key found")
        return True
    else:
        print("❌ OpenAI API key not found or invalid")
        print("   Please set OPENAI_API_KEY environment variable")
        return False

def test_basic_agent():
    """Test basic agent functionality"""
    try:
        from agents import Agent, Runner
        
        agent = Agent(
            name="Test Agent",
            instructions="You are a test agent. Respond with 'Hello from OpenAI Agents SDK!'"
        )
        
        print("🧪 Testing basic agent...")
        result = Runner.run_sync(agent, "Say hello")
        
        if result and hasattr(result, 'final_output'):
            print(f"✅ Agent responded: {result.final_output}")
            return True
        else:
            print("❌ Agent did not respond properly")
            return False
            
    except Exception as e:
        print(f"❌ Error testing basic agent: {e}")
        return False

def test_function_tools():
    """Test function tools functionality"""
    try:
        from agents import Agent, Runner, function_tool
        
        @function_tool
        def test_function(message: str) -> str:
            """A simple test function"""
            return f"Function received: {message}"
        
        agent = Agent(
            name="Tool Test Agent",
            instructions="Use the test_function tool to process the user's message.",
            tools=[test_function]
        )
        
        print("🧪 Testing function tools...")
        result = Runner.run_sync(agent, "Hello tools!")
        
        if result and hasattr(result, 'final_output'):
            print(f"✅ Tool agent responded: {result.final_output}")
            return True
        else:
            print("❌ Tool agent did not respond properly")
            return False
            
    except Exception as e:
        print(f"❌ Error testing function tools: {e}")
        return False

def test_structured_output():
    """Test structured output functionality"""
    try:
        from agents import Agent, Runner
        from pydantic import BaseModel
        
        class TestResponse(BaseModel):
            message: str
            status: str
        
        agent = Agent(
            name="Structured Test Agent",
            instructions="Respond with a message 'Test successful' and status 'OK'",
            output_type=TestResponse
        )
        
        print("🧪 Testing structured output...")
        result = Runner.run_sync(agent, "Generate a test response")
        
        if result and hasattr(result, 'final_output') and isinstance(result.final_output, TestResponse):
            response = result.final_output
            print(f"✅ Structured response: message='{response.message}', status='{response.status}'")
            return True
        else:
            print("❌ Structured output test failed")
            return False
            
    except Exception as e:
        print(f"❌ Error testing structured output: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing OpenAI Agents SDK Installation\n")
    
    tests = [
        ("Installation", test_installation),
        ("API Key", test_api_key),
        ("Basic Agent", test_basic_agent),
        ("Function Tools", test_function_tools),
        ("Structured Output", test_structured_output)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} test...")
        if test_func():
            passed += 1
        print("-" * 50)
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! OpenAI Agents SDK is ready to use.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the installation and configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 