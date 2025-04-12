const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const CloudDeploymentService = require('../services/cloud-deployment');

// Initialize cloud deployment service
const cloudDeploymentService = new CloudDeploymentService({
    // Config options would be loaded from environment variables in production
});

/**
 * Deploy a project to a cloud platform
 * Requires admin privileges
 */
router.post('/deploy', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { platform, repoUrl, projectName, environment, awsService, teamId } = req.body;
        
        if (!platform || !repoUrl || !projectName || !environment) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        const result = await cloudDeploymentService.deployProject({
            platform,
            repoUrl,
            projectName,
            environment,
            awsService,
            teamId,
        });
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json({ message: 'Deployment failed', error: result.error });
        }
    } catch (error) {
        console.error('Error in deploy:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Get deployment status
 * Requires authentication
 */
router.get('/status/:deploymentId', authenticateToken, async (req, res) => {
    try {
        const { deploymentId } = req.params;
        
        if (!deploymentId) {
            return res.status(400).json({ message: 'Deployment ID is required' });
        }
        
        const result = await cloudDeploymentService.getDeploymentStatus(deploymentId);
        res.json(result);
    } catch (error) {
        console.error('Error in get deployment status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Get deployment logs
 * Requires admin privileges
 */
router.get('/logs', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { projectName } = req.query;
        const logs = cloudDeploymentService.getDeploymentLogs(projectName);
        res.json(logs);
    } catch (error) {
        console.error('Error in get deployment logs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Configure continuous deployment
 * Requires admin privileges
 */
router.post('/configure-cd', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { platform, repoUrl, projectName, environment, branch } = req.body;
        
        if (!platform || !repoUrl || !projectName || !environment) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        const result = await cloudDeploymentService.configureContinuousDeployment({
            platform,
            repoUrl,
            projectName,
            environment,
            branch,
        });
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json({ message: 'Failed to configure continuous deployment', error: result.error });
        }
    } catch (error) {
        console.error('Error in configure-cd:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Get supported deployment platforms
 * Public endpoint
 */
router.get('/platforms', async (req, res) => {
    try {
        // Return list of supported platforms with their features
        res.json([
            {
                id: 'vercel',
                name: 'Vercel',
                description: 'Optimal for frontend applications and static sites',
                features: ['Preview Deployments', 'Serverless Functions', 'Edge Network'],
                bestFor: ['React', 'Next.js', 'Vue', 'Nuxt', 'Angular'],
                logo: 'https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png',
            },
            {
                id: 'netlify',
                name: 'Netlify',
                description: 'Great for JAMstack applications',
                features: ['Continuous Deployment', 'Serverless Functions', 'Form Handling'],
                bestFor: ['Static Sites', 'Gatsby', 'Hugo', 'Jekyll'],
                logo: 'https://www.netlify.com/img/press/logos/logomark.png',
            },
            {
                id: 'heroku',
                name: 'Heroku',
                description: 'Easy deployment for web applications',
                features: ['Managed Runtime', 'Add-ons Marketplace', 'GitHub Integration'],
                bestFor: ['Node.js', 'Ruby', 'Python', 'Java', 'PHP'],
                logo: 'https://brand.heroku.com/static/media/heroku-logotype-vertical.f7e1193f.svg',
            },
            {
                id: 'aws',
                name: 'AWS',
                description: 'Comprehensive cloud services platform',
                features: ['Elastic Beanstalk', 'Lambda', 'Amplify', 'EC2', 'S3'],
                bestFor: ['Enterprise Applications', 'Microservices', 'Serverless'],
                logo: 'https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png',
            },
        ]);
    } catch (error) {
        console.error('Error in get platforms:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Get deployment environments
 * Public endpoint
 */
router.get('/environments', async (req, res) => {
    try {
        // Return list of supported environments
        res.json([
            {
                id: 'development',
                name: 'Development',
                description: 'For testing new features and changes',
                icon: 'code',
            },
            {
                id: 'staging',
                name: 'Staging',
                description: 'Pre-production environment for final testing',
                icon: 'vial',
            },
            {
                id: 'production',
                name: 'Production',
                description: 'Live environment for end users',
                icon: 'rocket',
            },
        ]);
    } catch (error) {
        console.error('Error in get environments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
