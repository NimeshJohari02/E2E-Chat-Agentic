import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket, Namespace } from 'socket.io';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SendMessageResult } from './dto/chat.dto';

interface ChatPayload {
  conversationId: string;
  message: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001'],
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Namespace;

  private readonly logger = new Logger(ChatGateway.name);

  // Map to track active connections: socketId -> agentId/userId
  private activeConnections = new Map<string, string>();

  constructor(private readonly jwtService: JwtService) {
    // Start cleanup interval (every 30 seconds)
    setInterval(() => this.cleanupStaleConnections(), 30000);
  }

  async handleConnection(client: Socket) {
    try {
      // Validate token from query or auth header
      const token = this.extractToken(client);
      if (token) {
        // Authenticated Agent connection
        // const payload = this.jwtService.verify(token);
        // this.activeConnections.set(client.id, payload.sub);
        // this.activeConnections.set(client.id, 'agent-123'); // Placeholder
        this.logger.log(`Client connected (Auth): ${client.id}`);
      } else {
        // Anonymous Customer connection
        this.activeConnections.set(client.id, 'guest');
        this.logger.log(`Client connected (Guest): ${client.id}`);
      }
    } catch (error) {
       this.logger.error(`Connection error: ${error instanceof Error ? error.message : 'Unknown'}`);
       client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (this.activeConnections.has(client.id)) {
        this.activeConnections.delete(client.id);
        this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  private cleanupStaleConnections() {
    this.logger.log('Running stale connection cleanup...');
    // In Socket.IO v4 with Namespaces, this.server is a Namespace.
    // The 'sockets' property of a Namespace IS the Map<SocketId, Socket>.
    const sockets = this.server.sockets;

    if (!sockets) {
      this.logger.warn('Socket map not available yet. Skipping cleanup.');
      return;
    }

    // Iterate our internal map
    for (const [socketId] of this.activeConnections) {
        if (!sockets.has(socketId)) {
            this.logger.warn(`Found stale ghost connection: ${socketId}. Removing.`);
            this.activeConnections.delete(socketId);
        }
    }

    this.logger.log(`Active connections count: ${this.activeConnections.size}`);
  }

  // ... (keeping existing message handlers)

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(roomId);
    this.logger.log(`Client ${client.id} joined room: ${roomId}`);
    return { event: 'joined_room', data: roomId };
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(roomId);
    this.logger.log(`Client ${client.id} left room: ${roomId}`);
    return { event: 'left_room', data: roomId };
  }

  @SubscribeMessage('send_message')
  handleMessage(@MessageBody() payload: ChatPayload) {
    // Determine target room (typically conversationId)
    const roomId = payload.conversationId;

    // Broadcast to everyone in the room except sender (or including, depending on FE logic)
    // Here we just broadcast to the room so other agents/users see it
    this.server.to(roomId).emit('new_message', {
        ...payload,
        timestamp: new Date(),
        sender: 'client', // Simplified
    });
  }

  /**
   * Helper to send updates to specific room
   */
  sendToRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1];
    }
    return null;
  }
}

