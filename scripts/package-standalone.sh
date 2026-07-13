#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ARTIFACT_DIR="$ROOT_DIR/dist/deadlock-pro-standalone"
TARBALL="$ROOT_DIR/dist/deadlock-pro-standalone.tar.gz"

cd "$ROOT_DIR"

rm -rf "$ARTIFACT_DIR"
mkdir -p "$ARTIFACT_DIR/.next"

npm run build

cp -R .next/standalone/. "$ARTIFACT_DIR/"
rm -f "$ARTIFACT_DIR"/.env "$ARTIFACT_DIR"/.env.* "$ARTIFACT_DIR"/.next/standalone/.env

cp -R .next/static "$ARTIFACT_DIR/.next/static"
cp -R public "$ARTIFACT_DIR/public"
cp -R prisma "$ARTIFACT_DIR/prisma"

tar -czf "$TARBALL" -C "$ARTIFACT_DIR" .

printf '%s\n' "$TARBALL"
