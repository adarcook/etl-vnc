#!/bin/bash

mongoexport --db=dap --collection=devices_circuit_packs_cp_rdm --type=csv --out=devices_circuit_packs_cp_rdm.csv --fields="node-id","circuit-pack-category","circuit-pack-name",Shelf,slot,subSlot,"cp-slots-name","cp-slots-type","provisioned-circuit-pack",etl_hash_id


