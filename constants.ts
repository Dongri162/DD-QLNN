
import { ViolationType, User, Student, ViolationRecord } from './types';

export const INITIAL_SCORE = 200; // Điểm rèn luyện cá nhân đầu học kỳ
export const WEEKLY_BASE_SCORE = 200; // Điểm sàn thi đua Lớp hàng tuần

// MÃ TRUY CẬP MẶC ĐỊNH
export const ADMIN_ACCESS_CODE = '123@';
export const TEACHER_ACCESS_CODE = '123#'; // Fallback
export const PARENT_ACCESS_CODE = '1236';
export const TASKFORCE_ACCESS_CODE = '1234';
export const MONITOR_ACCESS_CODE = '1235';

// Mật khẩu riêng cho từng GVCN (Lớp: Mật khẩu)
export const TEACHER_PASSWORDS: Record<string, string> = {
  '10A1': 'GV10A1',
  '10A2': 'GV10A2',
  '10A3': 'GV10A3',
  '10A4': 'GV10A4',
  '10A5': 'GV10A5',
  '10A6': 'GV10A6',
  '11A1': 'GV11A1',
  '11A2': 'GV11A2',
  '11A3': 'GV11A3',
  '11A4': 'GV11A4',
  '11A5': 'GV11A5',
  '11A6': 'GV11A6',
  '11A7': 'GV11A7',
  '12A1': 'GV12A1',
  '12A2': 'GV12A2',
  '12A3': 'GV12A3',
  '12A4': 'GV12A4',
  '12A5': 'GV12A5',
  '12A6': 'GV12A6',
  '12A7': 'GV12A7',
  '12A8': 'GV12A8',
};

export const VIOLATION_CATEGORIES: Record<ViolationType, number> = {
  // Sổ đầu bài
  'Tiết B': -5,
  'Tiết C': -10,
  'Tiết D': -20,
  'Tiết không đánh giá': -20,
  
  // Sĩ số
  'Không ghi sĩ số': -5,
  'Không chốt sĩ số': -5,
  'Vắng có phép': -2,
  'Vắng không phép': -10,
  'Trốn tiết': -20,
  'Đi học trễ': -5,
  
  // Tác phong
  'Không đồng phục': -10,
  'Tác phong không nghiêm túc': -5,
  
  // Chuyên cần
  'Sinh hoạt 15p không nghiêm túc (HS)': -5,
  'Sinh hoạt 15p không nghiêm túc (Lớp)': -15,
  'Tập trung chậm (HS)': -5,
  'Tập trung chậm (Lớp)': -20,
  'Trốn tập trung': -20,
  'Không dọn ghế': -20,
  'Vắng lễ/ngoại khóa': -15,
  'Đọc truyện/việc riêng': -15,
  'Không đóng cửa/tắt điện': -10,
  'Vắng họp': -10,
  'Chậm trễ họp': -5,
  'Gửi xe ngoài trường': -20,
  'Để xe sai vị trí (HS)': -5,
  'Để xe sai vị trí (Lớp)': -15,
  
  // Trật tự
  'Ồn ào (HS)': -10,
  'Mất trật tự (Lớp)': -20,
  'Vào khu vực cấm': -5,
  'Chạy xe trong sân': -10,
  
  // Vệ sinh
  'Ăn quà vặt': -5,
  'Trực nhật chậm': -10,
  'Không trực nhật/đổ rác': -15,
  'Không lao động': -30,
  'Không hoàn thành nhiệm vụ trực tuần': -20,
  'Thiếu dụng cụ lớp': -5,
  'Bỏ rác sai quy định': -10,
  'Xả rác nơi tập trung': -20,
  'Không bình hoa/khẩu hiệu': -10,
  
  // Quy định cấm
  'Phá nước uống': -10,
  'Vẽ bậy': -20,
  'Nhuộm tóc/sơn móng/khuyên tai/xăm': -20,
  'Vô lễ GV': -50,
  'Ra ngoài trường': -20,
  'Đánh nhau/đe dọa/quay phim': -50,
  'Vi phạm GT': -50,
  'Ngồi trên bàn': -10,
  'Ngồi bàn GV/lan can': -20,
  'Rượu bia/thuốc lá': -50,
  'Chất cháy nổ': -40,
  'Văn hóa phẩm không phù hợp': -20,
  'Làm hỏng tài sản': -30,
  'Mang tài sản ra ngoài': -50,
  'Gian lận thi cử': -50,
  'Nói tục/chửi thề': -20,
  'Sử dụng điện thoại': -20,
  
  // Khen thưởng
  'Nhặt được của rơi': 20,
  'Lớp 100% giờ A': 40,
  'Báo tin có lợi': 10,
  'Duy trì sĩ số tốt': 15,
  '100% tham gia phong trào': 20,
  'Đạt giải Nhất': 30,
  'Đạt giải Nhì': 20,
  'Đạt giải Ba': 10,
  'Đạt giải KK': 5,
  'Viết bài đăng báo/fanpage': 30,
  'Lao động tình nguyện': 15,
  'Thi online: 100% tham gia': 30,
  'Thi online: 80-100% tham gia': 20,
  'Thi online: 50-80% tham gia': 15,
  'Thi online: < 50% tham gia': -20,
  
  'Điểm phát sinh': 0 
};

export const CLASS_FAULT_TYPES: ViolationType[] = [
  'Tiết B', 'Tiết C', 'Tiết D', 'Tiết không đánh giá',
  'Không ghi sĩ số', 'Không chốt sĩ số',
  'Sinh hoạt 15p không nghiêm túc (Lớp)', 'Tập trung chậm (Lớp)', 'Không dọn ghế',
  'Không đóng cửa/tắt điện', 'Để xe sai vị trí (Lớp)', 'Mất trật tự (Lớp)',
  'Trực nhật chậm', 'Không trực nhật/đổ rác', 'Không lao động',
  'Không hoàn thành nhiệm vụ trực tuần', 'Thiếu dụng cụ lớp',
  'Xả rác nơi tập trung', 'Không bình hoa/khẩu hiệu',
  'Thi online: 100% tham gia', 'Thi online: 80-100% tham gia', 'Thi online: 50-80% tham gia', 'Thi online: < 50% tham gia'
];

export const PROHIBITED_TYPES: ViolationType[] = [
  'Vô lễ GV',
  'Đánh nhau/đe dọa/quay phim',
  'Rượu bia/thuốc lá',
  'Chất cháy nổ',
  'Văn hóa phẩm không phù hợp',
  'Phá nước uống',
  'Vẽ bậy',
  'Làm hỏng tài sản',
  'Mang tài sản ra ngoài',
  'Gian lận thi cử'
];

export const VIOLATION_GROUPED: Record<string, ViolationType[]> = {
  'Sổ đầu bài': ['Tiết B', 'Tiết C', 'Tiết D', 'Tiết không đánh giá'],
  'Sĩ số': ['Không ghi sĩ số', 'Không chốt sĩ số', 'Vắng có phép', 'Vắng không phép', 'Trốn tiết', 'Đi học trễ'],
  'Tác phong': ['Không đồng phục', 'Tác phong không nghiêm túc'],
  'Chuyên cần': ['Sinh hoạt 15p không nghiêm túc (HS)', 'Sinh hoạt 15p không nghiêm túc (Lớp)', 'Tập trung chậm (HS)', 'Tập trung chậm (Lớp)', 'Trốn tập trung', 'Không dọn ghế', 'Vắng lễ/ngoại khóa', 'Đọc truyện/việc riêng', 'Không đóng cửa/tắt điện', 'Vắng họp', 'Chậm trễ họp', 'Gửi xe ngoài trường', 'Để xe sai vị trí (HS)', 'Để xe sai vị trí (Lớp)'],
  'Trật tự': ['Ồn ào (HS)', 'Mất trật tự (Lớp)', 'Vào khu vực cấm', 'Chạy xe trong sân'],
  'Vệ sinh': ['Ăn quà vặt', 'Trực nhật chậm', 'Không trực nhật/đổ rác', 'Không lao động', 'Không hoàn thành nhiệm vụ trực tuần', 'Thiếu dụng cụ lớp', 'Bỏ rác sai quy định', 'Xả rác nơi tập trung', 'Không bình hoa/khẩu hiệu'],
  'Quy định cấm': ['Phá nước uống', 'Vẽ bậy', 'Nhuộm tóc/sơn móng/khuyên tai/xăm', 'Vô lễ GV', 'Ra ngoài trường', 'Đánh nhau/đe dọa/quay phim', 'Vi phạm GT', 'Ngồi trên bàn', 'Ngồi bàn GV/lan can', 'Rượu bia/thuốc lá', 'Chất cháy nổ', 'Văn hóa phẩm không phù hợp', 'Làm hỏng tài sản', 'Mang tài sản ra ngoài', 'Gian lận thi cử', 'Nói tục/chửi thề', 'Sử dụng điện thoại'],
  'Khen thưởng': ['Nhặt được của rơi', 'Lớp 100% giờ A', 'Báo tin có lợi', 'Duy trì sĩ số tốt', '100% tham gia phong trào', 'Đạt giải Nhất', 'Đạt giải Nhì', 'Đạt giải Ba', 'Đạt giải KK', 'Viết bài đăng báo/fanpage', 'Lao động tình nguyện', 'Thi online: 100% tham gia', 'Thi online: 80-100% tham gia', 'Thi online: 50-80% tham gia', 'Thi online: < 50% tham gia']
};

