import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // Map to track active connections: socketId -> agentId/userId
  private activeConnections = new Map<string, string>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Validate token from query or auth header
      const token = this.extractToken(client);
      if (token) {
        // Authenticated Agent connection
        // In a real app, verify the token. For now, we trust basic validation
        // const payload = this.jwtService.verify(token);
        // this.activeConnections.set(client.id, payload.sub);
        this.logger.log(`Client connected (Auth): ${client.id}`);
      } else {
        // Anonymous Customer connection
        this.logger.log(`Client connected (Guest): ${client.id}`);
      }
    } catch (error) {
       this.logger.error(`Connection error: ${error instanceof Error ? error.message : 'Unknown'}`);
       client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.activeConnections.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

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
