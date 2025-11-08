
import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ScaffoldList } from './components/ScaffoldList';
import { Settings } from './components/Settings';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import type { Inspector, Scaffold, View, Reminder } from './types';
import { TagColor } from './types';
import { UserPlus, LogIn, ShieldCheck, ArrowRight } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { CHECKLIST_QUESTIONS } from './constants';


const App: React.FC = () => {
  const [inspectors, setInspectors] = useLocalStorage<Inspector[]>('scaffold_inspectors', []);
  const [scaffolds, setScaffolds] = useLocalStorage<Scaffold[]>('scaffold_data', []);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('scaffold_manual_reminders', []);
  const [currentInspectorId, setCurrentInspectorId] = useLocalStorage<string | null>('scaffold_current_inspector_id', null);
  const [isSuperAdmin, setIsSuperAdmin] = useLocalStorage<boolean>('scaffold_is_super_admin', false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isClient, setIsClient] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [adminViewingInspectorId, setAdminViewingInspectorId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    if (isSuperAdmin) {
      setCurrentView('superAdminDashboard');
    } else if (currentInspectorId) {
      setCurrentView('dashboard');
    }
  }, [isSuperAdmin, currentInspectorId]);

  const currentInspector = useMemo(() => {
    const idToFind = isSuperAdmin ? adminViewingInspectorId : currentInspectorId;
    if (!idToFind) return null;
    return inspectors.find(i => i.id === idToFind) || null;
  }, [currentInspectorId, inspectors, isSuperAdmin, adminViewingInspectorId]);

  const inspectorScaffolds = useMemo(() => {
    const idToFilterBy = isSuperAdmin ? adminViewingInspectorId : currentInspectorId;
    if (!idToFilterBy) return [];
    return scaffolds.filter(s => s.inspectorId === idToFilterBy);
  }, [currentInspectorId, scaffolds, adminViewingInspectorId, isSuperAdmin]);
  
  const remindersCount = useMemo(() => {
    if (!currentInspectorId) return 0;
    const today = new Date();
    return scaffolds.filter(s => s.inspectorId === currentInspectorId).filter(scaffold => {
        const inspectionDate = new Date(scaffold.inspectionDate);
        const daysSinceInspection = Math.floor((today.getTime() - inspectionDate.getTime()) / (1000 * 3600 * 24));
        if (scaffold.tagColor === TagColor.Green && daysSinceInspection > 30) return true;
        if (scaffold.tagColor === TagColor.Yellow && daysSinceInspection > 7) return true;
        return false;
    }).length;
  }, [scaffolds, currentInspectorId]);

  const pendingManualRemindersCount = useMemo(() => {
    if (!currentInspectorId) return 0;
    const now = new Date();
    return reminders.filter(r =>
      r.inspectorId === currentInspectorId &&
      !r.isCompleted &&
      new Date(r.targetDateTime) <= now
    ).length;
  }, [reminders, currentInspectorId]);


  const addInspector = (name: string) => {
    const newInspector: Inspector = { id: Date.now().toString(), name };
    setInspectors(prev => [...prev, newInspector]);
  };

  const deleteInspector = (id: string) => {
    if (window.confirm('آیا از حذف این بازرس و تمام داربست‌ها و یادآورهای مرتبط با او مطمئن هستید؟')) {
      setInspectors(prev => prev.filter(i => i.id !== id));
      setScaffolds(prev => prev.filter(s => s.inspectorId !== id));
      setReminders(prev => prev.filter(r => r.inspectorId !== id));
      if (adminViewingInspectorId === id) {
        setAdminViewingInspectorId(null);
      }
      if (currentInspectorId === id) {
        setCurrentInspectorId(null);
      }
    }
  };

  const addScaffold = (scaffold: Omit<Scaffold, 'id' | 'inspectorId' | 'checklist'>) => {
    const targetInspectorId = isSuperAdmin ? adminViewingInspectorId : currentInspectorId;
    if (!targetInspectorId) return;
    const newScaffold: Scaffold = { 
        ...scaffold, 
        id: Date.now().toString(), 
        inspectorId: targetInspectorId,
        checklist: CHECKLIST_QUESTIONS.map((_q, index) => ({
            questionId: index + 1,
            status: 'na',
            description: ''
        }))
    };
    setScaffolds(prev => [...prev, newScaffold]);
  };

  const updateScaffold = (updatedScaffold: Scaffold) => {
    setScaffolds(prev => prev.map(s => s.id === updatedScaffold.id ? updatedScaffold : s));
  };

  const deleteScaffold = (id: string) => {
    setScaffolds(prev => prev.filter(s => s.id !== id));
  };

  const addReminder = (reminder: Omit<Reminder, 'id' | 'isCompleted'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: Date.now().toString(),
      isCompleted: false
    };
    setReminders(prev => [...prev, newReminder]);
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const updateReminderStatus = (id: string, isCompleted: boolean) => {
    setReminders(prev => prev.map(r => (r.id === id ? { ...r, isCompleted } : r)));
  };
  
  const resetApp = () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید تمام اطلاعات برنامه را پاک کنید؟ این عمل غیرقابل بازگشت است.')) {
        setInspectors([]);
        setScaffolds([]);
        setReminders([]);
        setCurrentInspectorId(null);
        setIsSuperAdmin(false);
        setAdminViewingInspectorId(null);
        setCurrentView('dashboard');
    }
  };

  const logout = () => {
    setCurrentInspectorId(null);
    setIsSuperAdmin(false);
    setAdminViewingInspectorId(null);
    setCurrentView('dashboard');
  };
  
  if (!isClient) {
    return null; 
  }

  if (!currentInspectorId && !isSuperAdmin) {
    return <InspectorSelectionScreen inspectors={inspectors} onSelect={setCurrentInspectorId} onAdd={addInspector} onLoginAdmin={() => setIsSuperAdmin(true)} />;
  }

  const renderAdminContent = () => {
    if (adminViewingInspectorId && currentInspector) {
      return <ScaffoldList
        scaffolds={inspectorScaffolds}
        addScaffold={addScaffold}
        updateScaffold={updateScaffold}
        deleteScaffold={deleteScaffold}
        inspectorName={currentInspector.name}
      />;
    }

    switch(currentView) {
        case 'superAdminDashboard':
            return <SuperAdminDashboard 
                inspectors={inspectors}
                scaffolds={scaffolds}
                reminders={reminders}
                addReminder={addReminder}
                deleteReminder={deleteReminder}
                onViewInspector={setAdminViewingInspectorId}
            />;
        case 'settings':
            return <Settings 
                inspectors={inspectors} 
                addInspector={addInspector} 
                deleteInspector={deleteInspector} 
                resetApp={resetApp} 
                reminders={[]}
                addReminder={() => {}}
                deleteReminder={deleteReminder}
                currentInspectorId={null}
                isAdmin={true}
            />;
        default:
            return <SuperAdminDashboard 
                inspectors={inspectors} 
                scaffolds={scaffolds} 
                reminders={reminders} 
                addReminder={addReminder} 
                deleteReminder={deleteReminder} 
                onViewInspector={setAdminViewingInspectorId}
            />;
    }
  }

  const renderInspectorView = () => {
    if (!currentInspector) return null;
    const inspectorReminders = reminders.filter(r => r.inspectorId === currentInspectorId);
    switch (currentView) {
      case 'dashboard':
        return <Dashboard scaffolds={inspectorScaffolds} reminders={inspectorReminders} updateReminderStatus={updateReminderStatus} />;
      case 'scaffolds':
        return <ScaffoldList scaffolds={inspectorScaffolds} addScaffold={addScaffold} updateScaffold={updateScaffold} deleteScaffold={deleteScaffold} inspectorName={currentInspector.name} />;
      case 'settings':
        return <Settings inspectors={inspectors} addInspector={addInspector} deleteInspector={deleteInspector} resetApp={resetApp} reminders={inspectorReminders} addReminder={addReminder} deleteReminder={deleteReminder} currentInspectorId={currentInspectorId} />;
      default:
        return <Dashboard scaffolds={inspectorScaffolds} reminders={inspectorReminders} updateReminderStatus={updateReminderStatus} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 vazir-font">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        isCollapsed={isSidebarCollapsed} 
        setCollapsed={setIsSidebarCollapsed} 
        remindersCount={remindersCount}
        isAdmin={isSuperAdmin}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-white border-b no-print">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            {isSuperAdmin ? (
                adminViewingInspectorId && currentInspector ? (
                  <>
                    <button onClick={() => setAdminViewingInspectorId(null)} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
                      <ArrowRight className="w-5 h-5"/>
                      <span>بازگشت به داشبورد کل</span>
                    </button>
                    <span className="text-gray-400 mx-2">/</span>
                    <span>مشاهده پنل: {currentInspector.name}</span>
                  </>
                ) : (
                  <span>پنل مدیریت کل</span>
                )
            ) : (
                <>
                <span>پنل بازرس: {currentInspector?.name}</span>
                {pendingManualRemindersCount > 0 && (
                  <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                    {pendingManualRemindersCount}
                  </span>
                )}
                </>
            )}
          </h1>
          <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            <LogIn className="w-4 h-4" />
            خروج
          </button>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {isSuperAdmin ? renderAdminContent() : renderInspectorView()}
        </main>
      </div>
    </div>
  );
};

