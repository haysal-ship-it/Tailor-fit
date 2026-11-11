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
  label = 'Add reference images',
}: AnimatedFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  const MAX_IMAGES_COUNT = 6;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setUploadError(null);

    // Validate image mime types
    const invalidTypes = fileArray.filter((f) => !['image/jpeg','image/png','image/webp'].includes(f.type));
    if (invalidTypes.length > 0) {
      setUploadError('Only image files (PNG, JPG, WebP) are supported.');
      return;
    }

    // Validate size limit (5MB)
    const oversized = fileArray.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length > 0) {
      setUploadError('Image size exceeds 5MB limit.');
      return;
    }

    // Validate total count
    if (images.length + fileArray.length > MAX_IMAGES_COUNT) {
      setUploadError(`Maximum ${MAX_IMAGES_COUNT} style references allowed.`);
      return;
    }

    setUploadProgress(30);

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
        setUploadProgress(100);
        setTimeout(() => {
          setUploadProgress(null);
          if (results.length > 0 && onChange) {
            onChange([...images, ...results]);
          }
        }, 150);
      })
      .catch(() => {
        setUploadProgress(null);
        setUploadError('Failed to process image attachment.');
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
          accept="image/jpeg,image/png,image/webp"
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
            <span className="text-[11px] text-[var(--text-2)] font-medium">
              Adding images…
            </span>
          </div>
        ) : uploadError ? (
          <div className="flex flex-col items-center gap-1 text-[#E53E3E] px-4 text-center">
            <span className="text-[12px] font-medium">{uploadError}</span>
            <span className="text-[11px] text-[var(--muted)]">Tap to choose another file</span>
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
