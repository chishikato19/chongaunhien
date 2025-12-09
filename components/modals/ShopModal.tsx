
import React, { useState } from 'react';
import { Settings, Student } from '../../types';
import { ShoppingBag, X, Lock, CheckCircle, Coins } from 'lucide-react';
import { playWin, playTick } from '../../services/sound';

interface ShopModalProps {
    students: Student[];
    settings: Settings;
    onClose: () => void;
    onPurchase: (studentId: string, avatar: string, cost: number) => void;
}

const ShopModal: React.FC<ShopModalProps> = ({ students, settings, onClose, onPurchase }) => {
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [filter, setFilter] = useState<'ALL' | 'UNLOCKED'>('ALL');

    const activeStudent = students.find(s => s.id === selectedStudentId);

    const handleBuy = (avatar: string) => {
        if (!activeStudent) return;
        const cost = settings.avatarPrice || 10;
        
        if ((activeStudent.balance || 0) < cost) {
            alert("Bạn không đủ Xu để mua vật phẩm này!");
            return;
        }

        if (window.confirm(`Mua "${avatar}" với giá ${cost} Xu?`)) {
            onPurchase(activeStudent.id, avatar, cost);
            playWin();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-3 rounded-full backdrop-blur">
                            <ShoppingBag size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-wide">Cửa Hàng Avatar</h2>
                            <p className="text-purple-100 text-sm opacity-90">Đổi Xu lấy biểu tượng đặc biệt!</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={28}/></button>
                </div>

                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    {/* Sidebar: Student Selector */}
                    <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
                        <div className="p-4 border-b">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Chọn người mua:</label>
                            <select 
                                className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                            >
                                <option value="">-- Chọn học sinh --</option>
                                {[...students].sort((a,b) => b.name.localeCompare(a.name)).map(s => (
                                    <option key={s.id} value={s.id}>{s.name} (Xu: {s.balance || 0})</option>
                                ))}
                            </select>
                        </div>
                        
                        {activeStudent ? (
                            <div className="p-6 flex flex-col items-center text-center flex-grow justify-center">
                                <div className="text-8xl mb-4 relative">
                                    {activeStudent.avatar}
                                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                                        <Coins size={12}/> {activeStudent.balance || 0}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">{activeStudent.name}</h3>
                                <p className="text-gray-500 text-sm mt-1">Sở hữu: {(activeStudent.unlockedAvatars || []).length} vật phẩm</p>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center flex-grow">
                                <ShoppingBag size={48} className="mb-4 opacity-20"/>
                                <p>Vui lòng chọn học sinh để bắt đầu mua sắm.</p>
                            </div>
                        )}
                    </div>

                    {/* Main Content: Items */}
                    <div className="w-full md:w-2/3 flex flex-col bg-white">
                        {activeStudent ? (
                            <>
                                <div className="p-4 flex gap-2 border-b">
                                    <button 
                                        onClick={() => setFilter('ALL')} 
                                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${filter === 'ALL' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >Tất cả</button>
                                </div>
                                <div className="p-6 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {settings.specialAvatars.map(avatar => {
                                        const isOwned = (activeStudent.unlockedAvatars || []).includes(avatar);
                                        const canAfford = (activeStudent.balance || 0) >= (settings.avatarPrice || 10);
                                        
                                        return (
                                            <div key={avatar} className={`relative group p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all 
                                                ${isOwned ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 hover:border-purple-300 shadow-sm hover:shadow-md'}
                                            `}>
                                                <div className="text-4xl mb-2">{avatar}</div>
                                                
                                                {isOwned ? (
                                                    <div className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                                                        <CheckCircle size={10}/> Đã sở hữu
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleBuy(avatar)}
                                                        disabled={!canAfford}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 w-full justify-center
                                                            ${canAfford ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                                                        `}
                                                    >
                                                        {canAfford ? 'Mua' : 'Thiếu Xu'}
                                                        <span className="bg-black/20 px-1 rounded ml-1">{settings.avatarPrice || 10}</span>
                                                    </button>
                                                )}

                                                {!isOwned && !canAfford && (
                                                    <div className="absolute top-2 right-2 text-gray-300"><Lock size={12}/></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                             <div className="flex-grow flex items-center justify-center text-gray-300 font-bold text-xl uppercase tracking-widest">
                                 CHỌN HỌC SINH BÊN TRÁI
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopModal;
