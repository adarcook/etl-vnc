#!/bin/bash

mongoexport --db=dap --collection=services_z_2_a_network_topology_view --type=csv --out=services_z_2_a_network_topology.csv --fields="common-id","service-name","source-tail-clfi","destination-tail-clfi","common-id","service-name",id,"z-a-tp-id","z-a-tp-node-id"