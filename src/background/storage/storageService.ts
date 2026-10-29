import { Job } from '../../types';
import { logger } from '../services/logger';

const JOBS_STORAGE_KEY = 'ruayruay_jobs';

export class StorageService {
  private inMemoryJobs: Map<string, Job> = new Map();
  private initialized = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      try {
        const stored = await chrome.storage.local.get(JOBS_STORAGE_KEY);
        const list: Job[] = stored[JOBS_STORAGE_KEY] || [];
        list.forEach((job) => this.inMemoryJobs.set(job.id, job));
        logger.info(`StorageService initialized with ${list.length} persisted jobs.`);
      } catch (err) {
        logger.error(`Failed to load jobs from chrome.storage: ${(err as Error).message}`);
      }
    }
    this.initialized = true;
  }

  public async getAllJobs(): Promise<Job[]> {
    await this.initialize();
    return Array.from(this.inMemoryJobs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public async getJob(id: string): Promise<Job | undefined> {
    await this.initialize();
    return this.inMemoryJobs.get(id);
  }

  public async saveJob(job: Job): Promise<Job> {
    await this.initialize();
    const updated = { ...job, updatedAt: Date.now() };
    this.inMemoryJobs.set(job.id, updated);
    await this.persist();
    return updated;
  }

  public async deleteJob(id: string): Promise<boolean> {
    await this.initialize();
    const deleted = this.inMemoryJobs.delete(id);
    if (deleted) {
      await this.persist();
    }
    return deleted;
  }

  public async clearAllJobs(): Promise<void> {
    await this.initialize();
    this.inMemoryJobs.clear();
    await this.persist();
    logger.info('All jobs cleared from storage.');
  }

  private async persist(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const list = Array.from(this.inMemoryJobs.values());
      await chrome.storage.local.set({ [JOBS_STORAGE_KEY]: list });
    }
  }
}

export const storageService = new StorageService();
