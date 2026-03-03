import type { ClientMessage, ServerMessage } from '@bloxcraft/shared';

type MessageHandler = (message: ServerMessage) => void;

export class SocketClient {
  private ws?: WebSocket;
  private handlers: MessageHandler[] = [];

  connect(url: string, name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);
      this.ws.addEventListener('open', () => {
        this.send({ type: 'join', name });
        resolve();
      });
      this.ws.addEventListener('error', () => reject(new Error('WebSocket connection failed')));
      this.ws.addEventListener('message', (event) => {
        const data = JSON.parse(String(event.data)) as ServerMessage;
        this.handlers.forEach((handler) => handler(data));
      });
    });
  }

  onMessage(handler: MessageHandler): void {
    this.handlers.push(handler);
  }

  send(message: ClientMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(message));
  }
}
