import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { voiceApi } from '../lib/api';
import { Mic, MicOff, Volume2, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import './VoiceAnalysis.css';

export default function VoiceAnalysis() {
  const { currentPet, addVoiceMemory, setCurrentEmotion } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [emotion, setEmotion] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recentMemories, setRecentMemories] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const fetchMemories = async () => {
      if (currentPet) {
        try {
          const response = await voiceApi.getPetMemories(currentPet.id);
          setRecentMemories(response.data?.memories || []);
        } catch (error) {
          console.error('Failed to fetch voice memories:', error);
        }
      }
    };
    fetchMemories();
  }, [currentPet]);

  const startRecording = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      mediaRecorderRef.current.onstop = async () => {
        setIsAnalyzing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        try {
          const base64 = await blobToBase64(audioBlob);
          const response = await voiceApi.analyze({ petId: currentPet.id, audioBase64: base64 });
          
          const result = response.data.result;
          setTranscription(result.transcription);
          setEmotion(result.emotion);
          setConfidence(result.confidence);
          setCurrentEmotion(result.emotion as any);
          
          addVoiceMemory({
            petId: currentPet.id,
            emotion: result.emotion,
            confidence: result.confidence,
            transcription: result.transcription,
            createdAt: new Date().toISOString(),
          });

          const memoriesResponse = await voiceApi.getPetMemories(currentPet.id);
          setRecentMemories(memoriesResponse.data?.memories || []);
        } catch (error) {
          console.error('Failed to analyze voice:', error);
        } finally {
          setIsAnalyzing(false);
        }
      };
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      'happy': 'bg-green-100 text-green-800',
      'anxious': 'bg-yellow-100 text-yellow-800',
      'angry': 'bg-red-100 text-red-800',
      'sad': 'bg-blue-100 text-blue-800',
      'neutral': 'bg-gray-100 text-gray-800',
      'excited': 'bg-purple-100 text-purple-800',
    };
    return colors[emotion] || colors['neutral'];
  };

  const getEmotionIcon = (emotion: string) => {
    const icons: Record<string, string> = {
      'happy': '😊',
      'anxious': '😰',
      'angry': '😠',
      'sad': '😢',
      'neutral': '😐',
      'excited': '🤩',
    };
    return icons[emotion] || icons['neutral'];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">宠物声音分析</h1>
          <p className="text-gray-600">倾听你的毛孩子，理解它们的心声</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <div 
                className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl transition-all duration-300 ${
                  isRecording ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}
              >
                {isRecording ? <MicOff className="w-16 h-16 text-white" /> : <Mic className="w-16 h-16 text-white" />}
              </div>
              {isRecording && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-sm">
                  <Clock className="inline-block w-4 h-4 mr-1" /> 录音中...
                </div>
              )}
            </div>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isAnalyzing}
              className={`px-8 py-4 rounded-full text-white font-semibold text-lg transition-all duration-300 shadow-lg ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : isAnalyzing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              }`}
            >
              {isRecording ? '停止录音' : isAnalyzing ? '分析中...' : '开始录音'}
            </button>

            <p className="text-gray-500 mt-4 text-sm">点击按钮后，请让宠物发出声音，录音时长建议3-10秒</p>
          </div>
        </div>

        {transcription && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center mb-4">
              <MessageSquare className="w-6 h-6 text-purple-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">分析结果</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-2">声音翻译</p>
                <p className="text-lg text-gray-800 bg-gray-50 rounded-lg p-4">{transcription}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">情绪识别</p>
                <div className="flex items-center">
                  <span className="text-4xl mr-3">{getEmotionIcon(emotion)}</span>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEmotionColor(emotion)}`}>
                      {emotion}
                    </span>
                    <p className="text-gray-500 text-sm mt-1">置信度: {Math.round(confidence * 100)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Volume2 className="w-6 h-6 text-purple-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">声音记忆库</h2>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              {showHistory ? '收起' : '查看全部'}
            </button>
          </div>

          {recentMemories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">还没有声音记录，开始录音创建第一条记录吧！</p>
          ) : (
            <div className={`space-y-4 transition-all duration-300 ${showHistory ? 'max-h-[500px] overflow-y-auto' : 'max-h-[200px] overflow-y-auto'}`}>
              {recentMemories.slice(0, showHistory ? undefined : 3).map((memory, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getEmotionIcon(memory.emotion)}</span>
                    <div>
                      <p className="text-gray-800">{memory.transcription || '无翻译结果'}</p>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs ${getEmotionColor(memory.emotion)}`}>
                          {memory.emotion}
                        </span>
                        <span className="mx-2">|</span>
                        <span>{new Date(memory.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-purple-500 hover:text-purple-700">
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-orange-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-orange-800">💡 小贴士</p>
            <p className="text-sm text-orange-700">宠物的叫声、咕噜声、呜咽声都包含丰富的情感信息。定期记录可以帮助你更好地了解它们的需求和情绪变化。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
