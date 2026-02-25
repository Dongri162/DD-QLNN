
import React, { useState } from 'react';
import { User, AppTab } from '../types';
import Logo from './Logo';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  ClipboardCheck, 
  BookOpen, 
  LogOut, 
  Menu, 
  X,
  GraduationCap,
  ShieldCheck,
  UserCircle,
  Moon,
  Sun
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onLogout: () => void;
  user: User;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, user }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const getMenuItems = () => {
    if (user.role === 'PARENT') {
      return [
        { id: 'my-child', icon: UserCircle, label: 'Con của tôi' },
        { id: 'ranking', icon: Trophy, label: 'Xếp hạng' },
        { id: 'monitor-tool', icon: BookOpen, label: 'Sổ Đầu Bài' }
      ];
    }
    
    const items = [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
      { id: 'students', icon: GraduationCap, label: user.role === 'TEACHER' ? 'Lớp của tôi' : 'Học sinh' },
      { id: 'classes', icon: Users, label: 'Danh sách lớp' },
      { id: 'ranking', icon: Trophy, label: 'Xếp hạng' },
    ];
    
    // TNXK (TASKFORCE) does NOT get Sổ Đầu Bài
    if (user.role !== 'TASKFORCE') {
        items.push({ id: 'monitor-tool', icon: BookOpen, label: 'Sổ Đầu Bài' });
    }

    // GVCN (TEACHER) and MONITOR do NOT get general Record (TNXK tools)
    // Only ADMIN and TASKFORCE get the Record tab
    if (user.role === 'ADMIN' || user.role === 'TASKFORCE') {
        const recordLabel = user.role === 'TASKFORCE' ? 'Nhập liệu TNXK' : 'Nhập Vi phạm';
        items.push({ id: 'record', icon: ClipboardCheck, label: recordLabel });
    }
    
    return items;
  };

  const menuItems = getMenuItems();

  const SidebarContent = () => (
    <div className="p-6 h-full flex flex-col bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-2xl">
      <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
        <div className="bg-white p-1 rounded-2xl shadow-xl shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300 border border-slate-100 overflow-hidden">
          <Logo size={40} />
        </div>
        <div>
          <span className="text-xl font-black tracking-tighter text-slate-800 block leading-none">SmartSchool</span>
          <span className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase mt-1 block">Quản lý Nề nếp</span>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm group relative overflow-hidden",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 translate-x-2" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              <div className="flex items-center gap-3 relative z-10">
                <Icon className={cn(
                  "w-5 h-5 transition-colors duration-300",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-blue-500"
                )} />
                <span>{item.label}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full relative z-10" />}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chế độ tối</span>
          <button 
            onClick={toggleDarkMode}
            className="w-10 h-6 bg-slate-100 dark:bg-slate-800 rounded-full relative transition-colors"
          >
            <div className={cn(
              "absolute top-1 w-4 h-4 rounded-full transition-all flex items-center justify-center",
              isDarkMode ? "left-5 bg-blue-500" : "left-1 bg-white shadow-sm"
            )}>
              {isDarkMode ? <Moon className="w-2.5 h-2.5 text-white" /> : <Sun className="w-2.5 h-2.5 text-amber-500" />}
            </div>
          </button>
        </div>
        <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
              <UserCircle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-800 truncate">{user.name}</p>
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className={cn(
              "text-[8px] font-black px-2 py-1 rounded-lg tracking-wider uppercase",
              user.role === 'TASKFORCE' ? "bg-amber-100 text-amber-600" : 
              user.role === 'MONITOR' ? "bg-purple-100 text-purple-600" :
              user.role === 'ADMIN' ? "bg-slate-800 text-white" :
              "bg-blue-100 text-blue-600"
            )}>
              {user.role === 'TASKFORCE' ? 'Đội TNXK' : user.role === 'MONITOR' ? 'Cán sự lớp' : user.role === 'ADMIN' ? 'Quản trị viên' : user.role}
            </span>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 text-rose-500 hover:text-white transition-all text-xs font-black px-4 py-3.5 hover:bg-rose-500 rounded-2xl border border-rose-100 hover:border-rose-500 group active:scale-95 shadow-sm hover:shadow-rose-200"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>ĐĂNG XUẤT</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button 
        className="lg:hidden fixed top-4 left-4 z-[60] bg-white/80 backdrop-blur-md text-slate-800 p-3 rounded-2xl shadow-xl border border-white/20 transition-all active:scale-95"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-500 ease-out lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
