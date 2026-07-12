'use client';

import { useRef, useState, useEffect } from 'react';
import { Upload, FolderUp, Loader2 } from 'lucide-react';
import { useAnnotationStore } from '@/stores/annotationStore';
import toast from 'react-hot-toast';

export default function ImageUploader() {
  const { uploadImages, isUploading } = useAnnotationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [fileHovered, setFileHovered] = useState(false);
  const [folderHovered, setFolderHovered] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  // ── File validation ──────────────────────────────────────────────────────────
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const ALLOWED_EXTS = [
      '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.tif', '.gif',
      '.dcm', '.dicom', '.nii', '.nii.gz', '.nrrd', '.nhdr', '.mha', '.mhd',
      '.zip', '.mp4', '.webm', '.ogg'
    ];

    const validFiles = Array.from(files).filter((f) => {
      const name = f.name.toLowerCase();
      const matchesExt = ALLOWED_EXTS.some((ext) => name.endsWith(ext));
      const matchesMime = f.type.startsWith('image/') || f.type.startsWith('video/') || f.type === 'application/zip';
      return matchesExt || matchesMime;
    });

    if (validFiles.length === 0) {
      toast.error('Supported: DICOM, NIfTI, NRRD, MHA/MHD, ZIP, TIFF, BMP, GIF, PNG, JPG');
      return;
    }

    if (validFiles.some((f) => f.size > 100 * 1024 * 1024)) {
      toast.error('Files must be under 100MB');
      return;
    }

    try {
      await uploadImages(validFiles);
      toast.success(`${validFiles.length} file(s) imported successfully!`);
    } catch {
      toast.error('Import failed. Please try again.');
    }
  };

  // ── Drag & Drop Event Listeners ─────────────────────────────────────────────
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragActive(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragActive(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      if (e.dataTransfer?.files) {
        handleFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id="image-file-input"
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.bmp,.tiff,.tif,.gif,.dcm,.dicom,.nii,.nii.gz,.nrrd,.nhdr,.mha,.mhd,.zip,image/*,video/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Hidden folder input */}
      <input
        ref={folderInputRef}
        id="image-folder-input"
        type="file"
        multiple
        webkitdirectory=""
        directory=""
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Upload Files Button */}
      <button
        id="upload-images-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        onMouseEnter={() => setFileHovered(true)}
        onMouseLeave={() => setFileHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '6px',
          border: 'none',
          fontSize: '11px',
          fontWeight: 600,
          fontFamily: 'inherit',
          color: '#ffffff',
          background: isUploading
            ? 'rgba(124,58,237,0.6)'
            : fileHovered
            ? 'linear-gradient(135deg, #6d28d9, #4c1d95)'
            : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
          boxShadow: fileHovered && !isUploading
            ? '0 4px 12px -2px rgba(124,58,237,0.45)'
            : '0 2px 8px -2px rgba(124,58,237,0.3)',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transform: fileHovered && !isUploading ? 'translateY(-0.5px)' : 'translateY(0)',
          transition: 'all 0.15s ease',
          userSelect: 'none',
        }}
      >
        {isUploading ? (
          <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} />
        ) : (
          <Upload style={{ width: '13px', height: '13px' }} />
        )}
        <span>{isUploading ? 'Uploading…' : 'Import Files'}</span>
      </button>

      {/* Import Folder Button */}
      <button
        id="upload-folder-btn"
        onClick={() => folderInputRef.current?.click()}
        disabled={isUploading}
        onMouseEnter={() => setFolderHovered(true)}
        onMouseLeave={() => setFolderHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid #2e2e42',
          fontSize: '11px',
          fontWeight: 600,
          fontFamily: 'inherit',
          color: '#e2e8f0',
          background: folderHovered ? '#1a1a26' : '#0e0e14',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          userSelect: 'none',
        }}
      >
        <FolderUp style={{ width: '13px', height: '13px' }} />
        <span>Import Folder</span>
      </button>

      {/* Full-screen Drag Overlay */}
      {isDragActive && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(3, 3, 5, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          border: '4px dashed #7c3aed',
          margin: '10px',
          borderRadius: '12px',
          pointerEvents: 'none',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(124, 58, 237, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #7c3aed',
          }}>
            <Upload style={{ width: '36px', height: '36px', color: '#a78bfa', animation: 'bounce 1s infinite' }} />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 700, margin: 0 }}>
            Drop to Import Series
          </h2>
          <p style={{ color: '#a0aec0', fontSize: '13px', margin: 0, textAlign: 'center' }}>
            Supported formats: DICOM (.dcm), NIfTI (.nii, .nii.gz), NRRD, MetaImage (.mha, .mhd), ZIP, TIFF, BMP, GIF, PNG, JPG
          </p>
        </div>
      )}
    </div>
  );
}

// Add type declarations for folder directory selection
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}
