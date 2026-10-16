import { randomUUID } from 'node:crypto';

const apiUrl = process.env.LEADS_API_URL ?? 'http://localhost:3000/api/leads';
const leadCount = readPositiveInteger('LEAD_COUNT', 100);
const concurrency = Math.min(
  readPositiveInteger('LEAD_CONCURRENCY', 10),
  leadCount,
);
const intervalMs = readNonNegativeInteger('LEAD_INTERVAL_MS', 2_100);
const runId = randomUUID();
const results = new Map();
let nextLeadIndex = 0;

console.log(
  `Sending ${leadCount} lead(s) to ${apiUrl} with concurrency ${concurrency}.`,
);

await Promise.all(Array.from({ length: concurrency }, () => sendLeads()));

const failures = [...results.entries()].filter(
  ([status]) => status < 200 || status >= 300,
);
console.log('Results:');
for (const [status, count] of [...results.entries()].sort(
  ([left], [right]) => left - right,
)) {
  console.log(`  ${status}: ${count}`);
}

if (failures.length > 0) process.exitCode = 1;

async function sendLeads() {
  while (nextLeadIndex < leadCount) {
    const index = nextLeadIndex;
    nextLeadIndex += 1;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `load-${runId}-${index}`,
      },
      body: JSON.stringify(createLead(index)),
    });
    results.set(response.status, (results.get(response.status) ?? 0) + 1);

    if (intervalMs > 0 && nextLeadIndex < leadCount) await delay(intervalMs);
  }
}

function createLead(index) {
  return {
    name: `Load Test Lead ${index + 1}`,
    email: `load-${runId}-${index}@example.com`,
    phone: `+5511${String(index).padStart(8, '0')}`,
    productCode: 'nutralean',
    funnelCode: 'vsl-01',
    affiliateCode: 'affiliate-999',
    source: 'load-script',
    campaign: 'dispatcher-validation',
    utm: {
      source: 'load-script',
      medium: 'api',
      campaign: 'dispatcher-validation',
    },
  };
}

function readPositiveInteger(name, defaultValue) {
  const value = process.env[name];
  if (!value) return defaultValue;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0)
    throw new Error(`${name} must be a positive integer.`);
  return parsed;
}

function readNonNegativeInteger(name, defaultValue) {
  const value = process.env[name];
  if (!value) return defaultValue;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0)
    throw new Error(`${name} must be a non-negative integer.`);
  return parsed;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
