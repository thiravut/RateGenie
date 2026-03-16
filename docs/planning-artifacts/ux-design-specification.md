---
stepsCompleted: [step-01-init, step-02-discovery, step-03-core-experience, step-04-emotional-response, step-05-inspiration, step-06-design-system, step-07-defining-experience, step-08-visual-foundation, step-09-design-directions, step-10-user-journeys, step-11-component-strategy, step-12-ux-patterns, step-13-responsive-accessibility, step-14-complete]
status: complete
inputDocuments:
  - 'docs/planning-artifacts/product-brief-OTA-2026-03-12.md'
  - 'docs/planning-artifacts/prd.md'
  - 'docs/planning-artifacts/architecture.md'
  - 'docs/planning-artifacts/epics.md'
---

# UX Design Specification — OTA

**Author:** Pond
**Date:** 2026-03-17

---

## Executive Summary

### Project Vision

OTA เป็น AI-powered revenue management platform สำหรับโรงแรมอิสระในไทย ที่ทำให้เจ้าของโรงแรมเข้าถึง revenue expertise ระดับ premium ผ่าน AI — แค่อ่านคำแนะนำ กดอนุมัติ ไม่ต้องเป็นผู้เชี่ยวชาญเอง

### Target Users

| Persona | บทบาท | Tech Level | Device หลัก | ความต้องการ UX |
|---------|--------|-----------|-------------|---------------|
| **คุณวิชัย** (เจ้าของ) | ผู้ตัดสินใจ + Buyer | ต่ำ | มือถือ (LINE) → Web | Simple, ไม่มี learning curve, ภาษาไทย |
| **คุณแพร** (Revenue Manager) | Power User | ปานกลาง | Desktop (Web) | Data-rich, multi-hotel view, efficiency |
| **น้องมิ้นท์** (Front Desk) | End User | ต่ำ | มือถือ | Zero-tap, ดูราคาใน 5 วินาที |

### Key Design Challenges

1. **Simplicity vs Power** — ต้อง simple พอสำหรับคุณวิชัย แต่ powerful พอสำหรับคุณแพร → แก้ด้วย progressive disclosure (ซ่อนความซับซ้อนจนกว่าจะต้องการ)
2. **AI Trust Gap** — ผู้ใช้ยังไม่เชื่อ AI → ต้องแสดง transparency ทุกคำแนะนำ + ให้อำนาจควบคุม
3. **Mobile-first approval flow** — 80% ของการใช้งานจะเริ่มจาก LINE/Telegram notification → web approve ต้อง responsive + fast
4. **Thai-first design** — UI ต้องออกแบบสำหรับภาษาไทยตั้งแต่แรก ไม่ใช่แปลจากภาษาอังกฤษ

### Design Opportunities

1. **Morning Brief Notification** — สร้าง habit loop: ทุกเช้า → LINE สรุป → กด approve → จบ < 5 นาที
2. **One-tap Approval from Chat** — ลด friction จนเหลือแค่ "กด link → เห็นคำแนะนำ → กด approve"
3. **AI Transparency** — แสดงเหตุผลทุกคำแนะนำเป็นจุดขาย "AI ที่อธิบายได้" ต่างจากคู่แข่งที่เป็น black box

## Core User Experience

### Defining Experience

**Core Action:** "อ่านคำแนะนำ → กดอนุมัติ" — นี่คือ interaction ที่สำคัญที่สุดของ OTA ทั้งหมด ถ้า flow นี้ง่ายและรวดเร็ว ผู้ใช้จะกลับมาทุกวัน

**Core Loop:**
```
LINE/Telegram notification → กด link → เห็นคำแนะนำ + เหตุผล → กด [อนุมัติ] → จบ
```

ทั้ง loop นี้ต้องใช้เวลาไม่เกิน **30 วินาที** จากกด notification ถึง approve สำเร็จ

### Platform Strategy

| Platform | ใช้เมื่อไหร่ | Priority | แนวทาง |
|----------|------------|----------|--------|
| **Mobile Web (responsive)** | Approve คำแนะนำจาก LINE/Telegram link | สูงสุด | Responsive Bootstrap — optimize สำหรับ 375px+ |
| **Desktop Web** | ดู dashboard, analytics, settings | สูง | Full dashboard experience — data tables, charts |
| **LINE/Telegram** | รับ notification + กด link | สูง | Push message + link เท่านั้น (ไม่ใช่ full bot ใน MVP) |

**ไม่ต้องทำ:** Native mobile app, offline mode, desktop app — web responsive เพียงพอสำหรับ MVP

### Effortless Interactions

| Interaction | ต้อง effortless แค่ไหน | วิธีทำ |
|-------------|----------------------|--------|
| **Approve คำแนะนำ** | 1 tap จาก notification | กด link → หน้า approve โหลดทันที → กดปุ่มเดียว |
| **ดูภาพรวม** | เปิดมาเห็นเลย | Dashboard แสดง key metrics ทันทีหลัง login — ไม่ต้อง navigate |
| **Reject + feedback** | 2 taps | กด reject → เลือก dropdown เหตุผล → จบ |
| **เช็คราคาข้าม OTA** | สแกนตาแล้วเห็น | ตารางสีเทียบราคา — ไฮไลท์ราคาที่ต่างกัน |
| **Onboarding** | Pond ช่วย setup | MVP ไม่ต้อง self-service onboarding — Pond setup ให้ pilot |

### Critical Success Moments

1. **"First Recommendation"** — คำแนะนำ AI ครั้งแรกที่ผู้ใช้เห็น ถ้าเหตุผลชัดเจนและสมเหตุสมผล → trust เริ่มสร้าง ถ้าไม่สมเหตุสมผล → เลิกใช้
2. **"First Approve"** — ครั้งแรกที่กด approve ต้อง confirm ชัดเจนว่า "อนุมัติแล้ว" + feedback ว่าราคาจะถูกปรับ (ใน MVP-0: ผู้ใช้ไปปรับเอง)
3. **"Revenue Proof"** — เมื่อเห็น revenue comparison ว่าเพิ่มขึ้นจริงหลังใช้ระบบ → ยืนยันว่าคุ้มค่า
4. **"Notification Arrives"** — LINE/Telegram notification ต้องมาถึงทันทีและอ่านได้ง่าย ถ้า notification ไม่มา = ผู้ใช้ไม่รู้ว่ามีคำแนะนำ = ไม่ใช้ระบบ

