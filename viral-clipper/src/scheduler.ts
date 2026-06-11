import cron from 'node-cron';
import { config } from './config.js';
import { runPipeline } from './pipeline.js';

let task: cron.ScheduledTask | null = null;

async function tick(): Promise<void> {
  const ts = new Date().toISOString();
  console.log(`\n[scheduler] ${ts} — starting scouting run`);
  try {
    const result = await runPipeline({ draft: true });
    console.log(
      `[scheduler] Done — scouted:${result.scouted} blocked:${result.blocked} ` +
      `submitted:${result.submitted} jobIds:[${result.jobIds.join(',')}]`
    );
  } catch (err) {
    // Never log credential values from errors
    const msg = (err as Error).message.replace(/Bearer \S+/g, 'Bearer [redacted]');
    console.error(`[scheduler] Run failed: ${msg}`);
  }
}

export function startScheduler(): void {
  const interval = config.pipeline.scheduleInterval;
  console.log(`[scheduler] Starting — interval: "${interval}" (scouting + draft only; publishing is always manual)`);

  if (!cron.validate(interval)) {
    throw new Error(`Invalid cron expression: ${interval}`);
  }

  task = cron.schedule(interval, () => { void tick(); });

  console.log('[scheduler] Running initial tick immediately...');
  void tick();

  process.on('SIGINT', () => stopScheduler('SIGINT'));
  process.on('SIGTERM', () => stopScheduler('SIGTERM'));
}

function stopScheduler(signal: string): void {
  console.log(`\n[scheduler] Received ${signal} — stopping gracefully`);
  task?.stop();
  process.exit(0);
}
