import requests
import json
import os
from typing import Dict, List
import re

class RoadmapFetcher:
    def __init__(self):
        self.base_url = "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master"
        self.roadmaps = {
            "frontend": "content/frontend.md",
            "backend": "content/backend.md",
            "devops": "content/devops.md",
            "android": "content/android.md",
            "ios": "content/ios.md",
            "blockchain": "content/blockchain.md",
            "qa": "content/qa.md",
            "software-architect": "content/software-architect.md",
            "software-design-architect": "content/software-design-architect.md"
        }
        
    def fetch_roadmap(self, roadmap_type: str) -> Dict:
        """Fetch roadmap content from GitHub and convert to structured format."""
        if roadmap_type not in self.roadmaps:
            raise ValueError(f"Unknown roadmap type: {roadmap_type}")
            
        url = f"{self.base_url}/{self.roadmaps[roadmap_type]}"
        response = requests.get(url)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch roadmap: {response.status_code}")
            
        content = response.text
        return self._parse_markdown(content)
    
    def _parse_markdown(self, content: str) -> Dict:
        """Parse markdown content into structured roadmap format."""
        lines = content.split('\n')
        roadmap = {
            "title": "",
            "description": "",
            "milestones": [],
            "resources": []
        }
        
        current_milestone = None
        current_subtask = None
        
        for line in lines:
            # Skip empty lines and images
            if not line.strip() or line.startswith('![') or line.startswith('!['):
                continue
                
            # Parse title
            if line.startswith('# '):
                roadmap["title"] = line[2:].strip()
                continue
                
            # Parse description
            if line.startswith('>'):
                roadmap["description"] = line[1:].strip()
                continue
                
            # Parse milestones
            if line.startswith('## '):
                if current_milestone:
                    roadmap["milestones"].append(current_milestone)
                current_milestone = {
                    "id": self._generate_id(line[3:].strip()),
                    "title": line[3:].strip(),
                    "description": "",
                    "subtasks": [],
                    "status": "pending"
                }
                continue
                
            # Parse subtasks
            if line.startswith('### '):
                if current_subtask:
                    current_milestone["subtasks"].append(current_subtask)
                current_subtask = {
                    "id": self._generate_id(line[4:].strip()),
                    "title": line[4:].strip(),
                    "description": "",
                    "resources": []
                }
                continue
                
            # Parse resources
            if line.startswith('- '):
                resource = self._parse_resource(line[2:].strip())
                if current_subtask:
                    current_subtask["resources"].append(resource)
                else:
                    roadmap["resources"].append(resource)
                continue
                
            # Add description to current milestone or subtask
            if current_subtask and line.strip():
                current_subtask["description"] += line.strip() + " "
            elif current_milestone and line.strip():
                current_milestone["description"] += line.strip() + " "
        
        # Add last milestone and subtask
        if current_subtask and current_milestone:
            current_milestone["subtasks"].append(current_subtask)
        if current_milestone:
            roadmap["milestones"].append(current_milestone)
            
        return roadmap
    
    def _parse_resource(self, line: str) -> Dict:
        """Parse resource line into structured format."""
        # Extract URL if present
        url_match = re.search(r'\[(.*?)\]\((.*?)\)', line)
        if url_match:
            title = url_match.group(1)
            url = url_match.group(2)
            description = line.replace(f'[{title}]({url})', '').strip()
            return {
                "type": "resource",
                "title": title,
                "url": url,
                "description": description,
                "cost": "free" if "free" in description.lower() else "paid"
            }
        return {
            "type": "resource",
            "title": line,
            "description": "",
            "cost": "free"
        }
    
    def _generate_id(self, text: str) -> str:
        """Generate a unique ID from text."""
        return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
    
    def save_roadmap(self, roadmap: Dict, roadmap_type: str):
        """Save roadmap to JSON file."""
        output_dir = os.path.join(os.path.dirname(__file__), 'static', 'templates')
        os.makedirs(output_dir, exist_ok=True)
        
        output_file = os.path.join(output_dir, f'{roadmap_type}.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(roadmap, f, indent=4, ensure_ascii=False) 