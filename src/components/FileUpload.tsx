'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'

interface UploadedFile {
  id: string
  file: File
  preview?: string
  status: 'uploading' | 'success' | 'error'
  progress: number
}

interface FileUploadProps {
  onFilesChange: (files: File[]) => void
  acceptedTypes?: string[]
  maxFiles?: number
  maxSizeInMB?: number
  className?: string
}

export default function FileUpload({
  onFilesChange,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  maxFiles = 5,
  maxSizeInMB = 10,
  className = ''
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      return `El archivo es muy grande. Máximo ${maxSizeInMB}MB permitido.`
    }

    // Check file type
    const fileType = file.type
    const fileName = file.name.toLowerCase()
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileName.endsWith(type)
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0]
        return fileType.startsWith(baseType)
      }
      return fileType === type
    })

    if (!isValidType) {
      return `Tipo de archivo no permitido. Tipos aceptados: ${acceptedTypes.join(', ')}`
    }

    return null
  }

  const processFiles = useCallback(async (files: FileList) => {
    const newFiles: UploadedFile[] = []
    
    for (let i = 0; i < files.length && uploadedFiles.length + newFiles.length < maxFiles; i++) {
      const file = files[i]
      const validationError = validateFile(file)
      
      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${i}`,
        file,
        status: validationError ? 'error' : 'uploading',
        progress: validationError ? 0 : 10
      }

      // Create preview for images
      if (file.type.startsWith('image/')) {
        uploadedFile.preview = URL.createObjectURL(file)
      }

      newFiles.push(uploadedFile)

      // Simulate upload progress if no validation error
      if (!validationError) {
        setTimeout(() => simulateUpload(uploadedFile.id), 100)
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Notify parent component of file changes
    const validFiles = newFiles
      .filter(f => f.status !== 'error')
      .map(f => f.file)
    
    if (validFiles.length > 0) {
      onFilesChange([...uploadedFiles.map(f => f.file), ...validFiles])
    }
  }, [uploadedFiles, maxFiles, onFilesChange])

  const simulateUpload = (fileId: string) => {
    const updateProgress = (progress: number) => {
      setUploadedFiles(prev => 
        prev.map(file => 
          file.id === fileId 
            ? { 
                ...file, 
                progress,
                status: progress === 100 ? 'success' : 'uploading'
              }
            : file
        )
      )
    }

    // Simulate progressive upload
    let progress = 10
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
      }
      updateProgress(Math.min(progress, 100))
    }, 200)
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(file => file.id !== fileId)
      // Update parent component
      onFilesChange(updated.map(f => f.file))
      return updated
    })
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const { files } = e.dataTransfer
    if (files && files.length > 0) {
      processFiles(files)
    }
  }, [processFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target
    if (files && files.length > 0) {
      processFiles(files)
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [processFiles])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          ${isDragOver 
            ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20' 
            : 'border-slate-300 dark:border-slate-600 hover:border-teal-300 dark:hover:border-teal-500'
          }
          ${uploadedFiles.length >= maxFiles ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          disabled={uploadedFiles.length >= maxFiles}
        />

        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-800 dark:to-teal-700 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-teal-600 dark:text-teal-300" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              {isDragOver ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz click para seleccionar'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Máximo {maxFiles} archivos, {maxSizeInMB}MB cada uno
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              Formatos: {acceptedTypes.join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-800 dark:text-slate-200">
            Archivos seleccionados ({uploadedFiles.length}/{maxFiles})
          </h4>
          
          {uploadedFiles.map((uploadedFile) => (
            <div
              key={uploadedFile.id}
              className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              {/* File Icon/Preview */}
              <div className="flex-shrink-0">
                {uploadedFile.preview ? (
                  <img
                    src={uploadedFile.preview}
                    alt="Preview"
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center">
                    <File className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {uploadedFile.file.name}
                  </p>
                  {uploadedFile.status === 'success' && (
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  )}
                  {uploadedFile.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatFileSize(uploadedFile.file.size)}
                </p>

                {/* Progress Bar */}
                {uploadedFile.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                      <div
                        className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadedFile.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Subiendo... {Math.round(uploadedFile.progress)}%
                    </p>
                  </div>
                )}
              </div>

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(uploadedFile.id)
                }}
                className="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}