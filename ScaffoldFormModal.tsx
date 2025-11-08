
import React, { useState, useEffect } from 'react';
import type { Scaffold } from '../types';
import { TagColor } from '../types';
import { format, parse } from 'date-fns-jalali';

interface ScaffoldFormModalProps {
  onClose: () => void;
  onSave: (scaffold: Omit<Scaffold, 'id' | 'inspectorId'> | Scaffold) => void;
  scaffold: Scaffold | null;
}

const todayJalaliString = () => format(new Date(), 'yyyy/MM/dd');

export const ScaffoldFormModal: React.FC<ScaffoldFormModalProps> = ({ onClose, onSave, scaffold }) => {
  const [formData, setFormData] = useState({
    unit: '',
    location: '',
    tagNumber: '',
    permitNumber: '',
    inspectionDate: todayJalaliString(),
    tagColor: TagColor.Green,
  });

  useEffect(() => {
    if (scaffold) {
      setFormData({
        unit: scaffold.unit,
        location: scaffold.location,
        tagNumber: scaffold.tagNumber,
        permitNumber: scaffold.permitNumber,
        inspectionDate: format(new Date(scaffold.inspectionDate), 'yyyy/MM/dd'),
        tagColor: scaffold.tagColor,
      });
    }
  }, [scaffold]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const inspectionDateObject = parse(formData.inspectionDate, 'yyyy/MM/dd', new Date());
    if (isNaN(inspectionDateObject.getTime())) {
      alert('فرمت تاریخ بازرسی نامعتبر است. لطفاً از فرمت yyyy/MM/dd (مثال: 1403/05/01) استفاده کنید.');
      return;
    }

    const dataToSave = {
      ...formData,
      inspectionDate: inspectionDateObject.toISOString()
    };
    if (scaffold) {
      onSave({ ...scaffold, ...dataToSave });
    } else {
      onSave(dataToSave);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 vazir-font no-print">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 m-4">
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{scaffold ? 'ویرایش داربست' : 'افزودن داربست جدید'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">واحد</label>
              <input type="text" name="unit" id="unit" value={formData.unit} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">موقعیت</label>
              <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
            </div>
            <div>
              <label htmlFor="tagNumber" className="block text-sm font-medium text-gray-700 mb-1">شماره تگ</label>
              <input type="text" name="tagNumber" id="tagNumber" value={formData.tagNumber} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
            </div>
            <div>
              <label htmlFor="permitNumber" className="block text-sm font-medium text-gray-700 mb-1">شماره پرمیت</label>
              <input type="text" name="permitNumber" id="permitNumber" value={formData.permitNumber} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
            </div>
            <div>
              <label htmlFor="inspectionDate" className="block text-sm font-medium text-gray-700 mb-1">تاریخ بازرسی</label>
              <input 
                type="text" 
                name="inspectionDate" 
                id="inspectionDate" 
                value={formData.inspectionDate} 
                onChange={handleChange} 
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                required
                placeholder="مثال: 1403/05/01"
                style={{ direction: 'ltr', textAlign: 'right' }}
              />
            </div>
            <div>
              <label htmlFor="tagColor" className="block text-sm font-medium text-gray-700 mb-1">وضعیت تگ</label>
              <select name="tagColor" id="tagColor" value={formData.tagColor} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
                <option value={TagColor.Green}>سبز</option>
                <option value={TagColor.Yellow}>زرد</option>
                <option value={TagColor.Red}>قرمز</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">انصراف</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">ذخیره</button>
          </div>
        </form>
      </div>
    </div>
  );
};
