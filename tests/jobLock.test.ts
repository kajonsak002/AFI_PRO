import { describe, it, expect, beforeEach } from 'vitest';
import { JobLock } from '../src/background/queue/jobLock';

describe('JobLock', () => {
  let lock: JobLock;

  beforeEach(() => {
    lock = new JobLock();
  });

  it('acquires and releases lock successfully', () => {
    const acquired = lock.acquire('meta_ai', 'job_101', 12);
    expect(acquired).toBe(true);
    expect(lock.isLocked('meta_ai')).toBe(true);

    lock.release('meta_ai', 'job_101');
    expect(lock.isLocked('meta_ai')).toBe(false);
  });

  it('prevents another job from acquiring locked engine', () => {
    lock.acquire('meta_ai', 'job_101', 12);
    const secondJob = lock.acquire('meta_ai', 'job_102', 14);
    expect(secondJob).toBe(false);
  });

  it('allows same job to re-acquire / refresh its lock', () => {
    lock.acquire('meta_ai', 'job_101', 12);
    const refresh = lock.acquire('meta_ai', 'job_101', 12);
    expect(refresh).toBe(true);
  });

  it('clears all locks on emergency stop', () => {
    lock.acquire('meta_ai', 'job_101');
    lock.acquire('flow', 'job_202');
    expect(lock.isLocked('meta_ai')).toBe(true);
    expect(lock.isLocked('flow')).toBe(true);

    lock.clearAll();
    expect(lock.isLocked('meta_ai')).toBe(false);
    expect(lock.isLocked('flow')).toBe(false);
  });
});
