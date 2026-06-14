# EzMon — Reverse Engineering Interim Analysis
## Modules covered: 1a (Tiếp nhận) + 3a (Phiếu khám YHCT)

---

## MODULE 1a: TIẾP NHẬN BỆNH NHÂN

### Screen Layout — 3-panel
- LEFT (280px): Patient list, scrollable, 50/page pagination, search bar, 2 create-patient buttons
- CENTER: Selected patient visit timeline + action bar
- RIGHT (300px): Visit history sidebar + patient notes (chat-style)

### Navigation Bar (Role: Lê Tân — Receptionist)
Lê Tân | Thanh toán | Khám bệnh | Điều Trị | CDHA | Cổng TTQG | Báo cáo | Kho | Hệ thống | Lịch hẹn | Dashboard
Sub-tabs: Tiếp nhận | Quản lý lịch hẹn

### Entity: Patient (Bệnh nhân)
| Field | Required | Notes |
|---|---|---|
| Mã BN | auto | format 260001xxx (seen in demo) |
| Mã tiêm chủng | optional | links to national vaccination registry |
| Tên BN | * | |
| Ngày sinh / Năm sinh | * | |
| Giới tính | * | Nam / Nữ |
| Quốc tịch | default VN | |
| CCCD/CMND/Passport | optional | dropdown type selector |
| Số ĐT | * | format ####-###-### |
| Email | optional | |
| Địa chỉ | optional | free text |
| Danh sách người liên hệ | optional | name + relationship + phone + birth year, multi-row |
| Thông tin xuất hóa đơn công ty | optional | for B2B billing |

Patient search keys: Mã BN | SĐT | CCCD | Họ tên | Mã tiêm chủng quốc gia

### Entity: Đợt Khám (Encounter/Visit)
| Field | Required | Notes |
|---|---|---|
| Thời gian | * | datetime auto-populated |
| Đối tượng | * | Không bảo hiểm | [insurance options TBD] |
| Chuyên khoa | * | Y học cổ truyền | others; auto-select if only 1 |
| Loại lần khám | * | Khám YHCT | Khám lẻ | others; auto-select if only 1 |
| Nguồn khách hàng | optional | CRM tracking |
| Nguồn giới thiệu | optional | referral tracking |
| Chỉ định DV nhanh | optional | quick service pre-selection at reception |

Visit classification badges: Không bảo hiểm | Khám lẻ | Normal | [others TBD]

### State Machine: Phiếu (Document)
- PENDING (yellow clock): created, editable
- COMPLETED (green checkmark): "Hoàn tất" pressed → LOCKED
- REVERTED: "Hủy hoàn tất" → back to PENDING (with confirmation dialog)

### Document types visible in visit timeline
- Phiếu yêu cầu dịch vụ có tiếp nhận [auto-created on đợt khám save]
- Phiếu khám YHCT
- Phiếu hẹn tái khám
- Phiếu tường trình phẫu thuật - thủ thuật
- Phiếu chỉ định dịch vụ
- Chụp X-quang (external result)

### Business Rules
- After CCCD scan: system checks if patient exists in DB. If not → confirm dialog → pre-fill form from CCCD chip data
- "Lấy MTC từ cổng" button: fetches Mã tiêm chủng from national portal
- Visit history right sidebar: sorted newest-first, tabs Tất cả/Nội viện/Ngoại viện
- Patient list sorted: most recently updated first; "Hôm nay" badge for today's visits
- Patient notes (Ghi chú BN): per-patient cross-visit, chat-style, author+timestamp, edit/delete by author

### CCCD Scan Flow
1. Click QR button → scanner modal
2. Scan CCCD → DB lookup
3. Not found → "Tiếp tục thêm mới?" (Có/Không)
4. Có → pre-fill modal → user completes → Lưu
5. Found → select existing patient record

### Print Output: Phiếu yêu cầu thực hiện dịch vụ
- Patient admin info + service list (qty + unit price + total) + patient consent text + signature block
- Has QR code + "HOÀN TẤT" stamp when completed

---

## MODULE 3a: PHIẾU KHÁM YHCT (Doctor Examination Form)

### Screen Layout (Khám bệnh — differs from Tiếp nhận)
- LEFT: Patient list with tabs Hàng đợi (queue, today only) | Tất cả (all patients)
- CENTER: Visit documents as THUMBNAIL GRID (not timeline list)
- RIGHT: Always-on PDF preview panel

### Doctor Toolbar (per visit, icon shortcuts)
BN 360 | Kh. YHCT | Thêm DV | Cô ngoài | Đơn Du... | Đơn Tây Y | Liều trị... | Hẹn tái... | X-Quang | Phiếu p...

### Form Type Selector
- 18 loại phiếu total
- Opened via "+" icon on visit thumbnail grid
- Includes: Patient 360, Phiếu khám YHCT, Phiếu chỉ định dịch vụ, [15 more]

### Phiếu Khám YHCT — Field Structure
**A. HÀNH CHÍNH** (auto-filled read-only)
Họ tên | Ngày sinh | Tuổi | Giới tính | Mã BN | ĐT | Địa chỉ

