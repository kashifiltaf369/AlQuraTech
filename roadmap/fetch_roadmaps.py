from roadmap_fetcher import RoadmapFetcher
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    fetcher = RoadmapFetcher()
    
    for roadmap_type in fetcher.roadmaps.keys():
        try:
            logger.info(f"Fetching {roadmap_type} roadmap...")
            roadmap = fetcher.fetch_roadmap(roadmap_type)
            fetcher.save_roadmap(roadmap, roadmap_type)
            logger.info(f"Successfully saved {roadmap_type} roadmap")
            
            # Add a small delay to avoid rate limiting
            time.sleep(1)
            
        except Exception as e:
            logger.error(f"Error fetching {roadmap_type} roadmap: {str(e)}")

if __name__ == "__main__":
    main() 