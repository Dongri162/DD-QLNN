
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, ViolationType, ViolationRecord, Role } from '../types';
import { VIOLATION_CATEGORIES, AUTO_POINT_CRITERIA, VIOLATION_GROUPED } from '../constants';
import { mockNow, getSchoolWeekInfo, parseDate } from '../src/utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  UserPlus, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Trash2, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Plus,
  X,
  Lock,
  Filter,
  Clock,
  Bell
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ViolationFormProps {
  students: Student[];
  onAddRecord: (record: ViolationRecord) => void;
  userRole: Role;
  initialStudentId?: string;
  onAddNotification?: (notif: { studentName: string; parentName: string; type: string }) => void;
}

const TASKFORCE_COMMON: ViolationType[] = [
  'Đi học trễ', 
  'Không đồng phục', 
  'Tác phong không nghiêm túc', 
  'Sử dụng điện thoại', 
  'Ăn quà vặt',
  'Vắng không phép'
];

const ViolationForm: React.FC<ViolationFormProps> = ({ students, onAddRecord, userRole, initialStudentId, onAddNotification }) => {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(initialStudentId ? [initialStudentId] : []);
  const [sendNotification, setSendNotification] = useState(true);
  
  // RBAC: GVCN (TEACHER) and PARENT are not allowed to access TNXK tools
  if (userRole === 'TEACHER' || userRole === 'PARENT') {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass-card rounded-2xl">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-800 font-display">Truy cập bị từ chối</h3>
        <p className="text-sm text-slate-500 text-center mt-2 max-w-xs">
          Bạn không có quyền truy cập vào công cụ ghi nhận vi phạm TNXK. Vui lòng sử dụng Sổ Đầu Bài để ghi nhận nề nếp lớp.
        </p>
      </div>
    );
  }

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [selectedTypes, setSelectedTypes] = useState<ViolationType[]>([]);
  const [isCollective, setIsCollective] = useState<boolean>(false);
  const [customPoints, setCustomPoints] = useState<number>(0);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentRecords, setRecentRecords] = useState<ViolationRecord[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // Lấy danh sách các lớp duy nhất và sắp xếp
  const classes = useMemo(() => {
    const uniqueClasses = new Set(students.map(s => s.class));
    return Array.from(uniqueClasses).sort();
  }, [students]);

  // Lọc danh sách học sinh dựa trên lớp và search term
  const filteredStudents = useMemo(() => {
    let result = students;
    if (selectedClass) {
      result = result.filter(s => s.class === selectedClass);
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(lowerSearch) || 
        s.id.toLowerCase().includes(lowerSearch)
      );
    }
    return result;
  }, [students, selectedClass, searchTerm]);

  // Tự động set lớp nếu có initialStudentId
  useEffect(() => {
    if (initialStudentId) {
      const student = students.find(s => s.id === initialStudentId);
      if (student) {
        setSelectedClass(student.class);
        setSelectedStudentIds([initialStudentId]);
      }
    }
  }, [initialStudentId, students]);

  const handleTypeToggle = (type: ViolationType) => {
    if (type === 'Điểm phát sinh') {
      setSelectedTypes(['Điểm phát sinh']);
      setCustomPoints(0);
      return;
    }

    if (selectedTypes.includes('Điểm phát sinh')) {
      setSelectedTypes([type]);
      return;
    }

    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        const newState = prev.filter(t => t !== type);
        return newState;
      } else {
        return [...prev, type];
      }
    });
  };

  const handleStudentToggle = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAllInClass = () => {
    if (!selectedClass) return;
    const classIds = filteredStudents.map(s => s.id);
    const allSelected = classIds.every(id => selectedStudentIds.includes(id));
    
    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !classIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...classIds])));
    }
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    const allSelected = filteredIds.every(id => selectedStudentIds.includes(id));
    
    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTypes.length === 0) return;
    if (!isCollective && selectedStudentIds.length === 0) return;
    if (isCollective && !selectedClass) return;

    // Validation for custom points
    if (selectedTypes.includes('Điểm phát sinh')) {
      if (customPoints === 0) {
        alert('Vui lòng nhập số điểm cho mục "Khác..."');
        return;
      }
      if (!note.trim()) {
        alert('Vui lòng nhập ghi chú chi tiết khi sử dụng mục "Khác..."');
        return;
      }
    }

    setShowReview(true);
  };

  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    setShowReview(false);
    
    // Duplicate check (same student, same type, recently added)
    const isDuplicate = !isCollective && selectedStudentIds.some(sid => 
      recentRecords.some(r => r.studentId === sid && selectedTypes.includes(r.type as any))
    );

    if (isDuplicate && !window.confirm('CẢNH BÁO: Một hoặc nhiều học sinh đã được ghi nhận lỗi tương tự trong phiên này. Bạn có chắc chắn muốn tiếp tục?')) {
      setIsSubmitting(false);
      return;
    }

    const newAddedRecords: ViolationRecord[] = [];
    const dateStr = mockNow.toLocaleDateString('vi-VN');
    const recorderName = userRole === 'TASKFORCE' ? 'Đội TNXK' : 'Giáo viên/Admin';

    if (isCollective) {
      // Record once for the whole class
      selectedTypes.forEach((type, index) => {
        const points = type === 'Điểm phát sinh' ? customPoints : VIOLATION_CATEGORIES[type];
        const newRecord: ViolationRecord = {
          id: `V-CLASS-${Date.now()}-${selectedClass}-${index}`,
          studentId: `CLASS-${selectedClass}`,
          studentName: `TẬP THỂ LỚP ${selectedClass}`,
          className: selectedClass,
          type,
          points: points,
          date: dateStr,
          note,
          recordedBy: recorderName,
          recordedRole: userRole,
          isCollective: true
        };
        onAddRecord(newRecord);
        newAddedRecords.push(newRecord);
      });
    } else {
      // Record for each selected student
      selectedStudentIds.forEach(sid => {
        const student = students.find(s => s.id === sid);
        if (!student) return;

        selectedTypes.forEach((type, index) => {
          const points = type === 'Điểm phát sinh' ? customPoints : VIOLATION_CATEGORIES[type];
          
          const newRecord: ViolationRecord = {
            id: `V-${Date.now()}-${sid}-${index}`,
            studentId: student.id,
            studentName: student.name,
            className: student.class,
            type,
            points: points,
            date: dateStr,
            note,
            recordedBy: recorderName, 
            recordedRole: userRole,
            isCollective: false
          };
          
          onAddRecord(newRecord);
          newAddedRecords.push(newRecord);

          // Send notification if enabled
          if (sendNotification && onAddNotification) {
            onAddNotification({
              studentName: student.name,
              parentName: student.parentName || 'Phụ huynh',
              type: type
            });
          }
        });
      });
    }

    setRecentRecords(prev => [...newAddedRecords, ...prev].slice(0, 10));

    setTimeout(() => {
      if (!isCollective) setSelectedStudentIds([]); 
      setNote('');
      setCustomPoints(0);
      setSelectedTypes([]);
      setIsSubmitting(false);
    }, 600);
  };

  const categories = ['Tất cả', ...Object.keys(VIOLATION_GROUPED)];

  const displayedViolations = useMemo(() => {
    if (selectedCategory === 'Tất cả') {
      return (Object.keys(VIOLATION_CATEGORIES) as ViolationType[]).filter(v => v !== 'Điểm phát sinh');
    }
    return VIOLATION_GROUPED[selectedCategory] || [];
  }, [selectedCategory]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Student Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 font-display">
                  <Users className="w-4 h-4 text-blue-600" />
                  Chọn học sinh
                </h3>
                <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Đã chọn: {selectedStudentIds.length}
                </span>
              </div>
              
              <div className="space-y-3">
                <select
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">Tất cả các lớp</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>Lớp {cls}</option>
                  ))}
                </select>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Tìm tên hoặc mã số..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {isCollective ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">Ghi nhận Tập thể</h4>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">
                      Bạn đang ở chế độ ghi nhận lỗi cho tập thể. 
                      {selectedClass ? (
                        <> Lỗi sẽ được áp dụng cho toàn bộ <strong>Lớp {selectedClass}</strong>.</>
                      ) : (
                        <> Vui lòng chọn lớp ở phía trên.</>
                      )}
                    </p>
                  </div>
                  {selectedClass && (
                    <div className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-100 animate-bounce">
                      Lớp {selectedClass}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {selectedClass && (
                      <button 
                        type="button"
                        onClick={handleSelectAllInClass}
                        className={cn(
                          "p-2 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-2 border border-dashed",
                          filteredStudents.every(s => selectedStudentIds.includes(s.id))
                            ? "bg-rose-50 text-rose-600 border-rose-200"
                            : "bg-blue-50 text-blue-600 border-blue-200"
                        )}
                      >
                        {filteredStudents.every(s => selectedStudentIds.includes(s.id)) ? 'Bỏ chọn lớp' : `Chọn lớp ${selectedClass}`}
                      </button>
                    )}
                    {searchTerm && (
                      <button 
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className={cn(
                          "p-2 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-2 border border-dashed",
                          filteredStudents.every(s => selectedStudentIds.includes(s.id))
                            ? "bg-rose-50 text-rose-600 border-rose-200"
                            : "bg-indigo-50 text-indigo-600 border-indigo-200"
                        )}
                      >
                        {filteredStudents.every(s => selectedStudentIds.includes(s.id)) ? 'Bỏ chọn KQ' : 'Chọn KQ tìm kiếm'}
                      </button>
                    )}
                  </div>
                  
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                      <button
                        key={student.id}
                        onClick={() => handleStudentToggle(student.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 rounded-xl transition-all border group",
                          selectedStudentIds.includes(student.id)
                            ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                            : "bg-white border-transparent hover:bg-slate-50 text-slate-600"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors",
                            selectedStudentIds.includes(student.id) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                          )}>
                            {student.id.split('-').pop()}
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold leading-none mb-1">{student.name}</p>
                            <p className="text-[10px] font-medium opacity-60">Lớp {student.class}</p>
                          </div>
                        </div>
                        {selectedStudentIds.includes(student.id) && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </button>
                    ))
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-xs text-slate-400 font-medium">Không tìm thấy học sinh</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Violation Details & Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-16 -mt-16 opacity-50 pointer-events-none"></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                  userRole === 'TASKFORCE' ? "bg-amber-500 shadow-amber-200" : "bg-blue-600 shadow-blue-200"
                )}>
                  {userRole === 'TASKFORCE' ? <Zap className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight font-display">
                    {userRole === 'TASKFORCE' ? 'Cổng nhập liệu TNXK' : 'Ghi nhận Nề nếp'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Hệ thống quản lý thời gian thực
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowRecent(!showRecent)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all neo-button",
                  showRecent ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                <History className="w-3.5 h-3.5" />
                Lịch sử {recentRecords.length > 0 && `(${recentRecords.length})`}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              {/* Violation Type Selection (Individual vs Collective) */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phân loại lỗi:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCollective(false)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      !isCollective ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-400 border border-slate-200"
                    )}
                  >
                    Cá nhân
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCollective(true)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      isCollective ? "bg-purple-600 text-white shadow-md" : "bg-white text-slate-400 border border-slate-200"
                    )}
                  >
                    Tập thể
                  </button>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-300" />
                  <span className="text-[10px] font-medium text-slate-400 italic">
                    {isCollective ? "Lỗi này sẽ được tính cho tập thể lớp" : "Lỗi này sẽ được tính cho từng cá nhân"}
                  </span>
                </div>
              </div>

              {/* Violation Types Grid */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Nội dung vi phạm
                  </label>
                  
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap transition-all",
                          selectedCategory === cat 
                            ? "bg-slate-800 text-white shadow-md" 
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {displayedViolations.map(type => {
                    const isSelected = selectedTypes.includes(type);
                    const points = VIOLATION_CATEGORIES[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleTypeToggle(type)}
                        className={cn(
                          "relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 min-h-[80px]",
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100 scale-[1.02] z-10"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
                        )}
                      >
                        <span className="text-[10px] font-black text-center leading-tight mb-2">{type}</span>
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-full",
                          isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                        )}>
                          {points > 0 ? `+${points}` : points}đ
                        </span>
                        {isSelected && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                      </button>
                    );
                  })}
                  
                  <button
                    type="button"
                    onClick={() => handleTypeToggle('Điểm phát sinh')}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed transition-all duration-200 min-h-[80px]",
                      selectedTypes.includes('Điểm phát sinh')
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 scale-[1.02] z-10"
                        : "bg-indigo-50/30 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    )}
                  >
                    <Plus className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-black">Khác...</span>
                  </button>
                </div>

                {selectedTypes.includes('Điểm phát sinh') && (
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl space-y-4 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-indigo-400 uppercase mb-2">Mẫu có sẵn</label>
                        <select 
                          className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                          onChange={(e) => {
                            const criteria = AUTO_POINT_CRITERIA.find(c => c.label === e.target.value);
                            if (criteria) {
                              setCustomPoints(criteria.points);
                              setNote(criteria.description);
                            }
                          }}
                        >
                          <option value="">-- Chọn mẫu --</option>
                          {AUTO_POINT_CRITERIA.map(c => (
                            <option key={c.label} value={c.label}>{c.label} ({c.points}đ)</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-indigo-400 uppercase mb-2">Số điểm</label>
                        <input 
                          type="number"
                          className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 outline-none"
                          value={customPoints}
                          onChange={(e) => setCustomPoints(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Note */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Ghi chú chi tiết
                  </label>
                  <button
                    type="button"
                    onClick={() => setSendNotification(!sendNotification)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      sendNotification ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                    )}
                  >
                    <Bell className={cn("w-3.5 h-3.5", sendNotification && "animate-bounce")} />
                    {sendNotification ? 'Thông báo PH: Bật' : 'Thông báo PH: Tắt'}
                  </button>
                </div>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
                  placeholder="Nhập thêm thông tin nếu cần..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                {selectedTypes.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng điểm thay đổi:</span>
                    <span className={cn(
                      "text-lg font-black",
                      selectedTypes.reduce((acc, t) => acc + (t === 'Điểm phát sinh' ? customPoints : VIOLATION_CATEGORIES[t]), 0) > 0 
                        ? "text-emerald-500" 
                        : "text-rose-500"
                    )}>
                      {selectedTypes.reduce((acc, t) => acc + (t === 'Điểm phát sinh' ? customPoints : VIOLATION_CATEGORIES[t]), 0) > 0 ? '+' : ''}
                      {selectedTypes.reduce((acc, t) => acc + (t === 'Điểm phát sinh' ? customPoints : VIOLATION_CATEGORIES[t]), 0)}đ
                    </span>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmitting || (isCollective ? !selectedClass : selectedStudentIds.length === 0) || selectedTypes.length === 0}
                  className={cn(
                    "w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 neo-button",
                    isSubmitting || (isCollective ? !selectedClass : selectedStudentIds.length === 0) || selectedTypes.length === 0
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : isCollective
                        ? "bg-purple-600 hover:bg-purple-700 shadow-purple-200 hover:-translate-y-1"
                        : userRole === 'TASKFORCE'
                          ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200 hover:-translate-y-1"
                          : "bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:-translate-y-1"
                  )}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  {isSubmitting 
                    ? 'Đang lưu dữ liệu...' 
                    : isCollective 
                      ? `Xác nhận ghi nhận cho TẬP THỂ Lớp ${selectedClass}`
                      : `Xác nhận ghi nhận cho ${selectedStudentIds.length} học sinh`
                  }
                </button>
              </div>
            </form>

            {/* Recent Activity Overlay */}
            <AnimatePresence>
              {showReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowReview(false)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-700"
                  >
                    <div className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-800 dark:text-white">Xác nhận ghi nhận</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kiểm tra lại thông tin trước khi lưu</p>
                        </div>
                      </div>

                      <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đối tượng:</span>
                          <span className="text-sm font-black text-slate-800 dark:text-white">
                            {isCollective ? `Tập thể Lớp ${selectedClass}` : `${selectedStudentIds.length} học sinh`}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung:</span>
                          <div className="text-right">
                            {selectedTypes.map(t => (
                              <p key={t} className="text-xs font-bold text-slate-700 dark:text-slate-300">{t}</p>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng điểm:</span>
                          <span className={cn(
                            "text-xl font-black",
                            selectedTypes.reduce((acc, t) => acc + (t === 'Điểm phát sinh' ? customPoints : VIOLATION_CATEGORIES[t]), 0) > 0 
                              ? "text-emerald-500" 
                              : "text-rose-500"
                          )}>
                            {selectedTypes.reduce((acc, t) => acc + (t === 'Điểm phát sinh' ? customPoints : VIOLATION_CATEGORIES[t]), 0) > 0 ? '+' : ''}
                            {selectedTypes.reduce((acc, t) => acc + (t === 'Điểm phát sinh' ? customPoints : VIOLATION_CATEGORIES[t]), 0)}đ
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-8">
                        <button 
                          onClick={() => setShowReview(false)}
                          className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700"
                        >
                          Quay lại
                        </button>
                        <button 
                          onClick={handleConfirmSubmit}
                          className="py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
                        >
                          Xác nhận & Lưu
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {showRecent && (
              <div className="absolute inset-0 bg-white z-30 p-6 animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-500" />
                    Lịch sử vừa nhập
                  </h3>
                  <button 
                    onClick={() => setShowRecent(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {recentRecords.length > 0 ? (
                  <div className="space-y-3">
                    {recentRecords.map((record, idx) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                            {record.className}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{record.studentName}</p>
                            <p className="text-[10px] font-medium text-slate-400">{record.type}</p>
                          </div>
                        </div>
                        <div className={cn(
                          "text-[10px] font-black px-2 py-1 rounded-md",
                          record.points > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        )}>
                          {record.points > 0 ? '+' : ''}{record.points}đ
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-xs text-slate-400 font-medium">Chưa có bản ghi nào trong phiên làm việc này</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ViolationForm;
