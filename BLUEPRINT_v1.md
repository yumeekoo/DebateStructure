# 🏛️ REVERSE-ENGINEERING BLUEPRINT v1.0
## EzMon — Hệ thống Quản lý Phòng khám Đa chi nhánh (YHCT Focus)

**Nguồn:** 56 PDF hướng dẫn sử dụng (Supademo format, dạng screenshot)  
**Phương pháp:** 6-step Chain-of-Thought Reverse-Engineering Framework  
**Quy ước nhãn:** `[FACT]` = quan sát trực tiếp | `[INFERRED]` = suy luận logic | `[STANDARD]` = áp dụng chuẩn ngành

---

## BƯỚC 1: PHÂN TÍCH GIAO DIỆN

### 1.1 Danh sách Màn hình và Module

| Module ID | Tên Module | Vai trò chính | Nguồn |
|---|---|---|---|
| M0 | In mã BN / Xem-Sửa thông tin BN / Hồ sơ ngoại viện | Lê Tân | Folder 000 |
| M1a | Tiếp nhận bệnh nhân | Lê Tân | Tiếp nhận.pdf + Folder 000 |
| M1b | Đo chỉ số cơ thể / Sinh hiệu | Lê Tân | Folders 001–004 |
| M1c | Tiền sử bệnh | Lê Tân | Folders 005–006 |
| M2a | Thanh toán | Quầy TT | Folder 008 |
| M2b | Hóa đơn điện tử | Quầy TT | Folder 007 |
| M3a | Phiếu khám YHCT | Bác sĩ | Clinic_HUT_Phiếu khám.pdf |
| M3b | Phiếu chỉ định dịch vụ | Bác sĩ | Folder 009 |
| M3c-1 | Đơn đông dược | Bác sĩ | Folder 010 |
| M3c-2 | Đơn hóa dược | Bác sĩ | ⚠️ Chưa đọc |
| M3d | Phiếu hẹn tái khám | Bác sĩ | Folders 011, 048 |
| M3e | Patient 360 (Màn hình tổng hợp bệnh nhân) | Bác sĩ | Folder 012 |
| M4a-1 | Thực hiện dịch vụ ngoài chỉ định (phát sinh) | Lab/CĐHA | Folder 013 |
| M4a-2 | Thực hiện dịch vụ được chỉ định | Lab/CĐHA | Folder 014 |
| M4b | Thực hiện CĐHA | CĐHA | Folder 015 |
| M4c | Cấp mã vạch / Cấp lại / Hủy | Xét nghiệm | Folders 016–018 |
| M4d | Thực hiện xét nghiệm | Xét nghiệm | Folder 019 |
| M4e | Kết quả XN gửi ngoài | Xét nghiệm | Folders 020–021 |
| M4f | Kết quả CĐHA gửi ngoài / Xóa file | CĐHA | Folders 022–024 |
| M5a | Kho — Tạo phiếu | Kho | Folders 026–030 |
| M5b | Kho — Duyệt nhập kho | Kho | Folders 031–033 |
| M5c | Kho — Duyệt xuất dự trù | Kho | Folders 034–036 |
| M5d | Kho — Duyệt nhập luân chuyển | Kho | Folders 037–039 |
| M5e | Kho — Kết chuyển tồn kho | Kho | Folders 040–042 |
| M5f | Kho — Kiểm kê điều chỉnh | Kho | Folders 043–045 |
| M5g | Kho — Xem tồn kho | Kho | Folders 046–047 |
| M6 | Đặt hẹn / Quản lý lịch hẹn | Lê Tân / Bác sĩ | Folder 048 |
| M7a | Cổng QG — Danh mục tài khoản bác sĩ | Admin | Folders 049–052 |
| M7b | Cổng QG — Đẩy đơn thuốc | Admin / BS | Folders 053–054 |
| M8 | Báo cáo (8 báo cáo đã xác nhận) | Vai trò Báo cáo | Folder 055 |
| M9 | Hệ thống (Cấu hình quản trị) | Admin | ⚠️ Chưa đọc |
| M10 | Điều Trị | ⚠️ Chưa xác định | ⚠️ Chưa đọc |

### 1.2 Cấu trúc Điều hướng

**Thanh điều hướng toàn cục (phụ thuộc vai trò — mỗi vai trò thấy một tập con):**

```
[Logo/Chọn chi nhánh] > [Các tab module] > [Badge người dùng/vai trò]
                                             "APIS - Phòng khám YHCT"
```

**Thanh điều hướng theo vai trò (đã xác nhận):**

| Vai trò | Các tab hiển thị |
|---|---|
| Lê Tân | Lê Tân · Thanh toán · Khám bệnh · Điều Trị · CDHA · Cổng TTQG · Báo cáo · Kho · Hệ thống · Lịch hẹn · Dashboard |
| Bác sĩ | Lê Tân · Khám bệnh · CĐHA · Xét nghiệm · Điều Trị · Thanh toán · Đặt hẹn · Cổng TTQG · Dashboard · Báo cáo · Hệ thống |
| Quầy TT | Bệnh nhân · Thanh toán · Cổng TTQG · Kho · Dashboard · Báo cáo · Hệ thống · Lịch hẹn |
| Báo cáo | Khám bệnh · Cận Lâm Sàng · Điều Trị · Lịch hẹn · Kho · Dashboard · Báo cáo · Hệ thống |
| Kho | Tab tập trung vào kho — chưa xác nhận đầy đủ các sub-tab |
| Xét nghiệm | Tab riêng cho xét nghiệm |
| CĐHA | Tab riêng cho chẩn đoán hình ảnh |

**Cấu trúc sub-tab (đã xác nhận):**

```
Tiếp nhận
  └── Sub-tab trong panel giữa: Tư vấn ban đầu | Đo sinh hiệu | Tiền sử bệnh | Thêm đợt khám

Khám bệnh
  └── TRÁI: Danh sách bệnh nhân — Hàng đợi / Tất cả
  └── GIỮA: Lưới thumbnail phiếu đợt khám → nút [+] → chọn loại phiếu (10+)

Thanh toán
  └── Tab: Thanh toán | Tạo hóa đơn điện tử | Tra cứu hóa đơn điện tử
  └── Tab màn hình: Bán hàng | Các đơn đã bán | Chi tiết doanh thu

Kho (chính)
  └── Kho CV: Danh sách phiếu nhập | Danh sách phiếu xuất | Dự trù mua hàng
        | Duyệt kho | Duyệt phiếu xuất dự trù | Import Excel | Kết chuyển | Kiểm kê tồn

Cổng TTQG
  └── Sub-tab: Danh mục đơn thuốc QG | Đẩy cổng đơn thuốc QG

Báo cáo
  └── Màn hình đơn với 5 nhóm danh mục; thanh tìm kiếm; nút Cấu hình
```

### 1.3 Phân tích Mẫu Giao diện

