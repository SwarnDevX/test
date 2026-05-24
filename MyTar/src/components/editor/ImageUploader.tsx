'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useCanvasStore, createImageLayer } from '@/store/canvasStore';

interface ImageUploaderProps {
  type?: 'logo' | 'upload';
  onUploaded?: (url: string) => void;
  className?: string;
  label?: string;
}

export default function ImageUploader({ type = 'upload', onUploaded, className, label = 'Upload Image' }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const { addLayer } = useCanvasStore();

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setLoading(true);

    try {
      // Get signed upload URL
      const signedRes = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, type }),
      });

      if (!signedRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, publicUrl } = await signedRes.json();

      // Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (onUploaded) {
        onUploaded(publicUrl);
      } else {
        // Add to canvas
        addLayer(createImageLayer({
          imageUrl: publicUrl,
          name: file.name.replace(/\.[^/.]+$/, ''),
          isLogo: type === 'logo',
        }));
      }
    } catch (err) {
      console.error('Upload failed:', err);
      // Fallback: use object URL for local preview
      const localUrl = URL.createObjectURL(file);
      if (onUploaded) {
        onUploaded(localUrl);
      } else {
        addLayer(createImageLayer({
          imageUrl: localUrl,
          name: file.name.replace(/\.[^/.]+$/, ''),
          isLogo: type === 'logo',
        }));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={className}
      onClick={() => inputRef.current?.click()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Upload className="h-4 w-4" />
          {label}
        </>
      )}
    </div>
  );
}