**B. THÔNG TIN KHÁM BỆNH**
I. Thông tin khám
1. Lý do đến khám [textarea + template manager]
2. Bệnh sử [textarea + template manager]
3. Tiền sử [textarea + template manager]

II. KHÁM BỆNH
Sinh hiệu (auto-populated from measurement module):
Mạch | Nhiệt độ | Huyết áp (sys/dia) | Nhịp thở | SpO2 | Chiều cao | Cân nặng | Tăng cân | BMI [auto-calc, color-coded]
1. Toàn thân [textarea + template]
2. Các bộ phận [textarea + template]
3. Các xét nghiệm cận lâm sàng cần làm [textarea + template]

III. KHÁM Y HỌC CỔ TRUYỀN [textarea + template]

IV. CHẨN ĐOÁN
- ICD search: by code or name
- Results dropdown: Mã ICD | Mô tả | Mã YHCT | Mô tả YHCT
- Added table: STT | Mã ICD | Chi tiết ICD | Mã ICD YHCT | Chi tiết ICD YHCT | ICD chính☑
- YHCT-specific fields: Bát cương | Nguyên nhân | Tạng phủ | Kinh mạch | Định vị bệnh (đình/vệ/khí/huyết)

V. XỬ TRÍ [textarea + template]

Footer: Thời gian ký | Người khám bệnh [doctor dropdown]
Actions: In phiếu | Hoàn tất | Lưu

### Business Rules
- ICD: multiple codes per visit; exactly 1 flagged as ICD chính
- Dual coding: ICD-10 (Western) + ICD-YHCT (Traditional Medicine) — both required for YHCT visits
- Template scope: ⚠️ UNCLEAR — per doctor / per clinic / per branch
- Voice input ("Nhập giọng nói"): available on examination modal — scope TBD
- Lưu: saves draft, allows continued editing
- Hoàn tất: LOCKS form → generates timestamped PDF with author
- Hủy hoàn tất: requires confirmation, reverts to draft state
- Completed forms show green ✓ thumbnail badge; pending = yellow ⏰
- "Tùy chọn" dropdown: In mã BN | Xem/Sửa thông tin BN | Hồ sơ ngoại viện

### Template Manager System
- Per text field: click "..." → opens template list (name + preview)
- Create: Tên mẫu + Nội dung → Lưu
- Edit: pencil icon per row
- Delete: X icon → confirm dialog

---

## MODULE 0: IN MÃ BN / XEM-SỬA THÔNG TIN BN / HỒ SƠ NGOẠI VIỆN
**Source folder:** 000

### Access
- "Tùy chọn" button on selected patient in Tiếp nhận screen → dropdown with 3 actions:
  1. **In mã bệnh nhân** — prints barcode label
  2. **Xem/Sửa thông tin bệnh nhân** — opens patient edit form (same form as creation, pre-filled)
  3. **Xem hồ sơ ngoại viện** — views external/prior clinic records

### Barcode Label (In mã bệnh nhân)
- Output: PDF preview in browser
- Barcode content: Mã BN + Tên BN + Ngày/tháng/năm sinh  
  Example: "260001617 / PHẠM KHÁ HÙNG (15/04/1961)"
- Barcode format: linear (CODE128 or similar)
- Print actions: "Icon máy in" → choose printer and print; "Tải file về máy" → download PDF

### Xem/Sửa Thông Tin BN
- Opens from Tiếp nhận context (same form as new patient creation, pre-filled)
- ⚠️ Fields identical to patient creation form in Module 1a

---

## MODULE 1b: ĐO CHỈ SỐ CƠ THỂ (Vital Signs)
**Source folders:** 001 (Thêm mới), 002 (Xem lịch sử), 003 (Thủ công), 004 (Từ máy)

### Entry Point
- Role: Lê Tân (receptionist) — accessed from Tiếp nhận center panel
- Sub-tab row in center panel: Tư vấn ban đầu | Đo sinh hiệu | Tiền sử bệnh | Thêm đợt khám
- Click "Đo sinh hiệu" sub-tab → opens measurement form

### Entity: Lần đo sinh hiệu (Vital Measurement)
| Field | Unit | Notes |
|---|---|---|
| Cân nặng | Kg | |
| Chiều cao | Cm | |
| Vòng cánh tay | Cm | arm circumference |
| Vòng bụng | Cm | waist circumference |
| Nhiệt độ | °C | |
| Mạch | Lần/Phút | |
| SpO2 | % | |
| Huyết áp | sys/dia mmHg | two number fields |
| BMI | kg/m² | AUTO-CALCULATED from Cân nặng + Chiều cao |
| Kết luận sơ bộ | text | free-text field |
| Ghi chú | text | free-text notes |
| Cân nặng đề xuất đạt BMI lý tưởng | Kg | AUTO-CALCULATED |

### Input Methods
1. Manual keyboard entry (default)
2. "Lấy kết quả từ máy đo" button — imports from medical device ⚠️ protocol unclear (folder 004)
3. "Nhập giọng nói" button — voice input (top-right of form)

