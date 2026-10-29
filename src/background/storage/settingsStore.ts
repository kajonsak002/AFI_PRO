import { SystemSettings } from '../../types';

export const DEFAULT_SETTINGS: SystemSettings = {
  deepseekApiKey: '',
  deepseekModel: 'deepseek-chat',
  deepseekBaseUrl: 'https://api.deepseek.com',
  defaultPostMode: 'review',
  allowedTimeWindow: '09:00 - 21:00',
  missedSchedulePolicy: 'ask_first',
  primaryEngine: 'meta_ai',
  fallbackEngineEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  videoRetentionDays: 7,
  signTextPresets: [
    'ล็อตสุดท้าย!',
    'ลดราคาพิเศษ!',
    'ของแท้ 100%!',
    'โปรเปิดโกดัง!',
    'หมดแล้วหมดเลยจ้า!',
    'พร้อมส่งทันที!',
    'คุ้มสุดๆ วันนี้!',
    'จัดส่งฟรีด่วน!',
    'ของดีบอกต่อ!',
    'ราคาโรงงาน!',
    'การันตีความคุ้ม!',
    'รีบกดก่อนหมดสต็อก!'
  ],
};

const SETTINGS_KEY = 'ruayruay_settings';

export class SettingsStore {
  private inMemorySettings: SystemSettings = { ...DEFAULT_SETTINGS };

  public async getSettings(): Promise<SystemSettings> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      try {
        const stored = await chrome.storage.local.get(SETTINGS_KEY);
        if (stored[SETTINGS_KEY]) {
          this.inMemorySettings = { ...DEFAULT_SETTINGS, ...stored[SETTINGS_KEY] };
        }
      } catch (err) {
        console.error('Failed to load settings from chrome.storage', err);
      }
    }
    return { ...this.inMemorySettings };
  }

  public async saveSettings(patch: Partial<SystemSettings>): Promise<SystemSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...patch };
    this.inMemorySettings = updated;

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [SETTINGS_KEY]: updated });
    }

    return { ...updated };
  }

  public async resetToDefaults(): Promise<SystemSettings> {
    this.inMemorySettings = { ...DEFAULT_SETTINGS };
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
    }
    return { ...DEFAULT_SETTINGS };
  }
}

export const settingsStore = new SettingsStore();
