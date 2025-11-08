
import React, { useState, useMemo } from 'react';
import type { Scaffold } from '../types';
import { TagColor } from '../types';
import { PlusCircle, Edit, Trash2, Filter, FileDown, Printer, ClipboardCheck, FileText, FileArchive } from 'lucide-react';
import { ScaffoldFormModal } from './ScaffoldFormModal';
import { ChecklistModal } from './ChecklistModal';
import { CHECKLIST_QUESTIONS } from '../constants';
import { exportToExcel, exportToPdf, printTable, exportToWord, exportScaffoldDetailsToWord } from '../services/exportService';
import { format } from 'date-fns-jalali';

interface ScaffoldListProps {
  scaffolds: Scaffold[];
  addScaffold: (scaffold: Omit<Scaffold, 'id' | 'inspectorId' | 'checklist'>) => void;
  updateScaffold: (scaffold: Scaffold) => void;
  deleteScaffold: (id: string) => void;
  inspectorName: string;
}

const tagClasses = {
  [TagColor.Green]: 'bg-green-100 text-green-800',
  [TagColor.Yellow]: 'bg-yellow-100 text-yellow-800',
  [TagColor.Red]: 'bg-red-100 text-red-800',
};

const tagLabels = {
  [TagColor.Green]: 'سبز',
  [TagColor.Yellow]: 'زرد',
  [TagColor.Red]: 'قرمز',
};

export const ScaffoldList: React.FC<ScaffoldListProps> = ({ scaffolds, addScaffold, updateScaffold, deleteScaffold, inspectorName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [editingScaffold, setEditingScaffold] = useState<Scaffold | null>(null);
  const [inspectingScaffold, setInspectingScaffold] = useState<Scaffold | null>(null);
  const [filter, setFilter] = useState('');

  const filteredScaffolds = useMemo(() => {
    return scaffolds.filter(s =>
      s.unit.toLowerCase().includes(filter.toLowerCase()) ||
      s.location.toLowerCase().includes(filter.toLowerCase()) ||
      s.tagNumber.toLowerCase().includes(filter.toLowerCase()) ||
      s.permitNumber.toLowerCase().includes(filter.toLowerCase())
    );
  }, [scaffolds, filter]);

  const handleOpenModal = (scaffold: Scaffold | null = null) => {
    setEditingScaffold(scaffold);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingScaffold(null);
  };

  const handleSave = (scaffoldData: Omit<Scaffold, 'id' | 'inspectorId'> | Scaffold) => {
    if ('id' in scaffoldData) {
      updateScaffold(scaffoldData as Scaffold);
    } else {
      addScaffold(scaffoldData as Omit<Scaffold, 'id' | 'inspectorId' | 'checklist'>);
    }
    handleCloseModal();
  };

  const handleOpenChecklistModal = (scaffold: Scaffold) => {
    const scaffoldForInspection = {
      ...scaffold,
      checklist: scaffold.checklist && scaffold.checklist.length === CHECKLIST_QUESTIONS.length
        ? scaffold.checklist
        : CHECKLIST_QUESTIONS.map((_q, index) => ({
            questionId: index + 1,
            status: 'na' as const,
            description: ''
          }))
    };
    setInspectingScaffold(scaffoldForInspection);
    setIsChecklistModalOpen(true);
  };

  const handleCloseChecklistModal = () => {
    setIsChecklistModalOpen(false);
    setInspectingScaffold(null);
  };

  const handleSaveChecklist = (updatedScaffold: Scaffold) => {
    updateScaffold(updatedScaffold);
    handleCloseChecklistModal();
  };
  
  const handleExportFullReport = (scaffold: Scaffold) => {
    exportScaffoldDetailsToWord(scaffold, inspectorName);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md print-section">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 no-print">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 md:mb-0">لیست داربست‌ها</h2>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            <span>جدید</span>
          </button>
        </div>
      </div>
        <div className="flex items-center gap-3 mb-4 no-print">
            <span className="font-semibold">خروجی:</span>
            <button onClick={() => exportToExcel(filteredScaffolds)} className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 flex items-center gap-2 text-sm">
                <FileDown className="w-4 h-4"/> Excel
            </button>
            <button onClick={() => exportToPdf(filteredScaffolds)} className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 flex items-center gap-2 text-sm">
                <FileDown className="w-4 h-4"/> PDF
            </button>
             <button onClick={() => exportToWord(filteredScaffolds, inspectorName)} className="bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4"/> Word
            </button>
            <button onClick={printTable} className="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 flex items-center gap-2 text-sm">
                <Printer className="w-4 h-4"/> چاپ
            </button>
        </div>

      <div className="overflow-x-auto">
        <table id="scaffold-table" className="w-full text-sm text-right text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">واحد</th>
              <th scope="col" className="px-6 py-3">موقعیت</th>
              <th scope="col" className="px-6 py-3">شماره تگ</th>
              <th scope="col" className="px-6 py-3">شماره پرمیت</th>
              <th scope="col" className="px-6 py-3">تاریخ بازرسی</th>
              <th scope="col" className="px-6 py-3">وضعیت تگ</th>
              <th scope="col" className="px-6 py-3 no-print">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filteredScaffolds.map((scaffold) => (
              <tr key={scaffold.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{scaffold.unit}</td>
                <td className="px-6 py-4">{scaffold.location}</td>
                <td className="px-6 py-4">{scaffold.tagNumber}</td>
                <td className="px-6 py-4">{scaffold.permitNumber}</td>
                <td className="px-6 py-4">{format(new Date(scaffold.inspectionDate), 'yyyy/MM/dd')}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full font-semibold text-xs ${tagClasses[scaffold.tagColor]}`}>
                    {tagLabels[scaffold.tagColor]}
                  </span>
                </td>
                <td className="px-6 py-4 flex items-center gap-4 no-print">
                   <button onClick={() => handleExportFullReport(scaffold)} className="text-purple-600 hover:text-purple-800" title="خروجی گزارش کامل">
                    <FileArchive className="w-5 h-5" />
                  </button>
                   <button onClick={() => handleOpenChecklistModal(scaffold)} className="text-gray-600 hover:text-gray-800" title="تکمیل چک‌لیست بازرسی">
                    <ClipboardCheck className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleOpenModal(scaffold)} className="text-blue-600 hover:text-blue-800" title="ویرایش اطلاعات پایه">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => deleteScaffold(scaffold.id)} className="text-red-600 hover:text-red-800" title="حذف داربست">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
             {filteredScaffolds.length === 0 && (
                <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500">
                        هیچ داربستی یافت نشد.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      {isModalOpen && <ScaffoldFormModal onClose={handleCloseModal} onSave={handleSave} scaffold={editingScaffold} />}
      {isChecklistModalOpen && inspectingScaffold && (
        <ChecklistModal
            scaffold={inspectingScaffold}
            onClose={handleCloseChecklistModal}
            onSave={handleSaveChecklist}
        />
      )}
    </div>
  );
};