### Experience Principles

1. **"แค่กดอนุมัติ"** — ทุก interaction ต้องลดลงเหลือน้อยที่สุด ผู้ใช้ไม่ต้องเรียนรู้อะไร ไม่ต้องตั้งค่าอะไร แค่อ่านแล้วตัดสินใจ
2. **"AI ที่อธิบายได้"** — ทุกคำแนะนำต้องมีเหตุผลภาษาไทยที่เข้าใจง่าย ผู้ใช้ต้องรู้สึกว่า "AI ฉลาดจริง" ไม่ใช่ "AI สุ่มมา"
3. **"ข้อมูลมาหาคุณ"** — ข้อมูลสำคัญ push มาหาผู้ใช้ผ่าน LINE/Telegram ไม่ใช่ให้ผู้ใช้เข้ามาหาข้อมูลเอง
4. **"Mobile เท่ากับ Desktop"** — ผู้ใช้ต้อง approve ได้เต็มที่บนมือถือ ไม่บังคับให้เปิด desktop

## Desired Emotional Response

### Primary Emotional Goals

| ผู้ใช้ | ต้องรู้สึก | เมื่อไหร่ |
|--------|-----------|----------|
| **คุณวิชัย** | **"สบายใจ มั่นใจ"** — ฉันไม่ต้องกังวลเรื่องราคาอีกแล้ว AI ดูแลให้ | ทุกครั้งที่เปิด notification + approve |
| **คุณแพร** | **"มีประสิทธิภาพ เก่งขึ้น"** — เครื่องมือนี้ทำให้ฉันทำงานได้เร็วขึ้น ดีขึ้น | เมื่อเห็นว่าเวลาทำงานลดลงแต่ผลลัพธ์ดีขึ้น |
| **น้องมิ้นท์** | **"มั่นใจ ไม่กลัว"** — ฉันตอบราคาแขกได้ถูกต้องเสมอ | เมื่อแขก walk-in ถามราคา |

### Emotional Journey Mapping

| Stage | อารมณ์ที่ต้องการ | อารมณ์ที่ต้องหลีกเลี่ยง |
|-------|-----------------|----------------------|
| **First visit** | "น่าสนใจดี ดูง่ายจัง" (Curious + Relieved) | "ยากจัง ไม่เข้าใจ" (Overwhelmed) |
| **First recommendation** | "AI ฉลาดดี เหตุผลสมเหตุสมผล" (Impressed + Trust) | "AI คิดมั่วๆ" (Skeptical + Distrustful) |
| **First approve** | "ง่ายมาก แค่กดเดียว" (Empowered + Efficient) | "ไม่แน่ใจว่ากดถูกไหม" (Anxious) |
| **First reject** | "ดีที่ฉันยังเลือกได้เอง" (In control) | "AI จะโกรธไหมที่ไม่ทำตาม" (Guilty) |
| **Revenue proof** | "เห็นไหม มันได้ผลจริง!" (Validated + Proud) | "ไม่รู้ว่าดีขึ้นจริงหรือเปล่า" (Uncertain) |
| **Daily routine** | "ทุกเช้าใช้เวลาแค่ 5 นาที จบ" (Calm + Productive) | "อีกแล้ว ต้องมาดูอีก" (Burdened) |
| **Error / sync fail** | "โอเค ระบบบอกแล้ว ฉันรู้แล้ว" (Informed + Calm) | "เกิดอะไรขึ้น! ราคาผิดหมดเลย!" (Panic) |

### Micro-Emotions

**ต้องสร้าง:**
- **ความมั่นใจ (Confidence)** — ทุกคำแนะนำมีเหตุผลชัดเจน ผู้ใช้รู้สึกว่าตัดสินใจถูก
- **ความไว้ใจ (Trust)** — AI โปร่งใส ไม่ทำอะไรเบื้องหลัง ผู้ใช้เห็นทุกอย่าง
- **ความสำเร็จ (Accomplishment)** — เห็น revenue เพิ่มขึ้น เห็นเวลาที่ประหยัดได้
- **ความสงบ (Calm)** — ไม่มี alert ท่วม ไม่มีข้อมูลรกตา แค่สิ่งที่ต้องรู้

**ต้องหลีกเลี่ยง:**
- **ความสับสน (Confusion)** — ไม่เข้าใจว่า AI แนะนำทำไม
- **ความกังวล (Anxiety)** — กลัวว่า approve แล้วจะเสียรายได้
- **ความรำคาญ (Annoyance)** — notification มากเกินไป หรือข้อมูลที่ไม่เกี่ยวข้อง

### Design Implications

| อารมณ์ | UX Design Approach |
|--------|-------------------|
| **มั่นใจ** | แสดงเหตุผล AI ทุกครั้ง + สีเขียว/แดงชัดเจนสำหรับ +/- ราคา + confirmation message หลัง approve |
| **ไว้ใจ** | Audit trail เข้าถึงได้ง่าย + แสดง approval rate + "AI เรียนรู้จาก feedback ของคุณ" message |
| **สำเร็จ** | Revenue comparison graph เด่นชัดบน dashboard + "เดือนนี้ revenue +14%" badge |
| **สงบ** | หน้า clean ไม่รก + ใช้ white space + สรุปก่อน detail + notification แค่เรื่องสำคัญ |
| **ป้องกันสับสน** | ทุกหน้ามีหัวข้อภาษาไทยชัดเจน + ไม่มี jargon + tooltip อธิบายคำศัพท์ |
| **ป้องกันกังวล** | "AI แนะนำ คุณตัดสินใจ" ย้ำทุกหน้า + undo/reject ง่าย + pricing boundaries ที่ตั้งไว้เป็น safety net |
| **ป้องกันรำคาญ** | Notification throttling + สรุปรวมแทนส่งทีละรายการ + notification settings ปรับได้ |

### Emotional Design Principles

