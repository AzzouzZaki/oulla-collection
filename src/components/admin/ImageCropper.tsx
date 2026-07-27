'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  src: string;                              // object URL of the selected file
  onConfirm: (blob: Blob) => void;          // called with the cropped blob
  onCancel: () => void;
}

function centerAspectCrop(_width: number, _height: number): Crop {
  const size = 80;
  return {
    unit: '%',
    x: (100 - size) / 2,
    y: (100 - size) / 2,
    width: size,
    height: size,
  };
}

export default function ImageCropper({ src, onConfirm, onCancel }: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    setCrop(centerAspectCrop(w, h));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    canvas.width = Math.floor(completedCrop.width * scaleX);
    canvas.height = Math.floor(completedCrop.height * scaleY);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob);
    }, 'image/jpeg', 0.92);
  }, [completedCrop, onConfirm]);

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[9998] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-[8px] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
          <div>
            <h3 className="text-base font-semibold text-[#111827]">Recadrer l'image</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Faites glisser pour sélectionner la zone à conserver</p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Crop area */}
        <div className="flex-1 overflow-auto bg-[#F9FAFB] p-4 flex items-center justify-center" style={{ maxHeight: '60vh' }}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            className="max-w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="Recadrer"
              onLoad={onImageLoad}
              style={{ maxWidth: '100%', maxHeight: '55vh', display: 'block' }}
            />
          </ReactCrop>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#E5E7EB] bg-white">
          <p className="text-xs text-[#6B7280]">
            {completedCrop
              ? `${Math.round(completedCrop.width)} × ${Math.round(completedCrop.height)} px`
              : 'Sélectionnez une zone'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="border border-[#E5E7EB] text-[#111827] rounded-[6px] px-4 py-2 text-sm font-medium hover:bg-[#F8F9FA]"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!completedCrop || completedCrop.width < 1 || completedCrop.height < 1}
              className="bg-[#18181B] text-white rounded-[6px] px-4 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-40"
            >
              Confirmer le recadrage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
