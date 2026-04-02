import React from 'react';
import { Clock } from 'lucide-react';
import { useTimesheetData } from '../../features/staff/useTimesheetData';
import { useAuthStore } from '../../store/authStore';
import { TimesheetStatus } from '../../types';

export const ClockInButton: React.FC = () => {
  const { timesheets, clockIn, clockOut } = useTimesheetData();
  const { currentUser } = useAuthStore();

  const openShift = timesheets.find(t => 
    t.staff_name === currentUser?.name && 
    t.status === TimesheetStatus.ACTIVE && 
    !t.clock_out
  );

  const handleToggle = async () => {
    if (openShift) {
      await clockOut(openShift.id);
    } else if (currentUser?.name) {
      await clockIn(currentUser.name);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        flex items-center px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all shadow-sm
        ${openShift 
          ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
        }
      `}
    >
      <Clock size={16} className="mr-2" />
      {openShift ? 'Clock Out' : 'Clock In'}
    </button>
  );
};
