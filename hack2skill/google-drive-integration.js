// Google Drive API Integration for Document Storage
// This module provides file storage and management capabilities

class GoogleDriveIntegration {
    constructor() {
        this.apiKey = 'your-google-drive-api-key-here'; // Replace with your actual API key
        this.clientId = 'your-client-id-here'; // Replace with your actual client ID
        this.discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
        this.scopes = 'https://www.googleapis.com/auth/drive.file';
        this.isLoaded = false;
        this.isSignedIn = false;
        this.driveService = null;
        this.electionFolderId = null;
    }

    // Initialize Google Drive API
    async init() {
        try {
            await this.loadGapiScript();
            await this.loadGisScript();
            await this.initializeGapi();
            
            this.isLoaded = true;
            console.log('Google Drive API initialized successfully');
            return { success: true };
        } catch (error) {
            console.error('Failed to initialize Google Drive API:', error);
            return { success: false, error: error.message };
        }
    }

    // Load Google API script
    loadGapiScript() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load GAPI script'));
            document.head.appendChild(script);
        });
    }

    // Load Google Identity Services script
    loadGisScript() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.accounts) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load GIS script'));
            document.head.appendChild(script);
        });
    }

    // Initialize GAPI client
    async initializeGapi() {
        return new Promise((resolve, reject) => {
            window.gapi.load('client:auth2', async () => {
                try {
                    await window.gapi.client.init({
                        apiKey: this.apiKey,
                        clientId: this.clientId,
                        discoveryDocs: this.discoveryDocs,
                        scope: this.scopes
                    });
                    
                    this.driveService = window.gapi.client.drive;
                    
                    // Listen for sign-in state changes
                    window.gapi.auth2.getAuthInstance().isSignedIn.listen((isSignedIn) => {
                        this.isSignedIn = isSignedIn;
                        this.onAuthStateChange(isSignedIn);
                    });
                    
                    // Check initial sign-in state
                    this.isSignedIn = window.gapi.auth2.getAuthInstance().isSignedIn.get();
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    // Sign in to Google
    async signIn() {
        try {
            const googleAuth = window.gapi.auth2.getAuthInstance();
            await googleAuth.signIn();
            return { success: true };
        } catch (error) {
            console.error('Google sign-in error:', error);
            return { success: false, error: error.message };
        }
    }

    // Sign out from Google
    async signOut() {
        try {
            const googleAuth = window.gapi.auth2.getAuthInstance();
            await googleAuth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Google sign-out error:', error);
            return { success: false, error: error.message };
        }
    }

    // Create election documents folder
    async createElectionFolder() {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            const response = await this.driveService.files.create({
                resource: {
                    name: 'Election Documents',
                    mimeType: 'application/vnd.google-apps.folder',
                    folderColorRgb: {
                        red: 0.2,
                        green: 0.6,
                        blue: 0.8
                    }
                }
            });

            this.electionFolderId = response.result.id;
            
            return {
                success: true,
                folderId: response.result.id,
                folderLink: `https://drive.google.com/drive/folders/${response.result.id}`
            };
        } catch (error) {
            console.error('Error creating election folder:', error);
            return { success: false, error: error.message };
        }
    }

    // Upload voter document
    async uploadVoterDocument(file, documentType, userId) {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        // Ensure election folder exists
        if (!this.electionFolderId) {
            const folderResult = await this.createElectionFolder();
            if (!folderResult.success) {
                return folderResult;
            }
        }

        try {
            const metadata = {
                name: `${documentType}_${userId}_${Date.now()}.${file.name.split('.').pop()}`,
                parents: [this.electionFolderId],
                properties: {
                    documentType: documentType,
                    userId: userId,
                    uploadDate: new Date().toISOString(),
                    originalName: file.name
                }
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
                },
                body: form
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }

            const result = await response.json();

            return {
                success: true,
                fileId: result.id,
                fileName: result.name,
                fileLink: `https://drive.google.com/file/d/${result.id}/view`,
                documentType: documentType
            };
        } catch (error) {
            console.error('Error uploading document:', error);
            return { success: false, error: error.message };
        }
    }

    // Upload multiple documents
    async uploadMultipleDocuments(files, documentType, userId) {
        const results = [];
        
        for (const file of files) {
            const result = await this.uploadVoterDocument(file, documentType, userId);
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

    // List user documents
    async listUserDocuments(userId, documentType = null) {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            let query = `properties has { key='userId' and value='${userId}'}`;
            if (documentType) {
                query += ` and properties has { key='documentType' and value='${documentType}'}`;
            }

            const response = await this.driveService.files.list({
                q: query,
                fields: 'files(id, name, properties, createdTime, modifiedTime, size, mimeType, webViewLink)',
                orderBy: 'createdTime desc'
            });

            return {
                success: true,
                documents: response.result.files.map(file => ({
                    id: file.id,
                    name: file.name,
                    documentType: file.properties?.documentType,
                    userId: file.properties?.userId,
                    uploadDate: file.properties?.uploadDate,
                    originalName: file.properties?.originalName,
                    createdTime: file.createdTime,
                    modifiedTime: file.modifiedTime,
                    size: file.size,
                    mimeType: file.mimeType,
                    fileLink: file.webViewLink
                }))
            };
        } catch (error) {
            console.error('Error listing documents:', error);
            return { success: false, error: error.message };
        }
    }

    // Download document
    async downloadDocument(fileId) {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            const response = await this.driveService.files.get({
                fileId: fileId,
                fields: 'webContentLink, name'
            });

            const downloadUrl = response.result.webContentLink;
            const fileName = response.result.name;

            // Create download link
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            return {
                success: true,
                fileName: fileName,
                downloadUrl: downloadUrl
            };
        } catch (error) {
            console.error('Error downloading document:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete document
    async deleteDocument(fileId) {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            await this.driveService.files.delete({
                fileId: fileId
            });

            return { success: true };
        } catch (error) {
            console.error('Error deleting document:', error);
            return { success: false, error: error.message };
        }
    }

    // Share document
    async shareDocument(fileId, email, role = 'reader') {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            await this.driveService.permissions.create({
                fileId: fileId,
                resource: {
                    type: 'user',
                    role: role,
                    emailAddress: email
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Error sharing document:', error);
            return { success: false, error: error.message };
        }
    }

    // Create document from text
    async createDocument(title, content, documentType = 'general') {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        // Ensure election folder exists
        if (!this.electionFolderId) {
            const folderResult = await this.createElectionFolder();
            if (!folderResult.success) {
                return folderResult;
            }
        }

        try {
            const metadata = {
                name: title,
                mimeType: 'application/vnd.google-apps.document',
                parents: [this.electionFolderId],
                properties: {
                    documentType: documentType,
                    createdDate: new Date().toISOString()
                }
            };

            const response = await this.driveService.files.create({
                resource: metadata
            });

            // Update document with content
            await this.updateDocumentContent(response.result.id, content);

            return {
                success: true,
                documentId: response.result.id,
                documentLink: `https://docs.google.com/document/d/${response.result.id}/edit`
            };
        } catch (error) {
            console.error('Error creating document:', error);
            return { success: false, error: error.message };
        }
    }

    // Update document content
    async updateDocumentContent(documentId, content) {
        try {
            // This would require Google Docs API integration
            // For now, we'll just create a text file
            const response = await this.driveService.files.update({
                fileId: documentId,
                resource: {
                    name: `Updated_${Date.now()}.txt`
                },
                media: {
                    mimeType: 'text/plain',
                    body: content
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Error updating document:', error);
            return { success: false, error: error.message };
        }
    }

    // Search documents
    async searchDocuments(query, userId = null) {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            let searchQuery = `name contains '${query}'`;
            if (userId) {
                searchQuery += ` and properties has { key='userId' and value='${userId}'}`;
            }

            const response = await this.driveService.files.list({
                q: searchQuery,
                fields: 'files(id, name, properties, createdTime, modifiedTime, size, mimeType, webViewLink)',
                orderBy: 'createdTime desc'
            });

            return {
                success: true,
                documents: response.result.files.map(file => ({
                    id: file.id,
                    name: file.name,
                    documentType: file.properties?.documentType,
                    createdTime: file.createdTime,
                    modifiedTime: file.modifiedTime,
                    size: file.size,
                    mimeType: file.mimeType,
                    fileLink: file.webViewLink
                }))
            };
        } catch (error) {
            console.error('Error searching documents:', error);
            return { success: false, error: error.message };
        }
    }

    // Get document info
    async getDocumentInfo(fileId) {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            const response = await this.driveService.files.get({
                fileId: fileId,
                fields: 'id, name, properties, createdTime, modifiedTime, size, mimeType, webViewLink, owners, permissions'
            });

            return {
                success: true,
                document: {
                    id: response.result.id,
                    name: response.result.name,
                    documentType: response.result.properties?.documentType,
                    createdTime: response.result.createdTime,
                    modifiedTime: response.result.modifiedTime,
                    size: response.result.size,
                    mimeType: response.result.mimeType,
                    fileLink: response.result.webViewLink,
                    owners: response.result.owners,
                    permissions: response.result.permissions
                }
            };
        } catch (error) {
            console.error('Error getting document info:', error);
            return { success: false, error: error.message };
        }
    }

    // Auth state change handler
    onAuthStateChange(isSignedIn) {
        console.log('Google Drive auth state changed:', isSignedIn);
        
        // Update UI based on auth state
        const signInButton = document.getElementById('drive-sign-in');
        const signOutButton = document.getElementById('drive-sign-out');
        const driveActions = document.getElementById('drive-actions');
        
        if (signInButton) {
            signInButton.style.display = isSignedIn ? 'none' : 'block';
        }
        
        if (signOutButton) {
            signOutButton.style.display = isSignedIn ? 'block' : 'none';
        }
        
        if (driveActions) {
            driveActions.style.display = isSignedIn ? 'block' : 'none';
        }
    }

    // Create Drive integration UI
    createDriveUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="drive-integration">
                <h3>Google Drive Document Storage</h3>
                <div id="drive-auth-section">
                    <button id="drive-sign-in" class="btn btn-primary">
                        📁 Connect Google Drive
                    </button>
                    <button id="drive-sign-out" class="btn btn-secondary" style="display: none;">
                        🚪 Disconnect
                    </button>
                </div>
                <div id="drive-actions" style="display: none;">
                    <div class="upload-section">
                        <h4>Upload Election Documents</h4>
                        <div class="document-types">
                            <label>
                                <input type="radio" name="document-type" value="voter-id" checked>
                                Voter ID Card
                            </label>
                            <label>
                                <input type="radio" name="document-type" value="address-proof">
                                Address Proof
                            </label>
                            <label>
                                <input type="radio" name="document-type" value="age-proof">
                                Age Proof
                            </label>
                            <label>
                                <input type="radio" name="document-type" value="other">
                                Other Document
                            </label>
                        </div>
                        <input type="file" id="document-upload" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx">
                        <button id="upload-documents" class="btn btn-primary">
                            📤 Upload Documents
                        </button>
                    </div>
                    <div class="documents-list">
                        <h4>Your Documents</h4>
                        <div id="documents-container"></div>
                    </div>
                    <div id="drive-status" class="status-message"></div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('drive-sign-in').addEventListener('click', () => {
            this.signIn();
        });

        document.getElementById('drive-sign-out').addEventListener('click', () => {
            this.signOut();
        });

        document.getElementById('upload-documents').addEventListener('click', () => {
            this.uploadDocumentsFromUI();
        });

        // Update UI based on current auth state
        this.onAuthStateChange(this.isSignedIn);
    }

    // Upload documents from UI
    async uploadDocumentsFromUI() {
        const fileInput = document.getElementById('document-upload');
        const files = fileInput.files;
        
        if (files.length === 0) {
            alert('Please select files to upload');
            return;
        }

        const documentType = document.querySelector('input[name="document-type"]:checked').value;
        const statusDiv = document.getElementById('drive-status');
        
        statusDiv.textContent = 'Uploading documents...';
        statusDiv.className = 'status-message info';

        try {
            // Get current user ID (this would come from your auth system)
            const userId = 'current_user_id'; // Replace with actual user ID
            
            const result = await this.uploadMultipleDocuments(files, documentType, userId);

            if (result.success) {
                const successCount = result.results.filter(r => r.success).length;
                statusDiv.textContent = `Successfully uploaded ${successCount} of ${result.results.length} documents!`;
                statusDiv.className = 'status-message success';
                
                // Refresh documents list
                this.loadDocumentsList(userId);
                
                // Clear file input
                fileInput.value = '';
            } else {
                statusDiv.textContent = 'Failed to upload documents. Please try again.';
                statusDiv.className = 'status-message error';
            }
        } catch (error) {
            statusDiv.textContent = 'Error: ' + error.message;
            statusDiv.className = 'status-message error';
        }
    }

    // Load documents list
    async loadDocumentsList(userId) {
        try {
            const result = await this.listUserDocuments(userId);
            
            if (result.success) {
                const container = document.getElementById('documents-container');
                
                if (result.documents.length === 0) {
                    container.innerHTML = '<p>No documents found.</p>';
                    return;
                }

                container.innerHTML = result.documents.map(doc => `
                    <div class="document-item">
                        <div class="document-info">
                            <strong>${doc.originalName || doc.name}</strong>
                            <br>
                            <small>Type: ${doc.documentType} | Uploaded: ${new Date(doc.createdTime).toLocaleDateString()}</small>
                        </div>
                        <div class="document-actions">
                            <button onclick="googleDrive.downloadDocument('${doc.id}')" class="btn btn-small">
                                📥 Download
                            </button>
                            <button onclick="googleDrive.deleteDocument('${doc.id}')" class="btn btn-small btn-danger">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    }

    // Get service status
    getStatus() {
        return {
            isLoaded: this.isLoaded,
            isSignedIn: this.isSignedIn,
            hasDriveService: !!this.driveService,
            electionFolderId: this.electionFolderId
        };
    }
}

// Create global instance
const googleDrive = new GoogleDriveIntegration();

// Export for use in other modules
export default googleDrive;
