
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Student, ViolationRecord, Role } from '../types';
import { mockNow, getSchoolWeekInfo, parseDate } from '../src/utils/dateUtils';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ChevronDown, 
  UserPlus, 
  Users,
  List, 
  LayoutGrid, 
  Eye, 
  AlertCircle, 
  RotateCcw, 
  Archive,
  X,
  FileOutput,
  CheckCircle2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StudentListProps {
  students: Student[];
  violations: ViolationRecord[];
  userRole?: Role;
  onViewDetail?: (student: Student) => void;
  onUpdateStudent?: (updatedStudent: Student) => void;
  onAddStudent?: (student: Student) => void;
  onAddViolation?: (student: Student) => void;
  onArchiveStudent?: (studentId: string, archive: boolean, reason?: string) => void;
  defaultDisplayMode?: 'students' | 'classes';
}

const StudentList: React.FC<StudentListProps> = ({ 
  students,
  violations, 
  userRole,
  onViewDetail, 
  onUpdateStudent, 
  onAddStudent,
  onAddViolation,
  onArchiveStudent,
  defaultDisplayMode = 'students'
}) => {
  const [filter, setFilter] = useState('');
  
  // Class Filter State (Multi-select)
  const [classFilter, setClassFilter] = useState<string[]>(['All']);
  const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);
  const classMenuRef = useRef<HTMLDivElement>(null);

  const [genderFilter, setGenderFilter] = useState('All');
  const [rankFilter, setRankFilter] = useState('All');
  
  // View Modes
  const [archiveMode, setArchiveMode] = useState<'active' | 'archived'>('active');
  const [displayMode, setDisplayMode] = useState<'students' | 'classes'>(defaultDisplayMode);

  // Sync displayMode if defaultDisplayMode changes
  useEffect(() => {
    setDisplayMode(defaultDisplayMode);
  }, [defaultDisplayMode]);

  // Add Student State
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    class: '',
    gender: 'Nam',
    score: 200,
    parentName: ''
  });

  const availableClasses = useMemo(() => Array.from(new Set(students.map(s => s.class))).sort(), [students]);

  // Click outside handler for class dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (classMenuRef.current && !classMenuRef.current.contains(event.target as Node)) {
            setIsClassMenuOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClassToggle = (cls: string) => {
    if (cls === 'All') {
        setClassFilter(['All']);
        return;
    }
    
    let newFilter = [...classFilter];
    if (newFilter.includes('All')) {
        newFilter = [];
    }
    
    if (newFilter.includes(cls)) {
        newFilter = newFilter.filter(c => c !== cls);
    } else {
        newFilter.push(cls);
    }
    
    if (newFilter.length === 0) {
        setClassFilter(['All']);
    } else {
        setClassFilter(newFilter);
    }
  };

  const handleGradeSelect = (gradePrefix: string) => {
      const gradeClasses = availableClasses.filter(c => c.startsWith(gradePrefix));
      // Toggle logic for grades: if all classes in grade are selected, deselect them. Otherwise select all.
      const allSelected = gradeClasses.every(c => classFilter.includes(c));
      
      let newFilter = classFilter.filter(c => c !== 'All');
      
      if (allSelected) {
          newFilter = newFilter.filter(c => !gradeClasses.includes(c));
      } else {
          // Add missing ones
          const missing = gradeClasses.filter(c => !newFilter.includes(c));
          newFilter = [...newFilter, ...missing];
      }

      if (newFilter.length === 0) setClassFilter(['All']);
      else setClassFilter(newFilter);
  };

  const exportToExcel = () => {
    const data = filteredStudents.map(s => ({
      'Mã số': s.id,
      'Họ và Tên': s.name,
      'Lớp': s.class,
      'Giới tính': s.gender,
      'Điểm thi đua': s.score,
      'Xếp loại': getStudentRank(s.score),
      'Phụ huynh': s.parentName || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách học sinh");
    XLSX.writeFile(wb, `Danh_sach_hoc_sinh_${mockNow.toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
  };

  const getStudentRank = (score: number) => {
    if (score >= 200) return 'Xuất sắc';
    if (score >= 180) return 'Tốt';
    if (score >= 150) return 'Khá';
    return 'Yếu';
  };

  // --- Filter Logic ---
  const filteredStudents = useMemo(() => {
    return students
      .filter(s => {
        const isArchivedMatch = archiveMode === 'archived' ? s.isArchived === true : !s.isArchived;
        const matchesName = s.name.toLowerCase().includes(filter.toLowerCase()) || s.id.toLowerCase().includes(filter.toLowerCase());
        
        // Multi-class filter logic
        const matchesClass = classFilter.includes('All') || classFilter.includes(s.class);
        
        const matchesGender = genderFilter === 'All' || s.gender === genderFilter;
        const matchesRank = rankFilter === 'All' || getStudentRank(s.score) === rankFilter;
        
        return isArchivedMatch && matchesName && matchesClass && matchesGender && matchesRank;
      })
      .sort((a, b) => {
        // Sort by class first
        if (a.class !== b.class) {
          return a.class.localeCompare(b.class, undefined, { numeric: true });
        }
        // Then by name
        return a.name.localeCompare(b.name, 'vi');
      });
  }, [students, archiveMode, filter, classFilter, genderFilter, rankFilter]);

  // --- Class Overview Stats ---
  const classStats = useMemo(() => {
    const stats: Record<string, {
      className: string;
      studentCount: number;
      totalScore: number;
      avgScore: number;
      violationCount: number;
      genderDist: { Nam: number, Nữ: number };
      excellentCount: number;
    }> = {};

    // Only consider active students for class stats
    const activeStudents = students.filter(s => !s.isArchived);

    activeStudents.forEach(s => {
        if (!stats[s.class]) {
            stats[s.class] = {
                className: s.class,
                studentCount: 0,
                totalScore: 0,
                avgScore: 0,
                violationCount: 0,
                genderDist: { Nam: 0, Nữ: 0 },
                excellentCount: 0
            };
        }
        
        const entry = stats[s.class];
        entry.studentCount++;
        entry.totalScore += s.score;
        entry.genderDist[s.gender as 'Nam' | 'Nữ']++;
        if (s.score >= 200) entry.excellentCount++;

        // Count violations for this student
        const studentViolations = violations.filter(v => v.studentId === s.id && v.points < 0);
        entry.violationCount += studentViolations.length;
    });

    // Add collective violations to class stats
    violations.forEach(v => {
        if (v.isCollective && v.points < 0 && stats[v.className]) {
            stats[v.className].violationCount++;
        }
    });

    // Calculate averages
    Object.values(stats).forEach(item => {
        item.avgScore = item.studentCount > 0 ? item.totalScore / item.studentCount : 0;
    });

    return Object.values(stats).sort((a, b) => b.avgScore - a.avgScore);
  }, [students, violations]);

  const filteredClassStats = useMemo(() => {
      if (classFilter.includes('All')) return classStats;
      return classStats.filter(c => classFilter.includes(c.className));
  }, [classStats, classFilter]);

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (onAddStudent) {
          onAddStudent({
              id: `S${newStudent.class}-${Date.now().toString().slice(-4)}`,
              ...newStudent,
              score: 200
          } as Student);
          setIsAddingStudent(false);
          setNewStudent({ name: '', class: '', gender: 'Nam', score: 200, parentName: '' });
      }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 h-full flex flex-col"
    >
      {/* Action Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 glass-card p-4 rounded-2xl flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="Tìm tên, mã số..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          {/* Custom Multi-select Class Filter */}
          <div className="relative w-full sm:w-auto" ref={classMenuRef}>
            <button
                onClick={() => setIsClassMenuOpen(!isClassMenuOpen)}
                className={cn(
                    "w-full sm:w-48 px-4 py-2.5 border rounded-xl text-sm font-bold flex justify-between items-center transition-all",
                    classFilter.includes('All') 
                    ? "bg-slate-50 border-slate-200 text-slate-600" 
                    : "bg-blue-50 border-blue-200 text-blue-700"
                )}
            >
                <span className="truncate">
                    {classFilter.includes('All') 
                        ? 'Tất cả các lớp' 
                        : `Đã chọn ${classFilter.length} lớp`}
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isClassMenuOpen ? "rotate-180" : "")} />
            </button>

            {isClassMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 glass-card rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 p-3">
                    <div className="flex gap-2 mb-3 pb-3 border-b border-slate-100 overflow-x-auto">
                        <button 
                            onClick={() => setClassFilter(['All'])}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${classFilter.includes('All') ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Tất cả
                        </button>
                        {['10', '11', '12'].map(grade => (
                            <button
                                key={grade}
                                onClick={() => handleGradeSelect(grade)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                                    availableClasses.filter(c => c.startsWith(grade)).every(c => classFilter.includes(c))
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Khối {grade}
                            </button>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {availableClasses.map(cls => {
                            const isSelected = classFilter.includes(cls);
                            return (
                                <button
                                    key={cls}
                                    onClick={() => handleClassToggle(cls)}
                                    className={`px-2 py-2 rounded-lg text-xs font-bold transition-colors ${
                                        isSelected
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'bg-white text-slate-600 border border-slate-100 hover:border-blue-300'
                                    }`}
                                >
                                    {cls}
                                </button>
                            );
                        })}
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                         <span className="text-[10px] font-bold text-slate-400 uppercase">{classFilter.length} lớp được chọn</span>
                         <button 
                            onClick={() => setIsClassMenuOpen(false)}
                            className="text-xs font-bold text-blue-600 hover:underline"
                         >
                            Đóng
                         </button>
                    </div>
                </div>
            )}
          </div>

          <select 
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-theme"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="All">Tất cả giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>

          <select 
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-theme"
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value)}
          >
            <option value="All">Tất cả xếp loại</option>
            <option value="Xuất sắc">Xuất sắc</option>
            <option value="Tốt">Tốt</option>
            <option value="Khá">Khá</option>
            <option value="Yếu">Yếu</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto">
          {userRole === 'ADMIN' && (
             <button
                onClick={() => setIsAddingStudent(true)}
                className="flex-1 xl:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-theme flex items-center justify-center gap-2 neo-button"
             >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Thêm mới</span>
             </button>
          )}
          
          <div className="flex glass-card p-1 rounded-xl">
             <button
                onClick={() => setDisplayMode('students')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2 neo-button",
                  displayMode === 'students' ? "bg-white text-blue-600 shadow-sm font-black uppercase tracking-wider" : "text-slate-400 hover:text-slate-600 font-bold"
                )}
             >
                <List className="w-3.5 h-3.5" />
                <span>Học sinh</span>
             </button>
             <button
                onClick={() => setDisplayMode('classes')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2 neo-button",
                  displayMode === 'classes' ? "bg-white text-blue-600 shadow-sm font-black uppercase tracking-wider" : "text-slate-400 hover:text-slate-600 font-bold"
                )}
             >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Lớp học</span>
             </button>
          </div>

          <button
            onClick={exportToExcel}
            className="p-2.5 glass-card rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm neo-button"
            title="Xuất Excel"
          >
            <FileOutput className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View Mode Switcher */}
      {displayMode === 'students' ? (
        <>
            {/* Archive Toggle */}
            {(userRole === 'ADMIN' || userRole === 'TEACHER') && (
                <div className="flex gap-4 border-b border-slate-200">
                    <button
                        onClick={() => setArchiveMode('active')}
                        className={`pb-2 text-sm font-bold border-b-2 transition-colors ${archiveMode === 'active' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Đang hoạt động ({students.filter(s => !s.isArchived).length})
                    </button>
                    <button
                        onClick={() => setArchiveMode('archived')}
                        className={`pb-2 text-sm font-bold border-b-2 transition-colors ${archiveMode === 'archived' ? 'border-slate-500 text-slate-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Lưu trữ / Đã thôi học ({students.filter(s => s.isArchived).length})
                    </button>
                </div>
            )}

            {/* Student Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto custom-scrollbar flex-1">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã số</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Học sinh</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giới tính</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lớp</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Điểm thi đua</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Xếp loại</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => {
                            const rank = getStudentRank(student.score);
                            const rankColor = rank === 'Xuất sắc' ? 'text-emerald-500 bg-emerald-50' 
                                            : rank === 'Tốt' ? 'text-blue-500 bg-blue-50' 
                                            : rank === 'Khá' ? 'text-amber-500 bg-amber-50' 
                                            : 'text-rose-500 bg-rose-50';

                            return (
                                <tr key={student.id} className="hover:bg-slate-50/80 transition-theme group">
                                <td className="p-4 text-xs font-bold text-slate-500">{student.id}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                    <img 
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random&color=fff&size=128`}
                                        alt={student.name}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                    />
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{student.parentName || 'Chưa cập nhật PH'}</p>
                                    </div>
                                    </div>
                                </td>
                                <td className="p-4 text-xs font-medium text-slate-600">{student.gender}</td>
                                <td className="p-4 text-xs font-bold text-slate-700">{student.class}</td>
                                <td className="p-4 text-center">
                                    <span className={`text-sm font-black ${student.score >= 200 ? 'text-emerald-600' : student.score < 150 ? 'text-rose-600' : 'text-slate-700'}`}>
                                    {student.score}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide ${rankColor}`}>
                                    {rank}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Action Buttons */}
                                    {!student.isArchived && (
                                        <>
                                            <button 
                                                onClick={() => onViewDetail && onViewDetail(student)}
                                                className="px-3 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-2 text-xs font-bold transition-colors whitespace-nowrap"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Xem chi tiết
                                            </button>
                                            <button 
                                                onClick={() => onAddViolation && onAddViolation(student)}
                                                className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center"
                                                title="Ghi nhận vi phạm"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    
                                    {/* Archive Actions */}
                                    {(userRole === 'ADMIN' || userRole === 'TEACHER') && (
                                        student.isArchived ? (
                                            <button 
                                                onClick={() => onArchiveStudent && onArchiveStudent(student.id, false)}
                                                className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 hover:bg-emerald-100 flex items-center justify-center"
                                                title="Khôi phục học sinh"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    if (window.confirm('Bạn có chắc chắn muốn chuyển học sinh này vào danh sách lưu trữ/thôi học?')) {
                                                        onArchiveStudent && onArchiveStudent(student.id, true, 'Thôi học / Chuyển trường');
                                                    }
                                                }}
                                                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center"
                                                title="Lưu trữ / Thôi học"
                                            >
                                                <Archive className="w-4 h-4" />
                                            </button>
                                        )
                                    )}
                                    </div>
                                </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 text-sm font-medium italic">
                            Không tìm thấy học sinh nào phù hợp với bộ lọc.
                        </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
                <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs font-bold text-slate-500 flex justify-between items-center">
                    <span>Hiển thị {filteredStudents.length} học sinh</span>
                    <span>Tổng số: {students.length}</span>
                </div>
            </div>
        </>
      ) : (
        /* Class Overview Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto custom-scrollbar p-1 pb-10">
            {filteredClassStats.map(stat => (
                <div key={stat.className} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                    {/* Background Accent */}
                    <div className={cn(
                        "absolute top-0 right-0 w-24 h-24 rounded-full -mr-10 -mt-10 blur-3xl opacity-20 transition-opacity group-hover:opacity-40",
                        stat.avgScore >= 200 ? "bg-emerald-400" : stat.avgScore >= 180 ? "bg-blue-400" : "bg-amber-400"
                    )} />

                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Lớp {stat.className}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{stat.studentCount} Học sinh</span>
                            </div>
                        </div>
                        <div className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-black shadow-sm border border-white",
                            stat.avgScore >= 200 ? 'bg-emerald-50 text-emerald-600' :
                            stat.avgScore >= 180 ? 'bg-blue-50 text-blue-600' :
                            'bg-amber-50 text-amber-600'
                        )}>
                            {stat.avgScore.toFixed(1)}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Vi phạm</p>
                            <p className="text-lg font-black text-rose-500">{stat.violationCount}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Xuất sắc</p>
                            <p className="text-lg font-black text-emerald-500">{stat.excellentCount}</p>
                        </div>
                    </div>

                    <div className="space-y-2 relative z-10">
                        <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Nam: {stat.genderDist.Nam}</span>
                            <span>Nữ: {stat.genderDist.Nữ}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex shadow-inner">
                             <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${(stat.genderDist.Nam / stat.studentCount) * 100}%` }}></div>
                             <div className="bg-pink-400 h-full transition-all duration-1000" style={{ width: `${(stat.genderDist.Nữ / stat.studentCount) * 100}%` }}></div>
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            setClassFilter([stat.className]);
                            setDisplayMode('students');
                        }}
                        className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-slate-200"
                    >
                        Xem danh sách lớp
                    </button>
                </div>
            ))}
        </div>
      )}

      {/* Add Student Modal */}
      {isAddingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setIsAddingStudent(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-blue-500" />
                Thêm Học sinh mới
            </h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Họ và Tên</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập họ tên đầy đủ"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Lớp</label>
                    <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="VD: 10A1"
                        value={newStudent.class}
                        onChange={(e) => setNewStudent({...newStudent, class: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Giới tính</label>
                    <select 
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={newStudent.gender}
                        onChange={(e) => setNewStudent({...newStudent, gender: e.target.value})}
                    >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                    </select>
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tên Phụ huynh</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên phụ huynh"
                    value={newStudent.parentName}
                    onChange={(e) => setNewStudent({...newStudent, parentName: e.target.value})}
                  />
               </div>

               <div className="flex gap-3 pt-4 mt-2">
                  <button 
                    type="button"
                    onClick={() => setIsAddingStudent(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
                  >
                    Thêm học sinh
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StudentList;
