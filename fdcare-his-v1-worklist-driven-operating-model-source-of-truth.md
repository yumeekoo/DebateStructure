# FDcare HIS v1 — Worklist-driven Operating Model

> **Loại tài liệu:** Source of truth / nguồn sự thật nghiệp vụ - kiến trúc vận hành  
> **Đối tượng sử dụng:** Product, IT, BA, Backend, Frontend, QA/UAT  
> **Trạng thái:** Draft baseline để đưa vào nguồn dự án HIS v1  
> **Mục tiêu:** Chốt mô hình vận hành HIS theo hướng worklist-driven, nhưng không biến HIS thành phần mềm task management chung chung.

---

## 1. Mô hình đã chốt

Mô hình vận hành HIS v1 của FDcare được định hướng như sau:

```text
Patient
→ Visit trong ngày
→ WorkItems theo phòng/chuyên khoa
→ Domain documents/orders/results/charges
→ CarePlan cho lộ trình nhiều ngày/kỳ
→ Worklist views cho từng phòng chức năng
```

Đây là mô hình **worklist-driven operating model**.

Ý nghĩa:

- **Patient** là hồ sơ bệnh nhân dài hạn.
- **Visit** là một lượt đến/phần vận hành trong một ngày.
- **WorkItem** là việc cần làm trong Visit, được giao cho phòng/chuyên khoa/vai trò cụ thể.
- **Domain records** là dữ liệu nghiệp vụ thật: phiếu khám, chẩn đoán, chỉ định, kết quả CLS, đơn thuốc, khoản phải thu, thanh toán, biên lai, tồn kho, audit.
- **CarePlan** là lộ trình nhiều ngày/kỳ như châm cứu, vật lý trị liệu, thai sản, tái khám định kỳ.
- **Worklist views** là hàng đợi làm việc của từng phòng chức năng.

Câu chốt:

```text
Worklist là đường ray vận hành.
Domain records là nguồn sự thật nghiệp vụ.
Patient là hồ sơ gốc, không phải trung tâm điều phối toàn bộ công việc trong ngày.
```

---

## 2. Patient — Hồ sơ bệnh nhân dài hạn

**Patient** là hồ sơ gốc của người bệnh/khách hàng.

Patient trả lời câu hỏi:

```text
Người này là ai?
Thông tin định danh là gì?
Lịch sử đến khám gồm những Visit nào?
Có CarePlan/lộ trình/gói nào đang theo?
Có công nợ, đơn thuốc, hồ sơ y tế nào liên quan?
```

Patient có thể có nhiều Visit trong nhiều ngày khác nhau, nhiều chuyên khoa khác nhau, nhiều lộ trình điều trị và nhiều dữ liệu tài chính/y tế.

Ví dụ:

```text
Patient: Nguyễn Văn A

Visit 01: 15/06/2026 — Khám Nội
Visit 02: 20/06/2026 — Tái khám Nội
Visit 03: 01/07/2026 — Châm cứu buổi 1
Visit 04: 03/07/2026 — Châm cứu buổi 2
```

Patient không phải nơi chứa toàn bộ công việc đang chờ xử lý. Các việc trong ngày phải nằm dưới Visit và được điều phối bằng WorkItems.

---

## 3. Visit trong ngày — Phiên vận hành của bệnh nhân trong một ngày

**Visit** là một lượt đến phòng khám trong một ngày cụ thể.

Visit trả lời câu hỏi:

```text
Hôm nay bệnh nhân đến làm gì?
Được tiếp nhận ở chi nhánh nào?
Vào phòng/chuyên khoa nào?
Có số thứ tự/hàng chờ nào?
Trong ngày hôm nay còn việc gì chưa xong?
```

Một Visit nên có tối thiểu:

| Thuộc tính | Ý nghĩa |
|---|---|
| `patientId` | Bệnh nhân của lượt khám |
| `branchId` | Chi nhánh |
| `facilityId` | Cơ sở/phòng khám nếu có |
| `visitDate` | Ngày vận hành |
| `specialtyId` | Chuyên khoa chính ban đầu |
| `roomId` | Phòng được phân ban đầu |
| `queueNumber` | Thứ tự trong ngày/phòng |
| `admissionStatus` | Trạng thái tiếp nhận |
| `encounterStatus` | Trạng thái encounter/lượt khám |
| `worklistStatus` | Trạng thái vận hành trên worklist |

