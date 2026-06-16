# FDcare HIS v1 — Giải thích mô hình Worklist-driven cho Product & IT

> **Đối tượng:** Product, IT, BA, QA, Operations lead  
> **Mục tiêu:** Giúp team hiểu cùng một mô hình vận hành HIS v1 trước khi thiết kế UI/API/backend.  
> **Thông điệp chính:** HIS v1 không chỉ xoay quanh “bệnh nhân đang được chọn”. HIS v1 vận hành theo Visit trong ngày, WorkItems theo phòng/chuyên khoa, và domain records là nguồn sự thật nghiệp vụ.

---

## 1. Tóm tắt một câu

FDcare HIS v1 nên vận hành theo mô hình:

```text
Patient
→ Visit trong ngày
→ WorkItems theo phòng/chuyên khoa
→ Domain documents/orders/results/charges
→ CarePlan cho lộ trình nhiều ngày/kỳ
→ Worklist views cho từng phòng chức năng
```

Nói đơn giản:

```text
Bệnh nhân là hồ sơ dài hạn.
Mỗi lần đến phòng khám tạo một Visit trong ngày.
Trong Visit có nhiều việc cần làm.
Mỗi phòng nhìn việc của mình qua worklist.
Khi làm việc, hệ thống tạo ra hồ sơ khám, chỉ định, kết quả, đơn thuốc, charge, payment, tồn kho.
Nếu là lộ trình nhiều ngày thì CarePlan quản lý toàn bộ lộ trình.
```

---

## 2. Vì sao cần mô hình này?

Phòng khám thật không vận hành bằng một màn hình bệnh nhân duy nhất.

Một khách đến phòng khám có thể đi qua nhiều phòng:

```text
Lễ tân
→ Bác sĩ
→ CLS
→ Bác sĩ đọc kết quả
→ Thu ngân
→ Nhà thuốc
```

Mỗi phòng cần biết:

```text
Hôm nay phòng tôi phải làm gì?
Ai đang chờ?
Việc nào đang làm?
Việc nào đã xong?
Việc nào bị hoãn hoặc chuyển ngày?
```

Vì vậy, hệ thống phải có worklist theo phòng/chuyên khoa, không chỉ có “bệnh nhân đang được chọn”.

---

## 3. Thành phần 1 — Patient

**Patient** là hồ sơ bệnh nhân dài hạn.

Patient lưu:

- Thông tin định danh.
- Thông tin liên hệ.
- Lịch sử các lần đến khám.
- Các lộ trình điều trị hoặc gói dài hạn.
- Các hồ sơ y tế/tài chính liên quan.

Ví dụ:

```text
Nguyễn Văn A
- 15/06/2026: Khám Nội
- 20/06/2026: Tái khám
- 01/07/2026: Châm cứu buổi 1
- 03/07/2026: Châm cứu buổi 2
```

Patient không phải nơi điều phối mọi việc trong ngày. Điều phối trong ngày thuộc về Visit và WorkItems.

---

## 4. Thành phần 2 — Visit trong ngày

**Visit** là một lần bệnh nhân đến phòng khám trong một ngày.

Visit có thể hiểu là “phiên vận hành” của bệnh nhân trong ngày hôm đó.

Visit lưu:

- Bệnh nhân nào.
- Ngày nào.
- Chi nhánh nào.
- Phòng/chuyên khoa nào.
- Số thứ tự nào.
- Trạng thái tiếp nhận/lượt khám.

Ví dụ:

```text
Visit ngày 15/06/2026
Bệnh nhân: Nguyễn Văn A
Chi nhánh: Vinhomes Grand Park
Chuyên khoa: Nội
Phòng: Nội 01
Số thứ tự: 12
```

Tất cả việc phát sinh trong ngày nên gắn với Visit.

---

## 5. Thành phần 3 — WorkItems theo phòng/chuyên khoa

**WorkItem** là một việc cần làm trong Visit.

Ví dụ trong một Visit khám Nội:

```text
1. Khám Nội — phòng Nội — WAITING
2. Làm xét nghiệm MK49 — CLS — WAITING
3. Đọc kết quả xét nghiệm — phòng Nội — WAITING
4. Thanh toán — Thu ngân — WAITING
5. Cấp thuốc — Nhà thuốc — WAITING
```

WorkItem giúp hệ thống điều phối:

