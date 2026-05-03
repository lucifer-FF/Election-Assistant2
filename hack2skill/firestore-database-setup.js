// Firestore Database Setup Script
// This script initializes the database structure for the Election Assistant

import { db, doc, setDoc, collection } from './firebase-config.js';

class FirestoreDatabaseSetup {
    constructor() {
        this.db = db;
    }

    // Initialize sample data for the application
    async initializeDatabase() {
        try {
            console.log("Initializing Firestore database...");
            
            // Create sample election data
            await this.createSampleElections();
            
            // Create sample candidates
            await this.createSampleCandidates();
            
            // Create sample polling stations
            await this.createSamplePollingStations();
            
            // Create sample news articles
            await this.createSampleNews();
            
            console.log("Database initialization completed successfully!");
            return { success: true };
        } catch (error) {
            console.error("Database initialization error:", error);
            return { success: false, error: error.message };
        }
    }

    async createSampleElections() {
        const elections = [
            {
                id: "west_bengal_2026",
                title: "West Bengal Legislative Assembly Election 2026",
                description: "Election for the 16th West Bengal Legislative Assembly",
                electionType: "State Assembly",
                state: "West Bengal",
                totalConstituencies: 294,
                notificationDate: new Date("2026-03-01"),
                lastDateOfNomination: new Date("2026-03-15"),
                dateOfScrutiny: new Date("2026-03-16"),
                dateOfWithdrawal: new Date("2026-03-19"),
                dateOfPoll: new Date("2026-04-06"),
                dateOfCounting: new Date("2026-04-08"),
                resultDeclarationDate: new Date("2026-04-08"),
                status: "upcoming",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: "loksabha_2024",
                title: "Lok Sabha General Election 2024",
                description: "Election for the 18th Lok Sabha",
                electionType: "General Election",
                state: "India",
                totalConstituencies: 543,
                phases: [
                    {
                        phase: 1,
                        date: new Date("2024-04-19"),
                        states: ["Tamil Nadu", "Uttarakhand", "Arunachal Pradesh"]
                    },
                    {
                        phase: 2,
                        date: new Date("2024-04-26"),
                        states: ["Kerala", "Karnataka", "Rajasthan"]
                    }
                ],
                notificationDate: new Date("2024-03-14"),
                lastDateOfNomination: new Date("2024-03-27"),
                dateOfScrutiny: new Date("2024-03-28"),
                dateOfWithdrawal: new Date("2024-03-30"),
                dateOfCounting: new Date("2024-06-04"),
                resultDeclarationDate: new Date("2024-06-04"),
                status: "completed",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        for (const election of elections) {
            await setDoc(doc(this.db, "elections", election.id), election);
        }
    }

    async createSampleCandidates() {
        const candidates = [
            {
                id: "candidate_001",
                name: "Dr. Priya Sharma",
                party: "All India Trinamool Congress",
                partySymbol: "Jora Ghas Phul",
                constituency: "Bhabanipur",
                constituencyNumber: "159",
                state: "West Bengal",
                district: "Kolkata",
                age: 45,
                education: "Ph.D. in Political Science",
                profession: "Professor",
                assets: "₹2.5 Crore",
                liabilities: "₹15 Lakhs",
                criminalCases: 0,
                photoURL: "/assets/candidates/priya_sharma.jpg",
                manifesto: {
                    education: "Free education up to university level",
                    healthcare: "Universal health coverage",
                    infrastructure: "Smart city development",
                    employment: "Job creation schemes for youth"
                },
                socialMedia: {
                    twitter: "@priyasharma",
                    facebook: "priya.sharma.official",
                    instagram: "priya_sharma_politics"
                },
                contact: {
                    email: "priya.sharma@example.com",
                    phone: "+91-9876543210",
                    address: "123, Park Street, Kolkata - 700016"
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: "candidate_002",
                name: "Rahul Mukherjee",
                party: "Bharatiya Janata Party",
                partySymbol: "Lotus",
                constituency: "Bhabanipur",
                constituencyNumber: "159",
                state: "West Bengal",
                district: "Kolkata",
                age: 52,
                education: "MBA from IIM",
                profession: "Businessman",
                assets: "₹8.2 Crore",
                liabilities: "₹1.2 Crore",
                criminalCases: 1,
                photoURL: "/assets/candidates/rahul_mukherjee.jpg",
                manifesto: {
                    development: "Infrastructure modernization",
                    economy: "Pro-business policies",
                    security: "Law and order enhancement",
                    agriculture: "Farmer welfare schemes"
                },
                socialMedia: {
                    twitter: "@rahulmukherjee",
                    facebook: "rahul.mukherjee.bjp",
                    instagram: "rahul_m_bjp"
                },
                contact: {
                    email: "rahul.m@example.com",
                    phone: "+91-9876543211",
                    address: "456, Camac Street, Kolkata - 700017"
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: "candidate_003",
                name: "Anita Banerjee",
                party: "Indian National Congress",
                partySymbol: "Hand",
                constituency: "Jadavpur",
                constituencyNumber: "150",
                state: "West Bengal",
                district: "Kolkata",
                age: 38,
                education: "M.A. in Sociology",
                profession: "Social Worker",
                assets: "₹1.8 Crore",
                liabilities: "₹8 Lakhs",
                criminalCases: 0,
                photoURL: "/assets/candidates/anita_banerjee.jpg",
                manifesto: {
                    womenEmpowerment: "Women safety and empowerment programs",
                    education: "Quality education for all",
                    healthcare: "Affordable healthcare",
                    environment: "Sustainable development"
                },
                socialMedia: {
                    twitter: "@anitabanerjee",
                    facebook: "anita.banerjee.inc",
                    instagram: "anita_banerjee_congress"
                },
                contact: {
                    email: "anita.b@example.com",
                    phone: "+91-9876543212",
                    address: "789, Gariahat Road, Kolkata - 700029"
                },
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        for (const candidate of candidates) {
            await setDoc(doc(this.db, "candidates", candidate.id), candidate);
        }
    }

    async createSamplePollingStations() {
        const pollingStations = [
            {
                id: "ps_001",
                name: "Bhabanipur Government School",
                address: "123, Rashbehari Avenue, Kolkata - 700029",
                constituency: "Bhabanipur",
                constituencyNumber: "159",
                partNumber: "12",
                location: {
                    latitude: 22.5180,
                    longitude: 88.3620
                },
                facilities: {
                    wheelchairAccessible: true,
                    parkingAvailable: true,
                    drinkingWater: true,
                    toilets: true,
                    waitingArea: true
                },
                contact: {
                    presidingOfficer: "Mr. S. K. Singh",
                    phone: "+91-9876543210"
                },
                capacity: 1500,
                expectedVoters: 1200,
                status: "active",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: "ps_002",
                name: "Jadavpur University Campus",
                address: "Jadavpur University, Kolkata - 700032",
                constituency: "Jadavpur",
                constituencyNumber: "150",
                partNumber: "8",
                location: {
                    latitude: 22.4968,
                    longitude: 88.3712
                },
                facilities: {
                    wheelchairAccessible: true,
                    parkingAvailable: true,
                    drinkingWater: true,
                    toilets: true,
                    waitingArea: true
                },
                contact: {
                    presidingOfficer: "Mrs. R. Ghosh",
                    phone: "+91-9876543211"
                },
                capacity: 2000,
                expectedVoters: 1800,
                status: "active",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: "ps_003",
                name: "Nandigram High School",
                address: "Main Road, Nandigram, Purba Medinipur - 721631",
                constituency: "Nandigram",
                constituencyNumber: "210",
                partNumber: "15",
                location: {
                    latitude: 21.9950,
                    longitude: 87.8550
                },
                facilities: {
                    wheelchairAccessible: false,
                    parkingAvailable: true,
                    drinkingWater: true,
                    toilets: true,
                    waitingArea: true
                },
                contact: {
                    presidingOfficer: "Mr. P. K. Jana",
                    phone: "+91-9876543212"
                },
                capacity: 800,
                expectedVoters: 650,
                status: "active",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        for (const station of pollingStations) {
            await setDoc(doc(this.db, "pollingStations", station.id), station);
        }
    }

    async createSampleNews() {
        const newsArticles = [
            {
                id: "news_001",
                title: "Election Commission Announces Poll Dates for West Bengal",
                summary: "The Election Commission of India has announced the schedule for the West Bengal Legislative Assembly Election 2026.",
                content: "The Election Commission of India today announced the dates for the West Bengal Legislative Assembly Election 2026. The polling will be held in a single phase on April 6, 2026, with counting of votes scheduled for April 8, 2026. The notification for the election will be issued on March 1, 2026, and the last date for filing nominations is March 15, 2026.",
                category: "Election News",
                author: "Election Commission",
                source: "Official Election Commission",
                imageUrl: "/assets/news/election_dates.jpg",
                publishedAt: new Date("2026-02-28"),
                tags: ["West Bengal", "Election Dates", "Election Commission"],
                featured: true,
                status: "published",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: "news_002",
                title: "Voter Registration Deadline Extended",
                summary: "The Election Commission has extended the deadline for voter registration in view of the upcoming elections.",
                content: "In view of the upcoming elections, the Election Commission has extended the deadline for voter registration. Citizens who have not yet registered as voters can now apply until March 10, 2026. The Commission has urged all eligible citizens to register and exercise their democratic right to vote.",
                category: "Voter Information",
                author: "ECI Spokesperson",
                source: "Election Commission of India",
                imageUrl: "/assets/news/voter_registration.jpg",
                publishedAt: new Date("2026-02-25"),
                tags: ["Voter Registration", "Deadline", "Election Commission"],
                featured: false,
                status: "published",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: "news_003",
                title: "New Polling Stations Added in Urban Areas",
                summary: "Several new polling stations have been added in urban areas to reduce voter queues and improve accessibility.",
                content: "The Election Commission has approved the addition of 50 new polling stations in major urban areas across West Bengal. This decision has been taken to reduce voter queues and improve accessibility, especially for elderly and differently-abled voters. The new polling stations will be equipped with modern facilities including wheelchair access and adequate parking.",
                category: "Infrastructure",
                author: "State Election Office",
                source: "West Bengal Election Office",
                imageUrl: "/assets/news/polling_stations.jpg",
                publishedAt: new Date("2026-02-20"),
                tags: ["Polling Stations", "Infrastructure", "Accessibility"],
                featured: false,
                status: "published",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        for (const article of newsArticles) {
            await setDoc(doc(this.db, "news", article.id), article);
        }
    }

    // Create indexes for better query performance
    async createIndexes() {
        // Note: Indexes need to be created through Firebase Console or CLI
        // This is just documentation of required indexes
        
        const requiredIndexes = [
            {
                collection: "candidates",
                fields: ["constituency", "state"],
                order: "ASCENDING"
            },
            {
                collection: "pollingStations",
                fields: ["constituency", "partNumber"],
                order: "ASCENDING"
            },
            {
                collection: "news",
                fields: ["publishedAt"],
                order: "DESCENDING"
            },
            {
                collection: "voterRegistrations",
                fields: ["userId", "createdAt"],
                order: "ASCENDING"
            }
        ];

        console.log("Required indexes:", requiredIndexes);
        console.log("Please create these indexes manually in Firebase Console or use Firebase CLI");
    }
}

// Export the setup class
export default FirestoreDatabaseSetup;
