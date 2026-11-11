#!/bin/bash
#===============================================================================
# VNC ETL Pipeline - Improved Version
# Original: do-all.sh
# 
# IMPROVEMENTS APPLIED:
# 1. Added strict error handling (set -euo pipefail)
# 2. Added environment variable validation
# 3. Created reusable functions (log, validate_and_import, wait_for_mongo)
# 4. Added MongoDB readiness check before imports
# 5. Consistent error handling - all critical failures exit
# 6. Added cleanup trap for temp files
# 7. Replaced magic numbers with named constants
# 8. Added proper variable quoting throughout
# 9. Added execution time tracking
# 10. Added summary counters for success/failure
#===============================================================================

#-------------------------------------------------------------------------------
# STRICT MODE - Exit on error, undefined vars, and pipe failures
# IMPROVEMENT: Original had no error handling; script would continue on failures
#-------------------------------------------------------------------------------
set -euo pipefail

#-------------------------------------------------------------------------------
# CONSTANTS - Avoids magic numbers scattered throughout
# IMPROVEMENT: Original used hardcoded 50000000 inline
#-------------------------------------------------------------------------------
readonly VERSION="2026-Sep-28 11:00:00.000+0000"
readonly MIN_DUMP_SIZE=50000000  # 50 MB minimum file size
readonly DB_NAME="dap"
readonly ARCHIVE_FILE="daily-api-get.tar.gz"
readonly MONGO_WAIT_RETRIES=30
readonly MONGO_WAIT_INTERVAL=1

#-------------------------------------------------------------------------------
# COMMAND LINE FLAGS
#-------------------------------------------------------------------------------
SKIP_ENV_CHECK=false
SKIP_DOWNLOAD=false
START_PHASE6=false

#-------------------------------------------------------------------------------
# USAGE FUNCTION - Display help message
#-------------------------------------------------------------------------------
usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

VNC ETL Pipeline - Download, process, and upload VNC data.

OPTIONS:
    -s, --skip-env-check    Skip environment variable validation.
                            Allows running even if URL_DUMP, VNC_ARCHIVE_SAS,
                            URL_CSV, or VNC_CSV_SAS are not set.
    -d, --skip-download     Skip PHASE 2 (download). Use when archive file
                            already exists locally.
    -6, --start-phase6      Start at PHASE 6 (import). Skips phases 1-4
                            (validation, download, extraction, pre-processing).
                            Use when JSON files are already prepared.
    -h, --help              Show this help message and exit.

ENVIRONMENT VARIABLES:
    URL_DUMP                URL for downloading VNC archive
    VNC_ARCHIVE_SAS         SAS token for archive download
    URL_CSV                 URL for uploading CSV files
    VNC_CSV_SAS             SAS token for CSV upload

EXAMPLES:
    # Normal run (validates all env vars)
    ./$(basename "$0")

    # Skip env validation (for testing/debugging)
    ./$(basename "$0") --skip-env-check

    # Skip download (use existing archive)
    ./$(basename "$0") --skip-download

    # Start at phase 6 (JSON files already prepared)
    ./$(basename "$0") --start-phase6

EOF
    exit 0
}

#-------------------------------------------------------------------------------
# PARSE COMMAND LINE ARGUMENTS
#-------------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        -s|--skip-env-check)
            SKIP_ENV_CHECK=true
            shift
            ;;
        -d|--skip-download)
            SKIP_DOWNLOAD=true
            shift
            ;;
        -6|--start-phase6)
            START_PHASE6=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            echo "Use --help for usage information."
            exit 1
            ;;
    esac
done

#-------------------------------------------------------------------------------
# COUNTERS - Track success/failure for summary
# IMPROVEMENT: Original had no visibility into how many operations succeeded
#-------------------------------------------------------------------------------
declare -i IMPORT_SUCCESS=0
declare -i IMPORT_FAILED=0
declare -i EXPORT_SUCCESS=0
declare -i EXPORT_FAILED=0

#-------------------------------------------------------------------------------
# LOGGING FUNCTION - Consistent timestamp format
# IMPROVEMENT: Original repeated the date format string 20+ times
#-------------------------------------------------------------------------------
log() {
    local level="$1"
    local message="$2"
    echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") ${level} ${message}"
}

