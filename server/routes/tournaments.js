const express = require('express');
const router = express.Router();
const TournamentService = require('../services/tournament-service');
const tournamentService = new TournamentService();

// Create new tournament
router.post('/create', async (req, res) => {
    try {
        const tournament = await tournamentService.createTournament(req.body);
        res.json(tournament);
    } catch (error) {
        res.status(500).json({ error: 'Tournament creation failed' });
    }
});

// Submit solution
router.post('/submit', async (req, res) => {
    try {
        const result = await tournamentService.evaluateSubmission(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Submission evaluation failed' });
    }
});

// Get rankings
router.get('/rankings/:tournamentId', async (req, res) => {
    try {
        const rankings = tournamentService.getRankings(req.params.tournamentId);
        res.json(rankings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get rankings' });
    }
});

module.exports = router;
