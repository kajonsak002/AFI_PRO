# เอกสารการวิเคราะห์ระบบเดิมและจุดอ่อน (System & Codebase Analysis)
**โครงการ:** RUAYRUAY GROUP — TikTok Affiliate Showcase & Auto-Video Studio  
**เวอร์ชันอ้างอิง:** JarbLand AutoFlow V5.7.59 (`c:\Users\USER\Downloads\jarbland-autoflow-v5.7.59`)  
**วันที่บันทึก:** 2026-10-29  

---

## 1. บทสรุปภาพรวมและรายการไฟล์เดิม (Codebase Inventory)

ระบบเดิมเป็น Chrome Extension (Manifest V3) ที่พัฒนาผ่านการแก้ไขปัญหาเฉพาะหน้ากับหน้าเว็บจริงหลายสิบเวอร์ชัน (ตั้งแต่ V3.6 จนถึง V5.7.59) โดยมีจุดแข็งคือ **ตรรกะการแก้ปัญหา DOM ในสถานการณ์จริง (Edge Cases)** แต่มีจุดอ่อนร้ายแรงด้านสถาปัตยกรรม (Monolithic File, Hardcoded Selectors, Spaghetti CSS, และระบบ License ที่ไม่จำเป็น)

### 1.1 สรุปการแยกแยะไฟล์เดิม (Strangler Migration Plan)

```
[ โค้ดเดิมใน jarbland-autoflow-v5.7.59 ]
 ├── flow-bot.js (113 KB) -----------> PORT -> FlowAdapter + SelectorRegistry
 ├── meta-ai-bot.js (20 KB) ---------> PORT -> MetaAiAdapter + SelectorRegistry
 ├── tiktok-post-bot.js (78 KB) -----> PORT -> TikTokStudioAdapter + SelectorRegistry
 ├── merge-v3.js + worker (11 KB) ----> PORT -> VideoMergeService (ffmpeg.wasm)
 ├── vendor/ffmpeg/ (32 MB wasm) ------> KEEP -> vendor/ffmpeg/
 ├── background.js (205 KB) ---------> REFACTOR -> QueueManager, JobLock, Storage, Alarms
 ├── chatgpt-bot.js (72 KB) ----------> REPLACE -> DeepSeekClient (API-based)
 ├── products.js / popup.js ---------> REPLACE -> ShowcaseApiClient (Session Cookie)
 ├── activate.* / license-* ---------> DISCARD (ตัดทิ้ง 100%)
 └── *.css / *.html (Neon UI) --------> DISCARD (ออกแบบใหม่ด้วย Tailwind + React)
```

---

## 2. ตารางวิเคราะห์การ Port, ปรับปรุง, และตัดทิ้งอย่างละเอียด

