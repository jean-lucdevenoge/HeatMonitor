import React, { useRef } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    const file = files[0];
    
    if (file && file.name.endsWith('.csv')) {
      onFileSelect(file);
    }
  };
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragOver 
            ? 'border-blue-500 bg-blue-100 scale-105' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex flex-col items-center space-y-4">
          {isProcessing ? (
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          ) : (
            <Upload className={`w-12 h-12 transition-colors ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          )}
          
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {isProcessing ? 'Processing CSV...' : isDragOver ? 'Drop CSV file here' : 'Add Historical Data'}
            </h3>
            <p className="text-gray-500">
              Drop your heating system CSV file here or click to browse
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Data will be added to your existing analysis
            </p>
          </div>
          
          <div className={`flex items-center space-x-2 text-sm transition-colors ${isDragOver ? 'text-blue-500' : 'text-gray-500'}`}>
            <FileText className="w-4 h-4" />
            <span>CSV Format Expected</span>
          </div>
        </div>
      </div>
    </div>
  );
};