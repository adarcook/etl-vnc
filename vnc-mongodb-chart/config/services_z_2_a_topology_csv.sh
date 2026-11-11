#!/bin/bash

mongoexport --db=dap --collection=services_z_2_a_topology_view --type=csv --out=services_z_2_a_topology.csv --fields="common-id","service-name","source-tail-clfi","destination-tail-clfi","hop-type","hop-id","resource-service-name","resourceType","device","circuit-pack-name","port-name","interface-name","frequency","width"
