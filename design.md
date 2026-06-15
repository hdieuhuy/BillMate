# Design System & UI Architecture: BillMate

Tài liệu này định nghĩa hệ thống thiết kế (Design System) và các quy tắc xây dựng giao diện (UI Architecture) cho dự án BillMate, đảm bảo tính nhất quán, hiện đại và tối ưu hóa trải nghiệm người dùng (UX).

---

## 1. Công Nghệ Giao Diện (Frontend Stack)

*   **Framework Core:** Next.js (App Router) & React.
*   **Ngôn Ngữ:** TypeScript (Bắt buộc để kiểm soát strict type cho dữ liệu tài chính).
*   **Styling:** Tailwind CSS.
*   **Component Library:** `shadcn/ui` (Sử dụng Radix Primitives để đảm bảo Accessibility và dễ dàng custom UI).
*   **Icons:** Lucide React.

---

## 2. Quy Tắc Bố Cục Không Gian (Layout & Viewport Rules)

Để mang lại trải nghiệm giống một Native App và giữ giao diện luôn "clean", toàn bộ ứng dụng phải tuân thủ nghiêm ngặt quy tắc kiểm soát thanh cuộn:

*   **Strict 100vh:** Layout chính của ứng dụng phải được khóa ở chiều cao `100vh` hoặc `100dvh` (cho mobile) [cite: 2].
*   **No Browser Scrollbar:** Tuyệt đối không để xuất hiện thanh scroll dọc ở cấp độ `<body>` hay `<html>` [cite: 2].
*   **Localized Scrolling:** Đối với các khu vực chứa dữ liệu dài (như danh sách bạn bè, lịch sử chi tiêu, hoặc data tables), phải bọc trong một container có chiều cao cố định hoặc flex `flex-1` và thiết lập `overflow-y-auto` (nên tận dụng component `<ScrollArea>` của shadcn) [cite: 2]. Điều này đảm bảo header, footer và các nút Action (như nút Thêm chi tiêu) luôn cố định và dễ thao tác.

---

## 3. Hệ Thống Màu Sắc (Color Palette)

Sử dụng hệ thống màu Tailwind mặc định kết hợp custom variables trong `globals.css`:

*   **Primary (Màu nhấn chính - Nút bấm, Active states):** `bg-emerald-500` hover `bg-emerald-600`. Thể hiện sự an tâm, minh bạch [cite: 2].
*   **Background (Nền ứng dụng):** `bg-slate-50` hoặc `bg-zinc-50`. Tạo cảm giác thoáng đãng, sạch sẽ [cite: 2].
*   **Surface (Nền của Card, Dialog):** `bg-white` với shadow rất nhẹ (`shadow-sm` hoặc viền `border-slate-100`) [cite: 2].
*   **Text (Chữ):**
    *   Tiêu đề chính (Headings): `text-slate-900` [cite: 2].
    *   Chữ thường (Body): `text-slate-600` [cite: 2].
*   **Trạng thái Tài chính:**
    *   Nhận tiền (Positive): `text-emerald-600` [cite: 2].
    *   Nợ tiền (Destructive/Negative): `text-rose-500` [cite: 2].

---

## 4. Typography (Nghệ Thuật Chữ)

*   **Font Family:** Inter hoặc Roboto (Sans-serif, modern, clean).
*   **Hierarchy:**
    *   `H1` (Tên phòng/Tổng quan): `text-2xl font-bold tracking-tight text-slate-900`.
    *   `H2` (Tiêu đề khối): `text-lg font-semibold`.
    *   `Body`: `text-sm text-slate-600`.
    *   `Số tiền (Amounts)`: Sử dụng `font-medium` hoặc `font-semibold` và định dạng phân cách hàng nghìn rõ ràng (VD: `150,000 ₫`).

---

## 5. Quy Chuẩn Components (Component Guidelines)

### 5.1. Nút bấm (Buttons)
Sử dụng component `<Button>` của shadcn với các biến thể rõ ràng:
*   **Primary Action (Thêm khoản chi, Tạo phòng):** `variant="default"` (Màu Emerald).
*   **Secondary Action (Hủy, Đóng):** `variant="outline"` hoặc `variant="ghost"`.
*   *Lưu ý:* Các nút bấm chính trên mobile nên có kích thước đủ lớn (tối thiểu `h-12`) để dễ chạm.

### 5.2. Nhập liệu (Forms & Inputs)
*   Sử dụng `<Input>` và `<Select>` của shadcn.
*   Bo góc mềm mại: `rounded-md` hoặc `rounded-lg` [cite: 2].
*   Luôn có focus state rõ ràng: `focus:ring-2 focus:ring-emerald-500/20`.

### 5.3. Dialog & Popover (Tương tác không chuyển trang)
Để giữ luồng thao tác liền mạch (SPA mindset) [cite: 2]:
*   **Thêm chi tiêu:** Mở một `<Dialog>` (ở Desktop) hoặc `<Drawer>` (ở Mobile - vuốt từ dưới lên). Không điều hướng sang trang URL mới [cite: 2].
*   **Chia sẻ mã QR/Link:** Sử dụng `<Popover>` hiển thị ngay bên dưới nút bấm.

### 5.4. Data Display (Hiển thị dữ liệu)
*   **Lịch sử chi tiêu (Feed):** Hiển thị dạng danh sách các `<Card>` nhỏ hoặc các dòng có border-bottom mảnh.
*   **Bảng tính nợ (Balances):** Dùng bố cục danh sách, avatar người dùng hình tròn bên trái, thông tin tên ở giữa, số tiền nợ/nhận định dạng màu sắc xanh/đỏ ở bên phải [cite: 2]. Cần fit gọn vào khu vực có cuộn độc lập [cite: 2].

---

## 6. Animation & Tương Tác Cảm Nhận (Micro-interactions)

*   Sử dụng các hiệu ứng chuyển đổi mặc định của Tailwind: `transition-all duration-200 ease-in-out`.
*   Hover states phải mượt mà trên desktop (thay đổi màu nền hoặc bóng đổ).
*   Sử dụng hiệu ứng trượt nhẹ (slide) hoặc mờ dần (fade) khi mở Dialog/Modal để tránh thay đổi khung hình đột ngột.