### BMI Classification (Asian thresholds — NOT standard WHO)
| Phân loại | BMI |
|---|---|
| Thiếu cân | < 18.5 |
| Bình thường | 18.5 – 22.99 |
| Thừa cân | 23 – 24.99 |
| Béo phì | ≥ 25 |
| Béo phì độ 1 | 25 – 29.99 |
| Béo phì độ 2 | 30 – 39.99 |
| Béo phì độ 3 | ≥ 40 |

### Business Rules
- BMI auto-calculated; color-coded by classification
- "Lấy chẩn đoán" button: pulls BMI-based diagnosis suggestion
- "Thêm mới" button: CLEARS current measurement entry (confirmation dialog shown) — allows multiple measurements per visit
- Vital signs auto-populate into Phiếu khám YHCT section B.II (Sinh hiệu) [FACT — confirmed in Module 3a]

### State Machine
- DRAFT: editable, not saved
- LƯU: saved draft (can re-edit)
- HOÀN TẤT: locked; "Xem Lịch Sử Lần Đo" available to view history

### Actions
- Hủy | Xem Lịch Sử Lần Đo | Lưu | Hoàn Tất

---

## MODULE 1c: TIỀN SỬ BỆNH (Medical History)
**Source folders:** 005 (Tiền sử chung), 006 (Tiền sử sản phụ khoa)

### Entry Point
- Same sub-tab row: "Tiền sử bệnh" tab → opens panel overlay in CENTER
- Role: Lê Tân (receptionist)

### Panel Structure
Panel has TWO TABS:
1. **Tiền sử chung** (General history)
2. **Tiền sử Sản - Phụ khoa** (OB/GYN history)

### Tiền sử chung — Confirmed Sections [FACT from folders 005, 006]
- **Dị ứng** (Allergies) — 3 sub-categories:
  - Thuốc (medication), Thực phẩm (food), Môi trường (environmental)
  - Each sub-category is a TABLE (not free text). Row add via "Thêm dòng"
  - Table columns: **Phân nhóm** | **Tác nhân** (allergen agent) | **Phản ứng** (reaction description) | **Mức độ** (severity)
- **Tiền sử gia đình** (Family history): editable section, content TBD
- **Đã phẫu thuật** (Previous surgeries): editable section, content TBD
- ⚠️ Bệnh mạn tính (Chronic diseases) — confirmed in Patient 360 view but not seen in edit form

### Tiền sử Sản - Phụ khoa [CONFIRMED from folders 006, 006/page-04, 006/page-05]
**Sản khoa section:**
- PARA field: 4-digit format (VD: 0000) — P·A·R·A parity notation
- Lịch sử có thai TABLE (add via "Thêm dòng"):
  - Columns: Lần | Năm | Cân nặng trẻ (kg) | Phương pháp sinh | Tình trạng sau sinh
- Thai kỳ hiện tại group:
  - Thai lần số (current pregnancy index)
  - Kỳ kinh cuối / LMP (date picker)
  - Tuổi thai: **AUTO-CALCULATED** from LMP — not manual entry
  - Ngày dự sinh (EDD) — dd/MM/yy format
- Dấu hiệu bất thường (Sản khoa): free text
- Các thông tin sản khoa khác: free text (Ghi chú)

**Phụ khoa section:**
- Own "Chỉnh sửa" button — fields not read

### Business Rules
- "Nhập giọng nói" voice input available on entire Tiền sử panel
- ⚠️ Whether OB/GYN tab is shown for male patients — INFERRED hidden but unconfirmed

---

## MODULE 2: THANH TOÁN & HÓA ĐƠN ĐIỆN TỬ
**Source folders:** 008 (Thanh toán), 007 (Hóa đơn điện tử)

### Navigation (different from clinical roles)
- Top nav (cashier role): Bệnh nhân | Thanh toán | Cổng TTQG | Kho | Dashboard | Báo cáo | Hệ thống | Lịch hẹn
- Sub-tabs: Thanh toán | Tạo hóa đơn điện tử | Tra cứu hóa đơn điện tử
- Screen tabs: Bán hàng | Các đơn đã bán | Chi tiết doanh thu

### Module description [FACT — from intro page]
"Phân hệ Thanh toán hỗ trợ thu tiền đa phương thức, áp dụng chiết khấu linh hoạt, quản lý hoàn/hủy biên lai và kết nối phát hành hóa đơn điện tử, đồng thời theo dõi doanh thu theo thời gian thực."

### Screen Layout: Quầy thanh toán
- LEFT: Order queue (Đơn hàng) — patient list with PH numbers + date + type badge
- RIGHT: Selected order detail + payment calculation panel

### Entity: Đơn hàng (Payment Order)
| Field | Notes |
|---|---|
| Mã đơn | PH-YYYYMMDD-NNN format (e.g., PH-20260409-002) |
| Loại | "Dịch vụ/ Sản phẩm lẻ" |
| Nhãn | "Tiêu chuẩn" badge |
| Mã KH | patient code |
| Tên KH | patient name |
| Giới tính | |
| Năm sinh | |
| Số điện thoại | |
| Địa chỉ | |

### Order Line Items (3 radio views)
- **Dịch vụ**: Mã DV | Tên DV | Đơn giá | SL | %CK | Tiền CK | Thành tiền
- **Sản phẩm**: Mã SP | Tên SP | ĐVT | Đơn giá | SL | %CK | Tiền CK | Thành tiền
- **Dịch vụ/ Sản phẩm ngoài danh mục**: ⚠️ ad-hoc items outside catalog

