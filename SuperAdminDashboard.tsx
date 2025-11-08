
import React, { useState, useMemo } from 'react';
import type { Inspector, Scaffold, Reminder } from '../types';
import { ChevronDown, Users, FileOutput, BellRing, Trash2 } from 'lucide-react';
import { exportAllScaffoldsToWord } from '../services/exportService';
import { format, parse } from 'date-fns-jalali';

interface SuperAdminDashboardProps {
    inspectors: Inspector[];
    scaffolds: Scaffold[];
    reminders: Reminder[];
    addReminder: (reminder: Omit<Reminder, 'id' | 'isCompleted'>) => void;
    deleteReminder: (id: string) => void;
    onViewInspector: (id: string) => void;
}

const initialReminderState = {
    inspectorId: '',
    date: format(new Date(), 'yyyy/MM/dd'),
    time: format(new Date(), 'HH:mm'),
    unit: '',
    tagNumber: '',
    notes: '',
};

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ inspectors, scaffolds, reminders, addReminder, deleteReminder, onViewInspector }) => {
    const [isInspectorListOpen, setIsInspectorListOpen] = useState(true);
    const [isReportingOpen, setIsReportingOpen] = useState(true);
    const [isReminderMgmtOpen, setIsReminderMgmtOpen] = useState(true);
    const [newReminderData, setNewReminderData] = useState(initialReminderState);
    
    const inspectorStats = useMemo(() => {
        return inspectors.map(inspector => {
            const count = scaffolds.filter(s => s.inspectorId === inspector.id).length;
            return { ...inspector, scaffoldCount: count };
        });
    }, [inspectors, scaffolds]);

    const handleReminderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewReminderData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddReminder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReminderData.inspectorId) {
            alert('لطفا یک بازرس را انتخاب کنید.');
            return;
        }

        try {
            const targetDate = parse(newReminderData.date, 'yyyy/MM/dd', new Date());
            if (isNaN(targetDate.getTime())) {
                throw new Error('Invalid date format');
            }
            const [hours, minutes] = newReminderData.time.split(':').map(Number);
            targetDate.setHours(hours, minutes);

            addReminder({
                inspectorId: newReminderData.inspectorId,
                targetDateTime: targetDate.toISOString(),
                unit: newReminderData.unit,
                tagNumber: newReminderData.tagNumber,
                notes: newReminderData.notes,
            });
            setNewReminderData({ ...initialReminderState, inspectorId: newReminderData.inspectorId }); // Reset form but keep inspector
        } catch(error) {
            alert('فرمت تاریخ یا زمان نامعتبر است. لطفا فرمت صحیح را وارد کنید (تاریخ: yyyy/MM/dd، زمان: HH:mm).');
        }
    };

    const activeReminders = useMemo(() => {
        return reminders
            .filter(r => !r.isCompleted)
            .map(r => ({ ...r, inspectorName: inspectors.find(i => i.id === r.inspectorId)?.name || 'ناشناس' }))
            .sort((a,b) => new Date(a.targetDateTime).getTime() - new Date(b.targetDateTime).getTime());
    }, [reminders, inspectors]);


    return (
        <div className="space-y-6">
             <div className="bg-white rounded-lg shadow-md">
                <button
                onClick={() => setIsInspectorListOpen(!isInspectorListOpen)}
                className="w-full flex justify-between items-center p-5 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg"
                >
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                        <Users className="w-6 h-6 ml-2 text-blue-500" />
                        آمار بازرس‌ها
                    </h2>
                    <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isInspectorListOpen ? 'rotate-180' : ''}`} />
                </button>
                {isInspectorListOpen && (
                    <div className="px-5 pb-5 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            {inspectorStats.map(stat => (
                                <button
                                    key={stat.id}
                                    onClick={() => onViewInspector(stat.id)}
                                    className="p-4 bg-gray-50 border rounded-lg text-right hover:bg-blue-50 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                                >
                                    <p className="font-bold text-gray-800">{stat.name}</p>
                                    <p className="text-sm text-gray-600">تعداد داربست ثبت شده: <span className="font-semibold text-blue-600">{stat.scaffoldCount}</span></p>
                                </button>
                            ))}
                             {inspectorStats.length === 0 && <p className="text-center text-gray-500 py-4 col-span-full">هیچ بازرسی ثبت نشده است.</p>}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-md">
                <button
                onClick={() => setIsReminderMgmtOpen(!isReminderMgmtOpen)}
                className="w-full flex justify-between items-center p-5 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg"
                >
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                        <BellRing className="w-6 h-6 ml-2 text-blue-500" />
                        مدیریت یادآورهای بازرسان
                    </h2>
                    <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isReminderMgmtOpen ? 'rotate-180' : ''}`} />
                </button>
                {isReminderMgmtOpen && (
                    <div className="px-5 pb-5 border-t border-gray-200">
                        <form onSubmit={handleAddReminder} className="mt-5 space-y-4">
                            <h3 className="font-semibold text-gray-700">افزودن یادآور جدید</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 <select name="inspectorId" value={newReminderData.inspectorId} onChange={handleReminderChange} required className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                    <option value="">انتخاب بازرس...</option>
                                    {inspectors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                                <input type="text" name="date" value={newReminderData.date} onChange={handleReminderChange} placeholder="تاریخ (1403/05/01)" required className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                <input type="time" name="time" value={newReminderData.time} onChange={handleReminderChange} required className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                <input type="text" name="unit" value={newReminderData.unit} onChange={handleReminderChange} placeholder="واحد" required className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                <input type="text" name="tagNumber" value={newReminderData.tagNumber} onChange={handleReminderChange} placeholder="شماره تگ" required className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                <input type="text" name="notes" value={newReminderData.notes} onChange={handleReminderChange} placeholder="توضیحات" required className="col-span-1 md:col-span-full lg:col-span-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                            </div>
                            <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                                <BellRing className="w-5 h-5"/>
                                افزودن یادآور
                            </button>
                        </form>
                        <div className="mt-6">
                            <h3 className="font-semibold text-gray-700 mb-2">لیست یادآورهای فعال</h3>
                             <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                                {activeReminders.map(reminder => (
                                    <div key={reminder.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                                        <div>
                                            <p className="font-semibold text-gray-800">{reminder.inspectorName}</p>
                                            <p className="text-sm text-gray-600">{format(new Date(reminder.targetDateTime), 'yyyy/MM/dd HH:mm')}</p>
                                            <p className="text-sm text-gray-600">{`واحد: ${reminder.unit} - تگ: ${reminder.tagNumber}`}</p>
                                            <p className="text-xs text-gray-500">{reminder.notes}</p>
                                        </div>
                                        <button onClick={() => deleteReminder(reminder.id)} className="text-red-500 hover:text-red-700" title="حذف یادآور">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                {activeReminders.length === 0 && <p className="text-center text-gray-500 py-4">هیچ یادآور فعالی ثبت نشده است.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>

             <div className="bg-white rounded-lg shadow-md">
                <button
                onClick={() => setIsReportingOpen(!isReportingOpen)}
                className="w-full flex justify-between items-center p-5 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg"
                >
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                        <FileOutput className="w-6 h-6 ml-2 text-blue-500" />
                        گزارش‌گیری کلی
                    </h2>
                    <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isReportingOpen ? 'rotate-180' : ''}`} />
                </button>
                {isReportingOpen && (
                    <div className="px-5 pb-5 border-t border-gray-200">
                        <p className="text-gray-600 mt-4 mb-4">
                            از تمام داربست‌های ثبت شده توسط همه بازرسان در بازه زمانی مشخص شده خروجی Word تهیه کنید.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                             <button 
                                onClick={() => exportAllScaffoldsToWord(scaffolds, inspectors, 'weekly')}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                            >
                                <FileOutput className="w-5 h-5"/>
                                گزارش هفتگی
                            </button>
                             <button 
                                onClick={() => exportAllScaffoldsToWord(scaffolds, inspectors, 'monthly')}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                            >
                                <FileOutput className="w-5 h-5"/>
                                گزارش ماهانه
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
