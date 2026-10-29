import { LogEntry } from '../../types';

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 500;

  public log(level: LogEntry['level'], message: string, jobId?: string): LogEntry {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      level,
      message,
      jobId,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    const timeStr = new Date(entry.timestamp).toLocaleTimeString('th-TH');
    const prefix = `[RUAYRUAY ${timeStr}] [${level.toUpperCase()}]`;

    if (level === 'error') {
      console.error(prefix, message, jobId ? `(Job: ${jobId})` : '');
    } else if (level === 'warn') {
      console.warn(prefix, message, jobId ? `(Job: ${jobId})` : '');
    } else {
      console.log(prefix, message, jobId ? `(Job: ${jobId})` : '');
    }

    // Persist logs in chrome storage asynchronously if available
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ ruayruay_logs: this.logs.slice(0, 100) }).catch(() => {});
    }

    return entry;
  }

  public info(message: string, jobId?: string) {
    return this.log('info', message, jobId);
  }

  public warn(message: string, jobId?: string) {
    return this.log('warn', message, jobId);
  }

  public error(message: string, jobId?: string) {
    return this.log('error', message, jobId);
  }

  public success(message: string, jobId?: string) {
    return this.log('success', message, jobId);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clear(): void {
    this.logs = [];
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.remove('ruayruay_logs').catch(() => {});
    }
  }
}

export const logger = new Logger();
