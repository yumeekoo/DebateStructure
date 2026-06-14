# Thiết kế DB — Đường B: Work-Graph (DAG + đệ quy)

> **Bối cảnh:** Đã chốt kiến trúc work-graph (xem [debate_summary.md](debate_summary.md)). Tài liệu này biến kết luận đó thành schema cụ thể: table gì, cột gì, lưu gì, và **chứng minh đạt 1NF/2NF/3NF**.
>
> **Storage strategy:** Class-Table Inheritance (CTI) — 1 bảng `node` gốc + mỗi loại node 1 bảng mở rộng. Chọn CTI thay vì JSONB vì dữ liệu y tế cần FK thật + ràng buộc kiểu + chuẩn hóa chặt.
>
> **Nền tảng giả định:** PostgreSQL / Supabase (như BLUEPRINT đã đề xuất).
>
> **⚑ Bản v1.1 — sửa theo quyết định của anh Dũng (2026-06-14):** Quan hệ task-khách ↔ task-phòng **KHÔNG** dùng chung 1 node 2 cha nữa. Chuyển sang mô hình **facade**: worklist KHÁCH và worklist NỘI BỘ là **hai cây node tách biệt**, nối nhau qua bảng cầu `task_bridge`. Worklist khách chỉ phơi "mặt tiền" (vào phòng + nhận KQ); mọi chi tiết thực thi (subtask, bước nội bộ) giấu trong worklist nội bộ. Đổi lại: phải **sync** trạng thái/KQ qua cầu. Xem mục 3 (`task_bridge`) + mục 6.

---

## 1. Bốn nhóm bảng

| Nhóm | Vai trò | Bảng |
|---|---|---|
| **A. Master / Domain** | Thực thể nền (ai, ở đâu, dịch vụ gì) | branch, department, room, staff, patient, service |
| **B. Work-Graph Core** | **Trái tim Đường B** — đồ thị công việc + cầu facade | node, node_link, node_dependency, **task_bridge**, node_type |
| **C. Extension (CTI)** | Thuộc tính riêng theo loại node | node_visit, node_room_session, node_exam, node_lab_order, node_lab_result, node_tx_course, node_tx_session |
| **D. Bảng con nhiều dòng** | Chuẩn hóa 1NF (không nhồi list vào 1 ô) | diagnosis, lab_result_line, vital_measurement |

Quy tắc vàng của CTI: **`node_id` của bảng mở rộng vừa là PK vừa là FK** → quan hệ 1-1 với `node`, không đẻ khóa thừa.

**Hai thế giới (facade):** mỗi `node` thuộc về **một** trong hai phía qua cột `node.visibility`:
- `CUSTOMER` — worklist khách: nông, mờ, chỉ "vào phòng + nhận KQ".
- `INTERNAL` — worklist nội bộ: đồ thị thật, chứa subtask + phụ thuộc + liệu trình, **khách không thấy** (RLS chặn).

`task_bridge` là **ranh giới duy nhất** nối hai phía — nơi trạng thái/kết quả được đẩy từ nội bộ ra mặt tiền.

---

## 1bis. Biểu đồ trực quan (đọc trước phần DDL)

> Mỗi biểu đồ có **ảnh PNG đã render sẵn** (hiện trong mọi trình xem, kể cả VSCode không cài extension) + **mã Mermaid** kèm theo để chỉnh sửa. Ảnh nằm trong thư mục [diagrams/](diagrams/); render lại bằng `npx @mermaid-js/mermaid-cli -i diagrams/0X.mmd -o diagrams/0X.png -b white -s 2`.

### ⊕ Biểu đồ 1 — ER Diagram toàn hệ thống

![ER Diagram](diagrams/01_er.png)

```mermaid
erDiagram
    branch     ||--o{ department        : "có"
    branch     ||--o{ staff             : "có"
    branch     ||--o{ node              : "cô lập (RLS)"
    department ||--o{ room              : "chứa"
    service    ||--o{ service           : "nhóm cha"

    node_type  ||--o{ node              : "phân loại"
    node       ||--o{ node_link         : "là cha (parent_id)"
    node       ||--o{ node_link         : "là con (child_id)"
    node       ||--o{ node_dependency   : "tiên quyết (from)"
    node       ||--o{ node_dependency   : "bị chặn (to)"
    node       ||--o{ task_bridge       : "task khách (customer)"
    node       ||--o{ task_bridge       : "task nội bộ (internal)"

    node       ||--o| node_visit        : "extends"
    node       ||--o| node_room_session : "extends"
    node       ||--o| node_exam         : "extends"
    node       ||--o| node_lab_order    : "extends"
    node       ||--o| node_lab_result   : "extends"
    node       ||--o| node_tx_course    : "extends"
    node       ||--o| node_tx_session   : "extends"
    node       ||--o{ vital_measurement : "đo sinh hiệu"

    patient    ||--o{ node_visit        : ""
    department ||--o{ node_visit        : ""
    room       ||--o{ node_room_session : ""
    staff      ||--o{ node_room_session : ""
    service    ||--o{ node_exam         : ""
    service    ||--o{ node_lab_order    : ""
    service    ||--o{ node_tx_course    : ""
    node_exam      ||--o{ diagnosis        : "ICD (nhiều dòng)"
    node_lab_result||--o{ lab_result_line  : "dòng KQ"

    node {
        uuid id PK
        text node_type FK
        uuid branch_id FK
        text visibility
        text status
        uuid completed_by FK
        timestamptz completed_at
    }
    node_link {
        uuid id PK
        uuid parent_id FK
        uuid child_id FK
        text link_role
        int order_index
        text context_status
    }
    node_dependency {
        uuid id PK
        uuid from_node_id FK
        uuid to_node_id FK
        text dep_type
    }
    task_bridge {
        uuid id PK
        uuid customer_node_id FK
        uuid internal_node_id FK
        boolean is_result_source
    }
    node_visit {
        uuid node_id PK
        uuid patient_id FK
        timestamptz reception_time
        text visit_object
    }
    node_tx_course {
        uuid node_id PK
        uuid service_id FK
        int planned_sessions
    }
    node_tx_session {
        uuid node_id PK
        int session_number
        uuid performed_by FK
    }
    diagnosis {
        uuid id PK
        uuid exam_node_id FK
        text icd_code
        boolean is_primary
    }
    lab_result_line {
        uuid id PK
        uuid result_node_id FK
        text analyte
        boolean is_abnormal
    }
```