- Việc này thuộc phòng nào?
- Ai xử lý?
- Đang chờ hay đang làm?
- Đã xong hay bị hoãn?
- Có cần chuyển sang ngày khác không?

Các trạng thái gợi ý:

```text
WAITING
IN_SERVICE
DONE
CANCELLED
DECLINED
DEFERRED
CARRIED_OVER
```

---

## 6. Thành phần 4 — Domain records

Đây là phần dễ bị nhầm nhất.

WorkItem chỉ là “việc cần làm”.  
Dữ liệu nghiệp vụ thật nằm ở các domain records.

| WorkItem | Domain record thật |
|---|---|
| Khám bác sĩ | ClinicalDocument, VisitDiagnosis |
| Chỉ định xét nghiệm | ServiceOrder, ServiceOrderLine |
| Làm xét nghiệm | ClsOrderLine, ClsResult |
| Kê đơn | Prescription, PrescriptionLine |
| Thu tiền | Charge, Payment, Receipt |
| Cấp thuốc | Prescription fulfillment, StockMovement |
| Nhập/xuất kho | StockDocument, StockMovement |
| Thay đổi quyền / thao tác quan trọng | AuditLog |

Ví dụ:

```text
WorkItem: Làm xét nghiệm MK49
```

Không lưu kết quả xét nghiệm trong WorkItem.  
Kết quả phải nằm ở:

```text
ClsResult
```

Ví dụ:

```text
WorkItem: Thu tiền
```

Không lưu doanh thu thật trong WorkItem.  
Doanh thu phải nằm ở:

```text
Charge
Payment
PaymentAllocation
Receipt
```

Đây là điểm giúp HIS không biến thành phần mềm task chung chung.

---

## 7. Thành phần 5 — CarePlan cho lộ trình nhiều ngày/kỳ

Một số nghiệp vụ không chỉ diễn ra trong một ngày.

Ví dụ:

- Châm cứu 10 buổi.
- Vật lý trị liệu nhiều buổi.
- Gói thai sản nhiều mốc.
- Tái khám định kỳ.
- Điều trị da liễu nhiều lần.

Các trường hợp này cần **CarePlan**.

CarePlan quản lý toàn bộ lộ trình:

```text
CarePlan: Châm cứu 10 buổi
- Buổi 1: DONE
- Buổi 2: DONE
- Buổi 3: SCHEDULED
- Buổi 4: SCHEDULED
...
```

Khi bệnh nhân đến buổi 3:

```text
CarePlan
→ PlannedSession 3
→ Visit ngày hôm đó
→ WorkItem: Thực hiện châm cứu
→ Domain record: Phiếu/thông tin thực hiện
→ Charge nếu có
```

CarePlan không thay thế Visit.  
CarePlan quản lý lộ trình dài hạn, còn Visit quản lý một ngày làm việc cụ thể.

---

## 8. Thành phần 6 — Worklist views cho từng phòng chức năng

Mỗi phòng/vai trò có một màn hình hàng đợi riêng.

### 8.1. Lễ tân / CSKH

Nhìn thấy:

- Khách mới đến.
- Khách có lịch hẹn.
- Khách cần tạo Visit.
- Khách cần phân phòng/chuyên khoa.
- Khách cần đo sinh hiệu/tiền sử nếu có.

### 8.2. Bác sĩ / phòng khám

Nhìn thấy:

- Bệnh nhân chờ khám.
- Bệnh nhân đang khám.
- Bệnh nhân cần đọc kết quả.
- Bệnh nhân cần hoàn tất hồ sơ.
- Bệnh nhân cần kê đơn/hẹn tái khám.

### 8.3. CLS

Nhìn thấy:

- Chỉ định xét nghiệm/CĐHA đang chờ.
- Mẫu cần lấy.
- Kết quả cần nhập.
- Kết quả cần hoàn tất.

Nguồn của CLS Worklist là `ClsOrderLine`, không phải tất cả dịch vụ.

### 8.4. Thu ngân

Nhìn thấy:

- Các khoản Charge đang OPEN.
- Khách cần thanh toán.
- POS projection cần thu.
- Giao dịch cần biên lai.
- Công nợ còn lại.

### 8.5. Nhà thuốc

Nhìn thấy:

- Đơn thuốc đã kê.
- Đơn đã thanh toán chờ cấp.
- Đơn thiếu tồn.
- Đơn đã cấp.

### 8.6. Kho

Nhìn thấy:

