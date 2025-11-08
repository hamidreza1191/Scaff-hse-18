
import React, { useState, useEffect } from 'react';
import type { Scaffold, ChecklistItem } from '../types';
import { CHECKLIST_QUESTIONS } from '../constants';

interface ChecklistModalProps {
  onClose: () => void;
  onSave: (scaffold: Scaffold) => void;
  scaffold: Scaffold;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({ onClose, onSave, scaffold }) => {
  const [checklistData, setChecklistData] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    // Initialize state from scaffold prop, ensuring it's a deep copy
    setChecklistData(JSON.parse(JSON.stringify(scaffold.checklist || [])));
  }, [scaffold]);

  const handleStatusChange = (questionId: number, status: ChecklistItem['status']) => {
    setChecklistData(prev => prev.map(item => item.questionId === questionId ? { ...item, status } : item));
  };

  const handleDescriptionChange = (questionId: number, description: string) => {
    setChecklistData(prev => prev.map(item => item.questionId === questionId ? { ...item, description } : item));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...scaffold, checklist: checklistData });
  };

  if (!checklistData.length) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 vazir-font no-print p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
        <header className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">چک‌لیست بازرسی داربست</h2>
          <p className="text-sm text-gray-600">
            واحد: <span className="font-semibold">{scaffold.unit}</span>, موقعیت: <span className="font-semibold">{scaffold.location}</span>
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {CHECKLIST_QUESTIONS.map((question, index) => {
              const questionId = index + 1;
              const answer = checklistData.find(item => item.questionId === questionId)!;
              return (
                <div key={questionId} className="p-3 border rounded-lg bg-gray-50">
                  <p className="mb-2 font-medium text-gray-700">{questionId}. {question}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-around space-x-2 space-x-reverse border border-gray-200 rounded-md p-2 bg-white">
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-100">
                          <input type="radio" name={`status-${questionId}`} value="yes" checked={answer.status === 'yes'} onChange={() => handleStatusChange(questionId, 'yes')} className="form-radio text-green-600"/>
                          <span className="text-sm font-medium text-gray-700">بله</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-100">
                          <input type="radio" name={`status-${questionId}`} value="no" checked={answer.status === 'no'} onChange={() => handleStatusChange(questionId, 'no')} className="form-radio text-red-600"/>
                          <span className="text-sm font-medium text-gray-700">خیر</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-100">
                          <input type="radio" name={`status-${questionId}`} value="na" checked={answer.status === 'na'} onChange={() => handleStatusChange(questionId, 'na')} className="form-radio text-gray-600"/>
                          <span className="text-sm font-medium text-gray-700">مرتبط نیست</span>
                        </label>
                    </div>
                     <div>
                       <input
                          type="text"
                          placeholder="توضیحات"
                          value={answer.description}
                          onChange={(e) => handleDescriptionChange(questionId, e.target.value)}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
           <footer className="mt-6 flex justify-end gap-3 sticky bottom-0 -mx-6 -mb-6 bg-white/80 backdrop-blur-sm p-4 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">انصراف</button>
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">ذخیره چک‌لیست</button>
          </footer>
        </form>

      </div>
    </div>
  );
};
