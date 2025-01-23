import requests
from bs4 import BeautifulSoup
import json
import os

FEATURE_GATES_PATH = 'app/utils/feature-gate/featureGates.json'

def parse_wiki():
    url = "https://github.com/anza-xyz/agave/wiki/Feature-Gate-Tracker-Schedule"
    proposals_url = "https://github.com/solana-foundation/solana-improvement-documents/tree/main/proposals"
    
    # Get main wiki page
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Get proposals directory listing
    proposals_response = requests.get(proposals_url)
    proposals_soup = BeautifulSoup(proposals_response.text, 'html.parser')
    proposal_files = [a.find('a')['title'] for a in proposals_soup.find_all('tr', {'class': 'react-directory-row'}) 
                     if a.find('a') and a.find('a')['title'].startswith(tuple('0123456789')) 
                     and len(a.find('a')['title'].split('-')[0]) == 4 
                     and a.find('a')['title'].endswith('.md')]
    
    features = []
    
    # Parse all feature tables
    tables = soup.find_all('table')
    for table in tables[1:]: # Skip first table
        if 'Pending' in table.find_previous('h3').text:
            for row in table.find_all('tr')[1:]:  # Skip header
                cols = [col.get_text(strip=True) for col in row.find_all('td')]
                if len(cols) >= 6:
                    simd = cols[1].strip() if cols[1].strip() != 'v2.0.0' else None
                    
                    # Find matching proposal file if SIMD exists
                    simd_link = None
                    if simd and simd.isdigit():
                        simd_prefix = simd.zfill(4)
                        matching_files = [f for f in proposal_files if f.startswith(simd_prefix)]
                        if matching_files:
                            simd_link = f"https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/{matching_files[0]}"
                    
                    feature = {
                        "key": cols[0],
                        "simd": str(int(simd)) if simd and simd.isdigit() else "",
                        "version": cols[2],
                        "testnetActivationEpoch": int(cols[3]) if cols[3].isdigit() else None,
                        "devnetActivationEpoch": int(cols[4]) if cols[4].isdigit() else None,
                        # Has to be updated via script
                        "mainnetActivationEpoch": None,
                        "title": cols[5],
                        # Has to be manually updated
                        "description": None,
                        "simd_link": simd_link
                    }
                    
                    # Generate enhanced description
                    features.append(feature)
    

    # Load existing features if file exists
    existing_features = []
    if os.path.exists(FEATURE_GATES_PATH):
        with open(FEATURE_GATES_PATH, 'r') as f:
            existing_features = json.load(f)
    
    # Update existing features and add new ones
    features_by_key = {f['key']: f for f in features}
    for i, existing in enumerate(existing_features):
        if existing['key'] in features_by_key:
            # Only update devnet and testnet epochs
            new_feature = features_by_key[existing['key']]
            existing_features[i]['devnetActivationEpoch'] = new_feature['devnetActivationEpoch']
            existing_features[i]['testnetActivationEpoch'] = new_feature['testnetActivationEpoch']
            del features_by_key[existing['key']]
    
    new_features = list(features_by_key.values())
    if len(new_features) > 0:
        print("New features:")
        for f in new_features:
            print(f"{f['key']} - {f['title']}")
    
    # Combine existing and new features
    all_features = existing_features + new_features
    
    with open(FEATURE_GATES_PATH, 'w') as f:
        json.dump(all_features, f, indent=2)

if __name__ == "__main__":
    parse_wiki() 