Visit là khung vận hành trong ngày. Tất cả WorkItems, hồ sơ khám, chỉ định, kết quả, đơn thuốc, charge, payment liên quan đến ngày đó phải gắn với Visit hoặc có đường liên kết rõ về Visit.

---

## 4. WorkItems theo phòng/chuyên khoa

**WorkItem** là một việc cụ thể cần được thực hiện trong Visit.

WorkItem trả lời câu hỏi:

```text
Việc gì cần làm?
Việc này thuộc Visit nào?
Phòng/chuyên khoa/vai trò nào chịu trách nhiệm?
Đang chờ, đang làm, đã xong, bị hủy hay chuyển ngày?
```

Một Visit có thể có nhiều WorkItems.

Ví dụ:

```text
Visit ngày 15/06/2026 của Nguyễn Văn A

WorkItems:
1. Tiếp nhận — Lễ tân — DONE
2. Khám Nội — Bác sĩ Nội — IN_SERVICE
3. Làm xét nghiệm MK49 — CLS — WAITING
4. Đọc kết quả xét nghiệm — Bác sĩ Nội — WAITING
5. Thanh toán — Thu ngân — WAITING
6. Cấp thuốc — Nhà thuốc — WAITING
```

### 4.1. Trạng thái WorkItem

Các trạng thái khuyến nghị:

| Status | Ý nghĩa |
|---|---|
| `WAITING` | Đang chờ xử lý |
| `IN_SERVICE` | Đang được phòng/vai trò phụ trách xử lý |
| `DONE` | Đã hoàn thành |
| `CANCELLED` | Đã hủy hợp lệ |
| `DECLINED` | Khách từ chối thực hiện |
| `DEFERRED` | Hoãn lại, chưa chuyển sang ngày khác |
| `CARRIED_OVER` | Chuyển sang Visit/ngày tiếp theo |

Không nên dùng chỉ hai trạng thái `DONE / NOT_DONE`, vì vận hành phòng khám có nhiều tình huống hợp lệ: khách từ chối, hết giờ, chuyển ngày, hủy chỉ định, đổi phòng, thiếu tồn kho, chờ kết quả.

### 4.2. Khi nào nên tạo WorkItem riêng?

Chỉ tạo WorkItem riêng khi việc đó có một hoặc nhiều đặc điểm:

- Có phòng/chuyên khoa/vai trò khác chịu trách nhiệm.
- Có hàng đợi riêng.
- Có trạng thái riêng.
- Có thể phát sinh thời gian chờ.
- Có thể phát sinh charge/kết quả/đơn thuốc/chứng từ.
- Cần audit riêng.
- Có thể bị hoãn/chuyển ngày/hủy.

Ví dụ nên là WorkItem riêng:

- Khám bác sĩ.
- Làm xét nghiệm.
- Đọc kết quả CLS.
- Thực hiện thủ thuật.
- Thanh toán.
- Cấp thuốc.
- Duyệt phiếu kho.

Ví dụ không nhất thiết là WorkItem riêng:

- Ghi triệu chứng.
- Ghi tiền sử.
- Ghi khám lâm sàng.
- Chọn ICD.
- Nhập liều dùng thuốc.

Các việc nhỏ bên trong phiếu có thể là field/section/checklist của domain document, không cần biến thành WorkItem.

---

## 5. Domain documents / orders / results / charges

WorkItem chỉ điều phối việc cần làm. Dữ liệu nghiệp vụ thật phải nằm trong các domain records.

| Nhóm nghiệp vụ | Domain record nguồn sự thật |
|---|---|
| Khám bệnh | `ClinicalDocument` |
| Chẩn đoán | `VisitDiagnosis` |
| Chỉ định dịch vụ | `ServiceOrder`, `ServiceOrderLine` |
| Cận lâm sàng | `ClsOrderLine`, `ClsResult` |
| Kê đơn | `Prescription`, `PrescriptionLine` |
| Khoản phải thu | `Charge` |
| Thanh toán | `Payment`, `PaymentAllocation` |
| Biên lai | `Receipt` |
| Cấp thuốc / tồn kho | `StockLot`, `StockMovement`, `InventoryReservation` |
| Nhật ký thao tác | `AuditLog` |

### 5.1. ClinicalDocument

Lưu nội dung phiếu khám:

