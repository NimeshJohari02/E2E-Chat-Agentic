import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const DatabaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'chatbot',
  password: process.env.DB_PASSWORD || 'chatbot_password',
  database: process.env.DB_DATABASE || 'chatbot_db',

  // Entity auto-loading
  autoLoadEntities: true,

  // Synchronize schema in development only
  synchronize: process.env.NODE_ENV !== 'production',

  // Logging configuration
  logging: process.env.NODE_ENV !== 'production' ? ['query', 'error'] : ['error'],

  // Connection pool settings
  extra: {
    max: parseInt(process.env.DB_POOL_SIZE || '10', 10),
  },
};

export default DatabaseConfig;
