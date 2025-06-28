# Waddle Demo

A demo for blended agentic tool calling and human in the loop interactions, now enhanced with the latest OpenAI Agents SDK.

## Overview

This project demonstrates advanced AI agent workflows using the OpenAI Agents SDK, featuring:

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
├── docs/
│   └── openai-agents-sdk/       # OpenAI Agents SDK documentation
│       ├── README.md            # Comprehensive SDK guide
│       ├── quick-start.md       # Quick start tutorial
│       ├── api-reference.md     # API documentation
│       └── examples.py          # Code examples
├── chat-service-demo.tsx        # Main chat service demo component
├── requirements.txt             # Python dependencies
├── test_openai_agents.py        # SDK installation test script
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

### OpenAI Agents SDK (Python)

1. **Install the SDK**:
   ```bash
   pip install openai-agents
   ```

2. **Set your API key**:
   ```bash
   export OPENAI_API_KEY=sk-your-api-key-here
   ```

3. **Test the installation**:
   ```bash
   python test_openai_agents.py
   ```

4. **Run examples**:
   ```bash
   python docs/openai-agents-sdk/examples.py
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
- **Structured outputs** using Pydantic models
- **Async operations** for concurrent processing
- **Streaming responses** for real-time interaction
- **Built-in tracing** for debugging and monitoring

## Documentation

### OpenAI Agents SDK
- [**Quick Start Guide**](docs/openai-agents-sdk/quick-start.md) - Get up and running in 5 minutes
- [**Complete Documentation**](docs/openai-agents-sdk/README.md) - Comprehensive SDK guide
- [**API Reference**](docs/openai-agents-sdk/api-reference.md) - Detailed API documentation
- [**Code Examples**](docs/openai-agents-sdk/examples.py) - Practical usage examples

### External Resources
- [Official OpenAI Agents SDK Docs](https://openai.github.io/openai-agents-python/)
- [GitHub Repository](https://github.com/openai/openai-agents-python)
- [Multi-Agent Portfolio Example](https://cookbook.openai.com/examples/agents_sdk/multi-agent-portfolio-collaboration/multi_agent_portfolio_collaboration)

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

### Python Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
python test_openai_agents.py

# Run examples
python docs/openai-agents-sdk/examples.py
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
- **AI/ML**: OpenAI Agents SDK, GPT-4, Function Calling
- **Python**: Pydantic, AsyncIO, Python 3.9+
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
2. **Python Version**: Requires Python 3.9 or higher
3. **Dependencies**: Try creating a fresh virtual environment
4. **Port Conflicts**: Vite will automatically find an available port

### Getting Help

- Check the [troubleshooting guide](docs/openai-agents-sdk/quick-start.md#troubleshooting)
- Review [GitHub issues](https://github.com/openai/openai-agents-python/issues)
- Join the [OpenAI Community](https://community.openai.com/)

## License

This project is open source. Check individual dependencies for their respective licenses.

## Acknowledgments

- [OpenAI](https://openai.com/) for the Agents SDK
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) teams
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Pydantic](https://pydantic.dev/) for data validation
