import React, { useState } from 'react';
import { OverviewTab } from './tabs/OverviewTab';
import { SettingsTab } from './tabs/SettingsTab';
import { ProductsTab } from './tabs/ProductsTab';
import { Button } from '../common/Button';

export const DashboardApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'queue' | 'review' | 'schedule' | 'settings'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { id: 'overview', label: 'ภาพรวมระบบ', icon: '📊' },
    { id: 'products', label: 'สินค้า Showcase', icon: '🛍️', badge: '48' },
    { id: 'queue', label: 'คิวงานผลิตคลิป', icon: '⚡' },
    { id: 'review', label: 'รออนุมัติ (Review)', icon: '👁️', badge: 'โหมด A' },
    { id: 'schedule', label: 'ตั้งเวลา & Loop', icon: '📅' },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: '⚙️' },
  ];

  const handleEmergencyStop = () => {
    if (confirm('ยืนยันหยุดฉุกเฉินทุกกระบวนการทำงานหรือไม่?')) {
      chrome.runtime.sendMessage({ type: 'EMERGENCY_STOP' }, () => {
        alert('ส่งคำสั่งหยุดฉุกเฉินเรียบร้อยแล้ว ทุกคิวหยุดการทำงานทันที');
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 min-h-screen relative overflow-x-hidden">
      {/* Ambient Lighting Spheres */}
      <div className="fixed top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[130px] pointer-events-none -z-10"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-purple-600/15 blur-[150px] pointer-events-none -z-10"></div>

      {/* Top Glass Header */}
      <header className="bg-white/[0.06] backdrop-blur-md px-6 py-3.5 flex justify-between items-center sticky top-0 z-50 border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-4">
          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-indigo-300 transition flex items-center justify-center text-sm"
            title="เปิด/ปิด Sidebar"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/30">
              R
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wide flex items-center gap-2">
                RUAYRUAY GROUP{' '}
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Glass Edition
                </span>
              </h1>
              <p className="text-xs text-slate-400">TikTok Affiliate Showcase & Auto-Video Studio</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="danger" size="sm" onClick={handleEmergencyStop}>
            🛑 หยุดฉุกเฉิน
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex min-h-[calc(100vh-65px)]">
        {/* Collapsible Glass Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } bg-white/[0.04] backdrop-blur-xl border-r border-white/10 p-4 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out`}
        >
          <div>
            <div className="px-3 py-2 mb-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              {sidebarOpen && <span>เมนูการทำงาน</span>}
              <span className="text-[10px] text-indigo-400">V2.0</span>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600/40 to-violet-600/30 border border-indigo-400/40 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-white/[0.02] border border-transparent text-slate-300 hover:bg-white/[0.08] hover:text-white'
                    }`}
                    title={item.label}
                  >
                    <span className="text-base">{item.icon}</span>
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                    {sidebarOpen && item.badge && (
                      <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/20">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer Info in Sidebar */}
          {sidebarOpen && (
            <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/10 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between items-center">
                <span>สถานะระบบ:</span>
                <span className="text-emerald-400 font-bold">🟢 ทำงานปกติ</span>
              </div>
              <div className="text-[11px] text-slate-500">RUAYRUAY Studio v2.0</div>
            </div>
          )}
        </aside>

        {/* Tab Content Canvas */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'queue' && (
            <div className="p-8 text-center text-slate-400 text-sm glass-card rounded-2xl">
              ⚡ แท็บคิวงานขั้นสูง — มอนิเตอร์ State Machine และ Logs แบบละเอียด
            </div>
          )}
          {activeTab === 'review' && (
            <div className="p-8 text-center text-slate-400 text-sm glass-card rounded-2xl">
              👁️ แท็บรออนุมัติ (Review Mode) — จะเชื่อมต่อเครื่องเล่นวิดีโอ 9:16 ใน Phase 5
            </div>
          )}
          {activeTab === 'schedule' && (
            <div className="p-8 text-center text-slate-400 text-sm glass-card rounded-2xl">
              📅 แท็บตั้งเวลา & Loop — จะพร้อมใช้งานใน Phase 5.5
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
