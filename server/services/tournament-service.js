 const { CodeTokenizer, ASTParser } = require('code-analyzer');
const { v4: uuidv4 } = require('uuid');
const natural = require('natural');
const axios = require('axios');
const similarity = require('code-similarity');
const AICore = require('./ai-core');

class TournamentService {
    constructor() {
        this.activeTournaments = new Map();
        this.tokenizer = new natural.WordTokenizer();
        this.tfidf = new natural.TfIdf();
        this.codeCache = new Set();
        this.ai = new AICore();
        this.evaluationPipeline = this.createEvaluationPipeline();
    }

    async createTournament(config) {
        const tournamentId = uuidv4();
        const tournament = {
            id: tournamentId,
            name: config.name,
            difficulty: config.difficulty || 'intermediate',
            problemSet: await this.generateProblems(config),
            participants: new Map(),
            rankings: [],
            startTime: new Date(),
            endTime: new Date(Date.now() + config.duration * 60 * 60 * 1000)
        };
        
        this.activeTournaments.set(tournamentId, tournament);
        return tournament;
    }

    async generateProblems(config) {
        const aiPrompt = `Generate ${config.problemCount} coding problems covering:
        - ${config.technologies.join(', ')}
        - Difficulty: ${config.difficulty}
        - Focus areas: ${config.focusAreas.join(', ')}
        Include test cases and optimal solutions.`;

        try {
            const response = await axios.post('https://api.openai.com/v1/engines/code-davinci-002/completions', {
                prompt: aiPrompt,
                max_tokens: 2000,
                temperature: 0.7
            }, {
                headers: { Authorization: `Bearer ${process.env.OPENAI_KEY}` }
            });

            return this.parseProblems(response.data.choices[0].text);
        } catch (error) {
            console.error('Problem generation failed:', error);
            return [];
        }
    }

    parseProblems(rawText) {
        // AI-generated problem parsing logic
        return rawText.split('\n\n').map(problemText => ({
            id: uuidv4(),
            description: problemText.split('\n')[0],
            starterCode: this.extractCodeBlocks(problemText),
            testCases: this.extractTestCases(problemText),
            optimalSolution: this.extractOptimalSolution(problemText)
        }));
    }

    assessCorrectness(code, testResults) {
        const passedTests = testResults.filter(t => t.passed).length;
        const totalTests = testResults.length;
        const baseScore = (passedTests / totalTests) * 100;
        
        // Penalize hardcoded answers
        const hardcodingPenalty = this.detectHardcoding(code) ? 0.7 : 1;
        return baseScore * hardcodingPenalty;
    }

    analyzeEfficiency(code) {
        const ast = ASTParser.parse(code);
        let complexityScore = 100;
        
        // Detect time complexity patterns
        ast.traverse(node => {
            if (node.type === 'NestedLoop') complexityScore *= 0.8;
            if (node.type === 'RecursiveCall') complexityScore *= 0.85;
        });
        
        // Benchmark runtime
        const benchmarkResult = this.runBenchmark(code);
        return Math.min(complexityScore, (benchmarkResult?.efficiencyScore));
    }

    assessCodeQuality(code) {
        const metrics = {
            maintainability: this.calculateMaintainabilityIndex(code),
            security: this.detectSecurityIssues(code),
            readability: this.calculateReadabilityScore(code)
        };
        return metrics.maintainability * 0.5 + metrics.security * 0.3 + metrics.readability * 0.2;
    }

    checkOriginality(code) {
        const codeVector = this.tfidf.tfidf(code);
        let similarityScores = [];
        
        this.codeCache.forEach(cachedCode => {
            const cachedVector = this.tfidf.tfidf(cachedCode);
            similarityScores.push(similarity.cosine(codeVector, cachedVector));
        });
        
        this.codeCache.add(code);
        return Math.max(0, 1 - Math.max(...similarityScores));
    }

    calculateScore(analysis) {
        const weights = {
            correctness: 0.6,
            efficiency: 0.2,
            quality: 0.15,
            originality: 0.05
        };
        
        return Object.entries(weights).reduce((sum, [key, weight]) => (
            sum + (analysis[key] * weight)
        ), 0);
    }

    async generateFeedback(analysis) {
        const feedbackPrompt = `Generate coding feedback considering:
        - Correctness: ${analysis.correctness}/100
        - Efficiency: ${analysis.efficiency}/100
        - Code Quality: ${analysis.quality}/100
        - Originality: ${analysis.originality}/100
        Provide specific improvement suggestions.`;
        
        return this.queryAI(feedbackPrompt);
    }

    createEvaluationPipeline() {
        return [
            this.ai.analyzeCodeStructure.bind(this.ai),
            this.ai.generateFeedback.bind(this.ai)
        ];
    }

    async evaluateSubmission(submission) {
        const analysis = {
            correctness: this.assessCorrectness(submission.code, submission.testResults),
            efficiency: this.analyzeEfficiency(submission.code),
            quality: this.assessCodeQuality(submission.code),
            originality: this.checkOriginality(submission.code)
        };

        return {
            ...submission,
            score: this.calculateScore(analysis),
            analysis,
            aiFeedback: await this.generateFeedback(analysis)
        };
    }

    // Helper methods for code analysis would go here
}

module.exports = TournamentService;
