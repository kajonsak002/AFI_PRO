import { logger } from '../services/logger';

export interface LockInfo {
  jobId: string;
  engine: string;
  tabId?: number;
  acquiredAt: number;
}

export class JobLock {
  private activeLocks: Map<string, LockInfo> = new Map();
  private lockTimeoutMs = 20 * 60 * 1000; // 20 minutes max lock duration

  public acquire(engine: string, jobId: string, tabId?: number): boolean {
    const existing = this.activeLocks.get(engine);
    const now = Date.now();

    if (existing) {
      if (existing.jobId === jobId) {
        // Re-acquiring by same job: refresh lock
        existing.acquiredAt = now;
        if (tabId) existing.tabId = tabId;
        return true;
      }

      if (now - existing.acquiredAt < this.lockTimeoutMs) {
        logger.warn(`Engine "${engine}" is locked by Job ${existing.jobId}`, jobId);
        return false;
      } else {
        logger.warn(`Stale lock on "${engine}" expired for Job ${existing.jobId}. Reclaiming.`, jobId);
      }
    }

    this.activeLocks.set(engine, {
      jobId,
      engine,
      tabId,
      acquiredAt: now,
    });

    logger.info(`Lock acquired on "${engine}" by Job ${jobId}`, jobId);
    return true;
  }

  public release(engine: string, jobId: string): void {
    const existing = this.activeLocks.get(engine);
    if (existing && existing.jobId === jobId) {
      this.activeLocks.delete(engine);
      logger.info(`Lock released on "${engine}" by Job ${jobId}`, jobId);
    }
  }

  public isLocked(engine: string): boolean {
    const existing = this.activeLocks.get(engine);
    if (!existing) return false;
    return Date.now() - existing.acquiredAt < this.lockTimeoutMs;
  }

  public getLock(engine: string): LockInfo | undefined {
    return this.activeLocks.get(engine);
  }

  public clearAll(): void {
    this.activeLocks.clear();
    logger.info('All engine locks cleared.');
  }
}

export const jobLock = new JobLock();
