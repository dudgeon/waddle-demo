# Waddle Demo

A demo for blended agentic tool calling and human in the loop interactions, now enhanced with the latest OpenAI Agents SDK (TypeScript).

## Overview

This project demonstrates advanced AI agent workflows using the OpenAI Agents SDK (TypeScript), featuring:

- **Multi-agent collaboration** with specialized agents
- **Function tools** for custom capabilities
- **Structured outputs** using Pydantic models
- **Real-time streaming** responses
- **Built-in tracing** for debugging and monitoring
- **Handoffs** between agents for complex workflows

## Project Structure

```
waddle-demo/
├── src/                          # React/TypeScript frontend
│   ├── components/
│   │   └── BlogPage.tsx         # Main blog page component
│   ├── constants/
│   │   └── flowSteps.ts         # Workflow step definitions
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   └── utils/
│       └── styleHelpers.ts      # Styling utilities
├── chat-service-demo.tsx        # Main chat service demo component
├── test-agents-sdk.ts           # TypeScript SDK installation test
└── package.json                 # Node.js dependencies
```

## Quick Start

### Frontend (React/TypeScript)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **View the demo**:
   Open http://localhost:5174 in your browser

### OpenAI Agents SDK (TypeScript)

1. **Dependencies are already installed**:
   ```bash
   npm install  # Includes @openai/agents
   ```

2. **Set your API key**:
   ```bash
   export OPENAI_API_KEY=sk-your-api-key-here
   ```

3. **Test the installation**:
   ```bash
   npx tsx test-agents-sdk.ts
   ```

## Features

### Frontend Demo
- **Responsive design** with mobile warning overlay
- **Interactive chat interface** with agent workflow visualization
- **Real-time updates** with Vite hot module replacement
- **Modern UI** with Tailwind CSS styling

### OpenAI Agents SDK Integration
- **Multi-agent workflows** with specialized agents
- **Function tools** for custom capabilities
- **Structured outputs** using Zod schemas
- **Async operations** for concurrent processing
- **Streaming responses** for real-time interaction
- **Built-in tracing** for debugging and monitoring

## Documentation

### OpenAI Agents SDK (TypeScript)
- [**Official Documentation**](https://openai.github.io/openai-agents-js/) - Complete TypeScript SDK guide
- [**GitHub Repository**](https://github.com/openai/openai-agents-js) - Source code and examples
- [**Examples Directory**](https://github.com/openai/openai-agents-js/tree/main/examples) - Practical usage examples

### External Resources
- [OpenAI Agents JS Documentation](https://openai.github.io/openai-agents-js/)
- [Multi-Agent Workflows Guide](https://github.com/openai/openai-agents-js/blob/main/AGENTS.md)

## Development

### Frontend Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### TypeScript Development
```bash
# Install dependencies
npm install

# Run tests
npx tsx test-agents-sdk.ts

# Check examples online
open https://github.com/openai/openai-agents-js/tree/main/examples
```

## Environment Variables

Create a `.env` file in the project root:

```bash
# OpenAI API key (required for agents)
OPENAI_API_KEY=sk-your-api-key-here

# Optional tracing configuration
OPENAI_TRACE_ENABLED=true
```

## Key Technologies

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **AI/ML**: OpenAI Agents SDK (TypeScript), GPT-4, Function Calling
- **TypeScript**: Zod, AsyncIO, Node.js 22+
- **Development**: Hot Module Replacement, ESLint, TypeScript

## Use Cases

This demo showcases patterns for:

1. **Customer Support**: Multi-agent triage and specialized responses
2. **Content Creation**: Collaborative writing and editing workflows
3. **Data Analysis**: Structured data extraction and processing
4. **Research**: Multi-step research and analysis workflows
5. **Decision Support**: Expert agent consultation and recommendations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **OpenAI API Key**: Ensure your API key is set correctly
2. **Node.js Version**: Requires Node.js 22 or higher
3. **Dependencies**: Try deleting `node_modules` and running `npm install`
4. **Port Conflicts**: Vite will automatically find an available port

### Backend Development Issues

#### Port Conflicts (EADDRINUSE)
If you encounter "Port 3001 is already in use" errors:

```bash
# Clean up orphaned processes
cd server
npm run dev-clean

# Or manually kill processes
lsof -ti:3001 | xargs kill -9

# Check for running processes
lsof -i:3001
```

#### Environment Variables Not Loading
If the server can't find `OPENAI_API_KEY`:

1. **Check .env file location**: Ensure `.env` is in the project root (not in `server/`)
2. **Verify .env contents**:
   ```bash
   cat .env
   # Should show: OPENAI_API_KEY=sk-...
   ```
3. **Check dotenv configuration**: The server loads `.env` from project root via `dotenv.config({ path: path.join(__dirname, '../../.env') })`

#### Agent Initialization Failures
If the agent fails to initialize:

1. **Test the self-test endpoint**:
   ```bash
   curl http://localhost:3001/api/chat/test
   ```
2. **Check API key format**: Should start with `sk-proj-` or `sk-`
3. **Verify model availability**: Default is `gpt-4o-mini`, override with `AGENT_MODEL` env var
4. **Check server logs**: Look for detailed error messages in console

#### Streaming Issues
If Server-Sent Events (SSE) don't work:

1. **Test non-streaming first**:
   ```bash
   curl -X POST http://localhost:3001/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "test", "sessionId": "test", "stream": false}'
   ```
2. **Test streaming**:
   ```bash
   curl -X POST http://localhost:3001/api/chat \
     -H "Content-Type: application/json" \
     -H "Accept: text/event-stream" \
     -d '{"message": "test", "sessionId": "test", "stream": true}' \
     --no-buffer
   ```

#### Development Workflow
For clean development restarts:

```bash
# Backend
cd server
npm run dev-clean  # Kill orphaned processes
npm run dev        # Start with clean slate

# Frontend (separate terminal)
cd ..
npm run dev
```

#### Health Checks
Monitor backend health:

```bash
# Basic health check
curl http://localhost:3001/health

# Agent self-test
curl http://localhost:3001/api/chat/test
```

## License

This project is open source. Check individual dependencies for their respective licenses.

## Acknowledgments

- [OpenAI](https://openai.com/) for the Agents SDK
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) teams
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Zod](https://zod.dev/) for schema validation