// Tiêu chí mẫu cho Điểm phát sinh & Điểm cộng thi đua (Dành cho Admin/GV)
export const AUTO_POINT_CRITERIA = [
  // Điểm cộng học tập & Phong trào
  { label: 'Lớp đạt 100% giờ A', points: 40, description: 'Tập thể lớp đạt 100% tiết học xếp loại A trong tuần' },
  { label: 'Duy trì sĩ số tốt', points: 15, description: '100% học sinh không vắng học, trễ học, trốn học trong tuần' },
  { label: '100% tham gia phong trào', points: 20, description: '100% học sinh tham gia các hoạt động phong trào' },
  { label: 'Phong trào: Giải Nhất', points: 30, description: 'Đạt giải Nhất trong hội thi cấp trường' },
  { label: 'Phong trào: Giải Nhì', points: 20, description: 'Đạt giải Nhì trong hội thi cấp trường' },
  { label: 'Phong trào: Giải Ba', points: 15, description: 'Đạt giải Ba trong hội thi cấp trường' },
  { label: 'Phong trào: Giải Khuyến khích', points: 10, description: 'Đạt giải Khuyến khích trong hội thi cấp trường' },
  
  // Điểm cộng cá nhân đóng góp cho tập thể
  { label: 'Nhặt được của rơi', points: 20, description: 'Gương người tốt việc tốt: Nhặt được của rơi trả lại người mất' },
  { label: 'Báo tin có lợi', points: 10, description: 'Có công báo lại thông tin có lợi để ngăn chặn hành vi xấu' },
  { label: 'Lao động tình nguyện', points: 15, description: 'Tập thể lớp đăng ký lao động tình nguyện' },
  { label: 'Viết bài đăng báo/fanpage', points: 30, description: 'Học sinh viết bài, sáng tác được đăng tải trên các phương tiện truyền thông' },
  { label: 'Thi online: 100% tham gia', points: 30, description: 'Lớp có 100% học sinh tham gia các cuộc thi online' },
  { label: 'Thi online: 80-100% tham gia', points: 20, description: 'Lớp có 80% đến dưới 100% học sinh tham gia' },
  { label: 'Thi online: 50-80% tham gia', points: 15, description: 'Lớp có 50% đến dưới 80% học sinh tham gia' },
  { label: 'Thi online: < 50% tham gia', points: -20, description: 'Lớp có dưới 50% học sinh tham gia các cuộc thi online' },

  // Điểm trừ tập thể
  { label: 'Không hoàn thành trực tuần', points: -20, description: 'Lớp không hoàn thành nhiệm vụ trực tuần được giao' },
  { label: 'Không lao động nghiêm túc', points: -30, description: 'Lớp không tham gia lao động hoặc làm không nghiêm túc' },
];

export const MOCK_USERS: User[] = [
  { id: 'U001', name: 'Admin Hệ Thống', role: 'ADMIN' },
  { id: 'U002', name: 'Thầy Nguyễn Văn Thành', role: 'TEACHER', assignedClass: '10A1' },
  { id: 'U003', name: 'Đội TNXK - Nguyễn Văn B', role: 'TASKFORCE' },
  { id: 'U004', name: 'Phụ huynh Hùng Anh', role: 'PARENT', studentId: 'S10A1-01' },
  { id: 'U005', name: 'CSL Lớp 10A1 - Minh Thư', role: 'MONITOR', assignedClass: '10A1' },
];

// --- DATA GENERATION LOGIC ---

const CLASSES = [
  '10A1', '10A2', '10A3', '10A4', '10A5', '10A6',
  '11A1', '11A2', '11A3', '11A4', '11A5', '11A6', '11A7',
  '12A1', '12A2', '12A3', '12A4', '12A5', '12A6', '12A7', '12A8'
];

const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Huỳnh', 'Hoàng', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const MIDDLE_NAMES = ['Văn', 'Thị', 'Đức', 'Ngọc', 'Hữu', 'Phương', 'Thanh', 'Minh', 'Gia', 'Tuấn', 'Hoàng', 'Quốc', 'Bảo', 'Khánh'];
const FIRST_NAMES = ['Anh', 'Bảo', 'Châu', 'Dũng', 'Em', 'Giang', 'Hân', 'Hùng', 'Huy', 'Khánh', 'Lan', 'Long', 'Minh', 'Nam', 'Nhi', 'Oanh', 'Phúc', 'Quân', 'Quỳnh', 'Sơn', 'Tâm', 'Thảo', 'Trang', 'Tú', 'Uyên', 'Vy', 'Yến'];

// Cập nhật các nhóm lỗi để sinh dữ liệu mẫu thực tế hơn
const VIOLATION_TYPES_COMMON: ViolationType[] = [
  'Đi học trễ', 'Không đồng phục', 'Tác phong không nghiêm túc', 
  'Ăn quà vặt', 'Nói tục/chửi thề', 'Sử dụng điện thoại'
];

const VIOLATION_TYPES_ACADEMIC: ViolationType[] = [
    'Đọc truyện/việc riêng', 'Gian lận thi cử', 'Sử dụng điện thoại'
];

const VIOLATION_TYPES_DISCIPLINE: ViolationType[] = [
    'Ồn ào (HS)', 'Vào khu vực cấm', 'Chạy xe trong sân', 'Ngồi trên bàn'
];

const VIOLATION_TYPES_SERIOUS: ViolationType[] = [
    'Vô lễ GV', 'Đánh nhau/đe dọa/quay phim', 'Vi phạm GT', 'Rượu bia/thuốc lá', 'Làm hỏng tài sản'
];

const GOOD_DEEDS: ViolationType[] = [
  'Nhặt được của rơi', 'Báo tin có lợi', 'Duy trì sĩ số tốt', 
  'Đạt giải Nhất', 'Đạt giải Nhì', 'Đạt giải Ba', 'Đạt giải KK',
  'Viết bài đăng báo/fanpage', 'Lao động tình nguyện'
];

// Hàm sinh số ngẫu nhiên
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];

