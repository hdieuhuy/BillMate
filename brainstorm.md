# Tài Liệu Brainstorm Ý Tưởng: Ứng Dụng Chia Tiền Nhóm (Split Bill Web App)

Tài liệu này tổng hợp toàn bộ ý tưởng định hướng, tính năng MVP, nhận diện thương hiệu và kiến trúc kỹ thuật cho dự án ứng dụng web chia tiền chuyên dụng cho các hội nhóm, chuyến đi du lịch hoặc các buổi liên hoan.

---

## 1. Định Vị Thương Hiệu (Branding & Identity)

### 📌 Tên Ứng Dụng: **BillMate**
* **Ý nghĩa:** Kết hợp giữa *Bill* (Hóa đơn) và *Mate* (Bạn bè, đồng hành). Tên gọi gợi sự thân thiện, gần gũi, đóng vai trò như một "người bạn" công tâm giúp nhóm quản lý chuyện tiền bạc một cách minh bạch, giữ gìn tình cảm.
* **Tagline:** *"Chi tiêu rõ ràng, tình bạn bền lâu."*

### 🎨 Màu Sắc Chủ Đạo (Color Palette)
Định hướng theo phong cách **Modern & Clean**, mang tính công nghệ cao nhưng vẫn tạo cảm giác tin cậy, liên quan đến tài chính:

* **Primary (Màu nhấn chính):** `Emerald Green (#10B981)`
    * *Lý do:* Màu xanh ngọc lục bảo đại diện cho tiền tệ, sự minh bạch, chính xác và mang lại cảm giác dễ chịu, an tâm khi xử lý các con số.
* **Base Dark (Text/Header):** `Slate Gray (#0F172A)`
    * *Lý do:* Tạo chiều sâu cho giao diện, độ tương phản cao, chuẩn mực của các thiết kế dashboard hiện đại.
* **Base Light (Background):** `Zinc Light (#F8FAFC)` hoặc `Pure White (#FFFFFF)`
    * *Lý do:* Giữ cho không gian hiển thị luôn sạch sẽ, gọn gàng, làm nổi bật các con số và nút hành động.
* **Destructive (Cảnh báo/Nợ):** `Rose/Coral (#F43F5E)`
    * *Lý do:* Dùng cho các khoản chưa thanh toán hoặc số dư âm cần chú ý.

### 📐 Định Hướng UI/UX Concept
* **Tối giản tối đa (Minimalism):** Sử dụng các đường bo góc mềm (rounded layouts), đường viền mảnh (border-slate-100), tận dụng triệt để hệ thống component như *Dialog (Modal), Popover, Card, Tabs* để gom luồng thao tác.
* **Không gian hiển thị (Layout Fitting):** Thiết kế dạng SPA (Single Page Application). Toàn bộ bảng tính và danh sách chi tiêu phải tự động co giãn (responsive) thông minh để **vừa khít trong khung hình máy tính/điện thoại**. Các khu vực hiển thị danh sách dài (như bảng chi tiêu hay component dữ liệu) sẽ cuộn độc lập bên trong container, hoàn toàn không xuất hiện thanh cuộn dọc (vertical scrollbar) của trình duyệt để đảm bảo UI luôn clean và giữ nguyên bố cục tổng thể.

---

## 2. Các Tính Năng Nổi Bật Phiên Bản MVP

Mục tiêu của MVP là tối giản hóa rào cản sử dụng (Frictionless) để người dùng có thể tạo và tính tiền ngay trong vòng 10 giây.

### 🚀 Tính năng 1: Khởi tạo nhóm không ma sát (Frictionless Onboarding)
* **Guest Mode (Không cần đăng nhập):** Người dùng vào trang chủ, chỉ cần nhập tên phòng/sự kiện (Ví dụ: *"Trip Đà Lạt 3N2Đ"*, *"Cơm trưa văn phòng"*) là có thể sử dụng ngay.
* **Đồng bộ qua Link & QR nhóm:** Hệ thống tự động sinh ra một URL duy nhất chứa mã định danh nhóm (Token mã hóa). Chỉ cần copy link này gửi vào group Zalo/Messenger, bạn bè bấm vào là tham gia ngay lập tức mà không cần tạo tài khoản.

