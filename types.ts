
export type Role = 'ADMIN' | 'TEACHER' | 'PARENT' | 'TASKFORCE' | 'MONITOR';

export interface User {
  id: string;
  name: string;
  role: Role;
  assignedClass?: string; // Dành cho Giáo viên
  studentId?: string; // Dành cho Phụ huynh
}

export interface Student {
  id: string;
  name: string;
  class: string;
  gender: 'Nam' | 'Nữ';
  score: number;
  parentName?: string;
  isArchived?: boolean;
  archivedAt?: string; // Ngày lưu trữ
  archivedReason?: string; // Lý do lưu trữ
}

export type ViolationType = 
  // Sổ đầu bài
  | 'Tiết B' | 'Tiết C' | 'Tiết D' | 'Tiết không đánh giá'
  // Sĩ số
  | 'Không ghi sĩ số' | 'Không chốt sĩ số' | 'Vắng có phép' | 'Vắng không phép' | 'Trốn tiết' | 'Đi học trễ'
  // Tác phong
  | 'Không đồng phục' | 'Tác phong không nghiêm túc'
  // Chuyên cần
  | 'Sinh hoạt 15p không nghiêm túc (HS)' | 'Sinh hoạt 15p không nghiêm túc (Lớp)'
  | 'Tập trung chậm (HS)' | 'Tập trung chậm (Lớp)' | 'Trốn tập trung'
  | 'Không dọn ghế' | 'Vắng lễ/ngoại khóa' | 'Đọc truyện/việc riêng'
  | 'Không đóng cửa/tắt điện' | 'Vắng họp' | 'Chậm trễ họp'
  | 'Gửi xe ngoài trường' | 'Để xe sai vị trí (HS)' | 'Để xe sai vị trí (Lớp)'
  // Trật tự
  | 'Ồn ào (HS)' | 'Mất trật tự (Lớp)' | 'Vào khu vực cấm' | 'Chạy xe trong sân'
  // Vệ sinh
  | 'Ăn quà vặt' | 'Trực nhật chậm' | 'Không trực nhật/đổ rác' | 'Không lao động' | 'Không hoàn thành nhiệm vụ trực tuần'
  | 'Thiếu dụng cụ lớp' | 'Bỏ rác sai quy định' | 'Xả rác nơi tập trung' | 'Không bình hoa/khẩu hiệu'
  // Quy định cấm
  | 'Phá nước uống' | 'Vẽ bậy' | 'Nhuộm tóc/sơn móng/khuyên tai/xăm' | 'Vô lễ GV'
  | 'Ra ngoài trường' | 'Đánh nhau/đe dọa/quay phim' | 'Vi phạm GT'
  | 'Ngồi trên bàn' | 'Ngồi bàn GV/lan can' | 'Rượu bia/thuốc lá' | 'Chất cháy nổ'
  | 'Văn hóa phẩm không phù hợp' | 'Làm hỏng tài sản' | 'Mang tài sản ra ngoài'
  | 'Gian lận thi cử' | 'Nói tục/chửi thề' | 'Sử dụng điện thoại'
  // Khen thưởng
  | 'Nhặt được của rơi' | 'Lớp 100% giờ A' | 'Báo tin có lợi' | 'Duy trì sĩ số tốt'
  | '100% tham gia phong trào' | 'Đạt giải Nhất' | 'Đạt giải Nhì' | 'Đạt giải Ba' | 'Đạt giải KK'
  | 'Viết bài đăng báo/fanpage' | 'Lao động tình nguyện'
  | 'Thi online: 100% tham gia' | 'Thi online: 80-100% tham gia' | 'Thi online: 50-80% tham gia' | 'Thi online: < 50% tham gia'
  // Điểm phát sinh
  | 'Điểm phát sinh';

export interface ViolationRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  type: ViolationType;
  points: number;
  date: string;
  note: string;
  recordedBy: string;
  recordedRole: Role;
  isCollective?: boolean; // Phân biệt lỗi tập thể hay cá nhân
}

export interface MonthlyRemark {
  studentId: string;
  monthYear: string; // Format "MM/YYYY"
  remark: string;
  updatedBy: string;
}

export interface ClassRemark {
  className: string;
  period: string; // "Week X" or "Month Y"
  remark: string;
  updatedBy: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export type AppTab = 'dashboard' | 'students' | 'record' | 'ranking' | 'my-child' | 'monitor-tool';
