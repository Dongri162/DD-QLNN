
import React, { useState, useMemo } from 'react';
import { Student, ViolationRecord, Role, ClassRemark, User } from '../types';
import { WEEKLY_BASE_SCORE, CLASS_FAULT_TYPES, PROHIBITED_TYPES } from '../constants';
import { mockNow, getSchoolWeekInfo, parseDate } from '../src/utils/dateUtils';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  ChevronDown, 
  Trash2, 
  ListTodo, 
  CheckCircle2,
  Trophy,
  Calendar,
  Filter,
  FileOutput,
  MessageSquare,
  Save,
  Sparkles,
  FileText,
  Table as TableIcon,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RankingBoardProps {
  students: Student[];
  violations: ViolationRecord[];
  userRole?: Role;
  onDeleteViolations?: (ids: string[]) => void;
  onDeleteClassesData?: (classNames: string[]) => void;
  onDeleteClassWeekData?: (className: string, week: number) => void;
  onDeleteBulkClassWeekData?: (classNames: string[], weeks: number[]) => void;
  onDeleteAllDataForPeriod?: (periodType: 'Week' | 'Month', value: number | string) => void;
  isGoodStudyWeek?: boolean;
  onToggleGoodStudyWeek?: (value: boolean) => void;
  classRemarks?: ClassRemark[];
  onUpdateClassRemark?: (remark: ClassRemark) => void;
  currentUser?: User;
}

type Period = 'Week' | 'Month' | 'Semester1' | 'Semester2' | 'Year';

