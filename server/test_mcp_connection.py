#!/usr/bin/env python3
"""
Test script to connect to MCP server and discover available tools
"""

import asyncio
import json
import httpx
import logging
from typing import Dict, Any, List

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MCPClient:
    def __init__(self, server_url: str):
        self.server_url = server_url
        self.session_id = None
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def send_request(self, method: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send an MCP request to the server"""
        request_data = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method
        }
        
        if params:
            request_data["params"] = params
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        if self.session_id:
            headers["mcp-session-id"] = self.session_id
        
        logger.info(f"Sending request: {method}")
        logger.debug(f"Request data: {json.dumps(request_data, indent=2)}")
        
        try:
            response = await self.client.post(
                self.server_url,
                json=request_data,
                headers=headers
            )
            
            logger.info(f"Response status: {response.status_code}")
            logger.debug(f"Response headers: {dict(response.headers)}")
            
            # Check for session ID in response headers
            if "mcp-session-id" in response.headers:
                self.session_id = response.headers["mcp-session-id"]
                logger.info(f"Got session ID: {self.session_id}")
            
            if response.status_code == 200:
                response_data = response.json()
                logger.debug(f"Response data: {json.dumps(response_data, indent=2)}")
                return response_data
            else:
                logger.error(f"HTTP error {response.status_code}: {response.text}")
                return {"error": f"HTTP {response.status_code}: {response.text}"}
                
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return {"error": str(e)}
    
    async def initialize(self) -> Dict[str, Any]:
        """Initialize connection with the MCP server"""
        return await self.send_request("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {}
            },
            "clientInfo": {
                "name": "test-mcp-client",
                "version": "1.0.0"
            }
        })
    
    async def list_tools(self) -> Dict[str, Any]:
        """List all available tools from the server"""
        return await self.send_request("tools/list")
    
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any] = None) -> Dict[str, Any]:
        """Call a specific tool"""
        params = {"name": tool_name}
        if arguments:
            params["arguments"] = arguments
        
        return await self.send_request("tools/call", params)

async def test_mcp_server():
    """Test the MCP server connection and discover tools"""
    server_url = "https://mcp.penguinbank.cloud"
    
    print(f"Testing MCP server at: {server_url}")
    print("=" * 50)
    
    async with MCPClient(server_url) as client:
        # Try to initialize
        print("\n1. Initializing connection...")
        init_result = await client.initialize()
        
        if "error" in init_result:
            print(f"❌ Initialization failed: {init_result['error']}")
            return
        
        print("✅ Successfully initialized!")
        if "result" in init_result:
            print(f"Server capabilities: {json.dumps(init_result['result'], indent=2)}")
        
        # List available tools
        print("\n2. Listing available tools...")
        tools_result = await client.list_tools()
        
        if "error" in tools_result:
            print(f"❌ Failed to list tools: {tools_result['error']}")
            return
        
        if "result" not in tools_result or "tools" not in tools_result["result"]:
            print("❌ No tools found in response")
            return
        
        tools = tools_result["result"]["tools"]
        print(f"✅ Found {len(tools)} tools:")
        
        for i, tool in enumerate(tools, 1):
            print(f"\n{i}. Tool: {tool.get('name', 'Unknown')}")
            print(f"   Description: {tool.get('description', 'No description')}")
            
            if "inputSchema" in tool:
                print(f"   Input Schema:")
                schema = tool["inputSchema"]
                if "properties" in schema:
                    for prop_name, prop_details in schema["properties"].items():
                        prop_type = prop_details.get("type", "unknown")
                        prop_desc = prop_details.get("description", "No description")
                        required = prop_name in schema.get("required", [])
                        req_marker = " (required)" if required else " (optional)"
                        print(f"     - {prop_name}: {prop_type}{req_marker} - {prop_desc}")
        
        # Try to call a balance checking tool if available
        print("\n3. Testing balance checking tool...")
        balance_tools = [tool for tool in tools if "balance" in tool.get("name", "").lower()]
        
        if balance_tools:
            balance_tool = balance_tools[0]
            tool_name = balance_tool["name"]
            print(f"   Calling tool: {tool_name}")
            
            # Call without arguments first
            balance_result = await client.call_tool(tool_name)
            
            if "error" in balance_result:
                print(f"❌ Tool call failed: {balance_result['error']}")
            else:
                print("✅ Tool call successful!")
                if "result" in balance_result:
                    print(f"Result: {json.dumps(balance_result['result'], indent=2)}")
        else:
            print("   No balance checking tools found")
        
        print("\n" + "=" * 50)
        print("MCP Server Analysis Complete!")

if __name__ == "__main__":
    asyncio.run(test_mcp_server())