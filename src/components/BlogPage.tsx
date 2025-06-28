import ChatServiceDemo from '../../chat-service-demo';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Warning Overlay */}
      <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-95 flex items-center justify-center p-6 md:hidden">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Best Viewed on Desktop
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            This interactive demo is optimized for desktop viewing to provide the best experience. 
            Please visit this page on a desktop or laptop computer.
          </p>
          <button 
            onClick={() => {
              const overlay = document.querySelector('.fixed.inset-0.z-50') as HTMLElement;
              if (overlay) overlay.style.display = 'none';
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium w-full"
          >
            Continue Anyway
          </button>
        </div>
      </div>
      <div className="flex w-full px-2">
        {/* Main Content */}
        <main className="flex-1 px-2 py-12 max-w-none">
          <article className="prose prose-lg max-w-none">
            {/* Article Header */}
            <div className="mb-12">
              <h1 id="waddle-servicing-demo" className="text-5xl font-serif text-gray-900 leading-tight mb-4 font-light">
                "Waddle" Servicing Demo
              </h1>
              <h2 id="demonstrating-hybrid-agentic-tool-calling-and-human-in-the-loop" className="text-2xl font-serif text-gray-600 leading-relaxed mb-8 font-light">
                Demonstrating hybrid agentic tool calling and human in the loop
              </h2>
              <div className="flex items-center space-x-4 text-gray-600 mb-8">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  GD
                </div>
                <div>
                  <p className="font-medium text-gray-900">Geoff Dudgeon</p>
                  <p className="text-sm">June 2025 · 8 min read</p>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="space-y-8 text-gray-700 leading-relaxed">
              <h3 id="context" className="text-3xl font-serif text-gray-900 mt-12 mb-6 font-light">Context</h3>
              
              <p>
                Lots of context.
              </p>

              <h3 id="concepts" className="text-3xl font-serif text-gray-900 mt-12 mb-6 font-light">Concepts</h3>
              
              <p>
                Lots of concepts.
              </p>

              <h3 id="demo" className="text-3xl font-serif text-gray-900 mt-12 mb-6 font-light">Demo</h3>
              
              <p>
                Description of the demo
              </p>

              <ol className="space-y-2 text-gray-700 ml-6 list-decimal">
                <li>Customer Chat UI</li>
                <li>Agentic Runtime/Processing</li>
                <li>Agent Chat UI for HITL</li>
              </ol>

              <h4 id="customer-chat-ui" className="text-2xl font-serif text-gray-900 mt-10 mb-4 font-light">1. Customer Chat UI</h4>
              
              <p>
                Customers can send chat messages to the system and receive responses.
              </p>

              <h4 id="agentic-runtime-processing" className="text-2xl font-serif text-gray-900 mt-10 mb-4 font-light">2. Agentic Runtime/Processing</h4>

              <h5 id="message-ingestion" className="text-xl font-serif text-gray-900 mt-8 mb-3 font-light">Message Ingestion</h5>

              <h5 id="planning-agent" className="text-xl font-serif text-gray-900 mt-8 mb-3 font-light">Planning Agent</h5>

              <h5 id="internally-defined-tools" className="text-xl font-serif text-gray-900 mt-8 mb-3 font-light">Internally Defined Tools</h5>
              
              <p>
                Call APIs directly; encode or reference API business logic directly.
              </p>

              <p>
                API business logic not generally available for use in other agentic systems.
              </p>

              <h5 id="externally-accessed-tools-mcp-servers" className="text-xl font-serif text-gray-900 mt-8 mb-3 font-light">Externally Accessed Tools (i.e. MCP Servers)</h5>
              
              <p>
                External to the agent, may be hosted within the company.
              </p>

              <p>
                External toolsets may be used by multiple agents and applications. In our example, our Waddle Agent is just one of many clients (others could be associate-facing tooling, legacy chatbots, externally hosted IVR providers, etc.)
              </p>

              <h4 id="agent-chat-ui-for-hitl" className="text-2xl font-serif text-gray-900 mt-10 mb-4 font-light">3. Agent Chat UI for HITL</h4>
              
              <p>
                Validate and send responses
              </p>

            </div>
          </article>
        </main>

        {/* Sticky Demo Card */}
        <aside className="w-3/5 pl-2 pr-2">
          <div className="sticky top-0 h-screen flex items-center">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden w-full">
              <div className="min-h-[600px]">
                <ChatServiceDemo />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
} 