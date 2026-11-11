#!/bin/bash

mongoexport --db=dap --collection=devices_port_parents_rdm_view --type=csv --out=devices_port_parents_rdm.csv --fields="node-id",template,clli,"circuit-pack-name","circuit-pack-product-code","circuit-pack-model","circuit-pack-type",Shelf,slot,subSlot,vendor,"parent-circuit-pack-slot-name","parent-circuit-pack-name","port-direction","port-name","port-qual","port-type",etl_hash_id
