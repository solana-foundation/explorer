from typing import Annotated, Optional
import requests
import json
import os
import re
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict, ValidationError

FEATURE_GATES_PATH = 'app/utils/feature-gate/featureGates.json'

IntOrBlank = Annotated[
    Optional[int],
    BeforeValidator(lambda v: None if v in {'', None} else int(v))
]

class OldFeature(BaseModel):
    key: str | None = Field(alias='key', default=None)
    simd: str | None = Field(alias='simd', default=None)
    version: str | None = Field(alias='version', default=None)
    testnetActivationEpoch: IntOrBlank = Field(alias='testnetActivationEpoch', default=None)
    devnetActivationEpoch: IntOrBlank = Field(alias='devnetActivationEpoch', default=None)
    mainnetActivationEpoch: IntOrBlank = Field(alias='mainnetActivationEpoch', default=None)
    title: str | None = Field(alias='title', default=None)
    description: str | None = Field(alias='description', default=None)
    simd_link: str | None = Field(alias='simd_link', default=None)

    def to_stored_feature(self):
        return StoredFeature(
            key=self.key,
            title=self.title,
            simd_link=[self.simd_link] if self.simd_link else [],
            simds=[self.simd] if self.simd else [],
            owners=[],
            min_agave_versions=[self.version],
            min_fd_versions=[],
            min_jito_versions=[],
            planned_testnet_order=None,
            testnet_activation_epoch=self.testnetActivationEpoch,
            devnet_activation_epoch=self.devnetActivationEpoch,
            comms_required=None,
            mainnet_activation_epoch=self.mainnetActivationEpoch,
            description=self.description,
        )

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

def safe_model_validate(model, data):
    try:
        return model.model_validate(data)
    except ValidationError:
        return None

def parse_wiki():
    # Fetch markdown content
    url = "https://github.com/anza-xyz/agave/wiki/feature-gate-tracker-schedule.json"
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Failed to fetch wiki: {response.status_code}")
        return
    
    features = get_tables(json.loads(response.text))
    
    # Load existing features if file exists
    existing_features: list[StoredFeature] = []
    if os.path.exists(FEATURE_GATES_PATH):
        with open(FEATURE_GATES_PATH, 'r') as f:
            current = json.load(f)
        
        # Migrate old features to new format if necessary
        for feature in current:
            if safe_model_validate(OldFeature, feature):
                existing_features.append(OldFeature.model_validate(feature).to_stored_feature())
            elif safe_model_validate(StoredFeature, feature):
                existing_features.append(StoredFeature.model_validate(feature))
            else:
                raise ValueError(f"Unknown feature: {feature}")

    # Update existing features and add new ones
    features_by_key: dict[str, Feature] = {f.key: f for f in features if f.key is not None}
    for existing in existing_features:
        if existing.key in features_by_key:
            # Only update devnet and testnet epochs
            new_feature = features_by_key[existing.key]
            existing.devnet_activation_epoch = new_feature.devnet_activation_epoch
            existing.testnet_activation_epoch = new_feature.testnet_activation_epoch
            del features_by_key[existing.key]
    
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
    parse_wiki() 