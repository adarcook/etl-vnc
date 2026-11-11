#!/bin/bash

mongoexport --db=dap --collection=devices_physical_link_rdm_view --type=csv --out=devices_physical_link_rdm.csv --fields="node-id","physical-link-name","s-circuit-pack-name","s-port-name","d-circuit-pack-name","d-port-name",etl_hash_id
