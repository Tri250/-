// ============================================
// PawSync Pro - ImageUploader.tsx
// 
// 描述: 图片上传组件
// ============================================

import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { readFileAsDataURL } from '../services/imageProcessor';

/**
 * 组件属性
 */
export interface ImageUploaderProps {
  onImageSelected?: (file: File, imageUrl: string) => void;
  onAnalysisRequested?: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 图片上传组件
 * 支持拍照和从相册选择两种方式
 */
export function ImageUploader({
  onImageSelected,
  onAnalysisRequested,
  disabled = false,
  className = '',
}: ImageUploaderProps) {
  // 状态
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageUrl = await readFileAsDataURL(file);
        setSelectedFile(file);
        setSelectedImage(imageUrl);
        onImageSelected?.(file, imageUrl);
      } catch (error) {
        console.error('图片加载失败:', error);
      }
    }
    event.target.value = '';
  };

  // 清除选中图片
  const clearSelection = () => {
    setSelectedImage(null);
    setSelectedFile(null);
  };

  // 开始分析
  const handleAnalysis = () => {
    if (selectedFile) {
      onAnalysisRequested?.(selectedFile);
    }
  };

  return (
    <div className={className}>
      {/* 隐藏的输入元素 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 图片预览或选择按钮 */}
      {selectedImage ? (
        <div className="space-y-4">
          {/* 图片预览 */}
          <div className="relative rounded-xl overflow-hidden bg-gray-100">
            <img
              src={selectedImage}
              alt="选中的图片"
              className="w-full h-48 object-cover"
            />
            {/* 清除按钮 */}
            <button
              onClick={clearSelection}
              className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="small"
              onClick={clearSelection}
              className="flex-1"
            >
              重新选择
            </Button>
            <Button
              size="small"
              onClick={handleAnalysis}
              className="flex-1"
              icon={<Sparkles className="w-4 h-4" />}
              disabled={disabled}
            >
              开始分析
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 拍照按钮 */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled}
            className={`
              w-full flex items-center justify-center gap-3 p-4
              bg-gradient-to-r from-orange-50 to-peach-50 rounded-xl
              hover:from-orange-100 hover:to-peach-100 transition-colors
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <Camera className="w-6 h-6 text-orange-500" />
            <span className="font-medium text-gray-700">拍照</span>
          </button>

          {/* 从相册选择按钮 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={`
              w-full flex items-center justify-center gap-3 p-4
              bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl
              hover:from-blue-100 hover:to-indigo-100 transition-colors
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <Upload className="w-6 h-6 text-blue-500" />
            <span className="font-medium text-gray-700">从相册选择</span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 图片上传模态框组件
 */
export interface ImageUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisRequested: (file: File) => void;
}

export function ImageUploaderModal({
  isOpen,
  onClose,
  onAnalysisRequested,
}: ImageUploaderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl animate-fadeIn">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">选择图片</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 图片上传器 */}
        <ImageUploader
          onAnalysisRequested={(file) => {
            onAnalysisRequested(file);
            onClose();
          }}
        />
      </div>
    </div>
  );
}