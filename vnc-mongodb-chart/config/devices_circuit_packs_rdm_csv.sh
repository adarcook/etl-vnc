#!/bin/bash

mongoexport --db=dap --collection=devices_circuit_packs_cp_rdm --type=csv --out=devices_circuit_packs_rdm.csv --fields="node-id",template,"circuit-pack-category",clli,clei,"circuit-pack-name","circuit-pack-product-code","circuit-pack-model","circuit-pack-type","hardware-version","serial-id","manufacture-date","is-pluggable-optics",Shelf,slot,subSlot,vendor,"equipment-state",etl_hash_id