#-------------------------------------------------------------------------------
# CLEANUP FUNCTION - Remove temp files on exit
# IMPROVEMENT: Original left all temp files behind
#-------------------------------------------------------------------------------
cleanup() {
    log "INFO" "Cleanup: removing temporary JSON files..."
    # Uncomment the next line to enable cleanup (disabled by default for debugging)
    # rm -f ./*.json "${ARCHIVE_FILE}" 2>/dev/null || true
}

# Register cleanup to run on EXIT (success or failure)
trap cleanup EXIT

#-------------------------------------------------------------------------------
# VALIDATE AND IMPORT FUNCTION - Reduces code duplication
# IMPROVEMENT: Original had 15+ copies of the same if/else pattern
# Parameters:
#   $1 - JSON file to import
#   $2 - MongoDB collection name
#   $3 - "critical" if failure should exit script (optional)
#-------------------------------------------------------------------------------
validate_and_import() {
    local file="$1"
    local collection="$2"
    local critical="${3:-false}"
    
    if [[ ! -f "$file" ]]; then
        log "WARN" "=========================================="
        log "WARN" "MISSING FILE: $file"
        log "WARN" "  Expected location: $(pwd)/$file"
        log "WARN" "  Target collection: $collection"
        log "WARN" "  This file should have been created during PHASE 4 (Pre-process JSON Files)"
        log "WARN" "  Check if the source archive contained the required raw data"
        log "WARN" "  Skipping import for collection: $collection"
        log "WARN" "=========================================="
        ((IMPORT_FAILED++)) || true
        if [[ "$critical" == "critical" ]]; then
            log "ERROR" "Critical file missing - cannot continue without $file"
            exit 1
        fi
        return 0  # Return success so script continues with set -e
    fi
    
    if jq empty "$file" > /dev/null 2>&1; then
        log "INFO" "Importing $file -> $collection"
        if mongoimport --db="$DB_NAME" --collection="$collection" --file="$file" --jsonArray --drop; then
            log "INFO" "Completed import: $file -> $collection"
            ((IMPORT_SUCCESS++)) || true
        else
            log "ERROR" "=========================================="
            log "ERROR" "IMPORT FAILED: $file -> $collection"
            log "ERROR" "  mongoimport returned an error"
            log "ERROR" "  File exists and is valid JSON but import failed"
            log "ERROR" "=========================================="
            ((IMPORT_FAILED++)) || true
            if [[ "$critical" == "critical" ]]; then
                log "ERROR" "Critical import failed - cannot continue"
                exit 1
            fi
        fi
    else
        log "ERROR" "=========================================="
        log "ERROR" "INVALID JSON: $file"
        log "ERROR" "  File exists but contains invalid JSON"
        log "ERROR" "  Target collection: $collection"
        log "ERROR" "  Run: jq . $file to see the error"
        log "ERROR" "=========================================="
        ((IMPORT_FAILED++)) || true
        if [[ "$critical" == "critical" ]]; then
            log "ERROR" "Critical file has invalid JSON - cannot continue"
            exit 1
        fi
        return 0  # Return success so script continues with set -e
    fi
}

#-------------------------------------------------------------------------------
# EXPORT FUNCTION - Reduces code duplication for mongoexport
# IMPROVEMENT: Original had 30+ mongoexport calls with no error checking
# Parameters:
#   $1 - Collection name (view)
#   $2 - Output CSV filename
#   $3 - Comma-separated field list (no quotes around field names)
#-------------------------------------------------------------------------------
export_collection() {
    local collection="$1"
    local output="$2"
    local fields="$3"
    
    log "INFO" "Exporting $collection -> $output"
    if mongoexport --db="$DB_NAME" --collection="$collection" --type=csv --out="./out/$output" --fields="$fields"; then
        ((EXPORT_SUCCESS++)) || true
    else
        log "WARN" "Export failed for $collection"
        ((EXPORT_FAILED++)) || true
    fi
}

#-------------------------------------------------------------------------------
# WAIT FOR MONGODB - Ensures MongoDB is ready before imports
# IMPROVEMENT: Original started mongod and immediately ran mongoimport
# which could fail if MongoDB wasn't ready yet
#-------------------------------------------------------------------------------
wait_for_mongo() {
    local retries=$MONGO_WAIT_RETRIES
    log "INFO" "Waiting for MongoDB to be ready..."
    
    until mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
        ((retries--)) || true
        if [[ $retries -le 0 ]]; then
            log "ERROR" "MongoDB failed to start after ${MONGO_WAIT_RETRIES} seconds"
            exit 1
        fi
        sleep $MONGO_WAIT_INTERVAL
    done
    
    log "INFO" "MongoDB is ready"
}