// 1. Generate Students
const generateStudents = (): Student[] => {
  const students: Student[] = [];
  
  const REAL_DATA_10A1 = [
    'Nguyễn Hùng Anh', 'Lê Quang Đại', 'Nguyễn Thành Duy', 'Trần Thanh Hậu', 'Nguyễn Trần Gia Huy', 
    'Huỳnh Gia Huy', 'Trần Gia Huy', 'Nguyễn Hoàng', 'Ngô Thanh Khôi', 'Giả Trung Kiên', 
    'Đào Tuấn Kiệt', 'Ngô Lê Cẩm Ly', 'Nguyễn Đức Mạnh', 'Nguyễn Ngọc Trà My', 'Võ Lê Hoàng Nam', 
    'Bùi Chí Nghĩa', 'Trần Nguyễn Nhất Nguyên', 'Lê Hà Ngọc Nhi', 'Nguyễn Ngọc Hoàng Nhung', 
    'Đoàn Nhật Ny', 'Trần Gia Pháp', 'Trần Hoàng Phát', 'Nguyễn Thị Mỹ Phúc', 'Phạm Ngọc Phước', 
    'Cái Kiều Quyên', 'Nguyễn Ngọc Như Quỳnh', 'Phạm Nguyễn Như Quỳnh', 'Trương Thị Thanh Tâm', 
    'Huỳnh Nguyễn Ngọc Thảo', 'Trần Minh Thiên', 'Nguyễn Trần Thành Thiện', 'Lê Minh Thịnh', 
    'Nguyễn Hoàng Lệ Thu', 'Văn Võ Anh Thư', 'Nguyễn Thanh Thúy', 'Đinh Trần Bảo Thy', 
    'Nguyễn Triều Tiên', 'Võ Thanh Trà', 'Nguyễn Bảo Trâm', 'Đào Nguyễn Ngọc Trâm', 
    'Võ Ngọc Bảo Trân', 'Nguyễn Minh Triết', 'Nguyễn Tấn Trường', 'Võ Ngọc Vinh', 
    'Võ Đoàn Tường Vy', 'Lê Quỳnh Ý'
  ];

  const REAL_DATA_10A2 = [
    'Phan Châu Gia Bảo', 'Nguyễn Ngô Quốc Đảng', 'Nguyễn Khắc Danh', 'Lê Thị Trường Giang', 
    'Thái Thu Hằng', 'Nguyễn Hiếu Hiền', 'Lê Quang Hoài', 'Trần Gia Hưng', 'Trần Gia Huy', 
    'Phạm Nhật Huy', 'Mai Hoàng Kha', 'Phan Nguyễn Thanh Lâm', 'Huỳnh Phạm Mỹ Lệ', 
    'Nguyễn Trần Gia Linh', 'Nguyễn Trần Ly Ly', 'Đào Nguyễn Trúc Ly', 'Nguyễn Thị Kiều Mi', 
    'Trần Thị Trà My', 'Nguyễn Phương Nam', 'Lê Phương Nam', 'Nguyễn Ngọc Kim Ngân', 
    'Dương Gia Nghĩa', 'Nguyễn Hoàng Nguyên', 'Huỳnh Uy Trang Nhã', 'Nguyễn Phạm Đình Nhân', 
    'Đinh Thị Thúy Nhi', 'Nguyễn Trịnh Bảo Nhi', 'Đặng Minh Phú', 'Từ Hoàng Phương', 
    'Trần Nguyễn Mạnh Quân', 'Giả Thị Ý Quyên', 'Trần Thị Lệ Quyên', 'Đặng Như Quỳnh', 
    'Nguyễn Thị Quỳnh Quỳnh', 'Bùi Thị Ngọc Thảo', 'Nguyễn Chí Thiện', 'Võ Thanh Diệu Thu', 
    'Nguyễn Thị Thủy Tiên', 'Trần Nhật Tiên', 'Lê Quang Tín', 'Trần Ngọc Bảo Trâm', 
    'Mai Ngọc Quế Trâm', 'Hồ Ngọc Anh Trí', 'Nguyễn Tấn Trình', 'Lê Trần Quốc Uy', 
    'Đặng Cao Xuân Tiến'
  ];

  const REAL_DATA_10A3 = [
    'Nguyễn Ngọc Gia Bảo', 'Nguyễn Ngọc Bảo Châu', 'Bùi Phương Danh', 'Trần Nguyên Đạt', 
    'Lê Quốc Định', 'Lê Trần Thùy Dung', 'Lê Quang Dũng', 'Võ Hương Giang', 'Hồ Thu Hà', 
    'Phạm Ngọc Đoan Hân', 'Nguyễn Trần Ngọc Hân', 'Trần Công Hậu', 'Phạm Nguyễn Duy Khang', 
    'Nguyễn Tấn Khanh', 'Đặng Thị Thu Kiều', 'Nguyễn Đinh Thảo Linh', 'Trần Huỳnh Thảo Ly', 
    'Nguyễn Thị Thanh My', 'Châu Võ Trà My', 'Trần Quốc Nam', 'Nguyễn Hồng Ngân', 
    'Nguyễn Hữu Nghĩa', 'Huỳnh Kim Ngọc', 'Nguyễn Thanh Nhàn', 'Nguyễn Trọng Nhân', 
    'Trương Lê Hữu Nhật', 'Đỗ Thị Hồng Nhi', 'Lê Anh Hồng Nhung', 'Trần Nguyễn Trung Quân', 
    'Tô Hữu Quân', 'Võ Nguyễn Tường Quy', 'Nguyễn Thị Thúy Sang', 'Trần Ngọc Sửu', 
    'Trương Hoàng Thiên', 'Trần Thanh Thịnh', 'Nguyễn Phúc Thịnh', 'Lê Nhất Thoại', 
    'Nguyễn Thị Kiều Thư', 'Nguyễn Trung Tín', 'Lương Thị Như Tình', 'Nguyễn Thanh Trâm', 
    'Đoàn Đặng Bảo Trân', 'Trần Thị Thảo Trang', 'Man Đức Trí', 'Nguyễn Vương Triệu', 
    'Huỳnh Nguyễn Công Vinh', 'Nguyễn Hoàng Thảo Vy'
  ];

  const REAL_DATA_10A4 = [
    'Đỗ Thành Công', 'Nguyễn Nam Cường', 'Phan Quang Duy', 'Châu Tiền Giang', 'Châu Hậu Giang', 
    'Nguyễn Ngọc Bảo Hân', 'Nguyễn Văn Diễm Hằng', 'Hồ Văn Hậu', 'Nguyễn Thanh Hiệp', 
    'Lý Tấn Huy', 'Quảng Thị Mỹ Huyền', 'Nguyễn Lê Gia Khang', 'Trần Lâm Tấn Khang', 
    'Huỳnh Kim Khôi', 'Nguyễn Trung Kiên', 'Võ Thị Thúy Kiều', 'Võ Thùy Linh', 
    'Trần Duy Lợi', 'Võ Thị Mỹ Luyến', 'Phạm Nữ Kiều My', 'Cao Huỳnh Thảo My', 
    'Võ Đặng Thành Nhân', 'Phạm Quỳnh Như', 'Huỳnh Quỳnh Như', 'Nguyễn Hồng Nhung', 
    'Huỳnh Trúc Ny', 'Phan Hoàng Anh Quân', 'Nguyễn Thị Ngọc Quyên', 'Phan Nguyễn Hoài Sinh', 
    'Nguyễn Kim Sơn', 'Nguyễn Trọng Tấn', 'Nguyễn Huy Thái', 'Nguyễn Quốc Thắng', 
    'Nguyễn Huỳnh Thanh Thanh', 'Trần Nhật Thi', 'Nguyễn Ân Thiên', 'Nguyễn Quốc Thịnh', 
    'Lê Đức Tín', 'Lê Cẩm Trà', 'Nguyễn Ngọc Huyền Trân', 'Vũ Minh Triết', 
    'Nguyễn Phạm Thanh Trúc', 'Huỳnh Thiên Tuấn', 'Hồ Quốc Việt', 'Phạm Nguyễn Kiều Vy', 
    'Đinh Nguyễn Yến Vy', 'Nguyễn Bùi Y Y'
  ];

  const REAL_DATA_10A5 = [
    'Lê Băng Châu', 'Nguyễn Thị Ánh Chi', 'Nguyễn Tiến Đạt', 'Đào Công Định', 'Nguyễn Minh Đoàn', 
    'Võ Trung Dũng', 'Lê Công Duy', 'Lê Thùy Duyên', 'Trần Nguyễn Gia Hân', 'Nguyễn Thị Kiều Hiệp', 
    'Lê Nguyên Hoàng', 'Nguyễn Thành Hữu', 'Lê Huy', 'Nguyễn Dương Khang', 'Lương Quốc Khánh', 
    'Đinh Bảo Khuyên', 'Lê Trung Kiên', 'Nguyễn Thị Mỹ Linh', 'Phan Thị Diễm My', 'Nguyễn Lệ Mỹ', 
    'Võ Thị Ngà', 'Đỗ Thị Kim Ngân', 'Lê Hữu Nhật', 'Phạm Quỳnh Như', 'Nguyễn Trần Phong', 
    'Huỳnh Đồng Diễm Phúc', 'Nguyễn Trần Quốc Quân', 'Huỳnh Lệ Quyên', 'Võ Như Quỳnh', 
    'Nguyễn Trần Sơn', 'Đặng Long Thắng', 'Đặng Thanh Thảo', 'Nguyễn Đào Ngọc Thiện', 
    'Huỳnh Văn Phùng Thịnh', 'Bùi Nguyễn Hưng Thịnh', 'Huỳnh Lưu Anh Thư', 'Nguyễn Thị Mỹ Thuận', 
    'Dương Ngọc Bảo Thy', 'Trần Đào Mỹ Tiên', 'Võ Hoàng Trí', 'Phạm Gia Triệu', 'Lương Ngọc Bảo Trúc', 
    'Huỳnh Ngọc Khánh Uyên', 'Trần Thanh Thảo Vi', 'Nguyễn Trường Vinh', 'Nguyễn Huy Vũ', 
    'Lê Thị Phương Vy'
  ];

  const REAL_DATA_10A6 = [
    'Bùi Kim Anh', 'Nguyễn Hoàng Gia Bảo', 'Trần Thị Ngọc Chi', 'Nguyễn Ngọc Chiến', 
    'Đoàn Khánh Duy', 'Nguyễn Minh Hằng', 'Nguyễn Lê Huy Hoàng', 'Nguyễn Bảo Hưng', 
    'Phan Thị Thanh Hương', 'Đoàn Nguyễn Nhật Huy', 'Nguyễn Lê Quốc Huy', 'Phạm Trần Gia Huy', 
    'Nguyễn Ngọc Huy', 'Trần Đặng Gia Huy', 'Đỗ Vũ Kha', 'Nguyễn Phạm Tuấn Khang', 
    'Nguyễn Thành Khang', 'Lê Anh Khoa', 'Võ Đăng Khôi', 'Nguyễn Thị Mỹ Lệ', 'Đỗ Ngọc Mẫn', 
    'Thái Thị Kiều Mến', 'Lê Quang Minh', 'Ngô Mỹ Mỹ', 'Huỳnh Thị Chi Na', 'Trần Mai Ngân', 
    'Nguyễn Thị Ái Ngân', 'Đào Thị Thanh Ngọc', 'Huỳnh Bảo Ngọc', 'Nguyễn Thị Bích Ngọc', 
    'Trần Thị Phương Nguyệt', 'Nguyễn Dương Yến Nhi', 'Phạm Nguyễn Trọng Pháp', 'Lê Hồng Phát', 
    'Võ Ngọc Như Quỳnh', 'Trần Vũ Như Quỳnh', 'Lương Phạm Ngọc Sang', 'Lê Cẩm Thạch', 
    'Lưu Minh Thắm', 'Hà Hoàng Thành', 'Nguyễn Thị Minh Thư', 'Nguyễn Quang Thuận', 
    'Nguyễn Minh Thuận', 'Dương Ngọc Toàn', 'Trần Thị Ngọc Trâm', 'Đỗ Huyền Trân', 
    'Nguyễn Minh Trí', 'Nguyễn Thị Thanh Trúc'
  ];

  const REAL_DATA_11A1 = [
    'Lê Tuấn Anh', 'Nguyễn Quốc Chí', 'Mai Phương Hồng Chiến', 'Dương Tấn Đạt', 'Nguyễn Bá Dũ', 
    'Nguyễn Minh Đức', 'Đỗ Phương Dung', 'Trần Thị Thùy Duyên', 'Võ Tuyết Hà', 'Nguyễn Phạm Gia Huy', 
    'Dương Khánh Huyền', 'Trạch Bạch Khánh Huyền', 'Phạm Quốc Kha', 'Đinh Võ Nguyên Khang', 
    'Đặng Đinh Thành Khoa', 'Nguyễn Đăng Khôi', 'Đỗ Minh Lai', 'Nguyễn Ngọc Kiều Lam', 
    'Nguyễn Hùng Lân', 'Lâm Nhật Lệ', 'Nguyễn Phan Tường Long', 'Võ Đông Luân', 'Mai Ngô Trúc My', 
    'Đào Đặng Thúy Ngân', 'Nguyễn Vĩnh Nghi', 'Lâm Hiếu Nghĩa', 'Nguyễn Khương Nguyên', 
    'Trần Huỳnh Thiện Nhân', 'Nguyễn Thanh Nhất', 'Lê Tấn Phát', 'Lê Phương Thảo', 
    'Nguyễn Ngọc Thiện', 'Trần Phúc Thịnh', 'Nguyễn Kim Thư', 'Huỳnh Ngọc Bảo Thy', 
    'Nguyễn Ngô Minh Tiến', 'Trần Dương Huyền Trân', 'Võ Ngọc Trân', 'Nguyễn Thị Thanh Trúc', 
    'Ngô Trần Mai Tú', 'Lê Thị Cẩm Vy', 'Nguyễn Thị Như Ý'
  ];

  const REAL_DATA_11A2 = [
    'Trần Luyến Ái', 'Nguyễn Ngụy Bảo Ân', 'Trần Ngọc Châu', 'Dương Minh Chi', 'Lê Huỳnh Đức', 
    'Nguyễn Hồng Duyên', 'Đặng Thị Ngọc Hân', 'Nguyễn Quốc Hiệu', 'Trần Thị Quỳnh Hương', 
    'Võ Ngọc Kha', 'Phạm Nguyên Khang', 'Trần Phạm Duy Khôi', 'Huỳnh Công Tôn Kiên', 
    'Nguyễn Minh Kiều', 'Nguyễn Thị Mỹ Lệ', 'Trần Thảo Ly', 'Trần Mai Ái My', 
    'Nguyễn Thị Hồng Ngọc', 'Đặng Phương Nguyên', 'Nguyễn Hoàng Gia Nhi', 'Nguyễn Thị Yến Nhi', 
    'Võ An Nhiên', 'Nguyễn Kiều Oanh', 'Nguyễn Anh Quân', 'Lê Quang Sơn', 'Giả Huy Thắng', 
    'Trần Thị Cẩm Thu', 'Lê Duy Tiến', 'Nguyễn Lê Hoàng Long Tín', 'Huỳnh Bảo Trâm', 
    'Nguyễn Hoàng Bảo Trân', 'Nguyễn Thị Thùy Trang', 'Nguyễn Lê Ngọc Trinh', 'Hồ Kim Tuyền', 
    'Nguyễn Ánh Tuyết', 'Nguyễn Quốc Việt', 'Ngụy Đình Vỹ', 'Hồ Như Ý', 'Lê Thảo Vy', 
    'Trần Đồng Thuận'
  ];

  const REAL_DATA_11A3 = [
    'Huỳnh Ngọc Ái', 'Lê Hà Lan Anh', 'Giả Thanh Bảo', 'Nguyễn Thanh Bình', 'Nguyễn Thị Quỳnh Chi', 
    'Trần Minh Chiến', 'Nguyễn Huy Cường', 'Nguyễn Trần Nhật Đức', 'Lê Ngọc Duy', 'Đào Thị Cẩm Duyên', 
    'Trần Gia Hân', 'Phạm Gia Hiên', 'Trần Thị Thu Hiền', 'Nguyễn Thị Ánh', 'Nguyễn Thị Hàm Hương', 
    'Nguyễn Trọng Khoan', 'Lê Nguyễn Tuấn Kiên', 'Phạm Thi Mỹ Lại', 'Châu Xuân Mai', 
    'Nguyễn Bảo Nam', 'Phạm Thúy Ngân', 'Nguyễn Thị Hồng Ngọc', 'Lê Bích Ngọc', 
    'Mai Thị Phương Nhã', 'Huỳnh Nguyễn Yến Nhi', 'Nguyễn Thị Thanh Nhị', 'Nguyễn Hồng Nhung', 
    'Võ Kim Oanh', 'Nguyễn Thành Phúc', 'Nguyễn Nhất Quân', 'Hồ Nguyễn Tường Quyên', 
    'Huỳnh Nguyễn Mai Quỳnh', 'Nguyễn Tuyết Sương', 'Bùi Võ Duy Tâm', 'Phạm Hồng Thắng', 
    'Nguyễn Minh Thắng', 'Nguyễn Thi Minh', 'Nguyễn Hữu Toàn', 'Nguyễn Thùy Trang', 
    'Nguyễn Quốc Trung', 'Nguyễn Huỳnh Xuân Uyên'
  ];

  const REAL_DATA_11A4 = [
    'Đặng Ngọc Bích', 'Nguyễn Thị Yến Chi', 'Nguyễn Trần Chương', 'Trần Bảo Đoan', 'Nguyễn Thúy Hoan', 
    'Võ Ngọc Hưng', 'Võ Lê Hoài Hương', 'Huỳnh Nhật Huy', 'Nguyễn Võ Thiện Khôi', 'Trần Nhật Hoa Linh', 
    'Nguyễn Thành Lực', 'Trần Hoàng Thiên Lý', 'Trần Duy Mạnh', 'Quảng Thị Kiều My', 'Phạm Ngọc Nam', 
    'Đặng Thành Nam', 'Phan Bảo Nam', 'Trần Thanh Nhàn', 'Nguyễn Thành Nhân', 'Nguyễn Phương Quỳnh Như', 
    'Phạm Võ Tường', 'Đặng Tố Nữ', 'Lê Hoàng Pho', 'Nguyễn Thanh Phước', 'Võ Thành Quà', 
    'Nguyễn Anh Quốc', 'Nguyễn Thị Như Quỳnh', 'Đặng Đức Tài', 'Đào Thị Phương Thảo', 'Lê Phương Thảo', 
    'Ngụy Hoàng Bảo Thi', 'Tô Thị Hoài Thu', 'Hồ Thị Minh Thư', 'Vũ Thị Thủy Tiên', 'Nguyễn Dương Thủy Tiên', 
    'Trịnh Trần Phong Tiến', 'Lê Hải Tinh', 'Trần Lê Bảo Trọng'
  ];

  const REAL_DATA_11A5 = [
    'Nguyễn Ngọc Chấn', 'Lê Quốc Cường', 'Phạm Thùy Dương', 'Trần Minh Dương', 'Nguyễn Lê Duy', 
    'Huỳnh Trần Linh Giang', 'Vòng Hoàng Hải', 'Nguyễn Hà Như Hiền', 'Lê Bảo Hiếu', 'Đặng Minh Hoàng', 
    'Nguyễn Ngọc Kha', 'Nguyễn Hồ Đức Kha', 'Nguyễn Thanh Thúy Liễu', 'Lê Bảo Luân', 'Lê Nguyễn Thanh Mai', 
    'Nguyễn Thái Trà My', 'Nguyễn Trần Trúc My', 'Lê Anh Nam', 'Tào Nguyễn Duy Ánh Nguyệt', 'Hồ Trọng Nhân', 
    'Hồ Phan Yến Nhi', 'Nguyễn Thị Trúc Nhi', 'Phạm Lê Yến Nhi', 'Nguyễn Phan Thùy Nhiên', 'Đào Thị Thanh Như', 
    'Nguyễn Tâm Như', 'Phan Châu Hồng Nhung', 'Trần Lê Anh Phát', 'Phạm Hoàng Phú', 'Tạ Thị Diễm Phúc', 
    'Đặng Trần Gia Phúc', 'Nguyễn Văn Quân', 'Nguyễn Thị Diễm Quỳnh', 'Đinh Thái Sơn', 'Trần Minh Tài', 
    'Ngô Thanh Tài', 'Nguyễn Minh Tâm', 'Lê Quốc Thắng', 'Nguyễn Cao Thắng', 'Võ Ngọc Thiện', 
    'Nguyễn Thị Anh Thư', 'Nguyễn Thị Anh Thư', 'Nguyễn Phúc Anh Thư', 'Lê Thị Minh Thúy', 
    'Đặng Nguyễn Phương Thùy', 'Nguyễn Quốc Toàn', 'Phan Bảo Trân', 'Nguyễn Thanh Trúc', 
    'Nguyễn Cát Tường', 'Nguyễn Thị Yến Vy', 'Nguyễn Thị Thanh Yến', 'Trần Hoàng Ân'
  ];

  const REAL_DATA_11A6 = [
    'Phạm Ngọc Trang Đài', 'Huỳnh Thị Ngọc', 'Nguyễn Hữu Duy', 'Cao Ngọc Bảo Hân', 
    'Diệp Lê Hồng Diễm Bích Hạnh', 'Nguyễn Trung Hiếu', 'Nguyễn Mai Thân Hoài', 'Huỳnh Việt Hưng', 
    'Phạm Mỹ Quỳnh Hương', 'Nguyễn Lâm Chấn Kha', 'Nguyễn Hoàng Khang', 'Võ Bảo Khanh', 
    'Trần Nguyễn Khánh', 'Nguyễn Trần Đăng Khoa', 'Nguyễn Mai Kiều Linh', 'Hồ Lê Hoàng Long', 
    'Nguyễn Thế Hoàng Ly', 'Nguyễn Thành Nam', 'Phan Ngọc Phương Nghi', 'Nguyễn Thị Hoàng Nhật', 
    'Nguyễn Hoàng Long Nhật', 'Trần Ngọc Yến Nhi', 'Võ Hoàng Thúy Nhiên', 'Quảng Văn Pháp', 
    'Nguyễn Hoàng Phi', 'Nguyễn Gia Phúc', 'Lê Nguyễn Thiên Phúc', 'Dương Hồ Nhã Phương', 
    'Nguyễn Phan Lê Như Quỳnh', 'Nguyễn Hoàng Sinh', 'Trịnh Công Sơn', 'Nguyễn Nữ Thanh Thảo', 
    'Trần Võ Thanh Thư', 'Nguyễn Nữ Anh Thư', 'Nguyễn Thị Anh Thư', 'Cao Phước Thuận', 
    'Huỳnh Thị Thu Thủy', 'Nguyễn Thị Thanh Thuyền', 'Nguyễn Thị Thanh Trà', 'Nguyễn Thùy Trâm', 
    'Nguyễn Trần Thu Trang', 'Thái Thanh Triệu', 'Nguyễn Thị Kiều Trinh', 'Lý Thanh Trúc', 
    'Nguyễn Xuân', 'Ngô Thanh Vân', 'Nguyễn Tuấn Vũ', 'Nguyễn Ái Vy', 'Phạm Hoàng Bảo Yến'
  ];

  const REAL_DATA_11A7 = [
    'Đặng Quỳnh Anh', 'Nguyễn Duy Bảo', 'Trần Đồng Bích Dâng', 'Đào Anh Đạt', 'Phạm Thị Kiều Diễm', 
    'Nguyễn Lê Duy', 'Trần Ái Hoa', 'Ngụy Gia Huy', 'Trần Văn Kha', 'Bùi Minh Khải', 'Nguyễn Ngọc Khánh', 
    'Lê Công Lĩnh', 'Phạm Nguyễn Thành Lợi', 'Nguyễn Hồng Luyến', 'Quảng Phan Thảo Ly', 'Trần Nguyễn Thanh Minh', 
    'Huỳnh Trúc My', 'Nguyễn Minh Nhật', 'Nguyễn Thị Phương Nhi', 'Nguyễn Hồng Phúc', 'Lê Hữu Phúc', 
    'Nguyễn Hà Khánh Phương', 'Võ Hoàng Anh Quân', 'Nguyễn Thúy Quyên', 'Võ Thị Diễm Quỳnh', 'Nguyễn Trọng Sơn', 
    'Trần Nguyễn Minh Tâm', 'Nguyễn Thị Hồng Thắm', 'Ngụy Lê Hiệp Thành', 'Phan Nguyễn Anh Thư', 
    'Phan Thị Anh Thư', 'Phạm Hồ Minh Thư', 'Phan Thị Bích Thuận', 'Huỳnh Thị Thu Thủy', 'Bùi Thị Cẩm Tiên', 
    'Nguyễn Thanh Trà', 'Phạm Bảo Trâm', 'Phạm Thùy Trâm', 'Võ Nguyễn Hùynh Trân', 'Võ Nguyễn Hoàng Trang', 
    'Đoàn Ngọc Thanh Gia Trang', 'Trần Thị Thanh Trúc', 'Nguyễn Ngọc Trường', 'Nguyễn Thành Ty', 
    'Phan Đại Việt', 'Phan Minh Vinh', 'Đinh Quốc Vương', 'Nguyễn Hà Vy', 'Nguyền Huyền Vy', 'Phạm Thị Mỹ Ý'
  ];
  const REAL_DATA_12A1 = [
    'Nguyễn Đào Phương Dung', 'Nguyễn Kiều Duyên', 'Nguyễn Vũ Hải', 'Hồ Thanh Hằng', 
    'Lê Phương Hằng', 'Nguyễn Cẩm Hằng', 'Đinh Nguyễn Bích Hậu', 'Phạm Quỳnh Thu Hưởng', 
    'Nguyễn Đặng Quốc Huy', 'Trần Quốc Huy', 'Đinh Bảo Kha', 'Nguyễn Duy Kha', 
    'Nguyễn Minh Kha', 'Phạm Phương Hoàng Kha', 'Trần Minh Khang', 'Đặng Thùy Linh', 
    'Quảng Thị Trúc Ly', 'Nguyễn Trà My', 'Đào Lê Bảo Ngân', 'Phạm Kiều Ngân', 
    'Lưu Thanh Nghĩa', 'Trần Phúc Ngọc', 'Lâm Thu Nhã', 'Đào Nguyễn Quỳnh Như', 
    'Phạm Lê Như Quỳnh', 'Phạm Thị Mỹ Quỳnh', 'Phan Lê Như Quỳnh', 'Nguyễn Quốc Thiện', 
    'Lê Minh Thư', 'Nguyễn Hoàng Anh Thư', 'Nguyễn Hoàng Việt Tiến', 'Nguyễn Trung Tín', 
    'Đỗ Ngọc Tính', 'Giả Huy Toàn', 'Nguyễn Hiền Trâm', 'Nguyễn Quỳnh Trâm', 'Đào Bảo Trân', 
    'Nguyễn Võ Ngọc Trân', 'Nguyễn Minh Trí', 'Nguyễn Đình Trường', 'Trần Đặng Nhật Trường', 
    'Lý Thanh Tuyền', 'Nguyễn Bảo Uyên', 'Nguyễn Thế Vũ', 'Trần Đức Vũ', 'Nguyễn Lê Bảo Vy'
  ];

  const REAL_DATA_12A2 = [
    'Phan Hoàng Bách', 'Nguyễn Thành Bảo', 'Đỗ Ngọc Chi', 'Lê Trần Hoàng Duy', 'Huỳnh Anh Đạt', 
    'Nguyễn Thị Thu Hằng', 'Trần Gia Huy', 'Nguyễn Trúc Khánh', 'Lê Gia Kiệt', 
    'Võ Huỳnh Ngọc Linh', 'Trần Hùng Lĩnh', 'Ngô Lê Cẩm Lụa', 'Huỳnh Duy Luận', 
    'Nguyễn Thị Khánh Ly', 'Võ Kiều My', 'Nguyễn Hoàng Nam', 'Nguyễn Phương Nam', 
    'Phạm Võ Thúy Ngân', 'Nguyễn Lâm Nhân', 'Nguyễn Thị Yến Nhi', 'Đoàn Tiểu Ny', 
    'Đinh Tấn Phát', 'Nguyễn Trần Duy Phong', 'Đỗ Ngọc Quận', 'Hồ Anh Quốc', 'Võ Anh Thư', 
    'Đoàn Như Thức', 'Võ Kim Tiền', 'Mai Lê Minh Tiến', 'Phan Hữu Tình', 'Trần Phan Chí Tình', 
    'Ngô Bảo Trâm', 'Huỳnh Thị Uyên Trân', 'Nguyễn Trịnh Minh Trí', 'Võ Thanh Trúc', 
    'Tô Cẩm Tú', 'Nguyễn Ái Vi', 'Ngô Quốc Việt', 'Đỗ Ngọc Vũ', 'Nguyễn Đoàn Tường Vy', 
    'Nguyễn Trà Vy', 'Mai Ngọc Như Ý'
  ];

  const REAL_DATA_12A3 = [
    'Nguyễn Huỳnh Như Ái', 'Nguyễn Thùy Anh', 'Ngô Vũ Duy', 'Nguyễn Đức Duy', 'Nguyễn Hồ Phương Duyên', 
    'Nguyễn Vũ Gia Hân', 'Nguyễn Trần Thiên Hương', 'Huỳnh Công Hưng', 'Lê Gia Hữu', 'Lý Tấn Khang', 
    'Nguyễn Thảo Vân Khánh', 'Đào Anh Khoa', 'Trần Đăng Khôi', 'Trần Thị Mỹ Lài', 'Nguyễn Thành Lễ', 
    'Trương Thị Mỹ Linh', 'Nguyễn Trần Bá Luận', 'Võ Huỳnh Yến Ly', 'Ngà Trà My', 'Nguyễn Vinh Hoàng Nam', 
    'Huỳnh Hoàng Nhân', 'Nguyễn Thanh Ngân', 'Nguyễn Thị Thanh Nhiên', 'Đỗ Thị Hồng Nhung', 
    'Nguyễn Thị Ngọc Ninh', 'Hồ Tấn Phúc', 'Nguyễn Quốc Quân', 'Trần Thị Như Quỳnh', 
    'Trần Nguyễn Ái Sa', 'Đỗ Công Tài', 'Trần Nguyễn Thanh Thao', 'Phạm Anh Thư', 'Phan Hữu Tình', 
    'Mang Thị Thùy Trâm', 'Trần Thùy Trinh', 'Nguyễn Thanh Tú', 'Đào Anh Tuấn', 'Phạm Long Tứ', 
    'Trần Nhật Uyên', 'Võ Trần Như Ý', 'Lê Ngọc Huyền Trang', 'Lê Nguyễn Thanh Trúc'
  ];

  const REAL_DATA_12A4 = [
    'Nguyễn Thị Mỹ Duyên', 'Huỳnh Văn Đạt', 'Nguyễn Thanh Đạt', 'Trần Văn Đạt', 'Võ Nguyễn Xuân Giang', 
    'Võ Hồ Ngọc Hân', 'Nguyễn Thanh Huy', 'Huỳnh Hữu Khang', 'Nguyễn Mạnh Khang', 'Phan Dương Yến Linh', 
    'Lý Ngọc Mẫn', 'Phạm Kim Ngân', 'Võ Thị Bích Ngọc', 'Phạm Hoàng Yến Nhã', 'Nguyễn Duy Nhật', 
    'Văn Ngọc Bảo Quyên', 'Trần Diễm Nhật Quỳnh', 'Lê Tấn Sang', 'Đặng Tiến Sơn', 'Bùi Minh Thạch', 
    'Trần Thị Hồng Thắm', 'Bùi Huỳnh Anh Thư', 'Hồ Ngọc Anh Thư', 'Nguyễn Thanh Thư', 'Nguyễn Trung Tính', 
    'Giả Minh Tịnh', 'Nguyễn Đức Tịnh', 'Lê Thùy Trâm', 'Lê Bảo Trân', 'Luơng Thị Hạnh Trân', 
    'Nguyễn Thị Phương Trinh', 'Văn Mai Phương Trinh', 'Lê Minh Trường', 'Lê Đỗ Tú', 
    'Nguyễn Lương Tường Vy', 'Phạm Thị Tường Vy', 'Trần Trúc Vy', 'Võ Huỳnh Yến Vy', 
    'Trần Nguyễn Nhã Ý', 'Huỳnh Thị Hoàng Yên', 'Lê Văn Thanh Bình'
  ];

  const REAL_DATA_12A5 = [
    'Trần Công Chăm', 'Trần Huỳnh Kim Chi', 'Trần Đức Chính', 'Nguyễn Quốc Đạt', 'Nguyễn Thị Thu Hà', 
    'Trần Phạm Anh Hảo', 'Lê Thị Quý Hậu', 'Nguyễn Thị Kim Hậu', 'Nguyễn Diệu Hiền', 'Trần Huy Hoàng', 
    'Đỗ Nhật Huy', 'Hồ Quốc Huy', 'Bùi Nguyễn Hưng', 'Nguyễn Thị Thu Hương', 'Nguyễn Anh Khoa', 
    'Nguyễn Đoàn Thiên Kiều', 'Nguyễn Thị Hoàng My', 'Văn Thị Chi Na', 'Hồ Huỳnh Nam', 'Bùi Thị Thanh Ngân', 
    'Lê Phạm Bảo Ngọc', 'Nguyễn Thị Ánh Nguyệt', 'Trần Thiện Nhân', 'Nguyễn Thị Yến Nhi', 'Huỳnh Trúc Như', 
    'Nguyễn Hồng Như', 'Trần Minh Pháp', 'Nguyễn Đức Phát', 'Nguyễn Quốc Phong', 'Trần Văn Phúc', 
    'Nguyễn Thị Thanh Quỳnh', 'Đặng Xuân Tâm', 'Nguyễn Phan Như Thi', 'Hồ Ngọc Thịnh', 'Võ Thị Thanh Thơ', 
    'Hà Thanh Thuật', 'Đoàn Thị Anh Thư', 'Cao Ngọc Bảo Trân', 'Nguyễn Huyền Anh Trúc', 'Trần Anh Tuấn', 
    'Nguyễn Công Tư', 'Nguyễn Hoàng Vinh', 'Nguyễn Ngọc Hồng Vy', 'Nguyễn Ngọc Thanh Xuân'
  ];

  const REAL_DATA_12A6 = [
    'Phạm Phương Anh', 'Trần Tuấn Anh', 'Nguyễn Trần Vũ Châu', 'Huỳnh Thị Kim Chi', 'Nguyễn Bảo Duy', 
    'Trần Thanh Hằng', 'Lê Công Hậu', 'Nguyễn Ngọc Hiền', 'Nguyễn Thanh Hiếu', 'Nguyễn Thuy Uyên Hòa', 
    'Phạm Quang Huy', 'Nguyễn Đình Xuân Huyền', 'Ngô Duy Khang', 'Huỳnh Tấn Khoa', 'Võ Trung Kiên', 
    'Nguyễn Kim Kiệt', 'Phạm Thị Ý Kính', 'Phan Thúy Liễu', 'Lê Hà Mỹ Linh', 'Võ Nguyễn Thành Luân', 
    'Nguyễn Hoàng Phương Ly', 'Võ Trà My', 'Nguyễn Trình Thế Nam', 'Nguyễn Thành Nguyên', 'Phạm Nam Nhân', 
    'Nguyễn Hoàng Ý Nhi', 'Nguyễn Thị Bích Nhi', 'Lê Trúc Như', 'Trần Lê Đại Phát', 'Bùi Trần Tấn Phú', 
    'Châu Hoàng Phúc', 'Quảng Nguyên Chính Tài', 'Nguyễn Thị Diệu Thùy', 'Trần Mai Anh Thư', 'Hồ Hoài Thương', 
    'Ngô Nguyễn Bảo Thy', 'Trần Trung Tín', 'Nguyễn Trung Tính', 'Nguyễn Đào Ngọc Toàn', 'Trương Bảo Trân', 
    'Phạm Hữu Trọng', 'Lê Quang Tùng', 'Nguyễn Đình Văn', 'Nguyễn Minh Vũ', 'Đỗ Nguyễn Tường Vy'
  ];

  const REAL_DATA_12A7 = [
    'Nguyễn Trần Duy Băng', 'Dương Cao Kỳ Duyên', 'Nguyễn Lê Hoàng Gia', 'Nguyễn Thị Ngọc Hân', 
    'Trần Mỹ Hiền', 'Lê Minh Hoàng', 'Nguyễn Thị Thu', 'Phạm Thị Bích', 'Hồ Thị Thu Hương', 
    'Phạm Nguyễn Ngọc Long', 'Nguyễn Thị Trúc My', 'Nguyễn Thị Thu', 'Lê Minh Nguyệt', 'Nguyễn Quỳnh Như', 
    'Nguyễn Lê Kiều Oanh', 'Nguyễn Gia Phát', 'Trần Vũ Phong', 'Bùi Thanh Thắng', 'Huỳnh Nhữ Kim', 
    'Nguyễn Lâm Thanh Thúy', 'Lê Hoàng Minh Thư', 'Nguyễn Mỹ Xuân Thư', 'Trương Thị Hà Tiên', 'Trần Mạnh Tiến', 
    'Phan Hữu Tình', 'Mai Thu Trang', 'Vương Cao Trí', 'Dương Đỗ Gia Triệu', 'Nguyễn Minh Trọng', 
    'Nguyễn Thị Trúc', 'Nguyễn Võ Minh Tuấn', 'Lê Thị Xuân Tuyết', 'Đinh Anh Vũ', 'Trần Nguyễn Gia Bảo'
  ];

  const REAL_DATA_12A8 = [
    'Nguyễn Hoàng Tâm Anh', 'Nguyễn Thành Bách', 'Nguyễn Gia Bảo', 'Nguyễn Thị Thanh Bình', 
    'Nguyễn Khoa Điểm', 'Đặng Ngân Hà', 'Dương Gia Hân', 'Trần Thị Mỹ Hiền', 'Ngô Thanh Hoàng', 
    'Đinh Võ Trường Kha', 'Nguyễn Trần Khánh Luân', 'Nguyễn Thúy Ly', 'Lương Thị Hữu Lý', 
    'Huỳnh Thị Bảo My', 'Nguyễn Hoàng Quỳnh My', 'Hồ Thị Thanh Ngân', 'Nguyễn Thanh Nghĩa', 
    'Đoàn Thị Hồng Nhân', 'Trần Võ Khánh Như', 'Trần Lương Kiều Oanh', 'Huỳnh Thị Trúc Phương', 
    'Bùi Huỳnh Mai Thi', 'Lê Nhi Thiên Thư', 'Nguyễn Nhật Anh Thư', 'Nguyễn Duy Tín', 
    'Nguyễn Quốc Toàn', 'Nguyễn Thị Mỹ Trâm', 'Nguyễn Minh Trí', 'Võ Thanh Trúc', 
    'Lê Tùng Vương', 'Nguyễn Hồng Vy', 'Nguyễn Võ Như Ý', 'Trần Nguyễn Bảo Yến'
  ];

  CLASSES.forEach(className => {
    let names: string[] = [];

    if (className === '10A1') names = REAL_DATA_10A1;
    else if (className === '10A2') names = REAL_DATA_10A2;
    else if (className === '10A3') names = REAL_DATA_10A3;
    else if (className === '10A4') names = REAL_DATA_10A4;
    else if (className === '10A5') names = REAL_DATA_10A5;
    else if (className === '10A6') names = REAL_DATA_10A6;
    else if (className === '11A1') names = REAL_DATA_11A1;
    else if (className === '11A2') names = REAL_DATA_11A2;
    else if (className === '11A3') names = REAL_DATA_11A3;
    else if (className === '11A4') names = REAL_DATA_11A4;
    else if (className === '11A5') names = REAL_DATA_11A5;
    else if (className === '11A6') names = REAL_DATA_11A6;
    else if (className === '11A7') names = REAL_DATA_11A7;
    else if (className === '12A1') names = REAL_DATA_12A1;
    else if (className === '12A2') names = REAL_DATA_12A2;
    else if (className === '12A3') names = REAL_DATA_12A3;
    else if (className === '12A4') names = REAL_DATA_12A4;
    else if (className === '12A5') names = REAL_DATA_12A5;
    else if (className === '12A6') names = REAL_DATA_12A6;
    else if (className === '12A7') names = REAL_DATA_12A7;
    else if (className === '12A8') names = REAL_DATA_12A8;

    const count = names.length;

    for (let i = 1; i <= count; i++) {
      const gender = Math.random() > 0.45 ? 'Nam' : 'Nữ';
      let fullName = '';
      
      if (names.length > 0 && names[i-1]) {
        fullName = names[i-1];
      } else {
        const lastName = randomItem(LAST_NAMES);
        const middleName = randomItem(MIDDLE_NAMES);
        const firstName = randomItem(FIRST_NAMES);
        fullName = `${lastName} ${middleName} ${firstName}`;
      }
      
      students.push({
        id: `S${className}-${String(i).padStart(2, '0')}`,
        name: fullName,
        class: className,
        gender: gender,
        score: INITIAL_SCORE,
        parentName: `Phụ huynh ${fullName.split(' ').pop()}`
      });
    }
  });
  return students;
};

