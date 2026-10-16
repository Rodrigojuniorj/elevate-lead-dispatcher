import { spawnSync } from 'node:child_process';

const databaseUrl = process.env.DATABASE_URL_TEST ?? 'postgresql://elevate:elevate@localhost:5432/elevate_lead_dispatcher_test?schema=public';
const command = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
const result = spawnSync(command, ['prisma', 'migrate', 'deploy'], {
  env: { ...process.env, DATABASE_URL: databaseUrl },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
