import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL must be configured.'),
  REDIS_URL: z.url('REDIS_URL must be a valid Redis URL.'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must contain at least 32 characters.'),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
});

export type Environment = z.infer<typeof envSchema>;