// 2. Generate Violations over Time for all classes
const generateViolations = (students: Student[]): ViolationRecord[] => {
  const violations: ViolationRecord[] = [];
  const startDate = new Date(2025, 8, 5); // 05/09/2025
  const endDate = new Date(2026, 1, 24); // 24/02/2026
  
  const currentDate = new Date(startDate);
  
  // Create a map of students by class for easier access
  const studentsByClass: Record<string, Student[]> = {};
  CLASSES.forEach(cls => {
      studentsByClass[cls] = students.filter(s => s.class === cls);
  });

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    // Skip Sunday (0)
    if (dayOfWeek !== 0) {
      const dateStr = currentDate.toLocaleDateString('vi-VN');

      CLASSES.forEach(className => {
          const classStudents = studentsByClass[className];
          if (!classStudents || classStudents.length === 0) return;

          // --- 1. CLASS LEVEL VIOLATIONS (Sổ đầu bài rankings) ---
          // Random chance for a class to have a bad period or issues
          // We assume "Good" classes have fewer issues
          const isGoodClass = className.endsWith('1') || className.endsWith('2'); 
          let probBadPeriod = isGoodClass ? 0.05 : 0.15; // 5% vs 15% chance
          
          const classRand = Math.random();
          let classViolationType: ViolationType | null = null;
          
          if (classRand < probBadPeriod * 0.1) classViolationType = 'Tiết D';
          else if (classRand < probBadPeriod * 0.4) classViolationType = 'Tiết C';
          else if (classRand < probBadPeriod) classViolationType = 'Tiết B';
          else if (classRand < probBadPeriod + 0.05) classViolationType = 'Không trực nhật/đổ rác';

          if (classViolationType) {
              violations.push({
                  id: `V-CLASS-${dateStr.replace(/\//g,'')}-${className}`,
                  studentId: `CLASS-${className}`,
                  studentName: `TẬP THỂ LỚP ${className}`,
                  className: className,
                  type: classViolationType,
                  points: VIOLATION_CATEGORIES[classViolationType],
                  date: dateStr,
                  note: `Ghi nhận từ Sổ đầu bài: ${classViolationType}`,
                  recordedBy: 'Giáo viên Bộ môn',
                  recordedRole: 'TEACHER',
                  isCollective: true
              });
          }

          // --- 2. INDIVIDUAL VIOLATIONS ---
          // Determine how many students in this class have issues today
          const numViolations = randomInt(0, isGoodClass ? 1 : 3);
          
          // Determine session label based on day
          let sessionLabel = 'Sáng';
          if (dayOfWeek === 1 || dayOfWeek === 3) {
              sessionLabel = Math.random() > 0.7 ? 'Chiều' : 'Sáng';
          }
          const dayNames = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
          const fullSessionLabel = `${sessionLabel} ${dayNames[dayOfWeek]}`;
          const periodLabel = `Tiết ${randomInt(1, 5)}`;
          
          for (let i = 0; i < numViolations; i++) {
              const student = randomItem(classStudents);
              const rand = Math.random();
              let type: ViolationType;
              let note = '';
              let recorder = '';
              let role: 'ADMIN' | 'TEACHER' | 'TASKFORCE' | 'MONITOR' = 'TASKFORCE';

              if (rand < 0.4) {
                  // Common discipline (Taskforce)
                  type = randomItem(VIOLATION_TYPES_COMMON);
                  recorder = 'Đội TNXK';
                  role = 'TASKFORCE';
                  if (type === 'Đi học trễ') {
                      const hour = 7;
                      const minute = randomInt(1, 30);
                      note = `Đi trễ lúc ${hour}:${minute.toString().padStart(2, '0')}`;
                  } else {
                      note = 'Vi phạm nội quy nề nếp';
                  }
              } else if (rand < 0.7) {
                  // Academic/Discipline in class (Teacher/Monitor)
                  const subRand = Math.random();
                  if (subRand < 0.5) {
                      type = randomItem(VIOLATION_TYPES_ACADEMIC);
                      note = `[${fullSessionLabel} - ${periodLabel}] GVBM ghi nhận trong giờ học`;
                      recorder = 'Giáo viên Bộ môn';
                      role = 'TEACHER';
                  } else {
                      type = randomItem(VIOLATION_TYPES_DISCIPLINE);
                      note = `[${fullSessionLabel} - ${periodLabel}] Cán sự lớp ghi nhận`;
                      recorder = 'Cán sự lớp';
                      role = 'MONITOR';
                  }
              } else if (rand < 0.8) {
                  // Absences
                   type = randomItem(['Vắng có phép', 'Vắng không phép', 'Trốn tiết'] as ViolationType[]);
                   note = `[${fullSessionLabel}] Ghi nhận từ sổ điểm danh`;
                   recorder = 'Giám thị';
                   role = 'ADMIN';
              } else {
                  // Serious (Rare)
                  type = randomItem(VIOLATION_TYPES_SERIOUS);
                  recorder = 'Ban Quản Trị';
                  role = 'ADMIN';
                  note = 'Vi phạm nghiêm trọng - Đã lập biên bản';
              }

              violations.push({
                  id: `V-${dateStr.replace(/\//g,'')}-${className}-${i}-${student.id}`,
                  studentId: student.id,
                  studentName: student.name,
                  className: student.class,
                  type: type,
                  points: VIOLATION_CATEGORIES[type],
                  date: dateStr,
                  note: note,
                  recordedBy: recorder,
                  recordedRole: role,
                  isCollective: false
              });
          }

          // --- 3. GOOD DEEDS / PRAISE ---
          // Small chance
          if (Math.random() < 0.08) { // 8% chance per class per day
              const student = randomItem(classStudents);
              const type = randomItem(GOOD_DEEDS);
              violations.push({
                  id: `V-GOOD-${dateStr.replace(/\//g,'')}-${className}-${student.id}`,
                  studentId: student.id,
                  studentName: student.name,
                  className: student.class,
                  type: type,
                  points: VIOLATION_CATEGORIES[type],
                  date: dateStr,
                  note: 'Tuyên dương trước lớp/trường',
                  recordedBy: 'Giáo viên CN',
                  recordedRole: 'TEACHER',
                  isCollective: false
              });
          }
      });
    }
    // Next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return violations;
};

// --- EXECUTE GENERATION ---
const generatedStudents = generateStudents();
const generatedViolations = generateViolations(generatedStudents);

// Calculate final scores based on violations
// Start with initial score
const studentScoreMap: Record<string, number> = {};
generatedStudents.forEach(s => studentScoreMap[s.id] = INITIAL_SCORE);

// Apply points
generatedViolations.forEach(v => {
    // Only apply individual scores to students
    if (studentScoreMap[v.studentId] !== undefined) {
        studentScoreMap[v.studentId] += v.points;
    }
});

// Update student objects
generatedStudents.forEach(student => {
    student.score = Math.max(0, studentScoreMap[student.id]);
});

export const MOCK_STUDENTS = generatedStudents;
export const MOCK_VIOLATIONS = generatedViolations;