- Phiếu nhập/xuất chờ duyệt.
- Lô gần hết hạn.
- Cảnh báo thiếu tồn.
- Stock movement cần kiểm tra.

---

## 9. Flow mẫu để team hình dung

### Tình huống

Bệnh nhân đến khám Nội, bác sĩ chỉ định xét nghiệm, đọc kết quả, kê đơn, thu tiền và cấp thuốc.

### Flow

```text
1. Lễ tân chọn/tạo Patient
2. Lễ tân tạo Visit trong ngày
3. Hệ thống tạo WorkItem Khám Nội
4. Bác sĩ nhìn Clinical Worklist và mở WorkItem
5. Bác sĩ ghi ClinicalDocument và VisitDiagnosis
6. Bác sĩ tạo ServiceOrder MK49
7. Hệ thống tạo Charge OPEN
8. Vì MK49 là CLS, hệ thống tạo ClsOrderLine và WorkItem CLS
9. CLS nhìn CLS Worklist, thực hiện xét nghiệm, tạo ClsResult FINAL
10. Hệ thống tạo/mở WorkItem Đọc kết quả cho bác sĩ
11. Bác sĩ đọc kết quả, cập nhật hồ sơ, kê đơn
12. Hệ thống tạo Prescription, Charge thuốc, Pharmacy Worklist
13. Thu ngân nhìn Billing Worklist và thu tiền
14. Hệ thống tạo Payment, PaymentAllocation, Receipt
15. Nhà thuốc nhìn Pharmacy Worklist và cấp thuốc
16. Hệ thống ghi StockMovement và AuditLog
17. Visit hoàn tất khi các WorkItems bắt buộc đã DONE hoặc được đóng hợp lệ
```

---

## 10. Quy tắc chung cho Product/IT khi thiết kế

### 10.1. Khi có một nghiệp vụ mới, hỏi 5 câu

```text
1. Nghiệp vụ này thuộc Patient, Visit, CarePlan hay Domain record?
2. Có cần tạo WorkItem không?
3. Phòng/vai trò nào xử lý WorkItem?
4. Dữ liệu thật của nghiệp vụ nằm ở entity nào?
5. Có phát sinh Charge, Payment, Inventory hoặc Audit không?
```

### 10.2. Khi nào tạo WorkItem?

Tạo WorkItem nếu việc đó:

- Có người/phòng phụ trách rõ.
- Cần vào hàng đợi.
- Có trạng thái xử lý riêng.
- Có thể hoàn thành/hủy/hoãn/chuyển ngày.
- Có thể phát sinh domain record.

Không tạo WorkItem cho mọi field nhỏ trong form.

### 10.3. Khi nào dùng CarePlan?

Dùng CarePlan nếu nghiệp vụ kéo dài qua nhiều ngày/kỳ:

- Châm cứu nhiều buổi.
- Vật lý trị liệu.
- Thai sản nhiều mốc.
- Tái khám định kỳ.
- Điều trị theo liệu trình.

---

## 11. Câu chốt cho team

```text
Patient là hồ sơ gốc.
Visit là phiên vận hành trong ngày.
WorkItem là việc cần làm.
Domain record là dữ liệu nghiệp vụ thật.
CarePlan là lộ trình dài hạn.
Worklist view là hàng đợi của từng phòng chức năng.
```

FDcare HIS v1 nên là:

```text
Worklist-driven HIS
+ Domain records as source of truth
+ CarePlan for long-term journeys
```

Không phải:

```text
Task manager chung chung
```

và cũng không phải:

```text
Một màn hình bệnh nhân đang chọn điều khiển toàn bộ hệ thống
```

---

## 12. Kết quả kỳ vọng khi team hiểu đúng mô hình

Nếu Product, IT, BA, QA cùng hiểu mô hình này, các quyết định sau sẽ nhất quán hơn:

- UI không bị thiết kế theo kiểu chỉ chọn một bệnh nhân rồi lọc mọi màn hình.
- Backend không bị thiết kế thành task table chứa tất cả nghiệp vụ.
- Billing không bị nhầm thành POS task.
- CLS không có kết quả nếu chưa có chỉ định.
- Nhà thuốc không cấp thuốc nếu chưa có prescription/payment/inventory gate.
- CarePlan không bị nhầm với Visit dài nhiều ngày.
- UAT test case sẽ rõ hơn vì mỗi bước có WorkItem, domain record và audit riêng.