| Mẫu UI | Nơi sử dụng | Ý nghĩa nghiệp vụ |
|---|---|---|
| Bố cục 3 cột (danh sách / chi tiết / lịch sử) | Tiếp nhận, Thanh toán | Luồng làm việc của Lê Tân / thu ngân |
| Lưới thumbnail (phiếu đợt khám) | Khám bệnh | Bác sĩ nhìn tổng quan trạng thái các phiếu bằng màu sắc |
| Panel xem trước PDF cố định bên phải | Khám bệnh | Bác sĩ xem phiếu vừa hoàn tất trong khi chỉnh sửa phiếu tiếp theo |
| Badge vàng ⏰ / xanh ✓ trên thumbnail | Khám bệnh | Trạng thái phiếu hiển thị ngay lập tức bằng màu sắc |
| Modal toàn màn hình (biểu mẫu lâm sàng) | Tất cả biểu mẫu phiếu | Biểu mẫu lâm sàng yêu cầu tập trung hoàn toàn |
| Cây phân cấp (danh mục dịch vụ) | Phiếu chỉ định, Kho | Phân loại → Dịch vụ theo cấp bậc |
| Bảng thêm dòng "Thêm dòng" | Dị ứng, Lịch sử có thai, Phiếu chỉ định DV | Nhập liệu nhiều dòng có cấu trúc |
| Thanh công cụ tắt (dải icon) | Màn hình bác sĩ theo đợt khám | Tạo phiếu nhanh một lần click |
| Nhập giọng nói | Sinh hiệu, biểu mẫu khám, đơn thuốc | Tăng tốc độ nhập liệu lâm sàng |
| Rich text editor (WYSIWYG với thước kẻ) | Nhập kết quả CĐHA | Báo cáo có cấu trúc kèm template theo loại dịch vụ |
| Quản lý template theo từng trường | Ô văn bản trong biểu mẫu khám | Khối văn bản tái sử dụng theo bác sĩ/phòng khám |
| Nút dropdown "Tùy chọn" | Hàng bệnh nhân trong màn hình Tiếp nhận | Thao tác ngữ cảnh trên bệnh nhân được chọn |
| Chỉ báo bước (quy trình 3 bước) | Quy trình mã vạch xét nghiệm | Dẫn kỹ thuật viên XN theo đúng trình tự |
| Danh sách nhóm theo kỳ (Kết chuyển) | Kết chuyển tồn kho | Đóng kỳ kho hàng tháng theo từng loại kho |
| Số thứ tự Supademo "X of N" | Tất cả PDF | Đếm bước hướng dẫn — KHÔNG PHẢI số tính năng |

---

## BƯỚC 2: TRÍCH XUẤT THỰC THỂ VÀ SƠ ĐỒ QUAN HỆ

### 2.1 Danh sách Thực thể