1. **"AI เป็นผู้ช่วย ไม่ใช่เจ้านาย"** — ทุก interaction ต้องย้ำว่าผู้ใช้เป็นผู้ตัดสินใจ AI แค่แนะนำ — สร้างความรู้สึก "in control"
2. **"เหตุผลก่อนตัวเลข"** — แสดงเหตุผลภาษาไทยก่อนแสดงราคาแนะนำ เพื่อให้ผู้ใช้เข้าใจก่อนตัดสินใจ ไม่ใช่เห็นตัวเลขแล้วตกใจ
3. **"ข่าวดีดังกว่าข่าวร้าย"** — Revenue ที่เพิ่มขึ้นต้องแสดงเด่นชัด (สีเขียว, ตัวใหญ่, badge) ส่วน error ต้อง calm + actionable ไม่ใช่สีแดงกระพริบ
4. **"น้อยแต่พอดี"** — ทุกหน้าต้องผ่านคำถาม "ตัดอะไรออกได้อีก?" — ถ้าตัดแล้วยังใช้งานได้ ให้ตัด

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**1. LINE Official Account (ตัวอย่าง: SCB, Grab)**

ผู้ใช้เป้าหมายของ OTA ใช้ LINE ทุกวัน — SCB และ Grab ทำ notification ผ่าน LINE ได้ดีมาก:
- **Flex Message** ที่อ่านง่าย มีโครงสร้างชัด สีแยกหมวด
- **Quick action buttons** กดได้ทันทีไม่ต้อง navigate
- **สรุปสั้นก่อน** แล้วมี link "ดูรายละเอียด" สำหรับคนที่ต้องการข้อมูลเพิ่ม
- **บทเรียน:** Notification ของ OTA ต้องอ่านจบใน 3 วินาที + กดได้ใน 1 tap

**2. Agoda (Extranet / Hotel Dashboard)**

คู่แข่งโดยตรงที่ผู้ใช้ OTA จะคุ้นเคย:
- **Calendar view** แสดงราคา + availability ต่อวัน — เข้าใจง่าย
- **Color coding** สีเขียว (ว่าง), สีแดง (เต็ม), สีเหลือง (เกือบเต็ม)
- **Bulk edit** ปรับราคาหลายวันพร้อมกัน
- **บทเรียน:** ผู้ใช้คุ้น Agoda extranet อยู่แล้ว OTA ไม่ควรต่างจนเรียนรู้ใหม่ แต่ต้อง **ง่ายกว่า**

**3. Robinhood (FinTech — AI Recommendation UX)**

ตัวอย่างที่ดีของการแสดง "คำแนะนำ" ให้ผู้ใช้ตัดสินใจ:
- **Card-based layout** แต่ละ recommendation เป็น card อ่านง่าย
- **เหตุผลสั้นๆ** ในตัว card + expand เพื่อดูรายละเอียด
- **สีเขียว/แดง** บอกทิศทางชัดเจน (ขึ้น/ลง)
- **Swipe to approve** gesture ที่รวดเร็ว
- **บทเรียน:** Recommendation cards ของ OTA ต้องอ่านจบใน 5 วินาที + approve ใน 1 กด

### Transferable UX Patterns

**Navigation Patterns:**
- **Bottom Tab Navigation (Mobile)** — Dashboard / ราคา / คำแนะนำ / ตั้งค่า — 4 tabs เหมือน LINE, Agoda
- **Sidebar Navigation (Desktop)** — เมนูด้านซ้าย expand/collapse — pattern มาตรฐานของ B2B dashboard

**Interaction Patterns:**
- **Card-based Recommendations** — แต่ละคำแนะนำเป็น card: room type + ราคาปัจจุบัน → ราคาแนะนำ + เหตุผล + ปุ่ม approve/reject
- **Swipe/Tap to Approve** — mobile: กด approve ที่ card ได้เลย ไม่ต้องเปิดหน้าใหม่
- **Calendar Heat Map** — แสดง occupancy/ราคา ต่อวันเป็นสี — เห็นภาพรวม 30 วันในพริบตา
- **Progressive Disclosure** — Dashboard แสดงสรุป → กดเพื่อดูรายละเอียด → กดอีกทีเพื่อดู raw data

**Visual Patterns:**
- **Color Coding ที่สอดคล้อง** — เขียว = ดี/เพิ่มขึ้น, แดง = ต้องสนใจ/ลดลง, เหลือง = เฝ้าระวัง — ใช้ทั้งระบบ
- **Big Number + Trend Arrow** — ตัวเลข revenue ใหญ่ + ลูกศรขึ้น/ลง + % เปลี่ยนแปลง — เห็นปุ๊บเข้าใจปั๊บ
- **Thai Typography** — ใช้ font ที่อ่านง่ายสำหรับภาษาไทย (Sarabun, Prompt, IBM Plex Thai)

### Anti-Patterns to Avoid

| Anti-Pattern | ทำไมต้องหลีกเลี่ยง | พบใน |
|-------------|-------------------|------|
| **Dashboard overload** | ยัดข้อมูล 20+ metrics ในหน้าเดียว ผู้ใช้ไม่รู้จะดูอะไรก่อน | B2B SaaS ทั่วไป |
| **English-first translated to Thai** | UI ออกแบบภาษาอังกฤษแล้วแปล → label ยาวเกิน / ตัดคำผิด | SaaS ต่างประเทศ |
| **Require desktop for core actions** | บังคับให้เปิด desktop เพื่อ approve → ผู้ใช้ไม่ทำ | Enterprise software |
| **Alert fatigue** | ส่ง notification ทุก 5 นาที → ผู้ใช้ mute ทิ้ง | Monitoring tools |
| **Black box AI** | แสดงแค่ "AI แนะนำราคา 2,500" โดยไม่บอกเหตุผล → ไม่มีใครเชื่อ | AI products ทั่วไป |
| **Complex onboarding forms** | ให้กรอกข้อมูล 20+ fields ก่อนเริ่มใช้ → drop off สูง | B2B SaaS |

### Design Inspiration Strategy

**What to Adopt:**
- **LINE Flex Message pattern** — สำหรับ notification ของ OTA
- **Card-based recommendations** — จาก FinTech apps สำหรับ AI recommendation UI
- **Color coding system** (เขียว/แดง/เหลือง) — จาก Agoda extranet
- **Big number + trend** — จาก analytics dashboards

