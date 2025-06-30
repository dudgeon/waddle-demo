#!/usr/bin/env python3
"""
Test script to connect to MCP server via SSE and discover available tools
"""

import asyncio
import json
import httpx
import logging
from typing import Dict, Any, AsyncGenerator

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MCPSSEClient:
    def __init__(self, server_url: str):
        self.server_url = server_url
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def connect_sse(self) -> AsyncGenerator[str, None]:
        """Connect to the SSE endpoint and yield events"""
        headers = {
            "Accept": "text/event-stream",
            "Cache-Control": "no-cache"
        }
        
        logger.info(f"Connecting to SSE endpoint: {self.server_url}")
        
        async with self.client.stream("GET", self.server_url, headers=headers) as response:
            logger.info(f"SSE Response status: {response.status_code}")
            logger.info(f"SSE Response headers: {dict(response.headers)}")
            
            if response.status_code != 200:
                logger.error(f"Failed to connect to SSE: {response.status_code}")
                return
            
            async for line in response.aiter_lines():
                if line.strip():
                    logger.debug(f"SSE Line: {line}")
                    yield line
    
    async def send_mcp_request(self, method: str, params: Dict[str, Any] = None) -> None:
        """Send an MCP request via POST while maintaining SSE connection"""
        request_data = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method
        }
        
        if params:
            request_data["params"] = params
        
        headers = {
            "Content-Type": "application/json"
        }
        
        logger.info(f"Sending MCP request: {method}")
        
        try:
            response = await self.client.post(
                self.server_url,
                json=request_data,
                headers=headers
            )
            
            logger.info(f"MCP POST Response status: {response.status_code}")
            if response.status_code != 200:
                logger.error(f"MCP POST failed: {response.text}")
        
        except Exception as e:
            logger.error(f"MCP POST request failed: {e}")

async def test_mcp_sse_server():
    """Test the MCP server via SSE connection"""
    server_url = "https://mcp.penguinbank.cloud"
    
    print(f"Testing MCP server via SSE at: {server_url}")
    print("=" * 50)
    
    async with MCPSSEClient(server_url) as client:
        print("\n1. Connecting to SSE endpoint...")
        
        try:
            # Set up a timeout for the SSE connection
            events_received = 0
            max_events = 10
            
            async for event in client.connect_sse():
                events_received += 1
                print(f"Event {events_received}: {event}")
                
                # Try to parse as JSON if it looks like JSON
                if event.strip().startswith('{'):
                    try:
                        event_data = json.loads(event)
                        print(f"Parsed JSON: {json.dumps(event_data, indent=2)}")
                    except json.JSONDecodeError:
                        print(f"Not valid JSON: {event}")
                
                # Stop after receiving some events to avoid infinite loop
                if events_received >= max_events:
                    print(f"Stopping after {max_events} events")
                    break
            
            if events_received == 0:
                print("No events received from SSE connection")
        
        except asyncio.TimeoutError:
            print("SSE connection timed out")
        except Exception as e:
            print(f"SSE connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_mcp_sse_server())