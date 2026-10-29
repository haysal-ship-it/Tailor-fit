'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CloudUpload, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springSmooth } from '@/lib/motion-tokens';

interface AnimatedFileUploadProps {
  images?: string[];
  onChange?: (images: string[]) => void;
  className?: string;
  label?: string;
}

export function AnimatedFileUpload({
  images = [],
  onChange,
  className,
  label = 'Tap to upload image',
}: AnimatedFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
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

    Promise.all(
      fileArray.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) resolve(e.target.result as string);
              else reject(new Error('Failed to read file'));
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          })
      )
    )
      .then((results) => {
        setTimeout(() => {
          clearInterval(interval);
          setUploadProgress(100);
          setTimeout(() => {
            setUploadProgress(null);
            if (results.length > 0 && onChange) {
              onChange([...images, ...results]);
            }
          }, 200);
        }, 350);
      })
      .catch(() => {
        clearInterval(interval);
        setUploadProgress(null);
        setUploadError(true);
      });
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
          borderColor: isDragOver ? 'var(--primary)' : 'var(--dashed)',
          backgroundColor: isDragOver ? 'rgba(29, 73, 232, 0.04)' : 'transparent',
        }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15 }}
        className="w-full h-[100px] border border-dashed border-[var(--dashed)] rounded-[8px] flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden select-none focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[rgba(29,73,232,0.15)]"
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {uploadProgress !== null ? (
          <div className="w-full max-w-[200px] flex flex-col items-center gap-2">
            <div className="w-full h-1.5 rounded-full bg-[var(--chip)] overflow-hidden">
              <motion.div
                className="h-full bg-[var(--primary)]"
                initial={{ width: '0%' }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ ease: 'easeOut', duration: 0.2 }}
              />
            </div>
            <span className="text-[11px] text-[var(--text-2)] font-mono tabular-nums">
              Uploading {uploadProgress}%
            </span>
          </div>
        ) : uploadError ? (
          <div className="flex flex-col items-center gap-1.5 text-[var(--status-danger)]">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-[12px] font-medium">Upload failed. Tap to retry</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-3 text-center">
            <div className="w-8 h-8 rounded-full bg-[var(--chip)] flex items-center justify-center text-[var(--text-2)]">
              <CloudUpload className="w-4 h-4" />
            </div>
            <span className="text-[11px] sm:text-[12px] font-medium text-[var(--text-2)] mt-2">
              {label}
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
                  aria-label={`Remove style reference ${idx + 1}`}
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
