// Gemini API Integration for AI-powered Chatbot
// This module handles the integration with Google's Gemini AI for the election assistant chatbot

class GeminiChatbot {
    constructor() {
        this.apiKey = 'AIzaSyC5OSAgLAatt7u5hGJp57rqcpPuiRQhyVc'; // Gemini API key
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.model = 'gemini-1.5-pro'; // Using the latest Gemini model
        this.chatHistory = [];
        this.maxHistoryLength = 10;
        this.systemPrompt = this.getSystemPrompt();
        this.isInitialized = false;
    }

    // Initialize the chatbot
    async init() {
        try {
            // Test API connection
            const testResponse = await this.generateResponse("Hello, can you help me with election information?");
            
            if (testResponse.success) {
                this.isInitialized = true;
                console.log('Gemini chatbot initialized successfully');
                return { success: true };
            } else {
                throw new Error('Failed to initialize Gemini API');
            }
        } catch (error) {
            console.error('Gemini initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get system prompt for the election assistant
    getSystemPrompt() {
        return `You are an Election Assistant AI chatbot for Indian elections. Your role is to help citizens with:

1. **Voting Procedures**: How to register, check eligibility, find polling stations
2. **Election Information**: Dates, candidates, constituencies, party symbols
3. **Voter Education**: Importance of voting, democratic process, election rules
4. **Candidate Information**: Help users find information about candidates (without bias)
5. **Polling Station Guidance**: Help locate polling booths and understand voting process
6. **Election Rules**: Explain voting procedures, ID requirements, voting methods

**IMPORTANT GUIDELINES:**
- Be neutral, unbiased, and factual
- Do not support or criticize any political party or candidate
- Provide accurate, up-to-date information about Indian elections
- Encourage democratic participation while remaining neutral
- If you don't know something, say so honestly
- Do not provide legal advice - direct users to official Election Commission resources
- Be helpful, patient, and clear in your responses
- Respond in the language the user is using (English, Hindi, or Bengali)

**CONTEXT:**
- Current year: 2026
- Focus on West Bengal elections primarily, but can help with other Indian elections
- Election Commission of India is the official authority
- Voter ID (EPIC) is required for voting
- Minimum voting age is 18 years

Always be helpful, accurate, and maintain political neutrality.`;
    }

    // Generate response using Gemini API
    async generateResponse(userMessage, userId = null) {
        try {
            // Prepare the conversation
            const conversation = this.prepareConversation(userMessage);
            
            // Make API request
            const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: conversation,
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates.length > 0) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                
                // Update chat history
                this.updateChatHistory(userMessage, aiResponse, userId);
                
                // Save conversation to Firestore if user is logged in
                if (userId) {
                    await this.saveConversationToFirestore(userId, userMessage, aiResponse);
                }
                
                return { 
                    success: true, 
                    response: aiResponse,
                    timestamp: new Date()
                };
            } else {
                throw new Error('No response generated');
            }
        } catch (error) {
            console.error('Gemini API error:', error);
            
            // Return fallback response
            const fallbackResponse = this.getFallbackResponse(userMessage);
            return { 
                success: false, 
                response: fallbackResponse,
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    // Prepare conversation for Gemini API
    prepareConversation(userMessage) {
        const conversation = [
            {
                role: "user",
                parts: [
                    {
                        text: this.systemPrompt
                    }
                ]
            },
            {
                role: "model",
                parts: [
                    {
                        text: "I understand. I'm ready to help citizens with election information while maintaining neutrality and providing accurate, helpful guidance."
                    }
                ]
            }
        ];

        // Add recent chat history
        this.chatHistory.forEach(item => {
            conversation.push({
                role: "user",
                parts: [{ text: item.user }]
            });
            conversation.push({
                role: "model",
                parts: [{ text: item.ai }]
            });
        });

        // Add current user message
        conversation.push({
            role: "user",
            parts: [{ text: userMessage }]
        });

        return conversation;
    }

    // Update chat history
    updateChatHistory(userMessage, aiResponse, userId) {
        this.chatHistory.push({
            user: userMessage,
            ai: aiResponse,
            userId: userId,
            timestamp: new Date()
        });

        // Keep only recent messages
        if (this.chatHistory.length > this.maxHistoryLength) {
            this.chatHistory = this.chatHistory.slice(-this.maxHistoryLength);
        }
    }

    // Save conversation to Firestore
    async saveConversationToFirestore(userId, userMessage, aiResponse) {
        try {
            // This would integrate with your Firebase setup
            // For now, just log the conversation
            console.log('Saving conversation for user:', userId);
            console.log('User:', userMessage);
            console.log('AI:', aiResponse);
            
            // Actual implementation would be:
            // await addDoc(collection(db, "chatMessages"), {
            //     userId: userId,
            //     userMessage: userMessage,
            //     aiResponse: aiResponse,
            //     timestamp: new Date(),
            //     model: this.model
            // });
        } catch (error) {
            console.error('Error saving conversation to Firestore:', error);
        }
    }

    // Get fallback response when API fails
    getFallbackResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return "Hello! I'm your Election Assistant. How can I help you with voting information today?";
        }
        
        if (lowerMessage.includes('vote') || lowerMessage.includes('voting')) {
            return "Voting is your democratic right! To vote in Indian elections, you need: 1) Voter ID card, 2) Be 18+ years old, 3) Be registered in your constituency. Would you like help with voter registration?";
        }
        
        if (lowerMessage.includes('register') || lowerMessage.includes('registration')) {
            return "For voter registration: 1) Visit www.nvsp.in, 2) Fill Form 6, 3) Upload documents, 4) Verify with Booth Level Officer. You need address proof, age proof, and photo.";
        }
        
        if (lowerMessage.includes('polling') || lowerMessage.includes('booth')) {
            return "To find your polling station: 1) Check your voter ID card, 2) Use Voter Helpline app, 3) Visit electoralsearch.in, 4) Call 1950 helpline. Carry your voter ID on voting day!";
        }
        
        if (lowerMessage.includes('candidate') || lowerMessage.includes('candidates')) {
            return "For candidate information: Check official Election Commission website at eci.gov.in for verified candidate details, affidavits, and criminal records. I can help you understand how to research candidates.";
        }
        
        return "I'm here to help with election information! You can ask me about voter registration, polling stations, voting procedures, or election dates. For specific real-time data, please visit the Election Commission website.";
    }

    // Get quick responses for common questions
    getQuickResponse(topic) {
        const quickResponses = {
            'eligibility': 'To vote in India: 1) Must be 18+ years old, 2) Must be Indian citizen, 3) Must be registered voter, 4) Must have valid voter ID. Need help with registration?',
            'documents': 'Required documents for voting: 1) Voter ID card (EPIC), 2) Alternative ID options: Aadhaar, Passport, Driving License. Carry your voter ID on election day!',
            'dates': 'Election dates are announced by the Election Commission. Check eci.gov.in for official dates. West Bengal elections are typically held in April-May.',
            'helpline': 'Election Helpline: 1950 (toll-free). Voter Helpline App available on Play Store/App Store. Website: eci.gov.in',
            'process': 'Voting process: 1) Reach polling station, 2) Show voter ID, 3) Get inked, 4) Press EVM button, 5) Get voter slip. Voting time: 7 AM to 6 PM.'
        };
        
        return quickResponses[topic] || "I can help with that! Please be more specific about what you'd like to know.";
    }

    // Analyze user intent for better responses
    analyzeIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('how to') || lowerMessage.includes('process')) {
            return 'process_help';
        }
        
        if (lowerMessage.includes('where') || lowerMessage.includes('find')) {
            return 'location_help';
        }
        
        if (lowerMessage.includes('when') || lowerMessage.includes('date')) {
            return 'timing_help';
        }
        
        if (lowerMessage.includes('what') || lowerMessage.includes('explain')) {
            return 'information_help';
        }
        
        if (lowerMessage.includes('emergency') || lowerMessage.includes('complaint')) {
            return 'urgent_help';
        }
        
        return 'general_query';
    }