> Đọc nhanh: `node` ở trung tâm. Mọi bảng `node_*` **mở rộng 1-1** từ nó (CTI). `node_link` & `node_dependency` đều nối `node` về chính `node` (đồ thị tự tham chiếu). Domain (patient/room/service/staff) trỏ vào bảng extension, **không** trỏ thẳng vào `node`.

### ⊕ Biểu đồ 2 — Khái niệm: 4 bảng lõi tạo thành đồ thị + facade

![Khái niệm work-graph](diagrams/02_concept.png)

```mermaid
flowchart TD
    NT["node_type<br/>(cấu hình loại)"] -->|phân loại| N
    subgraph core["TRÁI TIM — đồ thị công việc + cầu facade"]
        N[("node<br/>đơn vị công việc<br/>visibility: CUSTOMER/INTERNAL")]
        L["node_link<br/>cạnh CHA→CON (M:N)<br/>order_index · context_status"]
        D["node_dependency<br/>cạnh PHỤ THUỘC task→task"]
        BR["task_bridge<br/>cầu KHÁCH ↔ NỘI BỘ<br/>(1:1 hoặc 1:N)"]
    end
    N -->|parent_id| L
    N -->|child_id| L
    N -->|from / to| D
    N -->|customer / internal| BR
    N -.->|"extends (1-1)"| EXT["7 bảng node_*<br/>visit · room_session · exam<br/>lab_order · lab_result<br/>tx_course · tx_session"]
```

> Độ sâu **không** cố định: vì `node_link` nối `node`→`node`, một node con lại có thể làm cha của node khác → đệ quy bao nhiêu tầng tùy nghiệp vụ (khám thường 2 tầng, gói tổng quát 4 tầng). `task_bridge` nối hai phía facade mà không phá tính đệ quy của từng phía.

### ⊕ Biểu đồ 3 — Facade + bridge (case B3, liệu trình 10 buổi) ★

![Case B3 — facade + bridge](diagrams/03_b3_case.png)

```mermaid
flowchart TD
    subgraph facade["WORKLIST KHÁCH (visibility=CUSTOMER · chỉ thấy mặt tiền)"]
        V1["VISIT V1<br/>Lượt khám BN A"]
        CK["Task khách CK<br/>'Châm cứu — nhận KQ'"]
        V1 -->|"VISIT_ITEM · order=3"| CK
    end
    subgraph internal["WORKLIST NỘI BỘ (visibility=INTERNAL · giấu khách)"]
        C1["TX_COURSE C1<br/>Liệu trình 10 buổi"]
        RS["ROOM_SESSION RS<br/>Phòng châm cứu 20/06"]
        S7["TX_SESSION S7 · ★ Buổi 7"]
        C1 -->|"COURSE · order=7"| S7
        RS -->|"RESOURCE · order=2"| S7
        S7 --> sub1["subtask: chuẩn bị"]
        S7 --> sub2["subtask: châm + theo dõi"]
    end
    CK -. "task_bridge → đẩy KQ" .-> C1
    style CK fill:#d4edda,stroke:#28a745,stroke-width:2px
    style S7 fill:#fff3cd,stroke:#c8950a,stroke-width:3px
```

> Khách chỉ thấy **CK** (xanh). Toàn bộ đồ thị thật — liệu trình, buổi 7 với **2 cha** (`order=7` vs `order=2`), subtask — nằm trong vùng INTERNAL, **khách không chạm tới**. `task_bridge` là cây cầu duy nhất. Đa-cha vẫn còn (lý do `order` nằm trên cạnh) nhưng bị nhốt gọn phía nội bộ.

### ⊕ Biểu đồ 4 — Bridge 1:N (vì sao bridge phải là BẢNG)

![Bridge 1:N](diagrams/04_two_axis.png)

```mermaid
flowchart LR
    subgraph facade["WORKLIST KHÁCH"]
        direction TB
        VK["Visit · BN A"] --> TK["1 task khách:<br/>'Xét nghiệm máu — nhận KQ'"]
    end
    subgraph internal["WORKLIST NỘI BỘ (nhiều phòng)"]
        direction TB
        I1["Lấy mẫu<br/>(phòng lấy máu)"] --> I2["Chạy máy<br/>(lab)"] --> I3["Duyệt KQ<br/>(BS lab)"]
    end
    TK -. "task_bridge" .-> I1
    TK -. "task_bridge" .-> I2
    TK -. "task_bridge" .-> I3
    style TK fill:#d4edda,stroke:#28a745,stroke-width:2px
```

