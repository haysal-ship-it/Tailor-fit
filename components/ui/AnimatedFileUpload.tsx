'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Upload, X, RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springSmooth } from '@/lib/motion-tokens';

interface AnimatedFileUploadProps {
  images?: string[];
  onChange?: (images: string[]) => void;
  className?: string;
}

export function AnimatedFileUpload({
  images = [],
  onChange,
  className,
}: AnimatedFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadError(false);
    setUploadProgress(15);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 15;
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 80);

    const reader = new FileReader();
    reader.onload = (e) => {
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        setTimeout(() => {
          setUploadProgress(null);
          const result = e.target?.result as string;
          if (result && onChange) {
            onChange([...images, result]);
          }
        }, 200);
      }, 350);
    };

    reader.onerror = () => {
      clearInterval(interval);
      setUploadProgress(null);
      setUploadError(true);
    };

    reader.readAsDataURL(file);
  };

  const handleRemove = (index: number) => {
    if (onChange) {
      const updated = images.filter((_, i) => i !== index);
      onChange(updated);
    }
  };

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Drop Zone */}
      <motion.label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        animate={{
          borderColor: isDragOver ? 'var(--accent)' : 'var(--border)',
          backgroundColor: isDragOver ? 'var(--surface-2)' : 'var(--surface-1)',
        }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15 }}
        className="border border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden min-h-[96px] select-none"
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploadProgress !== null ? (
          <div className="w-full max-w-[200px] flex flex-col items-center gap-2">
            <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
              <motion.div
                className="h-full bg-[var(--text)]"
                initial={{ width: '0%' }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ ease: 'easeOut', duration: 0.2 }}
              />
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              Uploading {uploadProgress}%
            </span>
          </div>
        ) : uploadError ? (
          <div className="flex flex-col items-center gap-1.5 text-[var(--status-danger)]">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-xs font-medium">Upload failed. Tap to retry</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-[var(--text-muted)]">
            <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text)]">
              <Upload className="w-4 h-4" />
            </div>
            <span className="text-xs text-[var(--text)] font-medium">
              Drop style references here or browse
            </span>
            <span className="text-[11px] text-[var(--text-faint)]">
              PNG, JPG, or WEBP up to 10MB
            </span>
          </div>
        )}
      </motion.label>

      {/* 3-Up Grid of Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <AnimatePresence>
            {images.map((img, idx) => (
              <motion.div
                key={`${img.slice(0, 20)}-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={springSmooth}
                className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)] group bg-[var(--surface-2)]"
              >
                <img
                  src={img}
                  alt={`Style reference ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                  title="Remove reference"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
