# VNC ETL — Project Guide

> **Audience:** engineers new to optical networking and coding agents debugging this repository.
>
> **Scope:** this README explains the observed ETL implementation and essential domain vocabulary. It does **not** define product requirements or replace the OpenROADM specifications. When documentation and implementation disagree, inspect the current code and report the discrepancy.

## The big picture

The pipeline takes VNC export data describing an optical transport network, extracts selected JSON documents, loads them into MongoDB, flattens nested structures into views, and exports selected fields as CSV files for downstream consumption.

```text
VNC data / API archive
        |
        v
Selected *Get...* files from archive / working directory
        |
        v
Intermediate JSON files (jq extraction)
        |
        v
MongoDB collections in "dap" (mongoimport)
        |
        v
MongoDB aggregation views (mongosh *.js)
        |
        v
CSV outputs (mongoexport)
        |
        v
Downstream consumers (not established by this repository)
```

**Terminology warning:** VNC is the source system name used by the project; its full expansion and product boundaries are **not confirmed here**. OpenROADM is an industry data-model/interface ecosystem for optical transport networks; it is **not** a separate ETL process. Do not assume that every VNC export follows the same OpenROADM model version.

## Optical-network concepts in plain English

Think of a network as **equipment connected by links, providing services**:

| Term | Practical meaning for an ETL developer |
| --- | --- |
| **RDM / ROADM** | Optical equipment that routes wavelengths between fiber directions. The code filters devices using `info.node-type = rdm`. |
| **XPDR (transponder)** | Equipment that converts/terminates client signals for optical transmission. The ETL separately handles `node-type = xpdr`. |
| **Device / node** | A piece of network equipment, or its representation in a topology. A topology node and a physical device are not necessarily one-to-one. |
| **Shelf / slot / circuit pack** | Nested equipment inventory: a shelf holds slots, which can hold circuit packs. |
| **Port / interface** | Connection point and/or modeled interface on equipment. Do not assume every port maps one-to-one to an interface. |
| **Fiber cable / fiber tail** | Physical optical connectivity/inventory, from distinct VNC datasets. |
| **IOFL** | Inter-office fiber link; a physical/infrastructure link between locations. |
| **Network / topology** | Nodes and links in a particular logical or physical view of the network. |
| **OTN** | Optical Transport Network; a transport-layer model, not the same thing as the physical fiber topology. |
| **Service** | A provisioned service and its relationship to routes/topologies/resources. |

For example, a service may traverse topology links that ultimately correspond to network equipment and physical fiber. **The exact join keys and cardinalities must be verified per exported entity**; do not infer them from this analogy.

## Where to look in this repository

| Question | Start here |
| --- | --- |
| Which source files are accepted and how is the ETL orchestrated? | [`vnc-mongodb-chart/config/do-all.sh`](vnc-mongodb-chart/config/do-all.sh) |
| Which JSON becomes which CSV, field by field? | [ETL JSON-to-CSV mapping](docs/ETL_JSON_to_CSV_Mapping_HE.md) |
| Which MongoDB views are created? | [Existing view inventory](vnc-mongodb-chart/config/README.md) |
| How are RDM/XPDR device records transformed? | [`devices.js`](vnc-mongodb-chart/config/devices.js) |
| How are services transformed? | [`services.js`](vnc-mongodb-chart/config/services.js) |
| How are IOFL / fiber-cable / fiber-tail records transformed? | [`iofl.js`](vnc-mongodb-chart/config/iofl.js), [`fiber_cables.js`](vnc-mongodb-chart/config/fiber_cables.js), [`fiber_tails.js`](vnc-mongodb-chart/config/fiber_tails.js) |
| How are network-topology records transformed? | [`networks_v7.js`](vnc-mongodb-chart/config/networks_v7.js) and the active export calls in `do-all.sh` |
| What should be checked before VNC 7.5.2 upgrade? | [Upgrade checks](docs/VNC_7.5.2_ETL_Pre-Upgrade_Checks.md) |
| How do I run locally? | [Local development guide](docs/LOCAL_VNC_DEVELOPMENT.md) |

The long mapping document is the **single detailed mapping reference**; do not copy its column-by-column tables into this README.

## Current ETL behavior that matters during debugging

The following points were established by review of the code on `main` and are described in the mapping document. They are **not guarantees** about a live execution:

1. **Input selection is selective.** `do-all.sh` looks for filenames matching specific `Get...` patterns and a size threshold (files over 1 MiB). A file being present in an archive does not mean it is consumed.
2. **Repeated matches can overwrite one another.** Multiple matches can write to the same intermediate JSON using `>`; this is not an append or merge. The search can include stale files in the working directory.
3. **MongoDB import replaces collections.** Imports use `--jsonArray --drop`; inspect import success and collection counts before trusting a view.
4. **Views flatten nested data.** MongoDB `$unwind` can multiply rows; whether missing arrays preserve a parent depends on the specific pipeline.
5. **Device data can be combined without deduplication.** The RDM view unions `devices7` and `devices` using `$unionWith` and filters to RDM devices. There is no general deduplication/version-preference step in that union.
6. **A CSV includes only exported columns.** A field may exist in raw JSON or even in a MongoDB view and still be absent from CSV.
7. **Names are not proof of source version.** The active network CSV export path is documented as using V13 network sources for four output files whose names include `v7`. Check actual export commands rather than filenames.
8. **Success at the script level is insufficient.** Some failures are counted and processing may continue. Inspect the import/export summary and actual output files.

