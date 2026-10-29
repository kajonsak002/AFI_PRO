import React from 'react';
import { JobStatus } from '../../types';

interface StatusBadgeProps {
  status: JobStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const configs: Record<JobStatus, { label: string; style: string; dot: string }> = {
    queued: {
      label: 'รอในคิว',
      style: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
      dot: 'bg-slate-400',
    },
    scripting: {
      label: 'DeepSeek คิดบท',
      style: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      dot: 'bg-blue-400 animate-pulse',
    },
    generating: {
      label: 'กำลังเรนเดอร์วิดีโอ',
      style: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      dot: 'bg-amber-400 animate-pulse',
    },
    merging: {
      label: 'กำลังรวมคลิป ffmpeg',
      style: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      dot: 'bg-purple-400 animate-pulse',
    },
    qc: {
      label: 'ตรวจ QC คุณภาพ',
      style: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      dot: 'bg-indigo-400 animate-pulse',
    },
    awaiting_review: {
      label: 'รอตรวจอนุมัติ (โหมด A)',
      style: 'bg-rose-500/20 text-rose-300 border-rose-400/30 font-bold',
      dot: 'bg-rose-400 animate-ping',
    },
    scheduled: {
      label: 'รอถึงเวลาโพสต์',
      style: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
      dot: 'bg-cyan-400',
    },
    posting: {
      label: 'กำลังโพสต์ TikTok',
      style: 'bg-orange-500/20 text-orange-300 border-orange-400/30 font-bold',
      dot: 'bg-orange-400 animate-pulse',
    },
    posted: {
      label: 'โพสต์สำเร็จ',
      style: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 font-bold',
      dot: 'bg-emerald-400',
    },
    failed: {
      label: 'ล้มเหลว',
      style: 'bg-red-500/20 text-red-300 border-red-400/30',
      dot: 'bg-red-500',
    },
    skipped: {
      label: 'ข้ามงาน',
      style: 'bg-zinc-500/20 text-zinc-400 border-zinc-400/30',
      dot: 'bg-zinc-400',
    },
  };

  const current = configs[status] || {
    label: status,
    style: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] border backdrop-blur-sm ${current.style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      <span>{current.label}</span>
    </span>
  );
};
