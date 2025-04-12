const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const GitHubIntegrationService = require('../services/github-integration');

// Initialize GitHub integration service with config from environment variables
// In production, these would be securely stored in environment variables
const githubIntegrationService = new GitHubIntegrationService({
    githubToken: process.env.GITHUB_TOKEN || 'demo_token',
    owner: process.env.GITHUB_OWNER || 'skillcrafters-org',
});

/**
 * Initialize a new GitHub repository for a project
 * Requires admin privileges
 */
router.post('/initialize-repo', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { projectName, description, isPrivate } = req.body;
        
        if (!projectName) {
            return res.status(400).json({ message: 'Project name is required' });
        }
        
        // Convert project name to a valid repository name
        const repoName = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        const result = await githubIntegrationService.initializeRepository({
            repoName,
            description: description || `${projectName} - A collaborative project on SkillCrafters`,
            isPrivate: isPrivate || false,
        });
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json({ message: 'Failed to initialize repository', error: result.error });
        }
    } catch (error) {
        console.error('Error in initialize-repo:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Submit a contribution to a project
 * Requires user authentication
 */
router.post('/submit-contribution', authenticateToken, async (req, res) => {
    try {
        const { repoName, taskId, files, commitMessage } = req.body;
        const userId = req.user.userId;
        
        if (!repoName || !taskId || !files || !commitMessage) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        const result = await githubIntegrationService.submitContribution({
            repoName,
            userId,
            taskId,
            files,
            commitMessage,
        });
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json({ message: 'Failed to submit contribution', error: result.error });
        }
    } catch (error) {
        console.error('Error in submit-contribution:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Review a pull request with AI
 * Requires admin privileges
 */
router.post('/review-pr', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { repoName, pullNumber } = req.body;
        
        if (!repoName || !pullNumber) {
            return res.status(400).json({ message: 'Repository name and pull request number are required' });
        }
        
        const result = await githubIntegrationService.reviewPullRequest(repoName, pullNumber);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json({ message: 'Failed to review pull request', error: result.error });
        }
    } catch (error) {
        console.error('Error in review-pr:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Integrate and merge a pull request with AI improvements
 * Requires admin privileges
 */
router.post('/integrate-and-merge', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { repoName, pullNumber } = req.body;
        
        if (!repoName || !pullNumber) {
            return res.status(400).json({ message: 'Repository name and pull request number are required' });
        }
        
        const result = await githubIntegrationService.integrateAndMerge(repoName, pullNumber);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json({ message: 'Failed to integrate and merge', error: result.error });
        }
    } catch (error) {
        console.error('Error in integrate-and-merge:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Deploy a project to a cloud platform
 * Requires admin privileges
 */
router.post('/deploy-project', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { repoName, platform, environment } = req.body;
        
        if (!repoName || !platform || !environment) {
            return res.status(400).json({ message: 'Repository name, platform, and environment are required' });
        }
        
        const result = await githubIntegrationService.deployProject(repoName, {
            platform,
            environment,
        });
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json({ message: 'Failed to deploy project', error: result.error });
        }
    } catch (error) {
        console.error('Error in deploy-project:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Get repository details
 * Requires user authentication
 */
router.get('/repo/:repoName', authenticateToken, async (req, res) => {
    try {
        const { repoName } = req.params;
        
        // In a real implementation, this would fetch repository details from GitHub
        // For demo purposes, we'll return mock data
        res.json({
            name: repoName,
            url: `https://github.com/skillcrafters-org/${repoName}`,
            stars: Math.floor(Math.random() * 100),
            forks: Math.floor(Math.random() * 50),
            openIssues: Math.floor(Math.random() * 20),
            lastCommit: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in get repo details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * List all repositories for the organization
 * Requires admin privileges
 */
router.get('/repos', authenticateToken, isAdmin, async (req, res) => {
    try {
        // In a real implementation, this would fetch repositories from GitHub
        // For demo purposes, we'll return mock data
        res.json([
            {
                name: 'web-app-framework',
                url: 'https://github.com/skillcrafters-org/web-app-framework',
                description: 'A modular web application framework with component library',
                stars: 78,
                forks: 23,
            },
            {
                name: 'mobile-api-service',
                url: 'https://github.com/skillcrafters-org/mobile-api-service',
                description: 'RESTful API service for mobile applications with authentication',
                stars: 45,
                forks: 12,
            },
            {
                name: 'data-visualization-tool',
                url: 'https://github.com/skillcrafters-org/data-visualization-tool',
                description: 'Interactive data visualization library with chart components',
                stars: 32,
                forks: 8,
            },
        ]);
    } catch (error) {
        console.error('Error in list repos:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
