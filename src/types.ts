export type User = {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  timestamp: number;
}
