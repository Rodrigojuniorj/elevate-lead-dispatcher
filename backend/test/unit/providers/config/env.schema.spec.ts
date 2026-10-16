import { describe, expect, it } from 'vitest';
import { envSchema } from '../../../../src/providers/config/env.schema.js';

describe('envSchema', () => {
  it('applies safe defaults to optional environment values', () => {
    const environment = envSchema.parse({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/database',
      REDIS_URL: 'redis://localhost:6379/0',
      JWT_ACCESS_SECRET: 'a-secure-jwt-secret-with-thirty-two-characters',
    });

    expect(environment).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      FRONTEND_URL: 'http://localhost:5173',
      JWT_ACCESS_EXPIRES_IN: '15m',
    });
  });

  it('rejects a missing JWT access secret', () => {
    expect(() => envSchema.parse({ DATABASE_URL: 'postgresql://user:password@localhost:5432/database' })).toThrow();
  });
});