**What to Adapt:**
- **Agoda calendar view** → ทำให้ง่ายกว่า (แสดงแค่ราคา + สี ไม่ต้องมี availability grid ซับซ้อน)
- **Bottom tab navigation** → ปรับเป็น 4 tabs สำหรับ OTA: หน้าหลัก / ราคา / AI แนะนำ / ตั้งค่า
- **Progressive disclosure** → Level 1 สรุป (dashboard) → Level 2 รายละเอียด (price view) → Level 3 ประวัติ (history)

**What to Avoid:**
- Dashboard overload → แสดง max 6 metrics บนหน้าแรก
- Alert fatigue → สรุปรวม notification ส่ง 1-2 ครั้ง/วัน ไม่ใช่ทุกครั้งที่มีคำแนะนำ
- Black box AI → ทุกคำแนะนำต้องมีเหตุผลภาษาไทย
- English-first → ออกแบบ Thai-first ตั้งแต่แรก

## Design System Foundation

### Design System Choice

**React-Bootstrap + Bootstrap 5** (Themeable System)

Architecture document ระบุไว้แล้วว่าใช้ React-Bootstrap — เป็น themeable system ที่ให้ proven components + ปรับ theme ได้ตาม brand

### Rationale for Selection

1. **Pond คุ้นเคย Bootstrap อยู่แล้ว** — ไม่มี learning curve ใหม่
2. **Solo dev + Claude** — Bootstrap มี community ใหญ่ Claude เขียน Bootstrap ได้ดีมาก
3. **Responsive built-in** — Grid system + breakpoints พร้อมใช้ ไม่ต้อง setup เพิ่ม
4. **Component library ครบ** — Cards, Tables, Modals, Navbars, Alerts, Badges — ครอบคลุม UI ที่ต้องการทั้งหมด
5. **Thai typography friendly** — Bootstrap ไม่ force font ให้ swap เป็น Thai font ได้ง่าย

### Implementation Approach

**Tech Stack:**
- `react-bootstrap` — React components
- `bootstrap` 5.3+ — CSS framework
- Custom SCSS variables — override Bootstrap defaults สำหรับ OTA brand
- Google Fonts — IBM Plex Thai / Sarabun สำหรับ Thai typography

**Component Strategy:**

| ประเภท | ใช้จาก Bootstrap | Custom |
|--------|-----------------|--------|
| **Layout** | Container, Row, Col, Stack | — |
| **Navigation** | Navbar, Nav, Tab | Bottom Tab Bar (mobile) |
| **Data Display** | Table, Card, Badge, Alert | Recommendation Card, Price Comparison Table, Revenue Widget |
| **Forms** | Form, Button, Dropdown, Modal | Approval Flow, Reject Feedback Form |
| **Charts** | — | Chart.js หรือ Recharts สำหรับ revenue/occupancy graphs |

### Customization Strategy

**Brand Colors (SCSS variables override):**

```scss
// OTA Brand Colors
$primary: #2563EB;      // น้ำเงินหลัก — trust, professional
$success: #16A34A;      // เขียว — revenue เพิ่ม, approve, ดี
$danger: #DC2626;       // แดง — revenue ลด, alert, ต้องสนใจ
$warning: #F59E0B;      // เหลือง — เฝ้าระวัง, pending
$info: #0EA5E9;         // ฟ้า — ข้อมูล, AI recommendation
$light: #F8FAFC;        // พื้นหลังอ่อน
$dark: #1E293B;         // ข้อความหลัก
```

**Typography:**

```scss
$font-family-base: 'IBM Plex Thai', 'IBM Plex Sans', sans-serif;
$font-size-base: 1rem;      // 16px — อ่านง่ายบนมือถือ
$headings-font-weight: 600;  // หัวข้อหนาชัด
```

**Spacing & Sizing:**
- ใช้ Bootstrap spacing scale ปกติ (0-5)
- Border radius: `0.5rem` (rounded แต่ไม่ pill)
- Card shadow: `0 1px 3px rgba(0,0,0,0.1)` — subtle, clean

**Responsive Breakpoints:**

| Breakpoint | ใช้เมื่อ | Layout |
|-----------|---------|--------|
| **< 576px** | มือถือ (จาก LINE/Telegram) | Single column, bottom tabs, cards stack |
| **576-768px** | Tablet | 2 columns, sidebar collapse |
| **> 768px** | Desktop | Full sidebar + content area |

**Custom Components ที่ต้องสร้าง:**

1. **RecommendationCard** — card แสดงคำแนะนำ AI: room type, ราคาปัจจุบัน → ราคาแนะนำ, % เปลี่ยน, เหตุผลไทย, ปุ่ม approve/reject
2. **PriceComparisonGrid** — ตาราง room type × OTA แสดงราคา + color coding
3. **RevenueWidget** — big number + trend arrow + % change
4. **OTASyncStatus** — badge แสดงสถานะ sync ของแต่ละ OTA (เขียว/แดง/เหลือง)
5. **BottomTabBar** — mobile navigation bar 4 tabs

## Defining Core Experience

### Defining Experience

**"อ่านเหตุผล กดอนุมัติ"** — เหมือน Tinder ที่ "Swipe to match" OTA คือ **"Read reason, tap approve"**

ผู้ใช้จะอธิบายให้เพื่อนฟังว่า: *"ทุกเช้า LINE ส่งมาว่า AI แนะนำให้ขึ้นราคาห้อง Deluxe 200 บาทวันศุกร์ เพราะ booking pace สูง ฉันกดอนุมัติ จบ ใช้เวลาไม่ถึงนาที"*

### User Mental Model

**ปัจจุบัน (ก่อนใช้ OTA):**
- คุณวิชัย: "จ้าง revenue manager มาดูให้ → เขาบอกว่าควรปรับราคาเท่าไหร่ → ฉันบอกตกลง → เขาไปปรับใน extranet"
- คุณแพร: "เปิด extranet ทีละ OTA → ดูตัวเลข → คิดในหัว → ปรับราคา → ทำซ้ำกับโรงแรมถัดไป"

