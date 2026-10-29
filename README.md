# AFI_PRO — TikTok Affiliate Showcase & Auto-Video Studio

ระบบบริหารจัดการดึงสินค้าจาก **TikTok Showcase API**, คิดบทและแคปชันด้วย **DeepSeek API**, สร้างวิดีโอผ่าน **Meta AI / Google Flow**, และโพสต์ลง **TikTok Studio** พร้อมปักตะกร้าสินค้าอัตโนมัติ

---

## 🌟 จุดเด่นของระบบ (Key Features)

1. **สถาปัตยกรรม Chrome Extension Manifest V3:**
   - ใช้งานได้บนเบราว์เซอร์ Google Chrome โดยตรง
   - มีทั้ง **Dashboard เต็มจอ** และ **Side Panel ย่อส่วน** สำหรับควบคุมด่วนข้างจอ
   - ธีม **Glassmorphism (Frosted Glass & Ambient Glow)** ล้ำสมัย สบายตา พร้อมปุ่ม Toggle ย่อ/ขยาย Sidebar

2. **เชื่อมต่อ TikTok Showcase API ผ่าน Session Cookie:**
   - ดึงสินค้าจาก `https://shop.tiktok.com/api/v1/streamer_desktop/showcase_product/list` อัตโนมัติ
   - ปลอดภัย ไม่ต้องคัดลอก Cookie มาแปะในโค้ด
   - มีระบบตรวจสถานะ Session และแจ้งเตือนเมื่อหมดอายุ

3. **ระบบคิวงานและ State Machine ทนทาน:**
   - Finite State Machine: `queued` → `scripting` → `generating` → `merging` → `qc` → `awaiting_review` → `scheduled` → `posting` → `posted`
   - ระบบ Job Lock ป้องกันหลายแท็บสั่งงานชนกัน
   - ระบบ Crash Recovery กู้คืนงานค้างหลังปิดเครื่องหรือ Service Worker หลับ

4. **โหมดการโพสต์ปลอดภัย:**
   - **โหมด A (Review Mode - ค่าเริ่มต้น):** ตรวจเช็กตัวหนังสือบนป้าย A4 และข้อความแคปชันก่อนกดอนุมัติ
   - **โหมด B (Auto Mode):** โพสต์อัตโนมัติเมื่อผ่านเกณฑ์ QC
   - ไม่มีเพดานโควตาบังคับ ผู้ใช้กำหนดจำนวนรอบ (Loop) และความถี่ได้เองอย่างอิสระ

---

## 🛠️ โครงสร้างโปรเจกต์ (Folder Structure)

```
RUAYRUAY_GROUP/
├── docs/                      # เอกสารสถาปัตยกรรม, ข้อกำหนด, และ Mockup
│   ├── REQUIREMENTS.md        # ข้อกำหนดความต้องการระบบ
│   ├── ANALYSIS.md            # วิเคราะห์โค้ดเดิมและจุดอ่อน
│   ├── RISKS.md               # วิเคราะห์ความเสี่ยงและความปลอดภัย
│   ├── ARCHITECTURE.md        # สถาปัตยกรรมระบบและ State Machine
│   ├── UI_MOCKUPS.html        # Glassmorphism Interactive Mockup
│   └── UI_MOCKUPS.md          # รายละเอียดหน้าจอ
├── public/                    # Static Assets & Manifest
│   ├── manifest.json          # Chrome Extension Manifest V3
│   ├── icons/                 # ไอคอนส่วนขยาย
│   └── vendor/ffmpeg/         # FFmpeg WASM Core สำหรับรวมคลิป
├── src/
│   ├── types/                 # TypeScript Interfaces & Types
│   ├── background/            # Service Worker & Background Services
│   │   ├── index.ts           # Central Router
│   │   ├── queue/             # State Machine, Job Lock, Queue Manager
│   │   ├── services/          # Showcase Client, Logger
│   │   └── storage/           # Settings Store, Product Store, Storage Service
│   ├── adapters/              # Browser Automation Adapters
│   │   └── selectorRegistry/  # Selector กลางแยกตามเว็บ (Meta AI, Flow, TikTok)
│   └── ui/                    # Presentation Layer (React + Tailwind)
│       ├── common/            # GlassCard, Button, StatusBadge
│       ├── dashboard/         # Dashboard App, Overview, Products, Settings
│       └── sidepanel/         # Side Panel Quick Controller
├── tests/                     # Unit Tests (Vitest)
└── dist/                      # ผลลัพธ์ Build สำหรับติดตั้งบน Chrome
```

---

## 🚀 วิธีติดตั้งและเริ่มใช้งาน

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันชุดทดสอบ (Unit Tests)
```bash
npm test
```

### 3. คอมไพล์โปรเจกต์ (Build)
```bash
npm run build
```

### 4. ติดตั้งบน Google Chrome
1. เปิดเบราว์เซอร์ Google Chrome ไปที่ `chrome://extensions`
2. เปิดสวิตช์ **Developer mode (โหมดนักพัฒนาซอฟต์แวร์)** ที่มุมขวาบน
3. คลิกปุ่ม **Load unpacked (โหลดส่วนขยายที่คลายไฟล์แล้ว)**
4. เลือกโฟลเดอร์ `dist/` ในโปรเจกต์นี้
5. คลิกที่ไอคอน RUAYRUAY Studio เพื่อเริ่มใช้งานได้ทันที
