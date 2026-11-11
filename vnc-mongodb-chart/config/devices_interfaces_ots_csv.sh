#!/bin/bash

mongoexport --db=dap --collection=devices_interfaces_ots_rdm_view --type=csv --out=devices_interfaces_ots_rdm.csv --fields="node-id",name,"supporting-circuit-pack-name","supporting-interface","supporting-port",type