### Payment Panel (right)
- Tổng tiền chưa chiết khấu
- Chiết khấu %
- Tổng tiền chiết khấu (after discount)
- Tổng tiền dư (surplus/change)
- Thu tổng (amount collected)
- Phương thức thanh toán (payment method) ⚠️ options not yet enumerated
- **THANH TOÁN** button

### Date Filters
Hôm nay | 7 ngày | 1 tháng | Tất cả

### Search
By Mã BN / Họ và tên → press Enter

### Feature: "Chỉnh sửa thông tin ở cửa hàng"
"Cho phép chỉnh sửa thông tin phục vụ trong việc phát hành hoá đơn chính xác" — edit patient billing info pre-invoice

### Sub-module: Tạo hóa đơn điện tử
- Date range filter + "Lấy dữ liệu" button + free-text search
- Results table: STT | Mã BN | Họ và tên BN | Điện thoại | Địa chỉ
- Batch selection + generate e-invoice
- Footer: "Tổng số phiếu thu đã chọn | Tổng số tệp đã chọn"
- Feature description: "Retrieve billing data by date range, search and filter invoices, select multiple records for batch processing, generate printable invoice reports"

### Sub-module: Tra cứu hóa đơn điện tử [INFERRED from tab name — not yet read]

### State Machine: Payment Order
- PENDING: in queue, not yet paid
- THANH TOÁN → PAID: triggers receipt + optional e-invoice
- HOÀN/HỦY biên lai: refund/cancel ⚠️ flow details not seen

---

## MODULE 3b: PHIẾU CHỈ ĐỊNH DỊCH VỤ (Service Order)
**Source folder:** 009

### Entry Point
- Doctor role only; from "+" icon in visit thumbnail grid
- "Chọn loại phiếu" modal → double-click OR select + "Chọn" button

### Complete Phiếu Type List (from folder 009 page 1 + 010 page 1)
Confirmed 10 types total — partial list visible:
1. Patient 360
2. Phiếu khám YHCT
3. Phiếu chỉ định dịch vụ (service order — internal)
4. Phiếu chỉ định dịch vụ ngoài (service order — external)
5. Đơn đông dược (herbal/YHCT prescription)
6. Đơn hóa dược (western medicine prescription)
7. Lịch tiêm điều trị (treatment injection schedule)
8. Phiếu chuyển viện (hospital transfer)
9. Phiếu hẹn tái khám (follow-up appointment)
10. ⚠️ 10th type not seen

### Phiếu Chỉ Định Form Structure
- Header: "Chỉ định DV cơ bản"
- Diagnosis context (auto-carried from phiếu khám): shows ICD codes at top
- Search: "Tìm kiếm dịch vụ..." + "Sử dụng gói mẫu" (use template package)
- "Nhập giọng nói" button

### Service Catalog (LEFT panel — hierarchical tree)
Categories visible:
- Chẩn đoán (diagnostics)
- Khám bệnh (examination)
- Thăm dò chức năng (functional investigation)
- Thủ thuật (procedures)
Each item: Mã DV | Tên DV | Giá BH (insurance price) | Giá VP (self-pay price)
Action: click "+" on item to add to order table

### Service Order Table
Columns: ☑ | Tên dịch vụ | SL (qty) | Thành tiền | Phòng thực hiện | Loại thanh toán | Vị trí | Ghi chú | [Trạng thái] | Hẹn thực hiện (scheduled time)
- Loại thanh toán options: Văn phí (at minimum) ⚠️ full list pending

### Footer
- Ghi chú (order-level note)
- Tổng thành tiền: X VNĐ
- Actions: In phiếu | Lưu & Hoàn tất | Lưu

### Print Output: "PHIẾU CHỈ ĐỊNH DỊCH VỤ / REQUEST ORDER"
- APIS Health Systems bilingual header
- Patient administrative info
- "THAM CHIẾU ĐỢT KHÁM" (visit reference)
- Service table: STT | Tên DV | Phòng thực hiện | Số lượng | Thành tiền
- Patient consent + signature block
- "HOÀN TẤT" stamp when completed

### State Machine
- Lưu: draft, editable
- Lưu & Hoàn tất: LOCKED
- Same PENDING → COMPLETED → ⚠️ REVERTED pattern assumed

---

## MODULE 3c: KÊ ĐƠN THUỐC (Prescriptions)
**Source folder:** 010

### Two Prescription Types
1. **Đơn dược liệu** (Đơn đông dược) — herbal/YHCT medicines
2. **Đơn hóa dược** — chemical/western medicines ⚠️ fields not yet read

### Đơn Dược Liệu — Form Fields
Header:
- Số thang: integer (number of decoction batches)
- Liều dùng: integer (doses/day)
- Từ ngày / Đến ngày: date range (prescription validity)
- Bác sĩ kê đơn: doctor (dropdown)
- Người đánh máy: typist name
- Thời gian kê đơn: datetime (auto-filled, editable)
- Form type label: "DL - VP" (Dược liệu - Văn phòng = herbal, self-pay)

