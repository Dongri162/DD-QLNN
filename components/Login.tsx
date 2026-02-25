
import React, { useState, useMemo } from 'react';
import { User, Student, Role } from '../types';
import Logo from './Logo';
import { TEACHER_ACCESS_CODE, PARENT_ACCESS_CODE, ADMIN_ACCESS_CODE, TASKFORCE_ACCESS_CODE, MONITOR_ACCESS_CODE, TEACHER_PASSWORDS } from '../constants';
import { 
  GraduationCap, 
  Users, 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  AlertCircle, 
  Lock,
  Zap,
  BookOpen
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LoginProps {
  onLogin: (user: User) => void;
  students: Student[];
}

type LoginTab = 'ADMIN' | 'TEACHER' | 'PARENT' | 'TASKFORCE' | 'MONITOR';

const Login: React.FC<LoginProps> = ({ onLogin, students }) => {
  const [activeTab, setActiveTab] = useState<LoginTab>('TEACHER');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  
  // Teacher/Monitor inputs
  const [selectedClass, setSelectedClass] = useState('');
  
  // Parent inputs
  const [studentQuery, setStudentQuery] = useState('');

  const availableClasses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.class))).sort();
  }, [students]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'ADMIN') {
        if (accessCode !== ADMIN_ACCESS_CODE) {
            setError('Mã xác nhận Quản trị viên không chính xác.');
            return;
        }
        onLogin({
            id: 'ADMIN-01',
            name: 'Quản trị viên Hệ thống',
            role: 'ADMIN'
        });

    } else if (activeTab === 'TEACHER') {
        if (!selectedClass) {
            setError('Vui lòng chọn lớp chủ nhiệm.');
            return;
        }
        
        const correctPassword = TEACHER_PASSWORDS[selectedClass] || TEACHER_ACCESS_CODE;
        if (accessCode !== correctPassword) {
            setError(`Mã xác nhận GVCN lớp ${selectedClass} không chính xác.`);
            return;
        }
        
        onLogin({
            id: `TEACHER-${selectedClass}`,
            name: `GVCN Lớp ${selectedClass}`,
            role: 'TEACHER',
            assignedClass: selectedClass
        });

    } else if (activeTab === 'TASKFORCE') {
        if (accessCode !== TASKFORCE_ACCESS_CODE) {
            setError('Mã xác nhận TNXK không chính xác.');
            return;
        }
        onLogin({
            id: 'TASKFORCE-01',
            name: 'Đội TNXK - Trực ban',
            role: 'TASKFORCE'
        });

    } else if (activeTab === 'MONITOR') {
        if (accessCode !== MONITOR_ACCESS_CODE) {
            setError('Mã xác nhận Cán sự không chính xác.');
            return;
        }
        if (!selectedClass) {
            setError('Vui lòng chọn lớp của bạn.');
            return;
        }
        onLogin({
            id: `MONITOR-${selectedClass}`,
            name: `Cán sự lớp ${selectedClass}`,
            role: 'MONITOR',
            assignedClass: selectedClass
        });

    } else if (activeTab === 'PARENT') {
        if (accessCode !== PARENT_ACCESS_CODE) {
            setError('Mã xác nhận phụ huynh không chính xác.');
            return;
        }
        if (!studentQuery.trim()) {
            setError('Vui lòng nhập tên hoặc mã học sinh.');
            return;
        }

        const query = studentQuery.toLowerCase().trim();
        const foundStudent = students.find(s => 
            s.id.toLowerCase() === query || 
            s.name.toLowerCase().includes(query)
        );

        if (!foundStudent) {
            setError('Không tìm thấy học sinh. Vui lòng kiểm tra lại Mã số hoặc Họ tên.');
            return;
        }

        onLogin({
            id: `PARENT-${foundStudent.id}`,
            name: foundStudent.parentName || `Phụ huynh em ${foundStudent.name}`,
            role: 'PARENT',
            studentId: foundStudent.id
        });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden p-4 font-sans">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px] animate-pulse" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 mb-6 transform hover:scale-105 transition-transform duration-500 p-2 border border-slate-100 overflow-hidden">
            <Logo size={80} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">SmartSchool</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-[0.2em]">Hệ thống Quản lý Nề nếp</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white p-8 relative overflow-hidden">
          {/* Tabs */}
          <div className="flex bg-slate-100/50 p-1.5 rounded-2xl mb-8 border border-slate-200/50">
            {[
              { id: 'ADMIN', label: 'AD' },
              { id: 'TEACHER', label: 'GV' },
              { id: 'TASKFORCE', label: 'TNXK' },
              { id: 'MONITOR', label: 'CS' },
              { id: 'PARENT', label: 'PH' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as LoginTab);
                  setError('');
                  setAccessCode('');
                }}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  activeTab === tab.id 
                    ? "bg-white text-blue-600 shadow-lg shadow-blue-100" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Access Code Input */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                Mã xác nhận truy cập
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-bold placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-center tracking-[0.2em]"
                  placeholder="Mã xác nhận"
                  maxLength={8}
                />
              </div>
            </div>

            {/* Role Specific Inputs */}
            {(activeTab === 'TEACHER' || activeTab === 'MONITOR') && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                  Chọn Lớp học
                </label>
                <div className="relative">
                    <select 
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-slate-700 font-bold transition-all appearance-none"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="">-- Chọn lớp --</option>
                        {availableClasses.map(cls => (
                            <option key={cls} value={cls}>Lớp {cls}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <ArrowRight className="w-4 h-4 text-slate-300 rotate-90" />
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'PARENT' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                  Thông tin học sinh
                </label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-slate-700 font-bold transition-all"
                        placeholder="Tên hoặc mã số học sinh..."
                        value={studentQuery}
                        onChange={(e) => setStudentQuery(e.target.value)}
                    />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-4 rounded-2xl border border-rose-100 animate-in shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-xs font-black">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className={cn(
                "w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-xl transition-all duration-300 flex items-center justify-center gap-3 hover:-translate-y-1 active:scale-95",
                activeTab === 'ADMIN' ? "bg-slate-800 shadow-slate-200" :
                activeTab === 'TEACHER' ? "bg-blue-600 shadow-blue-200" :
                activeTab === 'TASKFORCE' ? "bg-amber-500 shadow-amber-200" :
                activeTab === 'MONITOR' ? "bg-purple-600 shadow-purple-200" :
                "bg-emerald-600 shadow-emerald-200"
              )}
            >
              Đăng nhập hệ thống
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              © 2024 SmartSchool OS • Bảo mật & Tin cậy
            </p>
          </div>
        </div>

        {/* Access Code Hints removed as per request */}
      </div>
    </div>
  );
};

export default Login;
