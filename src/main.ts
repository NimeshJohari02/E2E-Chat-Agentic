import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

import { SanitizationPipe } from './common/pipes/sanitization.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation and sanitization
  app.useGlobalPipes(
    new SanitizationPipe(),
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS for frontend development
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001'],
    credentials: true,
  });

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Chatbot Backend API')
    .setDescription(`
## Help & Support Chatbot Backend

A three-tier chatbot system with progressive escalation:
- **L0 (Static Queries)**: FAQ matching with ~40% deflection rate
- **L1 (AI Chatbot)**: Intelligent responses using configurable LLM providers
- **L2 (Agent Handoff)**: Human agent queue management and assignment

### Authentication
- Customer endpoints: Session-based (token in response)
- Agent endpoints: JWT Bearer token (after login)
- Admin endpoints: JWT with admin role

### Error Responses
All errors follow this format:
\`\`\`json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
\`\`\`

### Rate Limits
- Customer endpoints: 100 requests/minute
- Agent endpoints: 200 requests/minute
- Admin endpoints: 50 requests/minute
    `)
    .setVersion('1.0')
    .addTag('FAQ', 'L0 Static Query Engine - FAQ matching and admin management')
    .addTag('Chat', 'L1 AI Chatbot - Conversation and model management')
    .addTag('Agents', 'L2 Agent Handoff - Authentication, queue, and assignment')
    .addTag('Metrics', 'Analytics and Reporting - Dashboard, exports, and reports')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token from /api/v1/agents/login',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3000', 'Local Development')
    .addServer('https://api.yourapp.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Chatbot API Docs',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`
🚀 Application is running on: http://localhost:${port}
📚 Swagger API Docs: http://localhost:${port}/api/docs
📋 API Base URL: http://localhost:${port}/api/v1
  `);
}
bootstrap();
