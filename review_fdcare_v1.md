# Review — FDcare HIS v1: Worklist-driven Operating Model

> **Tài liệu được review:** [fdcare-his-v1-worklist-driven-operating-model-source-of-truth.md](fdcare-his-v1-worklist-driven-operating-model-source-of-truth.md) (anh Dũng đề xuất)
> **So với:** mô hình work-graph mình đang xây ([db_design_v1.md](db_design_v1.md))
> **Người review:** team kiến trúc/DB · **Ngày:** 2026-06-15
> **Phán quyết tóm tắt:** ✅ **Nên lấy làm baseline.** Đúng hướng, dễ hiểu, đúng chuẩn HIS, và vá đúng điểm yếu "khó hiểu" của hướng generic cũ. Nhưng còn **2 lỗ 🔴 phải bịt trước khi code** (liên kết WorkItem↔domain record; phụ thuộc giữa WorkItem) và **1 discontinuity cần anh D xác nhận** (app bệnh nhân/facade biến mất).

---

## 1. TL;DR cho người bận

Mô hình mới tách bạch 6 lớp: **Patient** (hồ sơ dài hạn) → **Visit** (khung vận hành trong ngày) → **WorkItem** (việc cần làm, MỎNG, chỉ điều phối) → **Domain records** (nguồn sự thật) + **CarePlan** (lộ trình nhiều ngày) + **Worklist views** (projection theo phòng).

Nó **đảo hướng** so với work-graph cũ: từ *"mọi thứ là node generic"* sang *"thực thể có tên theo nghiệp vụ, WorkItem chỉ điều phối còn data ở domain records"*. Câu *"không biến HIS thành Trello"* trong doc chính là tuyên bố từ bỏ hướng generic một cách có chủ đích — và tôi cho là **hợp lý**.

---

## 2. Mô hình mới (tóm tắt)

| Lớp | Vai trò | Trả lời câu hỏi |
|---|---|---|
| **Patient** | Hồ sơ bệnh nhân dài hạn | "Người này là ai" |
| **Visit** | Khung vận hành **trong một ngày** | "Hôm nay đến làm gì, phòng nào, hàng đợi nào" |
| **WorkItem** | Việc cần làm trong Visit, **mỏng**, chỉ điều phối | "Việc gì · phòng/vai trò nào · trạng thái nào" |
| **Domain records** | **Nguồn sự thật** nghiệp vụ | ClinicalDocument, VisitDiagnosis, ServiceOrder, ClsOrderLine/ClsResult, Prescription, Charge/Payment/Receipt, StockMovement, AuditLog |
| **CarePlan** | Lộ trình nhiều ngày/kỳ | "Lộ trình tới đâu — buổi nào xong/chờ/hoãn" |
| **Worklist views** | **Projection** hàng đợi theo phòng | Reception · Clinical · CLS · Billing · Pharmacy · Inventory |

**Ba câu chốt của anh D:** *Worklist = đường ray (điều phối). Domain records = nguồn sự thật. Patient = hồ sơ gốc, không phải trung tâm điều phối công việc trong ngày.*

---

## 3. Khác mô hình work-graph cũ thế nào — đây là đảo hướng, không phải tinh chỉnh

| | Work-graph cũ (db_design_v1) | FDcare v1 (mới) |
|---|---|---|
| Triết lý | Generic: "mọi thứ là node" | Concrete: thực thể có tên theo nghiệp vụ |
| Cấu trúc | `node` + `node_link` (M:N) + `task_bridge` + đệ quy | Patient→Visit→WorkItem (cố định) + domain records |
| Dữ liệu nghiệp vụ | Nhét trong CTI extension của node | Domain records riêng (chuẩn HIS) |
| Worklist | Node thật, lưu DB | **View/projection**, không lưu |
| Liệu trình N buổi | `node_tx_course` đệ quy | **CarePlan** first-class |
| Khách vs nội bộ | Facade (`visibility` + `task_bridge`) | **Không có** |
| Độ dễ đọc | Trừu tượng, khó hiểu | Tự kể chuyện, dễ onboard |

---

## 4. Điểm mạnh (đánh giá thẳng)

Mô hình mới vá đúng nỗi đau "đọc vô khó hiểu" của hướng generic, và làm **tốt hơn hẳn** ở 3 chỗ:

1. **CarePlan** giải case liệu trình N buổi — thứ làm gãy "cây 3 tầng" trong debate — một cách **sạch, không cần đệ quy**.
2. **"Hai trục" đơn giản hơn `link_role`:** WorkItem có owner-phòng (resource) + `visitId`→patient (clinical) bằng **FK thường**, không cần quan hệ M:N. Kết quả về bác sĩ chỉ định = **tạo WorkItem "đọc kết quả"** cho bác sĩ đó trong Clinical Worklist → cụ thể, vận hành được.
3. **Tách coordination khỏi data** (WorkItem mỏng vs domain records là source of truth) = đúng nguyên tắc, tránh bẫy "task chứa mọi thứ". POS/Patient360/Billing chỉ là projection từ Charge/Payment — chuẩn CQRS.

Mô hình này gần như map 1-1 với chuẩn HIS quốc tế (Visit≈Encounter, ServiceOrder≈ServiceRequest, ClsResult≈DiagnosticReport, CarePlan≈CarePlan) → là nền đã được kiểm chứng, không phải sáng chế lại.

---

## 5. Lỗ hổng / rủi ro / câu hỏi (findings)