| Thực thể | Nhãn | Các trường đã xác nhận | Ghi chú |
|---|---|---|---|
| **Chi nhánh (Cơ sở)** | [INFERRED] | Tên cơ sở; hiển thị trong tiêu đề góc trên phải | Luôn hiển thị "APIS - Phòng khám YHCT" |
| **Bệnh nhân** | [FACT] | Mã BN (260001xxx tự động); Mã tiêm chủng; Tên; Ngày/Năm sinh; Giới tính; Quốc tịch; CCCD/CMND/Passport (loại + số); Số ĐT; Email; Địa chỉ; Danh sách người liên hệ (tên+quan hệ+SĐT+năm sinh, nhiều dòng); Thông tin xuất HĐ công ty | Master Patient Index — dùng chung giữa các chi nhánh |
| **Đợt khám** | [FACT] | Thời gian; Đối tượng (loại bảo hiểm); Chuyên khoa; Loại lần khám; Nguồn khách hàng; Nguồn giới thiệu; Chỉ định DV nhanh | Aggregate Root của tất cả phiếu lâm sàng |
| **Lần đo sinh hiệu** | [FACT] | Cân nặng (kg); Chiều cao (cm); Vòng cánh tay (cm); Vòng bụng (cm); Nhiệt độ (°C); Mạch (l/p); SpO2 (%); Huyết áp (sys/dia mmHg); BMI [tự động tính]; Cân nặng đề xuất [tự động tính]; Kết luận sơ bộ; Ghi chú | Cho phép nhiều lần đo trong một đợt khám |
| **Tiền sử bệnh** | [FACT] | Lưu trữ xuyên lượt khám, liên kết với Bệnh nhân (không phải Đợt khám) | Lưu lâu dài, cập nhật tại chỗ |
| **Dị ứng** | [FACT] | Phân nhóm (Thuốc/Thực phẩm/Môi trường); Tác nhân; Phản ứng; Mức độ | Lưu theo hàng bảng, không phải văn bản tự do |
| **Tiền sử gia đình** | [FACT] | Tên bệnh; Quan hệ; Ghi chú | Lưu theo hàng bảng |
| **Đã phẫu thuật** | [FACT] | ⚠️ Các trường chưa xác nhận đầy đủ | Có nút Chỉnh sửa |
| **Bệnh mạn tính** | [FACT] | ⚠️ Các trường chưa xác nhận từ biểu mẫu chỉnh sửa (xác nhận tồn tại trong màn hình Patient 360) | |
| **Lịch sử có thai** | [FACT] | Lần; Năm; Cân nặng trẻ (kg); Phương pháp sinh; Tình trạng sau sinh | Lưu theo hàng bảng, thực thể con của Tiền sử Sản phụ khoa |
| **Thai kỳ hiện tại** | [FACT] | Thai lần số; LMP (Kỳ kinh cuối); Tuổi thai [TỰ ĐỘNG TÍNH từ LMP]; EDD (Ngày dự sinh) | Tuổi thai được tính tự động |
| **Tiền sử phụ khoa** | [FACT] | ⚠️ Các trường chưa đọc | Có nút Chỉnh sửa riêng |
| **Phiếu khám YHCT** | [FACT] | Lý do đến khám; Bệnh sử; Tiền sử; Toàn thân; Các bộ phận; XN CLS cần làm; Khám YHCT; Xử trí; Bát cương; Nguyên nhân; Tạng phủ; Kinh mạch; Định vị bệnh (đình/vệ/khí/huyết); Sinh hiệu [tự động điền]; Chẩn đoán ICD (nhiều dòng); Thời gian ký; Người khám bệnh | Phiếu lâm sàng YHCT cốt lõi |
| **Chẩn đoán ICD** | [FACT] | Mã ICD; Chi tiết ICD; Mã ICD YHCT; Chi tiết ICD YHCT; ICD chính [boolean] | Mã kép; 1+ mã/phiếu; đúng 1 mã được đánh dấu là chính |
| **Phiếu chỉ định DV** | [FACT] | ⚠️ Metadata đầu phiếu + dòng dịch vụ | Phiếu chỉ định dịch vụ nội bộ |
| **Dòng phiếu chỉ định** | [FACT] | Tên dịch vụ; SL; Thành tiền; Phòng thực hiện; Loại thanh toán; Vị trí; Ghi chú; Trạng thái; Hẹn thực hiện | Mỗi dịch vụ trong một phiếu chỉ định |
| **Danh mục dịch vụ** | [FACT] | Mã DV; Tên DV; Giá BH; Giá VP | Cây phân cấp: Nhóm → Dịch vụ |
| **Đơn đông dược** | [FACT] | Số thang; Liều dùng; Từ ngày/Đến ngày; Bác sĩ kê đơn; Người đánh máy; Thời gian kê đơn; Cách sắc thuốc; Cách uống; Lời dặn | Nhãn loại "DL - VP" |
| **Dòng đơn đông dược** | [FACT] | Hoạt chất (Biệt dược); SL; Ghi chú; ĐVT (gam); Đơn giá; Thành tiền | |
| **Đơn hóa dược** | [FACT — tồn tại] | ⚠️ Các trường cụ thể chưa đọc | Nhãn loại "TP - VP" (suy luận từ cổng QG) |
| **Phiếu hẹn tái khám** | [FACT] | Người hẹn khám; Hẹn khám vào (datetime); Ghi chú; Chỉ định thực hiện trước [bảng dịch vụ] | Nút chọn nhanh: 2/3/6 tháng/1 năm |
| **Patient 360 View** | [FACT] | Dashboard tổng hợp chỉ đọc: sinh hiệu mới nhất, thuốc đang dùng, kết quả XN, CĐHA, tiền sử, lịch hẹn sắp tới, ghi chú | CHỈ ĐỌC — không phải phiếu có thể ghi |
| **Mã vạch XN** | [FACT] | Tham chiếu dịch vụ; Chất lượng mẫu; Ngày giờ lấy mẫu | Vòng đời được theo dõi |
| **Kết quả XN** | [FACT] | Người lấy mẫu; Ngày giờ lấy mẫu; Chất lượng mẫu; Người thực hiện; Người duyệt kết quả; Ngày duyệt; Dòng kết quả (Kết quả + Bất thường flag + Đơn vị + GT tham chiếu) | Liên kết với dòng phiếu chỉ định DV |
| **Kết quả CĐHA** | [FACT] | Dịch vụ; Vùng khảo sát chi tiết; Người thực hiện; Người đánh máy; Nội dung [rich text với template theo loại DV]; Hình ảnh [file đính kèm] | Template ECG: Chuyển đạo mẫu, Nhịp tần số, Trục, P, QRS, ST, T, QT, Góc α, Tư thế tim, PQ |
| **KQ gửi ngoài** | [FACT] | Cho cả XN và CĐHA; dựa trên file đính kèm | Tách biệt khỏi kết quả nội bộ |
| **Đơn hàng thanh toán** | [FACT] | Mã đơn (PH-YYYYMMDD-NNN); Loại; Nhãn; Thông tin bệnh nhân; Dòng hàng (DV + SP + ngoài DM) | Tổng hợp thanh toán cho đợt khám |
| **Hóa đơn điện tử** | [FACT] | Liên kết với đơn hàng; tạo theo lô | |
| **Sản phẩm/Thuốc** | [FACT] | Mã SP; Tên SP; ĐVT; Hoạt chất; Hàm lượng; Nước SX | Danh mục gốc |
| **Tồn kho lô** | [FACT] | Mã SP + Lô + Hạn dùng → đơn vị tồn kho duy nhất; Tồn đầu; SL nhập; SL xuất; SL tồn; Tồn thiếu | Theo dõi theo lô |
| **Kho** | [FACT] | 3 loại đã xác nhận: Kho lẻ bán thuốc; Kho Thuốc dược liệu; Kho vật tư tiêu hao | |
| **Phiếu kho** | [FACT] | 10 loại (xem Module 5); Mã phiếu (PNK26-NNN); Ngày nhập/xuất; Ngày HD; Số HD; Nhà cung cấp; Tiếp liệu; Hình thức TT; Ngày duyệt; Người duyệt | Đầu phiếu + dòng hàng hóa |
| **Dòng phiếu kho** | [FACT] | Mã SP; Tên SP; ĐVT; SL; Đơn giá; VAT%; ĐG VAT; Lô; Hạn dùng | Dòng hàng hóa theo lô |
| **Đợt kết chuyển** | [FACT] | Kỳ (hàng tháng); Kho; Ngày kết chuyển; Ngày kiểm kê; Người tạo; Người điều chỉnh | Đóng kỳ hàng tháng theo từng kho |
| **Kiểm kê tồn** | [FACT] | Mỗi dòng lô: Mã SP; Tên SP; ĐVT; Ngày nhập; Đơn giá; Số lô; Hạn dùng; Tồn trước ĐC; Tồn sau ĐC | Biên bản kiểm kê thực tế |
| **Lịch hẹn** | [FACT] | Liên kết với Bệnh nhân; Người hẹn; Hẹn khám vào; Ghi chú; Chỉ định thực hiện trước | Quản lý trong module Lịch hẹn |
| **Mẫu văn bản** | [FACT] | Tên mẫu; Nội dung | Gắn với từng trường trong biểu mẫu khám; ⚠️ phạm vi (theo bác sĩ/phòng khám/chi nhánh) chưa xác nhận |
| **Ghi chú bệnh nhân** | [FACT] | Tác giả; Thời gian; Nội dung | Xuyên lượt khám, dạng chat, theo bệnh nhân |
| **TK cổng QG bác sĩ** | [FACT] | Mã CSKCB; Tên đăng nhập; Chuyên môn; Khoa; Đã có TK LTQG; Đã liên kết TK CS KCB | Liên kết bác sĩ với cổng quốc gia |
| **Bản ghi đẩy cổng QG** | [FACT] | Mã đơn (RX-YYMMDD-seq); Loại (TP-VP); Ngày ký; Người kê đơn; Mã BN; Tóm tắt; Trạng thái ký điện tử; Trạng thái; Mã đơn thuốc QG; Tài khoản gửi; Thời gian gửi | Bản ghi liên thông cổng QG |
| **Báo cáo** | [FACT] | 8 báo cáo đã xác nhận; mỗi báo cáo có bộ lọc riêng | Xem Module 8 |

### 2.2 Sơ đồ Quan hệ Thực thể

