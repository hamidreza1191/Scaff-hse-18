
import React from 'react';
import type { View } from '../types';
import { LayoutDashboard, List, Settings, Building2, ChevronRight, ChevronLeft, Users } from 'lucide-react';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  remindersCount: number;
  isAdmin?: boolean;
}

const inspectorNavItems = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { id: 'scaffolds', label: 'لیست داربست‌ها', icon: List },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
];

const adminNavItems = [
    { id: 'superAdminDashboard', label: 'داشبورد کل', icon: LayoutDashboard },
    { id: 'settings', label: 'مدیریت بازرس‌ها', icon: Users },
]

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isCollapsed, setCollapsed, remindersCount, isAdmin = false }) => {
  
  const navItems = isAdmin ? adminNavItems : inspectorNavItems;

  return (
    <div className={`bg-gray-800 text-white flex flex-col no-print transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <Building2 className="w-8 h-8 text-blue-400" />
        {!isCollapsed && <h1 className="text-xl font-bold mr-3">مدیریت داربست</h1>}
      </div>
      <nav className="flex-1 px-4 py-6">
        <ul>
          {navItems.map((item) => (
            <li key={item.id} title={isCollapsed ? item.label : ''} className="relative">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setView(item.id as View);
                }}
                className={`flex items-center px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${
                  currentView === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <item.icon className={`w-5 h-5 ${!isCollapsed ? 'ml-3' : ''}`} />
                {!isCollapsed && <span>{item.label}</span>}
                {!isCollapsed && item.id === 'dashboard' && remindersCount > 0 && (
                  <span className="mr-auto bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">{remindersCount}</span>
                )}
              </a>
               {isCollapsed && item.id === 'dashboard' && remindersCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
                  </span>
               )}
            </li>
          ))}
        </ul>
      </nav>
       <div className="px-4 py-4 border-t border-gray-700">
        <button 
          onClick={() => setCollapsed(!isCollapsed)} 
          className="w-full flex items-center justify-center text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700"
          title={isCollapsed ? "باز کردن منو" : "بستن منو"}
        >
            {isCollapsed ? <ChevronLeft className="w-6 h-6"/> : <ChevronRight className="w-6 h-6"/>}
        </button>
    </div>
    </div>
  );
};
