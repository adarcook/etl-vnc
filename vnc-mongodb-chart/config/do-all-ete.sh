#!/bin/bash
echo
echo "VNC ETE processor ver 2026-Jan-18 17:30:00.000+0000"
echo

# download the VNC dump file from blob
./download-vnc-archive.sh $URL_DUMP_ETE $VNC_ARCHIVE_SAS .

filesize=$(stat -c%s "daily-api-get-ete.tar.gz")

if [ "$filesize" -gt "5000" ]; then
  echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") INFO VNC ETE dump file is larger than 5 KB - probably OK"
  echo
else
  echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") ERROR VNC ETE dump file looks too small - aborting!"
  exit 1
fi

# extract the VNC
tar -xvf daily-api-get-ete.tar.gz
if [ $? -ne 0 ]; then
  echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") ERROR failed downloaded VNC ETE dump file extraction!"
  exit 1
fi

# pre-process VNC 
find . -type f -name '*_GetDevicesV2deployed*' -exec ./devices_extract_array.sh {} DevicesV2deployed.json \;
find . -type f -name '*_GetDevicesV7deployed*' -exec ./devices_extract_array.sh {} DevicesV7deployed.json \;
find . -type f -name '*_GetDevices_deployed.json,' -exec ./devices_extract_array.sh {} Devices_deployed.json \;

find . -type f -name '*_GetFiberCables*' -exec ./fiber-cables_extract_array.sh {} FiberCables.json \;
find . -type f -name '*_GetFiberTails*' -exec ./fiber-tails_extract.sh {} FiberTails.json \;
find . -type f -name '*_GetIOFL*' -exec ./inter-office-fiber-link_extract_array.sh {} IOFL.json \;

find . -type f -name '*_GetNetworksV7*' -exec ./networkv7-openroadm-network_extract_array.sh {} NetworksV7_network.json \;
find . -type f -name '*_GetNetworksV7*' -exec ./networkv7-openroadm-topology_extract_array.sh {} NetworksV7_topology.json \;
find . -type f -name '*_GetNetworksV7*' -exec ./networkv7-otn-topology_extract_array.sh {} NetworksV7_otn_topology.json \;
find . -type f -name '*_GetNetworksV7*' -exec ./networkv7-ietf-network-topology_extract_array.sh {} Networkv7_ietf_network_topology.json \;

find . -type f -name '*_GetServices*' -exec ./services_extract_array.sh {} Services.json \;
find . -type f -name '*_GetTempServices*' -exec ./temp_services_extract_array.sh {} TempServices.json \;

# Start MongoDB
# mongod --quiet &
mongod > /dev/null 2>&1 &

# Devices
if jq empty DevicesV2deployed.json > /dev/null 2>&1; then
    mongoimport --db=dapete --collection=devices --file=DevicesV2deployed.json --jsonArray --drop
else
    echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") ERROR Invalid DevicesV2deployed.json JSON!"
    exit 1
fi
if jq empty DevicesV7deployed.json > /dev/null 2>&1; then
    mongoimport --db=dapete --collection=devices7 --file=DevicesV7deployed.json --jsonArray --drop
else
    echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") ERROR Invalid DevicesV7deployed.json JSON!"
    exit 1
fi
if jq empty Devices_deployed.json > /dev/null 2>&1; then
    mongoimport --db=dapete --collection=devices13 --file=Devices_deployed.json --jsonArray --drop
else
    echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") ERROR Invalid Devices_deployed.json JSON!"
    exit 1
fi

# FiberCables
if jq empty FiberCables.json > /dev/null 2>&1; then
    mongoimport --db=dapete --collection=fiber_cables --file=FiberCables.json --jsonArray --drop
else
    echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") ERROR Invalid FiberCables.json JSON!"
fi

# FiberTails
if jq empty FiberTails.json > /dev/null 2>&1; then
    mongoimport --db=dapete --collection=fiber_tails --file=FiberTails.json --jsonArray --drop
else
    echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") ERROR Invalid FiberTails.json JSON!"
fi

# IOFL
if jq empty IOFL.json > /dev/null 2>&1; then
    mongoimport --db=dapete --collection=iofl --file=IOFL.json --jsonArray --drop
else
    echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") ERROR Invalid IOFL.json JSON!"
fi

# NetworksV7
if jq empty NetworksV7_network.json > /dev/null 2>&1; then
    mongoimport --db=dapete --collection=networks_v7_openroadm_network --file=NetworksV7_network.json --jsonArray --drop