```
CHI NHÁNH (Cơ sở) [1]
  └── [N] BỆNH NHÂN               — Master Patient Index; dùng chung giữa các chi nhánh
        ├── [1] TIỀN SỬ BỆNH      — lưu lâu dài, xuyên lượt khám, theo bệnh nhân
        │     ├── [N] Dòng DỊ ỨNG
        │     ├── [N] Dòng TIỀN SỬ GIA ĐÌNH
        │     ├── [N] Dòng ĐÃ PHẪU THUẬT
        │     ├── [1] TIỀN SỬ SẢN PHỤ KHOA
        │     │     └── [N] Dòng LỊCH SỬ CÓ THAI
        │     └── [N] Dòng BỆNH MẠN TÍNH
        ├── [N] GHI CHÚ BỆNH NHÂN — dạng chat, xuyên lượt khám
        ├── [N] ĐỢT KHÁM          ← AGGREGATE ROOT của tất cả phiếu lâm sàng
        │     ├── [N] LẦN ĐO SINH HIỆU
        │     ├── [N] PHIẾU (đa hình; các loại bên dưới)
        │     │     ├── PHIẾU KHÁM YHCT
        │     │     │     └── [N] CHẨN ĐOÁN ICD
        │     │     ├── PHIẾU CHỈ ĐỊNH DV
        │     │     │     └── [N] DÒNG CHỈ ĐỊNH DV
        │     │     │           └── [N] MÃ VẠCH XN → KẾT QUẢ XN
        │     │     │           └── [N] KẾT QUẢ CĐHA
        │     │     ├── ĐƠN ĐÔNG DƯỢC
        │     │     │     └── [N] DÒNG ĐƠN ĐÔNG DƯỢC
        │     │     ├── ĐƠN HÓA DƯỢC
        │     │     │     └── [N] DÒNG ĐƠN HÓA DƯỢC
        │     │     ├── PHIẾU HẸN TÁI KHÁM
        │     │     │     └── [N] DỊCH VỤ TRƯỚC HẸN (Chỉ định thực hiện trước)
        │     │     ├── PHIẾU CHỈ ĐỊNH DV NGOÀI
        │     │     ├── LỊCH TIÊM ĐIỀU TRỊ [⚠️ chưa đọc module]
        │     │     ├── PHIẾU CHUYỂN VIỆN [⚠️ chưa đọc module]
        │     │     └── [Loại thứ 10] ⚠️ CHƯA XÁC ĐỊNH
        │     └── [N] ĐƠN HÀNG THANH TOÁN — tổng hợp thanh toán cho đợt khám
        │           └── [N] DÒNG THANH TOÁN (DV + SP)
        │           └── [1] HÓA ĐƠN ĐIỆN TỬ
        └── [N] BẢN GHI ĐẨY CỔNG QG → CỔNG QUỐC GIA

KHO [N trên mỗi chi nhánh]
  ├── [N] TỒN KHO LÔ (Mã SP + Lô + Hạn dùng)
  ├── [N] PHIẾU KHO (10 loại)
  │     └── [N] DÒNG PHIẾU KHO (theo lô)
  └── [N] ĐỢT KẾT CHUYỂN (hàng tháng)
        └── [N] Dòng KIỂM KÊ TỒN (theo lô, kiểm kê thực tế)

DANH MỤC DV — phân cấp Nhóm → Dịch vụ
DANH MỤC SP — có theo dõi theo lô
BÁC SĨ → [1] TÀI KHOẢN CỔNG QG
MẪU VĂN BẢN — theo từng trường, theo bác sĩ hoặc phòng khám [⚠️ phạm vi chưa xác nhận]
```

### 2.3 Xác định Aggregate Root

| Aggregate Root | Thực thể con | Lý do là root |
|---|---|---|
| **Đợt khám** | Tất cả phiếu lâm sàng, lần đo sinh hiệu, đơn hàng thanh toán | Mọi hoạt động lâm sàng đều bắt đầu và kết thúc bằng đợt khám; xóa đợt khám sẽ cascade toàn bộ dữ liệu con |
| **Bệnh nhân** | Tiền sử bệnh (lâu dài), ghi chú bệnh nhân, tất cả đợt khám | Danh tính bệnh nhân là lớp ngoài cùng; tuân thủ MPI |
| **Phiếu kho** | Dòng phiếu kho | Phiếu xuất nhập kho độc lập với bệnh nhân |
| **Đơn hàng thanh toán** | Dòng thanh toán, hóa đơn điện tử | Thanh toán là aggregate riêng biệt, có tham chiếu ngược về đợt khám |

---

## BƯỚC 3: PHÂN TÍCH SƠ ĐỒ TRẠNG THÁI

### 3.1 Sơ đồ trạng thái: Phiếu (Tất cả loại phiếu — CHUNG)

```
           ┌──────────────────────────────────────────────────┐
           │                                                    │
        [TẠO MỚI]                                        [HỦY HOÀN TẤT]
           │                                              (có xác nhận)
           ▼                                                    │
    ┌─────────────┐    [LƯU & HOÀN TẤT]    ┌──────────────────┐
    │   PENDING   │ ───────────────────────▶│   COMPLETED      │
    │  (vàng ⏰)  │                          │  (xanh ✓)        │
    │  chỉnh sửa │◀───────────────────────  │  ĐÃ KHÓA         │
    │  được      │                          │  PDF được tạo    │
    └─────────────┘                         └──────────────────┘
           │                                         │
           │ [LƯU]                             [IN PHIẾU]
           │ (lưu nháp,                    (in bất kỳ lúc nào)
           │  vẫn PENDING)
           ▼
    ┌─────────────┐
    │    NHÁP     │ (trạng thái con của PENDING — vẫn chỉnh sửa được)
    │   ĐÃ LƯU   │
    └─────────────┘
```

**Quy tắc kích hoạt:**
- `LƯU` (Ctrl+S): lưu nháp; trạng thái vẫn là PENDING; biểu mẫu vẫn chỉnh sửa được
- `LƯU & HOÀN TẤT` / `HOÀN TẤT`: khóa biểu mẫu; tạo PDF có dấu thời gian; ghi lại tác giả
- `HỦY HOÀN TẤT`: yêu cầu hộp thoại xác nhận; trả về PENDING; mở lại chỉnh sửa
- `IN PHIẾU` (Ctrl+P / Ctrl+I): khả dụng ở mọi trạng thái; in nội dung hiện tại
- **Cơ chế khóa**: Biểu mẫu dùng cơ chế PESSIMISTIC — khóa cứng phía server. Hủy khóa phải thực hiện tường minh qua "Hủy hoàn tất."
- **Trường hợp đặc biệt `Phiếu hẹn tái khám`**: Có thêm thao tác `HỦY HẸN` (hủy lịch hẹn — khác với hủy khóa biểu mẫu)

### 3.2 Sơ đồ trạng thái: Mã vạch + Kết quả XN

```
[DỊCH VỤ ĐÃ CHỈ ĐỊNH trong Phiếu chỉ định DV]
           │
    ┌──────▼──────┐
    │   ORDERED   │
    └──────┬──────┘
           │ [Cấp mã vạch]
    ┌──────▼──────────┐    [Cấp lại mã vạch]
    │ BARCODE_ISSUED  │◀──────────────────────┐
    └──────┬──────────┘                        │
           │                          [Hủy mã vạch]
    ┌──────▼──────┐                       │
    │  EXECUTED   │     [CANCELLED]◀──────┘
    └──────┬──────┘
           │ [Đưa kết quả — Nhập KQ]
    ┌──────▼──────────┐
    │ RESULT_ENTERED  │
    │  (có Người duyệt│
    │   kết quả)      │
    └─────────────────┘
```

**Trường dữ liệu ghi lại tại mỗi chuyển trạng thái:**
- BARCODE_ISSUED: ghi lại Chất lượng mẫu, Ngày giờ cấp
- EXECUTED: ghi lại Người thực hiện
- RESULT_ENTERED: ghi lại các dòng kết quả + Người duyệt kết quả + Ngày duyệt

