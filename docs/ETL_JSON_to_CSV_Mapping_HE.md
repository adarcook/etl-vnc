# ETL Mapping: JSON Input to CSV Output

Date: November 11, 2026. Based on code read from the `main` branch and the local archive report in [Issue #2](https://github.com/adarcook/etl-vnc/issues/2).

This document describes observed code behavior; it does not validate the business requirements. The ETL was not run against the archive, and generated CSV files were not inspected. The input report includes only a partial structural inspection: the large DevicesV7, FiberCables, and Services files were not fully analyzed. The CSV column definitions below come from export commands, not from guesses based on filenames.

## How to Read This Document

1. **Stage 1 — Input:** Which files are selected, and which intermediate JSON files they produce.
2. **Stage 2 — Transformations:** For every CSV, its JSON source, entity meaning, row granularity, filters, and flattening rules.
3. **Stage 3 — CSV Schemas:** Every output column in its actual order, with its source or derivation rule.

Terminology: a device is a network equipment unit; a circuit pack is a component inside a device; a port is a connection point; a shelf houses circuit packs; a slot holds a circuit pack; topology describes connectivity; a service describes a provisioned connection and its associated resources or route. The code distinguishes device types using `rdm` and `xpdr`. Familiarity with the underlying optical technologies is not required to follow the transformations.

## Stage 1 — Input Selection and Intermediate JSON Extraction

The entry script is [do-all.sh](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/do-all.sh). During a normal run, the archive must exceed 50,000,000 bytes. After extraction, `find` selects regular files larger than 1 MiB whose names match the patterns below. The search covers the working directory and its subdirectories, **not only members of the latest extracted archive**.

| Filename pattern | Extracted key | Intermediate JSON | MongoDB collection in `dap` |
|---|---|---|---|
| `*_GetDevicesV2deployed*` | `openroadm-devices` | `DevicesV2deployed.json` | `devices` |
| `*_GetDevicesV7deployed*` | `openroadm-devices` | `DevicesV7deployed.json` | `devices7` |
| `*_GetFiberCables*` | `fiber-cable` | `FiberCables.json` | `fiber_cables` |
| `*_GetFiberTails*` | `tail` | `FiberTails.json` | `fiber_tails` |
| `*_GetIOFL*` | `inter-office-fiber-link` | `IOFL.json` | `iofl` |
| `*_GetServices*` | `services` | `Services.json` | `services` |

### Network File Extraction

The patterns `*_GetNetworksV7*` and `*_GetNetworksV13*` follow the same logic. Let `N` be the version number (7 or 13).

| Selection from `network-list` | Intermediate JSON (`N` is the version) | Collection |
|---|---|---|
| `node` from the first network with `network-id = openroadm-network` | `NetworksVN_network.json` | `networks_vN_openroadm_network` |
| `node` from the first network with `network-id = openroadm-topology` | `NetworksVN_topology.json` | `networks_vN_openroadm_topology` |
| `node` from the first network with `network-id = otn-topology` | `NetworksVN_otn_topology.json` | `networks_vN_openroadm_otn_topology` |
| All `ietf-network-topology:link` elements across networks | `NetworkvN_ietf_network_topology.json` | `networks_vN_ietf_network_topology` |

For example, `NetworksV13_network.json` and `Networkv13_ietf_network_topology.json`. Differences in capitalization and the presence of `s` reflect the actual code. Node extraction uses the **first matching network only**. Link extraction gathers links from all networks and skips missing arrays. This path does not extract a separate CLLI network.

### Excluded Inputs and Overwrite Risks

- Planned device files, generic device files without `deployed`, V13 devices, `GetTempServices`, subscriptions, and action handlers are not selected by the current run patterns.
- According to the report, `GetNetworksV7` is 44 bytes and fails the size threshold; `GetNetworksV13` passes it.
- If several files match the same pattern, each rewrites the **same intermediate JSON** using `>`. The last processed file replaces the earlier content; this is **not a merge**. The available report does not establish that an actual collision occurred.
- Stale files left in the working directory may be picked up. Cleanup of intermediate files is disabled in the inspected code.
- Imports use `--jsonArray --drop`, replacing the target collection's documents. Both device inputs are critical; failures for other inputs are counted and execution may continue. Continued execution is **not proof** that every dataset was loaded.
- V7 network files are imported if available, but the four active network CSV exports use **V13 sources** even though their output filenames contain `v7`.

## Stage 2 — Transformation Rules by JSON Source and CSV Output

### Shared Rules

- **Field selection:** Only columns explicitly selected by the export command reach the CSV. A field present in the JSON or even in a MongoDB view is not necessarily exported.
- **Array unwinding:** Each array element becomes a row and parent attributes are repeated. Additional unwinds refine granularity further (e.g., shelf followed by slots produces rows per slot).
- **Missing or empty arrays:** With preservation enabled, a parent row remains even without an element; without it, that parent contributes no row at that unwind stage. This describes array handling; `$unwind` may treat a non-null scalar as a single element.
- **FIRST:** Selects element 0 from the array of values returned by a path. It is performed **per field**, not sorted by `sequence-number`; missing fields can mean independently selected values do not all belong to the same resource instance.
- **RDM union:** `devices7` and `devices` are combined with `$unionWith`, then filtered using `info.node-type = rdm`. There is **no deduplication or version preference**. This is an intermediate MongoDB view, not a merged JSON file.
- **Hash:** Before hashing, fields are converted to strings, concatenated without a separator, and nulls are replaced with empty strings; then `$toHashedIndexKey` is applied. Uniqueness is not guaranteed, nor is this a stable business key. Hash inputs can include fields beyond those exported. String conversion is not guaranteed to work for arrays/objects; the code has no general fallback for such failures.
- **Ordering:** CSV column order is fixed. No inspected `sort` guarantees business-significant row order.

### 2.1 — `devices_base_rdm.csv`

**Source JSON:** ``DevicesV2deployed.json + DevicesV7deployed.json (RDM union)``

**Entity and row granularity:** RDM device attributes; one row per filtered device document.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices_base_rdm_view`.

- The source combines V2 and V7 RDM documents without deduplication.
- Filter: `{"org-openroadm-device.info.node-type":"rdm"}`.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.2 — `devices_base_xpdr.csv`

**Source JSON:** ``DevicesV2deployed.json``

**Entity and row granularity:** V2 XPDR device attributes; one row per device document.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices_base_xpdr_view`.

- Filter: `{"org-openroadm-device.info.node-type":"xpdr"}`.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.3 — `devices7_base_xpdr.csv`

**Source JSON:** ``DevicesV7deployed.json``

**Entity and row granularity:** V7 XPDR device attributes; one row per device document.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices7_base_xpdr_view`.

- Filter: `{"org-openroadm-device.info.node-type":"xpdr"}`.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.4 — `devices_circuit_packs_rdm.csv`

**Source JSON:** ``DevicesV2deployed.json + DevicesV7deployed.json (RDM union)``

**Entity and row granularity:** Circuit packs in RDM devices; one row per circuit pack with parent device attributes.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices_circuit_packs_rdm_view`.

- The source combines V2 and V7 RDM documents without deduplication.
- Filter: `{"org-openroadm-device.info.node-type":"rdm"}`.
- Unwind `org-openroadm-device.circuit-packs` into rows; preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.5 — `devices_circuit_pack_xpdr.csv`

**Source JSON:** ``DevicesV2deployed.json``

**Entity and row granularity:** Circuit packs in V2 XPDR devices; one row per circuit pack.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices_circuit_packs_xpdr_view`.

- Filter: `{"org-openroadm-device.info.node-type":"xpdr"}`.
- Unwind `org-openroadm-device.circuit-packs` into rows; preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.6 — `devices7_circuit_pack_xpdr.csv`

**Source JSON:** ``DevicesV7deployed.json``

**Entity and row granularity:** Circuit packs and ports in V7 XPDR devices; the actual granularity is one row per port within a circuit pack, not one per pack.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices7_circuit_pack_xpdr_view`.

- Filter: `{"org-openroadm-device.info.node-type":"xpdr"}`.
- Unwind `org-openroadm-device.circuit-packs` into rows; preserve rows for missing/empty arrays.
- Unwind `ports` into rows; do not preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.7 — `devices_circuit_packs_cp_rdm.csv`

**Source JSON:** ``DevicesV2deployed.json + DevicesV7deployed.json (RDM union)``

**Entity and row granularity:** Nested slots within RDM circuit packs; one row per cp-slot.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices_circuit_packs_cp_rdm_view`.

- The source combines V2 and V7 RDM documents without deduplication.
- Filter: `{"org-openroadm-device.info.node-type":"rdm"}`.
- Unwind `org-openroadm-device.circuit-packs` into rows; preserve rows for missing/empty arrays.
- Unwind `org-openroadm-device.circuit-packs.cp-slots` into rows; do not preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.8 — `devices_interfaces_rdm.csv`

**Source JSON:** ``DevicesV2deployed.json + DevicesV7deployed.json (RDM union)``

**Entity and row granularity:** RDM device interfaces; one row per interface.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices_interfaces_rdm_view`.

- The source combines V2 and V7 RDM documents without deduplication.
- Filter: `{"org-openroadm-device.info.node-type":"rdm"}`.
- Unwind `org-openroadm-device.interface` into rows; do not preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.9 — `devices_interfaces_xpdr.csv`

**Source JSON:** ``DevicesV7deployed.json``

**Entity and row granularity:** V7 XPDR interfaces only; one row per interface. V2 is not unioned here.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices_interfaces_xpdr_view`.

- Filter: `{"org-openroadm-device.info.node-type":"xpdr"}`.
- Unwind `org-openroadm-device.interface` into rows; do not preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.10 — `devices_interfaces_oms_rdm.csv`

**Source JSON:** ``DevicesV2deployed.json + DevicesV7deployed.json (RDM union)``

**Entity and row granularity:** Subset of RDM interfaces whose name contains `oms-`; filtering is by name, not by interface type.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices_interfaces_oms_rdm_view`.

- The source combines V2 and V7 RDM documents without deduplication.
- Filter: `{"org-openroadm-device.info.node-type":"rdm"}`.
- Unwind `org-openroadm-device.interface` into rows; do not preserve rows for missing/empty arrays.
- Filter: `{"name":{"$regex":"oms-"}}`.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.11 — `devices_interfaces_ots_rdm.csv`

**Source JSON:** ``DevicesV2deployed.json + DevicesV7deployed.json (RDM union)``

**Entity and row granularity:** Subset of RDM interfaces whose name contains `ots-`; filtering is by name, not by interface type.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices_interfaces_ots_rdm_view`.

- The source combines V2 and V7 RDM documents without deduplication.
- Filter: `{"org-openroadm-device.info.node-type":"rdm"}`.
- Unwind `org-openroadm-device.interface` into rows; do not preserve rows for missing/empty arrays.
- Filter: `{"name":{"$regex":"ots-"}}`.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.12 — `devices_physical_link_rdm.csv`

**Source JSON:** ``DevicesV2deployed.json + DevicesV7deployed.json (RDM union)``

**Entity and row granularity:** Physical links described inside RDM device documents, including source/destination circuit packs and ports; one row per physical link.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices_physical_link_rdm_view`.

- The source combines V2 and V7 RDM documents without deduplication.
- Filter: `{"org-openroadm-device.info.node-type":"rdm"}`.
- Unwind `org-openroadm-device.physical-link` into rows; do not preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.13 — `devices_port_parents_rdm.csv`

**Source JSON:** ``DevicesV2deployed.json + DevicesV7deployed.json (RDM union)``

**Entity and row granularity:** Ports in RDM circuit packs and references to their parent packs; one row per port, preserving parents without ports. `interface-name` uses the first value.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices_port_parents_rdm_view`.

- The source combines V2 and V7 RDM documents without deduplication.
- Filter: `{"org-openroadm-device.info.node-type":"rdm"}`.
- Unwind `org-openroadm-device.circuit-packs` into rows; preserve rows for missing/empty arrays.
- Unwind `ports` into rows; preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.14 — `devices_srg_rdm.csv`

**Source JSON:** ``DevicesV2deployed.json + DevicesV7deployed.json (RDM union)``

**Entity and row granularity:** Shared-risk groups and the circuit packs assigned to them; one row per pack within a group, preserving missing parents. No independent risk calculation is performed.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices_srg_rdm_view`.

- The source combines V2 and V7 RDM documents without deduplication.
- Filter: `{"org-openroadm-device.info.node-type":"rdm"}`.
- Unwind `shared-risk-group` into rows; preserve rows for missing/empty arrays.
- Unwind `shared-risk-group.circuit-packs` into rows; preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.15 — `devices_shelf_rdm.csv`

**Source JSON:** ``DevicesV2deployed.json + DevicesV7deployed.json (RDM union)``

**Entity and row granularity:** RDM shelves and their slots; effectively one row per slot within a shelf, preserving devices/shelves without nested entries.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices_shelf_rdm_view`.

- The source combines V2 and V7 RDM documents without deduplication.
- Filter: `{"org-openroadm-device.info.node-type":"rdm"}`.
- Unwind `org-openroadm-device.shelves` into rows; preserve rows for missing/empty arrays.
- Unwind `org-openroadm-device.shelves.slots` into rows; preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.16 — `devices_shelf_xpdr.csv`

**Source JSON:** ``DevicesV2deployed.json``

**Entity and row granularity:** V2 XPDR shelves and their slots; effectively one row per slot, preserving devices/shelves without nested entries.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices_shelf_xpdr_view`.

- Filter: `{"org-openroadm-device.info.node-type":"xpdr"}`.
- Unwind `org-openroadm-device.shelves` into rows; preserve rows for missing/empty arrays.
- Unwind `org-openroadm-device.shelves.slots` into rows; preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.17 — `devices7_shelf_xpdr.csv`

**Source JSON:** ``DevicesV7deployed.json``

**Entity and row granularity:** V7 XPDR shelves and their slots; effectively one row per slot, preserving devices/shelves without nested entries.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices7_shelf_xpdr_view`.

- Filter: `{"org-openroadm-device.info.node-type":"xpdr"}`.
- Unwind `org-openroadm-device.shelves` into rows; preserve rows for missing/empty arrays.
- Unwind `org-openroadm-device.shelves.slots` into rows; preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.18 — `devices_degree_rdm.csv`

**Source JSON:** ``DevicesV2deployed.json + DevicesV7deployed.json (RDM union)``

**Entity and row granularity:** RDM degrees and their connection ports; one row per connection port, preserving missing parents.

**Implementation:** [devices.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js); view: `devices_degree_rdm_view`.

- The source combines V2 and V7 RDM documents without deduplication.
- Filter: `{"org-openroadm-device.info.node-type":"rdm"}`.
- Unwind `org-openroadm-device.degree` into rows; preserve rows for missing/empty arrays.
- Unwind `org-openroadm-device.degree.connection-ports` into rows; preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.19 — `fiber_cables_base_rdm.csv`

**Source JSON:** ``FiberCables.json``

**Entity and row granularity:** Fiber cables and their strands; one row per `fiber-cable-strand`. A cable without strands produces no rows.

**Implementation:** [fiber_cables.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/fiber_cables.js); view: `fiber_cables_base_view`.

- Unwind `fiber-cable-strand` into rows; do not preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.20 — `fiber_tails.csv`

**Source JSON:** ``FiberTails.json``

**Entity and row granularity:** A fiber-tail summary with client-facing and network-facing connection details; one row per tail document. The first value is selected independently for each path. `wiring-record-entry` is not expanded into rows.

**Implementation:** [fiber_tails.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/fiber_tails.js); view: `fiber_tails_view`.

- The view does not unwind arrays or filter records; it selects and derives fields.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.21 — `iofl_client.csv`

**Source JSON:** ``IOFL.json``

**Entity and row granularity:** Inter-office fiber link (IOFL), client-side view; one row per IOFL document with A/Z endpoints. Resource fields use independent FIRST selection.

**Implementation:** [iofl.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/iofl.js); view: `iofl_client_view`.

- The view does not unwind arrays or filter records; it selects and derives fields.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.22 — `iofl_network.csv`

**Source JSON:** ``IOFL.json``

**Entity and row granularity:** The same inter-office link, network-side view; one row per IOFL document with A/Z endpoints. No join to `FiberTails` is performed: nested tails from the IOFL document are used.

**Implementation:** [iofl.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/iofl.js); view: `iofl_network_view`.

- The view does not unwind arrays or filter records; it selects and derives fields.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.23 — `networks_v7_openroadm_network.csv`

**Source JSON:** ``NetworksV13_network.json``

**Entity and row granularity:** Network nodes and supported XPDR capabilities; one row per `supported-xpdr`, preserving nodes without the array. `supporting-node` references and operational modes use FIRST.

**Implementation:** [networks_v7.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/networks_v7.js); view: `networks_v13_openroadm_network_view`.

- Unwind `org-openroadm-network:node-capabilities.supported-xpdr-list.supported-xpdr` into rows; preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.24 — `networks_v7_openroadm_topology.csv`

**Source JSON:** ``NetworksV13_topology.json``

**Entity and row granularity:** Node termination points; one row per termination point, preserving nodes without the array. `supporting-node` uses FIRST.

**Implementation:** [networks_v7.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/networks_v7.js); view: `networks_v13_openroadm_topology_view`.

- Unwind `ietf-network-topology:termination-point` into rows; preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.25 — `networks_v7_openroadm_otn_topology.csv`

**Source JSON:** ``NetworksV13_otn_topology.json``

**Entity and row granularity:** Termination points in `otn-topology` nodes; one row per termination point, preserving missing arrays. The export column mismatch is documented below.

**Implementation:** [networks_v7.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/networks_v7.js); view: `networks_v13_openroadm_otn_topology_view`.

- Unwind `ietf-network-topology:termination-point` into rows; preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.26 — `networks_v7_ietf_network_topology.csv`

**Source JSON:** ``Networkv13_ietf_network_topology.json``

**Entity and row granularity:** Connectivity from a source node/termination point to a destination node/termination point; one row per extracted link. No status filter is applied in the view.

**Implementation:** [networks_v7.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/networks_v7.js); view: `networks_v13_ietf_network_topology_view`.

- The view does not unwind arrays or filter records; it selects and derives fields.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.27 — `services_base.csv`

**Source JSON:** ``Services.json``

**Entity and row granularity:** Service attributes and A/Z endpoints; one row per service. RX/TX port attributes use FIRST. This view does not filter for `deployed` services.

**Implementation:** [services.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/services.js); view: `services_base_view`.

- The view does not unwind arrays or filter records; it selects and derives fields.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.28 — `services_a_2_z_topology.csv`

**Source JSON:** ``Services.json``

**Entity and row granularity:** Service path steps from A to Z; one row per `topology.aToZ` element. No `deployed` filter.

**Implementation:** [services.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/services.js); view: `services_a_2_z_topology_view`.

- Unwind `topology.aToZ` into rows; do not preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.29 — `services_z_2_a_topology.csv`

**Source JSON:** ``Services.json``

**Entity and row granularity:** Service path steps from Z to A; one row per `topology.zToA` element. No `deployed` filter.

**Implementation:** [services.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/services.js); view: `services_z_2_a_topology_view`.

- Unwind `topology.zToA` into rows; do not preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.30 — `services_a_2_z_network_topology.csv`

**Source JSON:** ``Services.json``

**Entity and row granularity:** Network resources along the A-to-Z service path; deployed services only, one row per `network-topology.a-to-z` element.

**Implementation:** [services.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/services.js); view: `services_a_2_z_network_topology_view`.

- Filter: `{"lifecycle-state":"deployed"}`.
- Unwind `network-topology.a-to-z` into rows; do not preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.31 — `services_z_2_a_network_topology.csv`

**Source JSON:** ``Services.json``

**Entity and row granularity:** Network resources along the Z-to-A service path; deployed services only, one row per `network-topology.z-to-a` element.

**Implementation:** [services.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/services.js); view: `services_z_2_a_network_topology_view`.

- Filter: `{"lifecycle-state":"deployed"}`.
- Unwind `network-topology.z-to-a` into rows; do not preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

### 2.32 — `services_otn.csv`

**Source JSON:** ``Services.json``

**Entity and row granularity:** Relationship between a deployed service and a supporting service; one row per `supporting-service-name`. Despite the CSV filename, the code does not apply an additional service-layer filter.

**Implementation:** [services.js](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/services.js); view: `services_otn_view`.

- Filter: `{"lifecycle-state":"deployed"}`.
- Unwind `supporting-service-name` into rows; do not preserve rows for missing/empty arrays.
- Select/rename fields and compute the hash as described in the shared rules; see Stage 3 for exact output columns and sources.

## Stage 3 — Exact CSV Column Schemas and Field Sources

Each output file is written to the `out` directory. The first table column specifies CSV column order. Field paths are relative to documents imported into MongoDB collections after Stage 1 extraction. Array unwinding is documented in Stage 2; a nested path after an unwind refers to the current array element. FIRST selects element 0. No joins between files are assumed.

The mapping also traces intermediate names throughout `$project` stages. Fields lost during projections are explicitly marked missing; typos in source code are not silently corrected. Computed hashes are distinguished from identifiers supplied by the input.

### 3.1 — `devices_base_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (RDM union)`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `current-datetime` | org-openroadm-device.info.current-datetime |
| 3 | `clli` | org-openroadm-device.info.clli |
| 4 | `model` | org-openroadm-device.info.model |
| 5 | `vendor` | org-openroadm-device.info.vendor |
| 6 | `template` | org-openroadm-device.info.template |
| 7 | `node-number` | org-openroadm-device.info.node-number |
| 8 | `serial-id` | org-openroadm-device.info.serial-id |
| 9 | `softwareVersion` | org-openroadm-device.info.softwareVersion |
| 10 | `latitude` | org-openroadm-device.info.geoLocation.latitude |
| 11 | `longitude` | org-openroadm-device.info.geoLocation.longitude |
| 12 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.2 — `devices_base_xpdr.csv`

JSON: `DevicesV2deployed.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `current-datetime` | org-openroadm-device.info.current-datetime |
| 3 | `clli` | org-openroadm-device.info.clli |
| 4 | `model` | org-openroadm-device.info.model |
| 5 | `vendor` | org-openroadm-device.info.vendor |
| 6 | `template` | org-openroadm-device.info.template |
| 7 | `latitude` | org-openroadm-device.info.geoLocation.latitude |
| 8 | `longitude` | org-openroadm-device.info.geoLocation.longitude |
| 9 | `node-number` | org-openroadm-device.info.node-number |
| 10 | `serial-id` | org-openroadm-device.info.serial-id |
| 11 | `softwareVersion` | org-openroadm-device.info.softwareVersion |
| 12 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.3 — `devices7_base_xpdr.csv`

JSON: `DevicesV7deployed.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `current-datetime` | org-openroadm-device.info.current-datetime |
| 3 | `clli` | org-openroadm-device.info.clli |
| 4 | `model` | org-openroadm-device.info.model |
| 5 | `vendor` | org-openroadm-device.info.vendor |
| 6 | `template` | org-openroadm-device.info.template |
| 7 | `latitude` | org-openroadm-device.info.geoLocation.latitude |
| 8 | `longitude` | org-openroadm-device.info.geoLocation.longitude |
| 9 | `node-number` | org-openroadm-device.info.node-number |
| 10 | `serial-id` | org-openroadm-device.info.serial-id |
| 11 | `software-build` | org-openroadm-device.info.software-build |
| 12 | `softwareVersion` | org-openroadm-device.info.softwareVersion |
| 13 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.4 — `devices_circuit_packs_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (RDM union)`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `template` | org-openroadm-device.info.template |
| 3 | `circuit-pack-category` | org-openroadm-device.circuit-packs.circuit-pack-category.type |
| 4 | `clli` | org-openroadm-device.info.clli |
| 5 | `clei` | org-openroadm-device.circuit-packs.clei |
| 6 | `circuit-pack-name` | org-openroadm-device.circuit-packs.circuit-pack-name |
| 7 | `circuit-pack-product-code` | org-openroadm-device.circuit-packs.circuit-pack-product-code |
| 8 | `circuit-pack-model` | org-openroadm-device.circuit-packs.model |
| 9 | `circuit-pack-type` | org-openroadm-device.circuit-packs.circuit-pack-type |
| 10 | `hardware-version` | org-openroadm-device.circuit-packs.hardware-version |
| 11 | `software-load-version` | org-openroadm-device.circuit-packs.software-load-version |
| 12 | `serial-id` | org-openroadm-device.circuit-packs.serial-id |
| 13 | `product-code` | org-openroadm-device.circuit-packs.product-code |
| 14 | `manufacture-date` | org-openroadm-device.circuit-packs.manufacture-date |
| 15 | `is-pluggable-optics` | org-openroadm-device.circuit-packs.is-pluggable-optics |
| 16 | `Shelf` | org-openroadm-device.circuit-packs.shelf |
| 17 | `slot` | org-openroadm-device.circuit-packs.slot |
| 18 | `subSlot` | org-openroadm-device.circuit-packs.subSlot |
| 19 | `vendor` | org-openroadm-device.circuit-packs.vendor |
| 20 | `type` | org-openroadm-device.circuit-packs.type |
| 21 | `administrative-state` | org-openroadm-device.circuit-packs.administrative-state |
| 22 | `equipment-state` | org-openroadm-device.circuit-packs.equipment-state |
| 23 | `operational-state` | org-openroadm-device.circuit-packs.operational-state |
| 24 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.5 — `devices_circuit_pack_xpdr.csv`

JSON: `DevicesV2deployed.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `circuit-pack-category` | org-openroadm-device.circuit-packs.circuit-pack-category.type |
| 3 | `circuit-pack-name` | org-openroadm-device.circuit-packs.circuit-pack-name |
| 4 | `circuit-pack-product-code` | org-openroadm-device.circuit-packs.circuit-pack-product-code |
| 5 | `circuit-pack-type` | org-openroadm-device.circuit-packs.circuit-pack-type |
| 6 | `clei` | org-openroadm-device.circuit-packs.clei |
| 7 | `hardware-version` | org-openroadm-device.circuit-packs.hardware-version |
| 8 | `model` | org-openroadm-device.circuit-packs.model |
| 9 | `product-code` | org-openroadm-device.circuit-packs.product-code |
| 10 | `serial-id` | org-openroadm-device.circuit-packs.serial-id |
| 11 | `shelf` | org-openroadm-device.circuit-packs.shelf |
| 12 | `slot` | org-openroadm-device.circuit-packs.slot |
| 13 | `subSlot` | org-openroadm-device.circuit-packs.subSlot |
| 14 | `software-load-version` | org-openroadm-device.circuit-packs.software-load-version |
| 15 | `vendor` | org-openroadm-device.circuit-packs.vendor |
| 16 | `type` | org-openroadm-device.circuit-packs.type |
| 17 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.6 — `devices7_circuit_pack_xpdr.csv`

JSON: `DevicesV7deployed.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `template` | org-openroadm-device.info.template |
| 3 | `clli` | org-openroadm-device.info.clli |
| 4 | `circuit-pack-name` | org-openroadm-device.circuit-packs.circuit-pack-name |
| 5 | `circuit-pack-product-code` | org-openroadm-device.circuit-packs.circuit-pack-product-code |
| 6 | `circuit-pack-type` | org-openroadm-device.circuit-packs.circuit-pack-type |
| 7 | `faceplate-label` | org-openroadm-device.circuit-packs.faceplate-label |
| 8 | `hardware-version` | org-openroadm-device.circuit-packs.hardware-version |
| 9 | `model` | org-openroadm-device.circuit-packs.model |
| 10 | `serial-id` | org-openroadm-device.circuit-packs.serial-id |
| 11 | `product-code` | org-openroadm-device.circuit-packs.product-code |
| 12 | `shelf` | [missing from final view] |
| 13 | `slot` | org-openroadm-device.circuit-packs.slot |
| 14 | `subSlot` | org-openroadm-device.circuit-packs.subSlot |
| 15 | `vendor` | org-openroadm-device.circuit-packs.vendor |
| 16 | `port-faceplate-label` | org-openroadm-device.circuit-packs.ports.faceplate-label |
| 17 | `port-direction` | org-openroadm-device.circuit-packs.ports.port-direction |
| 18 | `port-name` | org-openroadm-device.circuit-packs.ports.port-name |
| 19 | `port-type` | org-openroadm-device.circuit-packs.ports.port-type |
| 20 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.7 — `devices_circuit_packs_cp_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (RDM union)`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `circuit-pack-category` | org-openroadm-device.circuit-packs.circuit-pack-category.type |
| 3 | `circuit-pack-name` | org-openroadm-device.circuit-packs.circuit-pack-name |
| 4 | `shelf` | [missing from final view] |
| 5 | `slot` | org-openroadm-device.circuit-packs.slot |
| 6 | `subSlot` | org-openroadm-device.circuit-packs.subSlot |
| 7 | `cp-slots-name` | org-openroadm-device.circuit-packs.cp-slots.slot-name |
| 8 | `cp-slots-type` | org-openroadm-device.circuit-packs.cp-slots.slot-type |
| 9 | `provisioned-circuit-pack` | org-openroadm-device.circuit-packs.cp-slots.provisioned-circuit-pack |
| 10 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.8 — `devices_interfaces_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (RDM union)`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `name` | org-openroadm-device.interface.name |
| 3 | `description` | org-openroadm-device.interface.description |
| 4 | `administrative-state` | org-openroadm-device.interface.administrative-state |
| 5 | `operationale-state` | org-openroadm-device.interface.operational-state |
| 6 | `circuit-id` | org-openroadm-device.interface.circuit-id |
| 7 | `supporting-circuit-pack-name` | org-openroadm-device.interface.supporting-circuit-pack-name |
| 8 | `supporting-interface` | org-openroadm-device.interface.supporting-interface |
| 9 | `supporting-port` | org-openroadm-device.interface.supporting-port |
| 10 | `mc-ttp-center-freq` | org-openroadm-device.interface.mc-ttp.center-freq |
| 11 | `mc-ttp-max-freq` | org-openroadm-device.interface.mc-ttp.max-freq |
| 12 | `mc-ttp-min-freq` | org-openroadm-device.interface.mc-ttp.min-freq |
| 13 | `mc-ttp-slot-width` | org-openroadm-device.interface.mc-ttp.slot-width |
| 14 | `nmc_ctp_frequency` | org-openroadm-device.interface.nmc-ctp.frequency |
| 15 | `nmc_ctp_width` | org-openroadm-device.interface.nmc-ctp.width |
| 16 | `type` | org-openroadm-device.interface.type |
| 17 | `ethernet-auto-negotiation` | org-openroadm-device.interface.ethernet.auto-negotiation |
| 18 | `ethernet-duplex` | org-openroadm-device.interface.ethernet.duplex |
| 19 | `ethernet-speed` | org-openroadm-device.interface.ethernet.speed |
| 20 | `ethernet-fec` | org-openroadm-device.interface.ethernet.fec |
| 21 | `ethernet-mtu` | org-openroadm-device.interface.ethernet.mtu |
| 22 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.9 — `devices_interfaces_xpdr.csv`

JSON: `DevicesV7deployed.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `name` | org-openroadm-device.interface.name |
| 3 | `description` | org-openroadm-device.interface.description |
| 4 | `administrative-state` | org-openroadm-device.interface.administrative-state |
| 5 | `operationale-state` | org-openroadm-device.interface.operational-state |
| 6 | `circuit-id` | org-openroadm-device.interface.circuit-id |
| 7 | `supporting-circuit-pack-name` | org-openroadm-device.interface.supporting-circuit-pack-name |
| 8 | `supporting-interface` | org-openroadm-device.interface.supporting-interface |
| 9 | `supporting-port` | org-openroadm-device.interface.supporting-port |
| 10 | `mc-ttp-center-freq` | org-openroadm-device.interface.mc-ttp.center-freq |
| 11 | `mc-ttp-max-freq` | org-openroadm-device.interface.mc-ttp.max-freq |
| 12 | `mc-ttp-min-freq` | org-openroadm-device.interface.mc-ttp.min-freq |
| 13 | `mc-ttp-slot-width` | org-openroadm-device.interface.mc-ttp.slot-width |
| 14 | `nmc_ctp_frequency` | org-openroadm-device.interface.nmc-ctp.frequency |
| 15 | `nmc_ctp_width` | org-openroadm-device.interface.nmc-ctp.width |
| 16 | `type` | org-openroadm-device.interface.type |
| 17 | `ethernet-auto-negotiation` | org-openroadm-device.interface.ethernet.auto-negotiation |
| 18 | `ethernet-duplex` | org-openroadm-device.interface.ethernet.duplex |
| 19 | `ethernet-speed` | org-openroadm-device.interface.ethernet.speed |
| 20 | `ethernet-fec` | org-openroadm-device.interface.ethernet.fec |
| 21 | `ethernet-mtu` | org-openroadm-device.interface.ethernet.mtu |
| 22 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.10 — `devices_interfaces_oms_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (RDM union)`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `name` | org-openroadm-device.interface.name |
| 3 | `supporting-circuit-pack-name` | org-openroadm-device.interface.supporting-circuit-pack-name |
| 4 | `supporting-interface` | org-openroadm-device.interface.supporting-interface |
| 5 | `supporting-port` | org-openroadm-device.interface.supporting-port |
| 6 | `type` | org-openroadm-device.interface.type |
| 7 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.11 — `devices_interfaces_ots_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (RDM union)`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `name` | org-openroadm-device.interface.name |
| 3 | `supporting-circuit-pack-name` | org-openroadm-device.interface.supporting-circuit-pack-name |
| 4 | `supporting-interface` | org-openroadm-device.interface.supporting-interface |
| 5 | `supporting-port` | org-openroadm-device.interface.supporting-port |
| 6 | `type` | org-openroadm-device.interface.type |
| 7 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.12 — `devices_physical_link_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (RDM union)`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `physical-link-name` | org-openroadm-device.physical-link.physical-link-name |
| 3 | `s-circuit-pack-name` | org-openroadm-device.physical-link.source.circuit-pack-name |
| 4 | `s-port-name` | org-openroadm-device.physical-link.source.port-name |
| 5 | `d-circuit-pack-name` | org-openroadm-device.physical-link.destination.circuit-pack-name |
| 6 | `d-port-name` | org-openroadm-device.physical-link.destination.port-name |
| 7 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.13 — `devices_port_parents_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (RDM union)`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `template` | org-openroadm-device.info.template |
| 3 | `clli` | org-openroadm-device.info.clli |
| 4 | `circuit-pack-name` | org-openroadm-device.circuit-packs.circuit-pack-name |
| 5 | `circuit-pack-product-code` | org-openroadm-device.circuit-packs.circuit-pack-product-code |
| 6 | `circuit-pack-mode` | org-openroadm-device.circuit-packs.circuit-pack-mode |
| 7 | `circuit-pack-type` | org-openroadm-device.circuit-packs.circuit-pack-type |
| 8 | `Shelf` | org-openroadm-device.circuit-packs.Shelf |
| 9 | `slot` | org-openroadm-device.circuit-packs.slot |
| 10 | `subSlot` | org-openroadm-device.circuit-packs.subSlot |
| 11 | `vendor` | org-openroadm-device.circuit-packs.vendor |
| 12 | `parent-circuit-pack-slot-name` | org-openroadm-device.circuit-packs.parent-circuit-pack.cp-slot-name |
| 13 | `parent-circuit-pack-name` | org-openroadm-device.circuit-packs.parent-circuit-pack.circuit-pack-name |
| 14 | `administrative-state` | org-openroadm-device.circuit-packs.ports.administrative-state |
| 15 | `circuit-id` | org-openroadm-device.circuit-packs.ports.circuit-id |
| 16 | `interface-name` | FIRST(org-openroadm-device.circuit-packs.ports.interfaces.interface-name) |
| 17 | `logical-connection-point` | org-openroadm-device.circuit-packs.ports.logical-connection-point |
| 18 | `port-direction` | org-openroadm-device.circuit-packs.ports.port-direction |
| 19 | `port-name` | org-openroadm-device.circuit-packs.ports.port-name |
| 20 | `port-qual` | org-openroadm-device.circuit-packs.ports.port-qual |
| 21 | `port-type` | org-openroadm-device.circuit-packs.ports.port-type |
| 22 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.14 — `devices_srg_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (RDM union)`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node_id` | org-openroadm-device.info.node-id |
| 2 | `openroadm_version` | org-openroadm-device.info.openroadm-version |
| 3 | `circuit_pack_name` | org-openroadm-device.shared-risk-group.circuit-packs.circuit-pack-name |
| 4 | `circuit_pack_name_index` | org-openroadm-device.shared-risk-group.circuit-packs.index |
| 5 | `srg_number` | org-openroadm-device.shared-risk-group.srg-number |
| 6 | `max_add_drop_ports` | org-openroadm-device.shared-risk-group.max-add-drop-ports |
| 7 | `current_provisioned_add_drop_ports` | org-openroadm-device.shared-risk-group.current-provisioned-add-drop-ports |
| 8 | `wavelength_duplication` | org-openroadm-device.shared-risk-group.wavelength-duplication |
| 9 | `center_freq_granularity` | org-openroadm-device.shared-risk-group.mc-capabilities.center-freq-granularity |
| 10 | `slot_width_granularity` | org-openroadm-device.shared-risk-group.mc-capabilities.slot-width-granularity |
| 11 | `mc_capabilities_max_slots` | org-openroadm-device.shared-risk-group.mc-capabilities.max-slots |
| 12 | `mc_capabilities_min_slots` | org-openroadm-device.shared-risk-group.mc-capabilities.min-slots |
| 13 | `mc_capability_profile_name` | FIRST(org-openroadm-device.shared-risk-group.mc-capability-profile-mc_capability_profile_name) |
| 14 | `lifecycle_state` | org-openroadm-device.shared-risk-group.lifecycle-state |
| 15 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.15 — `devices_shelf_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (RDM union)`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `administrative-state` | org-openroadm-device.shelves.administrative-state |
| 3 | `vendor` | org-openroadm-device.shelves.vendor |
| 4 | `model` | org-openroadm-device.shelves.model |
| 5 | `hardware-version` | org-openroadm-device.shelves.hardware-version |
| 6 | `operational-state` | org-openroadm-device.shelves.operational-state |
| 7 | `serial-id` | org-openroadm-device.shelves.serial-id |
| 8 | `rack` | org-openroadm-device.shelves.rack |
| 9 | `shelf-name` | org-openroadm-device.shelves.shelf-name |
| 10 | `shelf-position` | org-openroadm-device.shelves.shelf-position |
| 11 | `shelf-type` | org-openroadm-device.shelves.shelf-type |
| 12 | `provisioned-circuit-pack` | org-openroadm-device.shelves.slots.provisioned-circuit-pack |
| 13 | `slot-name` | org-openroadm-device.shelves.slots.slot-name |
| 14 | `slot-status` | org-openroadm-device.shelves.slots.slot-status |
| 15 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.16 — `devices_shelf_xpdr.csv`

JSON: `DevicesV2deployed.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `administrative-state` | org-openroadm-device.shelves.administrative-state |
| 3 | `vendor` | org-openroadm-device.shelves.vendor |
| 4 | `model` | org-openroadm-device.shelves.model |
| 5 | `hardware-version` | org-openroadm-device.shelves.hardware-version |
| 6 | `operational-state` | org-openroadm-device.shelves.operational-state |
| 7 | `serial-id` | org-openroadm-device.shelves.serial-id |
| 8 | `rack` | org-openroadm-device.shelves.rack |
| 9 | `shelf-name` | org-openroadm-device.shelves.shelf-name |
| 10 | `shelf-position` | org-openroadm-device.shelves.shelf-position |
| 11 | `shelf-type` | org-openroadm-device.shelves.shelf-type |
| 12 | `provisioned-circuit-pack` | org-openroadm-device.shelves.slots.provisioned-circuit-pack |
| 13 | `label` | org-openroadm-device.shelves.slots.label |
| 14 | `slot-name` | org-openroadm-device.shelves.slots.slot-name |
| 15 | `slot-status` | org-openroadm-device.shelves.slots.slot-status |
| 16 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.17 — `devices7_shelf_xpdr.csv`

JSON: `DevicesV7deployed.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `administrative-state` | org-openroadm-device.shelves.administrative-state |
| 3 | `vendor` | org-openroadm-device.shelves.vendor |
| 4 | `model` | org-openroadm-device.shelves.model |
| 5 | `hardware-version` | org-openroadm-device.shelves.hardware-version |
| 6 | `operational-state` | org-openroadm-device.shelves.operational-state |
| 7 | `serial-id` | org-openroadm-device.shelves.serial-id |
| 8 | `rack` | org-openroadm-device.shelves.rack |
| 9 | `shelf-name` | org-openroadm-device.shelves.shelf-name |
| 10 | `shelf-position` | org-openroadm-device.shelves.shelf-position |
| 11 | `shelf-type` | org-openroadm-device.shelves.shelf-type |
| 12 | `provisioned-circuit-pack` | org-openroadm-device.shelves.slots.provisioned-circuit-pack |
| 13 | `label` | org-openroadm-device.shelves.slots.label |
| 14 | `slot-name` | org-openroadm-device.shelves.slots.slot-name |
| 15 | `slot-status` | org-openroadm-device.shelves.slots.slot-status |
| 16 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.18 — `devices_degree_rdm.csv`

JSON: `DevicesV2deployed.json + DevicesV7deployed.json (RDM union)`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | org-openroadm-device.info.node-id |
| 2 | `degree-number` | org-openroadm-device.degree.degree-number |
| 3 | `circuit-pack-name` | org-openroadm-device.degree.connection-ports.circuit-pack-name |
| 4 | `port-name` | org-openroadm-device.degree.connection-ports.port-name |
| 5 | `max-wavelengths` | org-openroadm-device.degree.max-wavelengths |
| 6 | `center-freq-granularity` | org-openroadm-device.degree.mc-capabilities.center-freq-granularity |
| 7 | `max-slots` | org-openroadm-device.degree.mc-capabilities.max-slots |
| 8 | `min-slots` | org-openroadm-device.degree.mc-capabilities.min-slots |
| 9 | `slot-width-granularity` | org-openroadm-device.degree.mc-capabilities.slot-width-granularity |
| 10 | `otdr-port-circuit-pack-name` | org-openroadm-device.degree.otdr-port.circuit-pack-name |
| 11 | `otdr-port-port-name` | org-openroadm-device.degree.otdr-port.port-name |
| 12 | `lifecycle-state` | org-openroadm-device.degree.lifecycle-state |
| 13 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.19 — `fiber_cables_base_rdm.csv`

JSON: `FiberCables.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `name` | name |
| 2 | `tail-clfi` | fiber-cable-strand.tail-clfi |
| 3 | `strand-number` | fiber-cable-strand.strand-number |
| 4 | `allocation` | fiber-cable-strand.allocation |
| 5 | `lifecycle-state` | lifecycle-state |
| 6 | `s-clli` | source.clli |
| 7 | `s-rack` | source.rack |
| 8 | `s-shelf` | fiber-cable-strand.source.shelf |
| 9 | `s-port` | fiber-cable-strand.source.port |
| 10 | `d-clli` | destination.clli |
| 11 | `d-rack` | destination.rack |
| 12 | `d-shelf` | fiber-cable-strand.destination.shelf |
| 13 | `d-port` | fiber-cable-strand.destination.port |
| 14 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.20 — `fiber_tails.csv`

JSON: `FiberTails.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `clfi` | clfi |
| 2 | `lifecycle-state` | lifecycle-state |
| 3 | `type` | type |
| 4 | `towards-client-fiber-cable-name` | FIRST(topology-towards-client.tail-resource-entry.resource.fiber-cable-name) |
| 5 | `towards-client-fiber-cable-strand-number` | FIRST(topology-towards-client.tail-resource-entry.resource.fiber-cable-strand-number) |
| 6 | `towards-client-type` | FIRST(topology-towards-client.tail-resource-entry.resource.type) |
| 7 | `towards-client-wiring-record-sequence-number` | FIRST(topology-towards-client.tail-resource-entry.resource.wiring-record-sequence-number) |
| 8 | `towards-client-svc-end-port-device` | FIRST(topology-towards-client.tail-resource-entry.resource.svc-end-port-device) |
| 9 | `towards-client-svc-end-port-direction-used` | FIRST(topology-towards-client.tail-resource-entry.resource.svc-end-port-direction-used) |
| 10 | `towards-client-svc-end-port-lgx-name` | FIRST(topology-towards-client.tail-resource-entry.resource.svc-end-port-lgx-name) |
| 11 | `towards-client-svc-end-port-name` | FIRST(topology-towards-client.tail-resource-entry.resource.svc-end-port-name) |
| 12 | `towards-client-svc-end-port-rack` | FIRST(topology-towards-client.tail-resource-entry.resource.svc-end-port-rack) |
| 13 | `towards-client-svc-end-port-shelf` | FIRST(topology-towards-client.tail-resource-entry.resource.svc-end-port-shelf) |
| 14 | `towards-network-fiber-cable-name` | FIRST(topology-towards-network.tail-resource-entry.resource.fiber-cable-name) |
| 15 | `towards-network-roadm-circuit-pack-name` | FIRST(topology-towards-network.tail-resource-entry.resource.roadm-circuit-pack-name) |
| 16 | `towards-network-roadm-name` | FIRST(topology-towards-network.tail-resource-entry.resource.roadm-name) |
| 17 | `towards-network-roadm-port-name` | FIRST(topology-towards-network.tail-resource-entry.resource.roadm-port-name) |
| 18 | `towards-network-xponder-circuit-pack-name` | FIRST(topology-towards-network.tail-resource-entry.resource.xponder-circuit-pack-name) |
| 19 | `towards-network-xponder-device` | FIRST(topology-towards-network.tail-resource-entry.resource.xponder-device) |
| 20 | `towards-network-xponder-port-name` | FIRST(topology-towards-network.tail-resource-entry.resource.xponder-port-name) |
| 21 | `towards-network-svc-end-port-device` | FIRST(topology-towards-network.tail-resource-entry.resource.svc-end-port-device) |
| 22 | `towards-network-svc-end-port-direction-used` | FIRST(topology-towards-network.tail-resource-entry.resource.svc-end-port-direction-used) |
| 23 | `towards-network-svc-end-port-lgx-name` | FIRST(topology-towards-network.tail-resource-entry.resource.svc-end-port-lgx-name) |
| 24 | `towards-network-svc-end-port-name` | FIRST(topology-towards-network.tail-resource-entry.resource.svc-end-port-name) |
| 25 | `towards-network-svc-end-port-rack` | FIRST(topology-towards-network.tail-resource-entry.resource.svc-end-port-rack) |
| 26 | `towards-network-svc-end-port-shelf` | FIRST(topology-towards-network.tail-resource-entry.resource.svc-end-port-shelf) |
| 27 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.21 — `iofl_client.csv`

JSON: `IOFL.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `clfi` | clfi |
| 2 | `a-clli` | info.a-clli |
| 3 | `z-clli` | info.z-clli |
| 4 | `common-id` | info.common-id |
| 5 | `a-fiber-cable-name` | FIRST(iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.fiber-cable-name) |
| 6 | `a-fiber-cable-strand-number` | FIRST(iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.fiber-cable-strand-number) |
| 7 | `a-roadm-faceplate-id` | FIRST(iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.roadm-faceplate-id) |
| 8 | `a-roadm-circuit-pack-name` | FIRST(iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.roadm-circuit-pack-name) |
| 9 | `a-roadm-name` | FIRST(iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.roadm-name) |
| 10 | `a-roadm-port-name` | FIRST(iof-tails.a-tail.topology-towards-client.tail-resource-entry.resource.roadm-port-name) |
| 11 | `z-fiber-cable-name` | FIRST(iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.fiber-cable-name) |
| 12 | `z-fiber-cable-strand-number` | FIRST(iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.fiber-cable-strand-number) |
| 13 | `z-roadm-faceplate-id` | FIRST(iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.roadm-faceplate-id) |
| 14 | `z-roadm-circuit-pack-name` | FIRST(iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.roadm-circuit-pack-name) |
| 15 | `z-roadm-name` | FIRST(iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.roadm-name) |
| 16 | `z-roadm-port-name` | FIRST(iof-tails.z-tail.topology-towards-client.tail-resource-entry.resource.roadm-port-name) |
| 17 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.22 — `iofl_network.csv`

JSON: `IOFL.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `clfi` | clfi |
| 2 | `a-clli` | info.a-clli |
| 3 | `z-clli` | info.z-clli |
| 4 | `common-id` | info.common-id |
| 5 | `a-fiber-cable-name` | FIRST(iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.fiber-cable-name) |
| 6 | `a-fiber-cable-strand-number` | FIRST(iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.fiber-cable-strand-number) |
| 7 | `a-roadm-faceplate-id` | FIRST(iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.roadm-faceplate-id) |
| 8 | `a-roadm-circuit-pack-name` | FIRST(iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.roadm-circuit-pack-name) |
| 9 | `a-roadm-name` | FIRST(iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.roadm-name) |
| 10 | `a-roadm-port-name` | FIRST(iof-tails.a-tail.topology-towards-network.tail-resource-entry.resource.roadm-port-name) |
| 11 | `z-fiber-cable-name` | FIRST(iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.fiber-cable-name) |
| 12 | `z-fiber-cable-strand-number` | FIRST(iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.fiber-cable-strand-number) |
| 13 | `z-roadm-faceplate-id` | FIRST(iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.roadm-faceplate-id) |
| 14 | `z-roadm-circuit-pack-name` | FIRST(iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.roadm-circuit-pack-name) |
| 15 | `z-roadm-name` | FIRST(iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.roadm-name) |
| 16 | `z-roadm-port-name` | FIRST(iof-tails.z-tail.topology-towards-network.tail-resource-entry.resource.roadm-port-name) |
| 17 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.23 — `networks_v7_openroadm_network.csv`

JSON: `NetworksV13_network.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | node-id |
| 2 | `lifecycle-state` | org-openroadm-common-network:lifecycle-state |
| 3 | `node-type` | org-openroadm-common-network:node-type |
| 4 | `network-ref` | FIRST(supporting-node.network-ref) |
| 5 | `node-ref` | FIRST(supporting-node.node-ref) |
| 6 | `equipment-available` | FIRST(org-openroadm-network:node-capabilities.supported-xpdr-list.supported-xpdr.supported-operational-modes.supported-operational-mode.equipment-available) |
| 7 | `equipment-capacity` | FIRST(org-openroadm-network:node-capabilities.supported-xpdr-list.supported-xpdr.supported-operational-modes.supported-operational-mode.equipment-capacity) |
| 8 | `operational-mode-id` | FIRST(org-openroadm-network:node-capabilities.supported-xpdr-list.supported-xpdr.supported-operational-modes.supported-operational-mode.operational-mode-id) |
| 9 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.24 — `networks_v7_openroadm_topology.csv`

JSON: `NetworksV13_topology.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | node-id |
| 2 | `tp-type` | ietf-network-topology:termination-point.org-openroadm-common-network:tp-type |
| 3 | `tp-id` | ietf-network-topology:termination-point.tp-id |
| 4 | `lifecycle-state` | org-openroadm-common-network:lifecycle-state |
| 5 | `node-type` | org-openroadm-common-network:node-type |
| 6 | `srg-number` | org-openroadm-network-topology:srg-attributes.srg-number |
| 7 | `supporting-node-network-ref` | FIRST(supporting-node.network-ref) |
| 8 | `supporting-node-ref` | FIRST(supporting-node.node-ref) |
| 9 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.25 — `networks_v7_openroadm_otn_topology.csv`

JSON: `NetworksV13_otn_topology.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `node-id` | node-id |
| 2 | `node-type` | org-openroadm-common-network:node-type |
| 3 | `degree-number` | [missing from final view] |
| 4 | `tp-type` | ietf-network-topology:termination-point.org-openroadm-common-network:tp-type |
| 5 | `tp-id` | ietf-network-topology:termination-point.tp-id |
| 6 | `node-ref` | [missing from final view] |
| 7 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.26 — `networks_v7_ietf_network_topology.csv`

JSON: `Networkv13_ietf_network_topology.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `link-id` | link-id |
| 2 | `source-node` | source.source-node |
| 3 | `source-tp` | source.source-tp |
| 4 | `dest-node` | destination.dest-node |
| 5 | `dest-tp` | destination.dest-tp |
| 6 | `administrative-state` | org-openroadm-common-network:administrative-state |
| 7 | `clfi` | org-openroadm-common-network:clfi |
| 8 | `lifecycle-state` | org-openroadm-common-network:lifecycle-state |
| 9 | `link-type` | org-openroadm-common-network:link-type |
| 10 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.27 — `services_base.csv`

JSON: `Services.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `common-id` | common-id |
| 2 | `service-name` | service-name |
| 3 | `lifecycle_state` | lifecycle-state |
| 4 | `service_layer` | service-layer |
| 5 | `connection_type` | connection-type |
| 6 | `source-tail-clfi` | openroadm-service-ext:source-tail.network-tail-clfi |
| 7 | `destination-tail-clfi` | openroadm-service-ext:destination-tail.network-tail-clfi |
| 8 | `a-end-clli` | service-a-end.clli |
| 9 | `a-end-optic-type` | service-a-end.optic-type |
| 10 | `a-end-service-rate` | service-a-end.service-rate |
| 11 | `a-end-rx-direction-port-circuit-pack-name` | FIRST(service-a-end.rx-direction.port.port-circuit-pack-name) |
| 12 | `a-end-rx-direction-port-device-name` | FIRST(service-a-end.rx-direction.port.port-device-name) |
| 13 | `a-end-rx-direction-port-name` | FIRST(service-a-end.rx-direction.port.port-name) |
| 14 | `a-end-rx-direction-port-rack` | FIRST(service-a-end.rx-direction.port.port-rack) |
| 15 | `a-end-rx-direction-port-shelf` | FIRST(service-a-end.rx-direction.port.port-shelf) |
| 16 | `a-end-rx-direction-port-type` | FIRST(service-a-end.rx-direction.port.port-type) |
| 17 | `a-end-tx-direction-port-circuit-pack-name` | FIRST(service-a-end.tx-direction.port.port-circuit-pack-name) |
| 18 | `a-end-tx-direction-port-device-name` | FIRST(service-a-end.tx-direction.port.port-device-name) |
| 19 | `a-end-tx-direction-port-name` | FIRST(service-a-end.tx-direction.port.port-name) |
| 20 | `a-end-tx-direction-port-rack` | FIRST(service-a-end.tx-direction.port.port-rack) |
| 21 | `a-end-tx-direction-port-shelf` | FIRST(service-a-end.tx-direction.port.port-shelf) |
| 22 | `a-end-tx-direction-port-type` | FIRST(service-a-end.tx-direction.port.port-type) |
| 23 | `z-end-clli` | service-z-end.clli |
| 24 | `z-end-optic-type` | service-z-end.optic-type |
| 25 | `z-end-service-rate` | service-z-end.service-rate |
| 26 | `z-end-rx-direction-port-circuit-pack-name` | FIRST(service-z-end.rx-direction.port.port-circuit-pack-name) |
| 27 | `z-end-rx-direction-port-device-name` | FIRST(service-z-end.rx-direction.port.port-device-name) |
| 28 | `z-end-rx-direction-port-name` | FIRST(service-z-end.rx-direction.port.port-name) |
| 29 | `z-end-rx-direction-port-rack` | FIRST(service-z-end.rx-direction.port.port-rack) |
| 30 | `z-end-rx-direction-port-shelf` | FIRST(service-z-end.rx-direction.port.port-shelf) |
| 31 | `z-end-rx-direction-port-type` | FIRST(service-z-end.rx-direction.port.port-type) |
| 32 | `z-end-tx-direction-port-circuit-pack-name` | FIRST(service-z-end.tx-direction.port.port-circuit-pack-name) |
| 33 | `z-end-tx-direction-port-device-name` | FIRST(service-z-end.tx-direction.port.port-device-name) |
| 34 | `z-end-tx-direction-port-name` | FIRST(service-z-end.tx-direction.port.port-name) |
| 35 | `z-end-tx-direction-port-rack` | FIRST(service-z-end.tx-direction.port.port-rack) |
| 36 | `z-end-tx-direction-port-shelf` | FIRST(service-z-end.tx-direction.port.port-shelf) |
| 37 | `z-end-tx-direction-port-type` | FIRST(service-z-end.tx-direction.port.port-type) |
| 38 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.28 — `services_a_2_z_topology.csv`

JSON: `Services.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `common_id` | common-id |
| 2 | `service_name` | service-name |
| 3 | `hop_type` | topology.aToZ.hop-type |
| 4 | `hop_id` | topology.aToZ.id |
| 5 | `resourceType` | topology.aToZ.resourceType.type |
| 6 | `device` | topology.aToZ.device.node-id |
| 7 | `interface_name` | topology.aToZ.resource.interface-name |
| 8 | `trib_slots` | Intermediate calculation: trib_slots |
| 9 | `opucn_trib_slots` | Intermediate calculation: opucn_trib_slots |
| 10 | `circuit_pack_name` | [missing from final view] |
| 11 | `port_name` | topology.aToZ.resource.port.port-name |
| 12 | `resource_service_name` | topology.aToZ.resource.service-name |
| 13 | `frequency` | topology.aToZ.resource.nmc-ctp.frequency |
| 14 | `width` | topology.aToZ.resource.nmc-ctp.width |
| 15 | `source_tail_clfi` | openroadm-service-ext:source-tail.network-tail-clfi |
| 16 | `destination_tail_clf` | openroadm-service-ext:destination-tail.network-tail-clfi |
| 17 | `odu_rate` | topology.aToZ.resource.odu.rate |
| 18 | `oducn_n_rate` | topology.aToZ.resource.odu.oducn-n-rate |
| 19 | `trib_port_number` | topology.aToZ.resource.odu.parent-odu-allocation.trib-port-number |
| 20 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.29 — `services_z_2_a_topology.csv`

JSON: `Services.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `common_id` | common-id |
| 2 | `service_name` | service-name |
| 3 | `hop_type` | topology.zToA.hop-type |
| 4 | `hop_id` | topology.zToA.id |
| 5 | `resourceType` | topology.zToA.resourceType.type |
| 6 | `device` | topology.zToA.device.node-id |
| 7 | `interface_name` | topology.zToA.resource.interface-name |
| 8 | `trib_slots` | Intermediate calculation: trib_slots |
| 9 | `opucn_trib_slots` | Intermediate calculation: opucn_trib_slots |
| 10 | `circuit_pack_name` | [missing from final view] |
| 11 | `port_name` | topology.zToA.resource.port.port-name |
| 12 | `resource_service_name` | topology.zToA.resource.service-name |
| 13 | `frequency` | topology.zToA.resource.nmc-ctp.frequency |
| 14 | `width` | topology.zToA.resource.nmc-ctp.width |
| 15 | `source_tail_clfi` | openroadm-service-ext:source-tail.network-tail-clfi |
| 16 | `destination_tail_clf` | openroadm-service-ext:destination-tail.network-tail-clfi |
| 17 | `odu_rate` | topology.zToA.resource.odu.rate |
| 18 | `oducn_n_rate` | topology.zToA.resource.odu.oducn-n-rate |
| 19 | `trib_port_number` | topology.zToA.resource.odu.parent-odu-allocation.trib-port-number |
| 20 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.30 — `services_a_2_z_network_topology.csv`

JSON: `Services.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `common-id` | common-id |
| 2 | `service-name` | service-name |
| 3 | `source-tail-clfi` | openroadm-service-ext:source-tail.network-tail-clfi |
| 4 | `destination-tail-clfi` | openroadm-service-ext:destination-tail.network-tail-clfi |
| 5 | `id` | network-topology.a-to-z.id |
| 6 | `network-resource-type` | network-topology.a-to-z.network-resource-type |
| 7 | `a-z-tp-id` | network-topology.a-to-z.network-resource.tp-id |
| 8 | `a-z-tp-node-id` | network-topology.a-to-z.network-resource.tp-node-id |
| 9 | `a-z-link-id` | network-topology.a-to-z.network-resource.link-id |
| 10 | `a-z-link-network-id` | network-topology.a-to-z.network-resource.link-network-id |
| 11 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.31 — `services_z_2_a_network_topology.csv`

JSON: `Services.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `common-id` | common-id |
| 2 | `service-name` | service-name |
| 3 | `source-tail-clfi` | openroadm-service-ext:source-tail.network-tail-clfi |
| 4 | `destination-tail-clfi` | openroadm-service-ext:destination-tail.network-tail-clfi |
| 5 | `id` | network-topology.z-to-a.id |
| 6 | `network-resource-type` | network-topology.z-to-a.network-resource-type |
| 7 | `z-a-tp-id` | network-topology.z-to-a.network-resource.tp-id |
| 8 | `z-a-tp-node-id` | network-topology.z-to-a.network-resource.tp-node-id |
| 9 | `z-a-link-id` | network-topology.z-to-a.network-resource.link-id |
| 10 | `z-a-link-network-id` | network-topology.z-to-a.network-resource.link-network-id |
| 11 | `etl_hash_id` | HASH of the fields available at the calculation stage |

### 3.32 — `services_otn.csv`

JSON: `Services.json`

| # | CSV column | Source / rule |
|---|---|---|
| 1 | `common_id` | common-id |
| 2 | `service_name` | service-name |
| 3 | `supporting_service_name` | supporting-service-name |
| 4 | `etl_hash_id` | HASH of the fields available at the calculation stage |

## Code-Level Gaps (Not Business Rules)

The following findings come from static code inspection. Their impact on actual data was not measured by running the ETL. No code was changed.

| Location | Finding | Impact |
|---|---|---|
| Input extraction | Multiple filename matches write to one intermediate file | Risk of overwrite rather than aggregation |
| `devices_circuit_packs_cp_rdm.csv` | View produces `Shelf`, while export requests `shelf` | Requested column is absent from the view |
| `devices7_circuit_pack_xpdr.csv` | View retains `Shelf` but export requests `shelf`; source uses `circuit-packs.Shelf` | Export-name mismatch and source path require validation |
| `devices_port_parents_rdm.csv` | Source uses uppercase `Shelf`, unlike other paths using `shelf` | Possibly missing field depending on source data |
| `services_a_2_z_topology.csv` and `services_z_2_a_topology.csv` | `circuit_pack_name` is computed, but final `$project` retains `circuit_pack_ame` | Export-requested `circuit_pack_name` is dropped |
| `networks_v7_openroadm_otn_topology.csv` | Export requests `degree-number` and `node-ref`, neither present in final view | Schema mismatch |
| Network exports | Output names say v7, sources are V13 | Do not infer the input version from the CSV filename |
| Interfaces | Column is spelled `operationale-state` | This is the actual output spelling; source is `operational-state` |
| Service paths | `destination_tail_clf` | Actual output spelling omits the trailing `i` |
| Hash | Values are concatenated without separators; some views include non-exported fields | Not a unique key and not necessarily a hash of CSV columns alone |

### Missing Columns Identified in the Projection Trace

| CSV | Column | Finding |
|---|---|---|
| devices7_circuit_pack_xpdr.csv | shelf | [missing from final view] |
| devices_circuit_packs_cp_rdm.csv | shelf | [missing from final view] |
| networks_v7_openroadm_otn_topology.csv | degree-number | [missing from final view] |
| networks_v7_openroadm_otn_topology.csv | node-ref | [missing from final view] |
| services_a_2_z_topology.csv | circuit_pack_name | [missing from final view] |
| services_z_2_a_topology.csv | circuit_pack_name | [missing from final view] |

## Verified Input Facts and Remaining Questions

The local report found 310 DevicesV2deployed documents, 17,882 Tail documents, 2,095 IOFL documents, and four `network-list` entries in NetworksV13. These are **input counts**, not output counts. Only the first element of nested structures was sampled, and some file details were truncated. The report does not prove that every field is populated in every document or that all links can be resolved.

Actual CSV row counts, duplicate checks, field-type validation, and before/after comparisons against real records remain unverified. Data owners should confirm whether the omitted files/fields and FIRST-selection behavior are intentional requirements.

## Sources

- [Run sequence, input selection, and CSV export columns](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/do-all.sh)
- [Device transformations](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/devices.js)
- [Fiber cable transformations](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/fiber_cables.js)
- [Fiber tail transformations](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/fiber_tails.js)
- [IOFL transformations](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/iofl.js)
- [Network transformations](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/networks_v7.js)
- [Service transformations](https://github.com/adarcook/etl-vnc/blob/main/vnc-mongodb-chart/config/services.js)
- [Local archive report](https://github.com/adarcook/etl-vnc/issues/2)
