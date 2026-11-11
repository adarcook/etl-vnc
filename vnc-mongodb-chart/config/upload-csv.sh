#!/bin/bash
# Script to extract the array content under 'openroadm-devices' property from a large JSON file
# Usage: ./upload-csv.sh csv-filename url sas-token 

# Check for correct number of arguments
if [ "$#" -ne 3 ]; then
  echo "Usage: $0 csv-filename url sas-token"
  exit 1
fi

CSV_FILE="$1"
AZURE_CONTAINER_URL="$2"
SAS="$3"

# Count the number of lines in the file
LINE_COUNT=$(wc -l < "$CSV_FILE")

# Compare the line count with 10 and print error if less
if [ "$LINE_COUNT" -lt 1 ]; then
  echo "Error: File '$CSV_FILE' has only $LINE_COUNT lines, which is unreasonable. No upload!."
  echo
  exit 2
fi

echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") Start VNC $CSV_FILE upload"
echo

curl -k -X PUT --location "$AZURE_CONTAINER_URL/$CSV_FILE?$SAS" -H "x-ms-blob-type: BlockBlob" -H "Content-Type: application/octet-stream" --upload-file $CSV_FILE
if [ $? -ne 0 ]; then
  echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") failed uploading VNC $CSV_FILE file!"
  # handle error
  exit 1
fi
