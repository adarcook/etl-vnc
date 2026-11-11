#!/bin/bash

mongoexport --db=dap --collection=services_z_2_a_view --type=csv --out=services_z_2_a.csv --fields="common-id","service-name","source-tail-clfi","destination-tail-clfi",id,"tp-id","tp-node-id"
