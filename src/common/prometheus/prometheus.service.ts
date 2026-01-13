import { Injectable, OnModuleInit } from '@nestjs/common';
import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class PrometheusService implements OnModuleInit {
  private readonly registry = new Registry();

  // Custom Metrics
  public readonly activeConversations: Gauge;
  public readonly queueDepth: Gauge;
  public readonly apiRequestDuration: Histogram;
  public readonly messagesProcessed: Counter;

  constructor() {
    // Gauge: Active Conversations
    this.activeConversations = new Gauge({
      name: 'chatbot_active_conversations_total',
      help: 'Number of currently active chat conversations',
      registers: [this.registry],
    });

    // Gauge: Queue Depth
    this.queueDepth = new Gauge({
      name: 'chatbot_queue_depth',
      help: 'Number of customers waiting in queue for agent',
      registers: [this.registry],
    });

    // Histogram: API Request Duration
    this.apiRequestDuration = new Histogram({
      name: 'chatbot_api_request_duration_seconds',
      help: 'Duration of API requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    // Counter: Messages Processed
    this.messagesProcessed = new Counter({
      name: 'chatbot_messages_processed_total',
      help: 'Total number of chat messages processed',
      labelNames: ['type'],
      registers: [this.registry],
    });
  }

  onModuleInit() {
    // Collect default Node.js metrics (CPU, Memory, etc.)
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
