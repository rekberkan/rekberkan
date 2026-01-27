import { registerAs } from '@nestjs/config';

// ============================================================================
// FILE UPLOAD CONFIGURATION
// ============================================================================
// Configures file upload limits and validation per file type
// Fix #50: Separate max size per file type
// ============================================================================

export interface FileTypeConfig {
  maxSize: number; // in bytes
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

export default registerAs('upload', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    // Default destination (should be S3/GCS in production)
    destination: process.env.UPLOAD_DEST || './uploads',
    
    // Use cloud storage in production
    useCloudStorage: isProduction || process.env.USE_CLOUD_STORAGE === 'true',
    
    // S3 configuration
    s3: {
      bucket: process.env.S3_BUCKET || '',
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    
    // Fix #50: Separate max size per file type
    fileTypes: {
      // Profile pictures - smaller limit
      avatar: {
        maxSize: 1 * 1024 * 1024, // 1 MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
      } as FileTypeConfig,
      
      // KYC documents - moderate limit
      kycDocument: {
        maxSize: 5 * 1024 * 1024, // 5 MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
      } as FileTypeConfig,
      
      // Delivery proof - moderate limit
      deliveryProof: {
        maxSize: 5 * 1024 * 1024, // 5 MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
      } as FileTypeConfig,
      
      // Dispute evidence - larger limit
      disputeEvidence: {
        maxSize: 10 * 1024 * 1024, // 10 MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'video/mp4',
          'video/webm',
        ],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.mp4', '.webm'],
      } as FileTypeConfig,
      
      // General documents
      document: {
        maxSize: 10 * 1024 * 1024, // 10 MB
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        allowedExtensions: ['.pdf', '.doc', '.docx'],
      } as FileTypeConfig,
    },
    
    // Global limits
    global: {
      // Maximum total upload size per request
      maxTotalSize: parseInt(process.env.MAX_TOTAL_UPLOAD_SIZE || '52428800', 10), // 50 MB
      
      // Maximum number of files per request
      maxFiles: parseInt(process.env.MAX_FILES_PER_REQUEST || '10', 10),
      
      // Rate limiting for uploads
      rateLimit: {
        windowMs: 60 * 1000, // 1 minute
        maxUploads: parseInt(process.env.MAX_UPLOADS_PER_MINUTE || '10', 10),
      },
    },
    
    // Security settings
    security: {
      // Scan files for viruses (requires ClamAV or VirusTotal integration)
      enableVirusScan: process.env.ENABLE_VIRUS_SCAN === 'true',
      virusScanProvider: process.env.VIRUS_SCAN_PROVIDER || 'clamav', // 'clamav' or 'virustotal'
      
      // ClamAV configuration
      clamav: {
        host: process.env.CLAMAV_HOST || 'localhost',
        port: parseInt(process.env.CLAMAV_PORT || '3310', 10),
      },
      
      // VirusTotal configuration
      virustotal: {
        apiKey: process.env.VIRUSTOTAL_API_KEY || '',
      },
      
      // Sanitize filenames
      sanitizeFilenames: true,
      
      // Generate random filenames
      randomizeFilenames: true,
      
      // Check file magic bytes (not just extension)
      validateMagicBytes: true,
    },
    
    // Cleanup settings
    cleanup: {
      // Delete temporary files after processing
      deleteTemporaryFiles: true,
      
      // Temporary file TTL in seconds
      temporaryFileTtl: 3600, // 1 hour
      
      // Run cleanup job interval
      cleanupInterval: 300, // 5 minutes
    },
  };
});

// ============================================================================
// FILE VALIDATION HELPER
// ============================================================================

export function validateFile(
  file: { mimetype: string; size: number; originalname: string },
  fileType: keyof ReturnType<typeof import('./upload.config').default>['fileTypes'],
  config: ReturnType<typeof import('./upload.config').default>,
): { valid: boolean; error?: string } {
  const typeConfig = config.fileTypes[fileType];
  
  if (!typeConfig) {
    return { valid: false, error: `Unknown file type: ${fileType}` };
  }
  
  // Check file size
  if (file.size > typeConfig.maxSize) {
    const maxSizeMB = (typeConfig.maxSize / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size exceeds maximum of ${maxSizeMB} MB` };
  }
  
  // Check MIME type
  if (!typeConfig.allowedMimeTypes.includes(file.mimetype)) {
    return { valid: false, error: `File type ${file.mimetype} is not allowed` };
  }
  
  // Check extension
  const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
  if (!typeConfig.allowedExtensions.includes(ext)) {
    return { valid: false, error: `File extension ${ext} is not allowed` };
  }
  
  return { valid: true };
}
