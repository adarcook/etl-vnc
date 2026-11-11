#!/bin/bash

mongoexport --db=dap --collection=iofl_network_view --type=csv --out=iofl_network.csv --fields=clfi,"a-clli","z-clli","common-id","a-fiber-cable-name","a-fiber-cable-strand-number","a-roadm-faceplate-id","a-roadm-circuit-pack-name","a-roadm-name","a-roadm-port-name","z-fiber-cable-name","z-fiber-cable-strand-number","z-roadm-faceplate-id","z-roadm-circuit-pack-name","z-roadm-name","z-roadm-port-name"
