

import React, { useState } from 'react';
import { Settings, PresentationMode } from '../../types';
import { Settings as SettingsIcon, X, Lock, ShoppingBag, Clock } from 'lucide-react';
import { BADGE_INFO, BADGE_ICONS, SCORE_BASED_BADGES } from '../../utils/gameLogic';

interface SettingsModalProps {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, updateSettings, onClose }) => {
    const [settingsTab, setSettingsTab] = useState<'GENERAL' | 'THRESHOLDS' | 'AVATARS' | 'SHOP'>('GENERAL');
    const [newAvatarInput, setNewAvatarInput] = useState('');

    const handleAddAvatar = (pool: 'COMMON' | 'SPECIAL') => {
        const emoji = newAvatarInput.trim();
        if (!emoji) return;
        
        if (!settings.commonAvatars.includes(emoji) && !settings.specialAvatars.includes(emoji)) {
            if (pool === 'COMMON') {
                 updateSettings({ commonAvatars: [...settings.commonAvatars, emoji] });
            } else {
                 updateSettings({ specialAvatars: [...settings.specialAvatars, emoji] });
            }
            setNewAvatarInput('');
        } else {
            alert("Biểu tượng này đã tồn tại!");
        }
    };

    const handleDeleteAvatar = (avatar: string, pool: 'COMMON' | 'SPECIAL') => {
         if (pool === 'COMMON') {
             updateSettings({ commonAvatars: settings.commonAvatars.filter(a => a !== avatar) });
         } else {
             updateSettings({ specialAvatars: settings.specialAvatars.filter(a => a !== avatar) });
             // Clean up tiers map
             const newTiers = { ...settings.avatarTiers };
             delete newTiers[avatar];
             updateSettings({ avatarTiers: newTiers });
         }
    };

    const handleToggleAvatarCategory = (avatar: string, currentCategory: 'COMMON' | 'SPECIAL') => {
        let newCommon = [...settings.commonAvatars];
        let newSpecial = [...settings.specialAvatars];

        if (currentCategory === 'COMMON') {
            newCommon = newCommon.filter(a => a !== avatar);
            if (!newSpecial.includes(avatar)) newSpecial.push(avatar);
        } else {
            newSpecial = newSpecial.filter(a => a !== avatar);
            if (!newCommon.includes(avatar)) newCommon.push(avatar);
        }
        updateSettings({ commonAvatars: newCommon, specialAvatars: newSpecial });
    };