**หลังใช้ OTA:**
- Mental model เดิม **ไม่เปลี่ยน** — ยังเป็น "มีคนบอก → ฉันตัดสินใจ" แค่เปลี่ยน "คน" เป็น "AI" และเปลี่ยน "โทรมาบอก" เป็น "LINE ส่งมา"
- **ไม่ต้องเรียนรู้ mental model ใหม่** — นี่คือข้อได้เปรียบ

### Success Criteria

| เกณฑ์ | เป้าหมาย | วิธีวัด |
|-------|---------|--------|
| **เวลาจาก notification ถึง approve** | < 30 วินาที | Analytics: timestamp notification sent → approve clicked |
| **ผู้ใช้อ่านเหตุผลก่อน approve** | > 70% ใช้เวลาอ่าน > 3 วินาที | Analytics: time on recommendation card before action |
| **Approval rate** | > 60% | Database: approved / total recommendations |
| **Daily return rate** | > 80% ของ active users | Analytics: unique users ที่เปิดดูคำแนะนำทุกวัน |
| **ผู้ใช้รู้สึก "ง่ายดี"** | Qualitative feedback จาก pilot | Survey / interview |

### Novel UX Patterns

**Established patterns ที่ใช้:**
- Card-based recommendation display → ผู้ใช้คุ้นเคยจาก social media feeds
- Approve/reject buttons → ผู้ใช้คุ้นเคยจาก banking apps
- Notification → link → action → done → คุ้นเคยจาก food delivery apps

**Novel combination ของ OTA:**
- **"AI + เหตุผลภาษาไทย + 1-tap approve ผ่าน LINE"** — ไม่มีใครทำแบบนี้ใน hospitality
- ไม่ต้องสอน pattern ใหม่ แค่ **รวม patterns ที่คุ้นเคยเข้าด้วยกัน** ในบริบท hotel pricing

### Experience Mechanics

**1. Initiation — "LINE/Telegram ส่ง notification"**

```
[LINE Flex Message]
┌─────────────────────────┐
│ 🏨 OTA — คำแนะนำราคาใหม่  │
│                         │
│ มีคำแนะนำ 3 รายการ       │
│ สำหรับ 12-14 มี.ค. 2026  │
│                         │
│ [ดูคำแนะนำ →]            │
└─────────────────────────┘
```

- ผู้ใช้เห็น notification ใน LINE/Telegram
- อ่านสรุปจำนวนคำแนะนำ + ช่วงวันที่
- กดปุ่ม "ดูคำแนะนำ" → เปิด web browser

**2. Interaction — "อ่านเหตุผล + กด approve/reject"**

```
[Mobile Web — Recommendation Page]
┌─────────────────────────┐
│ ← คำแนะนำราคา    [อนุมัติทั้งหมด] │
│                         │
│ ┌───────────────────┐   │
│ │ Deluxe Room        │   │
│ │ วันศุกร์ 12 มี.ค.    │   │
│ │                    │   │
│ │ ₿2,800 → ₿3,000   │   │
│ │ ▲ +7.1%            │   │
│ │                    │   │
│ │ 💡 booking pace สูง  │   │
│ │ กว่าปกติ 30%        │   │
│ │ คู่แข่ง 3/5 แห่ง     │   │
│ │ ขึ้นราคาแล้ว         │   │
│ │                    │   │
│ │ [✓ อนุมัติ] [✗ ปฏิเสธ]│   │
│ └───────────────────┘   │
│                         │
│ ┌───────────────────┐   │
│ │ Superior Room  ... │   │
│ └───────────────────┘   │
└─────────────────────────┘
```

- แต่ละ card แสดง: room type, วันที่, ราคาปัจจุบัน → ราคาแนะนำ, % เปลี่ยน
- **เหตุผลอยู่ตรงกลาง card** — ผู้ใช้อ่านก่อนกดปุ่ม
- ปุ่ม approve (เขียว) + reject (เทา) อยู่ด้านล่าง card

**3. Feedback — "ยืนยันว่าสำเร็จ"**

```
┌───────────────────┐
│ ✓ อนุมัติแล้ว!      │
│ Deluxe Room       │
│ ₿3,000 ตั้งแต่      │
│ วันศุกร์ 12 มี.ค.    │
│                    │
│ (MVP-0: กรุณาไป     │
│  ปรับราคาบน OTA     │
│  ด้วยตัวเอง)         │
└───────────────────┘
```

- Toast/banner สีเขียว แสดง 3 วินาที
- MVP-0: เตือนว่าต้องไปปรับราคาบน OTA เอง
- Card เปลี่ยนสถานะเป็น "อนุมัติแล้ว" + เลื่อนลง

**4. Completion — "จบแล้ว กลับไปทำงานอื่น"**

```
┌─────────────────────────┐
│ ← คำแนะนำราคา            │
│                         │
│ 🎉 อนุมัติครบทุกรายการแล้ว!  │
│                         │
│ วันนี้คุณอนุมัติ 3 รายการ   │
│ ใช้เวลา 45 วินาที         │
│                         │
│ [กลับหน้าหลัก]            │
└─────────────────────────┘
```

- เมื่อ approve ครบ → แสดงสรุป + เวลาที่ใช้
- ย้ำ value: "ใช้เวลาแค่ 45 วินาที" → ผู้ใช้รู้สึก efficient
- กดกลับหน้าหลัก → ปิด browser → กลับไป LINE

## Visual Design Foundation

### Color System

**Primary Palette:**

| Token | Hex | Usage |
|-------|-----|-------|
| `--ota-primary` | `#2563EB` | ปุ่มหลัก, links, active states, brand |
| `--ota-primary-light` | `#DBEAFE` | Background highlights, selected states |
| `--ota-primary-dark` | `#1D4ED8` | Hover states, emphasis |

**Semantic Colors:**

| Token | Hex | Usage |
|-------|-----|-------|
| `--ota-success` | `#16A34A` | Revenue เพิ่ม, approve, sync สำเร็จ |
| `--ota-success-light` | `#DCFCE7` | Success background |
| `--ota-danger` | `#DC2626` | Revenue ลด, sync ล้มเหลว, alert |
| `--ota-danger-light` | `#FEE2E2` | Error background |
| `--ota-warning` | `#F59E0B` | Pending, เฝ้าระวัง |
| `--ota-warning-light` | `#FEF3C7` | Warning background |
| `--ota-info` | `#0EA5E9` | AI recommendation, ข้อมูล |
| `--ota-info-light` | `#E0F2FE` | Info background |

