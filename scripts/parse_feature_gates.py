import requests
import json
import os
import re

FEATURE_GATES_PATH = 'app/utils/feature-gate/featureGates.json'

def get_markdown_tables(markdown_text):
    """Get all markdown tables from the text"""
    table_pattern = r'\|([^\n]+)\|\n\|(?:[: -]+\|)+\n((?:\|[^\n]+\|\n)*)'
    tables = re.findall(table_pattern, markdown_text)
    return tables


def parse_markdown_tables(table):
    """Parse a markdown table and return list of rows"""
    header_row, content = table

    # Parse header
    headers = [h.strip() for h in header_row.split('|') if h.strip()]
    
    # Parse rows
    rows = []
    for line in content.strip().split('\n'):
        if not line.strip():
            continue
        row_data = [cell.strip() for cell in line.split('|')[1:-1]]  # Skip first and last empty cells
        if row_data:
            row_dict = dict(zip(headers, row_data))
            rows.append(row_dict)
            
    return rows


def get_proposals_data():
    """Fetch SIMD proposals data from GitHub API"""
    proposals_url = "https://api.github.com/repos/solana-foundation/solana-improvement-documents/contents/proposals"
    response = requests.get(proposals_url)
    if response.status_code != 200:
        print(f"Failed to fetch proposals: {response.status_code}")
        return {}
    
    proposals = {}
    for item in response.json():
        if item['name'].endswith('.md') and item['name'][:4].isdigit():
            simd_number = item['name'][:4]
            proposals[simd_number] = item['html_url']
    
    return proposals


def parse_wiki():
    # Fetch markdown content
    url = "https://raw.githubusercontent.com/wiki/anza-xyz/agave/Feature-Gate-Tracker-Schedule.md"
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Failed to fetch wiki: {response.status_code}")
        return
    
    markdown_content = response.text
    tables = get_markdown_tables(markdown_content)
    
    # Get SIMD proposals data
    proposals = get_proposals_data()
    
    features = []
    
    # Parse pending mainnet, devnet and testnet tables (indexes 1, 2 and 3 in the markdown)
    for table_index in [1, 2, 3]:
        rows = parse_markdown_tables(tables[table_index])
        
        for row in rows:
            if len(row) >= 6:  # Ensure we have enough columns
                simd = row['SIMD']
                
                # Clean up SIMD number and find matching proposal
                simd = simd.strip()
                simd_link = None
                if simd and simd.isdigit():
                    simd_number = simd.zfill(4)
                    simd_link = proposals.get(simd_number)
                
                feature = {
                    "key": row['Key'],
                    "simd": row['SIMD'],
                    "version": row['Version'],
                    "testnetActivationEpoch": int(row['Testnet']) if row['Testnet'] and row['Testnet'].isdigit() else None,
                    "devnetActivationEpoch": int(row['Devnet']) if row['Devnet'] and row['Devnet'].isdigit() else None,
                    "mainnetActivationEpoch": None,  # Has to be updated via script
                    "title": row['Description'],
                    "description": None,  # Has to be manually updated
                    "simd_link": simd_link
                }
                
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
    
    # Print new features that were found
    new_features = list(features_by_key.values())
    if new_features:
        print("New features:")
        for f in new_features:
            print(f"{f['key']} - {f['title']}")
    
    # Combine existing and new features
    all_features = existing_features + new_features
    
    # Write updated features to file
    with open(FEATURE_GATES_PATH, 'w') as f:
        json.dump(all_features, f, indent=2)


if __name__ == "__main__":
    parse_wiki() 