import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../../../types';
import { GlassCard } from '../../common/GlassCard';
import { Button } from '../../common/Button';

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [newPreset, setNewPreset] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (res) => {
      if (res?.success) {
        setSettings(res.settings);
      }
    });
  };

  const handleSave = () => {
    if (!settings) return;
    setSaving(true);
    setSaveMessage('');
    chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', payload: settings }, (res) => {
      setSaving(false);
      if (res?.success) {
        setSaveMessage('บันทึกการตั้งค่าเรียบร้อยแล้ว!');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    });
  };

  const handleTestKey = () => {
    if (!settings?.deepseekApiKey) {
      setTestResult({ success: false, message: 'กรุณากรอก API Key ก่อนทดสอบ' });
      return;
    }
    setTestingKey(true);
    setTestResult(null);

    chrome.runtime.sendMessage(
      {
        type: 'TEST_DEEPSEEK_KEY',
        payload: {
          apiKey: settings.deepseekApiKey,
          model: settings.deepseekModel,
        },
      },
      (res) => {
        setTestingKey(false);
        setTestResult(res);
      }
    );
  };

  const handleAddPreset = () => {
    if (!newPreset.trim() || !settings) return;
    setSettings({
      ...settings,
      signTextPresets: [...settings.signTextPresets, newPreset.trim()],
    });
    setNewPreset('');
  };

  const handleRemovePreset = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      signTextPresets: settings.signTextPresets.filter((_, i) => i !== index),
    });
  };

  if (!settings) {
    return <div className="text-slate-400 text-sm">กำลังโหลดการตั้งค่า...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-white">ตั้งค่าระบบ (Settings)</h2>
          <p className="text-xs text-slate-400 mt-1">
            กำหนดค่า API Key, โหมดการโพสต์, คลังข้อความป้าย A4 และความปลอดภัย
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-xs text-emerald-400 font-semibold animate-pulse">
              {saveMessage}
            </span>
          )}
          <Button variant="success" size="md" onClick={handleSave} loading={saving}>
            💾 บันทึกการตั้งค่า
          </Button>
        </div>
      </div>

      {/* 1. DeepSeek API */}
      <GlassCard className="p-6 space-y-4">
        <h3 className="font-bold text-white border-b border-white/10 pb-2 text-sm flex items-center justify-between">
          <span>1. DeepSeek API Configuration</span>
          <span className="text-[11px] text-indigo-400">สร้างแคปชัน แฮชแท็ก และบทพูด</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              DeepSeek API Key:
            </label>
            <div className="flex gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={settings.deepseekApiKey}
                onChange={(e) => setSettings({ ...settings, deepseekApiKey: e.target.value })}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
              />
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? 'ซ่อน' : 'แสดง'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={handleTestKey}
                loading={testingKey}
              >
                ทดสอบคีย์
              </Button>
            </div>
            {testResult && (
              <div
                className={`mt-2 text-xs p-2.5 rounded-xl border ${
                  testResult.success
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ชื่อโมเดล (Model Identifier):
            </label>
            <input
              type="text"
              value={settings.deepseekModel}
              onChange={(e) => setSettings({ ...settings, deepseekModel: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              ค่าแนะนำ: deepseek-chat (เสถียรที่สุด) หรือ deepseek-flash
            </span>
          </div>
        </div>
      </GlassCard>

      {/* 2. การตั้งเวลาและรอบการโพสต์ */}
      <GlassCard className="p-6 space-y-4">
        <h3 className="font-bold text-white border-b border-white/10 pb-2 text-sm flex items-center justify-between">
          <span>2. การตั้งเวลาและรอบการโพสต์ (กำหนดได้อิสระ ไม่มีโควตาจำกัด)</span>
          <span className="text-[11px] text-emerald-400">User-Defined Rounds</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              โหมดโพสต์เริ่มต้น:
            </label>
            <select
              value={settings.defaultPostMode}
              onChange={(e) =>
                setSettings({ ...settings, defaultPostMode: e.target.value as any })
              }
              className="w-full px-3 py-2 bg-slate-900 border border-white/15 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="review">โหมด A: ตรวจก่อนโพสต์ (Review Mode)</option>
              <option value="auto">โหมด B: โพสต์อัตโนมัติ (Auto Mode)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ช่วงเวลาที่อนุญาตให้โพสต์:
            </label>
            <input
              type="text"
              value={settings.allowedTimeWindow}
              onChange={(e) => setSettings({ ...settings, allowedTimeWindow: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              เช่น "09:00 - 21:00" หรือ "24 ชั่วโมง"
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              เมื่อพลาดเวลาโพสต์:
            </label>
            <select
              value={settings.missedSchedulePolicy}
              onChange={(e) =>
                setSettings({ ...settings, missedSchedulePolicy: e.target.value as any })
              }
              className="w-full px-3 py-2 bg-slate-900 border border-white/15 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="ask_first">ถามผู้ใช้ก่อนเสมอ (Ask First)</option>
              <option value="shift_next">เลื่อนไปเวลาว่างถัดไป</option>
              <option value="cancel">ยกเลิกคลิปนั้น</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* 3. คลังข้อความบนป้าย A4 */}
      <GlassCard className="p-6 space-y-4">
        <h3 className="font-bold text-white border-b border-white/10 pb-2 text-sm flex items-center justify-between">
          <span>3. คลังข้อความบนป้าย A4 (Sign Text Presets)</span>
          <span className="text-[11px] text-indigo-400">
            {settings.signTextPresets.length} ข้อความ
          </span>
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={newPreset}
            onChange={(e) => setNewPreset(e.target.value)}
            placeholder="พิมพ์ข้อความใหม่ เช่น 'โปรเปิดโกดัง!' หรือ 'ล็อตสุดท้าย!'"
            className="flex-1 px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
            onKeyDown={(e) => e.key === 'Enter' && handleAddPreset()}
          />
          <Button variant="secondary" size="md" type="button" onClick={handleAddPreset}>
            + เพิ่มข้อความ
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
          {settings.signTextPresets.map((text, idx) => (
            <div
              key={idx}
              className="glass-card px-3 py-2 rounded-xl text-xs flex justify-between items-center text-slate-200 border border-white/10"
            >
              <span className="truncate mr-2 font-mono">{text}</span>
              <button
                type="button"
                onClick={() => handleRemovePreset(idx)}
                className="text-rose-400 hover:text-rose-300 font-bold px-1"
                title="ลบ"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* 4. การแจ้งเตือน & จัดเก็บ */}
      <GlassCard className="p-6 space-y-4">
        <h3 className="font-bold text-white border-b border-white/10 pb-2 text-sm">
          4. การแจ้งเตือนและพื้นที่จัดเก็บ
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Telegram Bot Token (ไม่บังคับ):
            </label>
            <input
              type="text"
              value={settings.telegramBotToken}
              onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
              placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Telegram Chat ID:
            </label>
            <input
              type="text"
              value={settings.telegramChatId}
              onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
              placeholder="-100xxxxxxxxxx"
              className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
