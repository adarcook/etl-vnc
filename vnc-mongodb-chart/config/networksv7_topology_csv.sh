#!/bin/bash

mongoexport --db=dap --collection=networks_v7_openroadm_otn_topology_view --type=csv --out=networks_v7_openroadm_otn_topology.csv --fields="node-id","node-type","degree-number","tp-type","tp-id","node-ref"