Ingredient table (right panel): STT | Hoạt chất (Biệt dược) | SL (quantity) | Ghi chú | ĐVT (unit: gam) | Đơn giá | Thành tiền | [edit/delete icons]
- Add: enter product name in left-side search → populates right table
- Price per row: SL × Đơn giá = thành tiền (per thang)
- Total price auto-summed in footer

Special Instructions (bottom of form — 3 named fields):
- **Cách sắc thuốc**: decoction method (e.g., "sắc 3 chén, cạn còn 1 chén")
- **Cách uống**: intake instructions (e.g., "uống sau ăn 30 phút")
- **Lời dặn**: additional advice (e.g., "dùng thuốc đều đặn, ngừng khi có dấu hiệu bất thường")

Price Summary footer:
- Tổng tiền thuốc | Tổng ghi | BHYT thanh toán | BN thanh toán

### Print Output: "ĐƠN THUỐC THỨC ỐC THANG ĐIỀU TRỊ NGOẠI TRÚ"
- APIS Health Systems header
- Patient info, diagnosis, doctor info
- Ingredient table with grams
- Cách sắc, Cách uống, Lưu ý sections
- Doctor signature + date

### Actions
In (Ctrl+I) | Lưu & Hoàn tất | Lưu (Ctrl+S)
"Nhập giọng nói" button available

---

## MODULE 3d: PHIẾU HẸN TÁI KHÁM (Doctor Follow-up Appointment)
**Source folder:** 011

### Entry Point
- Same "+" picker from doctor visit view
- "Phiếu hẹn tái khám" = 9th item in 10-type list
- Double-click to open

### Form Fields
⚠️ Actual form NOT yet read (pages 3-6 show navigation steps, form at page 4+)
- Need folder 011 pages 4-6 to see actual fields

---

## MODULE 3e: PATIENT 360
**Source folder:** 012

### Access
- From "+" picker → "Patient 360" (first item in list)
- Double-click or select + Chọn
- Also accessible via "BN 360" toolbar shortcut button
- Description: "hồ sơ bệnh nhân: thanh toán, xem kết quả khám, đơn thuốc, tài liệu và theo dõi giao dịch"

### Content
⚠️ Actual Patient 360 screen not yet read (pages 3-6 show navigation steps)
- Need folder 012 pages 4-6

---

## MODULE 3d: PHIẾU HẸN TÁI KHÁM (Doctor Follow-up Appointment) — UPDATED
**Source folder:** 011

### Form Fields [CONFIRMED from folder 011 page 4]
- Người hẹn khám: (dropdown, default current user)
- Quick duration selector: **2 tháng | 3 tháng | 6 tháng | 1 năm** (auto-sets appointment date)
- Hẹn khám vào: date + time (datetime picker, editable)
- Ghi chú: free text (e.g., "Tái khám đúng hẹn")
- Chỉ định thực hiện trước (pre-appointment services):
  - Service catalog dropdown + table: Mã | Tên dịch vụ
  - Doctor can pre-order services to be executed BEFORE the follow-up visit

### State Machine
- Trạng thái: "Chưa đặt lịch hẹn" → Lưu (editable) → Lưu & Hoàn tất (LOCKED)
- Special action: **Hủy hẹn** (cancel the appointment — separate from Hủy hoàn tất)
- In phiếu (print appointment slip)

### Business Rules
- After Lưu & Hoàn tất: data LOCKED, no editing permitted
- Lưu: saved, still editable; each edit → press Lưu again to update
- "Nhập giọng nói" available

---

## MODULE 3e: PATIENT 360 — UPDATED
**Source folder:** 012

### Screen Layout [CONFIRMED from folder 012 page 4]
- Patient header: avatar | Name | Mã BN | Age | Gender | Nhóm máu (blood type)
- Vital summary bar: Huyết áp | Mạch | Nhiệt độ | SpO2 | Cân nặng | BMI (latest values)
- THREE TABS (left sidebar): **Tổng quan** | Timeline | Tài liệu

### Tổng Quan Tab — Content Grid
| Section | Content |
|---|---|
| Thuốc đang sử dụng | Current active prescriptions (date range + drug list) |
| Kết quả xét nghiệm | Latest lab results + "Xem thêm" link |
| Tiền sử bệnh | Right panel: Dị ứng, Bệnh mạn tính, Đã phẫu thuật, Tiền sử gia đình, Phụ khoa, Sản khoa |
| Chẩn đoán hình ảnh | Latest imaging result + findings text + "Xem thêm" |
| Lịch sử thăm khám | Visit history |
| LỊCH HẸN SẮP TỚI | Upcoming appointments |
| Ghi chú bệnh nhân | Patient notes (cross-visit) |

### Tiền Sử Bệnh Sub-sections (confirmed from Patient 360)
- DỊ ỨNG (allergies)
- BỆNH MẠN TÍNH (chronic diseases)
- ĐÃ PHẪU THUẬT (prior surgeries)
- TIỀN SỬ GIA ĐÌNH (family history)
- PHỤ KHOA (gynecology)
- SẢN KHOA (obstetrics)

