#!/bin/bash

mongoexport --db=dap --collection=devices_base_rdm_view --type=csv --out=devices_base_rdm.csv --fields="node-id","current-datetime",clli,model,vendor,template,"node-number","serial-id",softwareVersion,latitude,longitude,etl_hash_id
