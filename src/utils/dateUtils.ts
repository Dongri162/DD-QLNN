
// Giả lập thời gian hiện tại là 24/02/2026 (Thứ Ba tuần 24)
export const mockNow = new Date(2026, 1, 24);

// Helper: Tính số tuần học 2025-2026
export const getSchoolWeekInfo = (date: Date) => {
   const startSchool = new Date(2025, 8, 5); // 05/09/2025
   const endWeek1 = new Date(2025, 8, 7);
   const startWeek2 = new Date(2025, 8, 8);

   if (date < startSchool) return { week: 0, reportMonth: date.getMonth() + 1, reportMonthLabel: `${date.getMonth() + 1}/${date.getFullYear()}`, weekEndDate: startSchool };
   
   if (date <= endWeek1) {
     return { week: 1, reportMonth: 9, reportMonthLabel: '9/2025', weekEndDate: endWeek1 };
   }

   const diffTime = date.getTime() - startWeek2.getTime();
   const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
   const weeksPassed = Math.floor(diffDays / 7);
   
   // Tính số tuần thực học (trừ các tuần nghỉ)
   let weekNum = weeksPassed + 2;

   // Nghỉ Tết Âm Lịch: 16/2/2026 - 22/2/2026 (Tuần nghỉ)
   const tetStart = new Date(2026, 1, 16);
   const tetEnd = new Date(2026, 1, 22);

   if (date >= new Date(2026, 0, 5)) { // Từ 05/01/2026 (Bắt đầu điều chỉnh tuần)
       weekNum -= 1;
   }

   if (date >= tetStart && date <= tetEnd) {
       return { week: -1, reportMonth: 2, reportMonthLabel: '2/2026', isHoliday: true, weekEndDate: tetEnd };
   }

   if (date > tetEnd) {
       weekNum -= 1; // Trừ tuần nghỉ Tết
   }

   // Tính ngày Chủ nhật của tuần này để xác định tháng báo cáo
   const daysToSunday = (weeksPassed * 7) + 6;
   const weekEndDate = new Date(startWeek2.getTime() + daysToSunday * 24 * 60 * 60 * 1000);
   
   const reportMonthNum = weekEndDate.getMonth() + 1;
   const reportYearNum = weekEndDate.getFullYear();
   const reportMonthLabel = `${reportMonthNum}/${reportYearNum}`;

   return { 
     week: weekNum, 
     reportMonth: reportMonthNum, 
     reportMonthLabel,
     weekEndDate
   };
};

export const parseDate = (dateStr: string) => {
  const [d, m, y] = dateStr.split('/').map(Number);
  return new Date(y, m - 1, d);
};
