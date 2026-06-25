# SuperExam - Hệ Thống Quản Lý & Tổ Chức Thi SaaS Multi-Tenant

**SuperExam** là nền tảng SaaS (Software-as-a-Service) chuyên nghiệp dùng để quản lý ngân hàng câu hỏi, thiết lập đề thi động và tổ chức thi trực tuyến với kiến trúc phân tách dữ liệu đa tổ chức (Multi-Tenant) cùng các tính năng chống gian lận (Anti-Cheat) nâng cao.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React.
- **Backend:** Next.js Route Handlers, Server Cookies bảo mật mã hóa bằng thuật toán `AES-256-GCM`.
- **Database & ORM:** PostgreSQL, Prisma 7 ORM (sử dụng Adapter Pg Driver mới nhất).
- **Authentication:** Firebase Authentication (Google Sign-In) tích hợp Firebase Admin SDK.
- **Containers:** Docker & Docker Compose hỗ trợ đóng gói môi trường.

---

## ✨ Các Tính Năng Nổi Bật

### 1. Phân Tách Dữ Liệu Đa Tổ Chức (Multi-Tenant SaaS)
- Mỗi trường học, doanh nghiệp là một **Tenant** độc lập. Dữ liệu được lọc tuyệt đối thông qua khóa ngoại `organizationId`.
- Cơ chế mời thành viên thông qua mã mời (`inviteCode`) ngẫu nhiên bảo mật.

### 2. Phân Tách Quyền Hạn Nghiêm Ngặt (Separation of Concerns)
- **Super-Admin (Quản trị hệ thống):**
  - Theo dõi chỉ số toàn hệ thống (Tổng số tổ chức, tổng số người dùng).
  - Quản lý danh sách Tổ chức (Tạo mới, tự động sinh mã mời).
  - Quản lý danh sách thành viên thuộc từng tổ chức, thực hiện thăng/hạ cấp vai trò (`Admin` <-> `User`) trực tiếp không cần reload trang.
  - Được ẩn hoàn toàn các tính năng biên soạn thi cử cấp tổ chức.
- **Tenant Admin (Quản trị tổ chức):**
  - Quản lý danh mục bài thi, độ khó câu hỏi (Dễ, Trung bình, Khó, Nâng cao).
  - Quản lý ngân hàng câu hỏi (Trắc nghiệm 1 đáp án, nhiều đáp án, tự luận).
  - **Aiken Format Parser:** Hỗ trợ dán hoặc tải file định dạng Aiken để tự động phân tích cú pháp câu hỏi và import hàng loạt.
  - **Ma Trận Đề Thi (Matrix Builder):** Thiết lập cấu hình đề thi động theo số lượng câu hỏi từ từng danh mục và độ khó mong muốn.
  - Quản lý kết quả thi của thí sinh và cổng chấm điểm tự luận trực quan.
- **Candidate (Thí sinh/Học viên):**
  - Dashboard lựa chọn đề thi có sẵn và xem lịch sử kết quả thi.
  - Giao diện thi tối ưu hóa trên mọi thiết bị (swipe điều hướng trên mobile, chia 2 cột trên desktop).

### 3. Phòng Thi Chống Gian Lận (Test Arena & Anti-Cheat)
- **Đếm ngược thời gian thực:** Đồng bộ lệch thời gian (Drift) giữa máy khách và máy chủ.
- **Tự động lưu bài (Autosave):** Lưu câu trả lời ngay vào LocalStorage và đồng bộ lên database định kỳ 12 giây để bảo toàn tiến trình thi.
- **Theo dõi tập trung (Focus Monitor):** Nhận diện hành vi rời tab thi (chuyển tab hoặc thu nhỏ trình duyệt) và đếm số lần vi phạm để lưu lại nhật ký vi phạm (`cheatLogs`).
- **Nút hủy thi an toàn (Abort Flow):** Cho phép thoát phòng thi giữa chừng, xóa cache nháp và xóa phiên thi đang dang dở trong DB nếu thí sinh muốn chọn đề thi khác.

### 4. Luồng Auth Tối Ưu Hóa & Chống Lỗi 401
- Thiết lập cơ chế **Passive Listener** tại Client-side: Ưu tiên kiểm tra cookie phiên từ Server trước. Nếu hợp lệ, hệ thống hoàn toàn bỏ qua việc gọi API đồng bộ để tránh Race Condition gây ra lỗi 401 khi reload trang.
- API Sync xác thực đa kênh (Headers + Body) và trả về lỗi phân loại rõ ràng (ví dụ: `auth/id-token-expired`) giúp Client chủ động dọn dẹp phiên thi khi token Firebase hết hạn.

---

## 📁 Cấu Trúc Thư Mục Chính

```
super-exam/
├── prisma/
│   ├── schema.prisma       # Định nghĩa lược đồ dữ liệu PostgreSQL
│   └── prisma.config.ts    # Cấu hình Prisma 7 ORM
├── public/                 # Các tài nguyên tĩnh (svg, icon)
└── src/
    ├── app/
    │   ├── admin/          # Giao diện dành cho Tenant Admin
    │   ├── api/            # API Route Handlers (Auth, Admin, Exam, Super-Admin)
    │   ├── dashboard/      # Giao diện chính của Thí sinh
    │   ├── exam/           # Giao diện Phòng thi
    │   ├── join/           # Onboarding nhập mã mời gia nhập Tổ chức
    │   ├── login/          # Màn hình đăng nhập bằng Google
    │   └── super-admin/    # Giao diện dành cho Super-Admin
    ├── components/
    │   ├── layout/         # Layout khung điều hướng (AdminLayout, ExamLayout)
    │   └── ui/             # Các UI components tái sử dụng (TouchCard, TimerDisplay)
    ├── context/
    │   └── AuthContext.tsx # Quản lý trạng thái và vòng đời đăng nhập Client
    ├── lib/
    │   ├── firebase/       # Thiết lập SDK Firebase (Client & Admin Service Account)
    │   ├── parser/         # Aiken Format Text Parser
    │   ├── prisma.ts       # Singleton instance cho database adapter
    │   └── session.ts      # Tiện ích mã hóa session cookie bảo mật
    └── proxy.ts            # Next.js Custom Middleware quản lý RBAC
```

---

## 🚀 Hướng Dẫn Cài Đặt

### 1. Chuẩn bị biến môi trường
Tạo tệp `.env` tại thư mục gốc với các thông số mẫu sau:

```env
# Kết nối PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/super_exam?schema=public"

# Địa chỉ Email đặc quyền của Super-Admin đầu tiên
INITIAL_SUPER_ADMIN_EMAIL="admin@yourdomain.com"

# Cấu hình Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-app"
NEXT_PUBLIC_FIREBASE_APP_ID="1:..."

# Cấu hình Firebase Admin SDK (Service Account)
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-..."
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0..."
```

### 2. Khởi động với NPM (Cục bộ)
```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Tạo client database và tạo các bảng trong PostgreSQL
npx prisma db push

# 3. Chạy server phát triển (Development)
npm run dev
```
Truy cập ứng dụng tại địa chỉ: `http://localhost:3000`.

### 3. Đóng gói Production
Để biên dịch và tối ưu hóa dự án trước khi chạy:
```bash
npm run build
npm run start
```