> **1 task khách → 3 task nội bộ.** Đây là case 1:N mà cột FK không làm được. Anh D chọn 1:1, nhưng dùng **bảng nối** `task_bridge` thì hôm sau gặp ca này chỉ cần thêm dòng — không đập schema. Đó là lý do câu hỏi (a) quan trọng.

---

## 2. Nhóm A — Master / Domain

```sql
CREATE TABLE branch (                       -- Chi nhánh / Cơ sở
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE department (                   -- Khoa = đơn vị tổ chức (KHÔNG phải phòng)
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id   uuid NOT NULL REFERENCES branch(id),
  code        text NOT NULL,
  name        text NOT NULL,
  UNIQUE (branch_id, code)
);

CREATE TABLE room (                         -- Phòng (thuộc khoa; tạo bằng tool, KHÔNG hardcode tên)
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES department(id),
  code          text NOT NULL,
  name          text NOT NULL,
  function      text,                       -- chức năng: khám / siêu âm / xét nghiệm / châm cứu...
  UNIQUE (department_id, code)
);

CREATE TABLE staff (                        -- Nhân viên (bác sĩ, KTV, điều dưỡng, lễ tân...)
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id   uuid NOT NULL REFERENCES branch(id),
  full_name   text NOT NULL,
  role        text NOT NULL,                -- DOCTOR|NURSE|LAB_TECH|IMAGING_TECH|RECEPTIONIST|CASHIER|ADMIN
  is_active   boolean NOT NULL DEFAULT true
);

CREATE TABLE patient (                      -- Bệnh nhân — MPI TOÀN CỤC (không gắn branch_id)
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code  text UNIQUE NOT NULL,        -- 260001xxx
  full_name     text NOT NULL,
  birth_date    date,
  gender        text,
  phone         text,
  national_id   text
);

CREATE TABLE service (                      -- Danh mục dịch vụ (cây phân cấp Nhóm → Dịch vụ)
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   uuid REFERENCES service(id),   -- nhóm cha
  code        text UNIQUE NOT NULL,
  name        text NOT NULL,
  price_bh    numeric(14,2),                 -- giá bảo hiểm
  price_vp    numeric(14,2),                 -- giá viện phí (self-pay)
  is_group    boolean NOT NULL DEFAULT false
);
```

> **Quyết định MPI:** `patient` **không** có `branch_id` (bệnh nhân toàn cục, dùng chung mọi chi nhánh). Cô lập chi nhánh thực thi ở tầng `node.branch_id`, không ở tầng bệnh nhân — đúng kết luận BLOCKER #2 trong BLUEPRINT.

---

## 3. Nhóm B — Work-Graph Core (trái tim Đường B)

```sql
CREATE TABLE node_type (                    -- Loại node (cấu hình, không hardcode trong code)
  code  text PRIMARY KEY,                   -- VISIT|ROOM_SESSION|EXAM|LAB_ORDER|LAB_RESULT|TX_COURSE|TX_SESSION...
  name  text NOT NULL,
  axis  text NOT NULL                       -- CLINICAL | RESOURCE | BOTH
);

CREATE TABLE node (                         -- ĐƠN VỊ CÔNG VIỆC PHỔ QUÁT
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_type    text NOT NULL REFERENCES node_type(code),
  branch_id    uuid NOT NULL REFERENCES branch(id),   -- cô lập đa chi nhánh (RLS gắn ở đây)
  visibility   text NOT NULL DEFAULT 'INTERNAL',      -- ★ CUSTOMER (mặt tiền) | INTERNAL (giấu khách). RLS dựa vào đây.
  title        text,
  status       text NOT NULL DEFAULT 'PENDING',
               -- DRAFT|PENDING|IN_PROGRESS|BLOCKED|COMPLETED|CANCELLED
  created_by   uuid REFERENCES staff(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  completed_by uuid REFERENCES staff(id),    -- cơ chế khóa cứng (EzMon "Hoàn tất")
  completed_at timestamptz
);

CREATE TABLE node_link (                    -- CẠNH CHA→CON (M:N) — xây cây/DAG BÊN TRONG một worklist.
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id      uuid NOT NULL REFERENCES node(id) ON DELETE CASCADE,
  child_id       uuid NOT NULL REFERENCES node(id) ON DELETE CASCADE,
  link_role      text NOT NULL,             -- vai trò gom: VISIT_ITEM | RESOURCE (dưới phiên-phòng) | COURSE (dưới liệu trình) | SUBTASK
  order_index    int  NOT NULL DEFAULT 0,   -- ★ THỨ TỰ NẰM TRÊN CẠNH (mỗi cha có thứ tự riêng)
  context_status text,                      -- NULL = kế thừa node.status; ghi đè khi hai cha NỘI BỘ cần trạng thái khác nhau
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id, link_role),
  CHECK  (parent_id <> child_id)
);

CREATE TABLE node_dependency (              -- CẠNH PHỤ THUỘC task→task (precondition). Tách khỏi cạnh cấu trúc.
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id uuid NOT NULL REFERENCES node(id) ON DELETE CASCADE,  -- điều kiện tiên quyết
  to_node_id   uuid NOT NULL REFERENCES node(id) ON DELETE CASCADE,  -- task bị chặn
  dep_type     text NOT NULL DEFAULT 'FINISH_TO_START',
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_node_id, to_node_id),
  CHECK  (from_node_id <> to_node_id)
);

CREATE TABLE task_bridge (                  -- ★ CẦU FACADE: task KHÁCH ↔ task NỘI BỘ. Ranh giới che giấu thông tin.
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_node_id uuid NOT NULL REFERENCES node(id) ON DELETE CASCADE,  -- node visibility=CUSTOMER
  internal_node_id uuid NOT NULL REFERENCES node(id) ON DELETE CASCADE,  -- node visibility=INTERNAL
  is_result_source boolean NOT NULL DEFAULT false,  -- node nội bộ nào là nguồn KQ đẩy ra cho khách
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_node_id, internal_node_id),
  CHECK  (customer_node_id <> internal_node_id)
);
-- BẢNG NỐI (không phải cột FK) → chịu được cả 1:1 LẪN 1:N.
-- 1:1 = "khám phòng Nội"; 1:N = "xét nghiệm máu" (1 task khách = lấy mẫu + chạy máy + duyệt KQ).
-- ⚠ (a) anh D nói 1:1 — dùng bảng nối để sau này gặp 1:N KHÔNG phải đập lại schema.
```

