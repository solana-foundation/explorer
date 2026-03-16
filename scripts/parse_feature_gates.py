from typing import Annotated, Optional
import asyncio
import requests
import json
import os
import re
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict, ValidationError

from solana.rpc.async_api import AsyncClient
from solders.pubkey import Pubkey

from fetch_mainnet_activations import get_epoch_for_slot

FEATURE_GATES_PATH = 'app/utils/feature-gate/featureGates.json'
DEVNET_RPC_URL = 'https://api.devnet.solana.com'
TESTNET_RPC_URL = 'https://api.testnet.solana.com'

IntOrBlank = Annotated[
    Optional[int],
    BeforeValidator(lambda v: None if v in {'', None} else int(v))
]

# class OldFeature(BaseModel):
#     key: str | None = Field(alias='key', default=None)
#     simd: str | None = Field(alias='simd', default=None)
#     version: str | None = Field(alias='version', default=None)
#     testnetActivationEpoch: IntOrBlank = Field(alias='testnetActivationEpoch', default=None)
#     devnetActivationEpoch: IntOrBlank = Field(alias='devnetActivationEpoch', default=None)
#     mainnetActivationEpoch: IntOrBlank = Field(alias='mainnetActivationEpoch', default=None)
#     title: str | None = Field(alias='title', default=None)
#     description: str | None = Field(alias='description', default=None)
#     simd_link: str | None = Field(alias='simd_link', default=None)

#     def to_stored_feature(self):
#         return StoredFeature(
#             key=self.key,
#             title=self.title,
#             simd_link=[self.simd_link] if self.simd_link else [],
#             simds=[self.simd] if self.simd else [],
#             owners=[],
#             min_agave_versions=[self.version],
#             min_fd_versions=[],
#             min_jito_versions=[],
#             planned_testnet_order=None,
#             testnet_activation_epoch=self.testnetActivationEpoch,
#             devnet_activation_epoch=self.devnetActivationEpoch,
#             comms_required=None,
#             mainnet_activation_epoch=self.mainnetActivationEpoch,
#             description=self.description,
#         )

class Feature(BaseModel):
    model_config = ConfigDict(populate_by_name=True, json_schema_extra={"type": "object"})

    key: str | None                = Field(alias='Feature ID', default=None)
    title: str                     = Field(alias='Title', default="")
    simd_link: list[str]           = Field(default_factory=list, alias='SIMD Links')
    simds: list[str]               = Field(default_factory=list, alias='SIMDs')
    owners: list[str]              = Field(default_factory=list, alias='Owners')
    min_agave_versions: list[str]  = Field(default_factory=list, alias='Min Agave Versions')
    min_fd_versions: list[str]     = Field(default_factory=list, alias='Min Fd Versions')
    min_jito_versions: list[str]   = Field(default_factory=list, alias='Min Jito Versions')

    planned_testnet_order: IntOrBlank = Field(alias='Planned Testnet Order', default=None)
    testnet_activation_epoch: IntOrBlank = Field(alias='Testnet Epoch', default=None)
    devnet_activation_epoch: IntOrBlank = Field(alias='Devnet Epoch', default=None)
    comms_required: str | None        = Field(alias='Comms Required', default=None)

class WikiFeature(BaseModel):
    key: str | None = Field(alias='Key', default=None)
    simd: str | None = Field(alias='SIMD', default=None)
    agave_version: str | None = Field(alias='Agave Version', default=None)
    fd_version: str | None = Field(alias='FD Version', default=None)
    jito_version: str | None = Field(alias='Jito Version', default=None)
    testnet_activation_epoch: IntOrBlank = Field(alias='Testnet', default=None)
    devnet_activation_epoch: IntOrBlank = Field(alias='Devnet', default=None)
    description: str | None = Field(alias='Description', default=None)
    owner: str | None = Field(alias='Owner', default=None)

    def to_stored_feature(self, simd_links: list[str]):
        return StoredFeature(
            key=self.key,
            title=self.description,
            simd_link=simd_links,
            simds=self.simd.split(',') if self.simd else [],
            owners=[],
            min_agave_versions=self.agave_version.split(',') if self.agave_version else [],
            min_fd_versions=self.fd_version.split(',') if self.fd_version else [],
            min_jito_versions=self.jito_version.split(',') if self.jito_version else [],
            planned_testnet_order=None,
            testnet_activation_epoch=self.testnet_activation_epoch,
            devnet_activation_epoch=self.devnet_activation_epoch,
            comms_required=None,
            mainnet_activation_epoch=None,
            description="",
        )
 

class StoredFeature(Feature):
    model_config = ConfigDict(populate_by_name=True, json_schema_extra={"type": "object"})

    # Manually set
    mainnet_activation_epoch: IntOrBlank = Field(alias='Mainnet Epoch', default=None)
    description: str | None = Field(alias='Description', default=None)


