

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
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold block text-blue-600">Nhóm (Cộng)</label>
                                      <input type="number" value={settings.groupPoints} onChange={(e) => updateSettings({groupPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/>
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold block text-red-600">Nhóm (Trừ)</label>
                                      <input type="number" value={settings.groupMinusPoints} onChange={(e) => updateSettings({groupMinusPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/>
                                  </div>
                          </div>
                          <hr className="border-gray-200"/>
                          <h5 className="text-xs font-bold text-indigo-500">Điểm May Mắn Cá Nhân</h5>
                          <div className="grid grid-cols-2 gap-4">
                                  <div><label className="text-xs font-medium block mb-1">Min</label><input type="number" value={settings.minLuckyPoints} onChange={(e) => updateSettings({minLuckyPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/></div>
                                  <div><label className="text-xs font-medium block mb-1">Max</label><input type="number" value={settings.maxLuckyPoints} onChange={(e) => updateSettings({maxLuckyPoints: parseInt(e.target.value)})} className="border rounded p-2 w-full text-sm"/></div>
                          </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                          <span className="font-medium text-sm">Cho phép lặp lại?</span>
                          <input type="checkbox" checked={settings.allowRepeats} onChange={(e) => updateSettings({allowRepeats: e.target.checked})} className="w-5 h-5 accent-indigo-600"/>
                      </div>
                  </div>
                )}

                {settingsTab === 'THRESHOLDS' && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><Lock size={12}/> Điểm Mở Khóa Game (Tổng XP Lớp)</h4>
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

                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Mốc Danh Hiệu & Điều Kiện</h4>
                            <div className="space-y-2 bg-gray-50 p-2 rounded-lg max-h-60 overflow-y-auto custom-scrollbar">
                                {Object.keys(BADGE_INFO).map((key) => {
                                    const isScoreBased = SCORE_BASED_BADGES.includes(key);
                                    return (
                                        <div key={key} className="flex justify-between items-center text-sm border-b border-gray-100 pb-1">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span>{BADGE_ICONS[key]}</span>
                                                    <span className="font-medium text-gray-700 text-xs">{BADGE_INFO[key]?.split(':')[0] || key}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-400 italic pl-6">{BADGE_INFO[key]?.split(':')[1]}</span>
                                            </div>
                                            {isScoreBased ? (
                                                <input 
                                                    type="number" 
                                                    className="w-16 text-right border rounded px-1 py-0.5 text-xs font-bold text-gray-600"
                                                    value={settings.achievementThresholds[key] || 0}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        updateSettings({ achievementThresholds: { ...settings.achievementThresholds, [key]: val } });
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-[10px] bg-gray-200 px-2 py-0.5 rounded text-gray-600 font-medium">Sự kiện</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {settingsTab === 'AVATARS' && (
                     <div className="space-y-4">
                          <div className="flex gap-2">
                              <input className="border rounded px-2 py-1 flex-grow text-sm" placeholder="Thêm icon mới (VD: 👽)" value={newAvatarInput} onChange={e => setNewAvatarInput(e.target.value)} />
                              <button onClick={() => handleAddAvatar('COMMON')} className="bg-green-600 text-white px-2 rounded text-xs font-bold hover:bg-green-700">Thêm vào Thường</button>
                              <button onClick={() => handleAddAvatar('SPECIAL')} className="bg-purple-600 text-white px-2 rounded text-xs font-bold hover:bg-purple-700">Thêm vào Shop</button>
                          </div>
                          <div>
                              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Biểu tượng thường (Click chuyển Shop, Double click xóa)</h4>
                              <div className="flex flex-wrap gap-2 h-32 overflow-y-auto bg-gray-50 p-2 rounded-lg border">
                                  {settings.commonAvatars.map(av => (
                                      <button 
                                        key={av} 
                                        onClick={() => handleToggleAvatarCategory(av, 'COMMON')} 
                                        onDoubleClick={(e) => {e.stopPropagation(); handleDeleteAvatar(av, 'COMMON')}}
                                        className="text-xl p-1 hover:bg-gray-200 rounded"
                                        title="Click: Chuyển sang Shop / DblClick: Xóa"
                                      >{av}</button>
                                  ))}
                              </div>
                          </div>
                          <div>
                              <h4 className="text-xs font-bold text-purple-500 uppercase mb-2">Biểu tượng Đặc biệt/Shop (Click chuyển Thường, Double click xóa)</h4>
                              <div className="flex flex-wrap gap-2 h-32 overflow-y-auto bg-purple-50 p-2 rounded-lg border border-purple-100">
                                  {settings.specialAvatars.map(av => (
                                      <button 
                                        key={av} 
                                        onClick={() => handleToggleAvatarCategory(av, 'SPECIAL')}
                                        onDoubleClick={(e) => {e.stopPropagation(); handleDeleteAvatar(av, 'SPECIAL')}} 
                                        className="text-xl p-1 hover:bg-purple-200 rounded"
                                        title="Click: Chuyển sang Thường / DblClick: Xóa"
                                      >{av}</button>
                                  ))}
                              </div>
                          </div>
                     </div>
                )}

                {settingsTab === 'SHOP' && (
                     <div className="space-y-4">
                         <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-xl border border-purple-200">
                             <div className="flex items-center gap-2 mb-2">
                                 <ShoppingBag className="text-purple-600"/>
                                 <h4 className="font-bold text-purple-800">Cấu hình Cửa Hàng</h4>
                             </div>
                             <p className="text-xs text-gray-600 mb-4">Học sinh sử dụng điểm tích lũy (Balance) để mua Avatar.</p>
                             
                             <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                                 <label className="font-bold text-sm text-gray-700">Giá một Avatar (Xu):</label>
                                 <input 
                                    type="number" 
                                    min="1"
                                    className="border border-purple-300 rounded px-2 py-1 w-20 text-right font-black text-purple-600"
                                    value={settings.avatarPrice || 10}
                                    onChange={e => updateSettings({ avatarPrice: parseInt(e.target.value) || 10 })}
                                 />
                             </div>
                         </div>
                         <div className="text-xs text-gray-500 italic">
                             * Để thêm/xóa vật phẩm trong Shop, vui lòng qua tab <b>Biểu tượng</b> và chỉnh sửa danh sách "Biểu tượng Đặc biệt".
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