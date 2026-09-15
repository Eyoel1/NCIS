import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'ncis-super-secret-jwt-key-2026',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  nodeEnv: process.env.NODE_ENV || 'development',
};
