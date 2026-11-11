#!/bin/bash

# Script to extract the 'node' array for the network with network-id 'openroadm-network'
# Usage: ./network-openroadm-topology_extract_nodes.sh input.json output.json

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 input_file output_file"
  exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="$2"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "jq is required but not installed. Please install jq and rerun this script."
  exit 1
fi

# Check if pv is installed
if ! command -v pv &> /dev/null; then
  echo "pv is required but not installed. Please install pv and rerun this script."
  exit 1
fi

echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") Staring to process $INPUT_FILE"
# Extract the 'node' array where 'network-id' equals 'openroadm-network'
pv "$INPUT_FILE" | jq '.["network-list"] 
   | map(select(.["network-id"] == "openroadm-topology")) 
   | .[0].node' > "$OUTPUT_FILE"

echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") Extraction complete. The 'node' array for 'openroadm-topology' has been saved to $OUTPUT_FILE"