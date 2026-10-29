import React, { useState, useEffect } from 'react';
import { Product } from '../../../types';
import { GlassCard } from '../../common/GlassCard';
import { Button } from '../../common/Button';

export const ProductsTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [loginStatus, setLoginStatus] = useState<{ loggedIn: boolean; message: string } | null>(
    null
  );
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [batchSuccess, setBatchSuccess] = useState('');

  useEffect(() => {
    checkLogin();
    loadCachedProducts();
  }, []);

  const checkLogin = () => {
    chrome.runtime.sendMessage({ type: 'CHECK_TIKTOK_LOGIN' }, (res) => {
      if (res?.success) {
        setLoginStatus({ loggedIn: res.loggedIn, message: res.message });
      }
    });
  };

  const loadCachedProducts = () => {
    chrome.runtime.sendMessage({ type: 'GET_CACHED_PRODUCTS' }, (res) => {
      if (res?.success) {
        setProducts(res.products || []);
        setCategories(res.categories || []);
      }
    });
  };

  const handleRefreshFromTikTok = () => {
    setLoading(true);
    setSyncStatus('กำลังดึงสินค้าจาก TikTok Shop Showcase API...');
    chrome.runtime.sendMessage(
      { type: 'FETCH_SHOWCASE_PRODUCTS', payload: { pageSize: 20 } },
      (res) => {
        setLoading(false);
        if (res?.success) {
          setSyncStatus(`ดึงสินค้าสำเร็จ ${res.count} รายการ`);
          loadCachedProducts();
          checkLogin();
          setTimeout(() => setSyncStatus(''), 4000);
        } else {
          setSyncStatus(`ล้มเหลว: ${res?.message || 'ไม่ทราบสาเหตุ'}`);
        }
      }
    );
  };

  const toggleSelectAll = (filtered: Product[]) => {
    if (selectedProductIds.size === filtered.length && filtered.length > 0) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filtered.map((p) => p.productId)));
    }
  };

  const toggleSelectProduct = (productId: string) => {
    const next = new Set(selectedProductIds);
    if (next.has(productId)) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    setSelectedProductIds(next);
  };

  const handleCreateBatch = async () => {
    if (selectedProductIds.size === 0) return;
    setCreatingBatch(true);
    setBatchSuccess('');

    const selectedList = products.filter((p) => selectedProductIds.has(p.productId));
    const batchId = `batch_${Date.now()}`;

    let createdCount = 0;
    for (const p of selectedList) {
      await new Promise<void>((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: 'CREATE_JOB',
            payload: {
              productId: p.productId,
              productTitle: p.title,
              signText: 'ล็อตสุดท้าย!',
              videoEngine: 'meta_ai',
              targetDurationSeconds: 10,
              postMode: 'review',
              batchId,
            },
          },
          () => {
            createdCount++;
            resolve();
          }
        );
      });
    }

    setCreatingBatch(false);
    setSelectedProductIds(new Set());
    setBatchSuccess(`สร้างชุดงานสำเร็จ! เพิ่มสินค้า ${createdCount} ชิ้นเข้าคิวผลิตเรียบร้อย`);
    setTimeout(() => setBatchSuccess(''), 5000);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    alert(`คัดลอก Product ID: ${id} เรียบร้อยแล้ว`);
  };

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.productId.includes(search.trim());

    const matchesCategory =
      selectedCategory === 'all' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* TikTok Session Status Banner */}
      {loginStatus && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs backdrop-blur-md ${
            loginStatus.loggedIn
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">{loginStatus.loggedIn ? '🟢' : '🔴'}</span>
            <div>
              <span className="font-bold">
                {loginStatus.loggedIn ? 'TikTok Shop Session พร้อมใช้งาน' : 'ต้องเข้าสู่ระบบ TikTok Shop'}
              </span>
              <p className="text-[11px] opacity-80 mt-0.5">{loginStatus.message}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {!loginStatus.loggedIn && (
              <a
                href="https://shop.tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold transition text-white"
              >
                เปิดหน้าล็อกอิน TikTok Shop
              </a>
            )}
            <button
              onClick={checkLogin}
              className="px-3 py-1 bg-white/5 hover:bg-white/15 rounded-xl text-slate-300 font-semibold"
            >
              ตรวจสถานะใหม่
            </button>
          </div>
        </div>
      )}

      {/* Header and Sync Control */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            สินค้า Showcase (TikTok Shop API)
            <span className="text-xs px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-400/20 font-normal">
              {products.length} รายการในคลัง
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ดึงตรงจาก TikTok Shop Showcase API พร้อมระบบเลือกหลายรายการเพื่อสร้างชุดงานผลิตคลิป
          </p>
        </div>

        <div className="flex items-center gap-3">
          {syncStatus && (
            <span className="text-xs text-indigo-300 font-medium animate-pulse">
              {syncStatus}
            </span>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={handleRefreshFromTikTok}
            loading={loading}
          >
            🔄 รีเฟรชสินค้าจาก TikTok
          </Button>
        </div>
      </div>

      {batchSuccess && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-300 text-xs font-semibold animate-pulse">
          {batchSuccess}
        </div>
      )}

      {/* Floating Multi-Select Banner */}
      {selectedProductIds.size > 0 && (
        <div className="glass-panel p-4 rounded-2xl flex justify-between items-center border-indigo-500/30 bg-indigo-950/60 shadow-xl sticky top-20 z-40">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600/90 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs border border-indigo-400/40">
              เลือกไว้ {selectedProductIds.size} รายการ
            </span>
            <span className="text-xs text-indigo-200">
              สินค้าที่เลือกจะถูกสร้างเป็นชุดงาน (Batch) เพื่อส่งไปคิดบทและสร้างคลิปอัตโนมัติ
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedProductIds(new Set())}
              className="px-3.5 py-1.5 bg-white/5 hover:bg-white/15 text-slate-300 text-xs rounded-xl border border-white/10 transition"
            >
              ล้างการเลือก
            </button>
            <Button
              variant="success"
              size="md"
              onClick={handleCreateBatch}
              loading={creatingBatch}
            >
              ✨ สร้างชุดงาน (Create Batch)
            </Button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <GlassCard className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 ค้นหาชื่อสินค้า หรือ Product ID..."
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-white/15 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-400"
            >
              <option value="all">ทุกหมวดหมู่ ({categories.length})</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-14 text-slate-400 text-xs space-y-2">
            <div className="text-2xl">🛍️</div>
            <div>
              {products.length === 0
                ? 'ยังไม่มีสินค้าในแคช — คลิกปุ่ม "รีเฟรชสินค้าจาก TikTok" ด้านบนเพื่อดึงสินค้าจาก Showcase ครับ'
                : 'ไม่พบสินค้าที่ตรงกับการค้นหา'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 border-b border-white/10 bg-white/[0.02]">
                <tr>
                  <th className="py-3 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedProductIds.size === filteredProducts.length &&
                        filteredProducts.length > 0
                      }
                      onChange={() => toggleSelectAll(filteredProducts)}
                      className="rounded bg-white/10 border-white/20"
                    />
                  </th>
                  <th className="py-3 px-3 w-14">ลำดับ</th>
                  <th className="py-3 px-4">รูปภาพ & ชื่อสินค้า</th>
                  <th className="py-3 px-4">Product ID</th>
                  <th className="py-3 px-4">ราคา / คอมมิชชัน</th>
                  <th className="py-3 px-4">สต็อก</th>
                  <th className="py-3 px-4 text-right">คำสั่งด่วน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((p, idx) => {
                  const isSelected = selectedProductIds.has(p.productId);
                  return (
                    <tr
                      key={p.productId}
                      className={`transition ${
                        isSelected
                          ? 'bg-indigo-600/15'
                          : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(p.productId)}
                          className="rounded bg-white/10 border-white/20"
                        />
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          {p.coverUrl ? (
                            <img
                              src={p.coverUrl}
                              alt={p.title}
                              className="w-12 h-12 rounded-xl object-cover bg-white/10 border border-white/10 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-xs text-slate-400 shrink-0">
                              รูป
                            </div>
                          )}
                          <div className="truncate max-w-sm">
                            <div className="truncate text-xs font-bold">{p.title}</div>
                            <span className="text-[10px] text-indigo-300 font-normal">
                              {p.category} • {p.shopName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
                          <span>{p.productId}</span>
                          <button
                            onClick={() => handleCopyId(p.productId)}
                            className="text-slate-400 hover:text-white text-[11px]"
                            title="คัดลอก Product ID"
                          >
                            📋
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white text-xs">
                        {p.price}{' '}
                        <span className="text-emerald-400 text-[11px] block">
                          คอมมิชชัน: {p.commission}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {p.stock > 0 ? (
                          <span>{p.stock.toLocaleString()} ชิ้น</span>
                        ) : (
                          <span className="text-slate-500">พร้อมขาย</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            chrome.runtime.sendMessage(
                              {
                                type: 'CREATE_JOB',
                                payload: {
                                  productId: p.productId,
                                  productTitle: p.title,
                                  signText: 'ล็อตสุดท้าย!',
                                  videoEngine: 'meta_ai',
                                  targetDurationSeconds: 10,
                                  postMode: 'review',
                                },
                              },
                              () => {
                                alert(`เพิ่ม "${p.title}" เข้าคิวเรียบร้อย!`);
                              }
                            );
                          }}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-[11px] text-indigo-300 font-semibold"
                        >
                          + เข้าคิว
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
