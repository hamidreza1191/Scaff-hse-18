
import React, { useState, useMemo } from 'react';
import type { Scaffold, Reminder } from '../types';
import { TagColor } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle, Tag, Clock, ArrowUpDown, ChevronDown, Bell, Check } from 'lucide-react';
import { format } from 'date-fns-jalali';

interface DashboardProps {
  scaffolds: Scaffold[];
  reminders: Reminder[];
  updateReminderStatus: (id: string, isCompleted: boolean) => void;
}

const tagColors = {
  [TagColor.Green]: 'bg-green-100 text-green-800',
  [TagColor.Yellow]: 'bg-yellow-100 text-yellow-800',
  [TagColor.Red]: 'bg-red-100 text-red-800',
};

const tagChartColors = {
  [TagColor.Green]: '#22c55e',
  [TagColor.Yellow]: '#facc15',
  [TagColor.Red]: '#ef4444',
};


const tagLabels = {
  [TagColor.Green]: 'سبز',
  [TagColor.Yellow]: 'زرد',
  [TagColor.Red]: 'قرمز',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700 text-white p-2 border border-gray-600 rounded">
        <p className="label">{`واحد: ${label}`}</p>
        <p className="intro">{`تعداد: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

type SortableKeys = 'unit' | 'overdueDays';

export const Dashboard: React.FC<DashboardProps> = ({ scaffolds, reminders: allReminders, updateReminderStatus }) => {
  const totalScaffolds = scaffolds.length;
  const greenTags = scaffolds.filter(s => s.tagColor === TagColor.Green).length;
  const yellowTags = scaffolds.filter(s => s.tagColor === TagColor.Yellow).length;
  const redTags = scaffolds.filter(s => s.tagColor === TagColor.Red).length;
  
  const [sortConfig, setSortConfig] = useState<{key: SortableKeys, direction: 'ascending' | 'descending'}>({ key: 'overdueDays', direction: 'descending' });
  const [isRemindersOpen, setIsRemindersOpen] = useState(true);
  const [isManualRemindersOpen, setIsManualRemindersOpen] = useState(true);
  const [isUnitChartOpen, setIsUnitChartOpen] = useState(true);
  const [isTagChartOpen, setIsTagChartOpen] = useState(true);

  const stats = [
    { name: 'کل داربست‌ها', value: totalScaffolds, icon: Tag, color: 'text-blue-500' },
    { name: 'تگ سبز', value: greenTags, icon: CheckCircle, color: 'text-green-500' },
    { name: 'تگ زرد', value: yellowTags, icon: AlertTriangle, color: 'text-yellow-500' },
    { name: 'تگ قرمز', value: redTags, icon: AlertTriangle, color: 'text-red-500' },
  ];

  const chartData = scaffolds.reduce((acc, scaffold) => {
    const unit = acc.find(item => item.name === scaffold.unit);
    if (unit) {
      unit.count += 1;
    } else {
      acc.push({ name: scaffold.unit, count: 1 });
    }
    return acc;
  }, [] as { name: string; count: number }[]);

  // Smart Reminders Logic
   const smartReminders = useMemo(() => {
    const today = new Date();
    const processed = scaffolds
      .map(scaffold => {
          const inspectionDate = new Date(scaffold.inspectionDate);
          const daysSinceInspection = Math.floor((today.getTime() - inspectionDate.getTime()) / (1000 * 3600 * 24));
          let overdueDays = 0;
          let requiresInspection = false;

          if (scaffold.tagColor === TagColor.Green && daysSinceInspection > 30) {
              requiresInspection = true;
              overdueDays = daysSinceInspection - 30;
          }
          if (scaffold.tagColor === TagColor.Yellow && daysSinceInspection > 7) {
              requiresInspection = true;
              overdueDays = daysSinceInspection - 7;
          }

          return { ...scaffold, requiresInspection, overdueDays };
      })
      .filter(s => s.requiresInspection);

      processed.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    return processed;
  }, [scaffolds, sortConfig]);

  const pendingManualReminders = useMemo(() => {
    const now = new Date();
    return allReminders
      .filter(r => !r.isCompleted && new Date(r.targetDateTime) <= now)
      .sort((a, b) => new Date(a.targetDateTime).getTime() - new Date(b.targetDateTime).getTime());
  }, [allReminders]);


  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
        direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortableKeys) => {
    if (sortConfig.key !== key) {
        return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    if (sortConfig.direction === 'ascending') {
        return <ArrowUpDown className="w-4 h-4 text-blue-600 transform rotate-180" />;
    }
    return <ArrowUpDown className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow-md flex items-center">
            <stat.icon className={`w-12 h-12 ml-4 ${stat.color}`} />
            <div>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-gray-500">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>
      
       <div className="bg-white rounded-lg shadow-md">
        <button
          onClick={() => setIsManualRemindersOpen(!isManualRemindersOpen)}
          className="w-full flex justify-between items-center p-6 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg"
          aria-expanded={isManualRemindersOpen}
          aria-controls="manual-reminders-content"
        >
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <Bell className="w-6 h-6 ml-2 text-blue-500" />
              یادآورهای دستی
          </h2>
          <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isManualRemindersOpen ? 'rotate-180' : ''}`} />
        </button>
        {isManualRemindersOpen && (
          <div id="manual-reminders-content" className="px-6 pb-6 border-t border-gray-200">
             {pendingManualReminders.length > 0 ? (
                <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm text-right text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-3">زمان</th>
                                <th scope="col" className="px-4 py-3">واحد</th>
                                <th scope="col" className="px-4 py-3">شماره تگ</th>
                                <th scope="col" className="px-4 py-3">توضیحات</th>
                                <th scope="col" className="px-4 py-3">عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingManualReminders.map(reminder => (
                                <tr key={reminder.id} className="bg-white border-b hover:bg-green-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{format(new Date(reminder.targetDateTime), 'yyyy/MM/dd HH:mm')}</td>
                                    <td className="px-4 py-3">{reminder.unit}</td>
                                    <td className="px-4 py-3">{reminder.tagNumber}</td>
                                    <td className="px-4 py-3 max-w-xs truncate">{reminder.notes}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => updateReminderStatus(reminder.id, true)} className="text-green-600 hover:text-green-800 bg-green-100 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                                            <Check className="w-4 h-4" />
                                            تکمیل شد
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                 <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg mt-4">
                    <p className="font-semibold">هیچ یادآور دستی ثبت نشده است.</p>
                </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <button
          onClick={() => setIsRemindersOpen(!isRemindersOpen)}
          className="w-full flex justify-between items-center p-6 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg"
          aria-expanded={isRemindersOpen}
          aria-controls="reminders-content"
        >
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <Clock className="w-6 h-6 ml-2 text-blue-500" />
              یادآور هوشمند (بازرسی‌های مورد نیاز)
          </h2>
          <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isRemindersOpen ? 'rotate-180' : ''}`} />
        </button>
        {isRemindersOpen && (
          <div id="reminders-content" className="px-6 pb-6 border-t border-gray-200">
             {smartReminders.length > 0 ? (
                <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm text-right text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-3 cursor-pointer" onClick={() => requestSort('unit')}>
                                    <div className="flex items-center justify-end gap-1">
                                        {getSortIcon('unit')}
                                        <span>واحد</span>
                                    </div>
                                </th>
                                <th scope="col" className="px-4 py-3">موقعیت</th>
                                <th scope="col" className="px-4 py-3">شماره تگ</th>
                                <th scope="col" className="px-4 py-3">وضعیت تگ</th>
                                <th scope="col" className="px-4 py-3">آخرین بازرسی</th>
                                <th scope="col" className="px-4 py-3 cursor-pointer" onClick={() => requestSort('overdueDays')}>
                                    <div className="flex items-center justify-end gap-1">
                                        {getSortIcon('overdueDays')}
                                        <span>تأخیر (روز)</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {smartReminders.map(scaffold => (
                                <tr key={scaffold.id} className="bg-white border-b hover:bg-yellow-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{scaffold.unit}</td>
                                    <td className="px-4 py-3">{scaffold.location}</td>
                                    <td className="px-4 py-3">{scaffold.tagNumber}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full font-semibold text-xs ${tagColors[scaffold.tagColor]}`}>
                                            {tagLabels[scaffold.tagColor]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{format(new Date(scaffold.inspectionDate), 'yyyy/MM/dd')}</td>
                                    <td className="px-4 py-3">
                                        <span className="font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md">{scaffold.overdueDays}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                 <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg mt-4">
                    <p className="font-semibold">هیچ بازرسی مورد نیازی یافت نشد.</p>
                    <p className="text-sm">همه چیز بروز است!</p>
                </div>
            )}
          </div>
        )}
        </div>
      

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md">
           <button
            onClick={() => setIsUnitChartOpen(!isUnitChartOpen)}
            className="w-full flex justify-between items-center p-6 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg"
            aria-expanded={isUnitChartOpen}
            aria-controls="unit-chart-content"
          >
            <h2 className="text-xl font-semibold text-gray-800">تعداد داربست بر اساس واحد</h2>
            <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isUnitChartOpen ? 'rotate-180' : ''}`} />
          </button>
          {isUnitChartOpen && (
            <div id="unit-chart-content" className="px-6 pb-6 border-t border-gray-200">
              <div className="mt-4" style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#4b5563" tick={{ fill: '#4b5563', dx:0, dy:10, angle: -10, fontSize: 12, textAnchor: 'end' }} />
                    <YAxis stroke="#4b5563" allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(230, 230, 230, 0.5)'}}/>
                    <Bar dataKey="count" name="تعداد داربست" fill="#3b82f6" barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md">
           <button
            onClick={() => setIsTagChartOpen(!isTagChartOpen)}
            className="w-full flex justify-between items-center p-6 text-right focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg"
            aria-expanded={isTagChartOpen}
            aria-controls="tag-chart-content"
          >
            <h2 className="text-xl font-semibold text-gray-800">پراکندگی وضعیت تگ‌ها</h2>
            <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isTagChartOpen ? 'rotate-180' : ''}`} />
          </button>
          {isTagChartOpen && (
             <div id="tag-chart-content" className="px-6 pb-6 border-t border-gray-200">
              <div className="mt-4" style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={[{ name: 'وضعیت تگ‌ها', green: greenTags, yellow: yellowTags, red: redTags }]} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <XAxis type="number" stroke="#4b5563" hide />
                    <YAxis type="category" dataKey="name" stroke="#4b5563" width={80} />
                    <Tooltip cursor={{fill: 'rgba(230, 230, 230, 0.5)'}}/>
                    <Legend />
                    <Bar dataKey="green" name="سبز" stackId="a" fill={tagChartColors.green} />
                    <Bar dataKey="yellow" name="زرد" stackId="a" fill={tagChartColors.yellow} />
                    <Bar dataKey="red" name="قرمز" stackId="a" fill={tagChartColors.red} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