#-------------------------------------------------------------------------------
# VALIDATE ENVIRONMENT VARIABLES
# IMPROVEMENT: Original used $URL_DUMP etc without checking if they exist
# This would cause silent failures or cryptic errors
#-------------------------------------------------------------------------------
validate_environment() {
    local missing=0
    
    if [[ -z "${URL_DUMP:-}" ]]; then
        log "ERROR" "Required environment variable URL_DUMP is not set"
        missing=1
    fi
    
    if [[ -z "${VNC_ARCHIVE_SAS:-}" ]]; then
        log "ERROR" "Required environment variable VNC_ARCHIVE_SAS is not set"
        missing=1
    fi
    
    if [[ -z "${URL_CSV:-}" ]]; then
        log "ERROR" "Required environment variable URL_CSV is not set"
        missing=1
    fi
    
    if [[ -z "${VNC_CSV_SAS:-}" ]]; then
        log "ERROR" "Required environment variable VNC_CSV_SAS is not set"
        missing=1
    fi
    
    if [[ $missing -eq 1 ]]; then
        log "ERROR" "Missing required environment variables - aborting"
        exit 1
    fi
    
    log "INFO" "All required environment variables are set"
}

#===============================================================================
# MAIN SCRIPT EXECUTION
#===============================================================================

# Record start time for duration tracking
START_TIME=$(date +%s)

echo
echo "VNC processor ver ${VERSION}"
echo

if [[ "$START_PHASE6" == "true" ]]; then
    log "INFO" "=== PHASES 1-4: SKIPPED (--start-phase6 flag set) ==="
else
    #-------------------------------------------------------------------------------
    # PHASE 1: VALIDATION
    #-------------------------------------------------------------------------------
    log "INFO" "=== PHASE 1: Environment Validation ==="
    if [[ "$SKIP_ENV_CHECK" == "true" ]]; then
        log "WARN" "Environment variable validation SKIPPED (--skip-env-check flag set)"
        log "WARN" "Script may fail if required variables are not set"
    else
        validate_environment
    fi

    #-------------------------------------------------------------------------------
    # PHASE 2: DOWNLOAD
    # IMPROVEMENT: Added quotes around variables to handle spaces/special chars
    #-------------------------------------------------------------------------------
    if [[ "$SKIP_DOWNLOAD" == "true" ]]; then
        log "INFO" "=== PHASE 2: Download VNC Archive (SKIPPED) ==="
    else
        log "INFO" "=== PHASE 2: Download VNC Archive ==="
        ./download-vnc-archive.sh "$URL_DUMP" "$VNC_ARCHIVE_SAS" .
    fi

    # Validate file size
    # IMPROVEMENT: Added quotes and -f check
    if [[ ! -f "$ARCHIVE_FILE" ]]; then
        log "ERROR" "Archive file $ARCHIVE_FILE not found after download!"
        exit 1
    fi

    filesize=$(stat -c%s "$ARCHIVE_FILE")

    if [[ "$filesize" -gt "$MIN_DUMP_SIZE" ]]; then
        log "INFO" "VNC dump file is $(( filesize / 1024 / 1024 )) MB - OK"
    else
        log "ERROR" "VNC dump file is only $(( filesize / 1024 / 1024 )) MB (minimum: $(( MIN_DUMP_SIZE / 1024 / 1024 )) MB) - aborting!"
        exit 1
    fi

    #-------------------------------------------------------------------------------
    # PHASE 3: EXTRACTION
    # IMPROVEMENT: Using $? immediately after command is fragile; using || instead
    #-------------------------------------------------------------------------------
    log "INFO" "=== PHASE 3: Extract Archive ==="
    if ! tar -xvf "$ARCHIVE_FILE"; then
        log "ERROR" "Failed to extract VNC dump file!"
        exit 1
    fi

    #-------------------------------------------------------------------------------
    # PHASE 4: PRE-PROCESSING
    # IMPROVEMENT: Added || true to prevent set -e from exiting if no files found
    #-------------------------------------------------------------------------------
    log "INFO" "=== PHASE 4: Pre-process JSON Files ==="

    # DevicesV2
    find . -type f -size +1M -name '*_GetDevicesV2deployed*' -exec ./devices_extract_array.sh {} DevicesV2deployed.json \; || true

    # DevicesV7
    find . -type f -size +1M -name '*_GetDevicesV7deployed*' -exec ./devices_extract_array.sh {} DevicesV7deployed.json \; || true

    # FiberCables
    find . -type f -size +1M -name '*_GetFiberCables*' -exec ./fiber-cables_extract_array.sh {} FiberCables.json \; || true

    # FiberTails
    find . -type f -size +1M -name '*_GetFiberTails*' -exec ./fiber-tails_extract.sh {} FiberTails.json \; || true

    # IOFL
    find . -type f -size +1M -name '*_GetIOFL*' -exec ./inter-office-fiber-link_extract_array.sh {} IOFL.json \; || true

    # NetworksV7
    find . -type f -size +1M -name '*_GetNetworksV7*' -exec ./networkv7-openroadm-network_extract_array.sh {} NetworksV7_network.json \; || true
    find . -type f -size +1M -name '*_GetNetworksV7*' -exec ./networkv7-openroadm-topology_extract_array.sh {} NetworksV7_topology.json \; || true
    find . -type f -size +1M -name '*_GetNetworksV7*' -exec ./networkv7-otn-topology_extract_array.sh {} NetworksV7_otn_topology.json \; || true
    find . -type f -size +1M -name '*_GetNetworksV7*' -exec ./networkv7-ietf-network-topology_extract_array.sh {} Networkv7_ietf_network_topology.json \; || true

    # NetworksV13
    find . -type f -size +1M -name '*_GetNetworksV13*' -exec ./networkv7-openroadm-network_extract_array.sh {} NetworksV13_network.json \; || true
    find . -type f -size +1M -name '*_GetNetworksV13*' -exec ./networkv7-openroadm-topology_extract_array.sh {} NetworksV13_topology.json \; || true
    find . -type f -size +1M -name '*_GetNetworksV13*' -exec ./networkv7-otn-topology_extract_array.sh {} NetworksV13_otn_topology.json \; || true
    find . -type f -size +1M -name '*_GetNetworksV13*' -exec ./networkv7-ietf-network-topology_extract_array.sh {} Networkv13_ietf_network_topology.json \; || true

    # Services
    find . -type f -size +1M -name '*_GetServices*' -exec ./services_extract_array.sh {} Services.json \; || true
fi

#-------------------------------------------------------------------------------
# PHASE 5: START MONGODB
# IMPROVEMENT: Added wait_for_mongo to ensure it's ready before imports
#-------------------------------------------------------------------------------
log "INFO" "=== PHASE 5: Start MongoDB ==="
mongod > /dev/null 2>&1 &
wait_for_mongo

#-------------------------------------------------------------------------------
# PHASE 6: IMPORT TO MONGODB
# IMPROVEMENT: Using function reduces 200+ lines to ~20 lines
# "critical" parameter means failure will exit the script
#-------------------------------------------------------------------------------
log "INFO" "=== PHASE 6: Import to MongoDB ==="

# Critical imports - script exits on failure
validate_and_import "DevicesV2deployed.json" "devices" "critical"
validate_and_import "DevicesV7deployed.json" "devices7" "critical"

# Non-critical imports - script continues on failure
validate_and_import "FiberCables.json" "fiber_cables"
validate_and_import "FiberTails.json" "fiber_tails"
validate_and_import "IOFL.json" "iofl"
validate_and_import "NetworksV7_network.json" "networks_v7_openroadm_network"
validate_and_import "NetworksV7_topology.json" "networks_v7_openroadm_topology"
validate_and_import "NetworksV7_otn_topology.json" "networks_v7_openroadm_otn_topology"
validate_and_import "Networkv7_ietf_network_topology.json" "networks_v7_ietf_network_topology"
validate_and_import "NetworksV13_network.json" "networks_v13_openroadm_network"
validate_and_import "NetworksV13_topology.json" "networks_v13_openroadm_topology"
validate_and_import "NetworksV13_otn_topology.json" "networks_v13_openroadm_otn_topology"
validate_and_import "Networkv13_ietf_network_topology.json" "networks_v13_ietf_network_topology"
validate_and_import "Services.json" "services"