### 💸 Tính năng 2: Nhập chi tiêu linh hoạt (Smart Expense Tracker)
Giao diện thêm khoản chi (Add Expense) được thiết kế tinh gọn dưới dạng một Dialog, trả lời nhanh 3 câu hỏi cốt lõi:
1.  **Ai trả?** (Chọn người trả trước tiền).
2.  **Bao nhiêu tiền & Cho việc gì?** (Nhập số tiền và mô tả nhanh: Tiền phòng, Tiền xăng, Ăn tối...).
3.  **Chia cho những ai và chia như thế nào?**
    * *Chia đều (Equally):* Tự động chia đều cho tất cả thành viên (Mặc định).
    * *Chia tùy chọn (Custom Checkbox):* Chỉ tích chọn những người có tham gia vào hoạt động đó.
    * *Chia theo số tiền cụ thể (Exact Amount):* Nhập trực tiếp số tiền từng người phải trả (Dành cho việc gọi món riêng).

### 🧮 Tính năng 3: Thuật toán tối giản hóa nợ (Debt Simplification)
* **Cơ chế hoạt động:** Khi một nhóm có nhiều người cùng chi tiêu, các khoản nợ chéo sẽ trở nên rất phức tạp (A nợ B, B nợ C, C nợ A).
* **Giải pháp:** Áp dụng thuật toán tối ưu hóa đồ thị luồng (Net Debt). Hệ thống tự động bù trừ nghĩa vụ tài chính của mọi người để đưa ra kết quả cuối cùng: **Ai trả ai, bao nhiêu tiền, với số bước chuyển khoản ít nhất.**

### 📊 Tính năng 4: Bảng tổng kết trực quan (Real-time Balances Dashboard)
* Giao diện Dashboard chia làm 2 khu vực rõ ràng được xử lý mượt mà:
    1.  **Dòng thời gian chi tiêu (Activity Feed):** Hiển thị danh sách các khoản đã chi, ai đã trả, định dạng tiền tệ rõ ràng, có nút sửa/xóa nhanh.
    2.  **Trạng thái số dư (Balances Tab):** Hiển thị danh sách thành viên với các trạng thái trực quan bằng màu sắc:
        * Màu xanh lá (`+...đ`): Người được nhận lại tiền.
        * Màu đỏ (`-...đ`): Người cần phải trả thêm tiền.
* **Chốt sổ (Mark as Settled):** Cho phép bấm xác nhận một người đã trả xong tiền để xóa nợ của người đó ra khỏi bảng tính.

### 📲 Tính năng 5: Trích xuất thông báo & Tích hợp thanh toán nhanh
* **Copy text tổng kết:** Một nút bấm xuất ra đoạn văn bản được định dạng đẹp mắt để paste thẳng vào group chat.
* **Tích hợp VietQR (Xử lý Client-side):** Gắn API tạo mã QR động ngân hàng. Khi người dùng bấm vào dòng nợ, hệ thống sẽ hiển thị một Popover chứa mã QR với số tiền và nội dung chuyển khoản tự động điền.

---

## 3. Định Hướng Kiến Trúc Kỹ Thuật (Tech Stack)

Để ứng dụng đạt được độ mượt mà tối đa, phản hồi realtime và giao diện chuẩn chỉ:

* **Frontend Architecture:** `Next.js` và `React` kết hợp với `TypeScript` (Đảm bảo an toàn kiểu dữ liệu, dễ dàng bảo trì và mở rộng).
* **Styling & UI Components:** `Tailwind CSS` kết hợp hệ sinh thái `shadcn/ui`. Việc này giúp tùy biến giao diện nhanh, giữ phong cách "modern & clean", cung cấp sẵn các primitive components tối ưu.
* **State Management & Data Persistence:**
    * *Giai đoạn 1 (Thuần Client):* Lưu trữ dữ liệu trực tiếp vào `Local Storage` hoặc `Session Storage`.
    * *Giai đoạn 2 (Realtime Collaboration):* Tích hợp Backend-as-a-Service nhẹ nhàng (Supabase/Firebase/MongoDB App Services) để đồng bộ hóa trạng thái tức thì.

---

## 4. Lộ Trình Phát Triển Mở Rộng (Post-MVP Roadmap)

Sau khi kiểm chứng được độ hiệu quả của MVP, các tính năng tiếp theo có thể cân nhắc:
1.  **OCR Scan Bill (Trí tuệ nhân tạo):** Chụp ảnh hóa đơn nhà hàng, hệ thống tự tách các dòng món ăn và giá tiền, người dùng chỉ cần tick chọn ai ăn món nào.
2.  **Đa tiền tệ (Multi-currency):** Hỗ trợ cho các chuyến đi du lịch nước ngoài (Tự động quy đổi tỷ giá realtime).
3.  **Tài khoản Master (Premium Features):** Cho phép người dùng đăng nhập để lưu lại lịch sử chuyến đi, thống kê biểu đồ chi tiêu cá nhân.
