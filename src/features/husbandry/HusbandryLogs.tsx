import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Loader2, Edit2, Trash2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import AddEntryModal from './AddEntryModal';
import { Animal, LogType, LogEntry } from '../../types';
import { formatWeightDisplay, parseLegacyWeightToGrams } from '../../services/weightUtils';
import { getUKLocalDate } from '../../services/temporalService';
import { useDailyLogData } from './useDailyLogData'; 
import { DataTable } from '../../components/ui/DataTable';

interface HusbandryLogsProps {
  animalId?: string;
  weightUnit?: 'g' | 'kg' | 'oz' | 'lbs_oz';
  animal?: Animal; // Keep for modal context
}

const validHusbandryTypes = ['FEED', 'WEIGHT', 'FLIGHT', 'TRAINING', 'TEMPERATURE'];

const HusbandryLogs: React.FC<HusbandryLogsProps> = ({ animalId, weightUnit = 'g', animal }) => {
  const effectiveAnimalId = animalId || animal?.id;
  const { dailyLogs: logs, isLoading: loading } = useDailyLogData('today', 'all', effectiveAnimalId);
  
  const [filter, setFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | undefined>(undefined);
  
  const filters = ['ALL', ...validHusbandryTypes];

  const handleSaveLog = async (entry: Partial<LogEntry>) => {
    try {
      console.log("☢️ [Zero Dawn] Save husbandry log is neutralized.", entry);
      alert("Database engine is neutralized. Log cannot be saved.");
      setIsAddModalOpen(false);
      setSelectedLog(undefined);
    } catch (err) {
      console.error('Failed to save log:', err);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      console.log("☢️ [Zero Dawn] Delete husbandry log is neutralized.", id);
      alert("Database engine is neutralized. Log cannot be deleted.");
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    let baseLogs = logs.filter(log => validHusbandryTypes.includes(log.log_type?.toUpperCase() || ''));
    if (filter !== 'ALL') {
      baseLogs = baseLogs.filter(log => log.log_type?.toUpperCase() === filter);
    }
    // Sort by date descending
    return baseLogs.sort((a, b) => {
      const dateA = new Date(a.log_date || a.created_at || 0).getTime();
      const dateB = new Date(b.log_date || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [logs, filter]);

  const renderLogValue = useCallback((log: LogEntry) => {
    if (log.log_type?.toUpperCase() === 'WEIGHT') {
      const grams = parseLegacyWeightToGrams(log.value);
      if (grams !== null && !isNaN(grams)) {
        return formatWeightDisplay(grams, weightUnit as 'g' | 'kg' | 'oz' | 'lbs_oz');
      }
    }
    return log.value || log.notes || '—';
  }, [weightUnit]);

  const getTypeColor = (type: string) => {
    const safeType = type?.toUpperCase();
    switch (safeType) {
      case 'FEED': return 'bg-emerald-100 text-emerald-800';
      case 'WEIGHT': return 'bg-blue-100 text-blue-800';
      case 'FLIGHT': return 'bg-purple-100 text-purple-800';
      case 'TRAINING': return 'bg-amber-100 text-amber-800';
      case 'TEMPERATURE': return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const columns: ColumnDef<LogEntry>[] = useMemo(() => [
    {
      accessorKey: 'log_date',
      header: 'Date',
      cell: info => {
        const val = info.getValue() as string | undefined;
        return val ? new Date(val).toLocaleDateString() : '—';
      }
    },
    {
      accessorKey: 'log_type',
      header: 'Type',
      cell: info => {
        const type = (info.getValue() as string) || '';
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getTypeColor(type)}`}>
            {type}
          </span>
        );
      }
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: info => {
        const log = info.row.original;
        const displayValue = renderLogValue(log);
        return <span className="font-bold text-slate-900">{displayValue}</span>;
      }
    },
    {
      accessorKey: 'id',
      header: 'Actions',
      cell: info => {
        const log = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setSelectedLog(log); setIsAddModalOpen(true); }} 
              className="text-blue-600 hover:text-blue-800 p-1"
              title="Edit Log"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={() => handleDeleteLog(log.id!)} 
              className="text-red-600 hover:text-red-800 p-1"
              title="Delete Log"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      }
    }
  ], [renderLogValue]);

  return (
    <div className="space-y-4 relative">
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${filter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <button 
        onClick={() => { setSelectedLog(undefined); setIsAddModalOpen(true); }}
        className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition w-fit"
      >
        <Plus size={16} /> + ADD HUSBANDRY LOG
      </button>

      {loading ? (
        <div className="p-8 text-center text-slate-400 border border-slate-200 rounded-lg bg-white">
          <Loader2 className="animate-spin mx-auto" size={24} />
          <p className="mt-2 text-sm">Loading logs...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredLogs} pageSize={10} />
      )}

      {isAddModalOpen && (animal || true) && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => { setIsAddModalOpen(false); setSelectedLog(undefined); }}
          onSave={handleSaveLog}
          animal={animal!}
          existingLog={selectedLog}
          initialType={LogType.FEED}
          initialDate={getUKLocalDate()}
        />
      )}
    </div>
  );
};

export default HusbandryLogs;
