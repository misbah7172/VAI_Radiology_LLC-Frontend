'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useAnnotationStore } from '@/stores/annotationStore';
import toast from 'react-hot-toast';

export default function ImageUploader() {
  const { uploadImages, isUploading } = useAnnotationStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((f) =>
      f.type.startsWith('image/') || f.type.startsWith('video/')
    );

    if (validFiles.length === 0) {
      toast.error('Please select valid image or video files');
      return;
    }

    if (validFiles.some((f) => f.size > 25 * 1024 * 1024)) {
      toast.error('Each file must be under 25MB');
      return;
    }

    try {
      await uploadImages(validFiles);
      toast.success(`${validFiles.length} file(s) uploaded!`);
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
        accept="image/*,video/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        id="upload-images-btn"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '13px',
          fontWeight: 600,
          fontFamily: 'inherit',
          color: '#ffffff',
          background: isUploading
            ? 'rgba(124,58,237,0.6)'
            : hovered
            ? 'linear-gradient(135deg, #6d28d9, #4c1d95)'
            : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
          boxShadow: hovered && !isUploading
            ? '0 6px 20px -4px rgba(124,58,237,0.55)'
            : '0 4px 14px -4px rgba(124,58,237,0.4)',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transform: hovered && !isUploading ? 'translateY(-1px)' : 'translateY(0)',
          transition: 'all 0.18s ease',
          userSelect: 'none',
        }}
      >
        {isUploading ? (
          <Loader2 style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} />
        ) : (
          <Upload style={{ width: '15px', height: '15px' }} />
        )}
        <span>{isUploading ? 'Uploading…' : 'Upload Files'}</span>
      </button>
    </div>
  );
}