    const handleSetAvatarTier = (avatar: string, tier: 1 | 2 | 3) => {
        updateSettings({ 
            avatarTiers: { ...settings.avatarTiers, [avatar]: tier } 
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><SettingsIcon size={20}/> Cài Đặt</h3>

                <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg flex-wrap">
                    <button className={`flex-1 py-1 text-xs font-bold rounded ${settingsTab === 'GENERAL' ? 'bg-white shadow' : 'text-gray-500'}`} onClick={() => setSettingsTab('GENERAL')}>Chung</button>
                    <button className={`flex-1 py-1 text-xs font-bold rounded ${settingsTab === 'THRESHOLDS' ? 'bg-white shadow' : 'text-gray-500'}`} onClick={() => setSettingsTab('THRESHOLDS')}>Mốc Điểm</button>
                    <button className={`flex-1 py-1 text-xs font-bold rounded ${settingsTab === 'AVATARS' ? 'bg-white shadow' : 'text-gray-500'}`} onClick={() => setSettingsTab('AVATARS')}>Biểu tượng</button>
                    <button className={`flex-1 py-1 text-xs font-bold rounded ${settingsTab === 'SHOP' ? 'bg-white shadow' : 'text-gray-500'}`} onClick={() => setSettingsTab('SHOP')}>Shop</button>
                </div>
                
                {settingsTab === 'GENERAL' && (
                  <div className="space-y-4">
                       <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                          <h4 className="text-xs font-bold text-gray-500 uppercase">Mẫu Chúc Mừng</h4>
                          <p className="text-[10px] text-gray-400">Sử dụng: {'{name}'} = Tên HS, {'{badge}'} = Tên danh hiệu</p>
                          <input 
                              className="w-full border rounded p-2 text-sm" 
                              value={settings.congratulationTemplate}
                              onChange={e => updateSettings({congratulationTemplate: e.target.value})}
                              placeholder="VD: Chúc mừng {name} đạt {badge}!"
                          />
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase">Thời gian & Game</h4>
                          <div>
                              <div className="flex justify-between mb-1">
                                  <label className="text-sm font-medium">Quay thường</label>
                                  <span className="text-sm font-bold text-indigo-600">{settings.spinDuration}s</span>
                              </div>
                              <input type="range" min="1" max="15" value={settings.spinDuration} onChange={(e) => updateSettings({spinDuration: parseInt(e.target.value)})} className="w-full accent-indigo-600"/>
                          </div>
                          <div>
                              <div className="flex justify-between mb-1">
                                  <label className="text-sm font-medium">Cảnh báo hết giờ (Đếm ngược)</label>
                                  <span className="text-sm font-bold text-red-600">{settings.warningSeconds}s</span>
                              </div>
                              <input type="range" min="3" max="30" value={settings.warningSeconds} onChange={(e) => updateSettings({warningSeconds: parseInt(e.target.value)})} className="w-full accent-red-600"/>
                          </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase">Điểm số</h4>
                          <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold block text-blue-600">Cá nhân (Cộng)</label>
                                      <input type="number" value={settings.maxPoints} onChange={(e) => updateSettings({maxPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/>
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold block text-red-600">Cá nhân (Trừ)</label>
                                      <input type="number" value={settings.minusPoints} onChange={(e) => updateSettings({minusPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/>
                                  </div>
                          </div>
                      </div>
                  </div>
                )}

                {settingsTab === 'THRESHOLDS' && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><Lock size={12}/> Điểm Mở Khóa Game</h4>
                            <div className="space-y-2 bg-gray-50 p-2 rounded-lg max-h-48 overflow-y-auto custom-scrollbar">
                                {Object.values(PresentationMode).filter(m => m !== PresentationMode.SIMPLE).map((mode) => (
                                    <div key={mode} className="flex justify-between items-center text-sm border-b border-gray-100 pb-1">
                                        <span className="font-medium text-gray-700">{mode}</span>
                                        <input 
                                            type="number" 
                                            className="w-20 text-right border rounded px-1 py-0.5 text-xs font-bold text-gray-600"
                                            value={settings.gameUnlockThresholds?.[mode] || 0}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                updateSettings({ gameUnlockThresholds: { ...settings.gameUnlockThresholds, [mode]: val } });
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {settingsTab === 'AVATARS' && (
                     <div className="space-y-4">
                          <div className="flex gap-2">
                              <input className="border rounded px-2 py-1 flex-grow text-sm" placeholder="Thêm icon mới (VD: 👽)" value={newAvatarInput} onChange={e => setNewAvatarInput(e.target.value)} />
                              <button onClick={() => handleAddAvatar('COMMON')} className="bg-green-600 text-white px-2 rounded text-xs font-bold hover:bg-green-700">Thường</button>
                              <button onClick={() => handleAddAvatar('SPECIAL')} className="bg-purple-600 text-white px-2 rounded text-xs font-bold hover:bg-purple-700">Shop</button>
                          </div>
                          <div>
                              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Biểu tượng Đặc biệt/Shop (Chọn cấp độ giá)</h4>
                              <div className="flex flex-wrap gap-2 h-48 overflow-y-auto bg-purple-50 p-2 rounded-lg border border-purple-100">
                                  {settings.specialAvatars.map(av => {
                                      const tier = settings.avatarTiers?.[av] || 1;
                                      return (
                                        <div key={av} className="relative group">
                                            <button 
                                                onDoubleClick={(e) => {e.stopPropagation(); handleDeleteAvatar(av, 'SPECIAL')}} 
                                                className={`text-xl p-1 rounded border-2 ${tier === 3 ? 'bg-yellow-100 border-yellow-400' : tier === 2 ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-200'}`}
                                                title="Double click để xóa"
                                            >{av}</button>
                                            <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-0.5 z-10 bg-white shadow rounded border">
                                                <button onClick={() => handleSetAvatarTier(av, 1)} className={`text-[8px] w-4 h-4 ${tier === 1 ? 'bg-gray-400 text-white' : 'hover:bg-gray-100'}`}>1</button>
                                                <button onClick={() => handleSetAvatarTier(av, 2)} className={`text-[8px] w-4 h-4 ${tier === 2 ? 'bg-blue-500 text-white' : 'hover:bg-blue-100'}`}>2</button>
                                                <button onClick={() => handleSetAvatarTier(av, 3)} className={`text-[8px] w-4 h-4 ${tier === 3 ? 'bg-yellow-500 text-white' : 'hover:bg-yellow-100'}`}>3</button>
                                            </div>
                                        </div>
                                      );
                                  })}
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1">Gợi ý: Di chuột vào icon để chỉnh giá (Cấp 1, 2, 3).</p>
                          </div>
                     </div>
                )}

                {settingsTab === 'SHOP' && (
                     <div className="space-y-4">
                         <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-xl border border-purple-200">
                             <div className="flex items-center gap-2 mb-2">
                                 <ShoppingBag className="text-purple-600"/>
                                 <h4 className="font-bold text-purple-800">Cấu hình Giá (Theo Cấp)</h4>
                             </div>
                             
                             <div className="space-y-2">
                                 <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                     <label className="font-bold text-sm text-gray-500">Cấp 1 (Thường):</label>
                                     <input 
                                        type="number" 
                                        className="border rounded w-16 text-right px-1"
                                        value={settings.priceTiers?.tier1 || 10}
                                        onChange={e => updateSettings({ priceTiers: { ...settings.priceTiers, tier1: parseInt(e.target.value) } })}
                                     />
                                 </div>
                                 <div className="flex items-center justify-between bg-blue-50 p-2 rounded border border-blue-200">
                                     <label className="font-bold text-sm text-blue-700">Cấp 2 (Hiếm):</label>
                                     <input 
                                        type="number" 
                                        className="border rounded w-16 text-right px-1"
                                        value={settings.priceTiers?.tier2 || 50}
                                        onChange={e => updateSettings({ priceTiers: { ...settings.priceTiers, tier2: parseInt(e.target.value) } })}
                                     />
                                 </div>
                                 <div className="flex items-center justify-between bg-yellow-50 p-2 rounded border border-yellow-200">
                                     <label className="font-bold text-sm text-yellow-700">Cấp 3 (Huyền thoại):</label>
                                     <input 
                                        type="number" 
                                        className="border rounded w-16 text-right px-1"
                                        value={settings.priceTiers?.tier3 || 100}
                                        onChange={e => updateSettings({ priceTiers: { ...settings.priceTiers, tier3: parseInt(e.target.value) } })}
                                     />
                                 </div>
                             </div>
                         </div>
                     </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-300">Đóng</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;