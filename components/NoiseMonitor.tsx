import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, AlertTriangle, X, Settings2 } from 'lucide-react';

interface NoiseMonitorProps {
    onClose: () => void;
}

export const NoiseMonitor: React.FC<NoiseMonitorProps> = ({ onClose }) => {
    const [isListening, setIsListening] = useState(false);
    const [volume, setVolume] = useState(0);
    const [threshold, setThreshold] = useState(50); // 0-100
    const [permissionError, setPermissionError] = useState('');
    const [alertState, setAlertState] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const requestRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);

    // Alert timeout ref to prevent flickering
    const alertTimeoutRef = useRef<any>(null);

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyserRef.current = analyser;

            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            microphoneRef.current = microphone;

            setIsListening(true);
            setPermissionError('');
            analyzeAudio();
        } catch (err) {
            console.error("Microphone access denied:", err);
            setPermissionError("Không thể truy cập Microphone. Vui lòng cấp quyền trong cài đặt trình duyệt.");
        }
    };

    const stopListening = () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        
        setIsListening(false);
        setVolume(0);
        setAlertState(false);
    };

    const analyzeAudio = () => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume (RMS-like)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        // Normalize roughly to 0-100 (Frequency data is 0-255, but average is usually lower)
        // Amplify a bit for better visual
        const normalizedVol = Math.min(100, Math.round((average / 100) * 100 * 1.5));
        
        setVolume(prev => prev * 0.8 + normalizedVol * 0.2); // Smooth out

        // Check Threshold
        if (normalizedVol > threshold) {
            if (!alertTimeoutRef.current) {
                setAlertState(true);
                // Keep alert for at least 1 second to avoid strobe effect
                alertTimeoutRef.current = setTimeout(() => {
                    alertTimeoutRef.current = null;
                }, 1000);
            }
        } else if (!alertTimeoutRef.current) {
            setAlertState(false);
        }

        requestRef.current = requestAnimationFrame(analyzeAudio);
    };

    useEffect(() => {
        return () => stopListening();
    }, []);

    // Visual bars generation
    const renderBars = () => {
        const bars = 20;
        return Array.from({ length: bars }).map((_, i) => {
            const isActive = (i / bars) * 100 < volume;
            const isWarning = (i / bars) * 100 > threshold;
            let colorClass = "bg-green-400";
            if (volume > threshold) colorClass = "bg-red-500";
            else if (volume > threshold * 0.7) colorClass = "bg-yellow-400";

            return (
                <div 
                    key={i} 
                    className={`w-2 md:w-4 rounded-t-sm transition-all duration-100 ${isActive ? colorClass : 'bg-gray-200'}`}
                    style={{ height: `${20 + Math.random() * 80}%`, opacity: isActive ? 1 : 0.3 }}
                ></div>
            );
        });
    };

    return (
        <div className={`fixed inset-0 z-[80] flex items-center justify-center p-4 transition-colors duration-300 ${alertState ? 'bg-red-900/90' : 'bg-black/60'}`}>
            <div className={`relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden transition-transform duration-100 ${alertState ? 'scale-105 border-8 border-red-500' : 'scale-100 border-0'}`}>
                {/* Header */}
                <div className="p-4 flex justify-between items-center border-b border-gray-100">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-700">
                        <Mic className={isListening ? "text-red-500 animate-pulse" : "text-gray-400"} />
                        Đo Tiếng Ồn
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <X size={24} />
                    </button>
                </div>

                {/* Main Display */}
                <div className="p-8 flex flex-col items-center">
                    
                    {permissionError ? (
                        <div className="text-center text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">
                            <AlertTriangle size={48} className="mx-auto mb-2"/>
                            <p>{permissionError}</p>
                        </div>
                    ) : (
                        <>
                            {/* Alert Message */}
                            <div className={`mb-8 text-center transition-opacity duration-200 ${alertState ? 'opacity-100' : 'opacity-0'}`}>
                                <h1 className="text-6xl font-black text-red-600 uppercase tracking-widest animate-bounce">
                                    Quá Ồn! 🤫
                                </h1>
                                <p className="text-gray-500 font-bold mt-2">Giữ trật tự nào!</p>
                            </div>

                            {/* Main Meter */}
                            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                                {/* Circles */}
                                <div className={`absolute inset-0 rounded-full border-4 transition-all duration-300 ${alertState ? 'border-red-500 scale-110' : 'border-gray-200 scale-100'}`}></div>
                                <div className="absolute inset-4 rounded-full border-4 border-gray-100"></div>
                                
                                {/* Volume Number */}
                                <div className={`text-7xl font-black transition-colors ${alertState ? 'text-red-600' : 'text-indigo-600'}`}>
                                    {Math.round(volume)}
                                </div>
                                <div className="absolute bottom-16 text-xs font-bold text-gray-400 uppercase tracking-widest">Decibel Level</div>
                            </div>

                            {/* Visualizer Bars */}
                            <div className="w-full h-24 flex items-end justify-center gap-1 mt-8 mb-8 border-b-4 border-gray-100 px-4">
                                {isListening ? renderBars() : (
                                    <div className="w-full text-center text-gray-400 pb-4">Nhấn bắt đầu để đo...</div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Controls */}
                    <div className="w-full bg-gray-50 p-6 rounded-2xl flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <Settings2 className="text-gray-400" size={20}/>
                            <div className="flex-grow">
                                <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                    <span>Độ nhạy (Ngưỡng cảnh báo)</span>
                                    <span>{threshold}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="100" 
                                    value={threshold} 
                                    onChange={(e) => setThreshold(parseInt(e.target.value))}
                                    className="w-full accent-indigo-600"
                                />
                            </div>
                        </div>

                        <div className="flex justify-center mt-2">
                            {!isListening ? (
                                <button 
                                    onClick={startListening}
                                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-transform active:scale-95"
                                >
                                    <Mic size={20} /> Bắt Đầu Đo
                                </button>
                            ) : (
                                <button 
                                    onClick={stopListening}
                                    className="flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg transition-transform active:scale-95"
                                >
                                    <MicOff size={20} /> Dừng Lại
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};