def get_tables(json_data):
    """Parse a markdown table and return list of rows"""
    all_features = []
    for (status, features) in json_data.items():
        for feature in features:
            all_features.append(Feature.model_validate(feature))
    return all_features


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


def safe_model_validate(model, data):
    try:
        return model.model_validate(data)
    except ValidationError:
        return None


RATE_LIMIT_DELAY = 0.5
MAX_RETRIES = 3

async def fetch_activation_epoch(connection: AsyncClient, epoch_schedule, key: str, backup_epoch: int | None) -> int | None:
    """Fetch the activation epoch for a single feature gate from on-chain data."""
    account = None
    for attempt in range(MAX_RETRIES):
        try:
            await asyncio.sleep(RATE_LIMIT_DELAY)
            account = await connection.get_account_info(Pubkey.from_string(key))
            break
        except Exception as e:
            if '429' in str(e) and attempt < MAX_RETRIES - 1:
                wait = 2 ** (attempt + 1)
                print(f"Rate limited on {key}, retrying in {wait}s...")
                await asyncio.sleep(wait)
            else:
                print(f"Failed to fetch {key}: {e}")
                return backup_epoch

    if account is None:
        return backup_epoch

    if account.value and account.value.data:
        # First byte indicates if activated (1) or not (0)
        is_activated = account.value.data[0]
        
        if is_activated:
            # If activated, next 8 bytes contain activation slot as u64
            activation_slot = int.from_bytes(account.value.data[1:9], 'little')

            # Technically, feature gates only become active in the following epoch
            return get_epoch_for_slot(epoch_schedule, activation_slot) + 1
        else:
            return backup_epoch
    else:
        return backup_epoch


async def fetch_cluster_activations(cluster_url: str, features_to_check: list[tuple[StoredFeature, Feature]]) -> None:
    """Fetch activation epochs for all features from a single cluster, reusing one connection."""
    if not features_to_check:
        return

    cluster_name = "devnet" if "devnet" in cluster_url else "testnet" if "testnet" in cluster_url else cluster_url

    async with AsyncClient(cluster_url) as connection:
        epoch_schedule = (await connection.get_epoch_schedule()).value

        for existing, new_feature in features_to_check:
            if 'devnet' in cluster_url:
                existing.devnet_activation_epoch = await fetch_activation_epoch(
                    connection, epoch_schedule, existing.key, new_feature.devnet_activation_epoch
                )
            elif 'testnet' in cluster_url:
                existing.testnet_activation_epoch = await fetch_activation_epoch(
                    connection, epoch_schedule, existing.key, new_feature.testnet_activation_epoch
                )
            print(f"  [{cluster_name}] Checked {existing.key}")


async def parse_wiki():
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
                wiki_feature = WikiFeature.model_validate(row)

                # Clean up SIMD number and find matching proposal
                simd_links = []
                for simd in wiki_feature.simd.split(','):
                    simd = simd.strip()
                    if simd and simd.isdigit():
                        simd_number = simd.zfill(4)
                        simd_links.append(proposals.get(simd_number, ""))
                    else:
                        simd_links.append("")
                
                stored_feature = wiki_feature.to_stored_feature(simd_links)
                
                features.append(stored_feature)
    
    # Load existing features if file exists
    existing_features: list[StoredFeature] = []
    if os.path.exists(FEATURE_GATES_PATH):
        with open(FEATURE_GATES_PATH, 'r') as f:
            current = json.load(f)
        
        # Migrate old features to new format if necessary
        for feature in current:
            if safe_model_validate(StoredFeature, feature):
                existing_features.append(StoredFeature.model_validate(feature))
            else:
                raise ValueError(f"Unknown feature: {feature}")

    # Update existing features and add new ones
    features_by_key: dict[str, Feature] = {f.key: f for f in features if f.key is not None}
    features_to_check: list[tuple[StoredFeature, Feature]] = []
    for existing in existing_features:
        if existing.key in features_by_key:
            features_to_check.append((existing, features_by_key[existing.key]))
            del features_by_key[existing.key]

    print(f"Checking {len(features_to_check)} features against devnet and testnet...")
    await fetch_cluster_activations(DEVNET_RPC_URL, features_to_check)
    await fetch_cluster_activations(TESTNET_RPC_URL, features_to_check)
    
    # Print new features that were found
    new_features = list(features_by_key.values())
    if new_features:
        print("New features:")
        for f in new_features:
            print(f"{f.key} - {f.title}")
    
    # Combine existing and new features
    all_features = existing_features + [StoredFeature.model_validate(f.model_dump()) for f in new_features]
    
    # Write updated features to file
    with open(FEATURE_GATES_PATH, 'w') as f:
        json.dump([feat.model_dump() for feat in all_features], f, indent=2)


if __name__ == "__main__":
    asyncio.run(parse_wiki())