### 3.3 Sơ đồ trạng thái: Phiếu kho

```
    ┌──────────┐    [Tạo phiếu]    ┌──────────┐
    │  (trống) │──────────────────▶│   NHÁP   │
    └──────────┘                   └──────┬───┘
                                          │ [Trình]
                                   ┌──────▼─────────┐
                                   │   ĐÃ TRÌNH     │
                                   └──────┬─────────┘
                                          │ [Duyệt]
                                   ┌──────▼─────────┐    [Hủy duyệt]
                                   │   ĐÃ DUYỆT     │◀──────────────
                                   └────────────────┘──────────────▶
                                                          CHƯA DUYỆT
                                                          (quay về
                                                          ĐÃ TRÌNH)
```

**Phê duyệt 2 cấp đã xác nhận**: Trường Ngày duyệt + Người duyệt trong đầu phiếu.

### 3.4 Sơ đồ trạng thái: Đợt kết chuyển

```
    ┌────────────────────┐
    │  KỲ ĐANG MỞ        │ (tháng hiện tại, giao dịch tồn kho đang hoạt động)
    └───────┬────────────┘
            │ [Kiểm kê tồn — đã thực hiện đếm thực tế]
    ┌───────▼──────────────┐
    │  ĐÃ KIỂM KÊ          │ [Đã Trình để duyệt]
    └───────┬──────────────┘
            │ [Bấm nút Kết chuyển]
    ┌───────▼─────────────────┐
    │  ĐÃ KẾT CHUYỂN          │ (snapshot tồn kho đã khóa cho kỳ này)
    └─────────────────────────┘
```

### 3.5 Sơ đồ trạng thái: Đẩy đơn thuốc Cổng QG

```
    ┌─────────────┐
    │  CHƯA GỬI   │ (đơn thuốc vừa được tạo trong hệ thống)
    └──────┬──────┘
           │ [Ký điện tử]
    ┌──────▼──────────┐
    │    ĐÃ KÝ        │ (đã ký số)
    └──────┬──────────┘
           │ [Gửi đơn]
           │
    ┌──────▼──────────┐       ┌──────────────────────┐
    │    ĐÃ GỬI       │  HOẶC │ GỬI KHÔNG THÀNH CÔNG │
    │  (thành công)   │       │  (có thể thử lại)    │
    └─────────────────┘       └──────────────────────┘
                                        │ [Gửi lại]
                                        └──── thử lại ──▶ ĐÃ GỬI / GỬI KTT
```

**Tự động gửi**: Cấu hình tự động gửi bỏ qua bước thủ công Ký + Gửi.  
**Lưu ý**: Chỉ đơn hóa dược (loại TP-VP) được xác nhận gửi lên cổng quốc gia.

### 3.6 Sơ đồ trạng thái: Đơn hàng Thanh toán

```
    ┌───────────┐    [Thêm dịch vụ/sản phẩm]    ┌───────────────┐
    │  PENDING  │──────────────────────────────▶│  TRONG HÀNG   │
    └───────────┘                               └───────┬───────┘
                                                        │ [Nút THANH TOÁN]
                                                ┌───────▼───────┐
                                                │  ĐÃ THANH TOÁN│
                                                └───────┬───────┘
                                                        │ [Hoàn/Hủy biên lai]
                                                ┌───────▼───────────┐
                                                │ ĐÃ HOÀN / ĐÃ HỦY │
                                                └───────────────────┘
```

---

## BƯỚC 4: MA TRẬN PHÂN QUYỀN RBAC

### 4.1 Định nghĩa Vai trò (xác nhận từ thanh điều hướng)

| Mã vai trò | Tên hiển thị | Mô tả |
|---|---|---|
| R1 | Lê Tân (Receptionist) | Tiếp nhận bệnh nhân, đo sinh hiệu, tiền sử bệnh, quản lý lịch hẹn |
| R2 | Bác sĩ (Doctor) | Khám lâm sàng, kê đơn thuốc, chỉ định dịch vụ |
| R3 | Xét nghiệm (Lab Tech) | Cấp mã vạch, thực hiện XN, nhập kết quả |
| R4 | CĐHA (Imaging Tech) | Nhập kết quả CĐHA, đính kèm hình ảnh |
| R5 | Quầy thanh toán (Cashier) | Xử lý thanh toán, xuất hóa đơn điện tử |
| R6 | Kho (Warehouse Manager) | Toàn bộ nghiệp vụ kho, phê duyệt, kết chuyển kỳ |
| R7 | Báo cáo (Reports Viewer) | Truy cập đọc toàn bộ 8 báo cáo |
| R8 | Admin | Cấu hình hệ thống, quản lý tài khoản cổng QG, toàn quyền |
| R9 | ⚠️ Điều Trị (Treatment) | Chưa đọc module — vai trò này được suy luận là tồn tại |

### 4.2 Ma trận Phân quyền (Module × Vai trò)

| Module | R1 Lê Tân | R2 Bác sĩ | R3 XN | R4 CĐHA | R5 Cashier | R6 Kho | R7 Báo cáo | R8 Admin |
|---|---|---|---|---|---|---|---|---|
| **M0** In mã BN | ✅ | ✅ | — | — | — | — | — | ✅ |
| **M1a** Tiếp nhận | ✅ CHÍNH | ✅ XEM | — | — | ✅ XEM | — | — | ✅ |
| **M1b** Đo sinh hiệu | ✅ | — | — | — | — | — | — | ✅ |
| **M1c** Tiền sử bệnh | ✅ | ✅ XEM | — | — | — | — | — | ✅ |
| **M2a** Thanh toán | — | — | — | — | ✅ CHÍNH | — | — | ✅ |
| **M2b** Hóa đơn điện tử | — | — | — | — | ✅ | — | — | ✅ |
| **M3a** Phiếu khám YHCT | — | ✅ CHÍNH | — | — | — | — | — | ✅ |
| **M3b** Phiếu chỉ định DV | — | ✅ | — | — | — | — | — | ✅ |
| **M3c** Đơn thuốc | — | ✅ | — | — | — | — | — | ✅ |
| **M3d** Phiếu hẹn tái khám | ✅ QUA LỊCH HẸN | ✅ | — | — | — | — | — | ✅ |
| **M3e** Patient 360 | — | ✅ | — | — | — | — | — | ✅ |
| **M4b** Thực hiện CĐHA | — | — | — | ✅ CHÍNH | — | — | — | ✅ |
| **M4c** Cấp/Hủy mã vạch XN | — | — | ✅ CHÍNH | — | — | — | — | ✅ |
| **M4d** Thực hiện XN | — | — | ✅ CHÍNH | — | — | — | — | ✅ |
| **M4e** KQ XN gửi ngoài | — | — | ✅ | — | — | — | — | ✅ |
| **M4f** KQ CĐHA gửi ngoài | — | — | — | ✅ | — | — | — | ✅ |
| **M5a** Tạo phiếu kho | — | — | — | — | — | ✅ | — | ✅ |
| **M5b-d** Duyệt kho | — | — | — | — | — | ✅ | — | ✅ |
| **M5e** Kết chuyển | — | — | — | — | — | ✅ | — | ✅ |
| **M5f** Kiểm kê điều chỉnh | — | — | — | — | — | ✅ | — | ✅ |
| **M5g** Xem tồn kho | — | — | — | — | — | ✅ | ✅ XEM | ✅ |
| **M6** Quản lý lịch hẹn | ✅ | ✅ | — | — | — | — | — | ✅ |
| **M7a** Cổng QG — TK bác sĩ | — | — | — | — | — | — | — | ✅ |
| **M7b** Cổng QG — Đẩy đơn | — | ✅ [INFERRED] | — | — | — | — | — | ✅ |
| **M8** Báo cáo | ✅ [một số] | ✅ [một số] | — | — | ✅ [doanh thu] | ✅ [kho] | ✅ TẤT CẢ | ✅ |
| **M9** Hệ thống | — | — | — | — | — | — | — | ✅ |
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Chú thích:** ✅ = có quyền (đã xác nhận) | ✅ CHÍNH = không gian làm việc chính của vai trò | ✅ XEM = chỉ đọc hoặc quyền hạn chế | — = không có quyền truy cập | [INFERRED] = suy luận logic

### 4.3 Yêu cầu Row-Level Security (RLS)

| Phạm vi | Quy tắc cô lập dữ liệu |
|---|---|
| Cô lập theo chi nhánh | Toàn bộ dữ liệu lâm sàng (đợt khám, phiếu, kết quả XN) được giới hạn theo Chi nhánh [INFERRED — sản phẩm đa chi nhánh] |
| Tầm nhìn bệnh nhân | Lê Tân chỉ thấy bệnh nhân tại chi nhánh của mình; bác sĩ thấy bệnh nhân trong Hàng đợi hoặc Tất cả |
| Cô lập theo kho | Nhân viên kho được giới hạn theo kho được phân công [INFERRED] |
| Cô lập báo cáo | Vai trò Báo cáo thấy dữ liệu theo chi nhánh + bộ lọc khoảng thời gian |
| ⚠️ Tra cứu bệnh nhân xuyên chi nhánh | Chưa rõ — sự phân biệt Nội viện/Ngoại viện có ngụ ý quyền truy cập xuyên chi nhánh không? |

---

## BƯỚC 5: DANH SÁCH CÂU HỎI CRITICAL BLOCKER

Các câu hỏi sau là **CRITICAL BLOCKER** — không thể implement đúng mà không có câu trả lời.

---

### ❓ BLOCKER #1: Loại phiếu thứ 10 và Phiếu Tường Trình Phẫu Thuật

**Quan sát:** Hộp chọn loại phiếu hiển thị 9 loại đã xác nhận. Timeline đợt khám hiển thị "Phiếu tường trình phẫu thuật - thủ thuật" như một loại phiếu. Hệ thống cho thấy có 10+ loại, nhưng một loại chưa được xác định.

**Câu hỏi:**
1. "Phiếu tường trình phẫu thuật - thủ thuật" có phải là loại thứ 10 trong hộp chọn không? Hay đây là biểu mẫu ghi chú thủ thuật riêng, không nằm trong hộp chọn chính?
2. Có loại phiếu nào khác (ngoài 10 loại) chỉ tồn tại ở một số chuyên khoa nhất định không (ví dụ phiếu tiêm chủng gắn với 3 báo cáo tiêm chủng)?

**Tác động nếu không giải quyết:** Hệ thống loại phiếu bị thiếu. Có thể làm cho hộp chọn "+" được xây dựng sai số lượng; các biểu mẫu chuyên biệt có thể bị bỏ sót.

---

### ❓ BLOCKER #2: Kiến trúc Danh tính Bệnh nhân Đa chi nhánh (MPI)

**Quan sát:** Định dạng Mã BN là 260001xxx (có vẻ có tiền tố năm). Chi nhánh "APIS - Phòng khám YHCT" luôn hiển thị. Lịch sử khám có tab Nội viện / Ngoại viện.

**Câu hỏi:**
1. "Nội viện" là cùng chi nhánh, "Ngoại viện" là các chi nhánh khác trong cùng chuỗi phòng khám, hay "Ngoại viện" là cơ sở y tế hoàn toàn khác?
2. Bản ghi Bệnh nhân là toàn cục (dùng chung giữa tất cả chi nhánh) hay theo từng chi nhánh với cơ chế gộp/liên kết?
3. Bác sĩ tại Chi nhánh B có thể truy cập toàn bộ lịch sử lâm sàng của bệnh nhân chỉ được điều trị tại Chi nhánh A không?
4. "Xem hồ sơ ngoại viện" hoạt động như thế nào — hệ thống tự lấy từ cơ sở dữ liệu chung, hay là tải file thủ công?

**Tác động nếu không giải quyết:** Không thể thiết kế database schema đúng. Nếu bệnh nhân là toàn cục, toàn bộ quy tắc RLS theo chi nhánh phải lọc ở cấp đợt khám, không phải cấp bệnh nhân. Giả định sai = rò rỉ dữ liệu hoặc vi phạm quyền riêng tư.

---

### ❓ BLOCKER #3: Các Trường Đơn Hóa Dược + Kiểm tra Tương tác Thuốc

**Quan sát:** "Đơn hóa dược" tồn tại là một loại phiếu đã xác nhận. Màn hình đẩy cổng QG hiển thị loại "TP-VP". Footer đơn đông dược hiển thị "BHYT thanh toán: 0 VND" và ghi chú cảnh báo rằng giá thuốc đông dược chỉ mang tính tham khảo.

**Câu hỏi:**
1. Các trường biểu mẫu cụ thể của Đơn hóa dược là gì? Cụ thể: Có kiểm tra tương tác thuốc không? Có các trường Số ngày dùng, Liều/ngày, Đường dùng không?
2. Mô hình giá của hóa dược có khác với đông dược không (giá kho trực tiếp so với giá tham khảo)?
3. Đơn hóa dược có BHYT gửi lên cổng quốc gia có phải là cùng biểu mẫu Đơn hóa dược không, hay có biểu mẫu "Đơn BHYT" riêng?

**Tác động nếu không giải quyết:** Không thể xây dựng biểu mẫu đơn thuốc hoặc quy trình cấp phát dược. Luồng giá sai sẽ gây ra lỗi thanh toán.

---

### ❓ BLOCKER #4: Module Điều Trị

**Quan sát:** "Điều Trị" xuất hiện trong thanh điều hướng của Lê Tân, Bác sĩ và vai trò Báo cáo. "Lịch tiêm điều trị" là một trong 10 loại phiếu trong hộp chọn của bác sĩ. Thanh điều hướng vai trò Báo cáo bao gồm "Điều Trị."

