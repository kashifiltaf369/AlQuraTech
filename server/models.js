// ... existing code ...

// Project Schema
const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    tasks: [{
        title: String,
        description: String,
        skillLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced']
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'reviewed'],
            default: 'pending'
        },
        points: Number,
        solution: String,
        feedback: [String],
        score: Number,
        completedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        completedAt: Date
    }],
    assignedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'launched'],
        default: 'pending'
    },
    revenue: {
        type: Number,
        default: 0
    },
    contributors: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        contribution: Number, // Percentage of contribution
        revenueShare: Number
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    launchedAt: Date
});

// Update User Schema with project-related fields
userSchema.add({
    completedTasks: [{
        taskId: {
            type: mongoose.Schema.Types.ObjectId
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project'
        },
        score: Number,
        completedAt: Date
    }],
    totalPoints: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    earnings: {
        type: Number,
        default: 0
    }
});

const Project = mongoose.model('Project', projectSchema);

// ... existing code ...

module.exports = {
    User,
    PasswordReset,
    Course,
    Progress,
    AIInteraction,
    Project
};