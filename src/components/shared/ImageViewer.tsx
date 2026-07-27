'use client';

import { useEffect, useCallback } from 'react';
import Image from 'next/image';

interface ImageViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function ImageViewer({ src, alt = 'Image', onClose }: ImageViewerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={onClose}
        aria-label="Fermer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* ESC hint */}
      <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-widest uppercase select-none">
        Appuyez sur Échap pour fermer
      </p>

      {/* Image container — stop propagation so clicking the image doesn't close */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="90vw"
          priority
        />
      </div>
    </div>
  );
}
