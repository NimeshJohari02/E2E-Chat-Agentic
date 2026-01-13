import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => {
        const redisHost = process.env.REDIS_HOST;

        if (redisHost) {
          // Dynamic import for Redis store when Redis is configured
          const redisStore = await import('cache-manager-redis-store');
          return {
            store: redisStore.default as any,
            host: redisHost,
            port: parseInt(process.env.REDIS_PORT || '6379'),
            ttl: 300,
          };
        }

        // In-memory cache for local development
        return {
          ttl: 300,
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