**Neutral Colors:**

| Token | Hex | Usage |
|-------|-----|-------|
| `--ota-gray-900` | `#1E293B` | ข้อความหลัก (headings) |
| `--ota-gray-700` | `#334155` | ข้อความรอง (body) |
| `--ota-gray-500` | `#64748B` | ข้อความเสริม (labels, captions) |
| `--ota-gray-300` | `#CBD5E1` | Borders, dividers |
| `--ota-gray-100` | `#F1F5F9` | Background sections |
| `--ota-white` | `#FFFFFF` | Card backgrounds, main bg |

### Typography System

**Font Stack:**
```scss
$font-family-base: 'IBM Plex Thai', 'IBM Plex Sans', -apple-system, sans-serif;
$font-family-mono: 'IBM Plex Mono', monospace; // สำหรับราคา/ตัวเลข
```

**Type Scale:**

| Role | Size | Weight | Line Height | ใช้เมื่อ |
|------|------|--------|-------------|---------|
| **Display** | 2rem (32px) | 700 | 1.2 | Revenue number หลักบน dashboard |
| **H1** | 1.5rem (24px) | 600 | 1.3 | Page titles |
| **H2** | 1.25rem (20px) | 600 | 1.4 | Section headers |
| **H3** | 1.125rem (18px) | 600 | 1.4 | Card titles, room types |
| **Body** | 1rem (16px) | 400 | 1.5 | ข้อความทั่วไป, AI เหตุผล |
| **Small** | 0.875rem (14px) | 400 | 1.5 | Labels, captions, timestamps |
| **Price** | 1.25rem (20px) | 700 | 1.2 | ราคา (ใช้ mono font) |

### Spacing & Layout Foundation

**Spacing Scale (Bootstrap 5):**
- `$spacer * 0.25` = 4px — micro spacing
- `$spacer * 0.5` = 8px — element spacing
- `$spacer` = 16px — component spacing
- `$spacer * 1.5` = 24px — section spacing
- `$spacer * 3` = 48px — page section spacing

**Card Standards:**
- Padding: 16px (mobile) / 24px (desktop)
- Border radius: 8px
- Shadow: `0 1px 3px rgba(0,0,0,0.1)`
- Border: `1px solid var(--ota-gray-300)` (optional, for tables)

**Layout Grid:**
- Max content width: 1200px
- Sidebar width: 240px (desktop)
- Gutter: 16px (mobile) / 24px (desktop)

### Accessibility Considerations

- **Color contrast:** ทุกข้อความต้อง WCAG AA (4.5:1 สำหรับ body, 3:1 สำหรับ large text)
- **ไม่ใช้สีอย่างเดียวบอกความหมาย:** เขียว/แดง ต้องมี icon หรือ text ประกอบเสมอ (▲/▼, +/-)
- **Touch target:** ปุ่มทั้งหมด min 44x44px บนมือถือ
- **Focus states:** ทุก interactive element ต้องมี focus ring ที่เห็นชัด
- **Thai screen reader:** ใช้ `lang="th"` + meaningful alt text ภาษาไทย

## Design Direction

### Chosen Direction: "Clean Professional Thai"

แนวทาง clean, professional, trust-building — ไม่ใช่ playful หรือ minimal จนเกินไป เพราะเป็น B2B tool ที่จัดการเรื่องเงิน ต้องดู "น่าเชื่อถือ" แต่ "ไม่น่ากลัว"

**Visual Characteristics:**
- White backgrounds + subtle gray sections
- Blue primary — professional, trustworthy
- Cards with light shadows — clean separation
- Generous white space — ไม่รกตา
- Bold numbers + trend indicators — data-forward
- Thai typography ที่อ่านง่าย ไม่เล็กเกินไป

### Design Rationale

1. **Trust** — สีน้ำเงินและ white space สร้างความน่าเชื่อถือ เหมาะกับ financial decisions
2. **Clarity** — layout ชัดเจน ข้อมูลหาง่าย ผู้ใช้ที่ไม่ tech-savvy เข้าใจได้
3. **Action-oriented** — ปุ่ม approve เด่นชัด ไม่ต้องหา
4. **Thai-first** — ออกแบบสำหรับภาษาไทยโดยเฉพาะ ไม่ใช่แปลจาก English layout

## User Journey Flows

### Journey 1: Morning Approval Flow (คุณวิชัย — Daily)

```
LINE notification (7:00 น.)
    ↓
กด "ดูคำแนะนำ" → เปิด browser
    ↓
หน้า Recommendations (auto-login via token in URL)
    ↓
อ่าน card ที่ 1 → เหตุผลชัด → กด [อนุมัติ]
    ↓
อ่าน card ที่ 2 → ไม่เห็นด้วย → กด [ปฏิเสธ] → เลือกเหตุผล
    ↓
อ่าน card ที่ 3 → กด [อนุมัติ]
    ↓
"อนุมัติครบแล้ว! ใช้เวลา 45 วินาที" → ปิด browser
```

**Key screens:** Notification → Recommendations List → Approval Confirmation

### Journey 2: Price Check Flow (คุณวิชัย — Weekly)

```
เปิด web dashboard (bookmark หรือ LINE menu)
    ↓
หน้า Dashboard — เห็น revenue สรุป + occupancy + sync status
    ↓
กด "ราคา" tab → หน้า Price Management
    ↓
เห็นตาราง room type × OTA — ราคาต่างกันไฮไลท์สีเหลือง
    ↓
กด room type → เห็น price history graph
    ↓
กลับ dashboard
```

**Key screens:** Dashboard → Price Management → Price History

### Journey 3: First-time Setup (คุณวิชัย — Once)

```
Pond ส่ง invite link → กด register
    ↓
กรอก email + password + ชื่อ → สร้างบัญชี
    ↓
Pond ช่วย setup: เชื่อม OTA + map room types + ตั้ง boundaries
    ↓
เลือก LINE/Telegram → scan QR / ส่ง code
    ↓
รอ 3 วัน (AI สะสมข้อมูล)
    ↓
ได้รับ notification แรก → Journey 1 เริ่มต้น
```

