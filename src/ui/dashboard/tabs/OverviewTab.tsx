import React, { useState, useEffect } from 'react';
import { Job } from '../../../types';
import { GlassCard } from '../../common/GlassCard';
import { Button } from '../../common/Button';
import { StatusBadge } from '../../common/StatusBadge';

export const OverviewTab: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = () => {
    chrome.runtime.sendMessage({ type: 'GET_QUEUE' }, (res) => {
      if (res?.success) {
        setJobs(res.queue || []);
        setIsPaused(res.isPaused);
      }
    });
  };

  const handleCreateMockJob = () => {
    setCreating(true);
    chrome.runtime.sendMessage(
      {
        type: 'CREATE_JOB',
        payload: {
          productId: `${1729000000000000 + Math.floor(Math.random() * 99999999)}`,
          productTitle: 'สบู่วิตามินซีแล็ปโซพ 10 ก้อน 120฿ +ถุงตีฟอง1ใบ',
          signText: 'ล็อตสุดท้าย!',
          videoEngine: 'meta_ai',
          targetDurationSeconds: 10,
          postMode: 'review',
        },
      },
      (res) => {
        setCreating(false);
        if (res?.success) {
          loadQueue();
        }
      }
    );
  };

  const handleTogglePause = () => {
    const action = isPaused ? 'RESUME_QUEUE' : 'PAUSE_QUEUE';
    chrome.runtime.sendMessage({ type: action }, () => {
      loadQueue();
    });
  };

  const activeJobs = jobs.filter(
    (j) => j.status !== 'posted' && j.status !== 'failed' && j.status !== 'skipped'
  );
  const reviewJobs = jobs.filter((j) => j.status === 'awaiting_review');
  const postedJobs = jobs.filter((j) => j.status === 'posted');

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            ภาพรวมระบบ{' '}
            <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-indigo-300 font-normal border border-white/10">
              Glass Edition
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            มอนิเตอร์สถานะการทำงาน แพลตฟอร์ม และคิวงานผลิตคลิปอัตโนมัติ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isPaused ? 'success' : 'danger'}
            size="sm"
            onClick={handleTogglePause}
          >
            {isPaused ? '▶️ ดำเนินการต่อ' : '⏸️ พักคิวชั่วคราว'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateMockJob}
            loading={creating}
          >
            + จำลองสร้างงานทดสอบ
          </Button>
        </div>
      </div>

      {/* 4 Glass Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            งานทั้งหมดในคิว
          </span>
          <div className="text-3xl font-extrabold text-white mt-2">
            {jobs.length} <span className="text-xs font-normal text-slate-400">งาน</span>
          </div>
          <div className="text-xs text-emerald-400 mt-2 font-medium">
            ↑ โพสต์สำเร็จแล้ว {postedJobs.length} คลิป
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            กำลังดำเนินการ
          </span>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">
            {activeJobs.length} <span className="text-xs font-normal text-slate-400">งาน</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 font-medium">
            {isPaused ? 'คิวถูกพักอยู่' : 'คิวทำงานปกติ'}
          </div>
        </GlassCard>

        <GlassCard className="p-5 border-rose-500/30 bg-rose-500/10">
          <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
            รอคุณตรวจอนุมัติ (โหมด A)
          </span>
          <div className="text-3xl font-extrabold text-rose-400 mt-2">
            {reviewJobs.length}{' '}
            <span className="text-xs font-normal text-rose-300/70">คลิป</span>
          </div>
          <div className="text-xs text-rose-300 mt-2 font-medium font-semibold">
            👉 เช็กข้อความป้าย A4 ก่อนโพสต์
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            สินค้าใน Showcase
          </span>
          <div className="text-3xl font-extrabold text-indigo-300 mt-2">
            48 <span className="text-xs font-normal text-slate-400">ชิ้น</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 font-medium">
            ซิงก์ตรงผ่าน Session Cookie
          </div>
        </GlassCard>
      </div>

      {/* Pre-flight Platform Health */}
      <GlassCard className="p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm tracking-wide">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/50"></span>
          สถานะความพร้อมของระบบ (Pre-flight Health)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-500/40"></span>
            <div>
              <div className="text-sm font-bold text-white">TikTok Session</div>
              <div className="text-xs text-emerald-400 font-medium">พร้อมดึง Showcase</div>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-500/40"></span>
            <div>
              <div className="text-sm font-bold text-white">Meta AI Video</div>
              <div className="text-xs text-emerald-400 font-medium">พร้อมสร้างคลิป (10s)</div>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-500/40"></span>
            <div>
              <div className="text-sm font-bold text-white">DeepSeek API</div>
              <div className="text-xs text-emerald-400 font-medium">Client พร้อมทำงาน</div>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-500/40"></span>
            <div>
              <div className="text-sm font-bold text-white">TikTok Studio</div>
              <div className="text-xs text-emerald-400 font-medium">พร้อมปักตะกร้า & โพสต์</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Active Jobs Table */}
      <GlassCard className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-white text-sm">รายการงานในคิว (Active Jobs)</h3>
          <span className="text-xs text-slate-400">อัปเดตอัตโนมัติแบบเรียลไทม์</span>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            ยังไม่มีงานในคิว — สามารถคลิกปุ่ม "+ จำลองสร้างงานทดสอบ" ด้านบนเพื่อทดสอบระบบได้ครับ
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Job ID</th>
                  <th className="py-3 px-4">ชื่อสินค้า</th>
                  <th className="py-3 px-4">ข้อความบนป้าย</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-right">เวลาที่สร้าง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-white/[0.03]">
                    <td className="py-3 px-4 font-mono text-xs text-indigo-300">
                      {job.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white truncate max-w-xs">
                      {job.productTitle}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-amber-300">
                      "{job.signText}"
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-400">
                      {new Date(job.createdAt).toLocaleTimeString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
