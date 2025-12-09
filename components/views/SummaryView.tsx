
import React from 'react';
import { Trophy } from 'lucide-react';

interface SummaryViewProps {
    sessionPicks: number;
    sessionPoints: number;
    onBack: () => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({ sessionPicks, sessionPoints, onBack }) => {
    return (
        <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 text-center">
                <Trophy size={64} className="mx-auto text-yellow-500 mb-4 animate-bounce" />
                <h1 className="text-3xl font-black text-gray-800 mb-2">Tổng Kết Phiên</h1>
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-indigo-50 p-4 rounded-xl">
                        <div className="text-3xl font-black text-indigo-600">{sessionPicks}</div>
                        <div className="text-xs uppercase font-bold text-gray-400">Lượt gọi</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl">
                        <div className="text-3xl font-black text-green-600">{sessionPoints}</div>
                        <div className="text-xs uppercase font-bold text-gray-400">Tổng điểm</div>
                    </div>
                </div>
                <button onClick={onBack} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700">Về Màn Hình Chính</button>
            </div>
        </div>
    );
};

export default SummaryView;