### Bốn điểm thiết kế quan trọng

1. **`order_index` nằm trên `node_link`, KHÔNG nằm trên `node`.** Một node nội bộ vẫn có nhiều cha (buổi châm thuộc cả phiên-phòng lẫn liệu trình), mỗi cha xếp thứ tự riêng: trong liệu trình là "buổi thứ 7", trong hàng đợi phòng là "ca thứ 2". Một con số `order` trên node không gánh nổi cả hai. *(Đây cũng là điểm 2NF mấu chốt — xem mục 7.)*

2. **`task_bridge` là ranh giới facade — và nó là một BẢNG, không phải cột FK.** Vì quan hệ khách↔nội-bộ có thể 1:N (1 task "xét nghiệm máu" của khách = nhiều task phòng). Cột FK chỉ làm được 1:1; bảng nối làm được cả hai. Anh D chọn 1:1 — bảng nối tôn trọng lựa chọn đó mà không nhốt mình: hôm sau cần 1:N thì thêm dòng, không đập schema.

3. **`node_dependency` tách hẳn `node_link`.** Cạnh cấu trúc (cha-con) và cạnh phụ thuộc (XN trước → kê đơn sau) là **hai loại đồ thị khác nhau**. Trộn chung sẽ sinh chu trình giả. Chặn chu trình (giữ tính DAG) làm bằng trigger/app-layer khi insert.

4. **Che giấu thông tin bằng `node.visibility` + RLS.** Khách chỉ đọc được node `CUSTOMER`. Toàn bộ subtask, bước trung gian, "cheat hack" nằm ở node `INTERNAL` — RLS chặn cứng, khách không bao giờ thấy. Đây là cột thực thi đúng yêu cầu của anh D, không phải logic ở tầng app (dễ rò).

---

## 4. Nhóm C — Extension tables (CTI)

```sql
-- VISIT — worklist trục LÂM SÀNG (gốc theo bệnh nhân)
CREATE TABLE node_visit (
  node_id        uuid PRIMARY KEY REFERENCES node(id) ON DELETE CASCADE,
  patient_id     uuid NOT NULL REFERENCES patient(id),   -- ★ BỆNH NHÂN chỉ khai báo Ở ĐÂY
  department_id  uuid REFERENCES department(id),
  reception_time timestamptz NOT NULL,
  visit_object   text,                                   -- Đối tượng: KHONG_BH | BHYT...
  source         text
);

-- ROOM_SESSION — worklist trục NGUỒN LỰC (gốc theo phòng/ca)
CREATE TABLE node_room_session (
  node_id      uuid PRIMARY KEY REFERENCES node(id) ON DELETE CASCADE,
  room_id      uuid NOT NULL REFERENCES room(id),
  staff_id     uuid REFERENCES staff(id),                -- người phụ trách ca
  session_date date NOT NULL,
  shift        text
);

-- EXAM — task khám (con của Visit)
CREATE TABLE node_exam (
  node_id    uuid PRIMARY KEY REFERENCES node(id) ON DELETE CASCADE,
  service_id uuid REFERENCES service(id),                -- "khám nội" là một dịch vụ
  reason     text,        -- lý do đến khám
  history    text,        -- bệnh sử
  treatment  text         -- xử trí   (các trường text đều atomic → 1NF OK)
);

-- LAB_ORDER — task chỉ định xét nghiệm
CREATE TABLE node_lab_order (
  node_id        uuid PRIMARY KEY REFERENCES node(id) ON DELETE CASCADE,
  service_id     uuid NOT NULL REFERENCES service(id),
  room_id        uuid REFERENCES room(id),               -- phòng thực hiện
  sample_time    timestamptz,
  sample_quality text
);

-- LAB_RESULT — task nhập kết quả
CREATE TABLE node_lab_result (
  node_id      uuid PRIMARY KEY REFERENCES node(id) ON DELETE CASCADE,
  performed_by uuid REFERENCES staff(id),
  approved_by  uuid REFERENCES staff(id),
  approved_at  timestamptz
);

-- TREATMENT_COURSE — LIỆU TRÌNH (case B3)
CREATE TABLE node_tx_course (
  node_id          uuid PRIMARY KEY REFERENCES node(id) ON DELETE CASCADE,
  service_id       uuid NOT NULL REFERENCES service(id),
  planned_sessions int NOT NULL,            -- ví dụ 10
  date_from        date,
  date_to          date
);

-- TREATMENT_SESSION — BUỔI điều trị (2 cha: course + room_session)
CREATE TABLE node_tx_session (
  node_id        uuid PRIMARY KEY REFERENCES node(id) ON DELETE CASCADE,
  session_number int NOT NULL,              -- 1..10
  performed_by   uuid REFERENCES staff(id),
  performed_at   timestamptz
);
```