else
    echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") ERROR Invalid NetworksV7_network.json JSON!"
fi
if jq empty NetworksV7_topology.json > /dev/null 2>&1; then
    mongoimport --db=dapete --collection=networks_v7_openroadm_topology --file=NetworksV7_topology.json --jsonArray --drop
else
    echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") ERROR Invalid NetworksV7_topology.json JSON!"
fi
if jq empty NetworksV7_otn_topology.json > /dev/null 2>&1; then
    mongoimport --db=dapete --collection=networks_v7_openroadm_otn_topology --file=NetworksV7_otn_topology.json --jsonArray --drop
else
    echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") ERROR Invalid NetworksV7_otn_topology.json JSON!"
fi
if jq empty Networkv7_ietf_network_topology.json > /dev/null 2>&1; then
    mongoimport --db=dapete --collection=networks_v7_ietf_network_topology --file=Networkv7_ietf_network_topology.json --jsonArray --drop
else
    echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") ERROR Invalid Networkv7_ietf_network_topology.json JSON!"
fi

# Services
if jq empty Services.json > /dev/null 2>&1; then
    mongoimport --db=dapete --collection=services --file=Services.json --jsonArray --drop
else
    echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") ERROR Invalid Services.json JSON!"
fi
if jq empty TempServices.json > /dev/null 2>&1; then
    mongoimport --db=dapete --collection=temp_services --file=TempServices.json --jsonArray --drop
else
    echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") ERROR Invalid TempServices.json JSON!"
fi

# Create views
mongosh dapete devices.js
mongosh dapete fiber_cables.js
mongosh dapete fiber_tails.js
mongosh dapete iofl.js
mongosh dapete networks_v7.js
mongosh dapete services.js
mongosh dapete temp_services.js

mkdir -p ./outete