| โมดูล / ไฟล์เดิม | ขนาด / บทบาท | แนวทางจัดการ | รายละเอียดการดัดแปลงและสิ่งที่ต้องรักษา |
|---|---|---|---|
| `meta-ai-bot.js` | 20 KB (Content Script) | **PORT (นำมาใช้ต่อ)** | - แยก Selector เข้า `meta-ai.selectors.ts`<br>- คงตรรกะ: `closeMediaDialog()` ปิดหน้าต่าง Add media ก่อนกดส่ง, การค้นหาปุ่มลูกศรส่งที่ไม่มี aria-label, การตรวจว่าช่องข้อความถูกล้างหลังส่ง, การดักจับไฟล์ MP4 ที่ดาวน์โหลดมาตรวจสอบความยาว ≥ 9.5s<br>- ตัดส่วนติดต่อ license/ChatGPT ออก |
| `flow-bot.js` | 113 KB (Content Script) | **PORT (นำมาใช้ต่อ)** | - แยก Selector เข้า `flow.selectors.ts`<br>- คงตรรกะ: เปิดคลังรูปกลับมาเมื่อ Flow ปิดคลังหลังอัปโหลด, ตรวจ Storyboard จาก Image ingredient chip ในช่อง prompt โดยตรง, ตรวจสอบโมเดล Omni 1.1 Flash, ตรวจจับการ์ด Generate ล้มเหลวทันที<br>- ปรับรับ Input เป็น Prompt A (ภาพนิ่ง) และ Prompt B (วิดีโอ 8s) |
| `tiktok-post-bot.js` | 78 KB (Content Script) | **PORT (นำมาใช้ต่อ)** | - แยก Selector เข้า `tiktok-studio.selectors.ts`<br>- คงตรรกะ: อัปโหลดวิดีโอผ่าน Dropzone, กรอกแคปชันและแฮชแท็ก, เลือก Radio Schedule, เลือกตัวเลือกเวลาแบบ 2 คอลัมน์ (HH:mm), อัปโหลดหน้าปก, ติ๊ก AI content toggle, ค้นหาและปักตะกร้าด้วย `product_id`<br>- **รักษาตรรกะจับ Rejection:** เมื่อขึ้น "Couldn't add product link" ให้หยุดทันทีก่อนกดโพสต์<br>- คงการกดปุ่มยืนยันโพสต์รอบสุดท้าย และการกู้งานค้างสถานะกำลังกดโพสต์ |
| `merge-v3.js` + `ffmpeg-merge-worker.js` | 11 KB + Worker | **PORT (นำมาใช้ต่อ)** | - นำเวอร์ชัน V3 มาใช้เป็นโมดูลเดียวใน `VideoMergeService`<br>- คงตรรกะการคำนวณ SHA-256 ของคลิป, การตรวจ duration ผ่าน `<video>` element, การส่ง ArrayBuffer เข้า Worker เพื่อรวมคลิปแบบไม่กระตุก |
| `background.js` | 205 KB (Service Worker) | **REFACTOR (แยกส่วน)** | - **ของเดิม:** รวมทุกอย่างในไฟล์เดียว ทั้งคิวงาน, โพสต์, HTTP server จำลอง, license check, storage event ทำให้บั๊กง่ายเมื่อ SW หลับ<br>- **ของใหม่:** แตกเป็นโมดูลเล็ก TypeScript ไม่เกิน 300–400 บรรทัด:<br>  1. `QueueEngine` (จัดการ State Machine งาน)<br>  2. `JobLock` (ป้องกันงานชนกันระหว่างแท็บ)<br>  3. `ScheduleManager` (คำนวณเวลาและปลุกด้วย `chrome.alarms`)<br>  4. `NotificationService` (Chrome + Telegram) |
| `chatgpt-bot.js` | 72 KB (Content Script) | **REPLACE (แทนที่)** | - ยกเลิกการเปิดแท็บ ChatGPT และการ parse DOM ทั้งหมด<br>- สกัดเฉพาะ System Prompt กฎการเขียน Hook ภาษาไทยและคำลงท้าย มาใส่ใน DeepSeek API Client |
| `popup.js`, `products.js` | 27 KB | **REPLACE (แทนที่)** | - ยกเลิกการ Scrape ตารางหน้าเว็บ TikTok Shop<br>- ใช้ Showcase API Client เรียกผ่าน `fetch` ด้วย Session Cookie โดยตรง |
| `activate.*`, `license-*`, `locked.*`, `unlock.*` | รวม ~10 ไฟล์ | **DISCARD (ตัดทิ้ง)** | - ลบไฟล์และสิทธิ์การเชื่อมต่อไปยัง Worker/Server License ทิ้งทั้งหมด |
| CSS & HTML เดิม (`jarbland-neon-v6.css` ฯลฯ) | รวม ~150 KB | **DISCARD (ตัดทิ้ง)** | - ยกเลิกธีม Neon และสไตล์ที่เขียนทับกันหลายชั้น<br>- ออกแบบใหม่เป็น Modern Bento Dashboard & Side Panel ด้วย Tailwind CSS |

---

## 3. รายการพฤติกรรมเดิมที่ต้องรักษา (Characterization Checklist)

จากการสกัดประวัติเวอร์ชันใน `README.txt`, `META-AI-V5-README.md`, และโค้ดจริง ต้องรักษาพฤติกรรมต่อไปนี้ไว้อย่างเคร่งครัด:

