# Local VNC development

Run from the repository root with Docker Desktop running:

```sh
./local start
./local run /path/to/approved/daily-api-get.tar.gz
./local logs
./local mongo
./local shell
./local stop
```

`./local help` lists the commands. Start builds the existing local image if
needed and does not process or download an archive. The image build may use the
network; the pipeline container uses `--network none`. The input archive is
copied, never modified. The pipeline skips downloading and its upload helper is
a local no-op; no production credentials are needed. The unchanged pipeline
counts skipped uploads as successful.

Each session allows one run, including failed runs. To run again, use `stop`
and `start` first. Every session has its own files and MongoDB database under
the Git-ignored `.local-vnc/sessions/` directory. Stop removes the container,
not the results. `logs` displays the latest run's sanitized phase, summary,
and exit-status log, even after stopping. It omits raw pipeline output because
that output may contain sensitive input. Handle stored data according to your
retention requirements.

MongoDB starts during the pipeline and is available through `mongo` once ready.
The original pipeline's archive minimum (over 50,000,000 bytes), extraction
thresholds, imports, and exports still apply. The local MongoDB version may
differ from production, and MongoDB Database Tools 100.11.0 rejected empty
arrays during synthetic testing. Real archive compatibility is not verified.