#!/bin/bash

mongoexport --db=dap --collection=services_a_2_z_topology_view --type=csv --out=services_a_2_z_topology.csv --fields="common-id","service-name","source-tail-clfi","destination-tail-clfi","hop-type","hop-id","resource-service-name","resourceType","device","circuit-pack-name","port-name","interface-name","frequency","width"