---

## 5. Nhóm D — Bảng con nhiều dòng (chuẩn hóa 1NF)

```sql
-- Chẩn đoán ICD của một EXAM (nhiều dòng, mã kép ICD-10 + ICD-YHCT)
CREATE TABLE diagnosis (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_node_id  uuid NOT NULL REFERENCES node_exam(node_id) ON DELETE CASCADE,
  icd_code      text NOT NULL,
  icd_yhct_code text,
  is_primary    boolean NOT NULL DEFAULT false
);
-- Ràng buộc "đúng 1 ICD chính / phiếu" bằng partial unique index:
CREATE UNIQUE INDEX one_primary_icd ON diagnosis (exam_node_id) WHERE is_primary;

-- Dòng kết quả XN (nhiều dòng)
CREATE TABLE lab_result_line (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_node_id uuid NOT NULL REFERENCES node_lab_result(node_id) ON DELETE CASCADE,
  analyte        text NOT NULL,
  value          text,
  unit           text,
  ref_low        numeric,
  ref_high       numeric,
  is_abnormal    boolean
);

-- Lần đo sinh hiệu (gắn với 1 node bất kỳ: visit hoặc buổi điều trị)
CREATE TABLE vital_measurement (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id     uuid NOT NULL REFERENCES node(id) ON DELETE CASCADE,
  measured_at timestamptz NOT NULL DEFAULT now(),
  weight_kg   numeric(5,2),
  height_cm   numeric(5,2),
  temp_c      numeric(4,1),
  pulse       int,
  spo2        int,
  bp_sys      int,
  bp_dia      int
  -- ★ BMI KHÔNG lưu — tính lúc đọc (tránh dữ liệu cũ; chỉ lưu số đo gốc)
);
```

> **Vì sao tách bảng con thay vì nhồi vào 1 ô?** Nếu lưu ICD dạng `"J00, R51"` trong một cột text → **vi phạm 1NF** (giá trị không nguyên tử), không query/ràng buộc "đúng 1 ICD chính" được. Tách dòng → mỗi giá trị một row → 1NF + đặt được unique index.

---

## 6. Mô phỏng luồng dữ liệu — Happy case end-to-end

> Đi theo MỘT lượt khám bình thường từ đầu tới cuối, cho thấy **từng bước ghi gì xuống bảng nào**. Đọc mục này trước rồi xuống mục 6B (case khó) sẽ dễ thấm.

**Nhân vật (master data có sẵn):** BN Trần Văn B (`P_B`) · Lễ tân Hoa · BS Minh (phòng khám TMH `R_ENT`) · KTV Lan (phòng lấy máu `R_DRAW` + lab `R_LAB`) · dịch vụ `SV_ENT` (khám TMH), `SV_CBC` (công thức máu).

**Quy ước:** node KHÁCH = `CK*`, node NỘI BỘ = `IN*`. **＋** = INSERT, **✎** = UPDATE.

### Bước 1 — Tiếp nhận (Lễ tân Hoa)
- ＋ `node` **V1** (VISIT, **CUSTOMER**, IN_PROGRESS) · ＋ `node_visit`(V1, patient=P_B, KHONG_BH)
- ＋ `node` **CK1** (CUSTOMER, "Khám TMH", PENDING) · ＋ `node_link`(V1→CK1, VISIT_ITEM, order=1)
- ＋ `node` **IN1** (INTERNAL, EXAM, PENDING) · ＋ `node_link`(RS_ENT→IN1, RESOURCE, order=3) ← vào hàng đợi phòng TMH
- ＋ `task_bridge`(CK1 ↔ IN1, is_result_source=true)

→ Khách mở app thấy đúng 1 dòng *"Khám TMH — đang chờ"*. Không thấy IN1, không thấy phòng nào.

### Bước 2 — Khám TMH (BS Minh)
- ✎ IN1.status: PENDING → IN_PROGRESS → COMPLETED
- ＋ `node_exam`(IN1, service=SV_ENT, reason="đau họng, ù tai 3 ngày") · ＋ `diagnosis`(IN1, icd="J31", is_primary=true)
- Bác sĩ chỉ định XN máu → đẻ nhánh xét nghiệm:
  - ＋ `node` **CK2** (CUSTOMER, "Xét nghiệm máu — nhận KQ") · ＋ `node_link`(V1→CK2, order=2)
  - ＋ `node` **IN2** (INTERNAL, LAB_ORDER, PENDING) dưới RS_DRAW · ＋ `node` **IN3** (INTERNAL, LAB_RESULT, PENDING) dưới RS_LAB
  - ＋ `node_dependency`(IN1→IN2) · ＋ `node_dependency`(IN2→IN3) ← lấy mẫu xong mới chạy máy
  - ＋ `task_bridge`(CK2 ↔ IN2) · ＋ `task_bridge`(CK2 ↔ IN3, is_result_source=true) ← **1 task khách, 2 task nội bộ = 1:N**
- sync qua cầu: ✎ CK1.status → COMPLETED (khách thấy "đã khám xong")

### Bước 3 — Lấy mẫu + chạy xét nghiệm (KTV Lan)
- ✎ IN2.status → COMPLETED · ＋ `node_lab_order`(IN2, sample_time, sample_quality="Đạt")
- dependency IN2→IN3 thỏa → IN3 mở khóa
- ✎ IN3.status → IN_PROGRESS · ＋ `node_lab_result`(IN3, performed_by=Lan, approved_by, approved_at)
- ＋ `lab_result_line` × N: WBC 12.5 (cao ⚠) · RBC 4.8 · HGB 140... — **mỗi chỉ số 1 dòng (1NF)**
- ✎ IN3.status → COMPLETED
- sync qua cầu (nguồn KQ = IN3): ✎ CK2.status → COMPLETED (khách nhận "đã có kết quả")

