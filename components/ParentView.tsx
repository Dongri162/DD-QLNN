
import React from 'react';
import { Student, ViolationRecord } from '../types';
import { 
  History, 
  Award, 
  AlertCircle, 
  MinusCircle, 
  PlusCircle, 
  Clock,
  ShieldCheck,
  User,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ParentViewProps {
  student: Student;
  violations: ViolationRecord[];
}

const ParentView: React.FC<ParentViewProps> = ({ student, violations }) => {
  const studentViolations = violations.filter(v => v.studentId === student.id);
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full -mr-48 -mt-48 opacity-50 blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row items-center gap-10">
          <div className="relative">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random&color=fff&size=256`}
              alt={student.name}
              className="w-32 h-32 rounded-[2rem] object-cover border-4 border-white shadow-2xl shadow-blue-600/20"
            />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">{student.name}</h2>
              <span className="px-4 py-1.5 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full w-fit mx-auto md:mx-0">Lớp {student.class}</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
              <span className="flex items-center gap-2"><User className="w-4 h-4" /> ID: {student.id}</span>
              <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Phụ huynh: {student.parentName}</span>
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-6">
              <div className="px-8 py-4 bg-blue-600 text-white rounded-[1.5rem] shadow-xl shadow-blue-200">
                <p className="text-[10px] uppercase font-black opacity-70 tracking-[0.2em] mb-1">Điểm rèn luyện</p>
                <p className="text-3xl font-black">{student.score}<span className="text-sm opacity-50 ml-1">/200</span></p>
              </div>
              <div className="px-8 py-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Số lần vi phạm</p>
                <p className="text-3xl font-black text-rose-500">{studentViolations.filter(v => v.points < 0).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><History className="w-5 h-5" /></div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Lịch sử rèn luyện chi tiết</h3>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-slate-100">
            <Clock className="w-3.5 h-3.5" /> Cập nhật thời gian thực
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          {studentViolations.length > 0 ? (
            studentViolations.slice().reverse().map((v) => (
              <div key={v.id} className="flex gap-6 p-6 rounded-[2rem] border border-slate-50 hover:bg-slate-50/50 hover:shadow-md transition-all duration-300 group">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-500 shadow-sm border",
                  v.points < 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                )}>
                  {v.points < 0 ? <MinusCircle className="w-7 h-7" /> : <PlusCircle className="w-7 h-7" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-lg font-black text-slate-800 tracking-tight">{v.type}</p>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-slate-100">{v.date}</span>
                  </div>
                  <p className="text-sm text-slate-500 font-bold italic leading-relaxed">"{v.note || 'Không có ghi chú bổ sung từ giáo viên'}"</p>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Xác nhận: {v.recordedBy}</p>
                    </div>
                    <div className={cn("font-black text-2xl tracking-tight", v.points < 0 ? 'text-rose-500' : 'text-emerald-500')}>
                      {v.points > 0 ? `+${v.points}` : v.points} <span className="text-[10px] uppercase font-black tracking-widest ml-1">điểm</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Award className="w-12 h-12" />
              </div>
              <h4 className="text-2xl font-black text-slate-800 tracking-tight mb-3">Hồ sơ hoàn hảo</h4>
              <p className="text-slate-400 max-w-xs mx-auto font-bold leading-relaxed">Con chưa có bất kỳ vi phạm nào. Hãy tiếp tục duy trì thành tích tốt này nhé!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentView;
