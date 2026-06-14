# Tổng kết Debate: Kiến trúc Worklist / Task / Subtask

> **Mục đích tài liệu:** Phản biện kiến trúc do anh Dũng đề xuất, trả lời câu hỏi gốc *"có tồn tại case nghiệp vụ thực tế nào mà mô hình này không hiện thực hóa được không?"*, và chốt thành một **quyết định đánh đổi rõ ràng** để leader chủ động chọn.
>
> **Phạm vi:** Tiếp nhận, khám, điều trị, cận lâm sàng. (Tạm bỏ qua thanh toán, thuốc.)
>
> **Kết luận một dòng:** Không có case nào *bất khả thi*, nhưng mô hình "cây 3 tầng" chỉ sống được bằng cách **liên tục thu hẹp phạm vi nghiệp vụ**. Bản chất thực của nghiệp vụ phòng khám là **đồ thị công việc (work-graph)**, không phải cây. Câu hỏi thật không phải "đúng/sai" mà là **"trả giá bằng schema hay trả giá bằng phạm vi?"**

---

## 1. Phát biểu lại kiến trúc của anh Dũng

Mọi nghiệp vụ được trừu tượng hóa về cấu trúc đệ quy 3 tầng:

```
Worklist  →  Tasklist (Task)  →  Subtask
```

Điểm cốt lõi (đã chốt trong họp): **cùng một thực thể thực tế đóng 2 vai trò tùy góc nhìn.**

| Góc nhìn | Worklist | Task | Subtask |
|---|---|---|---|
| Theo bệnh nhân | 1 Visit (lượt khám) | Khám phòng Nội | (các bước khám) |
| Theo nguồn lực | Phiên làm việc phòng Nội | Khám BN A, khám BN B | (các bước) |

→ "Khám BN A ở phòng Nội" vừa là task của **Visit-A**, vừa là task của **Phiên-phòng-Nội**.
**Quyết định đã chốt:** đây là **CÙNG 1 task, 2 cha (giao điểm)** — một bản ghi duy nhất, hai cha cùng tham chiếu.

---

## 2. Vấn đề nền tảng: "1 task 2 cha" tự mâu thuẫn với "cây"

- "Worklist → Task → Subtask" là ngôn ngữ của **cây** (mỗi node 1 cha).
- "1 task 2 cha" là ngôn ngữ của **đồ thị / quan hệ nhiều-nhiều**.

Ngay khoảnh khắc một task có 2 cha:
- Không thể dùng cột `parent_id` đơn → **bắt buộc bảng nối** `node_link(parent, child)`. Schema "3 tầng đẹp" biến mất từ bảng đầu tiên.
- **Thứ tự (order) thuộc về cha nào?** Trong Visit-A, "khám Nội" đứng trước "xét nghiệm". Trong Phiên-phòng-Nội, cùng task đó xếp theo giờ đến, xen kẽ A/B/C. → ordering **phải nằm trên cạnh nối**, không nằm trên task.

---

## 3. VẬT CHỨNG: Liệu trình điều trị N buổi (nghiệp vụ cốt lõi, đã xác nhận có thật)

> **Tình huống:** Bác sĩ chỉ định MỘT lần *"Châm cứu, liệu trình 10 buổi"*. Bệnh nhân đến 10 ngày khác nhau. Mỗi buổi do kỹ thuật viên thực hiện, có sinh hiệu + ghi nhận riêng.

Ép mô hình cây trả lời:

**"Liệu trình" là 1 task hay 10 task?**
- Nếu **1 task**: nó thuộc Visit nào? 10 lượt đến = 10 Visit → 1 task thuộc 10 worklist → **không còn "2 cha" mà là "N cha"** → chắc chắn nhiều-nhiều, chắc chắn cần bảng nối. *(knock-out cho cây)*
- Nếu **10 task**: cái gì gom 10 task thành "một liệu trình" để theo dõi "đã châm 6/10 buổi"? → cần **node cha "Liệu trình"** chen giữa Visit và Task → **tầng thứ 4**. Con số "3" gãy.