### Business Rules
- "Nhập giọng nói" available on Patient 360

---

## MODULE 4: CẬN LÂM SÀNG — XÉT NGHIỆM (Lab Tests)
**Source folders:** 016-021 (barcode ops + lab execution + external results XN)

### Navigation Role
- Dedicated nav tab: "Xét nghiệm" (lab tech role)
- Breadcrumb: Bệnh nhân > Tiếp nhận > Khám bệnh > **Thực hiện chỉ định**

### Lab Workflow — 3 Steps [FACT from folder 017 page 3]
1. **Cấp mã vạch** (Assign barcode to sample)
2. **Thực hiện xét nghiệm** (Perform/execute test)
3. **Đưa kết quả** (Enter results)
These are shown as clickable step indicators in the lab screen.

### Cấp Mã Vạch Screen
- Sample collection form: date + Chất lượng mẫu (sample quality dropdown: Đạt/others)
- Ordered tests table: ☑ | STT | Dịch vụ | Đã TH (done?) | Ngày CĐ (ordered date)
  - Tests grouped by category (e.g., Nhóm: Xét nghiệm huyết học)
- Select tests → assign barcode

### Phiếu Nhập Kết Quả Xét Nghiệm [from folder 019 page 3]
- Patient info header (auto-loaded)
- Header fields:
  - Người lấy mẫu (sample collector): dropdown
  - Ngày giờ lấy mẫu: datetime
  - Chất lượng mẫu: dropdown (Đạt / others)
  - Người thực hiện: dropdown
  - Người duyệt kết quả: dropdown
  - Ngày duyệt kết quả: datetime
- Dịch vụ: service selector
- Mẫu nhập kết quả: result template (-- Chọn --) + "Thêm mẫu vào lưới" | "Quản lý mẫu" | "Đính kèm file"
- Result table columns: Kết quả | Bất thường (flag) | Đơn vị | GT tham chiếu (reference range)

### External Lab Results (Quản lý KQ gửi ngoài — XN)
**Source folders:** 020-021
⚠️ Not yet read in detail — need folder 020 pages

---

## MODULE 4b: CẬN LÂM SÀNG — CĐHA (Imaging)
**Source folders:** 013-015, 022-024

### Navigation Role
- Dedicated nav tab: "CĐHA" in top navigation bar
- Role: radiologist/imaging technician

### Entry Point [from folder 015 page 2]
- From doctor's Khám bệnh view: tooltip "Chọn mở màn hình thực hiện chẩn đoán hình ảnh"
- CĐHA accessed via "CĐHA" top-nav item (NOT from Xét nghiệm tab)

### CĐHA Result Entry Form [CONFIRMED from folder 015 page 4]
Form name: "Phiếu X-Quang" (named per service type)

**Header fields:**
- Dịch vụ: service selector (dropdown — e.g., "Chụp X-quang Cột sống cổ thi...")
- "Chọn lại dịch vụ nếu cần" tooltip — service can be swapped
- Vùng khảo sát chi tiết: detail survey area/scope
- Special field visible: Điện tim (for ECG service type)
- Người thực hiện: performer (dropdown)
- Người đánh máy: typist (dropdown)

**Body:**
- Rich text editor (WYSIWYG with ruler, font, Bold/Italic/Color/Lists toolbar)
- SERVICE-SPECIFIC TEMPLATES: each service type has a pre-defined template loaded into the editor
  - ECG template fields: Chuyển đạo mẫu | Nhịp, tần số | Trục | P | QRS | ST | T | QT | Chuyển đạo trước tim | Góc α | Tư thế tim | PQ
  - X-ray, ultrasound templates — likely similar structured text templates

**Right panel:**
- "Hình ảnh" (Images) panel — image upload/attach panel for attaching DICOM/image files

### External CĐHA Results (Kết quả gửi ngoài — CĐHA)
**Source folders:** 022-024
⚠️ Not read in detail — workflows: Thêm KQ gửi ngoài CĐHA | Xem KQ gửi ngoài CĐHA | Xóa file KQ CĐHA

---

## MODULE 5: KHO (Warehouse / Inventory)
**Source folders:** 025-047 (17 sub-flows)

### Navigation
- Top nav: Kho | also: Bệnh nhân | Lịch hẹn | Dashboard | Cổng TTQG | Báo cáo | Hệ thống

### Phiếu Kho — Document Types [FACT from folder 028 page 4]
"Tài liệu mới" modal shows these types:
1. Phiếu nhập dự trù từ NCC (supplier receipt from purchase order)
2. Phiếu xuất nội bộ (internal issue from another warehouse)
3. Nhập khác (miscellaneous import)
4. Xuất nội bộ (internal export to another department)
5. Xuất thanh lý (disposal/liquidation export)
6. Xuất hoàn trả nhà cung cấp (return to supplier)
7. Xuất khác (miscellaneous export)
8. Xuất hủy (destruction)
9. Phiếu dự trù - Tổng hợp 1 (consolidated purchase request)
10. Phiếu nhập nhà cung cấp (direct supplier receipt)

