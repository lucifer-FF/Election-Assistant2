// Google Vision API Integration for OCR of Voter Documents
// This module provides document scanning and text extraction capabilities

class GoogleVisionIntegration {
    constructor() {
        this.apiKey = 'your-google-vision-api-key-here'; // Replace with your actual API key
        this.baseUrl = 'https://vision.googleapis.com/v1';
        this.isInitialized = false;
        this.supportedFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    }

    // Initialize Google Vision API
    async init() {
        try {
            // Test API connection
            await this.testConnection();
            this.isInitialized = true;
            console.log('Google Vision API initialized successfully');
            return { success: true };
        } catch (error) {
            console.error('Failed to initialize Google Vision API:', error);
            return { success: false, error: error.message };
        }
    }

    // Test API connection
    async testConnection() {
        const response = await fetch(`${this.baseUrl}/images:annotate?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requests: [{
                    image: {
                        source: {
                            imageUri: 'https://via.placeholder.com/100x100'
                        }
                    },
                    features: [{
                        type: 'LABEL_DETECTION',
                        maxResults: 1
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Vision API test failed: ${response.status}`);
        }
    }

    // Extract text from image (OCR)
    async extractText(imageFile, languageHints = ['en']) {
        try {
            const base64Image = await this.fileToBase64(imageFile);
            
            const requestBody = {
                requests: [{
                    image: {
                        content: base64Image
                    },
                    features: [{
                        type: 'TEXT_DETECTION',
                        maxResults: 10
                    }],
                    imageContext: {
                        languageHints: languageHints
                    }
                }]
            };

            const response = await fetch(`${this.baseUrl}/images:annotate?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Vision API error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.responses && data.responses[0] && data.responses[0].textAnnotations) {
                const fullText = data.responses[0].fullTextAnnotation || {};
                const textAnnotations = data.responses[0].textAnnotations || [];
                
                return {
                    success: true,
                    fullText: fullText.text || '',
                    textAnnotations: textAnnotations.map(annotation => ({
                        text: annotation.description,
                        boundingBox: annotation.boundingPoly?.vertices || [],
                        confidence: annotation.confidence || 0,
                        locale: annotation.locale || ''
                    })),
                    pages: fullText.pages || []
                };
            } else {
                return {
                    success: true,
                    fullText: '',
                    textAnnotations: [],
                    pages: [],
                    message: 'No text found in image'
                };
            }
        } catch (error) {
            console.error('Text extraction error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Detect document type
    async detectDocumentType(imageFile) {
        try {
            const base64Image = await this.fileToBase64(imageFile);
            
            const requestBody = {
                requests: [{
                    image: {
                        content: base64Image
                    },
                    features: [
                        {
                            type: 'LABEL_DETECTION',
                            maxResults: 10
                        },
                        {
                            type: 'WEB_DETECTION',
                            maxResults: 5
                        },
                        {
                            type: 'SAFE_SEARCH_DETECTION',
                            maxResults: 1
                        }
                    ]
                }]
            };

            const response = await fetch(`${this.baseUrl}/images:annotate?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Vision API error: ${response.status}`);
            }

            const data = await response.json();
            const responseData = data.responses[0] || {};
            
            const labels = responseData.labelAnnotations || [];
            const webDetection = responseData.webDetection || {};
            const safeSearch = responseData.safeSearchAnnotation || {};

            // Analyze labels to determine document type
            const documentType = this.analyzeDocumentType(labels, webDetection);
            
            return {
                success: true,
                documentType: documentType,
                labels: labels.map(label => ({
                    description: label.description,
                    confidence: label.score,
                    topicality: label.topicality
                })),
                webEntities: webDetection.webEntities || [],
                safeSearch: {
                    adult: safeSearch.adult || 'UNKNOWN',
                    spoof: safeSearch.spoof || 'UNKNOWN',
                    medical: safeSearch.medical || 'UNKNOWN',
                    violence: safeSearch.violence || 'UNKNOWN',
                    racy: safeSearch.racy || 'UNKNOWN'
                }
            };
        } catch (error) {
            console.error('Document type detection error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Analyze document type based on labels
    analyzeDocumentType(labels, webDetection) {
        const labelDescriptions = labels.map(label => label.description.toLowerCase());
        
        // Check for ID card indicators
        const idCardKeywords = ['id', 'identification', 'card', 'license', 'passport', 'document', 'photo'];
        const hasIdCardKeywords = idCardKeywords.some(keyword => 
            labelDescriptions.some(desc => desc.includes(keyword))
        );

        // Check for address proof indicators
        const addressKeywords = ['address', 'utility', 'bill', 'statement', 'bank', 'rent'];
        const hasAddressKeywords = addressKeywords.some(keyword => 
            labelDescriptions.some(desc => desc.includes(keyword))
        );

        // Check for age proof indicators
        const ageKeywords = ['birth', 'certificate', 'age', 'dob', 'date'];
        const hasAgeKeywords = ageKeywords.some(keyword => 
            labelDescriptions.some(desc => desc.includes(keyword))
        );

        // Determine document type
        if (hasIdCardKeywords && labelDescriptions.some(desc => desc.includes('voter'))) {
            return 'voter_id';
        } else if (hasIdCardKeywords) {
            return 'identity_card';
        } else if (hasAddressKeywords) {
            return 'address_proof';
        } else if (hasAgeKeywords) {
            return 'age_proof';
        } else if (labelDescriptions.some(desc => desc.includes('text') || desc.includes('document'))) {
            return 'document';
        } else {
            return 'unknown';
        }
    }

    // Extract voter ID information
    async extractVoterIdInfo(imageFile) {
        try {
            const textResult = await this.extractText(imageFile, ['en', 'hi', 'bn']);
            
            if (!textResult.success) {
                return textResult;
            }

            const fullText = textResult.fullText;
            const voterInfo = this.parseVoterIdText(fullText);
            
            return {
                success: true,
                voterInfo: voterInfo,
                extractedText: fullText,
                confidence: this.calculateExtractionConfidence(voterInfo, fullText)
            };
        } catch (error) {
            console.error('Voter ID extraction error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Parse voter ID text
    parseVoterIdText(text) {
        const voterInfo = {
            voterId: null,
            name: null,
            fatherName: null,
            age: null,
            gender: null,
            address: null,
            constituency: null,
            partNumber: null,
            serialNumber: null
        };

        // Common patterns for Indian Voter ID
        const patterns = {
            voterId: /(?:voter\s*id|elector\s*id|id\s*no)[:\s]*([A-Z]{3}\d{7})/i,
            name: /(?:name|जन्म|নাম)[:\s]*([A-Za-z\s]+)/i,
            fatherName: /(?:father|पिता|পিতা)[:\s]*([A-Za-z\s]+)/i,
            age: /(?:age|आयु|বয়স)[:\s]*(\d{2})/i,
            gender: /(?:gender|लिंग|লিঙ্গ)[:\s]*(male|female|M|F|पुरुष|महिलা|পুরুষ|মহিলা)/i,
            address: /(?:address|पता|ঠিকানা)[:\s]*([^\n]+)/i,
            constituency: /(?:constituency|निर्वाचन क्षेत्र|নির্বাচনী এলাকা)[:\s]*([^\n]+)/i,
            partNumber: /(?:part\s*no|भाग\s*संख्यা|অংশ\s*নম্বর)[:\s]*(\d+)/i,
            serialNumber: /(?:serial\s*no|क्रम\s*संख्यা|ক্রমিক\s*নম্বর)[:\s]*(\d+)/i
        };

        // Extract information using patterns
        for (const [field, pattern] of Object.entries(patterns)) {
            const match = text.match(pattern);
            if (match) {
                voterInfo[field] = match[1].trim();
            }
        }

        // Additional parsing for common formats
        if (!voterInfo.voterId) {
            // Try to find 10-character alphanumeric patterns
            const idPattern = /([A-Z]{3}\d{7})/;
            const idMatch = text.match(idPattern);
            if (idMatch) {
                voterInfo.voterId = idMatch[1];
            }
        }

        if (!voterInfo.age) {
            // Try to find 2-digit numbers that could be age
            const agePattern = /(?:age|आयु|বয়স|जन्म\s*तिथि|জন্ম\s*তারিখ)[:\s]*(\d{2})/i;
            const ageMatch = text.match(agePattern);
            if (ageMatch) {
                voterInfo.age = ageMatch[1];
            }
        }

        return voterInfo;
    }

    // Calculate extraction confidence
    calculateExtractionConfidence(voterInfo, fullText) {
        const filledFields = Object.values(voterInfo).filter(value => value !== null).length;
        const totalFields = Object.keys(voterInfo).length;
        const baseConfidence = filledFields / totalFields;
        
        // Boost confidence if voter ID pattern is found
        if (voterInfo.voterId && /^[A-Z]{3}\d{7}$/.test(voterInfo.voterId)) {
            return Math.min(1, baseConfidence + 0.3);
        }
        
        return baseConfidence;
    }

    // Validate extracted information
    validateExtractedInfo(voterInfo) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Validate voter ID format
        if (voterInfo.voterId) {
            if (!/^[A-Z]{3}\d{7}$/.test(voterInfo.voterId)) {
                validation.errors.push('Invalid Voter ID format');
                validation.isValid = false;
            }
        } else {
            validation.warnings.push('Voter ID not found');
        }

        // Validate age
        if (voterInfo.age) {
            const age = parseInt(voterInfo.age);
            if (age < 18 || age > 120) {
                validation.errors.push('Invalid age');
                validation.isValid = false;
            }
        } else {
            validation.warnings.push('Age not found');
        }

        // Validate name
        if (!voterInfo.name) {
            validation.warnings.push('Name not found');
        }

        return validation;
    }

    // Extract text from multiple images
    async extractTextFromMultipleImages(imageFiles, languageHints = ['en']) {
        const results = [];
        
        for (const file of imageFiles) {
            const result = await this.extractText(file, languageHints);
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

    // Detect faces in document
    async detectFaces(imageFile) {
        try {
            const base64Image = await this.fileToBase64(imageFile);
            
            const requestBody = {
                requests: [{
                    image: {
                        content: base64Image
                    },
                    features: [{
                        type: 'FACE_DETECTION',
                        maxResults: 5
                    }]
                }]
            };

            const response = await fetch(`${this.baseUrl}/images:annotate?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Vision API error: ${response.status}`);
            }

            const data = await response.json();
            const faces = data.responses[0]?.faceAnnotations || [];
            
            return {
                success: true,
                faces: faces.map(face => ({
                    confidence: face.detectionConfidence || 0,
                    boundingBox: face.boundingPoly?.vertices || [],
                    landmarks: face.landmarks || [],
                    rollAngle: face.rollAngle || 0,
                    panAngle: face.panAngle || 0,
                    tiltAngle: face.tiltAngle || 0,
                    joyLikelihood: face.joyLikelihood || 'UNKNOWN',
                    sorrowLikelihood: face.sorrowLikelihood || 'UNKNOWN',
                    angerLikelihood: face.angerLikelihood || 'UNKNOWN',
                    surpriseLikelihood: face.surpriseLikelihood || 'UNKNOWN'
                }))
            };
        } catch (error) {
            console.error('Face detection error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Validate image format
    validateImageFormat(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        return this.supportedFormats.includes(extension);
    }

    // Create Vision integration UI
    createVisionUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="vision-integration">
                <h3>Document Scanner (OCR)</h3>
                <div class="upload-section">
                    <p>Upload your election documents for automatic text extraction:</p>
                    <div class="document-types">
                        <label>
                            <input type="radio" name="scan-type" value="voter-id" checked>
                            Voter ID Card
                        </label>
                        <label>
                            <input type="radio" name="scan-type" value="address-proof">
                            Address Proof
                        </label>
                        <label>
                            <input type="radio" name="scan-type" value="age-proof">
                            Age Proof
                        </label>
                        <label>
                            <input type="radio" name="scan-type" value="general">
                            General Document
                        </label>
                    </div>
                    <input type="file" id="document-scan" accept="image/*" multiple>
                    <button id="scan-document" class="btn btn-primary">
                        📷 Scan Document
                    </button>
                </div>
                <div id="scan-results" class="scan-results" style="display: none;">
                    <h4>Scan Results</h4>
                    <div id="extracted-info"></div>
                    <div id="scan-confidence"></div>
                    <div id="scan-validation"></div>
                </div>
                <div id="scan-status" class="status-message"></div>
            </div>
        `;

        // Add event listeners
        document.getElementById('scan-document').addEventListener('click', () => {
            this.scanDocumentFromUI();
        });

        document.getElementById('document-scan').addEventListener('change', (event) => {
            this.handleFileSelection(event.target.files);
        });
    }

    // Handle file selection
    handleFileSelection(files) {
        if (files.length === 0) return;

        const validFiles = Array.from(files).filter(file => this.validateImageFormat(file));
        
        if (validFiles.length === 0) {
            alert('Please select valid image files (JPG, PNG, etc.)');
            return;
        }

        if (validFiles.length !== files.length) {
            alert(`${files.length - validFiles.length} file(s) were not in valid format and were skipped.`);
        }

        return validFiles;
    }

    // Scan document from UI
    async scanDocumentFromUI() {
        const fileInput = document.getElementById('document-scan');
        const files = fileInput.files;
        
        if (files.length === 0) {
            alert('Please select files to scan');
            return;
        }

        const validFiles = this.handleFileSelection(files);
        if (!validFiles) return;

        const scanType = document.querySelector('input[name="scan-type"]:checked').value;
        const statusDiv = document.getElementById('scan-status');
        const resultsDiv = document.getElementById('scan-results');
        
        statusDiv.textContent = 'Scanning document...';
        statusDiv.className = 'status-message info';
        resultsDiv.style.display = 'none';

        try {
            let result;
            
            if (scanType === 'voter-id') {
                result = await this.extractVoterIdInfo(validFiles[0]);
            } else if (scanType === 'general') {
                result = await this.extractText(validFiles[0]);
            } else {
                result = await this.extractText(validFiles[0]);
            }

            if (result.success) {
                this.displayScanResults(result, scanType);
                statusDiv.textContent = 'Document scanned successfully!';
                statusDiv.className = 'status-message success';
            } else {
                statusDiv.textContent = 'Scan failed: ' + result.error;
                statusDiv.className = 'status-message error';
            }
        } catch (error) {
            statusDiv.textContent = 'Error: ' + error.message;
            statusDiv.className = 'status-message error';
        }
    }

    // Display scan results
    displayScanResults(result, scanType) {
        const resultsDiv = document.getElementById('scan-results');
        const infoDiv = document.getElementById('extracted-info');
        const confidenceDiv = document.getElementById('scan-confidence');
        const validationDiv = document.getElementById('scan-validation');
        
        resultsDiv.style.display = 'block';

        if (scanType === 'voter-id' && result.voterInfo) {
            const voterInfo = result.voterInfo;
            infoDiv.innerHTML = `
                <div class="extracted-data">
                    <h5>Extracted Voter Information:</h5>
                    <div class="data-grid">
                        <div class="data-item">
                            <strong>Voter ID:</strong> ${voterInfo.voterInfo || 'Not found'}
                        </div>
                        <div class="data-item">
                            <strong>Name:</strong> ${voterInfo.name || 'Not found'}
                        </div>
                        <div class="data-item">
                            <strong>Father's Name:</strong> ${voterInfo.fatherName || 'Not found'}
                        </div>
                        <div class="data-item">
                            <strong>Age:</strong> ${voterInfo.age || 'Not found'}
                        </div>
                        <div class="data-item">
                            <strong>Gender:</strong> ${voterInfo.gender || 'Not found'}
                        </div>
                        <div class="data-item">
                            <strong>Address:</strong> ${voterInfo.address || 'Not found'}
                        </div>
                        <div class="data-item">
                            <strong>Constituency:</strong> ${voterInfo.constituency || 'Not found'}
                        </div>
                        <div class="data-item">
                            <strong>Part Number:</strong> ${voterInfo.partNumber || 'Not found'}
                        </div>
                    </div>
                </div>
            `;

            // Show confidence
            if (result.confidence !== undefined) {
                confidenceDiv.innerHTML = `
                    <div class="confidence-meter">
                        <strong>Extraction Confidence:</strong> 
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${result.confidence * 100}%"></div>
                        </div>
                        <span>${Math.round(result.confidence * 100)}%</span>
                    </div>
                `;
            }

            // Show validation
            const validation = this.validateExtractedInfo(voterInfo);
            if (validation.errors.length > 0 || validation.warnings.length > 0) {
                validationDiv.innerHTML = `
                    <div class="validation-results">
                        ${validation.errors.length > 0 ? `
                            <div class="validation-errors">
                                <strong>Errors:</strong>
                                <ul>${validation.errors.map(error => `<li>${error}</li>`).join('')}</ul>
                            </div>
                        ` : ''}
                        ${validation.warnings.length > 0 ? `
                            <div class="validation-warnings">
                                <strong>Warnings:</strong>
                                <ul>${validation.warnings.map(warning => `<li>${warning}</li>`).join('')}</ul>
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        } else {
            // Show general text extraction results
            infoDiv.innerHTML = `
                <div class="extracted-text">
                    <h5>Extracted Text:</h5>
                    <div class="text-content">${result.fullText || 'No text found'}</div>
                </div>
            `;
        }
    }

    // Get service status
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            supportedFormats: this.supportedFormats
        };
    }
}

// Create global instance
const googleVision = new GoogleVisionIntegration();

// Export for use in other modules
export default googleVision;
