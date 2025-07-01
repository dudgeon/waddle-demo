import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, CheckCircle, ArrowDown, Zap, AlertCircle, Eye } from 'lucide-react';
import { FLOW_STEPS, TIMING_CONFIG, FlowStep } from './src/constants/flowSteps';
import { getNodeClasses, getIconClasses, getIconBgClasses } from './src/utils/styleHelpers';
import { Message, ActiveStep, ActiveSteps } from './src/types';
import { startChatStream, closeChatStream } from './src/utils/streamingService';

export default function ChatServiceDemo() {
  const [customerMessages, setCustomerMessages] = useState<Message[]>([
    { id: 1, text: "Hello! How can I assist you today?", sender: 'agent', source: 'ai' }
  ]);
  const [agentMessages, setAgentMessages] = useState<Message[]>([
    { id: 1, text: "Hello! How can I assist you today?", sender: 'agent', source: 'ai' }
  ]);
  const [customerInput, setCustomerInput] = useState<string>('');
  const [agentInput, setAgentInput] = useState<string>('');
  
  // Activation system: Controls which step in the agent runtime flow is currently active/highlighted
  // The activeStep state activates visual indicators on flow nodes to show real-time processing progress
  // Steps can be activated concurrently: triage can run while tools execute
  // Multiple steps can be active simultaneously
  const [activeSteps, setActiveSteps] = useState<ActiveSteps>([]);
  
  // Helper functions for managing active steps
  const addActiveStep = (step: string) => {
    setActiveSteps(prev => prev.includes(step) ? prev : [...prev, step]);
  };
  
  const removeActiveStep = (step: string) => {
    setActiveSteps(prev => prev.filter(s => s !== step));
  };
  
  const clearAllActiveSteps = () => {
    setActiveSteps([]);
  };
  
  const isStepActive = (step: string) => {
    return activeSteps.includes(step);
  };
  
  // New state for real streaming integration
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingText, setStreamingText] = useState<string>('');
  const [currentSessionId] = useState<string>(`session-${Date.now()}`);
  const [agentInfo, setAgentInfo] = useState<{ name: string; usage?: any }>({ name: 'waddle-agent' });
  const messageIdCounter = useRef<number>(2);
  const customerMessagesEndRef = useRef<HTMLDivElement>(null);
  const agentMessagesEndRef = useRef<HTMLDivElement>(null);
  const [humanReviewEnabled, setHumanReviewEnabled] = useState<boolean>(false);
  const [currentToolName, setCurrentToolName] = useState<string>('');
  const activeStepTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup streaming connection on unmount
  useEffect(() => {
    return () => {
      closeChatStream();
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    customerMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [customerMessages]);

  useEffect(() => {
    agentMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const processWithRealAgent = async (message: string) => {
    setIsStreaming(true);
    setStreamingText('');
    clearAllActiveSteps();
    addActiveStep('receive');
    
    try {
      // Start the streaming connection
      await startChatStream(message, currentSessionId, {
        onConnected: (data) => {
          console.log('Connected to agent:', data);
          // Brief receive step, then activate triage (keep receive active too initially)
          setTimeout(() => {
            addActiveStep('triage');
          }, 300);
        },
        
        onTextDelta: (data) => {
          setStreamingText(prev => prev + data.delta);
          // Activate respond step when text starts streaming
          if (!isStepActive('respond') && !activeStepTimeoutRef.current) {
            activeStepTimeoutRef.current = setTimeout(() => {
              addActiveStep('respond');
              activeStepTimeoutRef.current = null;
            }, 200);
          }
        },
        
        onToolCall: (data) => {
          console.log('Tool called:', data);
          console.log('Tool name:', data.name);
          console.log('Tool data:', data); // Debug: see full data structure
          
          // Map tool names to our visual flow - ADD tools while keeping triage active
          if (data.name.includes('order') || data.name.includes('db')) {
            console.log('Activating Local Tool 1');
            addActiveStep('localtool1');
          } else if (data.name.includes('crm') || data.name.includes('customer')) {
            console.log('Activating Local Tool 2');
            addActiveStep('localtool2');
          } else if (data.event_name === 'tool_called') {
            // For hostedMcpTools and other external tools, check if it's a tool_called event
            // and doesn't match our local tool patterns
            console.log('Activating MCP tool:', data.name);
            console.log('Adding MCP step while keeping triage active');
            addActiveStep('mcp');
            setCurrentToolName(data.name); // Store tool name for MCP only
            console.log('MCP step should now be active alongside triage');
          } else {
            console.log('Unknown tool type, not activating any step:', data.name, 'event:', data.event_name);
          }
          
          // Remove tool steps after execution while keeping triage active
          if (activeStepTimeoutRef.current) {
            clearTimeout(activeStepTimeoutRef.current);
          }
          activeStepTimeoutRef.current = setTimeout(() => {
            // Remove tool steps but keep triage active
            removeActiveStep('localtool1');
            removeActiveStep('localtool2');
            removeActiveStep('mcp');
            setCurrentToolName(''); // Clear tool name
            activeStepTimeoutRef.current = null;
          }, 3000);
        },
        
        onMessageCreated: (data) => {
          console.log('Message created:', data);
        },
        
        onAgentUpdated: (data) => {
          setAgentInfo(prev => ({ ...prev, name: data.agent_name }));
        },
        
        onFinalResult: (data) => {
          console.log('Final result:', data);
          
          // Use streaming text if available, otherwise use final_output
          const finalText = streamingText.trim() || data.final_output || 'No response generated';
          
          if (finalText) {
            const newMessage: Message = {
              id: messageIdCounter.current++,
              text: finalText,
              sender: 'agent',
              source: 'ai'
            };
            
            setAgentMessages(prev => [...prev, newMessage]);
            setCustomerMessages(prev => [...prev, newMessage]);
          }
          
          setAgentInfo(prev => ({ ...prev, usage: data.usage }));
          
          // Complete processing - no approval needed
          // Delay clearing all active steps to allow final visualization
          setTimeout(() => {
            clearAllActiveSteps();
          }, 2000);
        },
        
        onStreamComplete: (data) => {
          console.log('Stream completed:', data);
          setIsStreaming(false);
          setStreamingText('');
          // Clear any pending timeouts and deactivate all steps
          if (activeStepTimeoutRef.current) {
            clearTimeout(activeStepTimeoutRef.current);
            activeStepTimeoutRef.current = null;
          }
          clearAllActiveSteps();
        },
        
        onError: (data) => {
          console.error('Streaming error:', data);
          setIsStreaming(false);
          clearAllActiveSteps();
          
          // Show error message
          const errorMessage: Message = {
            id: messageIdCounter.current++,
            text: `Error: ${data.error}`,
            sender: 'agent',
            source: 'ai'
          };
          setAgentMessages(prev => [...prev, errorMessage]);
          setCustomerMessages(prev => [...prev, errorMessage]);
        }
      });
      
    } catch (error) {
      console.error('Failed to start streaming:', error);
      setIsStreaming(false);
      clearAllActiveSteps();
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
      setAgentMessages([...agentMessages, newMessage]);
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
        sender: 'agent',
        source: 'human' 
      };
      setAgentMessages([...agentMessages, newMessage]);
      
      const customerMsg: Message = { 
        id: messageIdCounter.current++, 
        text: agentInput, 
        sender: 'agent',
        source: 'human' 
      };
      setCustomerMessages([...customerMessages, customerMsg]);
      
      setAgentInput('');
    }
  };


  const FlowNode = ({ step, isActive, isSubStep = false, toolName = '' }: { step: FlowStep; isActive: boolean; isSubStep?: boolean; toolName?: string }) => {
    const Icon = step.icon;

    const getAnchorId = (stepId: string) => {
      const anchorMap: { [key: string]: string } = {
        'receive': 'message-ingestion',
        'triage': 'triage-agent',
        'localtool1': 'internally-defined-tools',
        'localtool2': 'internally-defined-tools',
        'mcp': 'externally-accessed-tools-mcp-servers',
        'approval': 'agent-chat-ui-for-hitl',
        'respond': 'agent-chat-ui-for-hitl'
      };
      return anchorMap[stepId];
    };

    const anchorId = getAnchorId(step.id);
    const isClickable = !!anchorId;

    // Use vertical layout for substeps to prevent text overflow
    if (isSubStep) {
      return (
        <div 
          className={`${getNodeClasses(step, isActive)} ${isClickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
          onClick={isClickable ? () => scrollToSection(anchorId) : undefined}
        >
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className={getIconBgClasses(step, isActive)}>
              <Icon className={getIconClasses(step, isActive)} />
            </div>
            <div className="w-full">
              <div className={`font-medium text-xs leading-tight ${isClickable ? 'text-blue-600 hover:text-blue-800 hover:underline' : ''}`}>
                {step.label}
              </div>
              {step.id === 'mcp' && toolName && isActive && (
                <div className="text-xs text-gray-500 mt-1 italic">
                  {toolName}
                </div>
              )}
            </div>
            {isActive && (
              <div className="absolute -right-1 -top-1">
                <div className="relative">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute"></div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Regular horizontal layout for main steps
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

  const HumanReviewNode = ({ step, isActive }: { step: FlowStep; isActive: boolean }) => {
    return (
      <div className={`${getNodeClasses(step, isActive)} opacity-75`}>
        <div className="flex items-start space-x-3">
          <div className={getIconBgClasses(step, isActive)}>
            <Eye className={getIconClasses(step, isActive)} />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm text-gray-500">
              {step.label}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <label className="inline-flex items-center cursor-not-allowed">
                <input type="checkbox" className="sr-only peer" disabled />
                <div className="relative w-9 h-5 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
                <span className="ml-2 text-xs font-medium text-gray-400">Off</span>
              </label>
              <span className="text-xs text-gray-400 italic">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="chat-service-demo-container" className="w-full h-screen flex bg-gray-50 overflow-hidden">
      {/* Customer Chat UI */}
      <div id="customer-chat-panel" className={`${humanReviewEnabled ? 'w-[30%]' : 'w-[40%]'} bg-white shadow-xl shadow-purple-100/50 flex flex-col h-full overflow-hidden transition-all duration-300`}>
        <div id="customer-chat-header" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 shadow-lg cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-colors sticky top-0 z-10" onClick={() => scrollToSection('customer-chat-ui')}>
          <h2 className="text-xl font-bold flex items-center">
            <div id="customer-support-icon" className="p-2 bg-white/20 rounded-lg mr-3 backdrop-blur-sm">
              <User className="w-4 h-4" />
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
                  <p className="text-xs">{msg.sender === 'agent' ? `${msg.source === 'human' ? '🧑' : '🤖'}: ${msg.text}` : msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'customer' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isStreaming && streamingText && (
              <div id="streaming-response-message" className="flex justify-start">
                <div className="max-w-[80%] bg-white border border-gray-200 text-gray-800 shadow-md p-2 rounded-2xl">
                  <p className="text-xs">🤖: {streamingText}</p>
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
            {activeSteps.length > 0 && !streamingText && (
              <div id="agent-processing-indicator" className="flex justify-start">
                <div className="bg-gray-100 text-gray-600 p-2 rounded-2xl flex items-center shadow-sm">
                  <div className="flex space-x-1 mr-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs">AI Agent is processing...</span>
                </div>
              </div>
            )}
            <div ref={customerMessagesEndRef} />
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
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Agent Runtime Visualization */}
      <div id="agent-runtime-panel" className={`${humanReviewEnabled ? 'w-[40%]' : 'w-[60%]'} bg-gradient-to-br from-purple-50 via-white to-blue-50 shadow-inner flex flex-col h-full overflow-hidden transition-all duration-300`}>
        <div id="agent-runtime-header" className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-3 shadow-lg cursor-pointer hover:from-purple-700 hover:to-purple-800 transition-colors sticky top-0 z-10" onClick={() => scrollToSection('agentic-runtime-processing')}>
          <h2 className="text-xl font-bold flex items-center">
            <div id="agent-runtime-icon" className="p-2 bg-white/20 rounded-lg mr-3 backdrop-blur-sm">
              <Zap className="w-4 h-4" />
            </div>
            Agent Runtime Flow
          </h2>
          <p id="processing-pipeline-info" className="text-xs text-purple-100 mt-1 ml-12">Real-time Processing Pipeline • Click to learn more</p>
        </div>
        
        <div id="flow-steps-container" className="flex-1 overflow-y-auto p-2">
          <div id="flow-steps-list" className="space-y-2 max-w-lg mx-auto">
            {FLOW_STEPS.map((step, index) => (
              <div key={step.id} id={`flow-step-${step.id}`}>
                {step.id === 'humanreview' ? (
                  <HumanReviewNode 
                    step={step} 
                    isActive={isStepActive(step.id)}
                  />
                ) : step.id !== 'tools' ? (
                  <FlowNode 
                    step={step} 
                    isActive={isStepActive(step.id)}
                  />
                ) : null}
                
                {step.subSteps && (
                  <div className="relative mt-4">
                    {isStepActive('triage') && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-12">
                        <svg className="w-full h-full" style={{ overflow: 'visible' }}>
                          <path
                            d="M 0,0 L 0,40"
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
                          {isStepActive(subStep.id) && (
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                              <div className="w-0.5 h-8 bg-purple-500"></div>
                            </div>
                          )}
                          <FlowNode 
                            step={subStep} 
                            isActive={isStepActive(subStep.id)}
                            isSubStep={true}
                            toolName={subStep.id === 'mcp' ? currentToolName : ''}
                          />
                          {subStep.id === 'mcp' && (
                            <div style={{fontSize: '10px', color: 'red', position: 'absolute', top: '-20px', left: '0'}}>
                              Debug: activeSteps={JSON.stringify(activeSteps)}, isActive={isStepActive(subStep.id) ? 'TRUE' : 'FALSE'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {(isStepActive('localtool1') || isStepActive('localtool2') || isStepActive('mcp')) && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-12">
                        <svg className="w-full h-full" style={{ overflow: 'visible' }}>
                          <path
                            d="M 0,0 L 0,40"
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
                        activeSteps.length > 0 && activeSteps.some(stepId => 
                          FLOW_STEPS.findIndex(s => s.id === stepId || (s.subSteps && s.subSteps.some(ss => ss.id === stepId))) >= index
                        )
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
      <div id="agent-dashboard-panel" className={`${humanReviewEnabled ? 'w-[30%]' : 'hidden'} bg-white shadow-xl shadow-purple-100/50 flex flex-col h-full overflow-hidden transition-all duration-300`}>
        <div id="agent-dashboard-header" className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-3 shadow-lg cursor-pointer hover:from-emerald-700 hover:to-green-700 transition-colors sticky top-0 z-10" onClick={() => scrollToSection('agent-chat-ui-for-hitl')}>
          <h2 className="text-xl font-bold flex items-center">
            <div id="agent-dashboard-icon" className="p-2 bg-white/20 rounded-lg mr-3 backdrop-blur-sm">
              <Bot className="w-4 h-4" />
            </div>
            Agent Dashboard
          </h2>
          <p id="agent-status-info" className="text-xs text-emerald-100 mt-1 ml-12">Agent: {agentInfo.name} • {isStreaming ? 'Processing...' : 'Ready'} • Click to learn more</p>
        </div>
        
        <div id="agent-messages-area" className="flex-1 overflow-y-auto p-2 bg-gradient-to-b from-gray-50 to-white">
          <div id="agent-messages-list" className="space-y-2">
            {agentMessages.map((msg) => (
              <div key={msg.id} id={`agent-message-${msg.id}`} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${
                  msg.sender === 'customer' 
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg' 
                    : 'bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 text-gray-800 shadow-md'
                } p-2 rounded-2xl`}>
                  <p className="text-xs">{msg.sender === 'agent' ? `${msg.source === 'human' ? '🧑' : '🤖'}: ${msg.text}` : msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'customer' ? 'text-emerald-100' : 'text-gray-400'}`}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={agentMessagesEndRef} />
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
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}