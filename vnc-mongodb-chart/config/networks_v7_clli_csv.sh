#!/bin/bash

mongoexport --db=dap --collection=networks_v7_clli_view --type=csv --out=networks_v7_clli.csv --fields=clli
