import { describe, it, expect, beforeEach } from 'vitest';
import { SettingsStore, DEFAULT_SETTINGS } from '../src/background/storage/settingsStore';

describe('SettingsStore', () => {
  let store: SettingsStore;

  beforeEach(() => {
    store = new SettingsStore();
  });

  it('loads default settings with 12 sign text presets', async () => {
    const settings = await store.getSettings();
    expect(settings.deepseekModel).toBe('deepseek-chat');
    expect(settings.defaultPostMode).toBe('review');
    expect(settings.signTextPresets.length).toBe(12);
    expect(settings.signTextPresets).toContain('ล็อตสุดท้าย!');
  });

  it('updates and persists settings partially', async () => {
    const updated = await store.saveSettings({
      deepseekApiKey: 'sk-test-key-12345',
      allowedTimeWindow: '24 ชั่วโมง',
    });

    expect(updated.deepseekApiKey).toBe('sk-test-key-12345');
    expect(updated.allowedTimeWindow).toBe('24 ชั่วโมง');
    expect(updated.deepseekModel).toBe('deepseek-chat'); // unchanged default
  });

  it('resets to defaults cleanly', async () => {
    await store.saveSettings({ deepseekApiKey: 'sk-modified' });
    const reset = await store.resetToDefaults();
    expect(reset.deepseekApiKey).toBe('');
    expect(reset.deepseekModel).toBe(DEFAULT_SETTINGS.deepseekModel);
  });
});