| # | Mức | Vấn đề | Đề xuất bịt |
|---|---|---|---|
| **F1** | 🔴 | **Liên kết WorkItem ↔ Domain record chưa định nghĩa.** Doc nói "Khám Nội DONE nhưng data ở ClinicalDocument", nhưng không nói nối ra sao. 1 WorkItem khám đẻ ClinicalDocument + VisitDiagnosis + ServiceOrder + Prescription (1:N). | Chốt: domain record giữ `workItemId` (+ `visitId`); hoặc bảng nối nếu cần M:N. Định nghĩa rõ "WorkItem hoàn tất khi domain record nào đạt trạng thái gì". |
| **F2** | 🔴 | **Phụ thuộc giữa WorkItem chưa mô hình hóa.** "Đọc kết quả" chỉ mở sau khi CLS DONE — cái gì enforce? Bước 6 "tạo HOẶC mở lại WorkItem" — trigger ở đâu? | Thêm cơ chế precondition tường minh (bảng `work_item_dependency` hoặc rule cấu hình theo loại WorkItem). Đừng để logic thứ tự rải khắp app. |
| **F3** | 🟡 | **Owner của WorkItem là gì?** Doc trộn "Phòng Nội 01" / "CLS" / "Bác sĩ Nội". | Chốt model assignment: `roomId` / `specialtyId` / `roleId` / `assigneeId` — và worklist view lọc theo cái nào. Quyết định cả luồng đổi phòng. |
| **F4** | 🟡 | **Visit có 3 status** (admission/encounter/worklist) → dễ lệch nhau. | Vẽ state machine cho từng status + ai sở hữu + quy tắc đồng bộ; hoặc gộp bớt. |
| **F5** | 🟡 | **CarePlan ↔ Visit ↔ PlannedSession + reschedule chưa rõ.** | Định: Visit trỏ `plannedSessionId`; quy tắc hoãn/dời session; tiến độ "6/10" derive từ status của PlannedSession. |
| **F6** | 🟡 | **App bệnh nhân / facade biến mất.** Mô hình cũ có facade (`visibility` + `task_bridge`) theo đúng yêu cầu TRƯỚC của anh D ("khách chỉ biết vào phòng + nhận KQ", giấu cheat hack). Doc mới không có khái niệm bệnh nhân tự xem. | **Cần anh D xác nhận:** bỏ hẳn app khách, để phase sau, hay sẽ làm bằng projection? Ảnh hưởng schema đáng kể. |
| **F7** | 🟡 | **Charge tạo ngay lúc order** (Charge OPEN liền khi có ServiceOrderLine). Một số PK thu lúc checkout. Void/refund chỉ nhắc tên. | Xác nhận thời điểm tạo Charge cho FDcare; đặc tả flow void/refund + quyền. |
| **F8** | 🟢 | **Quy tắc "khi nào tạo WorkItem" tốt nhưng chủ quan** → team sẽ cãi edge case (đo sinh hiệu có là WorkItem? Reception worklist lại nhắc "cần đo sinh hiệu"). | Lập **danh mục WorkItem chuẩn** theo từng chuyên khoa, kèm tiêu chí quyết định. |
| **F9** | 🟢 | **Đa chi nhánh / MPI / RLS** không đụng tới (BLOCKER cũ vẫn treo). | Ghi rõ: Patient global hay theo chi nhánh; RLS theo `branchId` trên Visit/WorkItem/Charge. |
| **F10** | 🟢 | **"Tạo HOẶC mở lại WorkItem"** (Bước 6) nhập nhằng — tái mở (DONE→WAITING) hay luôn tạo mới? | Chốt 1 quy ước (ảnh hưởng audit + đếm số liệu vận hành). |

---

## 6. Câu hỏi cần anh D chốt (ưu tiên)

1. **(F1)** WorkItem nối domain record thế nào — `workItemId` trên domain record, hay bảng nối? Một WorkItem "khám" gom nhiều domain record (phiếu khám + chẩn đoán + chỉ định + đơn) ra sao?
2. **(F2)** Thứ tự/điều kiện mở WorkItem (vd "đọc KQ" sau "CLS xong") quản bằng dữ liệu (cấu hình) hay hardcode trong app?
3. **(F6)** App/màn hình cho **bệnh nhân tự xem** còn trong phạm vi không? (Trước đây anh D yêu cầu giấu nội bộ, chỉ cho khách thấy "vào phòng + nhận KQ" — mô hình mới chưa có phần này.)

---

## 7. Khuyến nghị

1. **Lấy mô hình mới làm baseline.** Đúng hướng, dễ hiểu, đúng chuẩn HIS, giải đúng nỗi đau của hướng cũ.
2. **Ghép vào 2 mảnh mà work-graph làm tốt hơn:** liên kết WorkItem↔domain record tường minh (F1) + dependency giữa WorkItem tường minh (F2). Đây chính là giá trị đã chứng minh của `task_bridge`/`node_dependency` — đừng vứt.
3. **Chốt F6 ngay** (app khách còn/không) trước khi vẽ schema chi tiết.
4. **Bỏ** generic `node`/`node_link`/`visibility` — không còn chỗ trong mô hình mới; giữ db_design_v1.md làm tài liệu lịch sử.

---

## 8. Ghi chú cuối

Mô hình mới **gần với bản reverse-engineering EzMon ban đầu** (Visit + phiếu khám + ServiceOrder + ...) hơn là với work-graph — tức anh D đã vòng lại hướng domain-driven, cộng thêm lớp WorkItem + CarePlan. Công sức work-graph **không phí**: chính nó làm lộ ra nguyên tắc *"coordination phải tách khỏi data"* — đúng cái mà doc mới giờ khẳng định thành nền tảng.