### Bước 4 — Kê đơn (BS Minh)
- ＋ `node_dependency`(IN3→IN4) ← **có KQ mới được kê đơn**
- ＋ `node` **IN4** (INTERNAL, PRESCRIPTION, PENDING) dưới RS_ENT — IN3 đã COMPLETED nên không bị chặn
- ＋ `node` **CK3** (CUSTOMER, "Nhận đơn thuốc") · ＋ `node_link`(V1→CK3, order=3) · ＋ `task_bridge`(CK3 ↔ IN4)
- ✎ IN4.status → COMPLETED (＋ bảng `node_prescription` — thuộc module Thuốc, pha sau; xem mục 10) · sync: ✎ CK3 → COMPLETED

### Bước 5 — Hẹn tái khám
- ＋ `node` **IN5** (INTERNAL, FOLLOWUP) dưới RS_ENT · ＋ `node_followup`(IN5, hẹn sau 14 ngày) *(extension followup — pha sau)*
- ＋ `node` **CK4** (CUSTOMER, "Lịch tái khám") · ＋ `node_link`(V1→CK4, order=4) · ＋ `task_bridge`(CK4 ↔ IN5)

### Bước 6 — Đóng lượt khám
- Tất cả CK1..CK4 = COMPLETED → ✎ V1.status → COMPLETED

### Ảnh chụp cuối — bảng `node`
| id | visibility | node_type | title | status |
|---|---|---|---|---|
| V1 | CUSTOMER | VISIT | Lượt khám BN Trần Văn B | COMPLETED |
| CK1 | CUSTOMER | EXAM | Khám TMH | COMPLETED |
| CK2 | CUSTOMER | LAB_ORDER | Xét nghiệm máu — nhận KQ | COMPLETED |
| CK3 | CUSTOMER | PRESCRIPTION | Nhận đơn thuốc | COMPLETED |
| CK4 | CUSTOMER | FOLLOWUP | Lịch tái khám | COMPLETED |
| IN1 | INTERNAL | EXAM | Khám TMH (BS Minh) | COMPLETED |
| IN2 | INTERNAL | LAB_ORDER | Lấy mẫu máu | COMPLETED |
| IN3 | INTERNAL | LAB_RESULT | Chạy & duyệt CBC | COMPLETED |
| IN4 | INTERNAL | PRESCRIPTION | Kê đơn | COMPLETED |
| IN5 | INTERNAL | FOLLOWUP | Hẹn tái khám | COMPLETED |

→ 5 dòng CUSTOMER là **tất cả** những gì khách thấy. 5 dòng INTERNAL + room session + subtask + dòng KQ chi tiết: khách **không** chạm tới.

### ⊕ Sơ đồ luồng (diagram 5)

![Happy case end-to-end](diagrams/05_happy_case.png)

```mermaid
flowchart TD
    subgraph KHACH["WORKLIST KHÁCH (CUSTOMER · BN chỉ thấy phần này)"]
        V1["VISIT V1<br/>Lượt khám BN Trần Văn B"]
        CK1["CK1 · Khám TMH"]
        CK2["CK2 · Xét nghiệm máu"]
        CK3["CK3 · Nhận đơn thuốc"]
        CK4["CK4 · Lịch tái khám"]
        V1 -->|order=1| CK1
        V1 -->|order=2| CK2
        V1 -->|order=3| CK3
        V1 -->|order=4| CK4
    end
    subgraph NOIBO["WORKLIST NỘI BỘ (INTERNAL · giấu khách)"]
        IN1["IN1 EXAM<br/>Khám TMH — BS Minh"]
        IN2["IN2 LAB_ORDER<br/>Lấy mẫu — phòng lấy máu"]
        IN3["IN3 LAB_RESULT<br/>Chạy + duyệt CBC — lab"]
        IN4["IN4 PRESCRIPTION<br/>Kê đơn — BS Minh"]
        IN5["IN5 FOLLOWUP<br/>Hẹn tái khám"]
        IN1 -->|"depends: khám xong mới chỉ định"| IN2
        IN2 -->|"depends: lấy mẫu xong mới chạy máy"| IN3
        IN3 -->|"depends: có KQ mới kê đơn"| IN4
    end
    CK1 -. bridge .-> IN1
    CK2 -. "bridge 1:N" .-> IN2
    CK2 -. "bridge 1:N" .-> IN3
    CK3 -. bridge .-> IN4
    CK4 -. bridge .-> IN5
    style CK1 fill:#d4edda,stroke:#28a745
    style CK2 fill:#d4edda,stroke:#28a745
    style CK3 fill:#d4edda,stroke:#28a745
    style CK4 fill:#d4edda,stroke:#28a745
```