**Key screens:** Register → Hotel Setup (Pond ช่วย) → LINE/Telegram Connect → Wait → First Notification

### Journey 4: Revenue Review (คุณวิชัย — Monthly)

```
เปิด web dashboard → กด "วิเคราะห์" tab
    ↓
หน้า Analytics — revenue comparison ก่อน/หลัง
    ↓
เห็นกราฟ + "revenue เพิ่มขึ้น 14%"
    ↓
เห็น AI performance: approval rate 72%
    ↓
กด export CSV → ส่งให้บัญชี
```

**Key screens:** Dashboard → Analytics → Export

### Journey Patterns

- **ทุก journey เริ่มจาก notification หรือ bookmark** — ไม่มี journey ที่ต้อง "หาทาง" เข้า
- **Core action (approve) ใช้ไม่เกิน 3 screens** — notification → list → done
- **Secondary actions (price check, analytics) ใช้ไม่เกิน 4 screens**
- **Error flows กลับไป happy path ได้เสมอ** — ทุก error มี "ลองอีกครั้ง" หรือ "กลับหน้าหลัก"

### Flow Optimization Principles

1. **ลด login friction** — ใช้ JWT token ใน URL จาก notification เพื่อ auto-login (secure, time-limited)
2. **ไม่มี dead ends** — ทุกหน้ามีทางออก (back button, home link, bottom tabs)
3. **Progressive loading** — แสดง skeleton/loading state ไม่ใช่ blank screen
4. **Contextual navigation** — จาก notification ไป recommendations ตรง ไม่ผ่าน dashboard

## Component Strategy

### Design System Components (จาก React-Bootstrap)

| Component | Bootstrap | ใช้ที่ไหน |
|-----------|----------|---------|
| `Navbar` | ✅ | Top navigation bar + hotel selector |
| `Nav` + `Tab` | ✅ | Bottom tabs (mobile), sidebar (desktop) |
| `Card` | ✅ (base) | Recommendation cards, dashboard widgets |
| `Table` | ✅ | Price comparison grid, history table |
| `Badge` | ✅ | Status indicators (sync, approval, OTA) |
| `Alert` | ✅ | System messages, errors, success feedback |
| `Button` | ✅ | Approve/reject, navigation, actions |
| `Modal` | ✅ | Reject feedback, confirmations |
| `Dropdown` | ✅ | Reject reasons, filters, date range |
| `Form` | ✅ | Login, register, settings |
| `Toast` | ✅ | Approval confirmation, sync alerts |
| `Spinner` | ✅ | Loading states |
| `Placeholder` | ✅ | Skeleton loading |
| `Offcanvas` | ✅ | Mobile sidebar menu |

### Custom Components

**1. RecommendationCard**
```
┌─────────────────────────────┐
│ [Badge: room type]  [date]   │
│                              │
│ ₿2,800 → ₿3,000  ▲ +7.1%   │
│                              │
│ 💡 เหตุผล: booking pace สูง   │
│    กว่าปกติ 30%              │
│                              │
│ [✓ อนุมัติ]    [✗ ปฏิเสธ]    │
└─────────────────────────────┘
```
- Props: recommendation data, onApprove, onReject
- States: pending, approved, rejected, expired
- Responsive: full-width on mobile, 2-column on desktop

**2. RevenueWidget**
```
┌──────────────────┐
│ รายได้เดือนนี้      │
│                   │
│  ₿847,500        │
│  ▲ +14.2%        │
│  vs เดือนก่อน      │
└──────────────────┘
```
- Props: value, change%, label, period
- Color: เขียวถ้า + , แดงถ้า -

**3. PriceComparisonGrid**
```
┌────────┬──────────┬─────────────┐
│ Room   │ Agoda    │ Booking.com │
├────────┼──────────┼─────────────┤
│ Deluxe │ ₿2,800   │ ₿2,900 ⚠️  │
│ Super  │ ₿1,800   │ ₿1,800     │
└────────┴──────────┴─────────────┘
```
- Highlight ราคาที่ต่างกันระหว่าง OTA
- Click row → expand price history

**4. OTASyncStatus**
```
Agoda [🟢 ซิงค์แล้ว 2 นาทีก่อน]
Booking [🔴 ล้มเหลว — ตรวจสอบ]
```
- Badge สีตามสถานะ: เขียว/แดง/เหลือง
- แสดงเวลา last sync

**5. BottomTabBar (Mobile)**
```
┌────────┬────────┬────────┬────────┐
│  🏠    │  💰    │  🤖    │  ⚙️    │
│ หน้าหลัก│  ราคา  │ AI แนะนำ│ ตั้งค่า │
└────────┴────────┴────────┴────────┘
```
- 4 tabs, active state highlight
- Badge count บน AI แนะนำ (จำนวน pending)

### Component Implementation Strategy

| Priority | Components | เมื่อไหร่ |
|----------|-----------|---------|
| **Sprint 1** | Layout (Navbar, BottomTabBar, Page shells) | Epic 1 |
| **Sprint 2** | OTASyncStatus, basic tables | Epic 2 |
| **Sprint 3** | RecommendationCard, RejectModal | Epic 3 |
| **Sprint 4** | LINE/Telegram message templates | Epic 4 |
| **Sprint 5** | RevenueWidget, PriceComparisonGrid, Charts | Epic 5 |

## UX Consistency Patterns

### Button Hierarchy

| Level | Style | ใช้เมื่อ | ตัวอย่าง |
|-------|-------|---------|---------|
| **Primary** | Solid blue (`btn-primary`) | Main action ของหน้า — 1 ต่อ section | "อนุมัติ", "บันทึก", "เข้าสู่ระบบ" |
| **Success** | Solid green (`btn-success`) | Approve/positive action | "อนุมัติ", "เชื่อมต่อ" |
| **Secondary** | Outline gray (`btn-outline-secondary`) | Secondary action | "ปฏิเสธ", "ยกเลิก", "กลับ" |
| **Danger** | Outline red (`btn-outline-danger`) | Destructive action | "ลบ", "ยกเลิกการเชื่อมต่อ" |
| **Link** | Text only (`btn-link`) | Tertiary/navigation | "ดูทั้งหมด", "ดูรายละเอียด" |

