"""Collect Next.js source files for Vercel/GitHub deploy. Skip secrets in git output."""
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", "node_modules", ".next", ".vercel", "scripts"}
SKIP_FILES = {"AGENTS.md", "CLAUDE.md", "deploy_full.py", "write_file.py", "write-helper.js", "generatePages.js"}
ROOT_FILES = [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "next.config.ts",
    "postcss.config.mjs",
    "eslint.config.mjs",
    ".gitignore",
    "README.md",
    ".env.example",
]

ENV_CONTENT = """NEXT_PUBLIC_SUPABASE_URL=https://ajysowosgjaipczrwpfv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqeXNvd29zZ2phaXBjenJ3cGZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjMxMzMsImV4cCI6MjEwMzczOTEzM30.pAQWDdn0LAo8DAEkv12m0bTP1rkShyfWZDrQfGgh_bA
NEXT_PUBLIC_APP_NAME=Oaklane
"""


def posix(p: Path) -> str:
    return p.relative_to(ROOT).as_posix()


def collect():
    files = []
    for name in ROOT_FILES:
        p = ROOT / name
        if p.exists():
            files.append({"file": name, "data": p.read_text(encoding="utf-8")})

    for folder in ("src", "public"):
        base = ROOT / folder
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if not p.is_file():
                continue
            if any(part in SKIP_DIRS for part in p.parts):
                continue
            if p.name in SKIP_FILES:
                continue
            try:
                data = p.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                import base64
                files.append({"file": posix(p), "data": base64.b64encode(p.read_bytes()).decode("ascii"), "encoding": "base64"})
                continue
            files.append({"file": posix(p), "data": data})

    files.append({"file": ".env", "data": ENV_CONTENT})
    return files


if __name__ == "__main__":
    files = collect()
    out = ROOT / "scripts" / "vercel-files.json"
    out.write_text(json.dumps(files), encoding="utf-8")
    print(f"wrote {len(files)} files to {out} ({out.stat().st_size} bytes)")
    for f in files:
        print(f["file"])
