
import React, { useState, useMemo, useEffect } from 'react';
import { Student, ViolationRecord, ViolationType, User } from '../types';
import { VIOLATION_CATEGORIES, VIOLATION_GROUPED, TASKFORCE_ACCESS_CODE, MONITOR_ACCESS_CODE } from '../constants';
import { mockNow, getSchoolWeekInfo, parseDate } from '../src/utils/dateUtils';
import { 
  BookOpen, 
  PenLine, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  UserCheck, 
  Save, 
  Send,
  Loader2,
  Lock,
  Minus,
  Plus,
  AlertTriangle,
  Calendar,
  Users,
  Trophy,
  FileText,
  Table as TableIcon,
  ArrowUp,
  ArrowDown,
  Filter
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ClassMonitorPortalProps {
  students: Student[];
  violations: ViolationRecord[];
  onAddRecord: (record: ViolationRecord) => void;
  onClose?: () => void;
  mode?: 'modal' | 'inline';
  currentUser?: User | null;
}


type SessionId = 
  | 'm_mon' | 'm_tue' | 'm_wed' | 'm_thu' | 'm_fri' 
  | 'a_mon' | 'a_wed' 
  | 'b_1' | 'b_2';

const SCHEDULE_SESSIONS: { id: SessionId; label: string; group: 'morning' | 'afternoon' | 'makeup' }[] = [
  { id: 'm_mon', label: 'Sáng Thứ 2', group: 'morning' },
  { id: 'm_tue', label: 'Sáng Thứ 3', group: 'morning' },
  { id: 'm_wed', label: 'Sáng Thứ 4', group: 'morning' },
  { id: 'm_thu', label: 'Sáng Thứ 5', group: 'morning' },
  { id: 'm_fri', label: 'Sáng Thứ 6', group: 'morning' },
  { id: 'a_mon', label: 'Chiều Thứ 2', group: 'afternoon' },
  { id: 'a_wed', label: 'Chiều Thứ 4', group: 'afternoon' },
  { id: 'b_1', label: 'Bù 1', group: 'makeup' },
  { id: 'b_2', label: 'Bù 2', group: 'makeup' },
];

const PERIOD_NAMES = ['Tiết 1', 'Tiết 2', 'Tiết 3', 'Tiết 4', 'Tiết 5'];

const QUICK_REASONS = [
  'Học sinh tích cực',
  'Lớp học nghiêm túc',
  'Vắng nhiều',
  'Ồn ào',
  'Không thuộc bài',
  'Làm việc riêng',
  'Vệ sinh chưa sạch',
  'Không đồng phục',
  'Sử dụng điện thoại'
];

interface PeriodRecord {
  rank: 'A' | 'B' | 'C' | 'D';
  reason: string;
}

const ACCESS_PIN = '1234'; 

const ClassMonitorPortal: React.FC<ClassMonitorPortalProps> = ({ 
  students, 
  violations,
  onAddRecord, 
  onClose,
  mode = 'modal',
  currentUser
}) => {
  const isModal = mode === 'modal';
  
  // Logic: Auto-authenticate if user is passed and has appropriate role
  const isPrivilegedUser = currentUser && ['ADMIN', 'TEACHER', 'TASKFORCE'].includes(currentUser.role);
  
  // RBAC: Only ADMIN and MONITOR can edit. TEACHER and PARENT can only view.
  const canEdit = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'MONITOR');
  const canView = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'MONITOR' || currentUser.role === 'TEACHER' || currentUser.role === 'PARENT');

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
     if (!isModal && !!currentUser) return true;
     if (isPrivilegedUser) return true;
     return false;
  });

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [selectedClass, setSelectedClass] = useState('');
  const [activeTab, setActiveTab] = useState<'individual' | 'class' | 'weekly' | 'comparison'>('class');
  const [selectedWeek, setSelectedWeek] = useState<number>(() => getSchoolWeekInfo(mockNow).week);
  
  // Schedule State
  const [selectedSessionId, setSelectedSessionId] = useState<SessionId>('m_mon');
  const [selectedPeriod, setSelectedPeriod] = useState('Tiết 1');
  
  // Shared State
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'periods' | 'attendance'>('periods');

  // Individual Tab State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [selectedType, setSelectedType] = useState<ViolationType>('Đi học trễ');

  // Class Summary Tab State - Periods
  const [periodRecords, setPeriodRecords] = useState<Record<string, PeriodRecord>>(() => {
    const initial: Record<string, PeriodRecord> = {};
    PERIOD_NAMES.forEach(p => {
      initial[p] = { rank: 'A', reason: '' };
    });
    return initial;
  });
  
  const [absentStudents, setAbsentStudents] = useState<string[]>([]);
  const [absenceReason, setAbsenceReason] = useState<'Vắng có phép' | 'Vắng không phép'>('Vắng có phép');

  const classes = useMemo(() => Array.from(new Set(students.map(s => s.class))).sort(), [students]);
  
  const classStudents = useMemo(() => {
    return students.filter(s => s.class === selectedClass);
  }, [students, selectedClass]);

  const categories = ['Tất cả', ...Object.keys(VIOLATION_GROUPED).filter(c => c !== 'Khen thưởng')];

  const displayedViolations = useMemo(() => {
    if (selectedCategory === 'Tất cả') {
      return (Object.keys(VIOLATION_CATEGORIES) as ViolationType[]).filter(v => 
        v !== 'Điểm phát sinh' && 
        !v.includes('Tiết') && 
        !v.includes('(Lớp)') &&
        !['Không ghi sĩ số', 'Không chốt sĩ số', 'Trực nhật chậm', 'Không trực nhật/đổ rác', 'Không lao động', 'Không hoàn thành nhiệm vụ trực tuần', 'Thiếu dụng cụ lớp', 'Xả rác nơi tập trung', 'Không bình hoa/khẩu hiệu'].includes(v)
      );
    }
    return (VIOLATION_GROUPED[selectedCategory] || []).filter(v => 
      !v.includes('(Lớp)') && 
      !v.includes('Tiết') &&
      !['Không ghi sĩ số', 'Không chốt sĩ số', 'Trực nhật chậm', 'Không trực nhật/đổ rác', 'Không lao động', 'Không hoàn thành nhiệm vụ trực tuần', 'Thiếu dụng cụ lớp', 'Xả rác nơi tập trung', 'Không bình hoa/khẩu hiệu'].includes(v)
    );
  }, [selectedCategory]);

  // Auto-select class if user has assigned class
  useEffect(() => {
    if (currentUser?.assignedClass) {
      setSelectedClass(currentUser.assignedClass);
    }
  }, [currentUser]);

  // Auto-detect session based on time
  useEffect(() => {
    const now = mockNow;
    const hour = now.getHours();
    const day = now.getDay(); // 0: Sun, 1: Mon, ...

    if (day >= 1 && day <= 5) {
      if (hour < 12) {
        const id = `m_${['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][day].substring(0, 3)}` as SessionId;
        setSelectedSessionId(id);
      } else {
        if (day === 1 || day === 3) {
          const id = `a_${['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][day].substring(0, 3)}` as SessionId;
          setSelectedSessionId(id);
        }
      }
    }
  }, []);

  const currentSession = SCHEDULE_SESSIONS.find(s => s.id === selectedSessionId) || SCHEDULE_SESSIONS[0];

  const getScheduleWarning = () => {
    const today = mockNow.getDay();
    const sessionDay = selectedSessionId.includes('mon') ? 1 : 
                       selectedSessionId.includes('tue') ? 2 :
                       selectedSessionId.includes('wed') ? 3 :
                       selectedSessionId.includes('thu') ? 4 :
                       selectedSessionId.includes('fri') ? 5 : -1;
    
    if (sessionDay !== -1 && today !== sessionDay && !selectedSessionId.startsWith('b_')) {
      return `Lưu ý: Bạn đang chọn buổi học của Thứ ${sessionDay + 1}, nhưng hôm nay là Thứ ${today + 1}.`;
    }
    return '';
  };

  const scheduleWarning = getScheduleWarning();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const isTaskforce = pin === TASKFORCE_ACCESS_CODE;
    const isMonitor = pin === MONITOR_ACCESS_CODE;

    if (isTaskforce || isMonitor) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Mã bảo vệ không chính xác.');
      setPin('');
    }
  };

  const updatePeriodRecord = (period: string, field: keyof PeriodRecord, value: string) => {
    setPeriodRecords(prev => ({
      ...prev,
      [period]: { ...prev[period], [field]: value }
    }));
  };

  const handleSetAllA = () => {
    const allA: Record<string, PeriodRecord> = {};
    PERIOD_NAMES.forEach(p => {
      allA[p] = { rank: 'A', reason: '' };
    });
    setPeriodRecords(allA);
  };

  const handleApplyReasonToAll = (reason: string) => {
    setPeriodRecords(prev => {
      const next = { ...prev };
      PERIOD_NAMES.forEach(p => {
        next[p] = { ...next[p], reason };
      });
      return next;
    });
  };

  const handleClearAllReasons = () => {
    setPeriodRecords(prev => {
      const next = { ...prev };
      PERIOD_NAMES.forEach(p => {
        next[p] = { ...next[p], reason: '' };
      });
      return next;
    });
  };

  const handleSubmitIndividual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudentId) return;
    
    setIsSubmitting(true);
    const student = students.find(s => s.id === selectedStudentId);
    
    if (student) {
      const newRecord: ViolationRecord = {
        id: `M-${Date.now()}`,
        studentId: student.id,
        studentName: student.name,
        className: student.class,
        type: selectedType,
        points: VIOLATION_CATEGORIES[selectedType],
        date: mockNow.toLocaleDateString('vi-VN'),
        note: `[${currentSession.label} - ${selectedPeriod}] ${note}`,
        recordedBy: currentUser?.name || `Cán sự lớp ${selectedClass}`,
        recordedRole: currentUser?.role || 'MONITOR',
        isCollective: false
      };

      onAddRecord(newRecord);
      
      setSuccessMsg(`Đã ghi nhận: ${student.name} - ${selectedType}`);
      setNote('');
      setSelectedStudentId(''); 
      setTimeout(() => {
          setSuccessMsg('');
          setIsSubmitting(false);
      }, 1500);
    }
  };

  const handleSubmitClassSummary = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedClass) return;
      setIsSubmitting(true);
      
      const recordsToAdd: ViolationRecord[] = [];
      const dateStr = mockNow.toLocaleDateString('vi-VN');
      const recorderName = currentUser?.name || `Cán sự lớp ${selectedClass}`;

      // Process Periods
      (Object.entries(periodRecords) as [string, PeriodRecord][]).forEach(([periodName, record]) => {
          if (record.rank !== 'A') {
              const violationType = `Tiết ${record.rank}` as ViolationType;
              recordsToAdd.push({
                  id: `M-CLASS-${Date.now()}-${periodName}`,
                  studentId: `CLASS-${selectedClass}`, 
                  studentName: `TẬP THỂ LỚP ${selectedClass}`, 
                  className: selectedClass,
                  type: violationType,
                  points: VIOLATION_CATEGORIES[violationType],
                  date: dateStr,
                  note: `[${currentSession.label} - ${periodName}] Xếp loại: ${record.rank}. Lời phê: ${record.reason || 'Không ghi'}`,
                  recordedBy: recorderName,
                  recordedRole: currentUser?.role || 'MONITOR',
                  isCollective: true
              });
          }
      });

      // Process Attendance
      absentStudents.forEach(studentId => {
          const student = classStudents.find(s => s.id === studentId);
          if (student) {
              recordsToAdd.push({
                  id: `M-ABS-${Date.now()}-${studentId}`,
                  studentId: student.id,
                  studentName: student.name,
                  className: selectedClass,
                  type: absenceReason,
                  points: VIOLATION_CATEGORIES[absenceReason],
                  date: dateStr,
                  note: `[${currentSession.label} - Điểm danh] ${note}`,
                  recordedBy: recorderName,
                  recordedRole: currentUser?.role || 'MONITOR',
                  isCollective: false
              });
          }
      });

      if (recordsToAdd.length > 0) {
          recordsToAdd.forEach(rec => onAddRecord(rec));
          setSuccessMsg(`Đã lưu ${recordsToAdd.length} bản ghi tổng hợp.`);
          
          // Reset
          const resetPeriods: Record<string, PeriodRecord> = {};
          PERIOD_NAMES.forEach(p => resetPeriods[p] = { rank: 'A', reason: '' });
          setPeriodRecords(resetPeriods);
          
          setAbsentStudents([]);
          setNote('');
          setTimeout(() => {
            setSuccessMsg('');
            setIsSubmitting(false);
          }, 1500);
      } else {
          setIsSubmitting(false);
      }
  };

  const toggleAbsentStudent = (id: string) => {
      setAbsentStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };
  
  const hasChanges = (Object.values(periodRecords) as PeriodRecord[]).some(r => r.rank !== 'A') || absentStudents.length > 0;

  // Styles for modal vs inline
  const wrapperClass = isModal 
    ? "fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
    : "h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500";
    
  const containerClass = isModal
    ? "bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in slide-in-from-bottom-5 overflow-hidden flex flex-col max-h-[90vh]"
    : "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full";

  const headerClass = isModal 
    ? 'bg-purple-600 p-6 flex justify-between items-center text-white'
    : 'bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex justify-between items-center text-white rounded-t-xl';

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass-card rounded-2xl">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-800 font-display">Truy cập bị từ chối</h3>
        <p className="text-sm text-slate-500 text-center mt-2 max-w-xs">
          Bạn không có quyền truy cập vào Sổ Đầu Bài. Vui lòng liên hệ Quản trị viên nếu đây là một lỗi.
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="glass-card rounded-2xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
          <div className="text-center mb-6">
             <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-800 font-display">Cổng Sổ Đầu Bài</h3>
            <p className="text-xs text-slate-500 font-bold uppercase mt-1">Dành cho Cán sự lớp • TNXK • Quản trị</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nhập mã bảo vệ</label>
              <input 
                type="password" 
                className="w-full text-center text-2xl tracking-widest px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700"
                placeholder="••••"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
              />
              {error && <p className="text-xs text-rose-500 font-bold mt-2 text-center">{error}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <button 
                    type="button" 
                    onClick={onClose}
                    className="w-full py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors neo-button"
                >
                    Hủy
                </button>
                <button 
                    type="submit" 
                    className="w-full py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-colors neo-button"
                >
                    Truy cập
                </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 italic mt-2">
                * Giáo viên và TNXK được tự động đăng nhập khi truy cập từ Dashboard.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        {/* Header */}
        <div className={headerClass}>
          <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <PenLine className="w-5 h-5" />
             </div>
             <div>
                <h3 className="font-bold text-lg">Cập nhật Sổ Đầu Bài</h3>
                <p className="text-[10px] text-purple-200 uppercase font-bold tracking-wider">
                  {currentUser?.assignedClass ? `Lớp ${currentUser.assignedClass}` : 'Hệ thống ghi nhận nhanh'}
                </p>
             </div>
          </div>
          {isModal && onClose && (
            <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50">
            <button
                onClick={() => setActiveTab('individual')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'individual' ? 'bg-white text-purple-600 border-t-2 border-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Vi phạm Cá nhân
            </button>
            <button
                onClick={() => setActiveTab('class')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'class' ? 'bg-white text-purple-600 border-t-2 border-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Tổng hợp Tiết học
            </button>
            <button
                onClick={() => setActiveTab('weekly')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'weekly' ? 'bg-white text-purple-600 border-t-2 border-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Xem Tuần
            </button>
            {currentUser?.role === 'ADMIN' && (
                <button
                    onClick={() => setActiveTab('comparison')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'comparison' ? 'bg-white text-purple-600 border-t-2 border-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Đối chiếu Toàn trường
                </button>
            )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {successMsg && (
            <div className="mb-6 bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-2 shadow-sm border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </div>
          )}

          {/* Session Selector */}
          <div className="mb-6 space-y-3">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Chọn buổi học</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {SCHEDULE_SESSIONS.map((s) => (
                  <button
                      key={s.id}
                      onClick={() => setSelectedSessionId(s.id)}
                      className={`py-2 px-2 rounded-xl text-[10px] font-black transition-all duration-200 border ${
                          selectedSessionId === s.id 
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-100' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-purple-300 hover:text-purple-600'
                      }`}
                  >
                      {s.label}
                  </button>
              ))}
            </div>
          </div>
          
          {scheduleWarning && (
             <div className="mb-6 text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg flex items-center gap-2">
                 <AlertCircle className="w-3.5 h-3.5" />
                 {scheduleWarning}
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Chọn Lớp (Common) */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Lớp học</label>
                    <select
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 transition-colors ${currentUser?.assignedClass ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-500' : 'bg-slate-50 border-slate-200 hover:bg-white focus:bg-white'}`}
                        value={selectedClass}
                        onChange={(e) => {
                            if (!currentUser?.assignedClass) {
                                setSelectedClass(e.target.value);
                                setSelectedStudentId('');
                                setAbsentStudents([]);
                            }
                        }}
                        disabled={!!currentUser?.assignedClass}
                        required
                    >
                        <option value="">-- Chọn lớp --</option>
                        {classes.map(c => <option key={c} value={c}>Lớp {c}</option>)}
                    </select>
                    {currentUser?.assignedClass && <p className="text-[10px] text-slate-400 mt-1 italic flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Lớp đã được gán mặc định cho bạn</p>}
                </div>

                {/* Chọn Tiết (Common) */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Tiết học đang ghi nhận
                    </label>
                    <select
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 hover:bg-white focus:bg-white transition-colors"
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                    >
                        {PERIOD_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>

          {activeTab === 'individual' ? (
              <form onSubmit={handleSubmitIndividual} className="space-y-6 animate-in fade-in duration-300">
                {/* Category Filter */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Danh mục vi phạm</label>
                      <div className="flex items-center gap-1 overflow-x-auto pb-2 custom-scrollbar max-w-[200px] sm:max-w-none">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                              "px-2 py-1 rounded-full text-[9px] font-black whitespace-nowrap transition-all",
                              selectedCategory === cat 
                                ? "bg-purple-600 text-white shadow-sm" 
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {displayedViolations.map(type => {
                            const isSelected = selectedType === type;
                            const points = VIOLATION_CATEGORIES[type];
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setSelectedType(type)}
                                    className={`text-[10px] font-bold p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 min-h-[60px] ${
                                        isSelected 
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-600'
                                    }`}
                                >
                                    <span className="leading-tight">{type}</span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                                        isSelected ? 'bg-white/20 text-white' : points > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                                    }`}>
                                        {points > 0 ? '+' : ''}{points}đ
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Chọn Học sinh & Ghi chú */}
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Học sinh vi phạm</label>
                        <select
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium transition-colors ${!selectedClass ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-200 hover:bg-white focus:bg-white text-slate-700'}`}
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            disabled={!selectedClass}
                            required
                        >
                            <option value="">{selectedClass ? '-- Chọn học sinh --' : 'Vui lòng chọn lớp trước'}</option>
                            {classStudents.map(s => (
                                <option key={s.id} value={s.id}>{s.id} - {s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ghi chú thêm</label>
                        <input 
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm transition-colors hover:bg-white focus:bg-white"
                            placeholder="Chi tiết lỗi..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || !selectedClass || !selectedStudentId}
                        className={cn(
                            "px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2",
                            (isSubmitting || !selectedClass || !selectedStudentId)
                            ? "bg-slate-300 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-700 hover:shadow-purple-200 hover:-translate-y-1"
                        )}
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Gửi báo cáo
                    </button>
                </div>
              </form>
          ) : activeTab === 'class' ? (
              <form onSubmit={handleSubmitClassSummary} className="space-y-8 animate-in fade-in duration-300">
                  {/* Sub Tabs for Class Summary */}
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                      <button 
                        type="button"
                        onClick={() => setActiveSubTab('periods')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'periods' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        Xếp loại Tiết học
                      </button>
                      <button 
                        type="button"
                        onClick={() => setActiveSubTab('attendance')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'attendance' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        Sĩ số & Điểm danh
                      </button>
                  </div>

                  {activeSubTab === 'periods' ? (
                            <div className="space-y-6">
                                {/* Horizontal Entry Layout (Sổ đầu bài style) */}
                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">Tiết</th>
                                                {PERIOD_NAMES.map(p => (
                                                    <th key={p} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-l border-slate-100">
                                                        {p}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {/* Rank Row */}
                                            <tr>
                                                <td className="px-4 py-6 text-xs font-black text-slate-500 bg-slate-50/30">Xếp loại</td>
                                                {PERIOD_NAMES.map(p => (
                                                    <td key={p} className="px-4 py-6 border-l border-slate-100">
                                                        <div className="flex flex-col gap-1 items-center">
                                                            {(['A', 'B', 'C', 'D'] as const).map((rank) => (
                                                                <button
                                                                    key={rank}
                                                                    type="button"
                                                                    disabled={!canEdit}
                                                                    onClick={() => updatePeriodRecord(p, 'rank', rank)}
                                                                    className={`w-full py-1.5 rounded-lg text-[10px] font-black transition-all border ${
                                                                        periodRecords[p].rank === rank
                                                                        ? rank === 'A' ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-rose-500 text-white border-rose-500 shadow-sm'
                                                                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                                                    } ${!canEdit && 'opacity-80 cursor-not-allowed'}`}
                                                                >
                                                                    {rank}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                            {/* Remark Row */}
                                            <tr>
                                                <td className="px-4 py-6 text-xs font-black text-slate-500 bg-slate-50/30">Lời phê</td>
                                                {PERIOD_NAMES.map(p => (
                                                    <td key={p} className="px-4 py-6 border-l border-slate-100 align-top">
                                                        <textarea 
                                                            disabled={!canEdit}
                                                            rows={4}
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium focus:ring-2 focus:ring-purple-500 outline-none transition-all disabled:opacity-50 resize-none"
                                                            placeholder="Nhập lời phê..."
                                                            value={periodRecords[p].reason}
                                                            onChange={(e) => updatePeriodRecord(p, 'reason', e.target.value)}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {canEdit && (
                                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Công cụ nhập liệu nhanh</p>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleSetAllA}
                                                    className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" /> Tất cả loại A
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleClearAllReasons}
                                                    className="px-4 py-1.5 bg-white text-slate-500 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-2"
                                                >
                                                    <X className="w-3 h-3" /> Xóa lời phê
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {QUICK_REASONS.map(reason => (
                                                <button
                                                    key={reason}
                                                    type="button"
                                                    onClick={() => handleApplyReasonToAll(reason)}
                                                    className="text-[10px] font-bold px-3 py-1.5 bg-white text-purple-600 rounded-lg border border-purple-200 hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    Gán "{reason}"
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
                                        * Hệ thống sẽ tự động tạo các bản ghi vi phạm cho các tiết xếp loại B, C, D. Tiết A được ghi nhận là đạt yêu cầu và không trừ điểm.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Attendance Section */}
                                <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-blue-800 flex items-center gap-2">
                                            <UserCheck className="w-4 h-4" /> Điểm danh Vắng
                                        </h4>
                                        <div className="flex bg-white rounded-lg p-1 border border-blue-200">
                                            <button
                                                type="button"
                                                disabled={!canEdit}
                                                onClick={() => setAbsenceReason('Vắng có phép')}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${absenceReason === 'Vắng có phép' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'} ${!canEdit && 'opacity-50 cursor-not-allowed'}`}
                                            >
                                                Có phép
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!canEdit}
                                                onClick={() => setAbsenceReason('Vắng không phép')}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${absenceReason === 'Vắng không phép' ? 'bg-rose-100 text-rose-700' : 'text-slate-500 hover:bg-slate-50'} ${!canEdit && 'opacity-50 cursor-not-allowed'}`}
                                            >
                                                Không phép
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {!selectedClass ? (
                                        <div className="text-center py-4 text-slate-400 italic text-sm">Vui lòng chọn lớp để hiển thị danh sách</div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                            {classStudents.map(s => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    disabled={!canEdit}
                                                    onClick={() => toggleAbsentStudent(s.id)}
                                                    className={`text-left px-3 py-2 rounded-lg text-xs font-bold border transition-all truncate ${
                                                        absentStudents.includes(s.id)
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                                    } ${!canEdit && 'opacity-80 cursor-not-allowed'}`}
                                                >
                                                    {s.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-500 mt-2 italic text-right">Đã chọn: {absentStudents.length} học sinh</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ghi chú chung cho buổi học</label>
                                    <input 
                                        type="text"
                                        disabled={!canEdit}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm transition-colors hover:bg-white focus:bg-white disabled:opacity-50"
                                        placeholder="Thông tin bổ sung về sĩ số hoặc tình hình lớp..."
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                      {canEdit ? (
                          <button
                              type="submit"
                              disabled={isSubmitting || !hasChanges}
                              className={cn(
                                  "px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2",
                                  (isSubmitting || !hasChanges)
                                  ? "bg-slate-300 cursor-not-allowed"
                                  : "bg-purple-600 hover:bg-purple-700 hover:shadow-purple-200 hover:-translate-y-1"
                              )}
                          >
                              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              Lưu Sổ Đầu Bài
                          </button>
                      ) : (
                          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                              <Lock className="w-3.5 h-3.5" /> Chế độ chỉ xem
                          </div>
                      )}
                  </div>
              </form>
          ) : null}

          {activeTab === 'weekly' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        Tổng hợp tiết học trong tuần
                    </h4>
                    <div className="flex items-center gap-2">
                        <select 
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(Number(e.target.value))}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                                <option key={w} value={w}>Tuần {w}</option>
                            ))}
                        </select>
                        <button 
                            onClick={() => {
                                const doc = new jsPDF('l', 'mm', 'a4');
                                doc.text(`BAO CAO TUAN ${selectedWeek} - LOP ${selectedClass}`, 14, 15);
                                const rows = SCHEDULE_SESSIONS.map(session => {
                                    const sessionRecords = violations.filter(v => 
                                        v.className === selectedClass && 
                                        v.note.includes(`[${session.label}`) &&
                                        getSchoolWeekInfo(new Date(v.date.split('/').reverse().join('-'))).week === selectedWeek
                                    );
                                    return [session.label, session.group, sessionRecords.length];
                                });
                                autoTable(doc, {
                                    head: [['Buoi hoc', 'Nhom', 'So vi pham']],
                                    body: rows,
                                    startY: 25
                                });
                                doc.save(`Bao_cao_tuan_${selectedWeek}_${selectedClass}.pdf`);
                            }}
                            className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                            title="Xuất PDF"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => {
                                const rows = SCHEDULE_SESSIONS.map(session => {
                                    const sessionRecords = violations.filter(v => 
                                        v.className === selectedClass && 
                                        v.note.includes(`[${session.label}`) &&
                                        getSchoolWeekInfo(new Date(v.date.split('/').reverse().join('-'))).week === selectedWeek
                                    );
                                    return { 'Buổi học': session.label, 'Nhóm': session.group, 'Số vi phạm': sessionRecords.length };
                                });
                                const ws = XLSX.utils.json_to_sheet(rows);
                                const wb = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(wb, ws, "Báo cáo tuần");
                                XLSX.writeFile(wb, `Bao_cao_tuan_${selectedWeek}_${selectedClass}.xlsx`);
                            }}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                            title="Xuất Excel"
                        >
                            <TableIcon className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full ml-2">Lớp {selectedClass || '...'}</span>
                    </div>
                </div>

                {!selectedClass ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-sm text-slate-400 italic">Vui lòng chọn lớp để xem dữ liệu tuần</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {SCHEDULE_SESSIONS.map(session => {
                            // Lọc các vi phạm của lớp này trong buổi học này và tuần này
                            const sessionRecords = violations.filter(v => 
                                v.className === selectedClass && 
                                v.note.includes(`[${session.label}`) &&
                                getSchoolWeekInfo(new Date(v.date.split('/').reverse().join('-'))).week === selectedWeek
                            );

                            return (
                                <div key={session.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-black text-slate-700">{session.label}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{session.group}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {PERIOD_NAMES.map((p, i) => {
                                            const periodRecord = sessionRecords.find(v => v.note.includes(p));
                                            let rank: 'A' | 'B' | 'C' | 'D' = 'A';
                                            if (periodRecord) {
                                                if (periodRecord.type === 'Tiết B') rank = 'B';
                                                else if (periodRecord.type === 'Tiết C') rank = 'C';
                                                else if (periodRecord.type === 'Tiết D') rank = 'D';
                                            }

                                            return (
                                                <div 
                                                    key={i} 
                                                    title={`${p}: Loại ${rank}`}
                                                    className={cn(
                                                        "flex-1 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white transition-colors",
                                                        rank === 'A' ? "bg-emerald-500" : "bg-rose-500"
                                                    )}
                                                >
                                                    {rank}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        {sessionRecords.length > 0 ? (
                                            sessionRecords.filter(v => v.type.startsWith('Tiết')).map((v, idx) => (
                                                <p key={idx} className="text-[9px] text-slate-500 leading-tight">
                                                    <span className="font-bold text-rose-600">{v.type}:</span> {v.note.split('Lời phê: ')[1] || 'Không ghi'}
                                                </p>
                                            ))
                                        ) : (
                                            <p className="text-[9px] text-slate-400 italic">Tất cả tiết học loại A</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                        Dữ liệu trên đây là tổng hợp từ các bản ghi Sổ Đầu Bài đã được lưu trong tuần hiện tại. Nếu có sai sót, vui lòng liên hệ Ban Giám Hiệu hoặc Quản trị viên để điều chỉnh.
                    </p>
                </div>
            </div>
          )}

          {activeTab === 'comparison' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        Bảng đối chiếu Sổ Đầu Bài toàn trường
                    </h4>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Tốt (A)</span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full"></div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Vi phạm (B/C/D)</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 sticky left-0 bg-slate-50 z-10">Lớp</th>
                                {SCHEDULE_SESSIONS.map(s => (
                                    <th key={s.id} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-l border-slate-100">
                                        {s.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {classes.map(cls => (
                                <tr key={cls} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-4 py-4 text-xs font-black text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        Lớp {cls}
                                    </td>
                                    {SCHEDULE_SESSIONS.map(s => {
                                         const sessionViolations = violations.filter(v => 
                                             v.className === cls && 
                                             v.note.includes(`[${s.label}]`) &&
                                             v.type.startsWith('Tiết ')
                                         );
                                         
                                         const isRecorded = sessionViolations.length > 0;
                                         
                                         return (
                                             <td key={s.id} className="px-2 py-3 border-l border-slate-100">
                                                 {isRecorded ? (
                                                     <div className="flex gap-0.5 justify-center">
                                                         {PERIOD_NAMES.map(p => {
                                                             const periodViolation = sessionViolations.find(v => v.note.includes(p));
                                                             const rank = periodViolation ? periodViolation.type.replace('Tiết ', '') : 'A';
                                                             const isBad = rank !== 'A';
                                                             
                                                             return (
                                                                 <div 
                                                                     key={p} 
                                                                     title={`${p}: Loại ${rank}`}
                                                                     className={cn(
                                                                         "w-2.5 h-4 rounded-sm transition-all hover:scale-110",
                                                                         isBad ? "bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.3)]" : "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.2)]"
                                                                     )}
                                                                 />
                                                             );
                                                         })}
                                                     </div>
                                                 ) : (
                                                     <div className="text-[9px] text-slate-300 font-bold text-center italic">Chưa chốt</div>
                                                 )}
                                             </td>
                                         );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                        Bảng đối chiếu giúp Ban Giám Hiệu và Đoàn trường theo dõi tiến độ cập nhật Sổ Đầu Bài của các lớp trong thời gian thực. Các ô màu đại diện cho 5 tiết học trong buổi: <span className="text-emerald-600 font-black">Xanh (Loại A)</span>, <span className="text-rose-600 font-black">Đỏ (Loại B/C/D)</span>.
                    </p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassMonitorPortal;
