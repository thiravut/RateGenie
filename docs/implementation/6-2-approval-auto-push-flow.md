# Story 6.2: Approval → Auto-Push Flow

Status: ready-for-dev

## Story

As a **เจ้าของโรงแรม**,
I want **เมื่อ approve คำแนะนำ AI ราคาถูก push ไป OTA ให้อัตโนมัติ**,
So that **ไม่ต้องไปแก้ราคาบน extranet เอง ประหยัดเวลา**.

## Acceptance Criteria

1. เมื่อกด [อนุมัติ] คำแนะนำ → ระบบ push ราคาใหม่ไปทุก OTA ที่เชื่อมต่อ
2. UI แสดงสถานะ push: "กำลัง push..." → "push สำเร็จ" หรือ "push ล้มเหลว"
3. เมื่อ push สำเร็จ recommendation status = "อนุมัติ + push แล้ว"
4. เมื่อ push ล้มเหลว แสดง error + option retry
5. Batch approve → batch push ทำงานได้
6. ส่ง notification สรุปผล push ผ่าน LINE/Telegram
7. Push History แสดงบนหน้า Hotels channel management

## Tasks / Subtasks

- [ ] Task 1: แก้ approve API ให้ trigger auto-push (AC: #1)
  - [ ] 1.1 แก้ POST /recommendations/[id]/approve ให้เรียก pushPrice() หลัง approve
  - [ ] 1.2 แก้ batch-approve ให้ push ทุก recommendation ที่ approve
  - [ ] 1.3 Return push results ใน approve response
- [ ] Task 2: แก้ Recommendations UI ให้แสดง push status (AC: #2, #3, #4)
  - [ ] 2.1 แสดง push status badge หลัง approve (pushing → pushed → failed)
  - [ ] 2.2 Retry button เมื่อ push ล้มเหลว
  - [ ] 2.3 Batch approve แสดง progress + summary
- [ ] Task 3: Push History UI บนหน้า Hotels (AC: #7)
  - [ ] 3.1 เพิ่ม Push History tab/section ในหน้า Hotels channel management
  - [ ] 3.2 แสดง push logs: OTA, room type, ราคา, status, เวลา
- [ ] Task 4: Notification หลัง push (AC: #6)
  - [ ] 4.1 เรียก notifyPushResult() หลัง push เสร็จ
  - [ ] 4.2 สรุป: กี่ OTA สำเร็จ/ล้มเหลว
- [ ] Task 5: Tests (AC: all)
  - [ ] 5.1 Test approve + push integration
  - [ ] 5.2 Test batch approve + push

## Dev Notes

### Existing Code to Modify

- `apps/src/app/api/hotels/[hotelId]/recommendations/[recommendationId]/approve/route.ts` — เพิ่ม pushPrice() call
- `apps/src/app/api/hotels/[hotelId]/recommendations/batch-approve/route.ts` — เพิ่ม batch push
- `apps/src/app/(dashboard)/recommendations/page.tsx` — แสดง push status
- `apps/src/app/(dashboard)/hotels/page.tsx` — เพิ่ม push history section
- `apps/src/lib/channex/push.ts` — ใช้ pushPrice() จาก Story 6.1
- `apps/src/lib/notifications/dispatcher.ts` — เพิ่ม notifyPushResult()

### Key Constraints

- Push เกิดขึ้น async หลัง approve — ไม่ block approve response
- ถ้า push ล้มเหลว recommendation ยัง approved อยู่ (แค่ push failed)
- Demo mode: push skipped แต่ show mock success

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
