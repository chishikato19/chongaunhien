import React, { useRef } from 'react';
import { Users, HelpCircle, Save, RefreshCw, CloudUpload, CloudDownload, Download, Upload } from 'lucide-react';
import { ClassGroup, Question, Settings, QuestionBank } from '../../types';
import ClassManager from '../ClassManager';
import QuestionManager from '../QuestionManager';
import { PlayCircle } from 'lucide-react';

interface SetupViewProps {
    classes: ClassGroup[];
    questions: Question[];
    questionBanks: QuestionBank[]; // New
    activeClassId: string | null;
    activeClass: ClassGroup | undefined;
    setupTab: 'CLASSES' | 'QUESTIONS';
    settings: Settings;
    cloudUrl: string;
    isSyncing: boolean;
    setSetupTab: (tab: 'CLASSES' | 'QUESTIONS') => void;
    handleUpdateClasses: (c: ClassGroup[]) => void;
    handleUpdateQuestions: (q: Question[]) => void;
    handleUpdateBanks: (b: QuestionBank[]) => void; // New
    handleSetActiveClass: (id: string) => void;
    setCloudUrl: (url: string) => void;
    handleSaveCloudUrl: () => void;
    handleCloudUpload: () => void;
    handleCloudDownload: () => void;
    handleExportData: () => void;
    handleImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
    startSession: () => void;
}

const SetupView: React.FC<SetupViewProps> = ({
    classes, questions, questionBanks, activeClassId, activeClass, setupTab, settings, cloudUrl, isSyncing,
    setSetupTab, handleUpdateClasses, handleUpdateQuestions, handleUpdateBanks, handleSetActiveClass,
    setCloudUrl, handleSaveCloudUrl, handleCloudUpload, handleCloudDownload, handleExportData, handleImportData, startSession
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex flex-col md:flex-row gap-4 mb-6 border-b border-gray-200 pb-4 justify-between items-start md:items-center">
                <div className="flex gap-2">
                    <button onClick={() => setSetupTab('CLASSES')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${setupTab === 'CLASSES' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-500'}`}><Users size={18} /> Lớp Học</button>
                    <button onClick={() => setSetupTab('QUESTIONS')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${setupTab === 'QUESTIONS' ? 'bg-pink-600 text-white shadow-lg' : 'bg-white text-gray-500'}`}><HelpCircle size={18} /> Câu Hỏi</button>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                    <input type="password" placeholder="Script URL..." className="bg-transparent text-xs w-24 border-none" value={cloudUrl} onChange={e => setCloudUrl(e.target.value)} />
                    <button onClick={handleSaveCloudUrl}><Save size={14}/></button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <button onClick={handleCloudUpload} disabled={isSyncing} className="p-2 hover:text-green-600">{isSyncing ? <RefreshCw size={18} className="animate-spin"/> : <CloudUpload size={18}/>}</button>
                    <button onClick={handleCloudDownload} disabled={isSyncing} className="p-2 hover:text-blue-600">{isSyncing ? <RefreshCw size={18} className="animate-spin"/> : <CloudDownload size={18}/>}</button>
                    <button onClick={handleExportData} className="p-2 hover:text-indigo-600"><Download size={18}/></button>
                    <label className="p-2 hover:text-indigo-600 cursor-pointer"><Upload size={18}/><input type="file" className="hidden" accept=".json" onChange={handleImportData} ref={fileInputRef}/></label>
                </div>
            </div>
            <div className="flex-grow min-h-0">
                {setupTab === 'CLASSES' ? (
                    <ClassManager classes={classes} activeClassId={activeClassId} onUpdateClasses={handleUpdateClasses} onSetActive={handleSetActiveClass} settings={settings} questionBanks={questionBanks} />
                ) : (
                    <QuestionManager questions={questions} onUpdateQuestions={handleUpdateQuestions} questionBanks={questionBanks} onUpdateBanks={handleUpdateBanks} />
                )}
            </div>
            {setupTab === 'CLASSES' && activeClass && (
                <div className="mt-6 flex justify-center sticky bottom-0 z-10">
                    <button onClick={startSession} className="bg-indigo-600 text-white text-xl font-black px-12 py-4 rounded-2xl shadow-xl hover:bg-indigo-700 flex items-center gap-4">
                        <PlayCircle size={32} className="animate-pulse"/> BẮT ĐẦU PHIÊN
                    </button>
                </div>
            )}
        </div>
    );
};

export default SetupView;