**Mỗi buổi lại có các bước (chuẩn bị → châm → theo dõi → dặn dò):**
- Nếu liệu trình=task, buổi=subtask, thì bước-trong-buổi = **tầng 4**. Gãy lần nữa.

**Kết luận vật chứng:** Chỉ một nghiệp vụ cốt lõi đã ép mô hình vi phạm **cả hai** giả định cùng lúc — "cây" (N cha) và "3 tầng" (4 tầng).

---

## 4. Củng cố: phụ thuộc giữa task là xương sống, không phải ngoại lệ

Granula (lời anh Dũng): *"một số tác có ràng buộc phụ thuộc — phải có kết quả xét nghiệm trước khi làm tác tiếp theo."*

Đây là cạnh **task → task ngang hàng**, tồn tại trong **mọi luồng khám bình thường** (khám → chỉ định XN → *chờ KQ* → kê đơn). Cây không có chỗ cho cạnh ngang. → đồ thị là **hình dạng mặc định**, không phải trường hợp hiếm.

---

## 5. Ba đòn phản công của anh Dũng — và cách hóa giải

### Đòn 1: "Buổi 2–10 không tạo Visit mới, check-in vào liệu trình đang mở → vẫn 1 cha."
**Hóa giải:** Cứu được cha-con ở tầng Liệu-trình, nhưng giao điểm **trượt xuống tầng Buổi**: buổi châm ngày thứ 7 *phải* xuất hiện trong hàng đợi-phòng ngày thứ 7 → buổi đó có 2 cha (Liệu-trình + Phiên-phòng-ngày-7). **Giao điểm không biến mất, chỉ di dời.** Thêm nữa: "1 Visit kéo dài nhiều tuần" làm hỏng khái niệm "lượt khám/ngày" trong báo cáo.

### Đòn 2: "Phụ thuộc chỉ là validation rule lúc runtime, không phải cạnh — hardcode là đủ."
**Hóa giải:** Đúng *nếu* phụ thuộc là cố định toàn hệ thống. Nhưng granula nói task có *"thứ tự tham khảo, **không bắt buộc** chạy theo thứ tự"* và *"**một số** tác có ràng buộc"* → phụ thuộc **khác nhau theo từng quy trình, do người dựng quyết định** = **dữ liệu (config)**, không phải **luật (code)**. Khi là config theo ca → **bắt buộc bảng cạnh**.
> **Câu hỏi chốt cho anh Dũng:** Phụ thuộc giữa task là cố định toàn hệ thống, hay người dựng quy trình tự định nghĩa cho từng loại worklist? Nếu vế sau → hardcode sụp. Nếu vế trước → mọi thay đổi quy trình = sửa code + deploy.

### Đòn 3: "4 tầng là over-engineer — gộp buổi & bước, ghi bước bằng free-text. Vẫn 3."
**Hóa giải:** Đây là đòn mạnh nhất và có giá trị vĩnh viễn (đừng ép MỌI thứ thành node). NHƯNG nếu "bước trong buổi" chỉ là text thì **mất**: gán người thực hiện từng bước, đo thời gian, báo cáo chi tiết — mà granula lại đòi *"sinh hiệu + người thực hiện mỗi buổi"* (buổi cần là node có thuộc tính).
> **Phản biện sắc nhất:** Vấn đề không phải 3 hay 4 — mà là **chốt con số TRƯỚC khi biết nghiệp vụ cần mấy tầng.** Châm cứu cần 3, khám thường cần 2, gói tổng quát cần 4. Bảng tự đệ quy **không tốn gì hơn** 3 bảng cứng (cùng số cột, cùng độ phức tạp với recursive CTE) nhưng **gỡ bỏ hoàn toàn rủi ro gãy ở tầng 4**. Cố định "3" là giới hạn nhân tạo không đổi lấy lợi ích nào.