> **3 điều mục này chứng minh:**
> 1. **Che giấu:** khách chỉ thấy 5 dòng `CK*` mờ; toàn bộ `IN*`, room session, subtask, KQ chi tiết bị giấu (`visibility` + RLS).
> 2. **Bridge 1:N:** "Xét nghiệm máu" = CK2 → (IN2 + IN3). Đúng case (a) đang chờ anh D chốt — và vì cầu là bảng nối nên 1:N chạy được ngay.
> 3. **Thứ tự thật bằng `node_dependency`**, không phải bằng cấp bậc cây: lấy mẫu → chạy máy → có KQ → kê đơn là chuỗi mũi tên ngang, đúng cái mà "cây" không vẽ được (khó khăn #2).

---

## 6B. ★ Trường hợp khó — case B3 (liệu trình 10 buổi)

Bệnh nhân A, châm cứu 10 buổi, đến 10 ngày khác nhau. Mô hình facade: **mặt tiền cho khách + đồ thị thật giấu bên trong + cầu nối**.

**`node`** — chú ý cột `visibility` chia hai thế giới:

| id | node_type | visibility | title | status |
|---|---|---|---|---|
| V1 | VISIT | **CUSTOMER** | Lượt khám BN A | IN_PROGRESS |
| CK | TX_COURSE | **CUSTOMER** | "Châm cứu — theo dõi & nhận KQ" (mặt tiền) | IN_PROGRESS |
| C1 | TX_COURSE | **INTERNAL** | Liệu trình 10 buổi (thực thi) | IN_PROGRESS |
| S7 | TX_SESSION | **INTERNAL** | Buổi 7 | COMPLETED |
| RS | ROOM_SESSION | **INTERNAL** | Phòng châm cứu — 20/06 | IN_PROGRESS |

**`node_link`** — đa-cha **vẫn còn, nhưng nằm TRỌN trong phía INTERNAL**:

| parent_id | child_id | link_role | order_index | phía | ý nghĩa |
|---|---|---|---|---|---|
| V1 | CK | VISIT_ITEM | 3 | KHÁCH | Liệu trình là mục thứ 3 khách thấy trong lượt khám |
| C1 | S7 | COURSE | **7** | NỘI BỘ | Buổi 7 là bước thứ **7** trong liệu trình |
| RS | S7 | RESOURCE | **2** | NỘI BỘ | Cùng buổi đó là ca thứ **2** trong hàng đợi phòng 20/06 |

→ S7 vẫn **2 cha, 2 thứ tự** (đây là lý do `order_index` phải nằm trên cạnh — điểm 2NF). Khác bản cũ: hai cha này đều **INTERNAL**, khách không chạm tới.

**`task_bridge`** — cây cầu duy nhất bắc qua ranh giới:

| customer_node_id | internal_node_id | is_result_source |
|---|---|---|
| CK | C1 | true |

→ Khách nhìn **CK**; hệ thống đẩy tiến độ ("6/10 buổi") và KQ từ **C1** lên CK qua cầu. Khách **không thấy** S7, RS, hay bất kỳ subtask nào. Mấy "cheat hack" anh D nói sống an toàn ở phía INTERNAL.

**`node_tx_session`** + **`vital_measurement`** gắn thẳng vào S7 (INTERNAL) → mỗi buổi có người thực hiện + sinh hiệu riêng, vẫn ẩn với khách.

**A2 đã được anh D vá ở đây:** CK có trạng thái mờ riêng ("đang điều trị / có KQ"), C1+S7 có trạng thái chi tiết riêng — **hai record khác nhau**, không phải nhồi 2 trạng thái vào 1 node như bản cũ. `context_status` trên cạnh giờ chỉ còn là công cụ dự phòng cho phân kỳ trong nội bộ.

> **Còn treo (b):** "buổi hôm nay" có nên là task khách riêng (khách check-in mỗi ngày) hay không — quyết định worklist khách 2 tầng (V1→CK) hay 3 tầng. Đang chờ anh D chốt; schema chịu được cả hai (chỉ là thêm/bớt node CUSTOMER + dòng bridge).

---

## 7. Kiểm tra chuẩn hóa 1NF / 2NF / 3NF

### 1NF — mọi giá trị nguyên tử, không nhóm lặp
✅ Đạt. Không cột nào chứa list. Những thứ "nhiều giá trị" (ICD, dòng KQ, sinh hiệu, **danh sách con của một node**) đều là **bảng riêng, mỗi giá trị một dòng**. Đặc biệt: "danh sách task con" KHÔNG phải cột lặp trên `node` mà là các dòng trong `node_link`.

### 2NF — không phụ thuộc một phần vào khóa
✅ Đạt. Hầu hết bảng dùng khóa thay thế đơn (`uuid`) → 2NF thỏa hiển nhiên.
Điểm tinh tế nằm ở **`node_link`** (khóa nghiệp vụ ghép `parent_id + child_id + link_role`):
- `order_index` phụ thuộc **toàn bộ** bộ ba (cùng một con, dưới cha khác/role khác thì thứ tự khác) — **không** phụ thuộc riêng `child_id`.
- → Nếu đặt `order_index` lên `node` (chỉ phụ thuộc `child_id`) thì **đó mới là vi phạm 2NF**. Thiết kế này tránh đúng cái bẫy đó.

### 3NF — không phụ thuộc bắc cầu (non-key → non-key)
✅ Đạt. Các quyết định cố ý để giữ 3NF:
- **`patient_id` chỉ ở `node_visit`.** Không lặp xuống node nội bộ. Bệnh nhân của một task nội bộ được **suy ra** qua chuỗi: `internal_node → task_bridge → customer_node → node_link(VISIT_ITEM) → V1 → node_visit.patient_id`. Không lưu thừa → không update anomaly.
- **Giá dịch vụ không copy vào node.** `node_exam.service_id` chỉ trỏ FK; giá đọc từ `service`. Tránh `node → service → price` lưu thừa.
- **BMI, Tuổi thai không lưu** — tính lúc đọc từ số đo / LMP gốc.

> **Lưu ý đánh đổi (denormalization có kiểm soát):** Sau khi tách facade, đường suy ra `patient_id` cho node nội bộ dài tới **4 hop** (qua cầu). Lý thuyết thì 3NF-sạch, nhưng "hiện tên BN trên hàng đợi phòng" mà join 4 hop mỗi dòng thì xót. Cách thực dụng: denormalize `patient_id` (hoặc `root_visit_id`) **đã tính sẵn** lên node nội bộ lâm sàng. Đây là denormalize CÓ CHỦ ĐÍCH, ghi rõ, làm *sau khi đo* — không phải lỗi thiết kế.

---

## 8. Map sang UI — hai worklist, một cây cầu

Khác bản cũ: **không còn "cùng tập node"** — mà là HAI tập node tách biệt, nối qua `task_bridge`. Đúng tinh thần facade của anh D.

**① Màn hình KHÁCH (mặt tiền):** chỉ node `CUSTOMER`, nông, không lộ nội bộ.
```sql
SELECT n.*, l.order_index
FROM node n
JOIN node_link l ON l.child_id = n.id AND l.link_role = 'VISIT_ITEM'
WHERE l.parent_id = :visit_id AND n.visibility = 'CUSTOMER'
ORDER BY l.order_index;
```

**② Màn hình NỘI BỘ / phòng (thực thi):** recursive CTE đệ quy mọi tầng của worklist nội bộ.
```sql
WITH RECURSIVE tree AS (
  SELECT n.*, l.order_index, 1 AS depth
  FROM node n JOIN node_link l ON l.child_id = n.id
  WHERE l.parent_id = :root_id            -- room_session HOẶC course nội bộ
  UNION ALL
  SELECT n.*, l.order_index, t.depth + 1
  FROM tree t
  JOIN node_link l ON l.parent_id = t.id
  JOIN node n ON n.id = l.child_id
)
SELECT * FROM tree WHERE visibility = 'INTERNAL' ORDER BY depth, order_index;
```

**③ Đẩy KQ ra mặt tiền (qua cầu):** trạng thái khách = chiếu từ node nội bộ nguồn-KQ.
```sql
SELECT ck.id  AS customer_task,
       ck.status AS facade_status,      -- cái khách thấy (mờ)
       ci.status AS internal_status     -- cái khách KHÔNG thấy (chi tiết)
FROM task_bridge b
JOIN node ck ON ck.id = b.customer_node_id
JOIN node ci ON ci.id = b.internal_node_id AND b.is_result_source
WHERE ck.id = :customer_task_id;
```

**Sync** = một trigger/job đẩy `internal → customer` khi node nguồn-KQ chuyển `COMPLETED`. Đây chính là **cái giá** của facade (xem mục 3) — đổi lấy việc khách không bao giờ thấy ruột gan nội bộ. UI nội bộ render bằng **một component đệ quy** đọc theo `depth` → độ sâu tùy biến (khám thường 2 tầng, gói tổng quát 4 tầng) không sửa code.

---

## 9. Tổng kết bảng

| # | Bảng | Nhóm | Vai trò 1 dòng |
|---|---|---|---|
| 1 | branch | A | một chi nhánh |
| 2 | department | A | một khoa |
| 3 | room | A | một phòng |
| 4 | staff | A | một nhân viên |
| 5 | patient | A | một bệnh nhân (toàn cục) |
| 6 | service | A | một dịch vụ / nhóm dịch vụ |
| 7 | node_type | B | một loại node (cấu hình) |
| 8 | **node** | B | một đơn vị công việc bất kỳ |
| 9 | **node_link** | B | một cạnh cha→con (M:N) trong 1 worklist |
| 10 | **node_dependency** | B | một cạnh phụ thuộc task→task |
| 11 | **task_bridge** | B | một mối nối task khách ↔ task nội bộ (facade) |
| 12 | node_visit | C | phần riêng của một lượt khám |
| 13 | node_room_session | C | phần riêng của một phiên phòng |
| 14 | node_exam | C | phần riêng của một phiếu khám |
| 15 | node_lab_order | C | phần riêng của một chỉ định XN |
| 16 | node_lab_result | C | phần riêng của một KQ XN |
| 17 | node_tx_course | C | phần riêng của một liệu trình |
| 18 | node_tx_session | C | phần riêng của một buổi điều trị |
| 19 | diagnosis | D | một dòng chẩn đoán ICD |
| 20 | lab_result_line | D | một dòng kết quả XN |
| 21 | vital_measurement | D | một lần đo sinh hiệu |

**4 bảng in đậm là toàn bộ "phép màu" của Đường B + facade.** Mọi nghiệp vụ mới = thêm 1 `node_type` + (nếu cần) 1 bảng extension. Không bao giờ phải sửa 4 bảng lõi.

---

## 10. Việc còn treo (cần chốt trước khi code)

- [ ] **Chống chu trình** cho `node_link` (cây cấu trúc) và `node_dependency` (DAG): trigger kiểm tra lúc INSERT, hay app-layer? → quyết định để giữ tính DAG.
- [ ] **`node_type` cố định hay cho admin tạo runtime?** (granula muốn "tool tạo phòng" linh hoạt — node_type có nên tương tự?)
- [ ] **Khóa đồng thời (case B6):** dùng optimistic (`updated_at` version) hay pessimistic (như EzMon "Hủy hoàn tất")? Ảnh hưởng cột trên `node`.
- [ ] **RLS theo `branch_id`** trên `node`: viết policy Supabase cụ thể.
- [ ] Mở rộng cho module chưa chạm: thanh toán, thuốc, kho (đều map được vào node nhưng cần extension riêng).
```