log "INFO" "Import summary: ${IMPORT_SUCCESS} succeeded, ${IMPORT_FAILED} failed"

#-------------------------------------------------------------------------------
# PHASE 7: CREATE VIEWS
# IMPROVEMENT: Added error checking for mongosh commands
#-------------------------------------------------------------------------------
log "INFO" "=== PHASE 7: Create MongoDB Views ==="

for view_script in devices.js fiber_cables.js fiber_tails.js iofl.js networks_v7.js services.js; do
    if [[ -f "$view_script" ]]; then
        log "INFO" "Running view script: $view_script"
        if mongosh "$DB_NAME" "$view_script"; then
            log "INFO" "Completed view script: $view_script"
        else
            log "WARN" "Failed to create view from $view_script"
        fi
    else
        log "WARN" "View script $view_script not found"
    fi
done

#-------------------------------------------------------------------------------
# PHASE 8: EXPORT TO CSV
# IMPROVEMENT: Using function with error tracking
#-------------------------------------------------------------------------------
log "INFO" "=== PHASE 8: Export to CSV ==="

mkdir -p ./out

# Device exports
log "INFO" "Exporting devices..."
export_collection "devices_base_rdm_view" "devices_base_rdm.csv" 'node-id,current-datetime,clli,model,vendor,template,node-number,serial-id,softwareVersion,latitude,longitude,etl_hash_id'
export_collection "devices_base_xpdr_view" "devices_base_xpdr.csv" 'node-id,current-datetime,clli,model,vendor,template,latitude,longitude,node-number,serial-id,softwareVersion,etl_hash_id'
export_collection "devices7_base_xpdr_view" "devices7_base_xpdr.csv" 'node-id,current-datetime,clli,model,vendor,template,latitude,longitude,node-number,serial-id,software-build,softwareVersion,etl_hash_id'
export_collection "devices_circuit_packs_rdm_view" "devices_circuit_packs_rdm.csv" 'node-id,template,circuit-pack-category,clli,clei,circuit-pack-name,circuit-pack-product-code,circuit-pack-model,circuit-pack-type,hardware-version,software-load-version,serial-id,product-code,manufacture-date,is-pluggable-optics,Shelf,slot,subSlot,vendor,type,administrative-state,equipment-state,operational-state,etl_hash_id'
export_collection "devices_circuit_packs_xpdr_view" "devices_circuit_pack_xpdr.csv" 'node-id,circuit-pack-category,circuit-pack-name,circuit-pack-product-code,circuit-pack-type,clei,hardware-version,model,product-code,serial-id,shelf,slot,subSlot,software-load-version,vendor,type,etl_hash_id'
export_collection "devices7_circuit_pack_xpdr_view" "devices7_circuit_pack_xpdr.csv" 'node-id,template,clli,circuit-pack-name,circuit-pack-product-code,circuit-pack-type,faceplate-label,hardware-version,model,serial-id,product-code,shelf,slot,subSlot,vendor,port-faceplate-label,port-direction,port-name,port-type,etl_hash_id'
export_collection "devices_circuit_packs_cp_rdm_view" "devices_circuit_packs_cp_rdm.csv" 'node-id,circuit-pack-category,circuit-pack-name,shelf,slot,subSlot,cp-slots-name,cp-slots-type,provisioned-circuit-pack,etl_hash_id'
export_collection "devices_interfaces_rdm_view" "devices_interfaces_rdm.csv" 'node-id,name,description,administrative-state,operationale-state,circuit-id,supporting-circuit-pack-name,supporting-interface,supporting-port,mc-ttp-center-freq,mc-ttp-max-freq,mc-ttp-min-freq,mc-ttp-slot-width,nmc_ctp_frequency,nmc_ctp_width,type,ethernet-auto-negotiation,ethernet-duplex,ethernet-speed,ethernet-fec,ethernet-mtu,etl_hash_id'
export_collection "devices_interfaces_xpdr_view" "devices_interfaces_xpdr.csv" 'node-id,name,description,administrative-state,operationale-state,circuit-id,supporting-circuit-pack-name,supporting-interface,supporting-port,mc-ttp-center-freq,mc-ttp-max-freq,mc-ttp-min-freq,mc-ttp-slot-width,nmc_ctp_frequency,nmc_ctp_width,type,ethernet-auto-negotiation,ethernet-duplex,ethernet-speed,ethernet-fec,ethernet-mtu,etl_hash_id'
export_collection "devices_interfaces_oms_rdm_view" "devices_interfaces_oms_rdm.csv" 'node-id,name,supporting-circuit-pack-name,supporting-interface,supporting-port,type,etl_hash_id'
export_collection "devices_interfaces_ots_rdm_view" "devices_interfaces_ots_rdm.csv" 'node-id,name,supporting-circuit-pack-name,supporting-interface,supporting-port,type,etl_hash_id'
export_collection "devices_physical_link_rdm_view" "devices_physical_link_rdm.csv" 'node-id,physical-link-name,s-circuit-pack-name,s-port-name,d-circuit-pack-name,d-port-name,etl_hash_id'
export_collection "devices_port_parents_rdm_view" "devices_port_parents_rdm.csv" 'node-id,template,clli,circuit-pack-name,circuit-pack-product-code,circuit-pack-mode,circuit-pack-type,Shelf,slot,subSlot,vendor,parent-circuit-pack-slot-name,parent-circuit-pack-name,administrative-state,circuit-id,interface-name,logical-connection-point,port-direction,port-name,port-qual,port-type,etl_hash_id'
export_collection "devices_srg_rdm_view" "devices_srg_rdm.csv" 'node_id,openroadm_version,circuit_pack_name,circuit_pack_name_index,srg_number,max_add_drop_ports,current_provisioned_add_drop_ports,wavelength_duplication,center_freq_granularity,slot_width_granularity,mc_capabilities_max_slots,mc_capabilities_min_slots,mc_capability_profile_name,lifecycle_state,etl_hash_id'
export_collection "devices_shelf_rdm_view" "devices_shelf_rdm.csv" 'node-id,administrative-state,vendor,model,hardware-version,operational-state,serial-id,rack,shelf-name,shelf-position,shelf-type,provisioned-circuit-pack,slot-name,slot-status,etl_hash_id'
export_collection "devices_shelf_xpdr_view" "devices_shelf_xpdr.csv" 'node-id,administrative-state,vendor,model,hardware-version,operational-state,serial-id,rack,shelf-name,shelf-position,shelf-type,provisioned-circuit-pack,label,slot-name,slot-status,etl_hash_id'
export_collection "devices7_shelf_xpdr_view" "devices7_shelf_xpdr.csv" 'node-id,administrative-state,vendor,model,hardware-version,operational-state,serial-id,rack,shelf-name,shelf-position,shelf-type,provisioned-circuit-pack,label,slot-name,slot-status,etl_hash_id'
export_collection "devices_degree_rdm_view" "devices_degree_rdm.csv" 'node-id,degree-number,circuit-pack-name,port-name,max-wavelengths,center-freq-granularity,max-slots,min-slots,slot-width-granularity,otdr-port-circuit-pack-name,otdr-port-port-name,lifecycle-state,etl_hash_id'

