export type JobStatus =
  | 'queued'
  | 'scripting'
  | 'generating'
  | 'merging'
  | 'qc'
  | 'awaiting_review'
  | 'scheduled'
  | 'posting'
  | 'posted'
  | 'failed'
  | 'skipped';

export type PostMode = 'review' | 'auto';

export type VideoEngine = 'meta_ai' | 'flow';

export interface Product {
  productId: string;
  title: string;
  price: string;
  coverUrl: string;
  images: string[];
  stock: number;
  commission: string;
  category: string;
  shopName: string;
  updatedAt: number;
}

export interface ScriptContent {
  caption: string;
  hashtags: string[];
  voiceoverText: string;
  cta: string;
  signTextSuggestion?: string;
}

export interface Job {
  id: string;
  productId: string;
  productTitle: string;
  batchId?: string;
  roundIndex: number;
  signText: string;
  status: JobStatus;
  targetDurationSeconds: number;
  videoEngine: VideoEngine;
  script?: ScriptContent;
  videoBlobUrl?: string;
  videoSha256?: string;
  scheduleTime?: string;
  scheduleMethod?: 'tiktok_native' | 'internal_queue';
  postMode: PostMode;
  retryCount: number;
  error?: string;
  logs: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SystemSettings {
  deepseekApiKey: string;
  deepseekModel: string;
  deepseekBaseUrl: string;
  defaultPostMode: PostMode;
  allowedTimeWindow: string;
  missedSchedulePolicy: 'ask_first' | 'shift_next' | 'cancel';
  primaryEngine: VideoEngine;
  fallbackEngineEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  videoRetentionDays: number;
  signTextPresets: string[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  jobId?: string;
}
