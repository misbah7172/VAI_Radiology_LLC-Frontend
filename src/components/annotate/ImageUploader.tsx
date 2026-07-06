'use client';

import { useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useAnnotationStore } from '@/stores/annotationStore';
import toast from 'react-hot-toast';

export default function ImageUploader() {
  const { uploadImages, isUploading } = useAnnotationStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((f) =>
      f.type.startsWith('image/')
    );

    if (validFiles.length === 0) {
      toast.error('Please select valid image files');
      return;
    }

    if (validFiles.some((f) => f.size > 10 * 1024 * 1024)) {
      toast.error('Each image must be under 10MB');
      return;
    }

    try {
      await uploadImages(validFiles);
      toast.success(`${validFiles.length} image(s) uploaded!`);
    } catch {
      toast.error('Upload failed. Please try again.');
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        id="image-file-input"
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        id="upload-images-btn"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
          color: 'white',
          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
        }}
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {isUploading ? 'Uploading…' : 'Upload Images'}
      </button>
    </div>
  );
}
