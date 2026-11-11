#!/bin/bash

mongoexport --db=dap --collection=fiber_cables_base_view --type=csv --out=fiber_cables_base.csv --fields=name,"tail-clfi","strand-number","lifecycle-state","s-clli","s-rack","s-shelf","s-port","d-clli","d-rack","d-shelf","d-port"
