# Vercel AI Agents Integration

This project implements Vercel's AI Agents infrastructure as described in the [official guide](https://vercel.com/guides/ai-agents). This setup enables AI agents to programmatically create, manage, and deploy projects on Vercel.

## 🚀 Features Implemented

- **Vercel SDK Integration**: TypeScript SDK for deployment management
- **MCP (Model Context Protocol) Server**: Connect AI models to Vercel operations
- **CLI Helper**: Programmatic Vercel CLI operations
- **Fluid Compute Ready**: Optimized for Vercel's next-generation compute platform
- **Claimable Deployments**: Allow users to take ownership of AI-generated deployments

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm i -g vercel`
3. **Vercel Token**: Create a token at [vercel.com/account/tokens](https://vercel.com/account/tokens)

## ⚙️ Environment Setup

Add these variables to your `.env` file:

```bash
# Vercel Configuration for AI Agents
VERCEL_TOKEN=your_vercel_token_here
VERCEL_TEAM_ID=your_team_id_here
VERCEL_PROJECT_ID=your_project_id_here

# MCP Server Configuration
MCP_SERVER_PORT=3001
```

### Getting Your Vercel Credentials

1. **Token**: Go to [Vercel Account Settings > Tokens](https://vercel.com/account/tokens)
2. **Team ID**: Run `vercel teams ls` or check your team URL
3. **Project ID**: Run `vercel inspect <project-name>` or check project settings

## 🔧 MCP Server Setup

The project includes MCP (Model Context Protocol) configuration for Cursor IDE:

### Cursor Configuration

The `.cursor/mcp.json` file is configured to connect to Vercel's MCP server:

```json
{
  "mcpServers": {
    "Vercel": {
      "command": "npx",
      "args": [
        "-y", "--package", "@vercel/sdk",
        "--",
        "mcp", "start",
        "--bearer-token", "${VERCEL_TOKEN}"
      ],
      "env": {
        "VERCEL_TOKEN": "${VERCEL_TOKEN}",
        "VERCEL_TEAM_ID": "${VERCEL_TEAM_ID}"
      }
    }
  }
}
```

### Starting the MCP Server

```bash
# Start MCP server manually
npm run mcp:start

# Or use the integrated Cursor setup (automatic)
```

## 🛠️ Usage Examples

### Basic Deployment

```typescript
import { createAIAgentVercelIntegration } from './src/lib/ai-agent-vercel-integration';

const agent = createAIAgentVercelIntegration();

// Deploy current project
const result = await agent.createAndDeployProject('my-ai-app', 'vite');

if (result.success) {
  console.log('🚀 Deployed:', result.deployment.output);
  console.log('🔗 Claim URL:', result.claimUrl);
}
```

### Project Management

```typescript
// List existing projects
const projects = await agent.manageExistingProjects();
console.log('Projects:', projects.sdkProjects);

// Monitor deployment
const status = await agent.monitorDeployment('deployment-id');
console.log('Status:', status.status);
```

### Environment Variables

```typescript
// Set up environment variables
await agent.setupEnvironmentVariables({
  'API_KEY': 'your-api-key',
  'DATABASE_URL': 'your-db-url'
});
```

### Fluid Compute Setup

```typescript
// Complete setup with fluid compute optimization
const fluidSetup = await agent.setupFluidComputeProject('my-fluid-app', {
  'REDIS_URL': 'your-redis-url'
});

console.log('Recommendations:', fluidSetup.recommendations);
```

## 📜 Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server
npm run dev:vercel       # Start Vercel dev server

# Deployment
npm run deploy           # Deploy to production
npm run deploy:preview   # Deploy preview

# Vercel Management
npm run vercel:link      # Link to existing project
npm run vercel:env       # List environment variables

# MCP Server
npm run mcp:start        # Start MCP server
```

## 🏗️ Architecture

### Core Components

1. **VercelAgent** (`src/lib/vercel-agent.ts`)
   - SDK-based operations
   - Project creation and management
   - Deployment configuration

2. **VercelCLIHelper** (`src/lib/vercel-cli-helper.ts`)
   - CLI-based operations
   - File uploads and deployments
   - Environment variable management

3. **AIAgentVercelIntegration** (`src/lib/ai-agent-vercel-integration.ts`)
   - High-level agent workflows
   - Combined SDK + CLI operations
   - Error handling and logging

### Workflow Patterns

The implementation supports these AI agent patterns from the Vercel guide:

- **Sequential Processing**: Steps executed in order
- **Parallel Processing**: Independent tasks run simultaneously
- **Evaluation/Feedback Loops**: Results checked and improved iteratively
- **Orchestration**: Coordinating multiple components
- **Routing**: Directing work based on context

## 🔒 Security Considerations

1. **Token Security**: Never commit tokens to version control
2. **Environment Isolation**: Use different tokens for development/production
3. **Team Permissions**: Ensure tokens have appropriate scope
4. **Claim URLs**: Validate claim codes before processing

## 🚨 Troubleshooting

### Common Issues

1. **Token Authentication**
   ```bash
   # Verify token works
   vercel whoami --token $VERCEL_TOKEN
   ```

2. **MCP Server Connection**
   ```bash
   # Test MCP server manually
   npx --package @vercel/sdk mcp start --bearer-token $VERCEL_TOKEN
   ```

3. **Deployment Failures**
   ```bash
   # Check build logs
   vercel logs <deployment-url>
   ```

### Debug Mode

Enable debug logging:

```bash
export DEBUG=vercel*
npm run deploy
```

## 🔮 Future Enhancements

Based on the Vercel guide, these features are planned:

- [ ] **Sign in with Vercel**: OAuth integration (private beta)
- [ ] **Advanced MCP Tools**: Custom MCP server extensions
- [ ] **Multi-tenant Deployments**: Team-based agent operations
- [ ] **Analytics Integration**: Performance monitoring for AI-generated apps

## 📚 Additional Resources

- [Vercel AI Agents Guide](https://vercel.com/guides/ai-agents)
- [Vercel SDK Documentation](https://vercel.com/docs/rest-api)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Fluid Compute Documentation](https://vercel.com/docs/functions/fluid-compute)

## 🤝 Contributing

When adding new Vercel AI agent features:

1. Follow the patterns in existing integration files
2. Add appropriate error handling and logging
3. Update this documentation
4. Test with both SDK and CLI approaches
5. Consider MCP server integration

---

*This implementation is based on Vercel's official AI Agents guide and provides a production-ready foundation for building AI-powered deployment workflows.* 