interface InspectorSelectionScreenProps {
    inspectors: Inspector[];
    onSelect: (id: string) => void;
    onAdd: (name: string) => void;
    onLoginAdmin: () => void;
}

const InspectorSelectionScreen: React.FC<InspectorSelectionScreenProps> = ({ inspectors, onSelect, onAdd, onLoginAdmin }) => {
    const [newName, setNewName] = useState('');

    const handleAdd = () => {
        if (newName.trim()) {
            onAdd(newName.trim());
            setNewName('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white vazir-font p-4">
            <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl p-8 text-center">
                <h1 className="text-3xl font-bold mb-2">به سامانه مدیریت داربست خوش آمدید</h1>
                <p className="text-gray-400 mb-8">لطفاً بازرس را انتخاب یا یک بازرس جدید اضافه کنید.</p>

                <div className="space-y-4 mb-8">
                    {inspectors.map(inspector => (
                        <button
                            key={inspector.id}
                            onClick={() => onSelect(inspector.id)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-3"
                        >
                            <LogIn className="w-5 h-5"/>
                            ورود به پنل {inspector.name}
                        </button>
                    ))}
                    <button
                        onClick={onLoginAdmin}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-3 border-2 border-gray-500"
                    >
                        <ShieldCheck className="w-5 h-5"/>
                        ورود به عنوان مدیر کل
                    </button>
                </div>

                <div className="border-t border-gray-700 pt-6">
                    <h2 className="text-xl font-semibold mb-4">افزودن بازرس جدید</h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="نام و نام خانوادگی بازرس"
                            className="flex-grow bg-gray-700 text-white placeholder-gray-500 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleAdd}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-5 rounded-lg transition duration-300 flex items-center justify-center gap-2"
                        >
                            <UserPlus className="w-5 h-5"/>
                            افزودن
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default App;
