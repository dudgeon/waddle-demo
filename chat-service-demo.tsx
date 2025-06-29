import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, CheckCircle, ArrowDown, Zap, AlertCircle } from 'lucide-react';
import { FLOW_STEPS, TIMING_CONFIG, FlowStep } from './src/constants/flowSteps';
import { getNodeClasses, getIconClasses, getIconBgClasses } from './src/utils/styleHelpers';
import { Message, ActiveStep } from './src/types';
import { startChatStream, closeChatStream } from './src/utils/streamingService';

export default function ChatServiceDemo() {
  const [customerMessages, setCustomerMessages] = useState<Message[]>([
    { id: 1, text: "Hi, I need help with my recent order", sender: 'customer' }
  ]);
  const [agentMessages, setAgentMessages] = useState<Message[]>([]);
  const [customerInput, setCustomerInput] = useState<string>('');
  const [agentInput, setAgentInput] = useState<string>('');
  const [activeStep, setActiveStep] = useState<ActiveStep>(null);
  const [awaitingApproval, setAwaitingApproval] = useState<boolean>(false);
  const [pendingResponse, setPendingResponse] = useState<string>('');
  
  // New state for real streaming integration
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingText, setStreamingText] = useState<string>('');
  const [currentSessionId] = useState<string>(`session-${Date.now()}`);
  const [agentInfo, setAgentInfo] = useState<{ name: string; usage?: any }>({ name: 'waddle-agent' });
  const messageIdCounter = useRef<number>(2);

  // Cleanup streaming connection on unmount
  useEffect(() => {
    return () => {
      closeChatStream();
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const processWithRealAgent = async (message: string) => {
    setIsStreaming(true);
    setStreamingText('');
    setActiveStep('receive');
    
    try {
      // Start the streaming connection
      await startChatStream(message, currentSessionId, {
        onConnected: (data) => {
          console.log('Connected to agent:', data);
          setActiveStep('planning');
        },
        
        onTextDelta: (data) => {
          setStreamingText(prev => prev + data.delta);
          setActiveStep('respond');
        },
        
        onToolCall: (data) => {
          console.log('Tool called:', data);
          // Map tool names to our visual flow
          if (data.name.includes('order') || data.name.includes('db')) {
            setActiveStep('orderdb');
          } else if (data.name.includes('crm') || data.name.includes('customer')) {
            setActiveStep('crm');
          } else {
            setActiveStep('mcp');
          }
        },
        
        onMessageCreated: (data) => {
          console.log('Message created:', data);
        },
        
        onAgentUpdated: (data) => {
          setAgentInfo(prev => ({ ...prev, name: data.agent_name }));
        },
        
        onFinalResult: (data) => {
          console.log('Final result:', data);
          
          // Add the complete response to both message lists
          const finalText = data.final_output || streamingText;
          const newMessage: Message = {
            id: messageIdCounter.current++,
            text: finalText,
            sender: 'agent'
          };
          
          setAgentMessages(prev => [...prev, newMessage]);
          setCustomerMessages(prev => [...prev, newMessage]);
          setAgentInfo(prev => ({ ...prev, usage: data.usage }));
          
          // Show approval workflow for demonstration
          setAwaitingApproval(true);
          setPendingResponse(finalText);
          setActiveStep('approval');
        },
        
        onStreamComplete: (data) => {
          console.log('Stream completed:', data);
          setIsStreaming(false);
          setStreamingText('');
        },
        
        onError: (data) => {
          console.error('Streaming error:', data);
          setIsStreaming(false);
          setActiveStep(null);
          
          // Show error message
          const errorMessage: Message = {
            id: messageIdCounter.current++,
            text: `Error: ${data.error}`,
            sender: 'agent'
          };
          setAgentMessages(prev => [...prev, errorMessage]);
          setCustomerMessages(prev => [...prev, errorMessage]);
        }
      });
      
    } catch (error) {
      console.error('Failed to start streaming:', error);
      setIsStreaming(false);
      setActiveStep(null);
    }
  };

  const handleCustomerSend = () => {
    if (customerInput.trim() && !isStreaming) {
      const newMessage: Message = { 
        id: messageIdCounter.current++, 
        text: customerInput, 
        sender: 'customer' 
      };
      setCustomerMessages([...customerMessages, newMessage]);
      const messageText = customerInput;
      setCustomerInput('');
      processWithRealAgent(messageText);
    }
  };

  const handleAgentSend = () => {
    if (agentInput.trim()) {
      const newMessage: Message = { 
        id: messageIdCounter.current++, 
        text: agentInput, 
        sender: 'agent' 
      };
      setAgentMessages([...agentMessages, newMessage]);
      
      const customerMsg: Message = { 
        id: messageIdCounter.current++, 
        text: agentInput, 
        sender: 'agent' 
      };
      setCustomerMessages([...customerMessages, customerMsg]);
      
      setAgentInput('');
      
      if (awaitingApproval) {
        setAwaitingApproval(false);
        setPendingResponse('');
        setActiveStep(null);
      }
    }
  };

  const handleAgentApproval = (approved: boolean) => {
    if (approved && pendingResponse) {
      setActiveStep('respond');
      setTimeout(() => {
        const agentMsg: Message = { 
          id: messageIdCounter.current++, 
          text: pendingResponse, 
          sender: 'agent' 
        };
        setAgentMessages([...agentMessages, agentMsg]);
        
        const customerMsg: Message = { 
          id: messageIdCounter.current++, 
          text: pendingResponse, 
          sender: 'agent' 
        };
        setCustomerMessages([...customerMessages, customerMsg]);
        
        setAwaitingApproval(false);
        setPendingResponse('');
        setActiveStep(null);
      }, TIMING_CONFIG.RESPONSE_DELAY);
    }
  };

  const FlowNode = ({ step, isActive }: { step: FlowStep; isActive: boolean }) => {
    const Icon = step.icon;

    const getAnchorId = (stepId: string) => {
      const anchorMap: { [key: string]: string } = {
        'receive': 'message-ingestion',
        'planning': 'planning-agent',
        'orderdb': 'internally-defined-tools',
        'crm': 'internally-defined-tools',
        'mcp': 'externally-accessed-tools-mcp-servers',
        'approval': 'agent-chat-ui-for-hitl',
        'respond': 'agent-chat-ui-for-hitl'
      };
      return anchorMap[stepId];
    };

    const anchorId = getAnchorId(step.id);
    const isClickable = !!anchorId;

    return (
      <div 
        className={`${getNodeClasses(step, isActive)} ${isClickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
        onClick={isClickable ? () => scrollToSection(anchorId) : undefined}
      >
        <div className="flex items-start space-x-3">
          <div className={getIconBgClasses(step, isActive)}>
            <Icon className={getIconClasses(step, isActive)} />
          </div>
          <div className="flex-1">
            <div className={`font-medium text-sm ${isClickable ? 'text-blue-600 hover:text-blue-800 hover:underline' : ''}`}>
              {step.label}
            </div>
            {step.description && (
              <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                {step.description}
              </div>
            )}
          </div>
          {isActive && (
            <div className="absolute -right-2 -top-2">
              <div className="relative">
                <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping absolute"></div>
                <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="chat-service-demo-container" className="w-full min-h-[600px] flex bg-gray-50">
      {/* Customer Chat UI */}
      <div id="customer-chat-panel" className="w-[30%] bg-white shadow-xl shadow-purple-100/50 flex flex-col">
        <div id="customer-chat-header" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 shadow-lg cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-colors" onClick={() => scrollToSection('customer-chat-ui')}>
          <h2 className="text-xl font-bold flex items-center">
            <div id="customer-support-icon" className="p-2 bg-white/20 rounded-lg mr-3 backdrop-blur-sm">
              <User className="w-5 h-5" />
            </div>
            Customer Support
          </h2>
          <p id="chat-session-info" className="text-xs text-blue-100 mt-1 ml-12">Chat Session #1234 • Click to learn more</p>
        </div>
        
        <div id="customer-messages-area" className="flex-1 overflow-y-auto p-2 bg-gradient-to-b from-gray-50 to-white">
          <div id="customer-messages-list" className="space-y-2">
            {customerMessages.map((msg) => (
              <div key={msg.id} id={`customer-message-${msg.id}`} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${
                  msg.sender === 'customer' 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'bg-white border border-gray-200 text-gray-800 shadow-md'
                } p-2 rounded-2xl`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'customer' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isStreaming && streamingText && (
              <div id="streaming-response-message" className="flex justify-start">
                <div className="max-w-[80%] bg-white border border-gray-200 text-gray-800 shadow-md p-2 rounded-2xl">
                  <p className="text-sm">{streamingText}</p>
                  <div id="streaming-indicator" className="flex items-center mt-1">
                    <div className="flex space-x-1 mr-2">
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-blue-600">streaming...</span>
                  </div>
                </div>
              </div>
            )}
            {activeStep && !streamingText && (
              <div id="agent-processing-indicator" className="flex justify-start">
                <div className="bg-gray-100 text-gray-600 p-2 rounded-2xl flex items-center shadow-sm">
                  <div className="flex space-x-1 mr-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm">AI Agent is processing...</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div id="customer-input-area" className="p-2 border-t border-gray-100 bg-white">
          <div className="flex space-x-2">
            <input
              id="customer-message-input"
              type="text"
              value={customerInput}
              onChange={(e) => setCustomerInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomerSend()}
              placeholder={isStreaming ? "Agent is responding..." : "Type your message..."}
              disabled={isStreaming}
              className={`flex-1 px-3 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                isStreaming 
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-50 focus:bg-white'
              }`}
            />
            <button
              id="customer-send-button"
              onClick={handleCustomerSend}
              disabled={isStreaming || !customerInput.trim()}
              className={`p-2 rounded-full transition-all ${
                isStreaming || !customerInput.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg transform hover:scale-105'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Agent Runtime Visualization */}
      <div id="agent-runtime-panel" className="w-[40%] bg-gradient-to-br from-purple-50 via-white to-blue-50 shadow-inner flex flex-col">
        <div id="agent-runtime-header" className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-3 shadow-lg cursor-pointer hover:from-purple-700 hover:to-purple-800 transition-colors" onClick={() => scrollToSection('agentic-runtime-processing')}>
          <h2 className="text-xl font-bold flex items-center">
            <div id="agent-runtime-icon" className="p-2 bg-white/20 rounded-lg mr-3 backdrop-blur-sm">
              <Zap className="w-5 h-5" />
            </div>
            Agent Runtime Flow
          </h2>
          <p id="processing-pipeline-info" className="text-xs text-purple-100 mt-1 ml-12">Real-time Processing Pipeline • Click to learn more</p>
        </div>
        
        <div id="flow-steps-container" className="flex-1 overflow-y-auto p-2">
          <div id="flow-steps-list" className="space-y-2 max-w-lg mx-auto">
            {FLOW_STEPS.map((step, index) => (
              <div key={step.id} id={`flow-step-${step.id}`}>
                {step.id !== 'tools' && (
                  <FlowNode 
                    step={step} 
                    isActive={activeStep === step.id}
                  />
                )}
                
                {step.subSteps && (
                  <div className="relative mt-4">
                    {activeStep === 'planning' && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-12">
                        <svg className="w-full h-full" style={{ overflow: 'visible' }}>
                          <path
                            d="M 0,0 Q 0,20 -80,40"
                            fill="none"
                            stroke="rgb(168, 85, 247)"
                            strokeWidth="2"
                            className="animate-pulse"
                            transform="translate(50, 0)"
                          />
                          <path
                            d="M 0,0 L 0,40"
                            fill="none"
                            stroke="rgb(168, 85, 247)"
                            strokeWidth="2"
                            className="animate-pulse"
                            transform="translate(50, 0)"
                          />
                          <path
                            d="M 0,0 Q 0,20 80,40"
                            fill="none"
                            stroke="rgb(168, 85, 247)"
                            strokeWidth="2"
                            className="animate-pulse"
                            transform="translate(50, 0)"
                          />
                        </svg>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-2 relative z-10">
                      {step.subSteps.map((subStep) => (
                        <div key={subStep.id} className="relative">
                          {activeStep === subStep.id && (
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                              <div className="w-0.5 h-8 bg-purple-500"></div>
                            </div>
                          )}
                          <FlowNode 
                            step={subStep} 
                            isActive={activeStep === subStep.id}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {(activeStep === 'orderdb' || activeStep === 'crm' || activeStep === 'mcp') && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-12">
                        <svg className="w-full h-full" style={{ overflow: 'visible' }}>
                          <path
                            d="M -80,0 Q -80,20 0,40"
                            fill="none"
                            stroke="rgb(168, 85, 247)"
                            strokeWidth="2"
                            className="animate-pulse"
                            transform="translate(50, 0)"
                          />
                          <path
                            d="M 0,0 L 0,40"
                            fill="none"
                            stroke="rgb(168, 85, 247)"
                            strokeWidth="2"
                            className="animate-pulse"
                            transform="translate(50, 0)"
                          />
                          <path
                            d="M 80,0 Q 80,20 0,40"
                            fill="none"
                            stroke="rgb(168, 85, 247)"
                            strokeWidth="2"
                            className="animate-pulse"
                            transform="translate(50, 0)"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
                
                {index < FLOW_STEPS.length - 1 && (
                  <div className="flex justify-center my-1">
                    <div className="relative">
                      <ArrowDown className={`w-5 h-5 transition-all duration-500 ${
                        activeStep && FLOW_STEPS.findIndex(s => s.id === activeStep || (s.subSteps && s.subSteps.some(ss => ss.id === activeStep))) >= index
                          ? 'text-purple-500' 
                          : 'text-gray-300'
                      }`} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        

      </div>

      {/* Agent UI */}
      <div id="agent-dashboard-panel" className="w-[30%] bg-white shadow-xl shadow-purple-100/50 flex flex-col">
        <div id="agent-dashboard-header" className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-3 shadow-lg cursor-pointer hover:from-emerald-700 hover:to-green-700 transition-colors" onClick={() => scrollToSection('agent-chat-ui-for-hitl')}>
          <h2 className="text-xl font-bold flex items-center">
            <div id="agent-dashboard-icon" className="p-2 bg-white/20 rounded-lg mr-3 backdrop-blur-sm">
              <Bot className="w-5 h-5" />
            </div>
            Agent Dashboard
          </h2>
          <p id="agent-status-info" className="text-xs text-emerald-100 mt-1 ml-12">Agent: {agentInfo.name} • {isStreaming ? 'Processing...' : 'Ready'} • Click to learn more</p>
        </div>
        
        <div id="agent-messages-area" className="flex-1 overflow-y-auto p-2 bg-gradient-to-b from-gray-50 to-white">
          <div id="agent-messages-list" className="space-y-2">
            {agentMessages.map((msg) => (
              <div key={msg.id} id={`agent-message-${msg.id}`} className="flex justify-start">
                <div className="max-w-[80%] bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 text-gray-800 p-2 rounded-2xl shadow-md">
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {awaitingApproval && (
              <div id="approval-required-panel" className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-5 shadow-xl">
                <div id="approval-header" className="font-bold text-amber-800 mb-3 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Approval Required
                </div>
                <div id="pending-response-preview" className="text-gray-700 mb-4 bg-white/70 p-4 rounded-xl border border-amber-100">
                  {pendingResponse}
                </div>
                <div id="approval-buttons" className="flex space-x-3">
                  <button
                    id="approve-send-button"
                    onClick={() => handleAgentApproval(true)}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center font-medium"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approve & Send
                  </button>
                  <button
                    id="modify-response-button"
                    onClick={() => handleAgentApproval(false)}
                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 font-medium"
                  >
                    Modify Response
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div id="agent-input-area" className="p-4 border-t border-gray-100 bg-white">
          <div className="flex space-x-3">
            <input
              id="agent-message-input"
              type="text"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAgentSend()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            <button
              id="agent-send-button"
              onClick={handleAgentSend}
              className="bg-gradient-to-r from-emerald-500 to-green-500 text-white p-2 rounded-full hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}