### Identifiers, PK and `id_comp`

There are **three different concepts** that must not be conflated:

- **Source/business key:** fields that the producer treats as identifying an entity in its domain.
- **ETL-derived hash/identifier:** some views compute a hash by converting fields to strings, concatenating them (without a separator), substituting empty strings for nulls, and applying MongoDB `$toHashedIndexKey`. The resulting value must **not** be assumed globally unique or stable across model changes.
- **Database primary key (PK) / downstream composite ID:** keys defined by the destination data model or a subsequent pipeline stage.

The team has discussed a future `id_comp` for identifying transformed records and assessing affected extracts. **This repository README does not establish its production formula, PK mapping, uniqueness rules, or downstream usage.** Verify those with the owning team and implementation before treating the identifier as a change-detection key.

A useful question to ask about any output row: *What is the row's granularity? Which source fields identify that exact row before and after array unwinding?* A device-level key usually cannot uniquely identify every port or circuit-pack row.

## Debugging recipes

**A CSV field is missing:**

1. Find the CSV in the mapping document and its export command in `do-all.sh`.
2. Check whether that column is explicitly selected in the export command.
3. Inspect the corresponding MongoDB view projection in the `*.js` file.
4. Check the field path in the intermediate JSON, then the original source file.
5. Distinguish **missing at source**, **filtered out**, **transformation produced null**, and **not exported**.

**Unexpected missing or duplicate rows:**

1. Check which source filenames actually matched, their sizes, and whether more than one file overwrote the intermediate JSON.
2. Verify import status/counts and whether the right MongoDB collection was loaded.
3. Inspect `$match`, `$unionWith`, `$unwind`, and `preserveNullAndEmptyArrays` in the relevant view.
4. Verify the row granularity and candidate keys before calling something a duplicate.
5. Compare representative input documents, view rows, and output CSV rows. Do not assume a successful shell exit validates the data.

**An upgrade introduces a new VNC/OpenROADM field:** trace it from a real incoming JSON sample through the view and the export column list. A field being introduced upstream does not mean the ETL automatically exports it. Use the [upgrade checklist](docs/VNC_7.5.2_ETL_Pre-Upgrade_Checks.md).

## AI Agent Guidelines (macOS, CLI agents, IDE agents)

When asked a question or asked to debug this project:

1. **Read this README first**, then follow the relevant links to the mapping and actual code. Prefer a direct answer with the precise file/function/field path.
2. **Inspect before changing.** Identify existing architecture, inputs, dependencies and uncommitted work before proposing edits. Distinguish documented observations from verified runtime evidence.
3. **Single source of truth.** Keep detailed mappings in `docs/ETL_JSON_to_CSV_Mapping_HE.md` and implementation behavior in source code. Do not start another repository, lab, environment, pipeline or parallel documentation set.
4. **Stay within the question.** Answer concept questions without writing code. For changes, ask for approval before unrelated refactors or new infrastructure.
5. **Protect working behavior.** Make small, reversible changes; preserve uncommitted work; explain the exact affected files and regression risk.
6. **Maintainability is an acceptance criterion.** Use straightforward names, minimum necessary abstractions and readable code that the engineer can independently explain, debug and maintain. Stop and simplify if complexity grows.
7. **Do not invent certainty.** Do not infer PKs, `id_comp` semantics, business rules, successful ETL runs or downstream integrations from filenames or intuition.
8. **Verify outcomes.** State what was checked, what passed, what remains unverified, and any blockers. Do not claim implementation, tests, deployment or production correctness without evidence.
9. **Be efficient.** Favor concrete findings and short next actions over long speculative investigations or repeated attempts.
10. **Apply the same rules to delegated agents.** If producing a prompt for another coding agent, carry these constraints into that prompt.

**Suggested response style:** "Short answer → evidence in repository → what remains unknown → next diagnostic step." Explain unfamiliar networking terms in plain language.

## Known gaps requiring confirmation

- Official VNC acronym/product boundaries and the exact downstream consumers.
- Source-system PKs, destination PKs and planned `id_comp` construction/change semantics.
- End-to-end runs against a representative current archive, resulting CSV counts and quality checks.
- Which version-specific OpenROADM fields and entities the product team expects after upgrades.

Do not silently fill these gaps with assumptions. Update this README when the owning team confirms them, and link to the authoritative source where possible.
