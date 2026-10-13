import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
};

if (!env.JWT_SECRET || env.JWT_SECRET === 'super_secret_jwt_encryption_key_community_platform_2026_change_in_production') {
  if (env.NODE_ENV === 'production') throw new Error('FATAL: Set a unique JWT_SECRET in production.');
  if (!env.JWT_SECRET) console.warn('JWT_SECRET is not set; authentication endpoints will fail until configured.');
}

if (!env.DATABASE_URL && env.NODE_ENV === 'production') throw new Error('FATAL: DATABASE_URL must be defined in production.');
