from flask import Flask, request, jsonify
from roadmap_generator import RoadmapGenerator, UserProfile
import json
from typing import Dict, List

app = Flask(__name__)
roadmap_generator = RoadmapGenerator()

@app.route('/api/roadmap/generate', methods=['POST'])
def generate_roadmap():
    try:
        data = request.get_json()
        
        # Create user profile from request data
        user_profile = UserProfile(
            skills=data.get('skills', []),
            interests=data.get('interests', []),
            career_goals=data.get('career_goals', []),
            experience_level=data.get('experience_level', 'beginner'),
            preferred_tech_stack=data.get('preferred_tech_stack', [])
        )
        
        # Generate personalized roadmap
        roadmap = roadmap_generator.generate_roadmap(user_profile)
        
        return jsonify({
            'status': 'success',
            'roadmap': roadmap
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@app.route('/api/roadmap/update', methods=['POST'])
def update_roadmap():
    try:
        data = request.get_json()
        current_roadmap = data.get('current_roadmap')
        progress_data = data.get('progress_data')
        
        if not current_roadmap or not progress_data:
            raise ValueError("Missing required data")
        
        # Update roadmap based on progress
        updated_roadmap = roadmap_generator.update_roadmap(current_roadmap, progress_data)
        
        return jsonify({
            'status': 'success',
            'roadmap': updated_roadmap
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@app.route('/api/roadmap/templates', methods=['GET'])
def get_templates():
    """Get list of available roadmap templates."""
    try:
        templates = roadmap_generator.templates
        return jsonify({
            'status': 'success',
            'templates': list(templates.keys())
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000) 