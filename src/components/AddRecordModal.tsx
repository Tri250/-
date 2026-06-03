import React, { useState } from 'react';
import { X, Save, Mic, FileText } from 'lucide-react';
import { Card } from './DesignSystem/Card';
import { Button } from './DesignSystem/Button';
import { RecordType, RECORD_TYPE_LABELS } from '../types/health-record';

interface AddRecordModalProps {
  visible?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  petId?: string;
  initialType?: RecordType;
  availableTags?: any[];
  onSubmit?: (record: {
    type: RecordType;
    title: string;
    description: string;
    date: string;
    notes: string;
    content?: string;
    tags?: string[];
    isImportant?: boolean;
    attachments?: string[];
    voiceDuration?: number;
    voiceTranscription?: string;
    pdfFileName?: string;
  }) => void;
}

const RECORD_TYPES: RecordType[] = [
  'checkup',
  'vaccination',
  'medication',
  'surgery',
  'lab',
  'weight',
  'dental',
  'grooming',
  'emergency',
  'pdf',
];

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  visible,
  isOpen,
  onClose,
  initialType = 'checkup',
  onSubmit,
}) => {
  const [recordType, setRecordType] = useState<RecordType>(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  if (!visible && !isOpen) return null;

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('请输入记录标题');
      return;
    }
    onSubmit?.({
      type: recordType,
      title: title.trim(),
      description: description.trim(),
      date: new Date().toISOString(),
      notes: notes.trim(),
    });
    onClose();
    // Reset form
    setTitle('');
    setDescription('');
    setNotes('');
    setRecordType('checkup');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">添加健康记录</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              记录类型
            </label>
            <div className="flex flex-wrap gap-2">
              {RECORD_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setRecordType(type)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    recordType === type
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {RECORD_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入记录标题"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入详细描述"
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="输入额外备注"
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              取消
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              <Save className="w-4 h-4 mr-1" />
              保存
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