- Lý do khám.
- Triệu chứng.
- Tiền sử.
- Khám lâm sàng.
- Nhận định.
- Hướng xử trí.
- Nội dung form theo chuyên khoa.

WorkItem “Khám Nội” có thể hoàn thành, nhưng hồ sơ khám thật nằm ở `ClinicalDocument`.

### 5.2. VisitDiagnosis

Lưu ICD/chẩn đoán của Visit:

- ICD code.
- ICD name.
- Chẩn đoán chính/phụ.
- Người ghi nhận.
- Thời điểm ghi nhận.
- Trạng thái.

Chẩn đoán ICD không nên chỉ là text tự do trong phiếu khám.

### 5.3. ServiceOrder / ServiceOrderLine

Khi bác sĩ chỉ định dịch vụ, hệ thống tạo `ServiceOrder` và `ServiceOrderLine`.

Ví dụ:

```text
ServiceOrder
- Visit: 15/06/2026
- Ordered by: BS Nội

ServiceOrderLines
- MK49 — xét nghiệm
- Siêu âm bụng
```

Mỗi dòng chỉ định có thể phát sinh:

- `Charge`.
- `ClsOrderLine` nếu là dịch vụ CLS.
- WorkItem cho phòng thực hiện.

### 5.4. ClsOrderLine / ClsResult

Nếu một `ServiceOrderLine` là dịch vụ cận lâm sàng, hệ thống tạo `ClsOrderLine`.

Chuỗi đúng:

```text
ServiceOrder
→ ServiceOrderLine
→ ClsOrderLine
→ ClsResult
```

`ClsOrderLine` là yêu cầu thực hiện.  
`ClsResult` là kết quả sau khi thực hiện.

Không tạo kết quả CLS trôi nổi nếu không có yêu cầu/chỉ định tương ứng.

### 5.5. Prescription / PrescriptionLine

Khi bác sĩ kê đơn, hệ thống tạo `Prescription`.

Đơn thuốc lưu:

- Thuốc.
- Số lượng.
- Liều dùng.
- Cách dùng.
- Bác sĩ kê.
- Trạng thái đơn.
- Liên kết với Charge và cấp phát thuốc.

### 5.6. Charge / Payment / Receipt

Mỗi dịch vụ hoặc thuốc có tính tiền phải tạo `Charge`.

`Charge` là nguồn sự thật tài chính.

```text
ServiceOrderLine / PrescriptionLine
→ Charge OPEN
→ Payment
→ PaymentAllocation
→ Receipt
→ Charge PAID
```

POS, công nợ, Patient360 tài chính, Billing Worklist chỉ là các cách hiển thị/projection từ Charge và Payment.

### 5.7. Inventory / StockMovement

Cấp thuốc, nhập kho, xuất kho, điều chỉnh tồn phải ghi nhận bằng stock domain records.

Ví dụ:

```text
Dispense PAR014
→ Trừ tồn theo lô
→ StockMovement
→ AuditLog
```

Không để task “đã cấp thuốc” thay thế sổ tồn kho.

---

## 6. CarePlan cho lộ trình nhiều ngày/kỳ

**CarePlan** dùng cho những trường hợp không thể gói trong một Visit một ngày.

CarePlan trả lời câu hỏi:

```text
Bệnh nhân đang theo lộ trình nào?
Lộ trình gồm bao nhiêu buổi/kỳ/mốc?
Buổi nào đã xong?
Buổi nào còn chờ?
Buổi nào bị hoãn/chuyển lịch?
```

Ví dụ:

```text
CarePlan: Châm cứu 10 buổi

Session 1 — 01/07/2026 — DONE
Session 2 — 03/07/2026 — DONE
Session 3 — 05/07/2026 — SCHEDULED
...
```

Khi bệnh nhân đến thực hiện Session 3:

```text
CarePlan
→ PlannedSession 3
→ Visit ngày 05/07/2026
→ WorkItem: Thực hiện châm cứu
→ Domain record: Procedure/Treatment document
→ Charge nếu có
```

### 6.1. Phân biệt Patient / CarePlan / Visit / WorkItem

| Thành phần | Vai trò |
|---|---|
| Patient | Hồ sơ bệnh nhân dài hạn |
| CarePlan | Lộ trình dài hạn nhiều ngày/kỳ |
| PlannedSession | Một buổi/mốc trong lộ trình |
| Visit | Một lượt đến trong một ngày |
| WorkItem | Việc cần làm trong Visit |
| Domain record | Bằng chứng nghiệp vụ phát sinh |

