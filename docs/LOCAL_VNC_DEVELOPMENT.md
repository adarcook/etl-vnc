# Local VNC development on macOS ARM64

Run these commands from the repository root with Docker Desktop running. The
image build downloads the official MongoDB image and Ubuntu's `pv` package; the
pipeline container itself has no external network. The production Dockerfile,
image, and Kubernetes configuration are not used or changed.

## Start

```sh
docker build --platform linux/arm64 -t etl-vnc-local:7.0.16 - < Dockerfile.local
VNC_WORK=$(mktemp -d "$HOME/etl-vnc-work.XXXXXX")
mkdir -p "$VNC_WORK/work" "$VNC_WORK/db"
printf 'Workspace: %s\n' "$VNC_WORK"
docker run -d --name etl-vnc-local --platform linux/arm64 --network none \
  --entrypoint sleep -v "$PWD/vnc-mongodb-chart/config:/source:ro" \
  -v "$PWD/local/skip-upload.sh:/local/skip-upload.sh:ro" \
  -v "$VNC_WORK/work:/work" -v "$VNC_WORK/db:/data/db" -w /work \
  etl-vnc-local:7.0.16 infinity
docker exec etl-vnc-local bash -c \
  'cp /source/*.sh /source/*.js /work/ && cp /local/skip-upload.sh /work/upload-csv.sh && chmod +x /work/*.sh'
```

Keep the printed workspace path. No archive is downloaded or processed by these
commands. The container copies scripts into the external workspace; it does not
write to the source mount. A fresh workspace avoids mixing results from runs.

## Run

Only after explicit approval, copy the approved archive into the workspace and
run the pipeline:

```sh
cp /path/to/approved/daily-api-get.tar.gz "$VNC_WORK/work/daily-api-get.tar.gz"
docker exec -e URL_CSV=local-disabled -e VNC_CSV_SAS=local-disabled etl-vnc-local \
  bash -c './do-all.sh --skip-env-check --skip-download' > "$VNC_WORK/work/pipeline.log" 2>&1
```

The existing flags skip environment validation and download. The copied
`upload-csv.sh` is a local-only no-op: each upload is logged as skipped, although
the unchanged pipeline counts those calls as successful uploads. No cloud
credentials are needed. `--network none` provides container network isolation;
do not attach the container to another network or mount a Docker socket. The
original archive size check (over 50,000,000 bytes), extraction
thresholds, imports, views, and exports still apply. The pipeline can return a
nonzero status when imports or exports fail; inspect its log rather than
assuming every output is complete.

To start from already prepared JSON files instead of an archive, place them in
`$VNC_WORK/work` and run:

```sh
docker exec -e URL_CSV=local-disabled -e VNC_CSV_SAS=local-disabled etl-vnc-local \
  bash -c './do-all.sh --start-phase6' > "$VNC_WORK/work/pipeline.log" 2>&1
```

This skips archive extraction and preprocessing.

## Inspect

```sh
tail -n 100 "$VNC_WORK/work/pipeline.log"
ls -lh "$VNC_WORK/work"/*.json "$VNC_WORK/work/out"/*.csv
docker exec -it etl-vnc-local mongosh dap
```

Inside `mongosh`, use `db.getCollectionInfos()` to list collections and views,
`db.devices.findOne()` to inspect an imported document, or
`db.devices_base_rdm_view.findOne()` to inspect a view. MongoDB starts during
the pipeline run and remains available inside the container until it stops;
no database port is exposed. To enter the workspace shell, use
`docker exec -it etl-vnc-local bash`.

## Stop

```sh
docker stop etl-vnc-local
docker rm -v etl-vnc-local
```

The external workspace, including the archive, intermediate JSON, CSVs, logs,
and database files, remains on disk. Handle and remove it according to your data
retention requirements. Changes to source scripts require a fresh container or
an explicit copy into its workspace. The MongoDB version is pinned locally and
may differ from the production image; validate behavior against the intended
production version before relying on compatibility.
The included MongoDB Database Tools 100.11.0 rejected an empty `[]` input with
`mongoimport --jsonArray` during synthetic testing; the pipeline reports that
as an import failure. Real archive compatibility has not been verified.