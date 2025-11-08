
import React, { useState, useMemo } from 'react';
import type { Inspector, Reminder } from '../types';
import { UserPlus, Trash2, ShieldAlert, ChevronDown, BellRing } from 'lucide-react';
import { format, parse } from 'date-fns-jalali';

interface SettingsProps {
  inspectors: Inspector[];
  addInspector: (name: string) => void;
  deleteInspector: (id: string) => void;
  resetApp: () => void;
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'isCompleted'>) => void;
  deleteReminder: (id: string) => void;
  currentInspectorId: string | null;
  isAdmin?: boolean;
}

const initialReminderState = {
    date: format(new Date(), 'yyyy/MM/dd'),
    time: format(new Date(), 'HH:mm'),
    unit: '',
    tagNumber: '',
    notes: '',
};

export const Settings: React.FC<SettingsProps> = ({ 
    inspectors, 
    addInspector, 
    deleteInspector, 
    resetApp, 
    reminders, 
    addReminder, 
    deleteReminder, 
    currentInspectorId, 
    isAdmin = false 
}) => {
  const [newInspectorName, setNewInspectorName] = useState('');
  const [newReminderData, setNewReminderData] = useState(initialReminderState);
  const [isInspectorsOpen, setIsInspectorsOpen] = useState(true);
  const [isRemindersOpen, setIsRemindersOpen] = useState(true);
  const [isDangerZoneOpen, setIsDangerZoneOpen] = useState(false);


  const handleAddInspector = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInspectorName.trim()) {
      addInspector(newInspectorName.trim());
      setNewInspectorName('');
    }
  };
  
  const handleReminderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewReminderData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInspectorId) return;

    try {
        const targetDate = parse(newReminderData.date, 'yyyy/MM/dd', new Date());
        if (isNaN(targetDate.getTime())) {
            throw new Error('Invalid date format');
        }
        const [hours, minutes] = newReminderData.time.split(':').map(Number);
        targetDate.setHours(hours, minutes);

        addReminder({
            inspectorId: currentInspectorId,
            targetDateTime: targetDate.toISOString(),
            unit: newReminderData.unit,
            tagNumber: newReminderData.tagNumber,
            notes: newReminderData.notes,
        });
        setNewReminderData(initialReminderState); // Reset form
    } catch(error) {
        alert('فرمت تاریخ یا زمان نامعتبر است. لطفا فرمت صحیح را وارد کنید (تاریخ: yyyy/MM/dd، زمان: HH:mm).');
    }
  };

  const upcomingReminders = useMemo(() => {
    return reminders
        .filter(r => !r.isCompleted)
        .sort((a,b) => new Date(a.targetDateTime).getTime() - new Date(b.targetDateTime).getTime());
  }, [reminders]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md">
        <button
          onClick={() => setIsInspectorsOpen(!isInspectorsOpen)}
          className="w-full flex justify-between items-center p-5 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg"
          aria-expanded={isInspectorsOpen}
          aria-controls="inspectors-content"
        >
          <h2 className="text-xl font-semibold text-gray-800">مدیریت بازرس‌ها</h2>
          <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isInspectorsOpen ? 'rotate-180' : ''}`} />
        </button>
        {isInspectorsOpen && (
          <div id="inspectors-content" className="px-5 pb-5 border-t border-gray-200">
            <form onSubmit={handleAddInspector} className="flex flex-col sm:flex-row gap-3 mt-5 mb-6">
              <input
                type="text"
                value={newInspectorName}
                onChange={(e) => setNewInspectorName(e.target.value)}
                placeholder="نام بازرس جدید"
                className="flex-grow bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5"/>
                افزودن بازرس
              </button>
            </form>
            <div className="space-y-3">
              {inspectors.map(inspector => (
                <div key={inspector.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                  <span className="font-medium text-gray-700">{inspector.name}</span>
                  <button onClick={() => deleteInspector(inspector.id)} className="text-red-500 hover:text-red-700" title={`حذف ${inspector.name}`}>
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
               {inspectors.length === 0 && <p className="text-center text-gray-500 py-4">هیچ بازرسی ثبت نشده است.</p>}
            </div>
          </div>
        )}
      </div>

       {!isAdmin && (
        <div className="bg-white rounded-lg shadow-md">
            <button
            onClick={() => setIsRemindersOpen(!isRemindersOpen)}
            className="w-full flex justify-between items-center p-5 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg"
            aria-expanded={isRemindersOpen}
            aria-controls="reminders-content"
            >
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <BellRing className="w-6 h-6 ml-2 text-blue-500"/>
                تنظیمات یادآور
            </h2>
            <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isRemindersOpen ? 'rotate-180' : ''}`} />
            </button>
            {isRemindersOpen && (
            <div id="reminders-content" className="px-5 pb-5 border-t border-gray-200">
                <form onSubmit={handleAddReminder} className="mt-5 space-y-4">
                    <h3 className="font-semibold text-gray-700">افزودن یادآور جدید</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" name="date" value={newReminderData.date} onChange={handleReminderChange} placeholder="تاریخ (1403/05/01)" required className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        <input type="time" name="time" value={newReminderData.time} onChange={handleReminderChange} required className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        <input type="text" name="unit" value={newReminderData.unit} onChange={handleReminderChange} placeholder="واحد" required className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        <input type="text" name="tagNumber" value={newReminderData.tagNumber} onChange={handleReminderChange} placeholder="شماره تگ" required className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        <input type="text" name="notes" value={newReminderData.notes} onChange={handleReminderChange} placeholder="توضیحات" required className="col-span-1 md:col-span-2 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                        <BellRing className="w-5 h-5"/>
                        افزودن یادآور
                    </button>
                </form>
                <div className="mt-6">
                    <h3 className="font-semibold text-gray-700 mb-2">یادآورهای آینده</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {upcomingReminders.map(reminder => (
                        <div key={reminder.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                            <div>
                                <p className="font-semibold text-gray-800">{format(new Date(reminder.targetDateTime), 'yyyy/MM/dd HH:mm')}</p>
                                <p className="text-sm text-gray-600">{`واحد: ${reminder.unit} - تگ: ${reminder.tagNumber}`}</p>
                                <p className="text-xs text-gray-500">{reminder.notes}</p>
                            </div>
                            <button onClick={() => deleteReminder(reminder.id)} className="text-red-500 hover:text-red-700" title="حذف یادآور">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    {upcomingReminders.length === 0 && <p className="text-center text-gray-500 py-4">هیچ یادآور فعالی ثبت نشده است.</p>}
                    </div>
                </div>
            </div>
            )}
        </div>
       )}

      <div className={`bg-white rounded-lg shadow-md border-red-500 ${isDangerZoneOpen ? 'border-t-4' : ''}`}>
         <button
          onClick={() => setIsDangerZoneOpen(!isDangerZoneOpen)}
          className="w-full flex justify-between items-center p-5 text-right focus:outline-none focus:ring-2 focus:ring-red-300 rounded-lg"
          aria-expanded={isDangerZoneOpen}
          aria-controls="danger-zone-content"
        >
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <ShieldAlert className="w-7 h-7 ml-3 text-red-500"/>
              منطقه خطر
          </h2>
          <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isDangerZoneOpen ? 'rotate-180' : ''}`} />
        </button>
        {isDangerZoneOpen && (
            <div id="danger-zone-content" className="px-5 pb-5 border-t border-gray-200">
                <p className="text-gray-600 mt-5 mb-4">
                    این عمل تمام اطلاعات برنامه شامل بازرس‌ها و داربست‌ها را برای همیشه پاک می‌کند. این عمل غیرقابل بازگشت است.
                </p>
                <button 
                    onClick={resetApp}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center gap-2"
                    >
                    <Trash2 className="w-5 h-5"/>
                    ریست کلی برنامه
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
