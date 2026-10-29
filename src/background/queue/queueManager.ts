import { Job, JobStatus, PostMode, VideoEngine } from '../../types';
import { StateMachine } from './stateMachine';
import { jobLock } from './jobLock';
import { storageService } from '../storage/storageService';
import { logger } from '../services/logger';

export class QueueManager {
  private isPaused = false;
  private isProcessing = false;

  public async initialize(): Promise<void> {
    await storageService.initialize();
    await this.recoverStaleJobs();
  }

  public async createJob(params: {
    productId: string;
    productTitle: string;
    signText: string;
    videoEngine?: VideoEngine;
    targetDurationSeconds?: number;
    postMode?: PostMode;
    batchId?: string;
    roundIndex?: number;
  }): Promise<Job> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newJob: Job = {
      id,
      productId: params.productId,
      productTitle: params.productTitle,
      batchId: params.batchId,
      roundIndex: params.roundIndex || 1,
      signText: params.signText,
      status: 'queued',
      targetDurationSeconds: params.targetDurationSeconds || 10,
      videoEngine: params.videoEngine || 'meta_ai',
      postMode: params.postMode || 'review',
      retryCount: 0,
      logs: [`${new Date().toLocaleTimeString('th-TH')}: Job created and queued.`],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await storageService.saveJob(newJob);
    logger.info(`Job created: ${newJob.productTitle} (${newJob.id})`, newJob.id);
    return newJob;
  }

  public async transitionJob(jobId: string, to: JobStatus, reason?: string): Promise<Job> {
    const job = await storageService.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const updated = StateMachine.transition(job, to, reason);
    await storageService.saveJob(updated);
    return updated;
  }

  public async getQueue(): Promise<Job[]> {
    return await storageService.getAllJobs();
  }

  public pause(): void {
    this.isPaused = true;
    logger.warn('Queue paused by user.');
  }

  public resume(): void {
    this.isPaused = false;
    logger.info('Queue resumed.');
  }

  public emergencyStop(): void {
    this.isPaused = true;
    jobLock.clearAll();
    logger.warn('EMERGENCY STOP TRIGGERED. All locks cleared and queue halted.');
  }

  public isQueuePaused(): boolean {
    return this.isPaused;
  }

  public async recoverStaleJobs(): Promise<void> {
    const allJobs = await storageService.getAllJobs();
    for (const job of allJobs) {
      if (job.status === 'generating' || job.status === 'scripting') {
        logger.warn(`Recovering interrupted job ${job.id} (was ${job.status}). Resetting to queued.`, job.id);
        const recovered = StateMachine.transition(job, 'queued', 'Crash recovery reset to queued');
        await storageService.saveJob(recovered);
      } else if (job.status === 'posting') {
        logger.warn(`Recovering job ${job.id} stuck in posting. Moving to awaiting_review for manual check.`, job.id);
        const recovered = StateMachine.transition(job, 'awaiting_review', 'Crash recovery moved to review');
        await storageService.saveJob(recovered);
      }
    }
  }
}

export const queueManager = new QueueManager();
