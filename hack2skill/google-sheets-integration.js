// Google Sheets API Integration for Data Management
// This module provides spreadsheet functionality for election data

class GoogleSheetsIntegration {
    constructor() {
        this.apiKey = 'your-google-sheets-api-key-here'; // Replace with your actual API key
        this.clientId = 'your-client-id-here'; // Replace with your actual client ID
        this.discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest'];
        this.scopes = 'https://www.googleapis.com/auth/spreadsheets';
        this.isLoaded = false;
        this.isSignedIn = false;
        this.sheetsService = null;
        this.electionSpreadsheetId = null;
    }

    // Initialize Google Sheets API
    async init() {
        try {
            await this.loadGapiScript();
            await this.loadGisScript();
            await this.initializeGapi();
            
            this.isLoaded = true;
            console.log('Google Sheets API initialized successfully');
            return { success: true };
        } catch (error) {
            console.error('Failed to initialize Google Sheets API:', error);
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
                    
                    this.sheetsService = window.gapi.client.sheets;
                    
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

    // Create election data spreadsheet
    async createElectionSpreadsheet() {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            const response = await this.sheetsService.spreadsheets.create({
                resource: {
                    properties: {
                        title: 'Election Data Management',
                        locale: 'en_IN'
                    },
                    sheets: [
                        {
                            properties: {
                                title: 'Voters',
                                gridProperties: {
                                    rowCount: 1000,
                                    columnCount: 10
                                }
                            }
                        },
                        {
                            properties: {
                                title: 'Candidates',
                                gridProperties: {
                                    rowCount: 500,
                                    columnCount: 15
                                }
                            }
                        },
                        {
                            properties: {
                                title: 'Polling Stations',
                                gridProperties: {
                                    rowCount: 200,
                                    columnCount: 8
                                }
                            }
                        },
                        {
                            properties: {
                                title: 'Election Results',
                                gridProperties: {
                                    rowCount: 100,
                                    columnCount: 12
                                }
                            }
                        }
                    ]
                }
            });

            this.electionSpreadsheetId = response.result.spreadsheetId;
            
            // Add headers to each sheet
            await this.setupSpreadsheetHeaders(response.result.spreadsheetId);
            
            return {
                success: true,
                spreadsheetId: response.result.spreadsheetId,
                spreadsheetUrl: response.result.spreadsheetUrl
            };
        } catch (error) {
            console.error('Error creating spreadsheet:', error);
            return { success: false, error: error.message };
        }
    }

    // Setup spreadsheet headers
    async setupSpreadsheetHeaders(spreadsheetId) {
        const sheets = ['Voters', 'Candidates', 'Polling Stations', 'Election Results'];
        const headers = {
            'Voters': ['Voter ID', 'Name', 'Email', 'Phone', 'State', 'Constituency', 'Age', 'Gender', 'Registration Date', 'Status'],
            'Candidates': ['Candidate ID', 'Name', 'Party', 'Constituency', 'State', 'Age', 'Education', 'Profession', 'Assets', 'Liabilities', 'Criminal Cases', 'Symbol', 'Contact', 'Email', 'Website'],
            'Polling Stations': ['Station ID', 'Name', 'Address', 'Constituency', 'Part Number', 'Latitude', 'Longitude', 'Capacity'],
            'Election Results': ['Constituency', 'Winner', 'Party', 'Votes', 'Margin', 'Runner-up', 'Runner-up Party', 'Runner-up Votes', 'Total Votes', 'Voter Turnout', 'Date', 'Status']
        };

        for (const sheetName of sheets) {
            await this.sheetsService.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: `${sheetName}!A1:${String.fromCharCode(65 + headers[sheetName].length - 1)}1`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [headers[sheetName]]
                }
            });
        }
    }

    // Add voter data
    async addVoterData(voterData) {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        if (!this.electionSpreadsheetId) {
            const result = await this.createElectionSpreadsheet();
            if (!result.success) {
                return result;
            }
        }

        try {
            const response = await this.sheetsService.spreadsheets.values.append({
                spreadsheetId: this.electionSpreadsheetId,
                range: 'Voters!A2:J',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[
                        voterData.voterId || '',
                        voterData.name || '',
                        voterData.email || '',
                        voterData.phone || '',
                        voterData.state || '',
                        voterData.constituency || '',
                        voterData.age || '',
                        voterData.gender || '',
                        voterData.registrationDate || new Date().toISOString().split('T')[0],
                        voterData.status || 'Active'
                    ]]
                }
            });

            return {
                success: true,
                rowNumber: response.result.updates.updatedRows,
                range: response.result.updates.updatedRange
            };
        } catch (error) {
            console.error('Error adding voter data:', error);
            return { success: false, error: error.message };
        }
    }

    // Add candidate data
    async addCandidateData(candidateData) {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        if (!this.electionSpreadsheetId) {
            const result = await this.createElectionSpreadsheet();
            if (!result.success) {
                return result;
            }
        }

        try {
            const response = await this.sheetsService.spreadsheets.values.append({
                spreadsheetId: this.electionSpreadsheetId,
                range: 'Candidates!A2:O',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[
                        candidateData.candidateId || '',
                        candidateData.name || '',
                        candidateData.party || '',
                        candidateData.constituency || '',
                        candidateData.state || '',
                        candidateData.age || '',
                        candidateData.education || '',
                        candidateData.profession || '',
                        candidateData.assets || '',
                        candidateData.liabilities || '',
                        candidateData.criminalCases || '',
                        candidateData.symbol || '',
                        candidateData.contact || '',
                        candidateData.email || '',
                        candidateData.website || ''
                    ]]
                }
            });

            return {
                success: true,
                rowNumber: response.result.updates.updatedRows,
                range: response.result.updates.updatedRange
            };
        } catch (error) {
            console.error('Error adding candidate data:', error);
            return { success: false, error: error.message };
        }
    }

    // Add polling station data
    async addPollingStationData(stationData) {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        if (!this.electionSpreadsheetId) {
            const result = await this.createElectionSpreadsheet();
            if (!result.success) {
                return result;
            }
        }

        try {
            const response = await this.sheetsService.spreadsheets.values.append({
                spreadsheetId: this.electionSpreadsheetId,
                range: 'Polling Stations!A2:H',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[
                        stationData.stationId || '',
                        stationData.name || '',
                        stationData.address || '',
                        stationData.constituency || '',
                        stationData.partNumber || '',
                        stationData.latitude || '',
                        stationData.longitude || '',
                        stationData.capacity || ''
                    ]]
                }
            });

            return {
                success: true,
                rowNumber: response.result.updates.updatedRows,
                range: response.result.updates.updatedRange
            };
        } catch (error) {
            console.error('Error adding polling station data:', error);
            return { success: false, error: error.message };
        }
    }

    // Get voter data
    async getVoterData(range = 'Voters!A2:J') {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        if (!this.electionSpreadsheetId) {
            return { success: true, data: [] };
        }

        try {
            const response = await this.sheetsService.spreadsheets.values.get({
                spreadsheetId: this.electionSpreadsheetId,
                range: range
            });

            const voters = response.result.values ? response.result.values.map(row => ({
                voterId: row[0],
                name: row[1],
                email: row[2],
                phone: row[3],
                state: row[4],
                constituency: row[5],
                age: row[6],
                gender: row[7],
                registrationDate: row[8],
                status: row[9]
            })) : [];

            return { success: true, data: voters };
        } catch (error) {
            console.error('Error getting voter data:', error);
            return { success: false, error: error.message };
        }
    }

    // Get candidate data
    async getCandidateData(range = 'Candidates!A2:O') {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        if (!this.electionSpreadsheetId) {
            return { success: true, data: [] };
        }

        try {
            const response = await this.sheetsService.spreadsheets.values.get({
                spreadsheetId: this.electionSpreadsheetId,
                range: range
            });

            const candidates = response.result.values ? response.result.values.map(row => ({
                candidateId: row[0],
                name: row[1],
                party: row[2],
                constituency: row[3],
                state: row[4],
                age: row[5],
                education: row[6],
                profession: row[7],
                assets: row[8],
                liabilities: row[9],
                criminalCases: row[10],
                symbol: row[11],
                contact: row[12],
                email: row[13],
                website: row[14]
            })) : [];

            return { success: true, data: candidates };
        } catch (error) {
            console.error('Error getting candidate data:', error);
            return { success: false, error: error.message };
        }
    }

    // Search voters
    async searchVoters(searchTerm, searchColumn = 'name') {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            const columnMap = {
                'name': 'B',
                'email': 'C',
                'phone': 'D',
                'state': 'E',
                'constituency': 'F',
                'voterId': 'A'
            };

            const column = columnMap[searchColumn] || 'B';
            const range = `Voters!A2:J`;
            
            const response = await this.sheetsService.spreadsheets.values.get({
                spreadsheetId: this.electionSpreadsheetId,
                range: range
            });

            const voters = response.result.values ? response.result.values.filter(row => 
                row[columnMap[searchColumn] ? columnMap[searchColumn].charCodeAt(0) - 65 : 1]
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
            ).map(row => ({
                voterId: row[0],
                name: row[1],
                email: row[2],
                phone: row[3],
                state: row[4],
                constituency: row[5],
                age: row[6],
                gender: row[7],
                registrationDate: row[8],
                status: row[9]
            })) : [];

            return { success: true, data: voters };
        } catch (error) {
            console.error('Error searching voters:', error);
            return { success: false, error: error.message };
        }
    }

    // Update voter data
    async updateVoterData(voterId, updateData) {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            // First find the row with the voter ID
            const votersResult = await this.getVoterData();
            if (!votersResult.success) {
                return votersResult;
            }

            const voterIndex = votersResult.data.findIndex(voter => voter.voterId === voterId);
            if (voterIndex === -1) {
                return { success: false, error: 'Voter not found' };
            }

            const rowNumber = voterIndex + 2; // +2 because of header and 0-based index

            // Update the specific fields
            const updateFields = {
                name: updateData.name,
                email: updateData.email,
                phone: updateData.phone,
                state: updateData.state,
                constituency: updateData.constituency,
                age: updateData.age,
                gender: updateData.gender,
                status: updateData.status
            };

            for (const [field, value] of Object.entries(updateFields)) {
                if (value !== undefined) {
                    const columnMap = {
                        'name': 'B',
                        'email': 'C',
                        'phone': 'D',
                        'state': 'E',
                        'constituency': 'F',
                        'age': 'G',
                        'gender': 'H',
                        'status': 'J'
                    };

                    const range = `Voters!${columnMap[field]}${rowNumber}`;
                    
                    await this.sheetsService.spreadsheets.values.update({
                        spreadsheetId: this.electionSpreadsheetId,
                        range: range,
                        valueInputOption: 'USER_ENTERED',
                        resource: {
                            values: [[value]]
                        }
                    });
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error updating voter data:', error);
            return { success: false, error: error.message };
        }
    }

    // Export data to CSV
    async exportToCSV(sheetName, range) {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            const response = await this.sheetsService.spreadsheets.values.get({
                spreadsheetId: this.electionSpreadsheetId,
                range: `${sheetName}!${range}`
            });

            if (!response.result.values) {
                return { success: false, error: 'No data found' };
            }

            // Convert to CSV
            const csv = response.result.values.map(row => row.join(',')).join('\n');
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${sheetName}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            return { success: false, error: error.message };
        }
    }

    // Get statistics
    async getStatistics() {
        if (!this.isSignedIn) {
            throw new Error('User not signed in to Google');
        }

        try {
            const votersResult = await this.getVoterData();
            const candidatesResult = await this.getCandidateData();

            if (!votersResult.success || !candidatesResult.success) {
                return { success: false, error: 'Failed to get data' };
            }

            const voters = votersResult.data;
            const candidates = candidatesResult.data;

            const stats = {
                totalVoters: voters.length,
                activeVoters: voters.filter(v => v.status === 'Active').length,
                totalCandidates: candidates.length,
                parties: [...new Set(candidates.map(c => c.party))].length,
                constituencies: [...new Set(candidates.map(c => c.constituency))].length,
                states: [...new Set(voters.map(v => v.state))].length,
                averageAge: Math.round(voters.reduce((sum, v) => sum + parseInt(v.age || 0), 0) / voters.length),
                genderDistribution: {
                    male: voters.filter(v => v.gender === 'Male').length,
                    female: voters.filter(v => v.gender === 'Female').length,
                    other: voters.filter(v => v.gender === 'Other').length
                }
            };

            return { success: true, statistics: stats };
        } catch (error) {
            console.error('Error getting statistics:', error);
            return { success: false, error: error.message };
        }
    }

    // Auth state change handler
    onAuthStateChange(isSignedIn) {
        console.log('Google Sheets auth state changed:', isSignedIn);
        
        // Update UI based on auth state
        const signInButton = document.getElementById('sheets-sign-in');
        const signOutButton = document.getElementById('sheets-sign-out');
        const sheetsActions = document.getElementById('sheets-actions');
        
        if (signInButton) {
            signInButton.style.display = isSignedIn ? 'none' : 'block';
        }
        
        if (signOutButton) {
            signOutButton.style.display = isSignedIn ? 'block' : 'none';
        }
        
        if (sheetsActions) {
            sheetsActions.style.display = isSignedIn ? 'block' : 'none';
        }
    }

    // Create Sheets integration UI
    createSheetsUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="sheets-integration">
                <h3>Google Sheets Data Management</h3>
                <div id="sheets-auth-section">
                    <button id="sheets-sign-in" class="btn btn-primary">
                        📊 Connect Google Sheets
                    </button>
                    <button id="sheets-sign-out" class="btn btn-secondary" style="display: none;">
                        🚪 Disconnect
                    </button>
                </div>
                <div id="sheets-actions" style="display: none;">
                    <div class="data-actions">
                        <h4>Data Management</h4>
                        <button id="export-voters" class="btn btn-primary">
                            📥 Export Voters CSV
                        </button>
                        <button id="export-candidates" class="btn btn-primary">
                            📥 Export Candidates CSV
                        </button>
                        <button id="view-statistics" class="btn btn-info">
                            📈 View Statistics
                        </button>
                    </div>
                    <div id="sheets-status" class="status-message"></div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('sheets-sign-in').addEventListener('click', () => {
            this.signIn();
        });

        document.getElementById('sheets-sign-out').addEventListener('click', () => {
            this.signOut();
        });

        document.getElementById('export-voters').addEventListener('click', () => {
            this.exportData('Voters', 'A2:J');
        });

        document.getElementById('export-candidates').addEventListener('click', () => {
            this.exportData('Candidates', 'A2:O');
        });

        document.getElementById('view-statistics').addEventListener('click', () => {
            this.showStatistics();
        });

        // Update UI based on current auth state
        this.onAuthStateChange(this.isSignedIn);
    }

    // Export data from UI
    async exportData(sheetName, range) {
        const statusDiv = document.getElementById('sheets-status');
        statusDiv.textContent = `Exporting ${sheetName} data...`;
        statusDiv.className = 'status-message info';

        try {
            const result = await this.exportToCSV(sheetName, range);
            
            if (result.success) {
                statusDiv.textContent = `${sheetName} data exported successfully!`;
                statusDiv.className = 'status-message success';
            } else {
                statusDiv.textContent = `Export failed: ${result.error}`;
                statusDiv.className = 'status-message error';
            }
        } catch (error) {
            statusDiv.textContent = 'Error: ' + error.message;
            statusDiv.className = 'status-message error';
        }
    }

    // Show statistics
    async showStatistics() {
        const statusDiv = document.getElementById('sheets-status');
        statusDiv.textContent = 'Loading statistics...';
        statusDiv.className = 'status-message info';

        try {
            const result = await this.getStatistics();
            
            if (result.success) {
                const stats = result.statistics;
                statusDiv.innerHTML = `
                    <div class="statistics-panel">
                        <h5>Election Data Statistics</h5>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <strong>Total Voters:</strong> ${stats.totalVoters}
                            </div>
                            <div class="stat-item">
                                <strong>Active Voters:</strong> ${stats.activeVoters}
                            </div>
                            <div class="stat-item">
                                <strong>Total Candidates:</strong> ${stats.totalCandidates}
                            </div>
                            <div class="stat-item">
                                <strong>Political Parties:</strong> ${stats.parties}
                            </div>
                            <div class="stat-item">
                                <strong>Constituencies:</strong> ${stats.constituencies}
                            </div>
                            <div class="stat-item">
                                <strong>States:</strong> ${stats.states}
                            </div>
                            <div class="stat-item">
                                <strong>Average Age:</strong> ${stats.averageAge}
                            </div>
                            <div class="stat-item">
                                <strong>Gender Distribution:</strong><br>
                                Male: ${stats.genderDistribution.male} | 
                                Female: ${stats.genderDistribution.female} | 
                                Other: ${stats.genderDistribution.other}
                            </div>
                        </div>
                    </div>
                `;
                statusDiv.className = 'status-message success';
            } else {
                statusDiv.textContent = `Failed to load statistics: ${result.error}`;
                statusDiv.className = 'status-message error';
            }
        } catch (error) {
            statusDiv.textContent = 'Error: ' + error.message;
            statusDiv.className = 'status-message error';
        }
    }

    // Get service status
    getStatus() {
        return {
            isLoaded: this.isLoaded,
            isSignedIn: this.isSignedIn,
            hasSheetsService: !!this.sheetsService,
            electionSpreadsheetId: this.electionSpreadsheetId
        };
    }
}

// Create global instance
const googleSheets = new GoogleSheetsIntegration();

// Export for use in other modules
export default googleSheets;