---

## 6. QUYẾT ĐỊNH CỐT LÕI: trả giá bằng SCHEMA hay bằng PHẠM VI?

Mọi case quy về một câu hỏi. **Không có lựa chọn thứ ba "vừa đơn giản vừa không giới hạn".**

| Tiêu chí | 🌳 Đường A: Cây 3 tầng cứng | 🕸️ Đường B: Work-graph (DAG + đệ quy) |
|---|---|---|
| Cấu trúc cha-con | `parent_id` trên node | Bảng nối `node_link(parent, child, order)` |
| Số tầng | Cố định 3 | Tùy biến (đệ quy) |
| Phụ thuộc task | Hardcode trong code | Bảng `dependency(from, to, type)` |
| Giao điểm Visit×Phòng | Phải chọn 1 cha → mất 1 góc nhìn | Tự nhiên (1 node, N cạnh) |
| Số bảng cốt lõi | 3 | ~3 (node + link + dependency) |
| Độ phức tạp query | JOIN tường minh, dễ đọc | Recursive CTE (khó hơn chút) |
| **CHI PHÍ THẬT** | **Nghiệp vụ bị giới hạn** | **Schema/query phức tạp hơn** |
| Gãy nếu chọn sai | Sprint 3 phát hiện B3 → **đập tầng dữ liệu** | Hầu như không gãy; chỉ là học recursive CTE |

### Nếu chọn Đường A, phải CÔNG KHAI chấp nhận 3 giới hạn:
1. Visit phải kéo dài để gánh liệu trình → "lượt khám/ngày" mất nghĩa. *(Đòn 1)*
2. Quy trình = hardcode → đổi luồng phải sửa code + deploy. *(Đòn 2)*
3. Không model được bước-trong-buổi → mất theo dõi chi tiết nhất. *(Đòn 3)*

### Nếu chọn Đường B, đánh đổi chỉ là:
- Recursive CTE (Postgres `WITH RECURSIVE` — chuẩn, không exotic).
- UI render cây động (1 component đệ quy, viết 1 lần).
- 1 buổi training khái niệm đồ thị.

---

## 7. Khuyến nghị: chọn Đường B, gọi tên là "work-graph"

1. **Chi phí bất đối xứng.** Sai của A *không sửa rẻ* (đập schema giữa dự án). "Sai" của B chỉ là *học một kỹ thuật query* (sửa được, một lần). Rủi ro phá hủy vs rủi ro học tập → chọn học tập.
2. **B3 là nghiệp vụ cốt lõi có thật**, không phải edge case. Kiến trúc phải bóp méo khái niệm trung tâm (Visit) để sống = dấu hiệu chọn sai trục.
3. **Đường B không phản bội ý tưởng anh Dũng — nó hoàn thiện nó.** Tinh thần "mọi nghiệp vụ là việc-trong-việc, lồng nhau" **chính là định nghĩa của đồ thị công việc**. Anh ấy đúng về *trực giác*, chỉ chưa đúng về *tên gọi & độ cứng*.

**Lưu ý cân bằng (tôn trọng mối lo over-engineering của anh Dũng):** Work-graph **không** ép mọi thứ thành node. Nó *cho phép* tầng 4 khi cần (gói tổng quát), *không bắt buộc* (khám thường dừng ở tầng 2). Độ sâu do **nghiệp vụ** quyết định, không do giáo điều.

---

## 8. Bước tiếp theo

- [ ] Trả lời **câu hỏi chốt ở Đòn 2** (phụ thuộc = config hay code?) — quyết định có cần bảng `dependency` không.
- [ ] Thiết kế DB cho Đường B: `node`, `node_link`, `dependency` + kiểm 1NF/2NF/3NF.
- [ ] Map lại các nghiệp vụ EzMon (BLUEPRINT_v1) lên work-graph để xác nhận không sót.
