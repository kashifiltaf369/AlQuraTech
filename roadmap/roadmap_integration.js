// Roadmap Integration with GitHub Repository
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/content';

const roadmapTypes = {
    frontend: 'frontend.md',
    backend: 'backend.md',
    devops: 'devops.md',
    android: 'android.md',
    ios: 'ios.md',
    blockchain: 'blockchain.md',
    qa: 'qa.md',
    'software-architect': 'software-architect.md',
    'software-design-architect': 'software-design-architect.md'
};

class RoadmapIntegration {
    constructor() {
        this.cachedRoadmaps = new Map();
    }

    async fetchRoadmap(type) {
        if (this.cachedRoadmaps.has(type)) {
            return this.cachedRoadmaps.get(type);
        }

        try {
            const response = await fetch(`${GITHUB_RAW_BASE}/${roadmapTypes[type]}`);
            if (!response.ok) throw new Error('Failed to fetch roadmap');
            
            const content = await response.text();
            const roadmap = this.parseMarkdown(content);
            this.cachedRoadmaps.set(type, roadmap);
            return roadmap;
        } catch (error) {
            console.error(`Error fetching roadmap: ${error}`);
            return null;
        }
    }

    parseMarkdown(content) {
        const lines = content.split('\n');
        const roadmap = {
            title: '',
            description: '',
            milestones: [],
            resources: []
        };

        let currentMilestone = null;
        let currentSubtask = null;

        for (const line of lines) {
            if (!line.trim() || line.startsWith('![')) continue;

            if (line.startsWith('# ')) {
                roadmap.title = line.substring(2).trim();
                continue;
            }

            if (line.startsWith('>')) {
                roadmap.description = line.substring(1).trim();
                continue;
            }

            if (line.startsWith('## ')) {
                if (currentMilestone) {
                    roadmap.milestones.push(currentMilestone);
                }
                currentMilestone = {
                    id: this.generateId(line.substring(3).trim()),
                    title: line.substring(3).trim(),
                    description: '',
                    subtasks: [],
                    status: 'pending'
                };
                continue;
            }

            if (line.startsWith('### ')) {
                if (currentSubtask) {
                    currentMilestone.subtasks.push(currentSubtask);
                }
                currentSubtask = {
                    id: this.generateId(line.substring(4).trim()),
                    title: line.substring(4).trim(),
                    description: '',
                    resources: []
                };
                continue;
            }

            if (line.startsWith('- ')) {
                const resource = this.parseResource(line.substring(2).trim());
                if (currentSubtask) {
                    currentSubtask.resources.push(resource);
                } else {
                    roadmap.resources.push(resource);
                }
                continue;
            }

            if (currentSubtask && line.trim()) {
                currentSubtask.description += line.trim() + ' ';
            } else if (currentMilestone && line.trim()) {
                currentMilestone.description += line.trim() + ' ';
            }
        }

        if (currentSubtask && currentMilestone) {
            currentMilestone.subtasks.push(currentSubtask);
        }
        if (currentMilestone) {
            roadmap.milestones.push(currentMilestone);
        }

        return roadmap;
    }

    parseResource(line) {
        const urlMatch = line.match(/\[(.*?)\]\((.*?)\)/);
        if (urlMatch) {
            const [, title, url] = urlMatch;
            const description = line.replace(`[${title}](${url})`, '').trim();
            return {
                type: 'resource',
                title,
                url,
                description,
                cost: description.toLowerCase().includes('free') ? 'free' : 'paid'
            };
        }
        return {
            type: 'resource',
            title: line,
            description: '',
            cost: 'free'
        };
    }

    generateId(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    async generatePersonalizedRoadmap(userProfile) {
        const roadmaps = await Promise.all(
            Object.keys(roadmapTypes).map(type => this.fetchRoadmap(type))
        );

        const validRoadmaps = roadmaps.filter(roadmap => roadmap !== null);
        let bestMatch = null;
        let bestScore = -1;

        for (const roadmap of validRoadmaps) {
            const score = this.calculateMatchScore(roadmap, userProfile);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = roadmap;
            }
        }

        if (!bestMatch) {
            throw new Error('No suitable roadmap found');
        }

        return this.adjustRoadmapDifficulty(bestMatch, userProfile.experience_level);
    }

    calculateMatchScore(roadmap, userProfile) {
        const skillMatch = this.calculateSkillMatch(roadmap, userProfile.skills);
        const interestMatch = this.calculateInterestMatch(roadmap, userProfile.interests);
        const keywordMatch = this.calculateKeywordMatch(roadmap, userProfile.career_goals);

        return (skillMatch * 0.4) + (interestMatch * 0.3) + (keywordMatch * 0.3);
    }

    calculateSkillMatch(roadmap, userSkills) {
        const requiredSkills = new Set(roadmap.milestones.flatMap(m => 
            m.subtasks.flatMap(s => s.resources.map(r => r.title))
        ));
        const userSkillSet = new Set(userSkills);
        return this.calculateSetOverlap(userSkillSet, requiredSkills);
    }

    calculateInterestMatch(roadmap, userInterests) {
        const roadmapKeywords = new Set(roadmap.milestones.flatMap(m => 
            m.subtasks.flatMap(s => s.resources.map(r => r.title))
        ));
        const userInterestSet = new Set(userInterests);
        return this.calculateSetOverlap(userInterestSet, roadmapKeywords);
    }

    calculateKeywordMatch(roadmap, careerGoals) {
        const roadmapKeywords = new Set(roadmap.milestones.flatMap(m => 
            m.subtasks.flatMap(s => s.resources.map(r => r.title))
        ));
        const goalKeywords = new Set(careerGoals.flatMap(goal => 
            goal.toLowerCase().split(' ').filter(word => word.length > 2)
        ));
        return this.calculateSetOverlap(goalKeywords, roadmapKeywords);
    }

    calculateSetOverlap(set1, set2) {
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        return intersection.size / Math.max(set1.size, set2.size);
    }

    adjustRoadmapDifficulty(roadmap, experienceLevel) {
        const difficultyMultiplier = {
            'beginner': 0.7,
            'intermediate': 1.0,
            'advanced': 1.3
        }[experienceLevel] || 1.0;

        const adjustedRoadmap = JSON.parse(JSON.stringify(roadmap));

        for (const milestone of adjustedRoadmap.milestones) {
            if (milestone.estimated_hours) {
                milestone.estimated_hours = Math.round(milestone.estimated_hours * difficultyMultiplier);
            }
            if (milestone.complexity) {
                milestone.complexity = Math.min(5, Math.round(milestone.complexity * difficultyMultiplier));
            }
        }

        return adjustedRoadmap;
    }
}

// Export the integration class
window.RoadmapIntegration = RoadmapIntegration; 