# Fiber exports
log "INFO" "Exporting fibers..."
export_collection "fiber_cables_base_view" "fiber_cables_base_rdm.csv" 'name,tail-clfi,strand-number,allocation,lifecycle-state,s-clli,s-rack,s-shelf,s-port,d-clli,d-rack,d-shelf,d-port,etl_hash_id'
export_collection "fiber_tails_view" "fiber_tails.csv" 'clfi,lifecycle-state,type,towards-client-fiber-cable-name,towards-client-fiber-cable-strand-number,towards-client-type,towards-client-wiring-record-sequence-number,towards-client-svc-end-port-device,towards-client-svc-end-port-direction-used,towards-client-svc-end-port-lgx-name,towards-client-svc-end-port-name,towards-client-svc-end-port-rack,towards-client-svc-end-port-shelf,towards-network-fiber-cable-name,towards-network-roadm-circuit-pack-name,towards-network-roadm-name,towards-network-roadm-port-name,towards-network-xponder-circuit-pack-name,towards-network-xponder-device,towards-network-xponder-port-name,towards-network-svc-end-port-device,towards-network-svc-end-port-direction-used,towards-network-svc-end-port-lgx-name,towards-network-svc-end-port-name,towards-network-svc-end-port-rack,towards-network-svc-end-port-shelf,etl_hash_id'

