#!/bin/bash

# Script to extract the array content under 'openroadm-devices' property from a large JSON file
# Usage: ./devices2_extract_array.sh input.json output.json

# Check for correct number of arguments
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

filesize=$(stat -c%s "$INPUT_FILE")

# if [ "$filesize" -lt "100000000" ]; then
#   echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") VNC dump file $INPUT_FILE looks too small - aborting!"
#   exit 1
# fi

echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") Starting to process $INPUT_FILE"
# Extract the array under 'openroadm-devices' and write to output file
# -c outputs compact JSON, but you can remove it if pretty formatting is desired
pv "$INPUT_FILE" | jq '.["openroadm-devices"]' > "$OUTPUT_FILE"

# Inform the user
echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") Extraction complete. The array content under 'openroadm-devices' has been saved to $OUTPUT_FILE"