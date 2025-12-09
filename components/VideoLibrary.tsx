import React, { useState, useEffect } from 'react';
import { Video } from '../types';
import { getVideos, saveVideos, extractYoutubeId, generateId } from '../services/storage.service';
import { Trash2, Plus, Youtube, X, Play, AlertCircle } from 'lucide-react';

interface VideoLibraryProps {
    onClose: () => void;
}

const VideoLibrary: React.FC<VideoLibraryProps> = ({ onClose }) => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

    useEffect(() => {
        setVideos(getVideos());
    }, []);

    const handleAddVideo = () => {
        if (!newTitle.trim() || !newUrl.trim()) {
            alert("Vui lòng nhập tiêu đề và link video!");
            return;
        }

        const youtubeId = extractYoutubeId(newUrl);
        if (!youtubeId) {
            alert("Link Youtube không hợp lệ! Vui lòng kiểm tra lại.");
            return;
        }

        const newVideo: Video = {
            id: generateId(),
            title: newTitle,
            url: newUrl,
            videoId: youtubeId
        };

        const updated = [...videos, newVideo];
        setVideos(updated);
        saveVideos(updated);
        setNewTitle('');
        setNewUrl('');
    };

    const handleDeleteVideo = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent playing
        if (window.confirm("Bạn có chắc muốn xóa video này?")) {
            const updated = videos.filter(v => v.id !== id);
            setVideos(updated);
            saveVideos(updated);
            if (playingVideoId === id) setPlayingVideoId(null);
        }
    };

    const activeVideo = videos.find(v => v.id === playingVideoId);

    return (
        <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-6xl h-[85vh] shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-50 p-2 bg-gray-100 hover:bg-gray-200 rounded-full md:hidden"
                >
                    <X size={20}/>
                </button>

                {/* LEFT SIDEBAR: LIST & ADD */}
                <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col h-1/3 md:h-full">
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-red-600">
                            <Youtube size={28}/> Thư viện Video
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Lưu trữ bài hát khởi động & video vui nhộn</p>
                    </div>

                    {/* Add Form */}
                    <div className="p-4 border-b border-gray-200 bg-gray-100">
                        <input 
                            className="w-full mb-2 px-3 py-2 rounded border border-gray-300 text-sm focus:border-red-500 outline-none"
                            placeholder="Tiêu đề (VD: Bài hát gà con)"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <input 
                                className="flex-grow px-3 py-2 rounded border border-gray-300 text-sm focus:border-red-500 outline-none"
                                placeholder="Link Youtube..."
                                value={newUrl}
                                onChange={e => setNewUrl(e.target.value)}
                            />
                            <button 
                                onClick={handleAddVideo}
                                className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 flex items-center justify-center"
                            >
                                <Plus size={18}/>
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-grow overflow-y-auto p-2 space-y-2">
                        {videos.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                Chưa có video nào.<br/>Hãy thêm video mới!
                            </div>
                        )}
                        {videos.map(video => (
                            <div 
                                key={video.id}
                                onClick={() => setPlayingVideoId(video.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${playingVideoId === video.id ? 'bg-red-50 border-red-200 ring-1 ring-red-300' : 'bg-white border-gray-200 hover:border-red-300'}`}
                            >
                                <div className="relative w-24 h-16 bg-black rounded overflow-hidden flex-shrink-0">
                                    <img 
                                        src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`} 
                                        alt="thumb" 
                                        className="w-full h-full object-cover opacity-80"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Play size={20} className="text-white drop-shadow-md" fill="white"/>
                                    </div>
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className={`font-bold text-sm truncate ${playingVideoId === video.id ? 'text-red-700' : 'text-gray-700'}`}>
                                        {video.title}
                                    </div>
                                    <div className="text-[10px] text-gray-400 truncate">{video.url}</div>
                                </div>
                                <button 
                                    onClick={(e) => handleDeleteVideo(video.id, e)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT SIDE: PLAYER */}
                <div className="w-full md:w-2/3 bg-black flex flex-col h-2/3 md:h-full relative">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 z-50 p-2 bg-white/10 text-white hover:bg-white/20 rounded-full hidden md:block"
                    >
                        <X size={24}/>
                    </button>

                    {activeVideo ? (
                        <div className="w-full h-full flex flex-col">
                            <iframe 
                                className="w-full flex-grow"
                                src={`https://www.youtube-nocookie.com/embed/${activeVideo.videoId}?rel=0&modestbranding=1`}
                                title={activeVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                            <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                                <h3 className="font-bold text-lg">{activeVideo.title}</h3>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                            <Youtube size={64} className="mb-4 opacity-50"/>
                            <h3 className="text-xl font-bold mb-2">Chưa chọn video nào</h3>
                            <p>Chọn một video từ danh sách bên trái để phát.</p>
                            <p className="text-sm mt-4 opacity-60 flex items-center gap-2">
                                <AlertCircle size={14}/> Lưu ý: Cần có kết nối Internet để xem Youtube.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoLibrary;