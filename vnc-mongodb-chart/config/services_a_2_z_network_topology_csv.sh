#!/bin/bash

mongoexport --db=dap --collection=services_a_2_z_network_topology_view --type=csv --out=services_a_2_z_network_topology.csv --fields="common-id","service-name","source-tail-clfi","destination-tail-clfi","common-id","service-name",id,"a-z-tp-id","a-z-tp-node-id"