Ví dụ gói thai sản:

```text
CarePlan: Gói thai sản
- Mốc 12 tuần
- Mốc 16 tuần
- Mốc 20 tuần
- Mốc 24 tuần
...

Mỗi mốc khi khách đến:
→ tạo Visit
→ tạo WorkItems
→ tạo phiếu khám / siêu âm / xét nghiệm / charge
```

---

## 7. Worklist views cho từng phòng chức năng

**Worklist view** là màn hình/hàng đợi của từng phòng hoặc từng vai trò.

Worklist view trả lời câu hỏi:

```text
Hôm nay phòng tôi cần xử lý những việc gì?
Ai đang chờ?
Ai đang làm?
Việc nào đã xong?
Việc nào bị hoãn?
Việc nào quá hạn?
```

### 7.1. Reception Worklist

Dành cho Lễ tân/CSKH.

Hiển thị:

- Bệnh nhân mới đến.
- Bệnh nhân đã đặt lịch.
- Bệnh nhân cần tạo Visit.
- Bệnh nhân cần đo sinh hiệu.
- Bệnh nhân cần phân phòng/chuyên khoa.

Reception tạo Visit và WorkItems ban đầu.

### 7.2. Clinical Worklist

Dành cho bác sĩ/phòng khám.

Hiển thị:

- Bệnh nhân chờ khám.
- Bệnh nhân đang khám.
- Bệnh nhân cần đọc kết quả CLS.
- Bệnh nhân cần tái đánh giá.
- Bệnh nhân cần hoàn tất hồ sơ.

Bác sĩ mở WorkItem từ Clinical Worklist, sau đó tạo/cập nhật ClinicalDocument, VisitDiagnosis, ServiceOrder, Prescription.

### 7.3. CLS Worklist

Dành cho xét nghiệm/cận lâm sàng.

Hiển thị:

- Chỉ định CLS đang chờ.
- Mẫu cần lấy.
- Kết quả cần nhập.
- Kết quả cần hoàn tất.

Nguồn của CLS Worklist là `ClsOrderLine`, không phải mọi dịch vụ.

Ví dụ:

```text
MK49 → vào CLS Worklist
DG06 tư vấn → không vào CLS Worklist
```

### 7.4. Billing Worklist

Dành cho thu ngân.

Hiển thị:

- Charge đang OPEN.
- Khách còn công nợ.
- POS projection cần thanh toán.
- Payment cần biên lai.
- Giao dịch cần void/refund theo quyền.

Nguồn của Billing Worklist là `Charge`, `Payment`, `Receipt`, `POSOrderProjection`.

### 7.5. Pharmacy Worklist

Dành cho nhà thuốc.

Hiển thị:

- Đơn thuốc đã kê.
- Đơn thuốc đã thanh toán chờ cấp.
- Đơn thuốc thiếu tồn.
- Đơn thuốc đã cấp.
- Đơn cần gửi DQG ở phase sau.

Pharmacy Worklist liên kết Prescription, Billing và Inventory.

### 7.6. Inventory Worklist

Dành cho kho.

Hiển thị:

- Phiếu nhập kho chờ duyệt.
- Phiếu xuất kho chờ duyệt.
- Cảnh báo thiếu tồn.
- Lô gần hết hạn.
- Stock movement cần kiểm tra.

---

## 8. Flow mẫu: khám Nội có xét nghiệm và kê đơn

### Bước 1 — Lễ tân tạo Visit

```text
Patient: Nguyễn Văn A
Visit: 15/06/2026
Specialty: Nội
Room: Nội 01
Queue: 12
```

Hệ thống tạo WorkItem:

```text
WorkItem: Khám Nội
Owner: Phòng Nội 01
Status: WAITING
```

### Bước 2 — Bác sĩ mở lượt khám

Bác sĩ nhìn Clinical Worklist:

```text
12 — Nguyễn Văn A — Chờ khám Nội
```

Bác sĩ mở lượt:

```text
WorkItem: WAITING → IN_SERVICE
```

### Bước 3 — Bác sĩ ghi phiếu khám và chẩn đoán

Hệ thống tạo/cập nhật:

