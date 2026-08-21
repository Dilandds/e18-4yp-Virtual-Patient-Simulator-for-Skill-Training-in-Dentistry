#!/usr/bin/env python3
"""
Repoint the Unity WebGL build's baked-in case-data API URL.

WHY THIS EXISTS
---------------
The Unity build (public/unity/Build/unity.data) has its backend URL compiled
into the IL2CPP metadata as a string literal:

    https://3c97f97e-...-dev.e1-us-east-azure.choreoapis.dev/vps/temp/v1.0/caseTeeth/get

That Choreo dev endpoint is dead. Unity's ApiCall.FetchData() therefore never
succeeds, isDataFetched stays false, and the scene's extraOral_button /
toolTray_button are never shown -- which is why the "Enter Intra Oral View"
button is missing on the extra-oral screen.

The proper fix is rebuilding the Unity project with the correct URL. Without
the Unity project, this script patches the string in place instead.

HOW IT IS SAFE
--------------
IL2CPP stores string *lengths* in a separate index table, not inline with the
characters. So the replacement URL must be exactly the same byte length as the
original (108 bytes) -- then the length table stays correct and nothing else
in the file shifts. The replacement is padded to 108 bytes with a dummy query
parameter (?p=AAA...), which Express ignores when routing, so
GET /api/caseTeeth/get still matches on the backend.

The script refuses to run unless it finds exactly one occurrence of the old
URL, and verifies the file size is unchanged afterwards.

USAGE
-----
    python3 patch_unity_url.py

Run from the repo root. Make sure Git LFS files are actually pulled first
(git lfs pull) -- if unity.data is ~133 bytes it is still a pointer.
"""

import hashlib
import shutil
import sys
import tempfile
from pathlib import Path

TARGET = Path("code/Student_interface/public/unity/Build/unity.data")

# The backup goes OUTSIDE the repo on purpose. unity.data is ~101MB and is
# tracked by Git LFS, but a "unity.data.bak" sitting next to it is NOT matched
# by the LFS pattern -- so it gets staged as a normal blob and GitHub rejects
# the push ("exceeds GitHub's file size limit of 100.00 MB").
BACKUP_DIR = Path(tempfile.gettempdir()) / "vps-unity-backup"

OLD = (
    b"https://3c97f97e-6f23-44f4-8c89-c549dfa8bc34-dev.e1-us-east-azure"
    b".choreoapis.dev/vps/temp/v1.0/caseTeeth/get"
)
NEW = b"https://api-epcg3cvvma-uc.a.run.app/api/caseTeeth/get?p=" + b"A" * 52

# Known SHA-256 of the unpatched build, for reassurance only (not enforced).
EXPECTED_ORIGINAL_SHA256 = (
    "d7f944b1ed755167263cd61d241350357e54c83a0d101ed7222ab9c737e3cd8e"
)


def main() -> int:
    if len(OLD) != len(NEW):
        print(f"BUG: length mismatch {len(OLD)} vs {len(NEW)}")
        return 1

    if not TARGET.exists():
        print(f"ERROR: {TARGET} not found. Run this from the repo root.")
        return 1

    size = TARGET.stat().st_size
    if size < 1_000_000:
        print(f"ERROR: {TARGET} is only {size} bytes -- that is a Git LFS")
        print("pointer, not the real build. Run: git lfs pull")
        return 1

    data = bytearray(TARGET.read_bytes())
    original_sha = hashlib.sha256(data).hexdigest()
    print(f"file       : {TARGET}")
    print(f"size       : {len(data):,} bytes")
    print(f"sha256     : {original_sha}")
    if original_sha == EXPECTED_ORIGINAL_SHA256:
        print("             (matches the expected unpatched build)")

    count = data.count(OLD)
    print(f"old URL    : found {count} occurrence(s)")

    if count == 0:
        if data.count(NEW):
            print("\nAlready patched -- nothing to do.")
            return 0
        print("\nERROR: old URL not found and new URL not present either.")
        print("This build differs from the one analysed. Stopping.")
        return 1

    if count != 1:
        print("\nERROR: expected exactly 1 occurrence. Stopping to be safe.")
        return 1

    offset = data.find(OLD)
    print(f"offset     : {offset}")

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup = BACKUP_DIR / "unity.data.orig"
    if not backup.exists():
        shutil.copy2(TARGET, backup)
        print(f"backup     : wrote {backup}")
        print("             (outside the repo, so git never sees it)")
    else:
        print(f"backup     : {backup} already exists, leaving it alone")

    data[offset : offset + len(OLD)] = NEW
    TARGET.write_bytes(bytes(data))

    check = TARGET.read_bytes()
    ok = (
        len(check) == size
        and check.count(OLD) == 0
        and check.count(NEW) == 1
    )
    print(f"new sha256 : {hashlib.sha256(check).hexdigest()}")
    print(f"size same  : {len(check) == size}")
    print(f"old gone   : {check.count(OLD) == 0}")
    print(f"new present: {check.count(NEW) == 1}")

    if not ok:
        print("\nVERIFICATION FAILED -- restoring from backup.")
        shutil.copy2(backup, TARGET)
        return 1

    print("\nPatched successfully.")
    print("New URL:", NEW.decode())
    print("\nNext: commit the modified unity.data (it is LFS-tracked), push,")
    print("and let the deploy run. Then hard-reload with cache disabled --")
    print("Unity keeps its own IndexedDB cache of the old file.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
