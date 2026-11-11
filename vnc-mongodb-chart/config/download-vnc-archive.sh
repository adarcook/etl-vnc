#!/bin/bash
# Script to extract the array content under 'openroadm-devices' property from a large JSON file
# Usage: ./download-vnc-archive.sh url sas-token output-folder
# 'https://eosossnprdst.blob.core.windows.net/vnc-dropbox/daily-api-get.tar.gz'
# Check for correct number of arguments
if [ "$#" -ne 3 ]; then
  echo "Usage: $0 url sas-token output-folder"
  exit 1
fi

URL="$1"
SAS_TOKEN="$2"
OUTPUT_FOLDER="$3"

echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") Start VNC dump download"

cd $OUTPUT_FOLDER

curl -k -O -X GET --location "$URL?$SAS_TOKEN"
if [ $? -ne 0 ]; then
  echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") failed download VNC dump file!"
  # handle error
  exit 1
fi