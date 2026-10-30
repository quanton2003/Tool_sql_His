# HIS SQL Assistant v2 (Chạy 100% Local)

Công cụ hỗ trợ viết và phân tích SQL cho hệ thống thông tin bệnh viện (HIS). Toàn bộ dữ liệu được lưu trữ và vận hành cục bộ (Local) trên SQLite kết nối an toàn với cơ sở dữ liệu công ty (PostgreSQL - Read Only).

---

## 🚀 Khởi chạy nhanh (1-Click)

### Cách 1: Chạy file batch (Windows)
Double click vào file:
```
start-local.bat
```

### Cách 2: Chạy lệnh từ thư mục gốc
```bash
npm run dev
```
Lệnh này sẽ tự động chạy đồng thời cả **Backend** (`http://localhost:3000`) và **Frontend** (`http://localhost:5173`).

---

## 🔐 Tài khoản đăng nhập mặc định (Local)

Hệ thống đã hỗ trợ các tài khoản đăng nhập cục bộ:
- **Tài khoản 1:** `quannh` / Mật khẩu: `admin123` (hoặc `123456`)
- **Tài khoản 2:** `admin` / Mật khẩu: `admin123`

---

## 🛠️ Các lệnh hữu ích (Root)

| Lệnh | Chức năng |
|------|-----------|
| `npm run dev` | Khởi chạy cả Backend và Frontend đồng thời |
| `npm run dev:backend` | Chỉ chạy Backend (NestJS development mode) |
| `npm run dev:frontend` | Chỉ chạy Frontend (Vite development mode) |
| `npm run build` | Build production cho cả Backend & Frontend |
| `npm run start` | Chạy Backend bản production build |
| `npm run install:all` | Cài đặt toàn bộ dependencies |

---

## 📋 Tính năng chính

### 1. Dashboard
- Thống kê số lượng chức năng (101 chức năng), Knowledge items, SQL generated, Schema snapshots.

### 2. Chức năng (`/app/chuc-nang`)
- CRUD đầy đủ: thêm / sửa / xóa chức năng nghiệp vụ HIS.
- Tìm kiếm nhanh, lọc theo trạng thái active/inactive.

### 3. Tra cứu Database (`/app/tra-cuu-database`)
- Đọc thông tin schema từ PostgreSQL công ty (read-only).
- Đã lưu trữ snapshot hơn 384.000 cột, 15.000 bảng vào SQLite cục bộ.
- Tìm kiếm bảng, xem chi tiết cột (kiểu dữ liệu, nullable, PK, FK).
- Test kết nối Company DB trực tiếp.

### 4. SQL Query & Assistant (`/app/sql-query`, `/app/sql-assistant`)
- Trình soạn thảo và thực thi truy vấn SQL có kiểm soát (chỉ cho phép `SELECT`, `WITH`, `EXPLAIN`, chặn tuyệt đối câu lệnh ghi/xóa `INSERT`, `UPDATE`, `DELETE`, `DROP`).
- Tự động gợi ý từ khóa, bảng và cột từ schema snapshot.
- Hỗ trợ AI sinh câu lệnh SQL dựa trên nghiệp vụ HIS.

### 5. Knowledge (`/app/knowledge`)
- Ghi nhận và chuẩn hóa ý nghĩa các bảng và cột viết tắt trong hệ thống HIS.

### 6. Settings (`/app/settings`)
- Cấu hình thông số kết nối Database bệnh viện (Host, Port, Database, User, Password, Schema).
- Kiểm tra kết nối và reload cấu hình trực tiếp mà không cần khởi động lại server.

---

## ⚙️ Cấu hình Local (`.env`)

File `.env` nằm tại thư mục gốc của dự án:
```env
PORT=3000

# Company HIS Database (PostgreSQL) - READ ONLY
HIS_DB_HOST=27.72.192.2
HIS_DB_PORT=6688
HIS_DB_NAME=bvducgiang
HIS_DB_USER=postgres
HIS_DB_PASSWORD=bvEHC@123@
HIS_DB_SCHEMA=public

# App Database (SQLite lưu trữ toàn bộ dữ liệu nội bộ)
APP_DB_PATH=./data/app.sqlite

# JWT Secret
JWT_SECRET=his-secret-key-2026-local

# OpenAI (tùy chọn cho tính năng AI sinh SQL)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

---

## 🏗️ Cấu trúc dự án

```
Tool_sql_His/
├── start-local.bat    # File kích hoạt 1-click chạy cả Backend & Frontend
├── package.json       # Quản lý script khởi chạy root
├── .env               # Cấu hình biến môi trường
├── data/
│   └── app.sqlite     # Database SQLite cục bộ (chứa snapshot, chức năng, knowledge)
├── backend/           # NestJS 10 + TypeORM (SQLite + pg Pool)
│   ├── src/
│   │   ├── auth/             # Xác thực JWT & Guard
│   │   ├── chuc-nang/        # Quản lý danh mục chức năng HIS
│   │   ├── company-database/ # Kết nối an toàn read-only tới DB công ty
│   │   ├── database/         # Cấu hình TypeORM thông minh tìm SQLite DB
│   │   ├── knowledge/        # Tri thức nghiệp vụ bảng/cột
│   │   ├── schema-snapshot/  # Snapshot cấu trúc bảng/cột
│   │   ├── settings/         # Cấu hình động lưu trong DB
│   │   ├── sql-query/        # Bộ thực thi & AI sinh SQL
│   │   └── main.ts           # Điểm khởi chạy NestJS, cấu hình CORS local
│   └── data/
│       └── app.sqlite
└── frontend/          # React + Vite + TypeScript + Ant Design v5
    ├── src/
    │   ├── pages/            # Dashboard, ChucNang, SqlQuery, Knowledge, Settings...
    │   ├── components/       # Layout và UI components
    │   ├── services/         # Axios API Client
    │   └── App.tsx           # Router & Theme
    └── vite.config.ts        # Proxy /api -> http://localhost:3000
```
