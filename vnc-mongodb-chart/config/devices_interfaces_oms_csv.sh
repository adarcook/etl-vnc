#!/bin/bash

mongoexport --db=dap --collection=devices_interfaces_oms_rdm_view --type=csv --out=devices_interfaces_rdm_oms.csv --fields="node-id",name,"supporting-circuit-pack-name","supporting-interface","supporting-port",type,etl_hash_id