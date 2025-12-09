import React from 'react';
import { Trophy, Star, CheckCircle } from 'lucide-react';

interface SummaryViewProps {
    sessionPicks: number;
    sessionPoints: number;
    onBack: () => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({ sessionPicks, sessionPoints, onBack }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-10 text-center animate-fade-in-up border-8 border-white/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50 to-transparent z-0"></div>
                
                <div className="relative z-10">
                    <div className="mb-6 flex justify-center">
                        <div className="relative">
                            <Trophy size={80} className="text-yellow-400 drop-shadow-lg animate-bounce" />
                            <Star size={30} className="text-yellow-200 absolute -top-2 -right-4 animate-pulse" />
                            <Star size={20} className="text-yellow-200 absolute top-10 -left-6 animate-pulse delay-75" />
                        </div>
                    </div>
                    
                    <h1 className="text-4xl font-black text-gray-800 mb-2">TỔNG KẾT PHIÊN HỌC</h1>
                    <p className="text-gray-500 mb-8 font-medium">Cảm ơn thầy cô và các bạn đã tham gia!</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-4">
                            <div className="bg-indigo-200 p-3 rounded-full text-indigo-700"><CheckCircle size={32}/></div>
                            <div className="text-left">
                                <div className="text-4xl font-black text-indigo-600">{sessionPicks}</div>
                                <div className="text-xs uppercase font-bold text-gray-500 tracking-wider">Lượt gọi</div>
                            </div>
                        </div>
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm flex items-center gap-4">
                            <div className="bg-green-200 p-3 rounded-full text-green-700"><Star size={32}/></div>
                            <div className="text-left">
                                <div className="text-4xl font-black text-green-600">{sessionPoints}</div>
                                <div className="text-xs uppercase font-bold text-gray-500 tracking-wider">Tổng điểm thưởng</div>
                            </div>
                        </div>
                    </div>
                    
                    <button onClick={onBack} className="bg-gray-800 text-white px-10 py-4 rounded-2xl font-bold hover:bg-black transition-transform hover:scale-105 shadow-xl">
                        QUAY VỀ MÀN HÌNH CHÍNH
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SummaryView;