
import React, { useState, useMemo } from 'react';
import { Student, ViolationRecord, Role, ViolationType, MonthlyRemark } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  ArrowLeft, 
  UserPen, 
  IdCard, 
  Layers, 
  Mars, 
  Venus, 
  Users, 
  GraduationCap, 
  AlertCircle, 
  Minus, 
  Plus, 
  PieChart as PieChartIcon,
  CalendarCheck,
  Pencil,
  Settings,
  History,
  Trash2,
  Clock,
  ShieldCheck,
  Award,
  CheckCircle2,
  X,
  Save,
  Loader2,
  Zap,
  Footprints,
  FileSignature,
  UserX,
  DoorOpen,
  Shirt,
  Scissors,
  Ban,
  Hand,
  Bike,
  Hammer,
  BookX,
  Pen,
  Briefcase,
  EyeOff,
  Volume2,
  Bed,
  Gamepad2,
  MessageSquareOff,
  Sparkles,
  AlertTriangle,
  Heart,
  Trophy,
  Lightbulb,
  Star,
  Info,
  Bell
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StudentDetailViewProps {
  student: Student;
  violations: ViolationRecord[];
  monthlyRemarks?: MonthlyRemark[];
  onBack: () => void;
  userRole?: Role;
  onAddRecord?: (record: ViolationRecord) => void;
  onUpdateRecord?: (record: ViolationRecord) => void;
  onDeleteRecord?: (id: string) => void;
  onUpdateRemark?: (remark: MonthlyRemark) => void;
  onUpdateStudent?: (student: Student) => void;
  onAddNotification?: (notif: { studentName: string; parentName: string; type: string }) => void;
}

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6366f1'];

const getViolationIcon = (type: ViolationType) => {
  const icons: Record<string, any> = {
    'Đi trễ': Footprints,
    'Vắng có phép': FileSignature,
    'Vắng không phép': UserX,
    'Trốn tiết': DoorOpen,
    'Không đồng phục': Shirt,
    'Tác phong (tóc, móng tay...)': Scissors,
    'Hút thuốc/Chất kích thích': Ban,
    'Đánh nhau/Vô lễ': Hand,
    'Vi phạm giao thông': Bike,
    'Phá hoại của công': Hammer,
    'Không thuộc bài': BookX,
    'Không làm bài tập': Pen,
    'Quên sách vở/Dụng cụ': Briefcase,
    'Sử dụng tài liệu': EyeOff,
    'Mất trật tự': Volume2,
    'Ngủ gật': Bed,
    'Làm việc riêng': Gamepad2,
    'Nói leo': MessageSquareOff,
    'Vệ sinh lớp bẩn': Sparkles,
    'Tiết B': AlertCircle,
    'Tiết C': AlertTriangle,
    'Tiết D': X,
    'Việc tốt/Nhặt được của rơi': Heart,
    'Đạt giải cuộc thi': Trophy,
    'Viết bài tập san': Pen,
    'Phát biểu xây dựng bài': Lightbulb,
    'Điểm phát sinh': Star
  };
  return icons[type] || Info;
};

