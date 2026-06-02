import React, { useState } from 'react';
import { X, Mic, Image, Video, FileText, Check, Star } from 'lucide-react';
import { GlassModal, GlassInput, GlassTextarea } from './DesignSystem';
import { HealthTag, RecordType, DEFAULT_TAGS } from '../types/health-record';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (record: {
    type: RecordType;
    title: string;
    content: string;
    tags: string[];
    isImportant: boolean;
  }) => void;
  availableTags: HealthTag[];
}

const RECORD_TYPE_CONFIG: {
  type: RecordType;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { type: 'text', label: '文字', icon: FileText, color: 'bg-blue-500' },
  { type: 'voice', label: '语音', icon: Mic, color: 'bg-purple-500' },
  { type: 'photo', label: '图片', icon: Image, color: 'bg-green-500' },
  { type: 'video', label: '视频', icon: Video, color: 'bg-red-500' },
];

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableTags,
}) => {
  const [recordType, setRecordType] = useState<RecordType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isImportant, setIsImportant] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    onSubmit({
      type: recordType,
      title: title.trim(),
      content: content.trim(),
      tags: selectedTags,
      isImportant,
    });

    handleClose();
  };

  const handleClose = () => {
    setRecordType('text');
    setTitle('');
    setContent('');
    setSelectedTags([]);
    setIsImportant(false);
    setIsRecording(false);
    onClose();
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleRecordVoice = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setContent('（语音记录 - 模拟语音转文字内容）');
      }, 2000);
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={handleClose} title="添加健康记录" size="md">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            记录类型
          </label>
          <div className="grid grid-cols-4 gap-2">
            {RECORD_TYPE_CONFIG.map((config) => (
              <button
                key={config.type}
                onClick={() => setRecordType(config.type)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                  recordType === config.type
                    ? 'bg-primary-50 border-2 border-primary-500'
                    : 'bg-neutral-50 border-2 border-transparent hover:bg-neutral-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center`}>
                  <config.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium text-neutral-600">{config.label}</span>
              </button>
            ))}
          </div>
        </div>

        <GlassInput
          label="标题"
          placeholder="输入记录标题..."
          value={title}
          onChange={setTitle}
          required
        />

        <div>
          <GlassTextarea
            label="内容"
            placeholder="详细描述宠物的健康状况..."
            value={content}
            onChange={setContent}
            rows={4}
            required
          />
          {recordType === 'voice' && (
            <button
              onClick={handleRecordVoice}
              className={`mt-2 w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              <Mic className={`w-5 h-5 ${isRecording ? 'animate-bounce' : ''}`} />
              {isRecording ? '正在录音...' : '点击开始录音'}
            </button>
          )}
          {recordType === 'photo' && (
            <div className="mt-2 border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors cursor-pointer">
              <Image className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">点击或拖拽上传图片</p>
            </div>
          )}
          {recordType === 'video' && (
            <div className="mt-2 border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors cursor-pointer">
              <Video className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">点击或拖拽上传视频</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            标签
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedTags.includes(tag.id)
                    ? 'ring-2 ring-offset-1'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: tag.color + '20',
                  color: tag.color,
                  ...(selectedTags.includes(tag.id) && { ringColor: tag.color }),
                }}
              >
                {selectedTags.includes(tag.id) && (
                  <Check className="w-3 h-3 inline mr-1" />
                )}
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportant(!isImportant)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              isImportant
                ? 'bg-amber-100 text-amber-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Star
              className={`w-4 h-4 ${isImportant ? 'fill-amber-500 text-amber-500' : ''}`}
            />
            <span className="text-sm font-medium">标记为重要</span>
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl bg-neutral-100 text-neutral-700 font-medium hover:bg-neutral-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim()}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存记录
          </button>
        </div>
      </div>
    </GlassModal>
  );
};