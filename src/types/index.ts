export interface Message {
  id: number;
  text: string;
  sender: 'customer' | 'agent';
  source?: 'ai' | 'human';
}
 
export type ActiveStep = string | null;
export type ActiveSteps = string[]; 