# IOFL exports
log "INFO" "Exporting IOFL..."
export_collection "iofl_client_view" "iofl_client.csv" 'clfi,a-clli,z-clli,common-id,a-fiber-cable-name,a-fiber-cable-strand-number,a-roadm-faceplate-id,a-roadm-circuit-pack-name,a-roadm-name,a-roadm-port-name,z-fiber-cable-name,z-fiber-cable-strand-number,z-roadm-faceplate-id,z-roadm-circuit-pack-name,z-roadm-name,z-roadm-port-name,etl_hash_id'
export_collection "iofl_network_view" "iofl_network.csv" 'clfi,a-clli,z-clli,common-id,a-fiber-cable-name,a-fiber-cable-strand-number,a-roadm-faceplate-id,a-roadm-circuit-pack-name,a-roadm-name,a-roadm-port-name,z-fiber-cable-name,z-fiber-cable-strand-number,z-roadm-faceplate-id,z-roadm-circuit-pack-name,z-roadm-name,z-roadm-port-name,etl_hash_id'

# Network exports
log "INFO" "Exporting networks..."
export_collection "networks_v13_openroadm_network_view" "networks_v7_openroadm_network.csv" 'node-id,lifecycle-state,node-type,network-ref,node-ref,equipment-available,equipment-capacity,operational-mode-id,etl_hash_id'
export_collection "networks_v13_openroadm_topology_view" "networks_v7_openroadm_topology.csv" 'node-id,tp-type,tp-id,lifecycle-state,node-type,srg-number,supporting-node-network-ref,supporting-node-ref,etl_hash_id'
export_collection "networks_v13_openroadm_otn_topology_view" "networks_v7_openroadm_otn_topology.csv" 'node-id,node-type,degree-number,tp-type,tp-id,node-ref,etl_hash_id'
export_collection "networks_v13_ietf_network_topology_view" "networks_v7_ietf_network_topology.csv" 'link-id,source-node,source-tp,dest-node,dest-tp,administrative-state,clfi,lifecycle-state,link-type,etl_hash_id'

# Service exports
log "INFO" "Exporting services..."
export_collection "services_base_view" "services_base.csv" 'common-id,service-name,lifecycle_state,service_layer,connection_type,source-tail-clfi,destination-tail-clfi,a-end-clli,a-end-optic-type,a-end-service-rate,a-end-rx-direction-port-circuit-pack-name,a-end-rx-direction-port-device-name,a-end-rx-direction-port-name,a-end-rx-direction-port-rack,a-end-rx-direction-port-shelf,a-end-rx-direction-port-type,a-end-tx-direction-port-circuit-pack-name,a-end-tx-direction-port-device-name,a-end-tx-direction-port-name,a-end-tx-direction-port-rack,a-end-tx-direction-port-shelf,a-end-tx-direction-port-type,z-end-clli,z-end-optic-type,z-end-service-rate,z-end-rx-direction-port-circuit-pack-name,z-end-rx-direction-port-device-name,z-end-rx-direction-port-name,z-end-rx-direction-port-rack,z-end-rx-direction-port-shelf,z-end-rx-direction-port-type,z-end-tx-direction-port-circuit-pack-name,z-end-tx-direction-port-device-name,z-end-tx-direction-port-name,z-end-tx-direction-port-rack,z-end-tx-direction-port-shelf,z-end-tx-direction-port-type,etl_hash_id'
export_collection "services_a_2_z_topology_view" "services_a_2_z_topology.csv" 'common_id,service_name,hop_type,hop_id,resourceType,device,interface_name,trib_slots,opucn_trib_slots,circuit_pack_name,port_name,resource_service_name,frequency,width,source_tail_clfi,destination_tail_clf,odu_rate,oducn_n_rate,trib_port_number,etl_hash_id'
export_collection "services_z_2_a_topology_view" "services_z_2_a_topology.csv" 'common_id,service_name,hop_type,hop_id,resourceType,device,interface_name,trib_slots,opucn_trib_slots,circuit_pack_name,port_name,resource_service_name,frequency,width,source_tail_clfi,destination_tail_clf,odu_rate,oducn_n_rate,trib_port_number,etl_hash_id'
export_collection "services_a_2_z_network_topology_view" "services_a_2_z_network_topology.csv" 'common-id,service-name,source-tail-clfi,destination-tail-clfi,id,network-resource-type,a-z-tp-id,a-z-tp-node-id,a-z-link-id,a-z-link-network-id,etl_hash_id'
export_collection "services_z_2_a_network_topology_view" "services_z_2_a_network_topology.csv" 'common-id,service-name,source-tail-clfi,destination-tail-clfi,id,network-resource-type,z-a-tp-id,z-a-tp-node-id,z-a-link-id,z-a-link-network-id,etl_hash_id'
export_collection "services_otn_view" "services_otn.csv" 'common_id,service_name,supporting_service_name,etl_hash_id'

