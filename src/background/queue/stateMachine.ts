import { Job, JobStatus } from '../../types';
import { logger } from '../services/logger';

export const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  queued: ['scripting', 'failed', 'skipped'],
  scripting: ['generating', 'queued', 'failed'],
  generating: ['merging', 'skipped', 'failed'],
  merging: ['qc', 'failed'],
  qc: ['awaiting_review', 'scheduled', 'generating', 'failed'],
  awaiting_review: ['scheduled', 'generating', 'failed'],
  scheduled: ['posting', 'awaiting_review', 'failed'],
  posting: ['posted', 'awaiting_review', 'failed'],
  posted: [],
  failed: ['queued'], // can retry
  skipped: ['queued'], // can retry
};

export class StateMachine {
  public static canTransition(from: JobStatus, to: JobStatus): boolean {
    const allowed = VALID_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  public static transition(job: Job, to: JobStatus, reason?: string): Job {
    if (!this.canTransition(job.status, to)) {
      const errorMsg = `Invalid state transition from "${job.status}" to "${to}" for Job ID ${job.id}`;
      logger.error(errorMsg, job.id);
      throw new Error(errorMsg);
    }

    const logEntry = `Transition [${job.status} -> ${to}]${reason ? `: ${reason}` : ''}`;
    logger.info(logEntry, job.id);

    return {
      ...job,
      status: to,
      logs: [...(job.logs || []), `${new Date().toLocaleTimeString('th-TH')}: ${logEntry}`],
      updatedAt: Date.now(),
    };
  }

  public static isTerminal(status: JobStatus): boolean {
    return status === 'posted' || status === 'failed' || status === 'skipped';
  }
}
