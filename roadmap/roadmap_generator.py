import json
import os
from typing import Dict, List, Optional
from dataclasses import dataclass
import numpy as np
from transformers import pipeline

@dataclass
class UserProfile:
    skills: List[str]
    interests: List[str]
    career_goals: List[str]
    experience_level: str
    preferred_tech_stack: List[str]

class RoadmapGenerator:
    def __init__(self):
        # Load static templates from JSON
        self.templates = self._load_templates()
        # Initialize lightweight sentiment analysis for interest matching
        self.sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
        
    def _load_templates(self) -> Dict:
        """Load predefined roadmap templates from JSON files."""
        templates_path = os.path.join(os.path.dirname(__file__), 'static', 'templates')
        templates = {}
        for filename in os.listdir(templates_path):
            if filename.endswith('.json'):
                with open(os.path.join(templates_path, filename), 'r') as f:
                    templates[filename.replace('.json', '')] = json.load(f)
        return templates

    def _calculate_interest_match(self, user_interests: List[str], template_keywords: List[str]) -> float:
        """Calculate interest match score using lightweight sentiment analysis."""
        if not user_interests or not template_keywords:
            return 0.0
        
        # Use simple keyword matching for efficiency
        matches = sum(1 for interest in user_interests 
                     if any(keyword.lower() in interest.lower() 
                           for keyword in template_keywords))
        return matches / len(user_interests)

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text for better matching."""
        # Simple keyword extraction - can be enhanced with NLP if needed
        words = text.lower().split()
        stop_words = {'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'}
        return [word for word in words if word not in stop_words and len(word) > 2]

    def _adjust_difficulty(self, template: Dict, user_level: str) -> Dict:
        """Adjust roadmap difficulty based on user experience level."""
        difficulty_mapping = {
            'beginner': 0.7,
            'intermediate': 1.0,
            'advanced': 1.3
        }
        
        multiplier = difficulty_mapping.get(user_level, 1.0)
        adjusted_template = template.copy()
        
        # Adjust time estimates and complexity
        for milestone in adjusted_template['milestones']:
            if 'estimated_hours' in milestone:
                milestone['estimated_hours'] = int(milestone['estimated_hours'] * multiplier)
            if 'complexity' in milestone:
                milestone['complexity'] = min(5, int(milestone['complexity'] * multiplier))
        
        return adjusted_template

    def generate_roadmap(self, user_profile: UserProfile) -> Dict:
        """Generate personalized roadmap based on user profile."""
        best_match = None
        best_score = -1
        
        # Extract keywords from user profile
        user_keywords = set()
        for goal in user_profile.career_goals:
            user_keywords.update(self._extract_keywords(goal))
        for interest in user_profile.interests:
            user_keywords.update(self._extract_keywords(interest))
        
        # Find best matching template
        for template_name, template in self.templates.items():
            # Calculate match score based on multiple factors
            skill_match = len(set(user_profile.skills) & set(template.get('required_skills', []))) / max(len(template.get('required_skills', [])), 1)
            interest_match = self._calculate_interest_match(list(user_keywords), template.get('keywords', []))
            
            # Extract keywords from template title and description
            template_keywords = set()
            template_keywords.update(self._extract_keywords(template.get('title', '')))
            template_keywords.update(self._extract_keywords(template.get('description', '')))
            
            # Calculate keyword overlap
            keyword_match = len(user_keywords & template_keywords) / max(len(user_keywords), 1)
            
            # Weighted scoring
            total_score = (skill_match * 0.4) + (interest_match * 0.3) + (keyword_match * 0.3)
            
            if total_score > best_score:
                best_score = total_score
                best_match = template_name
        
        if not best_match:
            raise ValueError("No suitable roadmap template found")
        
        # Get and adjust the best matching template
        roadmap = self.templates[best_match].copy()
        roadmap = self._adjust_difficulty(roadmap, user_profile.experience_level)
        
        # Add personalization metadata
        roadmap['personalization'] = {
            'match_score': best_score,
            'generated_for': {
                'skills': user_profile.skills,
                'interests': user_profile.interests,
                'career_goals': user_profile.career_goals,
                'experience_level': user_profile.experience_level,
                'preferred_tech_stack': user_profile.preferred_tech_stack
            }
        }
        
        return roadmap

    def update_roadmap(self, current_roadmap: Dict, progress_data: Dict) -> Dict:
        """Update roadmap based on user progress."""
        updated_roadmap = current_roadmap.copy()
        
        # Update milestone statuses
        for milestone in updated_roadmap['milestones']:
            milestone_id = milestone['id']
            if milestone_id in progress_data:
                milestone['status'] = progress_data[milestone_id]['status']
                if 'completion_date' in progress_data[milestone_id]:
                    milestone['completion_date'] = progress_data[milestone_id]['completion_date']
        
        # Recalculate estimated completion time
        total_completed = sum(1 for m in updated_roadmap['milestones'] 
                            if m['status'] == 'completed')
        total_milestones = len(updated_roadmap['milestones'])
        
        if total_milestones > 0:
            progress_percentage = (total_completed / total_milestones) * 100
            updated_roadmap['progress'] = {
                'percentage': progress_percentage,
                'completed_milestones': total_completed,
                'total_milestones': total_milestones
            }
        
        return updated_roadmap 