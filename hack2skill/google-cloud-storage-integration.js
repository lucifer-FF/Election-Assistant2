// Google Cloud Storage Integration for File Uploads
// This module provides cloud storage functionality for election-related files

class GoogleCloudStorageIntegration {
    constructor() {
        this.apiKey = 'your-google-cloud-api-key-here'; // Replace with your actual API key
        this.bucketName = 'your-bucket-name-here'; // Replace with your actual bucket name
        this.baseUrl = 'https://storage.googleapis.com/upload/storage/v1';
        this.jsonBaseUrl = 'https://storage.googleapis.com/storage/v1';
        this.isInitialized = false;
        this.uploadProgress = new Map();
        this.supportedFileTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'text/csv'
        ];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
    }

    // Initialize Google Cloud Storage
    async init() {
        try {
            // Test API connection
            await this.testConnection();
            this.isInitialized = true;
            console.log('Google Cloud Storage initialized successfully');
            return { success: true };
        } catch (error) {
            console.error('Failed to initialize Google Cloud Storage:', error);
            return { success: false, error: error.message };
        }
    }

    // Test API connection
    async testConnection() {
        const response = await fetch(`${this.jsonBaseUrl}/b?key=${this.apiKey}`);
        if (!response.ok) {
            throw new Error(`Cloud Storage API test failed: ${response.status}`);
        }
    }

    // Upload file to cloud storage
    async uploadFile(file, folder = 'election-documents', metadata = {}) {
        try {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                return { success: false, error: validation.error };
            }

            const fileName = this.generateUniqueFileName(file.name, folder);
            const uploadUrl = `${this.baseUrl}/b/${this.bucketName}/o?uploadType=resumable&name=${encodeURIComponent(fileName)}`;

            // Create metadata
            const fileMetadata = {
                name: fileName,
                contentType: file.type,
                metadata: {
                    originalName: file.name,
                    uploadDate: new Date().toISOString(),
                    folder: folder,
                    fileSize: file.size,
                    ...metadata
                }
            };

            // Start resumable upload
            const initResponse = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${await this.getAccessToken()}`,
                    'Content-Type': 'application/json; charset=UTF-8',
                    'X-Upload-Content-Type': file.type,
                    'X-Upload-Content-Length': file.size.toString()
                },
                body: JSON.stringify(fileMetadata)
            });

            if (!initResponse.ok) {
                throw new Error(`Upload initialization failed: ${initResponse.status}`);
            }

            const uploadUrlWithToken = initResponse.headers.get('Location');
            
            // Upload file data
            const response = await fetch(uploadUrlWithToken, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type,
                    'Content-Length': file.size.toString()
                },
                body: file
            });

            if (!response.ok) {
                throw new Error(`File upload failed: ${response.status}`);
            }

            const result = await response.json();
            
            return {
                success: true,
                fileName: result.name,
                fileSize: result.size,
                contentType: result.contentType,
                bucket: result.bucket,
                generation: result.generation,
                mediaLink: result.mediaLink,
                metadata: result.metadata
            };
        } catch (error) {
            console.error('File upload error:', error);
            return { success: false, error: error.message };
        }
    }

    // Upload multiple files
    async uploadMultipleFiles(files, folder = 'election-documents', metadata = {}) {
        const results = [];
        
        for (const file of files) {
            const result = await this.uploadFile(file, folder, metadata);
            results.push({
                fileName: file.name,
                ...result
            });
        }

        return {
            success: true,
            results: results
        };
    }

    // Upload file with progress tracking
    async uploadFileWithProgress(file, folder = 'election-documents', progressCallback = null) {
        try {
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                return { success: false, error: validation.error };
            }

            const fileName = this.generateUniqueFileName(file.name, folder);
            const chunkSize = 1024 * 1024; // 1MB chunks
            let uploadedBytes = 0;
            let uploadUrl = null;

            // Initialize resumable upload
            const initUrl = `${this.baseUrl}/b/${this.bucketName}/o?uploadType=resumable&name=${encodeURIComponent(fileName)}`;
            
            const fileMetadata = {
                name: fileName,
                contentType: file.type,
                metadata: {
                    originalName: file.name,
                    uploadDate: new Date().toISOString(),
                    folder: folder,
                    fileSize: file.size
                }
            };

            const initResponse = await fetch(initUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${await this.getAccessToken()}`,
                    'Content-Type': 'application/json; charset=UTF-8',
                    'X-Upload-Content-Type': file.type,
                    'X-Upload-Content-Length': file.size.toString()
                },
                body: JSON.stringify(fileMetadata)
            });

            if (!initResponse.ok) {
                throw new Error(`Upload initialization failed: ${initResponse.status}`);
            }

            uploadUrl = initResponse.headers.get('Location');

            // Upload in chunks with progress tracking
            while (uploadedBytes < file.size) {
                const chunk = file.slice(uploadedBytes, uploadedBytes + chunkSize);
                const endByte = Math.min(uploadedBytes + chunkSize - 1, file.size - 1);
                
                const chunkResponse = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Length': (endByte - uploadedBytes + 1).toString(),
                        'Content-Range': `bytes ${uploadedBytes}-${endByte}/${file.size}`
                    },
                    body: chunk
                });

                if (!chunkResponse.ok && chunkResponse.status !== 308) {
                    throw new Error(`Chunk upload failed: ${chunkResponse.status}`);
                }

                uploadedBytes += chunk.size;
                
                // Report progress
                if (progressCallback) {
                    const progress = (uploadedBytes / file.size) * 100;
                    progressCallback({
                        loaded: uploadedBytes,
                        total: file.size,
                        progress: progress,
                        fileName: file.name
                    });
                }

                // Check if upload is complete
                if (chunkResponse.status === 200) {
                    const result = await chunkResponse.json();
                    return {
                        success: true,
                        fileName: result.name,
                        fileSize: result.size,
                        contentType: result.contentType,
                        bucket: result.bucket,
                        generation: result.generation,
                        mediaLink: result.mediaLink,
                        metadata: result.metadata
                    };
                }

                // Get next upload URL for resumable upload
                if (chunkResponse.status === 308) {
                    const range = chunkResponse.headers.get('Range');
                    if (range) {
                        uploadedBytes = parseInt(range.split('-')[1]) + 1;
                    }
                }
            }
        } catch (error) {
            console.error('File upload with progress error:', error);
            return { success: false, error: error.message };
        }
    }

    // Download file
    async downloadFile(fileName, saveAs = null) {
        try {
            const downloadUrl = `${this.jsonBaseUrl}/b/${this.bucketName}/o/${encodeURIComponent(fileName)}?alt=media`;
            
            const response = await fetch(downloadUrl, {
                headers: {
                    'Authorization': `Bearer ${await this.getAccessToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }

            const blob = await response.blob();
            const downloadFileName = saveAs || fileName;
            
            // Create download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = downloadFileName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            return {
                success: true,
                fileName: downloadFileName,
                fileSize: blob.size,
                contentType: blob.type
            };
        } catch (error) {
            console.error('File download error:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete file
    async deleteFile(fileName) {
        try {
            const deleteUrl = `${this.jsonBaseUrl}/b/${this.bucketName}/o/${encodeURIComponent(fileName)}`;
            
            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${await this.getAccessToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Delete failed: ${response.status}`);
            }

            return { success: true };
        } catch (error) {
            console.error('File delete error:', error);
            return { success: false, error: error.message };
        }
    }

    // List files in folder
    async listFiles(folder = '', prefix = null) {
        try {
            let url = `${this.jsonBaseUrl}/b/${this.bucketName}/o`;
            const params = new URLSearchParams();
            
            if (folder) {
                params.append('prefix', folder + '/');
            }
            
            if (prefix) {
                params.append('prefix', prefix);
            }
            
            url += '?' + params.toString();

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${await this.getAccessToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`List files failed: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                files: data.items ? data.items.map(item => ({
                    name: item.name,
                    size: item.size,
                    contentType: item.contentType,
                    updated: item.updated,
                    generation: item.generation,
                    mediaLink: item.mediaLink,
                    metadata: item.metadata,
                    crc32c: item.crc32c,
                    md5Hash: item.md5Hash
                })) : []
            };
        } catch (error) {
            console.error('List files error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get file metadata
    async getFileMetadata(fileName) {
        try {
            const url = `${this.jsonBaseUrl}/b/${this.bucketName}/o/${encodeURIComponent(fileName)}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${await this.getAccessToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Get metadata failed: ${response.status}`);
            }

            const metadata = await response.json();
            
            return {
                success: true,
                metadata: {
                    name: metadata.name,
                    size: metadata.size,
                    contentType: metadata.contentType,
                    updated: metadata.updated,
                    generation: metadata.generation,
                    metadata: metadata.metadata,
                    crc32c: metadata.crc32c,
                    md5Hash: metadata.md5Hash
                }
            };
        } catch (error) {
            console.error('Get metadata error:', error);
            return { success: false, error: error.message };
        }
    }

    // Generate signed URL for file access
    generateSignedUrl(fileName, expiresIn = 3600) {
        // Note: This requires server-side implementation for security
        // Client-side signed URLs are not recommended for production
        const url = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
        return url;
    }

    // Validate file
    validateFile(file) {
        if (!file) {
            return { isValid: false, error: 'No file provided' };
        }

        if (!this.supportedFileTypes.includes(file.type)) {
            return { isValid: false, error: 'File type not supported' };
        }

        if (file.size > this.maxFileSize) {
            return { isValid: false, error: 'File size exceeds maximum limit (50MB)' };
        }

        return { isValid: true };
    }

    // Generate unique file name
    generateUniqueFileName(originalName, folder) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = originalName.split('.').pop();
        const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
        
        return `${folder}/${baseName}_${timestamp}_${randomString}.${extension}`;
    }

    // Get access token (simplified - in production, use proper OAuth2 flow)
    async getAccessToken() {
        // This is a simplified implementation
        // In production, you should implement proper OAuth2 flow
        return this.apiKey;
    }

    // Create public URL for file
    createPublicUrl(fileName) {
        return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
    }

    // Upload election document with specific metadata
    async uploadElectionDocument(file, documentType, userId) {
        const metadata = {
            documentType: documentType,
            userId: userId,
            category: 'election-document',
            uploadedBy: 'web-app',
            version: '1.0'
        };

        return await this.uploadFile(file, 'election-documents', metadata);
    }

    // Upload candidate photo
    async uploadCandidatePhoto(file, candidateId) {
        // Validate that it's an image
        if (!file.type.startsWith('image/')) {
            return { success: false, error: 'Only image files are allowed for candidate photos' };
        }

        const metadata = {
            documentType: 'candidate-photo',
            candidateId: candidateId,
            category: 'candidate-media',
            uploadedBy: 'web-app'
        };

        return await this.uploadFile(file, 'candidate-photos', metadata);
    }

    // Upload polling station image
    async uploadPollingStationImage(file, stationId) {
        if (!file.type.startsWith('image/')) {
            return { success: false, error: 'Only image files are allowed for polling station images' };
        }

        const metadata = {
            documentType: 'polling-station-image',
            stationId: stationId,
            category: 'polling-station-media',
            uploadedBy: 'web-app'
        };

        return await this.uploadFile(file, 'polling-station-images', metadata);
    }

    // Get files by type
    async getFilesByType(documentType, userId = null) {
        try {
            const allFiles = await this.listFiles();
            
            if (!allFiles.success) {
                return allFiles;
            }

            let filteredFiles = allFiles.files.filter(file => 
                file.metadata && file.metadata.documentType === documentType
            );

            if (userId) {
                filteredFiles = filteredFiles.filter(file => 
                    file.metadata && file.metadata.userId === userId
                );
            }

            return {
                success: true,
                files: filteredFiles
            };
        } catch (error) {
            console.error('Get files by type error:', error);
            return { success: false, error: error.message };
        }
    }

    // Create Cloud Storage integration UI
    createStorageUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="storage-integration">
                <h3>Cloud Storage</h3>
                <div class="upload-section">
                    <h4>Upload Files</h4>
                    <div class="document-types">
                        <label>
                            <input type="radio" name="storage-upload-type" value="election-doc" checked>
                            Election Document
                        </label>
                        <label>
                            <input type="radio" name="storage-upload-type" value="candidate-photo">
                            Candidate Photo
                        </label>
                        <label>
                            <input type="radio" name="storage-upload-type" value="polling-station">
                            Polling Station Image
                        </label>
                        <label>
                            <input type="radio" name="storage-upload-type" value="general">
                            General File
                        </label>
                    </div>
                    <input type="file" id="storage-file-upload" multiple accept="image/*,.pdf,.doc,.docx,.txt,.csv">
                    <button id="upload-to-cloud" class="btn btn-primary">
                        ☁️ Upload to Cloud
                    </button>
                    <div id="upload-progress" class="upload-progress" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <div class="progress-text">0%</div>
                    </div>
                </div>
                <div class="files-section">
                    <h4>Uploaded Files</h4>
                    <div id="storage-files-list"></div>
                </div>
                <div id="storage-status" class="status-message"></div>
            </div>
        `;

        // Add event listeners
        document.getElementById('upload-to-cloud').addEventListener('click', () => {
            this.uploadFilesFromUI();
        });

        // Load initial files list
        this.loadFilesList();
    }

    // Upload files from UI
    async uploadFilesFromUI() {
        const fileInput = document.getElementById('storage-file-upload');
        const files = fileInput.files;
        
        if (files.length === 0) {
            alert('Please select files to upload');
            return;
        }

        const uploadType = document.querySelector('input[name="storage-upload-type"]:checked').value;
        const statusDiv = document.getElementById('storage-status');
        const progressDiv = document.getElementById('upload-progress');
        
        statusDiv.textContent = 'Uploading files...';
        statusDiv.className = 'status-message info';
        progressDiv.style.display = 'block';

        try {
            const results = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                // Update progress
                const progressCallback = (progress) => {
                    const overallProgress = ((i + progress.progress / 100) / files.length) * 100;
                    this.updateProgressUI(overallProgress, file.name);
                };
                
                let result;
                switch (uploadType) {
                    case 'candidate-photo':
                        result = await this.uploadCandidatePhoto(file, 'candidate_' + Date.now());
                        break;
                    case 'polling-station':
                        result = await this.uploadPollingStationImage(file, 'station_' + Date.now());
                        break;
                    case 'election-doc':
                        result = await this.uploadElectionDocument(file, 'general', 'user_' + Date.now());
                        break;
                    default:
                        result = await this.uploadFile(file, 'general');
                }
                
                results.push({
                    fileName: file.name,
                    ...result
                });
            }

            const successCount = results.filter(r => r.success).length;
            
            if (successCount > 0) {
                statusDiv.textContent = `Successfully uploaded ${successCount} of ${files.length} files!`;
                statusDiv.className = 'status-message success';
                
                // Refresh files list
                this.loadFilesList();
            } else {
                statusDiv.textContent = 'Failed to upload files. Please try again.';
                statusDiv.className = 'status-message error';
            }
            
            // Hide progress
            setTimeout(() => {
                progressDiv.style.display = 'none';
            }, 1000);
            
            // Clear file input
            fileInput.value = '';
            
        } catch (error) {
            statusDiv.textContent = 'Error: ' + error.message;
            statusDiv.className = 'status-message error';
            progressDiv.style.display = 'none';
        }
    }

    // Update progress UI
    updateProgressUI(progress, fileName) {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}% - ${fileName}`;
        }
    }

    // Load files list
    async loadFilesList() {
        try {
            const result = await this.listFiles();
            
            if (result.success) {
                const container = document.getElementById('storage-files-list');
                
                if (result.files.length === 0) {
                    container.innerHTML = '<p>No files found.</p>';
                    return;
                }

                container.innerHTML = result.files.map(file => `
                    <div class="storage-file-item">
                        <div class="file-info">
                            <strong>${file.metadata?.originalName || file.name}</strong>
                            <br>
                            <small>
                                Type: ${file.metadata?.documentType || 'General'} | 
                                Size: ${this.formatFileSize(file.size)} | 
                                Uploaded: ${new Date(file.updated).toLocaleDateString()}
                            </small>
                        </div>
                        <div class="file-actions">
                            <button onclick="googleCloudStorage.downloadFile('${file.name}')" class="btn btn-small">
                                📥 Download
                            </button>
                            <button onclick="googleCloudStorage.deleteFile('${file.name}')" class="btn btn-small btn-danger">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading files list:', error);
        }
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Get service status
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            bucketName: this.bucketName,
            supportedFileTypes: this.supportedFileTypes,
            maxFileSize: this.maxFileSize
        };
    }
}

// Create global instance
const googleCloudStorage = new GoogleCloudStorageIntegration();

// Export for use in other modules
export default googleCloudStorage;
