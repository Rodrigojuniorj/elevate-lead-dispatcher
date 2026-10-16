import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { IdempotencyKeyPipe } from '../../../../../src/modules/leads/pipes/idempotency-key.pipe.js';

describe('IdempotencyKeyPipe', () => {
  const pipe = new IdempotencyKeyPipe();

  it('trims and returns a valid idempotency key', () => {
    expect(pipe.transform(' lead-create-001 ')).toBe('lead-create-001');
  });

  it.each([undefined, '', ' '.repeat(256)])('rejects an invalid idempotency key', (value) => {
    expect(() => pipe.transform(value)).toThrow(BadRequestException);
  });
});
