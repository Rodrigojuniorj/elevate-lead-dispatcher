import { createHash } from 'node:crypto';

export function hashWebhookApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}
