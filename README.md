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
│   │   ├── company-database/ # Company database connection (PostgreSQL)
│   │   ├── database/         # TypeORM + SQLite config
│   │   ├── schema-snapshot/  # Schema sync service
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

## Cấu hình Database

### Cách hoạt động

Hệ thống lưu cấu hình database trong **SQLite** (bảng `settings`), KHÔNG đọc trực tiếp từ `.env` mỗi lần chạy.

- File `.env` chỉ dùng làm **giá trị mặc định** khi setting chưa tồn tại (lần đầu khởi động)
- Sau đó, mọi thay đổi cấu hình được lưu trong SQLite
- Để thay đổi cấu hình: vào **Settings UI** hoặc gọi API trực tiếp

### File .env

```env
# Company HIS Database (PostgreSQL) - READ ONLY
HIS_DB_HOST=ehcg1.ddns.net
HIS_DB_PORT=7001
HIS_DB_NAME=test_bvducgiang
HIS_DB_USER=ictu_test
HIS_DB_PASSWORD=ictu_test
HIS_DB_SCHEMA=public

# App
PORT=3000
APP_DB_PATH=./data/app.sqlite
```

### Cấu hình qua Settings UI

1. Mở http://localhost:5173/app/settings
2. Nhập thông tin database
3. Nhấn **"Kiểm tra kết nối"** để test
4. Nhấn **"Lưu cấu hình"**
5. Nhấn **"Đồng bộ cấu trúc"** để sync schema về SQLite

### Cấu hình qua API

```powershell
# Test kết nối
POST /api/database/company/test-connection

# Reload config (sau khi thay đổi settings)
POST /api/database/company/reload-config

# Đồng bộ schema
POST /api/database/company/sync-schema
Body: { "databaseName": "test_bvducgiang", "schemaName": "public" }
```

## Xử lý sự cố

### Lỗi "password authentication failed"

**Nguyên nhân:** Sai username hoặc password.

**Cách khắc phục:**
1. Kiểm tra credentials đúng với database admin
2. Cập nhật qua Settings UI hoặc API:
   ```powershell
   PUT /api/settings/HIS_DB_USER
   Body: { "value": "username" }
   
   PUT /api/settings/HIS_DB_PASSWORD
   Body: { "value": "password" }
   ```
3. Reload config và test lại

### Lỗi "database does not exist"

**Nguyên nhân:** Tên database không đúng hoặc user không có quyền truy cập.

**Cách khắc phục:**
- Kiểm tra tên database đúng (phân biệt hoa thường)
- Kiểm tra user có quyền truy cập database đó

### Lỗi "Connection terminated unexpectedly" / "ECONNREFUSED"

**Nguyên nhân:** Sai host/port hoặc firewall chặn.

**Cách khắc phục:**
- Kiểm tra host và port đúng
- Kiểm tra firewall cho phép kết nối
- Đảm bảo PostgreSQL server đang chạy và accept remote connections

### Reset về cấu hình mặc định từ .env

Nếu muốn reset settings về giá trị trong `.env`:

```powershell
# Xóa settings cũ (từng key một)
DELETE từ bảng settings trong SQLite
# Hoặc xóa file SQLite và tạo lại
Remove-Item backend/data/app.sqlite
# Khởi động lại backend - SettingsInitializerService sẽ tạo lại từ .env
```

### Lưu ý quan trọng

- **Port 6688** thường là cổng SSH, không phải PostgreSQL. PostgreSQL mặc định chạy trên port 5432.
- **DDNS hostname** (ehcg1.ddns.net) có thể resolve về IP khác (27.72.192.2). Nên dùng hostname thay vì IP trừ khi biết chắc IP tĩnh.
- Sau khi thay đổi settings, **phải reload config** để có hiệu lực.
