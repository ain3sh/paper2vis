import React, { useRef, useState } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelected, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      onFileSelected(files[0]);
    } else {
        alert("Please upload a valid PDF file.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (file.type === 'application/pdf') {
            onFileSelected(file);
        } else {
            alert("Please upload a valid PDF file.");
        }
    }
  };

  return (
    <div
      className={`relative group w-full transition-all duration-500 ease-out
        ${isProcessing ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
      `}
    >
      {/* Glow effect behind */}
      <div className={`absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 ${isDragging ? 'opacity-75 animate-pulse' : ''}`}></div>
      
      <div
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full h-64 rounded-2xl glass-panel border-2 transition-all duration-300 bg-black/40 backdrop-blur-xl
          ${isDragging ? 'border-cyan-500 bg-cyan-900/10 scale-[1.02]' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept="application/pdf"
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center space-y-6 text-center p-8">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-tr from-gray-800 to-black border border-white/10 flex items-center justify-center shadow-2xl transition-transform duration-500 ${isDragging ? 'scale-110 rotate-12' : 'group-hover:scale-105'}`}>
                <Upload className={`w-8 h-8 text-gray-300 transition-colors ${isDragging ? 'text-cyan-400' : 'group-hover:text-white'}`} />
            </div>
            
            <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">
                    {isDragging ? 'Drop PDF Here' : 'Upload Paper'}
                </h3>
                <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
                    Drag & drop your PDF research paper here.
                    <span className="block mt-1 text-xs opacity-50 uppercase tracking-wider font-mono">Supports standard technical papers</span>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
