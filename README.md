# HIS SQL Assistant v2

Công cụ hỗ trợ viết SQL cho hệ thống thông tin bệnh viện (HIS).

## Tính năng

### Dashboard
- Thống kê số chức năng, knowledge items, SQL generated, confirmed knowledge
- Hiển thị thông tin schema snapshot

### Chức năng (`/app/chuc-nang`)
- CRUD đầy đủ: thêm/sửa/xóa chức năng
- Tìm kiếm theo tên
- Trạng thái active/inactive

### Tra cứu Database (`/app/tra-cuu-database`)
- Đọc thông tin schema từ PostgreSQL (read-only)
- Đồng bộ cấu trúc database về SQLite
- Tìm kiếm bảng, xem chi tiết cột (kiểu dữ liệu, nullable, PK, FK)
- Test kết nối Company DB

### Knowledge (`/app/knowledge`)
- CRUD: lưu ý nghĩa bảng/cột
- Trạng thái: suggested / confirmed / unknown / rejected
- Tìm kiếm theo tên bảng/cột

### SQL History (`/app/history`)
- Lịch sử SQL đã tạo (request, sql, status, timestamp)

### Settings (`/app/settings`)
- Cấu hình Company HIS Database (PostgreSQL)
- Test kết nối, sync schema
- Reload config không cần restart backend

## Yêu cầu

- Node.js >= 20
- npm >= 10
- Git

## Cài đặt

```powershell
git clone <repository-url>
cd duan_sqlhis

cd backend
npm install

cd ../frontend
npm install
```

## Chạy ứng dụng

```powershell
# Backend
cd backend
npm run start:dev
# Chạy tại: http://localhost:3000

# Frontend
cd frontend
npm run dev
# Chạy tại: http://localhost:5173
```

## Cấu trúc

```
duan_sqlhis/
├── frontend/          # React + Vite + TypeScript + Ant Design
│   ├── src/
│   │   ├── pages/     # Dashboard, ChucNang, TraCuuDatabase, Knowledge, History, Settings
│   │   ├── components/# Layout, shared components
│   │   ├── services/  # API client
│   │   └── App.tsx
├── backend/           # NestJS + TypeScript
│   ├── src/
│   │   ├── chuc-nang/        # Chức năng module
│   │   ├── knowledge/        # Knowledge module
│   │   ├── database/         # Company database / schema snapshot
│   │   ├── settings/         # Settings module (SQLite)
│   │   ├── health/           # Health check
│   │   ├── entities/         # TypeORM entities
│   │   └── main.ts
├── data/              # SQLite database files (app.sqlite)
└── .env               # Environment variables (HIS_DB_*, PORT, APP_DB_PATH)
```

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/health` | Health check |
| GET | `/api/settings` | Lấy tất cả settings |
| POST | `/api/settings` | Tạo setting |
| PUT | `/api/settings/:key` | Cập nhật setting |
| GET | `/api/chuc-nang` | Danh sách chức năng |
| POST | `/api/chuc-nang` | Tạo chức năng |
| PATCH | `/api/chuc-nang/:id` | Cập nhật chức năng |
| DELETE | `/api/chuc-nang/:id` | Xóa chức năng |
| GET | `/api/knowledge` | Danh sách knowledge |
| POST | `/api/knowledge` | Tạo knowledge |
| PATCH | `/api/knowledge/:id` | Cập nhật knowledge |
| DELETE | `/api/knowledge/:id` | Xóa knowledge |
| POST | `/api/database/company/test-connection` | Test kết nối Company DB |
| POST | `/api/database/company/sync-schema` | Đồng bộ schema về SQLite |
| POST | `/api/database/company/reload-config` | Reload config Company DB |
| GET | `/api/database/schemas` | Danh sách schemas từ snapshot |
| GET | `/api/database/tables?schema=` | Danh sách tables |
| GET | `/api/database/tables/:tableName/columns?schema=` | Chi tiết columns |

## Công nghệ

**Backend:**
- NestJS + TypeScript
- TypeORM + SQLite (local) + PostgreSQL (read-only)
- class-validator, CORS

**Frontend:**
- React 18 + Vite + TypeScript
- Ant Design v5
- Axios

## Biến môi trường

```env
# Company HIS Database (PostgreSQL)
HIS_DB_HOST=
HIS_DB_PORT=
HIS_DB_NAME=
HIS_DB_USER=
HIS_DB_PASSWORD=
HIS_DB_SCHEMA=

# App
PORT=3000
APP_DB_PATH=./data/app.sqlite
```