    // Get contextual response based on intent
    async getContextualResponse(message, userId = null) {
        const intent = this.analyzeIntent(message);
        
        switch (intent) {
            case 'process_help':
                return await this.generateResponse(`Please provide step-by-step guidance for: ${message}`, userId);
            
            case 'location_help':
                return await this.generateResponse(`Help find location for: ${message}. Include directions and contact info if possible.`, userId);
            
            case 'timing_help':
                return await this.generateResponse(`Provide timing and date information for: ${message}`, userId);
            
            case 'information_help':
                return await this.generateResponse(`Explain clearly: ${message}`, userId);
            
            case 'urgent_help':
                return await this.generateResponse(`This seems urgent. Provide immediate help and emergency contacts for: ${message}`, userId);
            
            default:
                return await this.generateResponse(message, userId);
        }
    }

    // Clear chat history
    clearHistory() {
        this.chatHistory = [];
    }

    // Get chat statistics
    getChatStats() {
        return {
            totalMessages: this.chatHistory.length,
            isInitialized: this.isInitialized,
            model: this.model,
            lastActivity: this.chatHistory.length > 0 ? 
                this.chatHistory[this.chatHistory.length - 1].timestamp : null
        };
    }
}

// Create global instance
const geminiChatbot = new GeminiChatbot();

// Export for use in other modules
export default geminiChatbot;