### Feedback Patterns

| สถานการณ์ | Pattern | Duration | ตัวอย่าง |
|-----------|---------|----------|---------|
| **Action success** | Toast (top-right) สีเขียว | 3 วินาที auto-dismiss | "อนุมัติแล้ว!" |
| **Action error** | Alert (inline) สีแดง | จนกว่าจะ dismiss | "ไม่สามารถบันทึกได้ กรุณาลองอีกครั้ง" |
| **System warning** | Alert (top) สีเหลือง | จนกว่าจะ dismiss | "Agoda sync ล้มเหลว — ตรวจสอบการเชื่อมต่อ" |
| **Loading** | Skeleton placeholder | จนกว่า data load | — |
| **Empty state** | Illustration + message + CTA | ถาวร | "ยังไม่มีคำแนะนำ — ระบบกำลังวิเคราะห์ข้อมูล" |
| **Confirmation** | Modal | จนกว่าจะตอบ | "ต้องการอนุมัติทั้งหมด 5 รายการ?" |

### Form Patterns

- **Labels:** อยู่ข้างบน input เสมอ (ไม่ใช้ floating labels — ไม่ดีกับภาษาไทย)
- **Validation:** inline, real-time, ข้อความภาษาไทย สีแดง ใต้ field
- **Required fields:** ดอกจัน (*) สีแดง + "(จำเป็น)" สำหรับ accessibility
- **Submit button:** disabled จนกว่า form valid + loading state เมื่อ submitting

### Navigation Patterns

**Mobile (< 768px):**
- Bottom tab bar — 4 tabs ถาวร
- Top bar: ชื่อหน้า + back button (ถ้าไม่ใช่ root) + hotel selector
- Offcanvas menu สำหรับ settings เพิ่มเติม

**Desktop (≥ 768px):**
- Left sidebar — collapsible, แสดง icon + label
- Top bar: breadcrumb + hotel selector + user menu
- Content area: max-width 1200px centered

**Transitions:**
- Page transitions: ไม่มี animation (fast, no distraction)
- Component transitions: 200ms ease สำหรับ hover, focus, expand/collapse
- Toast: slide-in from top-right, fade-out

### Additional Patterns

**Data Display:**
- ตัวเลขราคา: ใช้ mono font + ₿ prefix + จัดชิดขวา
- Percentage: สีเขียว + ▲ สำหรับ positive, สีแดง + ▼ สำหรับ negative
- Dates: "วันศุกร์ 12 มี.ค." (ไม่ใช่ "2026-03-12")
- เวลา: "2 นาทีก่อน", "เมื่อวาน 14:30" (relative + absolute)

**Error Handling:**
- Network error: "ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต" + retry button
- API error: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง" + error code สำหรับ support
- OTA sync error: แสดงเฉพาะ OTA ที่มีปัญหา ไม่ใช่ block ทั้งระบบ

## Responsive Design & Accessibility

### Responsive Strategy

**Mobile-First:** ออกแบบ mobile ก่อนแล้ว enhance สำหรับ desktop เพราะ core action (approve) เกิดบนมือถือเป็นหลัก

### Breakpoint Strategy

| Breakpoint | Device | Layout Changes |
|-----------|--------|---------------|
| **< 576px** | มือถือ (portrait) | Single column, bottom tabs, cards stack vertically, sidebar hidden |
| **576-767px** | มือถือ (landscape) / tablet portrait | 2-column cards, bottom tabs ยังอยู่ |
| **768-991px** | Tablet landscape | Sidebar appears (collapsed), bottom tabs hidden, 2-column content |
| **≥ 992px** | Desktop | Sidebar expanded, 3-column dashboard widgets, full data tables |

**Component Responsive Behavior:**

| Component | Mobile | Desktop |
|-----------|--------|---------|
| **RecommendationCard** | Full width, stacked | 2 columns side-by-side |
| **PriceComparisonGrid** | Horizontal scroll | Full table visible |
| **RevenueWidget** | Full width, stacked 2x2 | Row of 4 widgets |
| **Navigation** | Bottom tabs + offcanvas | Left sidebar |
| **Charts** | Simplified (bar chart) | Full (line + bar combo) |

### Accessibility Strategy

**WCAG 2.1 Level AA Compliance:**

| Requirement | Implementation |
|-------------|---------------|
| **Color contrast** | ทุก text ≥ 4.5:1 ratio (ตรวจด้วย Lighthouse) |
| **Keyboard navigation** | ทุก interactive element reachable via Tab, Enter, Escape |
| **Screen reader** | `aria-label` ภาษาไทยทุก button/icon, `role` attributes, `lang="th"` |
| **Focus management** | Visible focus ring (2px solid blue), logical tab order |
| **Motion** | `prefers-reduced-motion` — ปิด animation ถ้าผู้ใช้ตั้งค่าไว้ |
| **Text sizing** | ใช้ rem units ทั้งหมด — ผู้ใช้ zoom ได้ถึง 200% ไม่ break layout |
| **Touch targets** | Min 44x44px ทุกปุ่ม/link บนมือถือ |

### Testing Strategy

| ประเภท | เครื่องมือ | เมื่อไหร่ |
|--------|----------|---------|
| **Responsive** | Chrome DevTools device emulator | ทุก component |
| **Accessibility** | Lighthouse + axe DevTools | ทุก page |
| **Real device** | iPhone SE (small), iPhone 14 (medium), iPad | ก่อน deploy |
| **Thai typography** | ตรวจ word-wrap, line-height, font rendering | ทุก page |

### Implementation Guidelines

1. **CSS:** ใช้ Bootstrap SCSS variables + custom properties — ไม่ inline styles
2. **Images:** ใช้ `next/image` สำหรับ optimization + lazy loading
3. **Icons:** Bootstrap Icons หรือ React Icons — consistent set เดียว
4. **Loading:** Skeleton placeholders (Bootstrap `Placeholder`) ไม่ใช่ spinners สำหรับ page loads
5. **Error boundaries:** React Error Boundary wrap ทุก page — แสดง Thai error message ไม่ใช่ white screen