**Câu hỏi:**
1. Phạm vi đầy đủ của module Điều Trị là gì? Có phải là trình quản lý phác đồ điều trị (các buổi châm cứu, lịch tiêm) không?
2. Ai thực hiện các hạng mục trong "Lịch tiêm điều trị" — có vai trò điều dưỡng/kỹ thuật viên điều trị không?
3. Điều Trị có loại phiếu riêng nào ngoài Lịch tiêm điều trị không?
4. Danh mục báo cáo "Điều Trị" vắng mặt trong danh sách 8 báo cáo là vì đã được gộp vào Khám Bệnh, hay vì có báo cáo Điều Trị riêng chưa được xem?

**Tác động nếu không giải quyết:** Toàn bộ một module không được thiết kế. Không thể xác định vai trò "Điều Trị" có tồn tại không, cần phân quyền gì, hay những thực thể/sơ đồ trạng thái nào thuộc về nó.

---

### ❓ BLOCKER #5: Phạm vi Module Hệ Thống + Phạm vi Mẫu Văn Bản

**Quan sát:** "Hệ thống" xuất hiện trong thanh điều hướng của tất cả vai trò. Template Manager được xác nhận tồn tại theo từng trường trong Phiếu khám YHCT. Hệ thống có danh mục dịch vụ, cơ sở dữ liệu ICD, cấu hình chi nhánh.

**Câu hỏi:**
1. Hệ thống bao gồm các module nào? Tối thiểu: quản lý người dùng, phân vai trò, cấu hình chi nhánh, quản lý danh mục dịch vụ. Xác nhận danh sách đầy đủ.
2. Phạm vi của Mẫu văn bản là gì? Các tùy chọn: (a) riêng từng bác sĩ, (b) dùng chung toàn phòng khám, (c) theo chi nhánh, (d) toàn hệ thống. Nếu (a), bác sĩ chuyển chi nhánh sẽ mất template. Nếu (c), quản trị viên chi nhánh quản lý template.
3. Danh mục DV được quản lý trong Hệ thống không? Giá có theo từng chi nhánh hay toàn hệ thống?

**Tác động nếu không giải quyết:** Không thể xây dựng trang quản trị hoặc thiết lập phạm vi dữ liệu đúng cho template và danh mục. Phạm vi sai = template hiển thị cho người dùng sai, giá cấu hình sai theo chi nhánh.

---

### ❓ BLOCKER #6: Loại Đợt Khám BHYT + Các Trường Bảo Hiểm

**Quan sát:** Trường "Đối tượng" khi tạo đợt khám xác nhận giá trị "Không bảo hiểm." Footer biểu mẫu đơn thuốc hiển thị "BHYT thanh toán: 0 VND." Danh mục dịch vụ hiển thị hai mức giá: Giá BH và Giá VP.

**Câu hỏi:**
1. Tất cả các giá trị có thể của "Đối tượng" là gì? Tối thiểu: Không bảo hiểm, BHYT. Có loại nào khác không (tai nạn BHXH, bảo hiểm tự nguyện)?
2. Đối với đợt khám BHYT, những trường bổ sung nào bắt buộc khi tạo đợt khám? (Số thẻ BHYT, ngày hết hạn, % mức hưởng, v.v.)
3. Đợt khám BHYT có thay đổi giá được áp dụng trong đơn hàng thanh toán không (Giá BH thay vì Giá VP)?
4. Hệ thống có quy trình gửi đề nghị thanh toán BHYT không, hay BHYT chỉ dùng để tham khảo giá?

**Tác động nếu không giải quyết:** Không thể xây dựng đúng biểu mẫu tạo đợt khám cho bệnh nhân có bảo hiểm. Không thể cài đặt đúng logic giá trong module thanh toán. Có thể vi phạm quy định thanh toán bảo hiểm.

---

## BƯỚC 6: PHASE GATE — MASTER BLUEPRINT v1.0

### 6.1 Tóm tắt hệ thống

EzMon là hệ thống quản lý phòng khám đa chi nhánh, tập trung vào khám Y học Cổ truyền (YHCT), với luồng chính:

```
[Lê Tân] Tiếp nhận → Đo sinh hiệu → Tiền sử bệnh
     ↓
[Lê Tân] Tạo đợt khám (Đợt khám = Aggregate Root)
     ↓
[Bác sĩ] Khám bệnh (Phiếu khám YHCT với mã ICD kép)
     → Phiếu chỉ định DV → [XN] Kết quả XN / [CĐHA] Kết quả hình ảnh
     → Đơn thuốc (Đông dược + Hóa dược) → [Cổng QG] Gửi đơn thuốc QG
     → Phiếu hẹn tái khám
     ↓
[Cashier] Thanh toán (đơn hàng đa dịch vụ) → Hóa đơn điện tử
     ↓
[Kho] Quản lý tồn kho (theo lô, 3 loại kho, đóng kỳ hàng tháng)
     ↓
[Admin] Báo cáo (8 báo cáo) + Quản lý tài khoản cổng QG
```

### 6.2 Quy tắc Nghiệp vụ Cốt lõi