### 3.1 ด้าน Meta AI Automation
- [x] **Close Media Dialog First:** เมื่ออัปโหลดรูปสินค้าแล้ว หน้าต่าง `Add media and files` จะเด้งขึ้นมาบังปุ่มลูกศรส่ง ต้องหาปุ่มปิด (X / Close) และรอให้ dialog หายไปจาก DOM จริงก่อนกดส่ง
- [x] **Send Button Detection:** ปุ่มลูกศรของ Meta AI บางเวอร์ชันไม่มีข้อความและไม่มี `aria-label` ต้องค้นหาจากกลุ่มปุ่มขวา `.ms-auto.flex.items-center.gap-2` หรือ SVG icon เสมอ
- [x] **Prompt Clear Verification:** หลังกดส่ง ต้องรอจนกระทั่งช่อง Prompt ว่างเปล่า (ข้อความถูกส่งเข้าไปในระบบแล้ว) จึงเริ่มนับเวลาการเรนเดอร์
- [x] **Video Quality Verification:** วิดีโอที่เรนเดอร์เสร็จต้องมีความยาวจริงอย่างน้อย ≥ 9.5 วินาที (สำหรับคลิป 10 วินาที) หากสั้นกว่านี้ถือว่าคลิปล้มเหลว
- [x] **Job Lock & Duplicate Guard (จาก V5.4.1):** ตรวจสอบว่า Automation ID ตรงกับงานปัจจุบันเสมอ และทำ SHA-256 ของไฟล์ ป้องกันการบันทึกไฟล์ซ้ำหรือสลับสินค้า

### 3.2 ด้าน Google Flow Automation
- [x] **Library Reopen Logic:** หาก Flow ปิดแถบคลังรูปภาพหลังอัปโหลด ต้องกดเปิดคลังกลับมาและเลือกภาพล่าสุด โดยไม่อัปโหลดซ้ำ
- [x] **Ingredient Chip Verification:** ต้องพบรูปภาพเป็น Image Ingredient Chip อยู่ในช่อง Prompt จริงก่อนพิมพ์ข้อความ Prompt
- [x] **Model Verification:** ตรวจสอบว่าโมเดลที่เลือกเป็น Omni 1.1 Flash หรือ Veo 3.1 ตามที่กำหนดจริง
- [x] **Error Card Detection:** ตรวจจับสถานะการ์ดวิดีโอ “ล้มเหลว” (Failed Card) ของ Flow และหยุดรอทันที ไม่ปล่อยให้ค้างจนหมด Timeout (15 นาที)

### 3.3 ด้าน TikTok Studio Automation
- [x] **Native Radio Selection:** เลือกกำหนดเวลาด้วย `input[name="postSchedule"][value="schedule"]` และยืนยันว่า `checked` จริง
- [x] **Two-Column Time Picker:** รองรับตัวเลือกเวลาที่แยกคอลัมน์ชั่วโมงและนาที และตรวจสอบค่า HH:mm หลังเลือกเสร็จ
- [x] **AI-Generated Content Toggle:** เลื่อนสวิตช์เปิดป้ายกำกับเนื้อหา AI เสมอ
- [x] **Product ID Search & Rejection Guard:** พิมพ์ค้นหาด้วยตัวเลข Product ID แล้วตรวจจับข้อความเตือนปฏิเสธ (`Couldn't add product link` / ปฏิเสธลิงก์) หากพบต้องหยุดทันทีและแจ้งเตือนผู้ใช้ ไม่ฝืนกดโพสต์
- [x] **Final Confirmation Modal:** จัดการคลิกปุ่มยืนยันใน Modal ยืนยันการโพสต์/ตั้งเวลารอบสุดท้ายของ TikTok อัตโนมัติ

---

## 4. ผลการศึกษาเอกสารทางการ DeepSeek API

จากการตรวจสอบเอกสารล่าสุดของ DeepSeek API:

1. **Endpoint & Base URL:**
   - Base URL: `https://api.deepseek.com`
   - Endpoint: `/chat/completions` (OpenAI-compatible)
