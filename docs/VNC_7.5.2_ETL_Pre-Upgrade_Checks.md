# VNC 7.5.2 Upgrade: ETL Pre-Upgrade Checks

## Context

In the meeting, the VNC team expected no immediate model-schema changes from the 7.5.1 to 7.5.2 upgrade. They expected new fields or values to appear only when the related capabilities are deployed in the production network. Treat this as a meeting statement, not as confirmation of the current rollout state. The meeting's dates and deployment forecasts should also be reconfirmed.

## Checks Before the Upgrade

1. **Capture a baseline.** Record CSV headers, row counts, and representative rows before the change, especially for interfaces, ports, and services. The [ETL mapping](ETL_JSON_to_CSV_Mapping_HE.md) documents observed code behavior, but says the ETL was not run against the archive and generated CSVs were not inspected.

2. **Confirm which source files the run will consume.** `do-all.sh` searches the working directory recursively for files larger than 1 MiB matching the API filename patterns. Multiple matches write to the same intermediate JSON path, so a later match can replace an earlier one. The script's temporary-file cleanup is disabled. Device imports are critical and use `--drop`; other imports can fail without stopping the run. Confirm the selected files are from the intended archive and that every expected dataset was imported. See [`do-all.sh`](../vnc-mongodb-chart/config/do-all.sh#L357) and its import logic at [`do-all.sh`](../vnc-mongodb-chart/config/do-all.sh#L403).

3. **Check which new data is actually represented in CSVs.**
   - New loopback or GCC interfaces may appear because the interface exports include interface `name` and `type`. However, the current selected columns do not include an IP address or detailed GCC attributes. See the [interface mapping](ETL_JSON_to_CSV_Mapping_HE.md#L616) and [`devices.js`](../vnc-mongodb-chart/config/devices.js#L498).
   - The meeting described a changed CLFI factor in the service name. The ETL exports `service-name` as a value, so verify that downstream consumers accept the new value format.
   - Multi-port and breakout optics may increase the number of exported port rows. The current port export does not explicitly include a parent-port relationship. Its `parent-circuit-pack-*` columns describe a parent circuit pack, not a parent port. See the [port mapping](ETL_JSON_to_CSV_Mapping_HE.md#L716).
   - I found no active CSV export for routing instances or static routes in `do-all.sh`.
   - The meeting mentioned a maximum-span-loss field. I found no export for that field in the active pipeline. The separate `OperationalNetworksDS.js` view projects `span-loss`; it is not part of the view-script list in `do-all.sh`.

4. **Verify outputs, not just process completion.** The export function records failures and continues, so a completed run alone does not establish that every CSV was produced successfully. Check the import/export summaries, expected files, headers, and row counts, then compare the results with the baseline. See the export calls in [`do-all.sh`](../vnc-mongodb-chart/config/do-all.sh#L458).

## Bottom Line

Based on the meeting, an immediate schema break was not expected for 7.5.2. The main ETL concerns are that newly populated attributes may not be selected into CSVs, breakout-port relationships may be absent, or the run may process incomplete or unintended inputs. Compare the actual JSON and CSV outputs; do not rely only on the meeting expectation or a successful process exit.