| # | Quy tắc | Nhãn | Nguồn |
|---|---|---|---|
| 1 | Mỗi Đợt khám được tạo sẽ tự động sinh ra "Phiếu yêu cầu dịch vụ có tiếp nhận" | [FACT] | M1a |
| 2 | Chẩn đoán ICD: nhiều mã trên mỗi phiếu; đúng 1 mã phải được đánh dấu là ICD chính | [FACT] | M3a |
| 3 | Lượt khám YHCT yêu cầu mã KÉP: ICD-10 + ICD-YHCT (cả hai bắt buộc) | [FACT] | M3a |
| 4 | BMI áp dụng ngưỡng châu Á: Béo phì ≥ 25 (không phải ≥ 30 theo tiêu chuẩn WHO) | [FACT] | M1b |
| 5 | Sinh hiệu tự động điền vào Phiếu khám YHCT — không cần nhập lại thủ công | [FACT] | M1b → M3a |
| 6 | Tuổi thai được TỰ ĐỘNG TÍNH từ LMP — không phải trường nhập tay | [FACT] | M1c |
| 7 | Dị ứng được lưu theo hàng bảng có cấu trúc (Phân nhóm/Tác nhân/Phản ứng/Mức độ), không phải văn bản tự do | [FACT] | M1c |
| 8 | Phiếu đã hoàn tất (trạng thái COMPLETED) được khóa cứng; "HỦY HOÀN TẤT" yêu cầu xác nhận tường minh | [FACT] | Tất cả module |
| 9 | Tồn kho theo lô: Sản phẩm + Lô + Hạn dùng = đơn vị tồn kho duy nhất | [FACT] | M5 |
| 10 | Kết chuyển theo loại kho, hàng tháng. Bắt buộc kiểm kê thực tế ("Trình") trước khi kết chuyển | [FACT] | M5e |
| 11 | Nhãn mã vạch bệnh nhân gồm: Mã BN + Tên BN + Ngày sinh (định dạng barcode tuyến tính) | [FACT] | M0 |
| 12 | Đẩy đơn thuốc cổng QG: bắt buộc Ký điện tử TRƯỚC khi Gửi đơn | [FACT] | M7b |
| 13 | Định dạng mã đơn thuốc: RX-YYMMDD-seq (ví dụ RX260407-10) | [FACT] | M7b |
| 14 | Định dạng mã đơn hàng thanh toán: PH-YYYYMMDD-NNN | [FACT] | M2a |
| 15 | Định dạng Mã BN: 260001xxx (tiền tố năm + tuần tự — "26" thấy trong demo) | [FACT — định dạng; logic tiền tố INFERRED] | M1a |
| 16 | Vòng đời mã vạch XN: ORDERED → BARCODE_ISSUED → EXECUTED → RESULT_ENTERED; có thể CANCELLED hoặc REISSUED | [FACT] | M4c/d |
| 17 | Phê duyệt phiếu kho: 2 cấp (trình → duyệt); ghi lại cả Ngày duyệt + Người duyệt | [FACT] | M5b |
| 18 | Nhập kết quả CĐHA: rich text template theo loại dịch vụ (ví dụ template ECG có 12 trường định danh) | [FACT] | M4b |
| 19 | Phiếu hẹn tái khám cho phép đặt trước dịch vụ (Chỉ định thực hiện trước) để thực hiện trước buổi tái khám | [FACT] | M3d |
| 20 | Ghi chú bệnh nhân: xuyên lượt khám, dạng chat, có thể chỉnh sửa/xóa bởi tác giả | [FACT] | M1a |
| 21 | Mẫu văn bản gắn với từng trường trong biểu mẫu khám; luồng tạo/sửa/xóa đã xác nhận; phạm vi ⚠️ BLOCKER #5 | [FACT — tồn tại; INFERRED — phạm vi] | M3a |
| 22 | Tổng 8 báo cáo trong 5 danh mục; chỉ số "X of N" trong Supademo là số bước demo — KHÔNG PHẢI số báo cáo | [FACT] | M8 |
| 23 | 3 loại kho đã xác nhận: Kho lẻ bán thuốc; Kho Thuốc dược liệu; Kho vật tư tiêu hao | [FACT] | M5e |
| 24 | Phiếu kho có 10 loại (nhập/xuất/dự trù/thanh lý/hủy/hoàn trả/nội bộ) | [FACT] | M5a |

### 6.3 Tổng hợp Màn hình

| Danh mục | Màn hình/Luồng đã xác nhận |
|---|---|
| Tiếp nhận & Bệnh nhân | 4 (tiếp nhận, sinh hiệu, tiền sử, in mã) |
| Lâm sàng (Bác sĩ) | 8 (khám, chỉ định DV, 2 đơn thuốc, hẹn, patient360, KQ ngoài, chuyển viện) |
| Xét nghiệm | 6 (cấp/cấp lại/hủy mã vạch, thực hiện XN, KQ ngoài XN x2) |
| Chẩn đoán hình ảnh (CĐHA) | 4 (thực hiện CĐHA, dịch vụ phát sinh, KQ ngoài CĐHA x2) |
| Thanh toán | 3 (thanh toán, tạo HĐ, tra cứu HĐ) |
| Kho | 12+ (tạo phiếu, duyệt x3, kết chuyển, kiểm kê, điều chỉnh x2, xem tồn, các màn hình giới thiệu) |
| Lịch hẹn | 2 (quản lý lịch hẹn, hẹn tái khám) |
| Cổng QG | 4 (TK BS, TK phòng khám, lấy token, đẩy đơn) |
| Báo cáo | 1 màn hình với 8 báo cáo |
| Quản trị hệ thống | ⚠️ Chưa đọc |
| Điều Trị | ⚠️ Chưa đọc |
| **TỔNG ĐÃ XÁC NHẬN** | **~50 màn hình** |

### 6.4 Phân tích Kỹ thuật (Ưu tiên: Supabase + RLS + Next.js)

| Vấn đề | Khuyến nghị | Lý do |
|---|---|---|
| Đa thuê bao (Multi-tenancy) | Supabase RLS với `branch_id` trên tất cả bảng lâm sàng | Đợt khám, phiếu, kết quả đều được phân phạm vi theo chi nhánh |
| MPI | Bảng `patients` không phụ thuộc chi nhánh; bảng `encounters` có `branch_id` | Danh tính bệnh nhân là toàn cục; dữ liệu lâm sàng là local theo chi nhánh |
| Trạng thái PENDING/COMPLETED | Thêm cột `status` enum + `completed_at` + `completed_by` vào tất cả bảng phiếu | Khóa cứng được áp dụng ở cả RLS và application layer |
| Tồn kho theo lô | Composite key: `(product_id, lot_number, expiry_date, warehouse_id)` | Đã xác nhận theo dõi theo lô |
| Rich text (CĐHA) | Lưu dạng JSON (TipTap/ProseMirror) hoặc chuỗi HTML với FK template theo loại DV | Template có cấu trúc theo loại dịch vụ |
| Trường tự động tính | Tuổi thai từ LMP: tính tại thời điểm đọc (không lưu) | Tránh dữ liệu cũ; LMP là nguồn sự thật duy nhất |
| Tính BMI | Tính tại thời điểm đọc từ chiều cao + cân nặng; phân loại theo ngưỡng châu Á | Chỉ lưu số liệu đo gốc |
| Cổng QG | Tích hợp external API; webhook cho cập nhật trạng thái bất đồng bộ | Đã gửi / Gửi không thành công cần logic thử lại |
| Mã đơn thuốc | Tạo RX-YYMMDD-seq phía server (không phải client) | Tuần tự theo ngày, duy nhất trên mỗi phòng khám |

### 6.5 Các Module Cần Điều tra Thêm Trước khi Dev

| Module | Vấn đề còn thiếu | Blocker # |
|---|---|---|
| Đơn hóa dược | Chưa đọc các trường biểu mẫu | #3 |
| Điều Trị | Toàn bộ module chưa đọc | #4 |
| Hệ thống (Admin) | Toàn bộ module chưa đọc | #5 |
| Bệnh nhân đa chi nhánh | Kiến trúc MPI chưa xác nhận | #2 |
| Loại đợt khám BHYT | Các trường bảo hiểm chưa xác nhận | #6 |
| Loại phiếu thứ 10 | Biểu mẫu chưa xác định | #1 |
| Phạm vi mẫu văn bản | Theo bác sĩ hay theo phòng khám | #5 |
| Biểu mẫu chỉnh sửa Phụ khoa | Chưa đọc đầy đủ | — |
| Biểu mẫu Đã phẫu thuật / Bệnh mạn tính | Các trường chưa xác nhận | — |
| Luồng tải kết quả ngoài | Luồng đính kèm file chưa chi tiết | — |

---

*Blueprint được tạo từ 56 PDF. Độ tin cậy: ~80% logic nghiệp vụ đã xác nhận. 6 CRITICAL BLOCKER trong Bước 5 phải được giải quyết trước khi bắt đầu sprint lập trình.*
