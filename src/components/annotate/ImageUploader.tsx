'use client';

import { useRef, useState, useEffect } from 'react';
import { Upload, FolderUp, Loader2 } from 'lucide-react';
import { useAnnotationStore } from '@/stores/annotationStore';
import toast from 'react-hot-toast';

export default function ImageUploader() {
  const { uploadImages, isUploading, imageSets } = useAnnotationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [fileHovered, setFileHovered] = useState(false);
  const [folderHovered, setFolderHovered] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);

  // ── Upload execution ────────────────────────────────────────────────────────
  const doUpload = async (files: File[], setId?: number) => {
    setPendingFiles(null);
    try {
      await uploadImages(files, setId);
      toast.success(`${files.length} file(s) imported successfully!`);
    } catch {
      toast.error('Import failed. Please try again.');
    }
  };

  // ── File validation + choice flow ────────────────────────────────────────────
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

    // If sets exist, show choice. Otherwise upload immediately.
    if (imageSets.length > 0) {
      setPendingFiles(validFiles);
    } else {
      await doUpload(validFiles);
    }
  };

  // ── Drag & Drop Event Listeners ─────────────────────────────────────────────
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      // Only show the import overlay when OS files are being dragged.
      // Ignore internal sidebar-card drags (which carry text/plain, not Files).
      const hasFiles = e.dataTransfer?.types?.includes('Files');
      if (hasFiles) {
        e.preventDefault();
        setIsDragActive(true);
      }
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
      // Only process if real files were dropped (not a sidebar card drag)
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFiles(files);
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

      {/* ── Pending Files: New Set vs Append Choice ────────────────────────── */}
      {pendingFiles && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          width: 'min(560px, calc(100vw - 32px))',
          backgroundColor: '#111118',
          border: '1px solid #2a2a40',
          borderRadius: '14px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.12)',
          overflow: 'hidden',
          animation: 'slideUp 0.2s ease-out',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #1a1a26',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload style={{ width: '14px', height: '14px', color: '#a78bfa' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f7' }}>
                {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} ready to import
              </span>
            </div>
            <button
              onClick={() => setPendingFiles(null)}
              style={{
                background: 'none', border: 'none', color: '#3d3d55',
                cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 2px',
              }}
            >✕</button>
          </div>

          {/* File name preview (up to 3) */}
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #1a1a26' }}>
            {pendingFiles.slice(0, 3).map((f, i) => (
              <p key={i} style={{ margin: '2px 0', fontSize: '11px', color: '#4a5568', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📄 {f.name}
              </p>
            ))}
            {pendingFiles.length > 3 && (
              <p style={{ margin: '2px 0', fontSize: '10px', color: '#2a2a3a' }}>+{pendingFiles.length - 3} more…</p>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ padding: '12px 16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Add to most recent set */}
            {imageSets.length > 0 && (() => {
              const latest = [...imageSets].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
              return (
                <button
                  id="add-to-existing-set-btn"
                  onClick={() => doUpload(pendingFiles, latest.id)}
                  disabled={isUploading}
                  style={{
                    flex: 1, minWidth: '160px',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: '1px solid #3a3a55',
                    background: '#181826',
                    color: '#cbd5e1',
                    fontSize: '12px', fontWeight: 600,
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#4a4a70'; (e.currentTarget as HTMLElement).style.backgroundColor = '#1e1e30'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3a3a55'; (e.currentTarget as HTMLElement).style.backgroundColor = '#181826'; }}
                >
                  <span style={{ display: 'block', fontSize: '10px', color: '#4a5568', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add to existing set</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '200px' }}>
                    📂 {latest.name}
                  </span>
                </button>
              );
            })()}

            {/* Create new set */}
            <button
              id="create-new-set-btn"
              onClick={() => doUpload(pendingFiles)}
              disabled={isUploading}
              style={{
                flex: 1, minWidth: '140px',
                padding: '9px 14px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                color: '#ffffff',
                fontSize: '12px', fontWeight: 600,
                cursor: isUploading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
                boxShadow: '0 4px 12px -2px rgba(124,58,237,0.4)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #6d28d9, #4c1d95)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #7c3aed, #5b21b6)'; }}
            >
              ＋ Create New Set
            </button>
          </div>
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
