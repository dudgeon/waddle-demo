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

### Getting Help

- Check the [official documentation](https://openai.github.io/openai-agents-js/)
- Review [GitHub issues](https://github.com/openai/openai-agents-js/issues)
- Join the [OpenAI Community](https://community.openai.com/)

## License

This project is open source. Check individual dependencies for their respective licenses.

## Acknowledgments

- [OpenAI](https://openai.com/) for the Agents SDK
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) teams
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Zod](https://zod.dev/) for schema validation
