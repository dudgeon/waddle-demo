export interface Message {
  id: number;
  text: string;
  sender: 'customer' | 'agent';
}
 
export type ActiveStep = string | null; 