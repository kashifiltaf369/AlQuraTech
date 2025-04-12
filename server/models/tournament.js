const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    category: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'ai_project'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed'],
        default: 'upcoming'
    },
    prizePool: {
        type: Number,
        default: 0
    },
    challenges: [{
        title: String,
        description: String,
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced']
        },
        testCases: [{
            input: String,
            expectedOutput: String,
            isHidden: {
                type: Boolean,
                default: false
            }
        }],
        timeLimit: Number, // in seconds
        memoryLimit: Number, // in MB
        points: Number,
        templateCode: {
            javascript: String,
            python: String,
            java: String
        }
    }],
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        totalScore: {
            type: Number,
            default: 0
        },
        rank: {
            type: Number,
            default: 0
        },
        submissions: [{
            challengeIndex: Number,
            code: String,
            language: {
                type: String,
                enum: ['javascript', 'python', 'java']
            },
            score: Number,
            executionTime: Number,
            memory: Number,
            status: {
                type: String,
                enum: ['pending', 'running', 'completed', 'error']
            },
            feedback: [String],
            submittedAt: {
                type: Date,
                default: Date.now
            }
        }],
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    rewards: {
        monetary: [{
            rank: Number,
            amount: Number
        }],
        premiumAccess: {
            type: Boolean,
            default: false
        },
        hiring: {
            available: {
                type: Boolean,
                default: false
            },
            companies: [{
                name: String,
                positions: [String],
                requirements: [String]
            }]
        }
    }
});

// Indexes for efficient querying
tournamentSchema.index({ status: 1, startDate: -1 });
tournamentSchema.index({ 'participants.user': 1 });
tournamentSchema.index({ category: 1, status: 1 });

// Methods for tournament management
tournamentSchema.methods.calculateRankings = async function() {
    // Sort participants by score and update ranks
    this.participants.sort((a, b) => b.totalScore - a.totalScore);
    
    this.participants.forEach((participant, index) => {
        participant.rank = index + 1;
    });
    
    await this.save();
};

tournamentSchema.methods.evaluateSubmission = function(submission) {
    const challenge = this.challenges[submission.challengeIndex];
    let score = 0;
    let feedback = [];
    
    // Basic code quality checks
    if (submission.code.includes('//')) {
        score += 10;
        feedback.push("Good use of comments!");
    }
    
    // Check code structure
    if (/^function/.test(submission.code) || /^class/.test(submission.code)) {
        score += 15;
        feedback.push("Well-structured code implementation!");
    }
    
    // Error handling check
    if (submission.code.includes('try') && submission.code.includes('catch')) {
        score += 15;
        feedback.push("Excellent error handling implementation!");
    }
    
    // Naming conventions check
    if (/([a-z]+[A-Z][a-z]+)/.test(submission.code)) {
        score += 10;
        feedback.push("Good use of camelCase naming convention!");
    }
    
    // Add challenge-specific points
    score += this.evaluateTestCases(submission, challenge);
    
    return {
        score: Math.min(score, 100),
        feedback
    };
};

tournamentSchema.methods.evaluateTestCases = function(submission, challenge) {
    // Simplified test case evaluation (in reality, you'd run code in a sandbox)
    let testScore = 0;
    const pointsPerTest = 50 / challenge.testCases.length;
    
    challenge.testCases.forEach(test => {
        // Simulate test execution (replace with actual execution logic)
        const passed = Math.random() > 0.3; // 70% pass rate for simulation
        if (passed) {
            testScore += pointsPerTest;
        }
    });
    
    return testScore;
};

// Static methods for tournament management
tournamentSchema.statics.generateChallenge = function(category) {
    const challenges = {
        beginner: [
            {
                title: "Array Sum Calculator",
                description: "Create a function that calculates the sum of all elements in an array",
                difficulty: "beginner",
                points: 100,
                testCases: [
                    { input: "[1, 2, 3]", expectedOutput: "6", isHidden: false },
                    { input: "[-1, 0, 1]", expectedOutput: "0", isHidden: false }
                ]
            }
        ],
        intermediate: [
            {
                title: "Binary Tree Traversal",
                description: "Implement an in-order traversal of a binary tree",
                difficulty: "intermediate",
                points: 200,
                testCases: [
                    { input: "[1,2,3,4,5]", expectedOutput: "[4,2,5,1,3]", isHidden: false }
                ]
            }
        ],
        advanced: [
            {
                title: "Distributed Cache",
                description: "Implement a distributed cache with LRU eviction policy",
                difficulty: "advanced",
                points: 300,
                testCases: [
                    { input: "put(1,1),put(2,2),get(1)", expectedOutput: "1", isHidden: false }
                ]
            }
        ]
    };
    
    return challenges[category][Math.floor(Math.random() * challenges[category].length)];
};

const Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = Tournament; 