const StudentDetailView: React.FC<StudentDetailViewProps> = ({ 
  student, 
  violations, 
  monthlyRemarks = [],
  onBack, 
  userRole, 
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onUpdateRemark,
  onUpdateStudent,
  onAddNotification
}) => {
  const [adjustPoints, setAdjustPoints] = useState<number>(0);
  const [adjustPeriod, setAdjustPeriod] = useState('Tuần');
  const [adjustNote, setAdjustNote] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [editingAdjustmentId, setEditingAdjustmentId] = useState<string | null>(null);

  const [editingRemark, setEditingRemark] = useState<{month: string, text: string} | null>(null);

  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: student.name,
    class: student.class,
    gender: student.gender,
    parentName: student.parentName || ''
  });

  // Filter violations for this student
  const studentViolations = useMemo(() => 
    violations.filter(v => v.studentId === student.id).sort((a, b) => {
      // Sort by date descending
      return b.id.localeCompare(a.id);
    }), 
  [violations, student.id]);

  // Aggregate monthly stats
  const monthlyStats = useMemo(() => {
    const statsMap = new Map<string, { 
      month: string;
      totalChange: number;
      violationCount: number;
      positivePoints: number;
      negativePoints: number;
    }>();

    studentViolations.forEach(v => {
      const [day, month, year] = v.date.split('/');
      const monthKey = `${month}/${year}`;
      
      if (!statsMap.has(monthKey)) {
        statsMap.set(monthKey, {
          month: monthKey,
          totalChange: 0,
          violationCount: 0,
          positivePoints: 0,
          negativePoints: 0
        });
      }
      
      const entry = statsMap.get(monthKey)!;
      entry.totalChange += v.points;
      if (v.points < 0) {
        entry.violationCount += 1;
        entry.negativePoints += v.points;
      } else {
        entry.positivePoints += v.points;
      }
    });

    // Sort by date desc (simplified by parsing MM/YYYY)
    return Array.from(statsMap.values()).sort((a, b) => {
      const [m1, y1] = a.month.split('/').map(Number);
      const [m2, y2] = b.month.split('/').map(Number);
      return y2 - y1 || m2 - m1;
    });
  }, [studentViolations]);

  const positivePoints = studentViolations.filter(v => v.points > 0).reduce((acc, v) => acc + v.points, 0);
  const negativePoints = Math.abs(studentViolations.filter(v => v.points < 0).reduce((acc, v) => acc + v.points, 0));
  const violationCount = studentViolations.filter(v => v.points < 0).length;

  // Prepare data for Pie Chart
  const chartData = useMemo(() => {
    const stats: Record<string, number> = {};
    studentViolations.filter(v => v.points < 0).forEach(v => {
      stats[v.type] = (stats[v.type] || 0) + 1;
    });
    return Object.keys(stats).map(key => ({ name: key, value: stats[key] }));
  }, [studentViolations]);

  const handleManualAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustPoints === 0) return;

    setIsAdjusting(true);

    if (editingAdjustmentId && onUpdateRecord) {
        // Update existing record
        const existingRecord = studentViolations.find(v => v.id === editingAdjustmentId);
        if (existingRecord) {
            const updatedRecord: ViolationRecord = {
                ...existingRecord,
                points: adjustPoints,
                note: adjustNote.startsWith('[') ? adjustNote : `[Thi đua ${adjustPeriod}] ${adjustNote}`,
                // Keep other fields same
            };
            setTimeout(() => {
                onUpdateRecord(updatedRecord);
                resetAdjustForm();
            }, 500);
        }
    } else if (onAddRecord) {
        // Create new record
        const newRecord: ViolationRecord = {
            id: `ADJ-${Date.now()}`,
            studentId: student.id,
            studentName: student.name,
            className: student.class,
            type: 'Điểm phát sinh' as ViolationType,
            points: adjustPoints,
            date: new Date().toLocaleDateString('vi-VN'),
            note: `[Thi đua ${adjustPeriod}] ${adjustNote}`,
            recordedBy: 'Hệ thống Admin',
            recordedRole: 'ADMIN'
        };
        setTimeout(() => {
            onAddRecord(newRecord);
            resetAdjustForm();
        }, 500);
    }
  };

  const resetAdjustForm = () => {
    setAdjustPoints(0);
    setAdjustNote('');
    setEditingAdjustmentId(null);
    setIsAdjusting(false);
  };

  const initEditAdjustment = (record: ViolationRecord) => {
      setEditingAdjustmentId(record.id);
      setAdjustPoints(record.points);
      // Remove the prefix [Thi đua ...] for cleaner editing if present
      const noteContent = record.note.replace(/^\[Thi đua .+?\]\s*/, '');
      setAdjustNote(noteContent);
      setAdjustPeriod('Tuần'); // Reset or try to extract from note if needed
      
      // Scroll to form
      const formElement = document.getElementById('admin-adjust-form');
      if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth' });
      }
  };

  const saveRemark = (month: string) => {
    if (!editingRemark || editingRemark.text === undefined || !onUpdateRemark) return;
    
    onUpdateRemark({
      studentId: student.id,
      monthYear: month,
      remark: editingRemark.text,
      updatedBy: userRole || 'ADMIN'
    });
    setEditingRemark(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateStudent) {
      onUpdateStudent({
        ...student,
        name: editFormData.name,
        class: editFormData.class,
        gender: editFormData.gender,
        parentName: editFormData.parentName
      });
      setIsEditingProfile(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-all font-black text-xs uppercase tracking-widest group bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200"
        >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại danh sách
        </button>
        
        {/* Edit Profile Button for Admin */}
        {userRole === 'ADMIN' && (
            <button 
                onClick={() => {
                    setEditFormData({
                        name: student.name,
                        class: student.class,
                        gender: student.gender,
                        parentName: student.parentName || ''
                    });
                    setIsEditingProfile(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition-all font-black text-xs uppercase tracking-widest px-6 py-3 rounded-2xl shadow-xl shadow-blue-200 hover:-translate-y-1 active:scale-95"
            >
                <UserPen className="w-4 h-4" />
                Chỉnh sửa hồ sơ
            </button>
        )}
      </div>

      {/* Hero Section: Profile & Key Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative">
          <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500"></div>
          <div className="px-10 pb-10 flex flex-col sm:flex-row items-start gap-8 -mt-16">
            <div className="w-32 h-32 bg-white rounded-[2.5rem] p-1.5 shadow-2xl relative z-10">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random&color=fff&size=256`}
                alt={student.name}
                className="w-full h-full rounded-[2rem] object-cover"
              />
            </div>
            <div className="flex-1 mt-20 sm:mt-20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">{student.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200/50">
                      <IdCard className="w-3.5 h-3.5" /> {student.id}
                    </span>
                    <span className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200/50">
                      <Layers className="w-3.5 h-3.5" /> Lớp {student.class}
                    </span>
                    <span className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                      student.gender === 'Nam' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-pink-50 text-pink-600 border-pink-100'
                    )}>
                      {student.gender === 'Nam' ? <Mars className="w-3.5 h-3.5" /> : <Venus className="w-3.5 h-3.5" />} {student.gender}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  "px-8 py-4 rounded-[2rem] border-2 flex flex-col items-center shadow-lg transition-transform hover:scale-105",
                  student.score >= 180 
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700 shadow-emerald-100' 
                  : student.score >= 150 
                  ? 'border-amber-100 bg-amber-50 text-amber-700 shadow-amber-100' 
                  : 'border-rose-100 bg-rose-50 text-rose-700 shadow-rose-100'
                )}>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Điểm Thi Đua</span>
                  <span className="text-4xl font-black">{student.score}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Info Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-10 pb-10 mt-4 border-t border-slate-50 pt-8">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:rotate-6 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Phụ huynh</p>
                <p className="font-black text-slate-700">{student.parentName || 'Đang cập nhật'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:rotate-6 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Học lực (Học kỳ I)</p>
                <p className="font-black text-slate-700">Khá (GPA: 7.8)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-6">
          {[
            { label: 'Số lần vi phạm', value: violationCount, icon: AlertCircle, color: 'rose' },
            { label: 'Tổng điểm trừ', value: `-${negativePoints}`, icon: Minus, color: 'slate' },
            { label: 'Tổng điểm cộng', value: `+${positivePoints}`, icon: Plus, color: 'emerald' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-xl transition-all duration-500">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">{stat.label}</p>
                <h3 className={cn("text-3xl font-black tracking-tight", `text-${stat.color}-500`)}>{stat.value}</h3>
              </div>
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500", `bg-${stat.color}-50 text-${stat.color}-500`)}>
                <stat.icon className="w-7 h-7" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Analytics */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><PieChartIcon className="w-5 h-5" /></div>
              Phân tích vi phạm
            </h3>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px'}} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-black text-xs uppercase tracking-widest">Chưa có vi phạm</p>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Performance Summary */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><CalendarCheck className="w-5 h-5" /></div>
              Tổng hợp Tháng
            </h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {monthlyStats.length > 0 ? (
                monthlyStats.map((stat) => {
                  const savedRemark = monthlyRemarks.find(r => r.studentId === student.id && r.monthYear === stat.month)?.remark;
                  const isEditing = editingRemark?.month === stat.month;

                  return (
                    <div key={stat.month} className="bg-slate-50/50 border border-slate-100 rounded-[1.5rem] p-5 hover:bg-white hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-100 uppercase tracking-widest">Tháng {stat.month}</span>
                        <div className={cn("text-sm font-black", stat.totalChange >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                          {stat.totalChange > 0 ? '+' : ''}{stat.totalChange} điểm
                        </div>
                      </div>
                      <div className="flex gap-4 text-[10px] mb-4 text-slate-400 font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-rose-400" /> {stat.violationCount} lỗi</span>
                        <span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5 text-emerald-400" /> {stat.positivePoints > 0 ? '+' + stat.positivePoints : 0} điểm</span>
                      </div>
                      
                      {/* Admin Remarks Section */}
                      <div className="pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">Nhận xét của GV</label>
                          {userRole === 'ADMIN' && !isEditing && (
                            <button 
                              onClick={() => setEditingRemark({ month: stat.month, text: savedRemark || '' })}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        
                        {isEditing ? (
                          <div className="flex flex-col gap-3">
                            <textarea
                              className="w-full text-xs p-4 rounded-2xl border border-blue-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-white font-bold"
                              rows={3}
                              value={editingRemark?.text}
                              onChange={(e) => setEditingRemark({ ...editingRemark!, text: e.target.value })}
                              placeholder="Nhập nhận xét đánh giá..."
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingRemark(null)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-2 hover:text-slate-600">Hủy</button>
                              <button onClick={() => saveRemark(stat.month)} className="text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white px-5 py-2 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Lưu</button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600 font-bold italic leading-relaxed">
                            {savedRemark || "Chưa có nhận xét từ giáo viên."}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-400 text-[10px] font-black uppercase tracking-widest">Chưa có dữ liệu tháng</div>
              )}
            </div>
          </div>

          {/* Admin Adjustment */}
          {userRole === 'ADMIN' && (
            <div id="admin-adjust-form" className={cn(
              "rounded-[2.5rem] border p-8 shadow-sm transition-all duration-500",
              editingAdjustmentId ? 'bg-indigo-50/50 border-indigo-200' : 'bg-amber-50/50 border-amber-200'
            )}>
              <div className="flex items-center gap-4 mb-6">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                  editingAdjustmentId ? 'bg-indigo-500 shadow-indigo-200' : 'bg-amber-500 shadow-amber-200'
                )}>
                  {editingAdjustmentId ? <Pencil className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
                </div>
                <div>
                    <h3 className={cn("text-lg font-black", editingAdjustmentId ? 'text-indigo-900' : 'text-amber-900')}>
                        {editingAdjustmentId ? 'Cập nhật Điều chỉnh' : 'Điều chỉnh điểm'}
                    </h3>
                    {editingAdjustmentId && <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">Đang chỉnh sửa bản ghi</p>}
                </div>
              </div>
              <form onSubmit={handleManualAdjust} className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Plus className="w-4 h-4 text-slate-400" />
                  </div>
                  <input 
                    type="number"
                    className={cn(
                      "w-full pl-10 pr-4 py-4 bg-white border rounded-2xl focus:ring-4 outline-none text-sm font-black transition-all",
                      editingAdjustmentId ? 'border-indigo-100 focus:ring-indigo-500/10 focus:border-indigo-500' : 'border-amber-100 focus:ring-amber-500/10 focus:border-amber-500'
                    )}
                    placeholder="Số điểm (+/-)"
                    value={adjustPoints || ''}
                    onChange={(e) => setAdjustPoints(parseInt(e.target.value) || 0)}
                  />
                </div>
                <select 
                  className={cn(
                    "w-full px-4 py-4 bg-white border rounded-2xl focus:ring-4 outline-none text-sm font-black transition-all appearance-none",
                    editingAdjustmentId ? 'border-indigo-100 focus:ring-indigo-500/10 focus:border-indigo-500' : 'border-amber-100 focus:ring-amber-500/10 focus:border-amber-500'
                  )}
                  value={adjustPeriod}
                  onChange={(e) => setAdjustPeriod(e.target.value)}
                >
                  <option value="Tuần">Xếp hạng Tuần</option>
                  <option value="Tháng">Xếp hạng Tháng</option>
                </select>
                <textarea 
                  className={cn(
                    "w-full px-4 py-4 bg-white border rounded-2xl focus:ring-4 outline-none text-sm font-bold transition-all",
                    editingAdjustmentId ? 'border-indigo-100 focus:ring-indigo-500/10 focus:border-indigo-500' : 'border-amber-100 focus:ring-amber-500/10 focus:border-amber-500'
                  )}
                  placeholder="Lý do điều chỉnh..."
                  rows={2}
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                />
                <div className="flex gap-3">
                    {editingAdjustmentId && (
                         <button
                            type="button"
                            onClick={resetAdjustForm}
                            className="flex-1 bg-white text-slate-400 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all"
                        >
                            Hủy
                        </button>
                    )}
                    <button
                    type="submit"
                    disabled={isAdjusting || adjustPoints === 0}
                    className={cn(
                      "flex-[2] text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl",
                      editingAdjustmentId 
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' 
                      : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                    )}
                    >
                    {isAdjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingAdjustmentId ? <Save className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />)}
                    {editingAdjustmentId ? 'Cập nhật' : 'Áp dụng'}
                    </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Violation Timeline */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[700px]">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><History className="w-5 h-5" /></div>
              Nhật ký rèn luyện
            </h3>
            <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200">
              {studentViolations.length} bản ghi
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
            {studentViolations.length > 0 ? (
              <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-[31px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {studentViolations.map((v, index) => {
                  const Icon = getViolationIcon(v.type);
                  return (
                    <div key={v.id} className="relative flex gap-8 group">
                      {/* Timeline Dot */}
                      <div className={cn(
                        "z-10 w-4 h-4 mt-2 rounded-full ring-8 ring-white flex-shrink-0 transition-transform group-hover:scale-125 duration-300",
                        v.points < 0 ? 'bg-rose-500 shadow-lg shadow-rose-200' : 'bg-emerald-500 shadow-lg shadow-emerald-200'
                      )}></div>
                      
                      {/* Content */}
                      <div className={cn(
                        "flex-1 bg-white border rounded-[2rem] p-6 shadow-sm group-hover:shadow-xl transition-all duration-500 relative overflow-hidden",
                        editingAdjustmentId === v.id ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-100'
                      )}>
                        {/* Action Buttons */}
                        <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                           {/* Notification Button */}
                           {onAddNotification && !v.isCollective && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddNotification({
                                    studentName: student.name,
                                    parentName: student.parentName || 'Phụ huynh',
                                    type: v.type
                                  });
                                  alert(`Đã gửi thông báo nhắc nhở lỗi "${v.type}" đến phụ huynh.`);
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                title="Gửi thông báo cho phụ huynh"
                              >
                                <Bell className="w-4 h-4" />
                              </button>
                           )}

                           {/* Edit Button for Admin (Only for 'Điểm phát sinh') */}
                           {userRole === 'ADMIN' && v.type === 'Điểm phát sinh' && onUpdateRecord && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  initEditAdjustment(v);
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                title="Chỉnh sửa"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                           )}

                           {/* Delete Button */}
                           {(userRole === 'ADMIN' || userRole === 'TEACHER') && onDeleteRecord && (
                              <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
                                    onDeleteRecord(v.id);
                                  }
                              }}
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                              title="Xóa"
                              >
                              <Trash2 className="w-4 h-4" />
                              </button>
                          )}
                        </div>

                        <div className="flex justify-between items-start mb-4 pr-24">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={cn(
                              "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border",
                              v.points < 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            )}>
                              <Icon className="w-3.5 h-3.5" />
                              {v.type}
                            </span>
                            <span className={cn(
                              "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border",
                              v.points > 0 ? "bg-emerald-100 text-emerald-600 border-emerald-200" : 
                              v.isCollective ? "bg-amber-100 text-amber-600 border-amber-200" : "bg-slate-100 text-slate-500 border-slate-200"
                            )}>
                              {v.points > 0 ? 'Khen thưởng' : v.isCollective ? 'Tập thể' : 'Cá nhân'}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {v.date}
                            </span>
                          </div>
                          <span className={cn("font-black text-xl tracking-tight", v.points < 0 ? 'text-rose-500' : 'text-emerald-500')}>
                            {v.points > 0 ? `+${v.points}` : v.points}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-600 font-bold leading-relaxed mb-6">
                          {v.note ? `"${v.note}"` : <span className="text-slate-300 italic font-medium">Không có ghi chú chi tiết.</span>}
                        </p>
                        
                        <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm",
                            v.recordedRole === 'TASKFORCE' ? 'bg-amber-500' : v.recordedRole === 'ADMIN' ? 'bg-rose-500' : 'bg-blue-500'
                          )}>
                            {v.recordedRole === 'TASKFORCE' ? <Zap className="w-4 h-4" /> : v.recordedRole === 'ADMIN' ? <ShieldCheck className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                          </div>
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            {v.recordedBy || (v.recordedRole === 'TASKFORCE' ? 'Đội Cờ Đỏ' : 'Giáo viên')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-10">
                <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                  <Award className="w-12 h-12 text-emerald-400" />
                </div>
                <h4 className="text-xl font-black text-slate-800 tracking-tight">Chưa có dữ liệu ghi nhận</h4>
                <p className="text-slate-400 text-sm font-bold max-w-xs mt-3 leading-relaxed">Học sinh này chưa có vi phạm hoặc thành tích nào được ghi nhận trong hệ thống.</p>
              </div>
            )}
          </div>
        </div>
      </div>

       {/* Edit Profile Modal */}
       {isEditingProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">Chỉnh sửa hồ sơ</h3>
            <form onSubmit={handleEditSubmit} className="space-y-6">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Họ và Tên</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Lớp</label>
                    <input 
                        type="text" 
                        required
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        value={editFormData.class}
                        onChange={(e) => setEditFormData({...editFormData, class: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Giới tính</label>
                    <select 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none"
                        value={editFormData.gender}
                        onChange={(e) => setEditFormData({...editFormData, gender: e.target.value as 'Nam' | 'Nữ'})}
                    >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                    </select>
                  </div>
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Họ tên Phụ huynh</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    value={editFormData.parentName}
                    onChange={(e) => setEditFormData({...editFormData, parentName: e.target.value})}
                  />
               </div>

               <div className="flex justify-end gap-4 pt-6 border-t border-slate-50 mt-8">
                  <button 
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all"
                  >
                    Lưu thay đổi
                  </button>
               </div>
            </form>
          </div>
        </div>
       )}
    </div>
  );
};

export default StudentDetailView;
