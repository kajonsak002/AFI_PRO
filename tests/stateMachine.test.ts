import { describe, it, expect } from 'vitest';
import { StateMachine } from '../src/background/queue/stateMachine';
import { Job } from '../src/types';

describe('StateMachine', () => {
  const mockJob: Job = {
    id: 'test_job_1',
    productId: '12345',
    productTitle: 'Test Product',
    roundIndex: 1,
    signText: 'ล็อตสุดท้าย!',
    status: 'queued',
    targetDurationSeconds: 10,
    videoEngine: 'meta_ai',
    postMode: 'review',
    retryCount: 0,
    logs: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it('allows valid state progression in Mode A (Review)', () => {
    let job = StateMachine.transition(mockJob, 'scripting');
    expect(job.status).toBe('scripting');

    job = StateMachine.transition(job, 'generating');
    expect(job.status).toBe('generating');

    job = StateMachine.transition(job, 'merging');
    expect(job.status).toBe('merging');

    job = StateMachine.transition(job, 'qc');
    expect(job.status).toBe('qc');

    job = StateMachine.transition(job, 'awaiting_review');
    expect(job.status).toBe('awaiting_review');

    job = StateMachine.transition(job, 'scheduled', 'Approved by user');
    expect(job.status).toBe('scheduled');

    job = StateMachine.transition(job, 'posting');
    expect(job.status).toBe('posting');

    job = StateMachine.transition(job, 'posted');
    expect(job.status).toBe('posted');
    expect(StateMachine.isTerminal(job.status)).toBe(true);
  });

  it('rejects illegal state jumping (e.g. queued directly to posted)', () => {
    expect(() => {
      StateMachine.transition(mockJob, 'posted');
    }).toThrow(/Invalid state transition/);
  });

  it('handles posting failure by safely falling back to awaiting_review without auto-resending', () => {
    let job = StateMachine.transition(mockJob, 'scripting');
    job = StateMachine.transition(job, 'generating');
    job = StateMachine.transition(job, 'merging');
    job = StateMachine.transition(job, 'qc');
    job = StateMachine.transition(job, 'scheduled');
    job = StateMachine.transition(job, 'posting');

    // Rule: Posting failure does NOT auto-retry; moves to awaiting_review for manual inspection
    const failedPostingJob = StateMachine.transition(
      job,
      'awaiting_review',
      'TikTok rejected link or network error'
    );
    expect(failedPostingJob.status).toBe('awaiting_review');
  });

  it('allows failed and skipped jobs to be requeued', () => {
    const failedJob: Job = { ...mockJob, status: 'failed' };
    const requeuedJob = StateMachine.transition(failedJob, 'queued', 'User retry');
    expect(requeuedJob.status).toBe('queued');

    const skippedJob: Job = { ...mockJob, status: 'skipped' };
    const requeuedSkippedJob = StateMachine.transition(skippedJob, 'queued', 'User retry');
    expect(requeuedSkippedJob.status).toBe('queued');
  });
});
