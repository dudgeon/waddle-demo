import { Bot, User, Sparkles, Database, Globe, Send, Shield, Eye } from 'lucide-react';

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
    id: 'triage', 
    label: 'Triage Agent', 
    description: 'The Triage Agent serves as the primary customer service interface, analyzing inquiries and using available tools to gather information and resolve customer issues.',
    icon: Sparkles, 
    color: 'purple' 
  },
  { 
    id: 'tools', 
    label: 'Tool Execution', 
    icon: Database, // This won't be used since it has subSteps
    color: 'green',
    subSteps: [
      { id: 'localtool1', label: 'Local Tool 1', icon: Database, color: 'green' },
      { id: 'localtool2', label: 'Local Tool 2', icon: Shield, color: 'green' },
      { id: 'mcp', label: 'MCP Server', icon: Globe, color: 'orange' }
    ]
  },
  { id: 'humanreview', label: 'Human Review', icon: Eye, color: 'red' },
  { id: 'respond', label: 'Send Response', icon: Send, color: 'blue' }
];

export const TIMING_CONFIG = {
  RECEIVE_DELAY: 1000,
  PLANNING_DELAY: 1500,
  TOOL_DELAY: 800,
  RESPONSE_DELAY: 1000
} as const; 