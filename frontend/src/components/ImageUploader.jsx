import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';

// 1. ADDED `value` PROP HERE to listen to the parent
const ImageUploader = ({ value, onImageSelect }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // 2. NEW LISTENER: When the parent wipes the form, wipe this preview!
  useEffect(() => {
    if (value === null) {
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [value]);

  // Clean up object URLs to prevent memory leaks when the component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      if (onImageSelect) onImageSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const clearImage = (e) => {
    e.stopPropagation(); // Prevents the click from triggering the file input again
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onImageSelect) onImageSelect(null);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-mono text-zinc-400 mb-2 uppercase tracking-wider">
        Attach Evidence (Optional)
      </label>
      
      <div 
        className={`relative border-2 border-dashed rounded-xl transition-all duration-300 flex flex-col items-center justify-center p-6 text-center cursor-pointer overflow-hidden
          ${isDragging 
            ? 'border-emerald-500 bg-emerald-950/20' 
            : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-800/50'
          }
          ${previewUrl ? 'min-h-[250px]' : 'min-h-[150px]'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !previewUrl && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleChange}
          accept="image/jpeg, image/png, image/webp" 
          className="hidden" 
        />

        {previewUrl ? (
          <div className="absolute inset-0 w-full h-full group">
            <img 
              src={previewUrl} 
              alt="Evidence preview" 
              className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-50"
            />
            {/* Overlay that appears on hover to allow clearing the image */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={clearImage}
                className="bg-red-950/80 text-red-400 p-3 rounded-full hover:bg-red-900 hover:text-red-300 transition-colors border border-red-900/50 shadow-xl"
                type="button"
                title="Remove image"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div className="p-3 bg-zinc-800 rounded-full text-emerald-500 shadow-inner border border-zinc-700">
              <UploadCloud size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300">
                Click or drag image to upload
              </p>
              <p className="text-xs text-zinc-500 mt-1 font-mono">
                JPEG, PNG, WEBP (Max 5MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;