import React, { useState, useEffect } from 'react';
import { Job } from '../../types';
import { Button } from '../common/Button';

export const SidePanelApp: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 2500);
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

  const handleTogglePause = () => {
    const action = isPaused ? 'RESUME_QUEUE' : 'PAUSE_QUEUE';
    chrome.runtime.sendMessage({ type: action }, () => {
      loadQueue();
    });
  };

  const handleEmergencyStop = () => {
    if (confirm('หยุดฉุกเฉินทุกคิวหรือไม่?')) {
      chrome.runtime.sendMessage({ type: 'EMERGENCY_STOP' }, () => {
        loadQueue();
      });
    }
  };

  const handleOpenDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  };

  const activeJob = jobs.find(
    (j) => j.status === 'scripting' || j.status === 'generating' || j.status === 'merging' || j.status === 'posting'
  );
  const reviewJobs = jobs.filter((j) => j.status === 'awaiting_review');

  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-100 min-h-screen p-4 flex flex-col justify-between select-none">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-xs text-white shadow-md">
              R
            </div>
            <div>
              <div className="font-bold text-xs text-white">RUAYRUAY Quick Control</div>
              <div className="text-[10px] text-indigo-300">Side Panel Controller</div>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/20">
            {isPaused ? '⏸️ พัก' : '🟢 ปกติ'}
          </span>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={isPaused ? 'success' : 'primary'}
            size="sm"
            onClick={handleTogglePause}
            className="w-full"
          >
            {isPaused ? '▶️ ดำเนินการต่อ' : '⏸️ พักคิว'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleEmergencyStop}
            className="w-full"
          >
            🛑 หยุดฉุกเฉิน
          </Button>
        </div>

        {/* Current Active Job Widget */}
        <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-3.5 space-y-2 backdrop-blur-md">
          <div className="flex justify-between items-center text-xs">
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              งานที่กำลังทำ
            </span>
            <span className="text-slate-400 text-[10px]">
              {activeJob ? activeJob.videoEngine : 'ไม่มีงานวิ่ง'}
            </span>
          </div>

          {activeJob ? (
            <div>
              <div className="text-xs font-bold text-white truncate">
                {activeJob.productTitle}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                ป้าย: "{activeJob.signText}"
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden border border-white/10">
                <div
                  className="bg-gradient-to-r from-amber-400 to-indigo-500 h-1.5 rounded-full animate-pulse"
                  style={{ width: '70%' }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs py-1">คิวงานว่าง พร้อมรับงานใหม่</div>
          )}
        </div>

        {/* Review Alert Card */}
        {reviewJobs.length > 0 && (
          <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-3.5 space-y-1.5 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs">
              <span className="text-rose-300 font-bold">👁️ มี {reviewJobs.length} งานรออนุมัติ</span>
              <button
                onClick={handleOpenDashboard}
                className="text-rose-300 underline font-semibold text-[11px]"
              >
                ตรวจใน Dashboard
              </button>
            </div>
            <div className="text-[11px] text-slate-300">
              คลิปสร้างเสร็จแล้ว กรุณาเช็กป้าย A4 ก่อนปล่อยโพสต์
            </div>
          </div>
        )}
      </div>

      {/* Footer Open Dashboard Full Window */}
      <div className="pt-4 border-t border-white/10">
        <Button
          variant="glass"
          size="sm"
          onClick={handleOpenDashboard}
          className="w-full text-xs font-bold text-white hover:text-white"
        >
          🖥️ เปิดหน้าต่าง Dashboard เต็มจอ
        </Button>
      </div>
    </div>
  );
};
