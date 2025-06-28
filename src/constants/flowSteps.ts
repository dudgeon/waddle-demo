import { Bot, User, Sparkles, Database, Globe, Send, Shield } from 'lucide-react';

export interface FlowStep {
  id: string;
  label: string;
  description?: string;
  icon: any;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red';
  subSteps?: FlowStep[];
}

export const FLOW_STEPS: FlowStep[] = [
  { id: 'receive', label: 'Receive Message', icon: Bot, color: 'blue' },
  { 
    id: 'planning', 
    label: 'Planning Agent', 
    description: 'The Planning Agent analyzes the customer inquiry using advanced natural language processing to understand intent, context, and urgency. It determines the optimal workflow path by evaluating available resources and selecting the most appropriate tools and data sources needed to provide a comprehensive response.',
    icon: Sparkles, 
    color: 'purple' 
  },
  { 
    id: 'tools', 
    label: 'Tool Execution', 
    icon: Database, // This won't be used since it has subSteps
    color: 'green',
    subSteps: [
      { id: 'orderdb', label: 'Order Database', icon: Database, color: 'green' },
      { id: 'crm', label: 'Customer CRM', icon: Shield, color: 'green' },
      { id: 'mcp', label: 'MCP Server', icon: Globe, color: 'orange' }
    ]
  },
  { id: 'approval', label: 'Human Approval', icon: User, color: 'red' },
  { id: 'respond', label: 'Send Response', icon: Send, color: 'blue' }
];

export const TIMING_CONFIG = {
  RECEIVE_DELAY: 1000,
  PLANNING_DELAY: 1500,
  TOOL_DELAY: 800,
  RESPONSE_DELAY: 1000
} as const; 