```text
ClinicalDocument: Phiếu khám Nội
VisitDiagnosis: J06.9
```

### Bước 4 — Bác sĩ chỉ định xét nghiệm

Bác sĩ tạo:

```text
ServiceOrder
ServiceOrderLine: MK49
```

Hệ thống phát sinh:

```text
Charge: OPEN, amount = 23.600đ
ClsOrderLine: ORDERED
WorkItem: CLS xét nghiệm MK49 — WAITING
```

### Bước 5 — CLS thực hiện

KTV CLS nhìn CLS Worklist:

```text
Nguyễn Văn A — MK49 — WAITING
```

KTV xử lý:

```text
WorkItem CLS: WAITING → IN_SERVICE → DONE
ClsResult: FINAL
```

### Bước 6 — Bác sĩ đọc kết quả

Hệ thống tạo hoặc mở lại WorkItem:

```text
WorkItem: Đọc kết quả MK49 — WAITING
```

Bác sĩ đọc kết quả, cập nhật hồ sơ, kê đơn nếu cần.

### Bước 7 — Kê đơn

Bác sĩ tạo:

```text
Prescription
PrescriptionLine: PAR014
```

Hệ thống phát sinh:

```text
Charge thuốc: OPEN
POS projection
Pharmacy dispense queue
Inventory reservation nếu có
```

### Bước 8 — Thu tiền

Thu ngân nhìn Billing Worklist:

```text
Nguyễn Văn A
- MK49: 23.600đ
- PAR014: 8.060đ
```

Thu ngân thu tiền:

```text
Payment COMPLETED
PaymentAllocation
Receipt
Charge PAID
```

### Bước 9 — Cấp thuốc

Nhà thuốc nhìn Pharmacy Worklist:

```text
Nguyễn Văn A — PAR014 — đã thanh toán — chờ cấp
```

Dược cấp thuốc:

```text
Prescription: DISPENSED
StockMovement: xuất kho
AuditLog
```

### Bước 10 — Visit hoàn tất

Visit có thể hoàn tất khi các WorkItems bắt buộc đã có trạng thái kết thúc hợp lệ:

```text
Khám Nội: DONE
CLS MK49: DONE
Đọc kết quả: DONE
Thanh toán: DONE
Cấp thuốc: DONE
```

Hoặc nếu có việc không thể hoàn thành trong ngày, WorkItem phải được kết thúc bằng trạng thái hợp lệ như `DEFERRED`, `DECLINED`, `CANCELLED`, hoặc `CARRIED_OVER`.

---

## 9. Nguyên tắc thiết kế bắt buộc

| Nguyên tắc | Diễn giải |
|---|---|
| Worklist điều phối, không thay thế nghiệp vụ | WorkItem không chứa toàn bộ dữ liệu khám/chỉ định/kết quả/thanh toán |
| Visit là khung vận hành trong ngày | Không dồn toàn bộ việc vào Patient |
| Domain records là source of truth | Phiếu khám, chỉ định, kết quả, charge, payment, receipt là dữ liệu thật |
| CarePlan quản lý lộ trình dài hạn | Không kéo dài một Visit vô hạn qua nhiều ngày |
| Worklist views phục vụ từng phòng | Mỗi phòng nhìn hàng đợi của mình, không phụ thuộc vào bệnh nhân đang chọn toàn cục |
| Task nhỏ nằm trong form nếu không cần hàng đợi riêng | Không biến HIS thành Trello |

---

## 10. Tóm tắt cuối

```text
Patient = hồ sơ bệnh nhân dài hạn
Visit = lần đến phòng khám trong một ngày
WorkItem = việc cần làm trong Visit
Domain record = dữ liệu nghiệp vụ thật
CarePlan = lộ trình dài hạn nhiều ngày/kỳ
Worklist view = hàng đợi của từng phòng chức năng
```

Luồng đúng:

```text
Patient
→ tạo Visit trong ngày
→ Visit sinh ra WorkItems
→ WorkItems đi vào worklist của từng phòng
→ mỗi phòng xử lý WorkItem
→ khi xử lý thì tạo/cập nhật domain records
→ domain records phát sinh kết quả, charge, payment, receipt, stock
→ nếu là lộ trình dài hạn thì CarePlan quản lý nhiều Visit
```

Đây là mô hình nền tảng cho FDcare HIS v1.
