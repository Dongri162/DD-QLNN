
import React, { useEffect } from 'react';

export interface Notification {
  id: string;
  studentName: string;
  parentName: string;
  type: string;
  timestamp: Date;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-6 right-6 z-[100] space-y-3 pointer-events-none">
      {notifications.map((notif) => (
        <NotificationToast 
          key={notif.id} 
          notification={notif} 
          onDismiss={() => onDismiss(notif.id)} 
        />
      ))}
    </div>
  );
};

const NotificationToast: React.FC<{ notification: Notification; onDismiss: () => void }> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="pointer-events-auto w-80 bg-white rounded-2xl shadow-2xl border-l-4 border-blue-600 p-4 animate-in slide-in-from-right-10 duration-300">
      <div className="flex items-start gap-3">
        <div className="bg-blue-50 p-2 rounded-xl text-blue-600 flex-shrink-0">
          <i className="fas fa-paper-plane"></i>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Đã gửi thông báo</h4>
            <button onClick={onDismiss} className="text-slate-300 hover:text-slate-500">
              <i className="fas fa-times text-[10px]"></i>
            </button>
          </div>
          <p className="text-sm font-bold text-slate-800 mt-1">Gửi cho Phụ huynh: {notification.parentName}</p>
          <p className="text-xs text-slate-500 mt-1">
            Học sinh <span className="font-bold text-blue-600">{notification.studentName}</span> đã được ghi nhận vi phạm <span className="font-bold text-rose-500">{notification.type}</span>.
          </p>
          <div className="flex items-center gap-1 mt-2 text-[9px] font-bold text-emerald-500">
            <i className="fas fa-check-circle"></i>
            <span>Đã xác nhận gửi qua SMS & App</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSystem;
