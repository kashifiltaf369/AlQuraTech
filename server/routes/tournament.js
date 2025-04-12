const express = require('express');
const router = express.Router();
const Tournament = require('../models/tournament');
const { authenticateToken } = require('../middleware/auth');

// Get active tournaments
router.get('/tournaments', authenticateToken, async (req, res) => {
    try {
        const { category, status } = req.query;
        const query = {};
        
        if (category) query.category = category;
        if (status) query.status = status;
        
        const tournaments = await Tournament.find(query)
            .select('name description category startDate endDate status prizePool')
            .sort({ startDate: -1 });
        
        res.json(tournaments);
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get tournament details with leaderboard
router.get('/tournaments/:id', authenticateToken, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.id)
            .populate('participants.user', 'username avatar level');
        
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        
        // Calculate current rankings
        await tournament.calculateRankings();
        
        res.json(tournament);
    } catch (error) {
        console.error('Error fetching tournament details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Join tournament
router.post('/tournaments/:id/join', authenticateToken, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        
        if (tournament.status !== 'upcoming' && tournament.status !== 'active') {
            return res.status(400).json({ message: 'Tournament is not open for registration' });
        }
        
        // Check if user already joined
        const existingParticipant = tournament.participants.find(
            p => p.user.toString() === req.user.userId
        );
        
        if (existingParticipant) {
            return res.status(400).json({ message: 'Already registered for this tournament' });
        }
        
        // Add user to participants
        tournament.participants.push({
            user: req.user.userId,
            totalScore: 0,
            rank: tournament.participants.length + 1,
            submissions: []
        });
        
        await tournament.save();
        res.json({ message: 'Successfully joined tournament' });
    } catch (error) {
        console.error('Error joining tournament:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit solution
router.post('/tournaments/:id/submit', authenticateToken, async (req, res) => {
    try {
        const { challengeIndex, code, language } = req.body;
        const tournament = await Tournament.findById(req.params.id);
        
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        
        const participant = tournament.participants.find(
            p => p.user.toString() === req.user.userId
        );
        
        if (!participant) {
            return res.status(400).json({ message: 'Not registered for this tournament' });
        }
        
        // Create submission
        const submission = {
            challengeIndex,
            code,
            language,
            status: 'pending',
            submittedAt: new Date()
        };
        
        // Evaluate submission
        const { score, feedback } = tournament.evaluateSubmission({
            challengeIndex,
            code,
            language
        });
        
        submission.score = score;
        submission.feedback = feedback;
        submission.status = 'completed';
        
        // Update participant's submissions and total score
        participant.submissions.push(submission);
        participant.totalScore = participant.submissions.reduce(
            (total, sub) => total + (sub.score || 0),
            0
        );
        
        // Recalculate rankings
        await tournament.calculateRankings();
        
        res.json({
            score,
            feedback,
            rank: participant.rank,
            totalScore: participant.totalScore
        });
    } catch (error) {
        console.error('Error submitting solution:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get leaderboard
router.get('/tournaments/:id/leaderboard', authenticateToken, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('participants.user', 'username avatar level')
            .select('participants');
        
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        
        // Sort participants by score and get top 100
        const leaderboard = tournament.participants
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 100)
            .map((p, index) => ({
                rank: index + 1,
                username: p.user.username,
                avatar: p.user.avatar,
                level: p.user.level,
                totalScore: p.totalScore,
                submissionCount: p.submissions.length
            }));
        
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get AI insights for a participant
router.get('/tournaments/:id/insights', authenticateToken, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        const participant = tournament.participants.find(
            p => p.user.toString() === req.user.userId
        );
        
        if (!participant) {
            return res.status(400).json({ message: 'Not registered for this tournament' });
        }
        
        // Generate insights based on submissions
        const insights = generateInsights(participant.submissions);
        
        res.json(insights);
    } catch (error) {
        console.error('Error generating insights:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function to generate insights
function generateInsights(submissions) {
    const insights = {
        strengths: [],
        weaknesses: [],
        recommendations: []
    };
    
    // Analyze code quality patterns
    const codeQualityScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / 
        (submissions.length || 1);
    
    if (codeQualityScore >= 80) {
        insights.strengths.push('Consistently high code quality');
    } else if (codeQualityScore < 60) {
        insights.weaknesses.push('Code quality needs improvement');
        insights.recommendations.push('Focus on code structure and documentation');
    }
    
    // Analyze submission patterns
    const averageTime = submissions.reduce((sum, sub) => {
        return sum + (sub.executionTime || 0);
    }, 0) / (submissions.length || 1);
    
    if (averageTime < 1000) {
        insights.strengths.push('Efficient code execution');
    } else {
        insights.weaknesses.push('Code performance could be improved');
        insights.recommendations.push('Work on optimizing algorithmic efficiency');
    }
    
    // Language proficiency
    const languageCounts = submissions.reduce((counts, sub) => {
        counts[sub.language] = (counts[sub.language] || 0) + 1;
        return counts;
    }, {});
    
    const primaryLanguage = Object.entries(languageCounts)
        .sort((a, b) => b[1] - a[1])[0];
    
    insights.strengths.push(`Strong ${primaryLanguage[0]} programming skills`);
    
    return insights;
}

module.exports = router; 