### Phiếu Nhập Kho Header Fields [from folder 028 page 4]
- Kho nhập: warehouse (dropdown)
- Ngày nhập: receipt date
- Ngày HD: invoice date
- Mã phiếu: auto-generated (format PNK26-4 = Phiếu Nhập Kho YY-sequence)
- Số hóa đơn: supplier invoice number
- Chưa HD: checkbox (not yet invoiced?)
- Ký hiệu HD: invoice symbol
- Số kho: warehouse number?
- Nhập kho từ: links to source purchase request (-- Chọn phiếu yêu cầu --)
- Nhà cung cấp: supplier
- Tiếp liệu: supply officer
- Tỉ giá ngoại tệ: exchange rate (default 0)
- Hình thức TT: payment method (Tiền mặt / others)
- Ngày duyệt + Người duyệt: approval fields

### Line Items Table (Phiếu Nhập/Xuất)
Columns: Mã SP | Tên sản phẩm | ĐVT | SL | Đơn giá | VAT | ĐG VAT | [more]
- At minimum: product code, name, unit, quantity, unit price, VAT%, VAT-inclusive price
- Lô (lot) + Hạn dùng (expiry date) likely on line items [INFERRED from inventory view]

### Inventory View — Xem Tồn Kho [FACT from folder 046 page 2]
Full table columns: Mã SP | Tên sản phẩm | Lô | Hạn dùng | Hoạt chất | Hàm lượng | ĐVT | Tồn đầu | SL nhập | SL xuất | SL tồn | Tồn thiếu | Nước SX
- Row = product + lot + expiry batch (BATCH-LEVEL inventory)
- Right panel: recent movements log with timestamps
- Filter tabs: Danh sách phiếu nhập | Danh sách phiếu phát xuất
- "Lọc nhóm sản phẩm" + "Tìm sản phẩm" filters

### Approval Workflow (2-level confirmed)
Sub-modules 031-039 cover: Duyệt kho, Hủy duyệt nhập kho phiếu nhập, Duyệt phiếu xin dự trù, Hủy duyệt xuất, Nhận phiếu xuất từ kho khác
- Approval fields: Ngày duyệt + Người duyệt
- Hủy duyệt = reverse approval (confirmed as separate action)

### Kết Chuyển (Period Closing) [CONFIRMED from folders 041-042]
Sub-navigation tab: Kho > **Kết chuyển**

**Kết Chuyển list view:**
- Grouped by warehouse type: **Kho lẻ bán thuốc** | **Kho Thuốc dược liệu** | **Kho vật tư tiêu hao**
- Table columns: Ngày kết chuyển | Ngày kiểm kê | Thời gian | Người tạo | Người điều chỉnh | Thời gian điều chỉnh
- Action buttons: **Kết chuyển** (initiate period close) | **Điều chỉnh tồn** (adjust inventory)

**Flow:** Select period row → "Kết chuyển" button → confirmation → period locked

### Kiểm Kê Tồn (Inventory Count / Physical Count) [CONFIRMED from folder 043]
Sub-navigation tab: Kho > **Kiểm kê tồn**

**Filter bar:** Kho (warehouse dropdown) | Kỳ kết chuyển (period date) | Đến ngày

**Table columns (BATCH-LEVEL — one row per product+lot+expiry):**
Mã SP | Tên SP | ĐVT | Ngày nhập | Đơn giá | Số lô | Hạn dùng | Tồn trước ĐC | Tồn sau ĐC | Chi tiết phiếu điều chỉnh

**Footer summary:** Tổng tồn | Giảm tồn | Tăng tồn | Tồn thực tế | Thời gian

**Actions:** 
- "Làm mới" (refresh)
- "In tồn và điều chỉnh" (print inventory + adjustment report)
- **"Trình"** button — submit physical count for approval

### Kiểm Kê Điều Chỉnh (Adjustment — Increase/Decrease)
Sub-modules 044-045: Điều chỉnh tăng tồn kho | Điều chỉnh giảm tồn kho
- Two separate actions for manual inventory adjustments

---

## MODULE 6: ĐẶT HẸN (Appointment Scheduling)
**Source folder:** 048

### Navigation Entry Point [from folder 048 page 2]
- Module 6 "Hẹn tái khám" = accessed from doctor's TOOLBAR shortcut (not "+" picker)
- Toolbar button: "Hẹn tái..." highlighted in doctor view
- This is the SAME form as Module 3d but accessed via toolbar shortcut
- Navigation bar includes: Lê Tân | Khám bệnh | CĐHA | Xét nghiệm | Điều Trị | Thanh toán | **Đặt hẹn** | Cổng TTQG | Dashboard | Báo cáo | Hệ thống

⚠️ The "Đặt hẹn" nav module (pre-appointment scheduling) vs "Hẹn tái khám" (doctor follow-up) distinction needs clarification — may be the same feature accessed from different roles

---

## MODULE 7: LIÊN THÔNG CỔNG QG (National Prescription Portal)
**Source folders:** 049-054

### Navigation
- Top nav: Cổng TTQG (active when in this module)
- Sub-tabs: **Danh mục đơn thuốc QG** | **Đẩy cổng đơn thuốc QG**