# Export views
echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") INFO Devices exports start"
mongoexport --db=dapete --collection=devices_base_rdm_view --type=csv --out=./outete/devices_base_rdm.csv --fields="node-id","current-datetime",clli,model,vendor,template,"node-number","serial-id",softwareVersion,latitude,longitude,etl_hash_id
mongoexport --db=dapete --collection=devices_base_xpdr_view --type=csv --out=./outete/devices_base_xpdr.csv --fields="node-id","current-datetime",clli,model,vendor,template,latitude,longitude,"node-number","serial-id",softwareVersion,etl_hash_id
mongoexport --db=dapete --collection=devices7_base_xpdr_view --type=csv --out=./outete/devices7_base_xpdr.csv --fields="node-id","current-datetime",clli,model,vendor,template,latitude,longitude,"node-number","serial-id","software-build",softwareVersion,etl_hash_id
mongoexport --db=dapete --collection=devices_circuit_packs_rdm_view --type=csv --out=./outete/devices_circuit_packs_rdm.csv --fields="node-id",template,"circuit-pack-category",clli,clei,"circuit-pack-name","circuit-pack-product-code","circuit-pack-model","circuit-pack-type","hardware-version","software-load-version","serial-id","product-code","manufacture-date","is-pluggable-optics",Shelf,slot,subSlot,vendor,type,"administrative-state","equipment-state","operational-state",etl_hash_id
mongoexport --db=dapete --collection=devices_circuit_packs_xpdr_view --type=csv --out=./outete/devices_circuit_pack_xpdr.csv --fields="node-id","circuit-pack-category","circuit-pack-name","circuit-pack-product-code","circuit-pack-type",clei,"hardware-version",model,"product-code","serial-id",Shelf,slot,"software-load-version",vendor,type,etl_hash_id
mongoexport --db=dapete --collection=devices7_circuit_pack_xpdr_view --type=csv --out=./outete/devices7_circuit_pack_xpdr.csv --fields="node-id",template,clli,"circuit-pack-name","circuit-pack-product-code","circuit-pack-type","faceplate-label","hardware-version",model,"serial-id","product-code",slot,vendor,"port-faceplate-label","port-direction","port-name","port-type",etl_hash_id
mongoexport --db=dapete --collection=devices_circuit_packs_cp_rdm_view --type=csv --out=./outete/devices_circuit_packs_cp_rdm.csv --fields="node-id","circuit-pack-category","circuit-pack-name",Shelf,slot,subSlot,"cp-slots-name","cp-slots-type","provisioned-circuit-pack",etl_hash_id
mongoexport --db=dapete --collection=devices_interfaces_rdm_view --type=csv --out=./outete/devices_interfaces_rdm.csv --fields="node-id",name,description,"administrative-state","operationale-state","circuit-id","supporting-circuit-pack-name","supporting-interface","supporting-port","mc-ttp-center-freq","mc-ttp-max-freq","mc-ttp-min-freq","mc-ttp-slot-width",nmc_ctp_frequency,nmc_ctp_width,type,"ethernet-auto-negotiation","ethernet-duplex","ethernet-speed","ethernet-fec","ethernet-mtu",etl_hash_id
mongoexport --db=dapete --collection=devices_interfaces_oms_rdm_view --type=csv --out=./outete/devices_interfaces_oms_rdm.csv --fields="node-id",name,"supporting-circuit-pack-name","supporting-interface","supporting-port",type,etl_hash_id
mongoexport --db=dapete --collection=devices_interfaces_ots_rdm_view --type=csv --out=./outete/devices_interfaces_ots_rdm.csv --fields="node-id",name,"supporting-circuit-pack-name","supporting-interface","supporting-port",type,etl_hash_id
mongoexport --db=dapete --collection=devices_physical_link_rdm_view --type=csv --out=./outete/devices_physical_link_rdm.csv --fields="node-id","physical-link-name","s-circuit-pack-name","s-port-name","d-circuit-pack-name","d-port-name",etl_hash_id
mongoexport --db=dapete --collection=devices_port_parents_rdm_view --type=csv --out=./outete/devices_port_parents_rdm.csv --fields="node-id",template,clli,"circuit-pack-name","circuit-pack-product-code","circuit-pack-mode","circuit-pack-type",Shelf,slot,subSlot,vendor,"parent-circuit-pack-slot-name","parent-circuit-pack-name","administrative-state","circuit-id","interface-name","logical-connection-point","port-direction","port-name","port-qual","port-type",etl_hash_id
mongoexport --db=dapete --collection=devices_srg_rdm_view --type=csv --out=./outete/devices_srg_rdm.csv --fields=node_id,openroadm_version,circuit_pack_name,circuit_pack_name_index,srg_number,max_add_drop_ports,current_provisioned_add_drop_ports,wavelength_duplication,center_freq_granularity,slot_width_granularity,mc_capabilities_max_slots,mc_capabilities_min_slots,mc_capability_profile_name,etl_hash_id
mongoexport --db=dapete --collection=devices_shelf_rdm_view --type=csv --out=./outete/devices_shelf_rdm.csv --fields="node-id","administrative-state",vendor,model,"hardware-version","operational-state","serial-id",rack,"shelf-name","shelf-position","shelf-type","provisioned-circuit-pack","slot-name","slot-status",etl_hash_id
mongoexport --db=dapete --collection=devices_shelf_xpdr_view --type=csv --out=./outete/devices_shelf_xpdr.csv --fields="node-id","administrative-state",vendor,model,"hardware-version","operational-state","serial-id",rack,"shelf-name","shelf-position","shelf-type","provisioned-circuit-pack",label,"slot-name","slot-status",etl_hash_id
mongoexport --db=dapete --collection=devices7_shelf_xpdr_view --type=csv --out=./outete/devices7_shelf_xpdr.csv --fields="node-id","administrative-state",vendor,model,"hardware-version","operational-state","serial-id",rack,"shelf-name","shelf-position","shelf-type","provisioned-circuit-pack",label,"slot-name","slot-status",etl_hash_id
mongoexport --db=dapete --collection=devices_degree_rdm_view --type=csv --out=./outete/devices_degree_rdm.csv --fields="node-id","degree-number","circuit-pack-name","port-name","max-wavelengths","center-freq-granularity","max-slots","min-slots","slot-width-granularity","otdr-port-circuit-pack-name","otdr-port-port-name",etl_hash_id

echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") INFO Fibers exports start"
mongoexport --db=dapete --collection=fiber_cables_base_view --type=csv --out=./outete/fiber_cables_base_rdm.csv --fields=name,"tail-clfi","strand-number","lifecycle-state","s-clli","s-rack","s-shelf","s-port","d-clli","d-rack","d-shelf","d-port",etl_hash_id

mongoexport --db=dapete --collection=fiber_tails_view --type=csv --out=./outete/fiber_tails.csv --fields=clfi,"type","towards-client-fiber-cable-name","towards-client-fiber-cable-strand-number","towards-client-type","towards-client-wiring-record-sequence-number","towards-client-svc-end-port-device","towards-client-svc-end-port-direction-used","towards-client-svc-end-port-lgx-name","towards-client-svc-end-port-name","towards-client-svc-end-port-rack","towards-client-svc-end-port-shelf","towards-network-fiber-cable-name","towards-network-xponder-circuit-pack-name","towards-network-xponder-device","towards-network-xponder-port-name","towards-network-svc-end-port-device","towards-network-svc-end-port-direction-used","towards-network-svc-end-port-lgx-name","towards-network-svc-end-port-name","towards-network-svc-end-port-rack",etl_hash_id

echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") INFO IOFL exports start"
mongoexport --db=dapete --collection=iofl_client_view --type=csv --out=./outete/iofl_client.csv --fields=clfi,"a-clli","z-clli","common-id","a-fiber-cable-name","a-fiber-cable-strand-number","a-roadm-faceplate-id","a-roadm-circuit-pack-name","a-roadm-name","a-roadm-port-name","z-fiber-cable-name","z-fiber-cable-strand-number","z-roadm-faceplate-id","z-roadm-circuit-pack-name","z-roadm-name","z-roadm-port-name",etl_hash_id
mongoexport --db=dapete --collection=iofl_network_view --type=csv --out=./outete/iofl_network.csv --fields=clfi,"a-clli","z-clli","common-id","a-fiber-cable-name","a-fiber-cable-strand-number","a-roadm-faceplate-id","a-roadm-circuit-pack-name","a-roadm-name","a-roadm-port-name","z-fiber-cable-name","z-fiber-cable-strand-number","z-roadm-faceplate-id","z-roadm-circuit-pack-name","z-roadm-name","z-roadm-port-name",etl_hash_id

echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") INFO Networks exports start"
mongoexport --db=dapete --collection=networks_v7_openroadm_network_view --type=csv --out=./outete/networks_v7_openroadm_network.csv --fields="node-id","lifecycle-state","node-type","network-ref","node-ref","equipment-available","equipment-capacity","operational-mode-id",etl_hash_id
mongoexport --db=dapete --collection=networks_v7_openroadm_topology_view --type=csv --out=./outete/networks_v7_openroadm_topology.csv --fields="node-id","tp-type","tp-id","lifecycle-state","node-type","srg-number","supporting-node-network-ref","supporting-node-ref",etl_hash_id
mongoexport --db=dapete --collection=networks_v7_openroadm_otn_topology_view --type=csv --out=./outete/networks_v7_openroadm_otn_topology.csv --fields="node-id","node-type","degree-number","tp-type","tp-id","node-ref",etl_hash_id
mongoexport --db=dapete --collection=networks_v7_ietf_network_topology_view --type=csv --out=./outete/networks_v7_ietf_network_topology.csv --fields="link-id","source-node","source-tp","dest-node","dest-tp","administrative-state",clfi,"lifecycle-state","link-type",etl_hash_id

echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") INFO Services exports start"
mongoexport --db=dapete --collection=services_base_view --type=csv --out=./outete/services_base.csv --fields="common-id","service-name","lifecycle_state","service_layer","connection_type","source-tail-clfi","destination-tail-clfi","a-end-clli","a-end-optic-type","a-end-service-rate","a-end-rx-direction-port-circuit-pack-name","a-end-rx-direction-port-device-name","a-end-rx-direction-port-name","a-end-rx-direction-port-rack","a-end-rx-direction-port-shelf","a-end-rx-direction-port-type","a-end-tx-direction-port-circuit-pack-name","a-end-tx-direction-port-device-name","a-end-tx-direction-port-name","a-end-tx-direction-port-rack","a-end-tx-direction-port-shelf","a-end-tx-direction-port-type","z-end-clli","z-end-optic-type","z-end-service-rate","z-end-rx-direction-port-circuit-pack-name","z-end-rx-direction-port-device-name","z-end-rx-direction-port-name","z-end-rx-direction-port-rack","z-end-rx-direction-port-shelf","z-end-rx-direction-port-type","z-end-tx-direction-port-circuit-pack-name","z-end-tx-direction-port-device-name","z-end-tx-direction-port-name","z-end-tx-direction-port-rack","z-end-tx-direction-port-shelf","z-end-tx-direction-port-type",etl_hash_id
mongoexport --db=dapete --collection=services_a_2_z_topology_view --type=csv --out=./outete/services_a_2_z_topology.csv --fields=common_id,service_name,hop_type,hop_id,resourceType,device,interface_name,trib_slots,opucn_trib_slots,circuit_pack_name,port_name,resource_service_name,frequency,width,source_tail_clfi,destination_tail_clf,odu_rate,oducn_n_rate,trib_port_number,etl_hash_id
mongoexport --db=dapete --collection=services_z_2_a_topology_view --type=csv --out=./outete/services_z_2_a_topology.csv --fields=common_id,service_name,hop_type,hop_id,resourceType,device,interface_name,trib_slots,opucn_trib_slots,circuit_pack_name,port_name,resource_service_name,frequency,width,source_tail_clfi,destination_tail_clf,odu_rate,oducn_n_rate,trib_port_number,etl_hash_id
mongoexport --db=dapete --collection=services_a_2_z_network_topology_view --type=csv --out=./outete/services_a_2_z_network_topology.csv --fields="common-id","service-name","source-tail-clfi","destination-tail-clfi",id,"a-z-tp-id","a-z-tp-node-id",etl_hash_id
mongoexport --db=dapete --collection=services_z_2_a_network_topology_view --type=csv --out=./outete/services_z_2_a_network_topology.csv --fields="common-id","service-name","source-tail-clfi","destination-tail-clfi",id,"z-a-tp-id","z-a-tp-node-id",etl_hash_id
echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") INFO Temp Services exports start"
mongoexport --db=dapete --collection=temp_services_base_view --type=csv --out=./outete/temp_services_base.csv --fields=common_id,connection_type,is_bandwidth_locked,lifecycle_state,resource_status,service_layer,a_clli,a_optic_type,a_service_format,a_service_rate,a_rx_port_circuit_pack_name,a_rx_port_circuit_device_name,a_rx_port_type,a_tx_port_circuit_pack_name,a_tx_port_circuit_device_name,a_tx_port_type,z_clli,z_optic_type,z_service_format,z_service_rate,z_rx_port_circuit_pack_name,z_rx_port_circuit_device_name,z_rx_port_type,z_tx_port_circuit_pack_name,z_tx_port_circuit_device_name,z_tx_port_type,etl_hash_id
mongoexport --db=dapete --collection=temp_services_a_2_z_topology_view --type=csv --out=./outete/temp_services_a_2_z_topology.csv --fields=common_id,id,device_node_id,hop_type,resource_interface_name,resource_type,resourcetype,circuit_pack_name,port_name,nmc_ctp_frequency,nmc_ctp_width,connection_name,service_name,etl_hash_id
mongoexport --db=dapete --collection=temp_services_z_2_a_topology_view --type=csv --out=./outete/temp_services_z_2_a_topology.csv --fields=common_id,id,device_node_id,hop_type,resource_interface_name,resource_type,resourcetype,circuit_pack_name,port_name,nmc_ctp_frequency,nmc_ctp_width,connection_name,service_name,etl_hash_id

# Store in Azure container

cd ./out

echo "$(date -u +"%Y-%m-%dT%H:%M:%S.%3N+0000") INFO Azure processed files upload start"
../upload-csv.sh devices_base_rdm.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh devices_base_xpdr.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh devices7_base_xpdr.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh devices_circuit_packs_rdm.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh devices_circuit_packs_cp_rdm.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh devices_interfaces_rdm.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh devices_interfaces_oms_rdm.csv $URL_CSV $VNC_CSV_SAS 
../upload-csv.sh devices_interfaces_ots_rdm.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh devices_physical_link_rdm.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh devices_port_parents_rdm.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh devices_srg_rdm.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh devices_shelf_rdm.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh devices_shelf_xpdr.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh devices7_shelf_xpdr.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh devices_degree_rdm.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh devices_circuit_pack_xpdr.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh devices7_circuit_pack_xpdr.csv $URL_CSV $VNC_CSV_SAS

../upload-csv.sh fiber_cables_base_rdm.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh fiber_tails.csv $URL_CSV $VNC_CSV_SAS

../upload-csv.sh iofl_client.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh iofl_network.csv $URL_CSV $VNC_CSV_SAS

../upload-csv.sh networks_v7_openroadm_network.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh networks_v7_openroadm_topology.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh networks_v7_openroadm_otn_topology.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh networks_v7_ietf_network_topology.csv $URL_CSV $VNC_CSV_SAS

../upload-csv.sh services_base.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh services_a_2_z_topology.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh services_z_2_a_topology.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh services_a_2_z_network_topology.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh services_z_2_a_network_topology.csv $URL_CSV $VNC_CSV_SAS

../upload-csv.sh temp_services_base.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh temp_services_a_2_z_topology.csv $URL_CSV $VNC_CSV_SAS
../upload-csv.sh temp_services_z_2_a_topology.csv $URL_CSV $VNC_CSV_SAS


cd ..