const RankingBoard: React.FC<RankingBoardProps> = ({ 
  students, 
  violations, 
  userRole, 
  onDeleteViolations,
  onDeleteClassesData,
  onDeleteClassWeekData,
  onDeleteBulkClassWeekData,
  onDeleteAllDataForPeriod,
  isGoodStudyWeek = false,
  onToggleGoodStudyWeek,
  classRemarks = [],
  onUpdateClassRemark,
  currentUser
}) => {
  const [period, setPeriod] = useState<Period>('Week'); 
  const [selectedWeek, setSelectedWeek] = useState<number>(getSchoolWeekInfo(mockNow).week);
  const [selectedMonth, setSelectedMonth] = useState<number>(getSchoolWeekInfo(mockNow).reportMonth);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [selectedViolationIds, setSelectedViolationIds] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([getSchoolWeekInfo(mockNow).week]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [editingRemark, setEditingRemark] = useState<{ className: string, text: string } | null>(null);

  const handleBulkDelete = () => {
    if (selectedClasses.length === 0) {
      alert('Vui lòng chọn ít nhất một lớp.');
      return;
    }
    if (selectedWeeks.length === 0) {
      alert('Vui lòng chọn ít nhất một tuần.');
      return;
    }
    if (onDeleteBulkClassWeekData) {
      if (window.confirm(`Xoá dữ liệu của ${selectedClasses.length} lớp trong ${selectedWeeks.length} tuần đã chọn?`)) {
        onDeleteBulkClassWeekData(selectedClasses, selectedWeeks);
        setSelectedClasses([]);
        setIsBulkMode(false);
      }
    }
  };

  const toggleWeekSelection = (week: number) => {
    setSelectedWeeks(prev => 
      prev.includes(week) 
      ? prev.filter(w => w !== week) 
      : [...prev, week].sort((a, b) => a - b)
    );
  };

  // Helper: Parse date DD/MM/YYYY
  // const parseDate = (dateStr: string) => {
  //   const [d, m, y] = dateStr.split('/').map(Number);
  //   return new Date(y, m - 1, d);
  // };

  // Helper to calculate weekly scores for all classes
  const allWeeklyScores = useMemo(() => {
    const scores: Record<string, Record<number, number>> = {}; 
    const uniqueClasses = Array.from(new Set(students.map(s => s.class))) as string[];
    
    uniqueClasses.forEach(cls => {
      scores[cls] = {};
    });

    for (let w = 1; w <= 35; w++) {
      const weekViolations = violations.filter(v => getSchoolWeekInfo(parseDate(v.date)).week === w);
      
      uniqueClasses.forEach(cls => {
        const classWeekViolations = weekViolations.filter(v => v.className === cls);
        let bonus = 0;
        let penalty = 0;
        // In good study weeks, points are doubled
        const multiplier = (w === selectedWeek && isGoodStudyWeek) ? 2 : 1;

        const classFaultsProcessed = new Set<string>();

        // Tự động cộng điểm "100% giờ A" nếu không có tiết B, C, D
        const hasBadPeriod = classWeekViolations.some(v => 
          ['Tiết B', 'Tiết C', 'Tiết D', 'Tiết không đánh giá'].includes(v.type)
        );
        if (!hasBadPeriod) bonus += 40 * multiplier;

        // Tự động cộng điểm "Sĩ số tốt" nếu không có vắng không phép, trễ, trốn
        const hasBadAttendance = classWeekViolations.some(v => 
          ['Vắng không phép', 'Trốn tiết', 'Đi học trễ', 'Trốn tập trung'].includes(v.type)
        );
        if (!hasBadAttendance) bonus += 15 * multiplier;

        classWeekViolations.forEach(v => {
          // Tránh cộng trùng nếu người dùng đã nhập thủ công các mục tự động
          if (v.type === 'Lớp 100% giờ A' || v.type === 'Duy trì sĩ số tốt') return;

          const adjustedPoints = v.points * multiplier;
          if (v.isCollective || CLASS_FAULT_TYPES.includes(v.type)) {
            const faultKey = `${v.type}-${v.date}`;
            if (!classFaultsProcessed.has(faultKey)) {
              if (v.points > 0) bonus += adjustedPoints;
              else penalty += Math.abs(adjustedPoints);
              classFaultsProcessed.add(faultKey);
            }
          } else {
            if (v.points > 0) bonus += adjustedPoints;
            else penalty += Math.abs(adjustedPoints);
          }
        });
        
        scores[cls][w] = 200 + bonus - penalty;
      });
    }
    return scores;
  }, [violations, students, selectedWeek, isGoodStudyWeek]);

  const getClassification = (score: number, hasProhibited: boolean) => {
    let level = 0; // 0: Chưa đạt, 1: Đạt, 2: Khá, 3: Tốt
    if (score >= 200) level = 3;
    else if (score >= 180) level = 2;
    else if (score >= 150) level = 1;
    else level = 0;

    if (hasProhibited && level > 0) {
      level -= 1;
    }

    const labels = ['CHƯA ĐẠT', 'ĐẠT', 'KHÁ', 'TỐT'];
    return labels[level];
  };

  // 2. Tính toán thống kê theo lớp sử dụng công thức mới
  const rankingData = useMemo(() => {
    const currentWeekInfo = getSchoolWeekInfo(mockNow);
    const currentWeek = currentWeekInfo.week;
    const uniqueClasses = Array.from(new Set(students.map(s => s.class))) as string[];

    const stats = uniqueClasses.map(cls => {
      const classScores = allWeeklyScores[cls];
      
      // HK1: Tuần 1-18
      let hk1Sum = 0;
      let hk1Count = 0;
      for (let w = 1; w <= 18; w++) {
        if (w <= currentWeek) {
          hk1Sum += classScores[w] || 200;
          hk1Count++;
        }
      }
      const hk1Avg = hk1Count > 0 ? Number((hk1Sum / hk1Count).toFixed(2)) : 200;

      // HK2: Tuần 19-35
      let hk2Sum = 0;
      let hk2Count = 0;
      for (let w = 19; w <= 35; w++) {
        if (w <= currentWeek) {
          hk2Sum += classScores[w] || 200;
          hk2Count++;
        }
      }
      const hk2Avg = hk2Count > 0 ? Number((hk2Sum / hk2Count).toFixed(2)) : (currentWeek < 19 ? 0 : 200);

      // Cả năm: (HK1 + HK2*2)/3
      const yearScore = hk2Avg > 0 
        ? Number(((hk1Avg + hk2Avg * 2) / 3).toFixed(2))
        : hk1Avg;

      let displayScore = 0;
      let periodVios: ViolationRecord[] = [];

      if (period === 'Week') {
        displayScore = classScores[selectedWeek] || 200;
        periodVios = violations.filter(v => v.className === cls && getSchoolWeekInfo(parseDate(v.date)).week === selectedWeek);
      } else if (period === 'Month') {
        // Average of weeks in month
        let mSum = 0;
        let mCount = 0;
        
        // Pre-calculate which weeks belong to which month based on Sunday
        for (let w = 1; w <= 35; w++) {
            // Find a date in this week to check its reportMonth
            // Week 1 starts 05/09/2025. Week 2 starts 08/09/2025.
            let dateInWeek: Date;
            if (w === 1) {
                dateInWeek = new Date(2025, 8, 6); // Saturday of week 1
            } else {
                dateInWeek = new Date(2025, 8, 8 + (w - 2) * 7 + 3); // Thursday of week w
            }
            
            const weekInfo = getSchoolWeekInfo(dateInWeek);
            if (weekInfo.reportMonth === selectedMonth && w <= currentWeek) {
                mSum += classScores[w] || 200;
                mCount++;
            }
        }
        displayScore = mCount > 0 ? Number((mSum / mCount).toFixed(2)) : 200;
        periodVios = violations.filter(v => v.className === cls && getSchoolWeekInfo(parseDate(v.date)).reportMonth === selectedMonth);
      } else if (period === 'Semester1') {
        displayScore = hk1Avg;
        periodVios = violations.filter(v => v.className === cls && getSchoolWeekInfo(parseDate(v.date)).week <= 18);
      } else if (period === 'Semester2') {
        displayScore = hk2Avg;
        periodVios = violations.filter(v => v.className === cls && getSchoolWeekInfo(parseDate(v.date)).week >= 19);
      } else if (period === 'Year') {
        displayScore = yearScore;
        periodVios = violations.filter(v => v.className === cls);
      }

      const hasProhibited = periodVios.some(v => PROHIBITED_TYPES.includes(v.type));
      const classification = getClassification(displayScore, hasProhibited);

      // Calculate detailed deductions for Week/Month views
      let individualDeductions = 0;
      let classDeductions = 0;
      let bonusPoints = 0;
      let baseScore = 200;

      const classFaultsProcessed = new Set<string>();

      if (period === 'Week' || period === 'Month') {
          periodVios.forEach(v => {
              const multiplier = (period === 'Week' && isGoodStudyWeek) ? 2 : 1;
              const adjustedPoints = v.points * multiplier;
              if (v.points > 0) bonusPoints += adjustedPoints;
              else {
                  const isClassFault = v.isCollective || CLASS_FAULT_TYPES.includes(v.type);
                  if (isClassFault) {
                      const faultKey = `${v.type}-${v.date}-${v.className}`;
                      if (!classFaultsProcessed.has(faultKey)) {
                          classDeductions += Math.abs(adjustedPoints);
                          classFaultsProcessed.add(faultKey);
                      }
                  } else {
                      individualDeductions += Math.abs(adjustedPoints);
                  }
              }
          });
          if (period === 'Month') {
              // For month, we show the total deductions over the month
              baseScore = 200 * 4; // Approximate
          }
      }

      return {
        className: cls,
        studentCount: students.filter(s => s.class === cls).length,
        baseScore,
        individualDeductions,
        classDeductions,
        bonusPoints,
        totalScore: displayScore,
        hk1Avg,
        hk2Avg,
        yearScore,
        hasProhibited,
        classification,
        details: periodVios
      };
    });

    return stats.sort((a, b) => b.totalScore - a.totalScore);
  }, [students, violations, period, selectedWeek, selectedMonth, allWeeklyScores]);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: return <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-500 text-white rounded-2xl font-black shadow-xl shadow-yellow-200 ring-4 ring-white"><Trophy className="w-5 h-5" /></div>;
      case 1: return <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-400 text-white rounded-2xl font-black shadow-xl shadow-slate-200 ring-4 ring-white">2</div>;
      case 2: return <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-2xl font-black shadow-xl shadow-amber-200 ring-4 ring-white">3</div>;
      default: return <div className="w-10 h-10 flex items-center justify-center font-black text-slate-400 text-sm">#{index + 1}</div>;
    }
  };

  const toggleExpand = (className: string) => {
    if (expandedClass === className) {
      setExpandedClass(null);
      setSelectedViolationIds([]);
    } else {
      setExpandedClass(className);
      setSelectedViolationIds([]);
    }
  };

  const handleSelectViolation = (id: string) => {
    setSelectedViolationIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllClassViolations = (details: ViolationRecord[]) => {
    const ids = details.map(d => d.id);
    const allSelected = ids.every(id => selectedViolationIds.includes(id));
    
    if (allSelected) {
      setSelectedViolationIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      const newIds = ids.filter(id => !selectedViolationIds.includes(id));
      setSelectedViolationIds(prev => [...prev, ...newIds]);
    }
  };

  const executeBulkDelete = () => {
    if (onDeleteViolations && selectedViolationIds.length > 0) {
      if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedViolationIds.length} bản ghi đã chọn?`)) {
        onDeleteViolations(selectedViolationIds);
        setSelectedViolationIds([]);
      }
    }
  };

  const handleExportExcel = () => {
    const title = period === 'Week' 
      ? `BẢNG ĐIỂM THI ĐUA TUẦN ${String(selectedWeek).padStart(2, '0')}`
      : period === 'Month' 
        ? `BẢNG ĐIỂM THI ĐUA THÁNG ${mockNow.getMonth() + 1}`
        : `BẢNG ĐIỂM THI ĐUA NĂM HỌC 2025-2026`;
    
    const data = rankingData.map((item, idx) => {
      const summaryParts: string[] = [];
      const multiplier = isGoodStudyWeek ? 2 : 1;
      
      const typeGroups: Record<string, { count: number, points: number }> = {};
      item.details.forEach(v => {
        if (!typeGroups[v.type]) typeGroups[v.type] = { count: 0, points: 0 };
        typeGroups[v.type].count++;
        typeGroups[v.type].points += v.points * multiplier;
      });

      Object.entries(typeGroups).forEach(([type, data]) => {
        if (type.startsWith('Tiết ')) return;
        const sign = data.points > 0 ? '+' : '';
        summaryParts.push(`${data.count} lượt ${type} (${sign}${data.points}đ)`);
      });

      const hasBadPeriods = item.details.some(v => v.type === 'Tiết B' || v.type === 'Tiết C' || v.type === 'Tiết D');
      if (!hasBadPeriods) {
        summaryParts.push(`100% tiết A (+${40 * multiplier}đ)`);
      } else {
        const periodFaults = item.details.filter(v => v.type.startsWith('Tiết '));
        periodFaults.forEach(v => {
          summaryParts.push(`${v.type} (${v.note.split('Lời phê: ')[1] || 'Không ghi'}) (${v.points * multiplier}đ)`);
        });
      }

      const remark = classRemarks.find(r => r.className === item.className && r.period === (period === 'Week' ? `Tuần ${selectedWeek}` : period))?.remark || '';

      const baseRow = {
        'Hạng': idx + 1,
        'Lớp': item.className,
      };

      let periodData = {};
      if (period === 'Year') {
          periodData = {
              'HK I': item.hk1Avg,
              'HK II': item.hk2Avg,
              'Cả Năm': item.yearScore
          };
      } else if (period === 'Week' || period === 'Month') {
          periodData = {
              'Điểm Sàn': item.baseScore,
              'Trừ Cá Nhân': -item.individualDeductions,
              'Trừ Tập Thể': -item.classDeductions,
              'Điểm Cộng': item.bonusPoints,
              'Tổng Điểm': item.totalScore
          };
      } else {
          periodData = {
              'Điểm TB': item.totalScore
          };
      }

      return {
        ...baseRow,
        ...periodData,
        'Xếp Loại': item.classification,
        'Hạ Bậc': item.hasProhibited ? 'Có' : 'Không',
        'Chi Tiết Vi Phạm & Thưởng': summaryParts.join('; '),
        'Nhận Xét': remark
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Báo Cáo Tổng Hợp");
    
    // Create Detailed Sheet
    const detailedData = rankingData.flatMap(item => 
      item.details.map(v => ({
        'Lớp': item.className,
        'Học Sinh': v.studentName,
        'Ngày': v.date,
        'Loại Vi Phạm': v.type,
        'Nội Dung': v.note,
        'Điểm Gốc': v.points,
        'Điểm Thực Tế': v.points * (isGoodStudyWeek ? 2 : 1),
        'Người Ghi': v.recordedBy,
        'Vai Trò': v.recordedRole
      }))
    );
    const wsDetailed = XLSX.utils.json_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(wb, wsDetailed, "Chi Tiết Vi Phạm");

    const wscols = [
      {wch: 6}, {wch: 8}, {wch: 10}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 15}, {wch: 100}, {wch: 40}
    ];
    ws['!cols'] = wscols;
    
    const wsDetailedCols = [
      {wch: 10}, {wch: 20}, {wch: 12}, {wch: 25}, {wch: 50}, {wch: 10}, {wch: 12}, {wch: 20}, {wch: 15}
    ];
    wsDetailed['!cols'] = wsDetailedCols;

    const fileName = period === 'Week' ? `Bao_cao_thi_dua_tuan_${selectedWeek}.xlsx` : `Bao_cao_thi_dua_${period}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape
    
    const title = period === 'Week' 
      ? `BANG DIEM THI DUA TUAN ${selectedWeek}`
      : period === 'Month' 
        ? `BANG DIEM THI DUA THANG ${selectedMonth}`
        : period === 'Semester1'
          ? `BANG DIEM THI DUA HOC KY I`
          : period === 'Semester2'
            ? `BANG DIEM THI DUA HOC KY II`
            : `BANG DIEM THI DUA NAM HOC 2025-2026`;

    // School Header
    doc.setFontSize(10);
    doc.text("TRUONG THPT SO 3 TUY PHUOC", 20, 15);
    doc.text("DOAN THANH NIEN", 20, 20);
    
    doc.text("CONG HOA XA HOI CHU NGHIA VIET NAM", 200, 15, { align: 'center' });
    doc.text("Doc lap - Tu do - Hanh phuc", 200, 20, { align: 'center' });

    doc.setFontSize(18);
    doc.text(title, 148, 35, { align: 'center' });
    if (isGoodStudyWeek && period === 'Week') {
      doc.setFontSize(10);
      doc.text("(HE SO NHAN DOI - TUAN HOC TOT)", 148, 42, { align: 'center' });
    }

    const tableData = rankingData.map((item, idx) => {
      const multiplier = (period === 'Week' && isGoodStudyWeek) ? 2 : 1;
      const remark = classRemarks.find(r => r.className === item.className && r.period === (period === 'Week' ? `Tuần ${selectedWeek}` : period))?.remark || '';
      
      const summaryParts: string[] = [];
      const typeGroups: Record<string, { count: number, points: number }> = {};
      item.details.forEach(v => {
        if (!typeGroups[v.type]) typeGroups[v.type] = { count: 0, points: 0 };
        typeGroups[v.type].count++;
        typeGroups[v.type].points += v.points * multiplier;
      });

      Object.entries(typeGroups).forEach(([type, data]) => {
        if (type.startsWith('Tiết ')) return;
        const sign = data.points > 0 ? '+' : '';
        summaryParts.push(`${data.count} ${type} (${sign}${data.points}d)`);
      });

      if (period === 'Year') {
        return [
          idx + 1,
          item.className,
          item.hk1Avg,
          item.hk2Avg || '-',
          item.yearScore,
          item.classification,
          remark
        ];
      } else if (period === 'Week' || period === 'Month') {
        return [
          idx + 1,
          item.className,
          item.totalScore,
          item.classification,
          summaryParts.join('\n'),
          remark
        ];
      } else {
        return [
          idx + 1,
          item.className,
          item.totalScore,
          item.classification,
          remark
        ];
      }
    });

    const head = period === 'Year' 
      ? [['Hang', 'Lop', 'HK I', 'HK II', 'Ca Nam', 'Xep Loai', 'Nhan xet']]
      : (period === 'Week' || period === 'Month')
        ? [['Hang', 'Lop', 'Diem', 'Xep Loai', 'Chi tiet', 'Nhan xet']]
        : [['Hang', 'Lop', 'Diem TB', 'Xep Loai', 'Nhan xet']];

    autoTable(doc, {
      head: head,
      body: tableData,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
      styles: { fontSize: 8, overflow: 'linebreak', cellPadding: 3 }
    });

    // Add Detailed Violations on a new page
    doc.addPage();
    doc.setFontSize(14);
    doc.text("CHI TIET CAC LOI VI PHAM VA DIEM TRU", 148, 20, { align: 'center' });
    
    const detailRows = rankingData.flatMap(item => 
      item.details.filter(v => v.points < 0).map(v => [
        item.className,
        v.studentName,
        v.date,
        v.type,
        v.points * (isGoodStudyWeek ? 2 : 1),
        v.note
      ])
    );

    autoTable(doc, {
      head: [['Lop', 'Hoc sinh', 'Ngay', 'Loai vi pham', 'Diem', 'Ghi chu']],
      body: detailRows,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [225, 29, 72] },
      styles: { fontSize: 8 }
    });

    // Add Summary Section
    const totalClasses = rankingData.length;
    const totClasses = rankingData.filter(i => i.classification === 'TỐT').length;
    const khaClasses = rankingData.filter(i => i.classification === 'KHÁ').length;
    const datClasses = rankingData.filter(i => i.classification === 'ĐẠT').length;
    const chuaDatClasses = rankingData.filter(i => i.classification === 'CHƯA ĐẠT').length;

    doc.addPage();
    doc.setFontSize(14);
    doc.text("TONG HOP KET QUA THI DUA TOAN TRUONG", 148, 20, { align: 'center' });
    
    autoTable(doc, {
      startY: 30,
      head: [['Tieu chi', 'So luong', 'Ti le (%)']],
      body: [
        ['Tong so chi doan', totalClasses, '100%'],
        ['Xep loai TOT', totClasses, ((totClasses/totalClasses)*100).toFixed(1) + '%'],
        ['Xep loai KHA', khaClasses, ((khaClasses/totalClasses)*100).toFixed(1) + '%'],
        ['Xep loai DAT', datClasses, ((datClasses/totalClasses)*100).toFixed(1) + '%'],
        ['Xep loai CHUA DAT', chuaDatClasses, ((chuaDatClasses/totalClasses)*100).toFixed(1) + '%'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });

    // Signature on the last page
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.text(`Tuy Phuoc, ngay ${mockNow.getDate()} thang ${mockNow.getMonth() + 1} nam ${mockNow.getFullYear()}`, 220, finalY, { align: 'center' });
    doc.text("TM. BAN CHAP HANH DOAN TRUONG", 220, finalY + 7, { align: 'center' });
    doc.text("BI THU", 220, finalY + 14, { align: 'center' });

    const fileName = period === 'Week' ? `Bao_cao_thi_dua_tuan_${selectedWeek}.pdf` : `Bao_cao_thi_dua_${period}.pdf`;
    doc.save(fileName);
  };

  const handleExportDetailedPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape
    
    const title = period === 'Week' 
      ? `CHI TIET VI PHAM TUAN ${selectedWeek}`
      : period === 'Month' 
        ? `CHI TIET VI PHAM THANG ${mockNow.getMonth() + 1}`
        : `CHI TIET VI PHAM NAM HOC 2025-2026`;

    doc.setFontSize(18);
    doc.text(title, 148, 20, { align: 'center' });
    
    const detailedData = rankingData.flatMap(item => 
      item.details.map(v => [
        item.className,
        v.studentName,
        v.date,
        v.type,
        v.note,
        v.points * (isGoodStudyWeek ? 2 : 1),
        v.recordedBy || (v.recordedRole === 'TASKFORCE' ? 'Doi Co Do' : 'Giao vien')
      ])
    );

    autoTable(doc, {
      head: [['Lop', 'Hoc Sinh', 'Ngay', 'Loai Vi Pham', 'Noi Dung', 'Diem', 'Nguoi Ghi']],
      body: detailedData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [225, 29, 72], fontSize: 9 }, // Rose-600
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 40 },
        4: { cellWidth: 80 },
        5: { cellWidth: 15 },
        6: { cellWidth: 35 }
      },
      styles: { fontSize: 8, overflow: 'linebreak' }
    });

    const fileName = period === 'Week' ? `Chi_tiet_vi_pham_tuan_${selectedWeek}.pdf` : `Chi_tiet_vi_pham_${period}.pdf`;
    doc.save(fileName);
  };

  const handleExportWeeklyReport = () => {
    // Keep original TXT export as a fallback or for quick copy-paste
    const title = `BẢNG ĐIỂM THI ĐUA TUẦN ${String(selectedWeek).padStart(2, '0')}`;
    
    let content = `TRƯỜNG THPT SỐ 3 TUY PHƯỚC\tCộng hòa xã hội chủ nghĩa Việt Nam\n`;
    content += `ĐOÀN THANH NIÊN\tĐộc lập – Tự do – Hạnh phúc\n\n`;
    content += `\t\t${title}\n`;
    if (isGoodStudyWeek && period === 'Week') content += `\t\t(HỆ SỐ NHÂN ĐÔI - TUẦN HỌC TỐT)\n`;
    content += `\n`;
    
    const headers = ['STT', 'LỚP', 'TỔNG HỢP NỀ NẾP - PHONG TRÀO - SỔ ĐẦU BÀI', 'TỔNG ĐIỂM', 'XẾP LOẠI', 'VỊ THỨ'];
    content += headers.join('\t') + '\n';

    rankingData.forEach((item, idx) => {
      const summaryParts: string[] = [];
      const multiplier = isGoodStudyWeek ? 2 : 1;
      
      const typeGroups: Record<string, { count: number, points: number }> = {};
      item.details.forEach(v => {
        if (!typeGroups[v.type]) typeGroups[v.type] = { count: 0, points: 0 };
        typeGroups[v.type].count++;
        typeGroups[v.type].points += v.points * multiplier;
      });

      Object.entries(typeGroups).forEach(([type, data]) => {
        if (type.startsWith('Tiết ')) return;
        const sign = data.points > 0 ? '+' : '';
        summaryParts.push(`* ${data.count} lượt ${type} (${sign}${data.points}đ)`);
      });

      const hasBadPeriods = item.details.some(v => v.type === 'Tiết B' || v.type === 'Tiết C' || v.type === 'Tiết D');
      if (!hasBadPeriods) {
        summaryParts.push(`* 100% tiết A (+${40 * multiplier}đ)`);
      } else {
        const periodFaults = item.details.filter(v => v.type.startsWith('Tiết '));
        periodFaults.forEach(v => {
          summaryParts.push(`* ${v.type} (${v.note.split('Lời phê: ')[1] || 'Không ghi'}) (${v.points * multiplier}đ)`);
        });
      }

      const row = [
        idx + 1,
        item.className,
        summaryParts.join('; '),
        item.totalScore,
        item.totalScore >= 200 ? 'TỐT' : item.totalScore >= 180 ? 'KHÁ' : item.totalScore >= 150 ? 'ĐẠT' : 'CHƯA ĐẠT',
        idx + 1
      ];
      content += row.join('\t') + '\n';
      
      const remark = classRemarks.find(r => r.className === item.className && r.period === (period === 'Week' ? `Tuần ${selectedWeek}` : period))?.remark;
      if (remark) {
        content += `\t\tNhận xét: ${remark}\n`;
      }
    });

    content += `\n\n\t\t\t\t\t\tTuy Phước, ngày ${mockNow.getDate()} tháng ${mockNow.getMonth() + 1} năm ${mockNow.getFullYear()}\n`;
    content += `\t\t\t\t\t\t\tTM. BAN CHẤP HÀNH ĐOÀN TRƯỜNG\n`;
    content += `\t\t\t\t\t\t\t\tBÍ THƯ\n\n\n\n\t\t\t\t\t\t\t\t(Đã ký)`;

    const blob = new Blob([`\uFEFF${content}`], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = period === 'Week' ? `Bao_cao_thi_dua_tuan_${selectedWeek}.txt` : `Bao_cao_thi_dua_${period}.txt`;
    link.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 animate-in fade-in duration-700"
    >
      {/* Header & Filter */}
      <div className="glass-card p-8 rounded-[2.5rem] flex flex-col lg:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-blue-200">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight font-display">Bảng Xếp Hạng Thi Đua</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">
              Công thức: <span className="text-blue-600">Điểm Sàn + Cộng - (Trừ Cá Nhân + Trừ Tập Thể)</span>
            </p>
          </div>
        </div>
        
          <div className="flex flex-wrap gap-3">
          {selectedClasses.length > 0 && userRole === 'ADMIN' && (
            <button 
              onClick={() => {
                if (onDeleteClassesData) {
                  onDeleteClassesData(selectedClasses);
                  setSelectedClasses([]);
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xoá dữ liệu ({selectedClasses.length} lớp)
            </button>
          )}
          {userRole === 'ADMIN' && (period === 'Week' || period === 'Month') && (
            <div className="flex items-center gap-4 mr-4 glass-card px-4 py-2 rounded-2xl">
              {period === 'Week' && !isBulkMode ? (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chọn tuần:</span>
                  <select 
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 35 }, (_, i) => {
                      const w = i + 1;
                      // Calculate date range for this week to show in dropdown
                      const startSchool = new Date(2025, 8, 5);
                      const startWeek2 = new Date(2025, 8, 8);
                      let start: Date;
                      if (w === 1) start = startSchool;
                      else {
                        let weeksToAdd = w - 2;
                        if (w >= 18) weeksToAdd += 1; 
                        if (w >= 24) weeksToAdd += 1; 
                        start = new Date(startWeek2.getTime() + weeksToAdd * 7 * 24 * 60 * 60 * 1000);
                      }
                      const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
                      const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
                      return (
                        <option key={w} value={w}>
                          Tuần {w} ({fmt(start)} - {fmt(end)})
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : period === 'Week' && isBulkMode ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-rose-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chọn nhiều tuần để xóa:</span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-md">
                    <button
                      onClick={() => {
                        const allWeeks = Array.from({ length: 35 }, (_, i) => i + 1);
                        if (selectedWeeks.length === 35) {
                          setSelectedWeeks([]);
                        } else {
                          setSelectedWeeks(allWeeks);
                        }
                      }}
                      className="px-3 h-8 rounded-lg text-[9px] font-black transition-all border bg-slate-800 text-white border-slate-800 hover:bg-slate-900 shadow-sm uppercase tracking-widest"
                    >
                      {selectedWeeks.length === 35 ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                    </button>
                    {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                      <button
                        key={w}
                        onClick={() => toggleWeekSelection(w)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-[10px] font-black transition-all border",
                          selectedWeeks.includes(w) 
                            ? "bg-rose-600 text-white border-rose-600 shadow-sm" 
                            : "bg-white text-slate-400 border-slate-100 hover:border-rose-200"
                        )}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chọn tháng:</span>
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[9, 10, 11, 12, 1, 2, 3, 4, 5].map(m => (
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                </div>
              )}
              {period === 'Week' && (
                <>
                  <div className="w-px h-6 bg-slate-200" />
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tuần học tốt (x2):</span>
                    <button
                      onClick={() => onToggleGoodStudyWeek && onToggleGoodStudyWeek(!isGoodStudyWeek)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        isGoodStudyWeek ? "bg-emerald-500" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        isGoodStudyWeek ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {userRole === 'ADMIN' && period === 'Week' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 neo-button"
                title="Xuất file Excel (.xlsx)"
              >
                <TableIcon className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center gap-2 neo-button"
                title="Xuất file PDF (.pdf)"
              >
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                onClick={handleExportDetailedPDF}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 flex items-center gap-2 neo-button"
                title="Xuất chi tiết vi phạm PDF"
              >
                <FileText className="w-3.5 h-3.5" /> Chi tiết PDF
              </button>
              <button
                onClick={handleExportWeeklyReport}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 flex items-center gap-2 neo-button"
                title="Xuất file văn bản (.txt)"
              >
                <FileOutput className="w-3.5 h-3.5" /> Văn bản
              </button>
              {userRole === 'ADMIN' && (period === 'Week' || period === 'Month') && onDeleteAllDataForPeriod && (
                <button
                  onClick={() => {
                    const value = period === 'Week' ? getSchoolWeekInfo(mockNow).week : getSchoolWeekInfo(mockNow).reportMonthLabel;
                    onDeleteAllDataForPeriod(period as 'Week' | 'Month', value);
                  }}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center gap-2 neo-button"
                  title={`Xoá toàn bộ dữ liệu ${period === 'Week' ? 'Tuần' : 'Tháng'}`}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xoá toàn bộ {period === 'Week' ? 'Tuần' : 'Tháng'}
                </button>
              )}
            </div>
          )}
          {userRole === 'ADMIN' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBulkMode(!isBulkMode)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 neo-button",
                  isBulkMode ? "bg-rose-600 text-white shadow-rose-200" : "bg-white text-slate-600 border border-slate-200"
                )}
              >
                <Trash2 className="w-4 h-4" />
                {isBulkMode ? 'Hủy Chế độ Xóa' : 'Chế độ Xóa Nâng cao'}
              </button>
              
              {isBulkMode && (
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedClasses.length === 0 || selectedWeeks.length === 0}
                  className="px-6 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center gap-2 neo-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa {selectedClasses.length} lớp x {selectedWeeks.length} tuần
                </button>
              )}
            </div>
          )}

          <div className="flex glass-card p-1.5 rounded-2xl">
            {(['Week', 'Month', 'Semester1', 'Semester2', 'Year'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  setExpandedClass(null);
                }}
                className={cn(
                  "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 neo-button",
                  period === p 
                  ? 'bg-white text-blue-600 shadow-xl scale-105' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                )}
              >
                {p === 'Week' ? 'TUẦN' : p === 'Month' ? 'THÁNG' : p === 'Semester1' ? 'HK I' : p === 'Semester2' ? 'HK II' : 'NĂM'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scoring Criteria Info */}
      <div className="glass-card p-8 rounded-[2.5rem] mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><ListTodo className="w-5 h-5" /></div>
          <h3 className="text-xl font-black text-slate-800 font-display">Tiêu chí & Công thức tính điểm thi đua</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Điểm cơ bản</h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">Mỗi lớp bắt đầu tuần mới với <span className="text-blue-600 font-black">200 điểm</span> cơ bản.</p>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-[9px] text-blue-700 font-bold italic">Điểm tổng = 200 + Thưởng - Trừ (Cá nhân) - Trừ (Tập thể)</p>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Hệ số nhân đôi</h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">Trong <span className="text-emerald-600 font-black">Tuần học tốt</span>, tất cả điểm cộng và điểm trừ đều được nhân đôi (x2).</p>
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600">
              <Sparkles className="w-3 h-3" /> Áp dụng cho toàn trường
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3. Xếp loại tiết học</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-emerald-600">Tiết A (Tốt)</span>
                <span className="text-slate-400">+0đ (Giữ điểm)</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-amber-600">Tiết B (Khá)</span>
                <span className="text-rose-500">-5đ</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-orange-600">Tiết C (TB)</span>
                <span className="text-rose-500">-10đ</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-rose-600">Tiết D (Yếu)</span>
                <span className="text-rose-500">-20đ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100/80 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/30">
              <th className="px-4 py-4 text-center w-12 border-r border-slate-100/50">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedClasses.length === rankingData.length && rankingData.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedClasses(rankingData.map(i => i.className));
                    } else {
                      setSelectedClasses([]);
                    }
                  }}
                />
              </th>
              <th className="px-6 py-4 text-center w-20 text-[10px] font-serif italic font-bold text-slate-400 uppercase tracking-[0.15em] border-r border-slate-100/50">Hạng</th>
              <th className="px-6 py-4 text-left text-[10px] font-serif italic font-bold text-slate-400 uppercase tracking-[0.15em] border-r border-slate-100/50">Lớp</th>
              {period === 'Year' ? (
                <>
                  <th className="px-6 py-4 text-center text-[10px] font-serif italic font-bold text-slate-400 uppercase tracking-[0.15em] border-r border-slate-100/50">HK I</th>
                  <th className="px-6 py-4 text-center text-[10px] font-serif italic font-bold text-slate-400 uppercase tracking-[0.15em] border-r border-slate-100/50">HK II</th>
                </>
              ) : (period === 'Week' || period === 'Month') ? (
                <>
                  <th className="px-6 py-4 text-center text-[10px] font-serif italic font-bold text-slate-400 uppercase tracking-[0.15em] border-r border-slate-100/50">Điểm Sàn</th>
                  <th className="px-6 py-4 text-center text-[10px] font-serif italic font-bold text-rose-400 uppercase tracking-[0.15em] border-r border-slate-100/50">Trừ Cá Nhân</th>
                  <th className="px-6 py-4 text-center text-[10px] font-serif italic font-bold text-rose-400 uppercase tracking-[0.15em] border-r border-slate-100/50">Trừ Tập Thể</th>
                  <th className="px-6 py-4 text-center text-[10px] font-serif italic font-bold text-emerald-400 uppercase tracking-[0.15em] border-r border-slate-100/50">Điểm Cộng</th>
                </>
              ) : (
                <th className="px-6 py-4 text-center text-[10px] font-serif italic font-bold text-slate-400 uppercase tracking-[0.15em] border-r border-slate-100/50">Điểm TB Tuần</th>
              )}
              <th className="px-6 py-4 text-center text-[10px] font-serif italic font-bold text-blue-400 uppercase tracking-[0.15em] border-r border-slate-100/50 bg-blue-50/10">Tổng Điểm</th>
              <th className="px-6 py-4 text-left text-[10px] font-serif italic font-bold text-slate-400 uppercase tracking-[0.15em] border-r border-slate-100/50">Nhận xét</th>
              <th className="px-6 py-4 text-center text-[10px] font-serif italic font-bold text-slate-400 uppercase tracking-[0.15em]">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rankingData.map((item, index) => {
              const isExpanded = expandedClass === item.className;
              return (
                <React.Fragment key={item.className}>
                  <tr 
                    onClick={() => toggleExpand(item.className)}
                    className={cn(
                      "transition-all cursor-pointer group border-b border-slate-50 last:border-0",
                      isExpanded ? 'bg-blue-50/20' : 'hover:bg-slate-50/80'
                    )}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-center border-r border-slate-100/50" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedClasses.includes(item.className)}
                        onChange={() => {
                          setSelectedClasses(prev => 
                            prev.includes(item.className) 
                            ? prev.filter(c => c !== item.className) 
                            : [...prev, item.className]
                          );
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center border-r border-slate-100/50 font-mono text-sm text-slate-500">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-1.5 h-10 rounded-full transition-all duration-500",
                          index < 3 ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-slate-200'
                        )}></div>
                        <div>
                          <span className="text-lg font-black text-slate-800 tracking-tight">Lớp {item.className}</span>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{item.studentCount} Học sinh</p>
                        </div>
                      </div>
                    </td>
                    {period === 'Year' ? (
                      <>
                        <td className="px-8 py-6 whitespace-nowrap text-center text-slate-500 font-black text-sm font-mono border-r border-slate-100/50">
                          {item.hk1Avg}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center text-slate-500 font-black text-sm font-mono border-r border-slate-100/50">
                          {item.hk2Avg || '-'}
                        </td>
                      </>
                    ) : (period === 'Week' || period === 'Month') ? (
                      <>
                        <td className="px-8 py-6 whitespace-nowrap text-center text-slate-500 font-black text-sm font-mono">
                            {item.baseScore}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center text-rose-500 font-black text-sm font-mono">
                            {item.individualDeductions > 0 ? (
                              <div className="flex flex-col items-center">
                                <span>-{item.individualDeductions}</span>
                                {isGoodStudyWeek && period === 'Week' && <span className="text-[8px] bg-rose-100 px-1 rounded">x2</span>}
                              </div>
                            ) : '-'}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center text-rose-600 font-black text-sm font-mono">
                            {item.classDeductions > 0 ? (
                              <div className="flex flex-col items-center">
                                <span>-{item.classDeductions}</span>
                                {isGoodStudyWeek && period === 'Week' && <span className="text-[8px] bg-rose-100 px-1 rounded">x2</span>}
                              </div>
                            ) : '-'}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center text-emerald-500 font-black text-sm font-mono">
                            {item.bonusPoints > 0 ? (
                              <div className="flex flex-col items-center">
                                <span>+{item.bonusPoints}</span>
                                {isGoodStudyWeek && period === 'Week' && <span className="text-[8px] bg-emerald-100 px-1 rounded">x2</span>}
                              </div>
                            ) : '-'}
                        </td>
                      </>
                    ) : (
                      <td className="px-8 py-6 whitespace-nowrap text-center text-slate-500 font-black text-sm font-mono border-r border-slate-100/50">
                        {item.totalScore}
                      </td>
                    )}
                    <td className="px-8 py-6 whitespace-nowrap text-center border-r border-slate-100/50 bg-blue-50/10">
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "text-2xl font-black tracking-tight font-mono",
                          item.totalScore >= 200 ? 'text-emerald-600' : item.totalScore >= 180 ? 'text-blue-600' : item.totalScore >= 150 ? 'text-amber-600' : 'text-rose-600'
                        )}>
                          {item.totalScore}
                        </span>
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest mt-1",
                          item.classification === 'TỐT' ? 'bg-emerald-100 text-emerald-600' : 
                          item.classification === 'KHÁ' ? 'bg-blue-100 text-blue-600' : 
                          item.classification === 'ĐẠT' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                        )}>
                          {item.classification}
                        </span>
                        {item.hasProhibited && (
                          <span className="text-[8px] text-rose-500 font-bold mt-1 animate-pulse">Hạ bậc (Vi phạm cấm)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 min-w-[250px]">
                        {editingRemark?.className === item.className ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="text"
                              value={editingRemark.text}
                              onChange={(e) => setEditingRemark({ ...editingRemark, text: e.target.value })}
                              className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Nhập nhận xét..."
                              autoFocus
                            />
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onUpdateClassRemark) {
                                  onUpdateClassRemark({
                                    className: item.className,
                                    period: period === 'Week' ? `Tuần ${getSchoolWeekInfo(mockNow).week}` : period,
                                    remark: editingRemark.text,
                                    updatedBy: 'Admin'
                                  });
                                }
                                setEditingRemark(null);
                              }}
                              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group/remark">
                            <p className="text-xs text-slate-500 font-medium italic truncate max-w-[200px]">
                              {classRemarks.find(r => r.className === item.className && r.period === (period === 'Week' ? `Tuần ${getSchoolWeekInfo(mockNow).week}` : period))?.remark || 'Chưa có nhận xét'}
                            </p>
                            {userRole === 'ADMIN' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const current = classRemarks.find(r => r.className === item.className && r.period === (period === 'Week' ? `Tuần ${getSchoolWeekInfo(mockNow).week}` : period))?.remark || '';
                                  setEditingRemark({ className: item.className, text: current });
                                }}
                                className="opacity-0 group-hover/remark:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-all"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-center">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 mx-auto",
                        isExpanded ? "bg-blue-600 text-white rotate-180 shadow-lg shadow-blue-200" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                      )}>
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Detail Row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="p-0 bg-slate-50/30 border-b border-blue-50">
                        <div className="p-8 animate-in slide-in-from-top-4 duration-500">
                          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                            <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><ListTodo className="w-5 h-5" /></div>
                                <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">
                                  Chi tiết biến động - Lớp {item.className}
                                </h4>
                                <span className="text-[9px] font-black bg-white text-slate-400 px-3 py-1 rounded-full border border-slate-100 uppercase tracking-widest">
                                  {period === 'Week' ? 'Tuần này' : period === 'Month' ? 'Tháng này' : 'Năm học'}
                                </span>
                              </div>

                              {userRole === 'ADMIN' && period === 'Week' && onDeleteClassWeekData && (
                                <button
                                  onClick={() => onDeleteClassWeekData(item.className, selectedWeek)}
                                  className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 px-6 py-2.5 rounded-xl font-black uppercase tracking-widest border border-rose-100 transition-all flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Xóa dữ liệu Tuần {selectedWeek}
                                </button>
                              )}

                              {userRole === 'ADMIN' && selectedViolationIds.length > 0 && (
                                <button
                                  onClick={executeBulkDelete}
                                  className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-rose-200 transition-all flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Xóa {selectedViolationIds.length} mục
                                </button>
                              )}
                            </div>
                            
                            {item.details.length > 0 ? (
                              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                <table className="min-w-full divide-y divide-slate-50">
                                  <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                    <tr>
                                      {userRole === 'ADMIN' && (
                                        <th className="px-6 py-4 text-center w-12">
                                          <input 
                                            type="checkbox"
                                            className="rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500/10 h-4 w-4 cursor-pointer transition-all"
                                            checked={item.details.length > 0 && item.details.every(d => selectedViolationIds.includes(d.id))}
                                            onChange={() => handleSelectAllClassViolations(item.details)}
                                          />
                                        </th>
                                      )}
                                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Ngày</th>
                                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Học sinh</th>
                                      <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Nội dung</th>
                                      <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Điểm</th>
                                      <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {item.details.sort((a, b) => b.id.localeCompare(a.id)).map((detail) => (
                                      <tr key={detail.id} className={cn("hover:bg-slate-50/50 transition-colors", selectedViolationIds.includes(detail.id) && "bg-blue-50/40")}>
                                        {userRole === 'ADMIN' && (
                                          <td className="px-6 py-4 text-center">
                                            <input 
                                              type="checkbox"
                                              className="rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500/10 h-4 w-4 cursor-pointer transition-all"
                                              checked={selectedViolationIds.includes(detail.id)}
                                              onChange={() => handleSelectViolation(detail.id)}
                                            />
                                          </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-slate-400 uppercase tracking-widest">
                                          {detail.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-700 tracking-tight">
                                          {detail.studentName}
                                        </td>
                                          <td className="px-6 py-4 text-sm text-slate-600">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className={cn("font-black px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-widest border", detail.points < 0 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100")}>
                                                {detail.type}
                                              </span> 
                                              <span className={cn(
                                                "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border",
                                                detail.points > 0 ? "bg-emerald-100 text-emerald-600 border-emerald-200" : 
                                                detail.isCollective ? "bg-amber-100 text-amber-600 border-amber-200" : "bg-slate-100 text-slate-500 border-slate-200"
                                              )}>
                                                {detail.points > 0 ? 'Khen thưởng' : detail.isCollective ? 'Tập thể' : 'Cá nhân'}
                                              </span>
                                            </div>
                                            <div className="font-bold mt-1">{detail.note}</div>
                                            <div className="text-[9px] text-slate-400 mt-1 font-black uppercase tracking-widest">
                                              Ghi nhận: {detail.recordedBy}
                                            </div>
                                          </td>
                                        <td className={cn("px-6 py-4 whitespace-nowrap text-right text-lg font-black tracking-tight", detail.points < 0 ? "text-rose-500" : "text-emerald-500")}>
                                          <div className="flex flex-col items-end">
                                            <span>{detail.points > 0 ? '+' : ''}{detail.points * (isGoodStudyWeek ? 2 : 1)}</span>
                                            {isGoodStudyWeek && <span className="text-[8px] opacity-50">({detail.points > 0 ? '+' : ''}{detail.points} x 2)</span>}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                          {(userRole === 'ADMIN' || detail.recordedBy === currentUser?.name) && onDeleteViolations && (
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Bạn có chắc chắn muốn xoá bản ghi này?')) {
                                                  onDeleteViolations([detail.id]);
                                                }
                                              }}
                                              className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                              title="Xoá bản ghi"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="p-16 text-center">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                                  <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <p className="text-lg font-black text-slate-800 tracking-tight">Không có biến động</p>
                                <p className="text-sm text-slate-400 mt-2 font-bold">Lớp {item.className} giữ nguyên điểm sàn trong giai đoạn này.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        </div>
        
        {rankingData.length === 0 && (
          <div className="py-32 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <Filter className="w-12 h-12 text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Chưa có dữ liệu cho giai đoạn này</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RankingBoard;