### Sub-module A: Danh Mục Đơn Thuốc QG (Doctor Account Management) [folder 049]
Purpose: Link clinic doctors to national prescription portal accounts
Table: Mã CSKCB (facility code) | Tên đăng nhập | Chuyên môn | Khoa | Đã có TK LTQG | Đã liên kết TK CS KCB
Filter: Tất cả | Đã có TK LTQG | Chưa có TK LTQG
Actions: Xuất | LS liên kết | Xóa tài khoản | Hủy liên kết | **Liên kết** | Chỉnh sửa

### Sub-module B: Đẩy Cổng Đơn Thuốc QG (Prescription Submission) [folder 054]
Purpose: Submit prescriptions to national portal

Filter fields:
- Ngày kê đơn từ / đến: date range
- Loại đơn: prescription type
- Trạng thái: Tất cả | Chưa gửi | Đã gửi | Gửi không thành công

Prescription submission table:
| Column | Notes |
|---|---|
| Mã đơn | RX260407-10 format (RX + YYMMDD + seq) |
| Loại | TP-VP (Tây phương-Văn phòng = western medicine, self-pay) |
| Ký đơn | prescription signing date + time |
| Người kê đơn | prescribing doctor |
| Mã BN | patient code |
| Tên bệnh nhân | |
| Tóm tắt đơn thuốc | drug summary (e.g., "Doxycyin 100mg - 45 Viên") |
| BS Ký điện tử | digital signature status |
| Trạng thái | Chưa gửi / Đã gửi / Gửi không thành công |
| Mã đơn thuốc QG | national portal prescription code (after submission) |
| Tài khoản gửi | submitting account |
| Thời gian gửi | submission timestamp |

Footer Actions:
- Xuất Excel (export)
- **Cấu hình tự động gửi** (auto-submit configuration)
- LS gửi cổng (submission history)
- LS Ký điện tử (e-signature history)
- **Ký điện tử** (sign prescription digitally)
- **Gửi đơn** (submit to portal)

Error indicator: Red dot legend "Đơn gửi không thành công" (failed submission indicator in row)

### Business Rules
- Prescription must be signed (Ký điện tử) before submission (Gửi đơn)
- Status flow: Chưa gửi → [Ký điện tử] → [Gửi đơn] → Đã gửi / Gửi không thành công
- Auto-submit available (Cấu hình tự động gửi)
- Only western medicine prescriptions shown — ⚠️ unclear if herbal prescriptions also submitted

---

## MODULE 8: BÁO CÁO (Reports)
**Source folder:** 055

### Navigation (Reports role)
Khám bệnh | Cận Lâm Sàng | Điều Trị | Lịch hẹn | Kho | Dashboard | **Báo cáo** | Hệ thống

### Report Categories & Items [FACT from folder 055 pages 1+2+4]
⚠️ CORRECTION: "19 of 19" refers to SUPADEMO STEPS (interactive demo tutorial steps), NOT report count.
Total confirmed reports: **8 reports** across 5 categories (full list from page-01 sidebar + page-04 scrolled view)
"Cấu hình" button in top-right of Báo cáo screen — some reports configurable

**Complete confirmed report list:**

| Category | Count | Reports |
|---|---|---|
| **Tiêm Chủng & TI34** | 3 | 1. Báo cáo lượt tiêm Vaccine; 2. Báo cáo tình hình sử dụng vaccine tiêm chủng dịch vụ; 3. BÁO CÁO CÁC TRƯỜNG HỢP PHẢN ỨNG THÔNG THƯỜNG SAU TIÊM CHỦNG (AEFI report) |
| **Báo Cáo Kho** | 1 | Báo Cáo Xuất Nhập Tồn |
| **Báo Cáo Cận Lâm Sàng** | 1 | Sổ xét nghiệm - CĐHA |
| **Báo Cáo Doanh Thu** | 2 | Báo cáo chi tiết doanh thu; Báo cáo thu ngân |
| **Khám Bệnh** | 1 | Báo cáo chi tiết tiếp nhận khám bệnh |
| **TOTAL** | **8** | |

### Sample Report: Báo cáo chi tiết tiếp nhận khám bệnh
Description: "Cung cấp thông tin chi tiết về quá trình tiếp nhận khám bệnh, bao gồm số lượng bệnh nhân, thời gian tiếp nhận, phân bổ theo chuyên khoa"
Filter params: Cơ sở (branch) | Từ ngày | Đến ngày | Loại khám | Chuyên khoa
Output: table/grid (paginated)
Action: "Xem Báo Cáo" button

---

## NOTES FOR PHASE 2 ANALYSIS
- Role navigation differs: Lê Tân sees fewer modules than Bác sĩ
- Branch context always visible top-right: "APIS - Phòng khám YHCT"
- Patient ID format: 260001xxx (6-digit with leading "26" = year prefix INFERRED)
- "Hàng đợi" queue view: implies server-side filtering of today's checked-in patients only
- Two separate entry points for same visit: Tiếp nhận (admin view) vs Khám bệnh (clinical view)
- PNG naming: pdftoppm uses page-01.png (zero-padded) for PDFs with 10+ total pages; page-1.png (no pad) for PDFs with < 10 pages
- All 56 PDFs converted to PNG in tmp_pages/000–055 (manifest.json contains full mapping)
