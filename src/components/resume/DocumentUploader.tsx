import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';

interface DocumentUploaderProps {
  onFileUpload: (file: File, metadata: DocumentMetadata) => void;
  onError: (error: string) => void;
  isProcessing?: boolean;
  acceptedFormats?: string[];
  maxFileSize?: number;
}

interface DocumentMetadata {
  filename: string;
  size: number;
  type: string;
  lastModified: Date;
  pageCount?: number;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  message: string;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onFileUpload,
  onError,
  isProcessing = false,
  acceptedFormats = ['.pdf', '.docx', '.txt'],
  maxFileSize = 10 * 1024 * 1024 // 10MB
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: ''
  });

  const processFile = useCallback(async (file: File): Promise<DocumentMetadata> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const metadata: DocumentMetadata = {
          filename: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified)
        };

        // Estimate page count based on file size and type
        if (file.type === 'application/pdf') {
          metadata.pageCount = Math.max(1, Math.ceil(file.size / 50000)); // Rough estimate
        } else {
          metadata.pageCount = 1;
        }

        resolve(metadata);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      return `File type not supported. Please upload: ${acceptedFormats.join(', ')}`;
    }

    // Check if file is empty
    if (file.size === 0) {
      return 'File appears to be empty';
    }

    return null;
  }, [acceptedFormats, maxFileSize]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const validationError = validateFile(file);

    if (validationError) {
      setUploadState({
        status: 'error',
        progress: 0,
        message: validationError
      });
      onError(validationError);
      return;
    }

    try {
      setUploadState({
        status: 'uploading',
        progress: 25,
        message: 'Uploading file...'
      });

      // Simulate upload progress
      setTimeout(() => {
        setUploadState(prev => ({
          ...prev,
          progress: 50,
          message: 'Processing document...'
        }));
      }, 500);

      const metadata = await processFile(file);

      setUploadState({
        status: 'processing',
        progress: 75,
        message: 'Extracting document content...'
      });

      // Simulate processing time
      setTimeout(() => {
        setUploadState({
          status: 'success',
          progress: 100,
          message: 'Document uploaded successfully!'
        });

        onFileUpload(file, metadata);

        // Reset state after success
        setTimeout(() => {
          setUploadState({
            status: 'idle',
            progress: 0,
            message: ''
          });
        }, 2000);
      }, 1000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      setUploadState({
        status: 'error',
        progress: 0,
        message: errorMessage
      });
      onError(errorMessage);
    }
  }, [validateFile, processFile, onFileUpload, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: isProcessing || uploadState.status === 'processing'
  });

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      case 'uploading':
      case 'processing':
        return <FileText className="w-8 h-8 text-blue-500 animate-pulse" />;
      default:
        return <Upload className="w-8 h-8 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadState.status) {
      case 'success':
        return 'border-green-300 bg-green-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      case 'uploading':
      case 'processing':
        return 'border-blue-300 bg-blue-50';
      default:
        return isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className={`transition-all duration-200 ${getStatusColor()}`}>
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`
              flex flex-col items-center justify-center space-y-4 
              cursor-pointer transition-all duration-200
              ${uploadState.status === 'processing' || isProcessing ? 'cursor-not-allowed opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {getStatusIcon()}
            
            <div className="text-center">
              {uploadState.status === 'idle' && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag and drop your resume file, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Supported formats: {acceptedFormats.join(', ')} • Max size: {Math.round(maxFileSize / 1024 / 1024)}MB
                  </p>
                </>
              )}
              
              {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
                <>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    {uploadState.message}
                  </h3>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadState.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-blue-600">
                    {uploadState.progress}% complete
                  </p>
                </>
              )}
              
              {uploadState.status === 'success' && (
                <>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    {uploadState.message}
                  </h3>
                  <p className="text-sm text-green-600">
                    Your resume is ready for analysis
                  </p>
                </>
              )}
            </div>
            
            {uploadState.status === 'idle' && (
              <Button variant="outline" className="mt-4">
                Choose File
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {uploadState.status === 'error' && (
        <Alert className="mt-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {uploadState.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DocumentUploader;