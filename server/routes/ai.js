const express = require('express');
const router = express.Router();
const { User, AIInteraction, Project, Task } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Predefined project templates
const PROJECT_TEMPLATES = {
    chatbot: {
        name: "Chat Application",
        description: "Build a real-time chat application with multiple features",
        difficulty: "intermediate",
        tasks: [
            {
                title: "Create user authentication system",
                description: "Implement login and registration functionality",
                skillLevel: "beginner",
                points: 100
            },
            {
                title: "Design chat interface",
                description: "Create a responsive chat UI using HTML/CSS",
                skillLevel: "beginner",
                points: 150
            },
            // Add more predefined tasks
        ]
    },
    // Add more project templates
};

// Simulated AI feedback patterns
const FEEDBACK_PATTERNS = {
    syntax: {
        pattern: /^[^{]*{|}[^{]*{/,
        feedback: "Your code structure looks good! Consider adding more comments for better readability."
    },
    naming: {
        pattern: /([a-z]+[A-Z][a-z]+)/,
        feedback: "Great use of camelCase naming convention! This makes your code more maintainable."
    },
    // Add more patterns
};

// Get personalized practice task
router.get('/practice/task', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const userLevel = calculateUserLevel(user.progress);
        
        // Get appropriate project and task based on user level
        const project = await getOrCreateUserProject(user._id, userLevel);
        const task = selectNextTask(project, userLevel);

        res.json({
            taskId: task._id,
            title: task.title,
            description: task.description,
            type: "practice",
            skillLevel: task.skillLevel,
            points: task.points
        });
    } catch (error) {
        console.error('Error getting practice task:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit task solution
router.post('/practice/submit', authenticateToken, async (req, res) => {
    try {
        const { taskId, solution } = req.body;
        const feedback = generateFeedback(solution);
        const score = evaluateSolution(solution);

        // Update user progress
        await updateUserProgress(req.user.userId, taskId, score);

        res.json({
            success: true,
            feedback,
            score,
            nextSteps: generateNextSteps(score)
        });
    } catch (error) {
        console.error('Error submitting solution:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper functions
function calculateUserLevel(progress) {
    // Calculate user level based on completed tasks and scores
    const totalPoints = progress.completedTasks.reduce((sum, task) => sum + task.score, 0);
    return Math.floor(totalPoints / 1000) + 1;
}

async function getOrCreateUserProject(userId, userLevel) {
    let project = await Project.findOne({ 
        assignedUsers: userId,
        status: 'in_progress'
    });

    if (!project) {
        const template = selectProjectTemplate(userLevel);
        project = await createNewProject(userId, template);
    }

    return project;
}

function selectProjectTemplate(userLevel) {
    // Select appropriate project template based on user level
    return PROJECT_TEMPLATES.chatbot; // For now, always return chatbot project
}

async function createNewProject(userId, template) {
    const project = new Project({
        name: template.name,
        description: template.description,
        difficulty: template.difficulty,
        tasks: template.tasks.map(task => ({
            ...task,
            status: 'pending'
        })),
        assignedUsers: [userId],
        status: 'in_progress',
        createdAt: new Date()
    });

    await project.save();
    return project;
}

function selectNextTask(project, userLevel) {
    // Select next appropriate task based on user level and project progress
    return project.tasks.find(task => task.status === 'pending');
}

function generateFeedback(solution) {
    let feedback = [];
    
    // Check solution against feedback patterns
    for (const [key, pattern] of Object.entries(FEEDBACK_PATTERNS)) {
        if (pattern.pattern.test(solution)) {
            feedback.push(pattern.feedback);
        }
    }

    return feedback.length > 0 ? feedback : ["Good work! Keep practicing to improve your skills."];
}

function evaluateSolution(solution) {
    // Evaluate solution quality (simplified scoring)
    let score = 70; // Base score
    
    // Add points for code quality indicators
    if (solution.includes('//')) score += 10; // Comments
    if (/^function/.test(solution)) score += 10; // Function definition
    if (solution.includes('try')) score += 10; // Error handling

    return Math.min(score, 100);
}

function generateNextSteps(score) {
    if (score >= 90) {
        return "Great job! You're ready for more challenging tasks.";
    } else if (score >= 70) {
        return "Good progress! Try adding more comments and error handling.";
    } else {
        return "Keep practicing! Focus on code structure and naming conventions.";
    }
}

module.exports = router; 