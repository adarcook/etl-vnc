#!/usr/bin/env python3
"""Inspect a local ETL archive; optionally publish a value-free report to GitHub.

Run from the etl-vnc project root. Uses only Python's standard library.
Array structure is sampled from its first item, not a complete schema.
No extraction, ETL execution, or raw record values are sent.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import tarfile
from urllib.error import HTTPError
from urllib.request import Request, urlopen

REPOSITORY = "adarcook/etl-vnc"
MAX_JSON_BYTES = 256 * 1024 * 1024
MAX_REPORT_CHARS = 55000
INPUT_MARKERS = ("_GetDevicesV2deployed", "_GetDevicesV7deployed", "_GetFiberCables", "_GetFiberTails", "_GetIOFL", "_GetNetworksV7", "_GetNetworksV13", "_GetServices")
MAX_FILE_REPORT_CHARS = 4000


def describe(value, path="$", depth=0):
    """Return paths/types/counts; deliberately omit all scalar values."""
    if depth > 14:
        yield f"{path}: depth limit reached"
    elif isinstance(value, dict):
        yield f"{path}: object"
        for key, child in value.items():
            yield from describe(child, f"{path}[{json.dumps(key)}]", depth + 1)
    elif isinstance(value, list):
        yield f"{path}: array, count={len(value)} (first item sampled)"
        if value:
            yield from describe(value[0], path + "[0]", depth + 1)
    else:
        kind = "null" if value is None else type(value).__name__
        yield f"{path}: {kind}"


def inspect_archive(path):
    lines = ["ETL input inspection", "Scalar values omitted. Array schemas sample FIRST ITEM ONLY.",
             "Nested counts belong to the sampled parent, not the whole dataset."]
    length = sum(len(line) + 1 for line in lines)
    with tarfile.open(path, "r|gz") as archive:
        for member in archive:
            line = f"File: {member.name!r}; bytes={member.size}"
            if length + len(line) > MAX_REPORT_CHARS:
                lines.append("REPORT LIMIT REACHED: remaining archive members not inspected.")
                break
            lines.append(line)
            length += len(line) + 1
            if (not member.isfile() or member.size <= 1048576
                    or not any(marker in Path(member.name).name for marker in INPUT_MARKERS)):
                continue
            if member.size > MAX_JSON_BYTES:
                lines.append("SKIPPED JSON: exceeds 256 MiB memory guard.")
                continue
            try:
                with archive.extractfile(member) as stream:
                    value = json.load(stream)
                file_report_length = 0
                for description in describe(value):
                    if file_report_length + len(description) > MAX_FILE_REPORT_CHARS:
                        lines.append("FILE STRUCTURE TRUNCATED: 4000 character per-file limit; continuing to next file.")
                        break
                    file_report_length += len(description) + 1
                    if length + len(description) > MAX_REPORT_CHARS:
                        lines.append("REPORT LIMIT REACHED: remaining structure and files not inspected.")
                        return "\n".join(lines)
                    lines.append(description)
                    length += len(description) + 1
                del value
            except (ValueError, UnicodeError, RecursionError) as error:
                lines.append(f"JSON could not be inspected: {type(error).__name__}")
    return "\n".join(lines)


def publish(report):
    token = os.environ.get("ETL_GITHUB_TOKEN")
    if not token:
        result = subprocess.run(
            ["security", "find-generic-password", "-a", os.environ.get("USER", ""),
             "-s", "mergelab-github-token", "-w"],
            capture_output=True, text=True, check=False,
        )
        token = result.stdout.strip()
    if not token:
        raise SystemExit("No token available. Set ETL_GITHUB_TOKEN or use the existing macOS Keychain entry.")
    payload = {"title": "ETL archive structure inspection", "body": "```text\n" + report.replace("```", "'''") + "\n```"}
    request = Request(
        f"https://api.github.com/repos/{REPOSITORY}/issues",
        data=json.dumps(payload).encode(), method="POST",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
                 "Content-Type": "application/json", "User-Agent": "etl-archive-bridge"},
    )
    try:
        with urlopen(request, timeout=30) as response:
            print(json.load(response)["html_url"])
    except HTTPError as error:
        raise SystemExit(f"GitHub HTTP {error.code}. Token needs Issues write access to {REPOSITORY}.") from None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, default=Path("daily-api-get.tar.gz"))
    parser.add_argument("--publish", action="store_true", help="Create a GitHub issue containing the structure report")
    args = parser.parse_args()
    report = inspect_archive(args.archive)
    if args.publish:
        publish(report)
    else:
        print(report)


if __name__ == "__main__":
    main()