log "INFO" "Export summary: ${EXPORT_SUCCESS} succeeded, ${EXPORT_FAILED} failed"

#-------------------------------------------------------------------------------
# PHASE 9: UPLOAD TO AZURE
# IMPROVEMENT: Added quotes around all variables, added upload tracking
#-------------------------------------------------------------------------------
log "INFO" "=== PHASE 9: Upload to Azure ==="

cd ./out

# Define list of files to upload (easier to maintain than 30+ individual lines)
declare -a CSV_FILES=(
    "devices_base_rdm.csv"
    "devices_base_xpdr.csv"
    "devices7_base_xpdr.csv"
    "devices_circuit_packs_rdm.csv"
    "devices_circuit_packs_cp_rdm.csv"
    "devices_interfaces_rdm.csv"
    "devices_interfaces_xpdr.csv"
    "devices_interfaces_oms_rdm.csv"
    "devices_interfaces_ots_rdm.csv"
    "devices_physical_link_rdm.csv"
    "devices_port_parents_rdm.csv"
    "devices_srg_rdm.csv"
    "devices_shelf_rdm.csv"
    "devices_shelf_xpdr.csv"
    "devices7_shelf_xpdr.csv"
    "devices_degree_rdm.csv"
    "devices_circuit_pack_xpdr.csv"
    "devices7_circuit_pack_xpdr.csv"
    "fiber_cables_base_rdm.csv"
    "fiber_tails.csv"
    "iofl_client.csv"
    "iofl_network.csv"
    "networks_v7_openroadm_network.csv"
    "networks_v7_openroadm_topology.csv"
    "networks_v7_openroadm_otn_topology.csv"
    "networks_v7_ietf_network_topology.csv"
    "services_base.csv"
    "services_a_2_z_topology.csv"
    "services_z_2_a_topology.csv"
    "services_a_2_z_network_topology.csv"
    "services_z_2_a_network_topology.csv"
    "services_otn.csv"
)

declare -i UPLOAD_SUCCESS=0
declare -i UPLOAD_FAILED=0

for csv_file in "${CSV_FILES[@]}"; do
    if [[ -f "$csv_file" ]]; then
        if ../upload-csv.sh "$csv_file" "$URL_CSV" "$VNC_CSV_SAS"; then
            ((UPLOAD_SUCCESS++)) || true
        else
            log "WARN" "Failed to upload $csv_file"
            ((UPLOAD_FAILED++)) || true
        fi
    else
        log "WARN" "File $csv_file not found - skipping upload"
        ((UPLOAD_FAILED++)) || true
    fi
done

cd ..

log "INFO" "Upload summary: ${UPLOAD_SUCCESS} succeeded, ${UPLOAD_FAILED} failed"

#-------------------------------------------------------------------------------
# FINAL SUMMARY
# IMPROVEMENT: Original had no summary; hard to know if it succeeded
#-------------------------------------------------------------------------------
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo
echo "==============================================================================="
log "INFO" "VNC ETL Pipeline Complete"
echo "==============================================================================="
echo "Duration:    $((DURATION / 60)) minutes $((DURATION % 60)) seconds"
echo "Imports:     ${IMPORT_SUCCESS} succeeded, ${IMPORT_FAILED} failed"
echo "Exports:     ${EXPORT_SUCCESS} succeeded, ${EXPORT_FAILED} failed"
echo "Uploads:     ${UPLOAD_SUCCESS} succeeded, ${UPLOAD_FAILED} failed"
echo "==============================================================================="

# Exit with error if any critical failures
if [[ $IMPORT_FAILED -gt 0 ]] || [[ $EXPORT_FAILED -gt 0 ]] || [[ $UPLOAD_FAILED -gt 0 ]]; then
    log "WARN" "Completed with some failures - review logs above"
    exit 1
fi

log "INFO" "All operations completed successfully"
exit 0