2. **Model Identifier:**
   - โมเดลหลักที่รองรับ: `deepseek-chat` (ชี้ไปยังโมเดลเสถียรล่าสุด) และ `deepseek-flash`
   - ตั้งค่าชื่อโมเดลเป็นตัวแปร Configuration ใน Settings เพื่อให้ผู้ใช้ปรับเปลี่ยนได้
3. **Structured JSON Output:**
   - กำหนดพารามิเตอร์ `response_format: { type: "json_object" }`
   - **กฎบังคับของ DeepSeek:** ใน System Prompt หรือ User Prompt **ต้องมีคำว่า "json"** อยู่ด้วยเสมอ ไม่เช่นนั้น API จะปฏิเสธคำขอ
4. **การคุมความยาวบทพูดภาษาไทย:**
   - เพดานความเร็วพูด: **11 ตัวอักษรไทยต่อวินาที**
   - วิดีโอ 8 วินาที (Flow) -> ความยาวไม่เกิน 88 ตัวอักษร
   - วิดีโอ 10 วินาที (Meta AI) -> ความยาวไม่เกิน 110 ตัวอักษร
   - หากเกินกำหนด ระบบจะตรวจจับและสั่ง DeepSeek Retry ใหม่อัตโนมัติ
5. **Fallback:** หาก DeepSeek ขัดข้องหรือโควตาหมด ระบบจะหยิบชื่อสินค้า + แฮชแท็กสำรองมาสร้างเป็นแคปชันทันที

---

## 5. ผลการศึกษาเอกสารทางการ Chrome Side Panel API

จากการตรวจสอบเอกสาร Manifest V3 ล่าสุด:

1. **การประกาศสิทธิ์ใน Manifest:**
   ```json
   {
     "permissions": ["sidePanel", "storage", "alarms"],
     "side_panel": {
       "default_path": "sidepanel.html"
     }
   }
   ```
2. **การเปิด Side Panel อัตโนมัติเมื่อคลิกไอคอน:**
   - ใน `background.js` เรียกใช้:
     ```javascript
     chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
     ```
   - ช่วยให้ผู้ใช้คลิกไอคอน Extension แล้ว Side Panel เปิดด้านข้างหน้าเว็บ TikTok / Meta AI ทันที โดยไม่ต้องกดเปิดหน้าเต็ม
3. **การสื่อสารแบบ Two-Way Realtime:**
   - Side Panel และ Dashboard ซิงก์สถานะงานผ่าน `chrome.storage.onChanged` และ Runtime Message ทำให้กด **เริ่ม / พัก / หยุดฉุกเฉิน** จาก Side Panel แล้ว Dashboard อัปเดตทันทีแบบ Zero-Latency

---

## 6. ข้อเสนอแนะและการปรับปรุง Prompt ภาคผนวก C (Meta AI)

Prompt ภาคผนวก C มีความยาวมาก (ประมาณ 2,500+ ตัวอักษร) จากการวิเคราะห์โค้ดเดิมใน `meta-ai-bot.js`:
- Meta AI ช่องพิมพ์รับข้อความยาวได้ แต่บางครั้งตัวอักษรที่ยาวเกินไปอาจทำให้เบราว์เซอร์หน่วงตอนพิมพ์ผ่าน DOM
- **ข้อเสนอการเตรียมตัว:** ใน Phase 4 จะทดสอบส่ง Prompt C ฉบับเต็มก่อน หาก Meta AI ไม่ตัดข้อความและเรนเดอร์ถูกต้อง จะใช้ตัวเต็ม 100% ตามข้อกำหนด แต่หาก Meta AI ปฏิเสธ ได้เตรียม **เวอร์ชัน Compact** สำรองไว้ล่วงหน้าโดยคงคำสั่งสำคัญครบ (ฉากโกดัง, มือผู้หญิงสองข้าง, ป้าย A4 ขาว, สินค้าไม่หมุน, เสียงพากย์หญิงไทย, ไม่มีซับ/ลายน้ำ) เพื่อนำเสนอให้ทดสอบเปรียบเทียบ
