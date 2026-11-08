#!/usr/bin/env bash
set -euo pipefail

root=`git rev-parse --show-toplevel`
target="$1"

echo "Building in $root"
ls -la $target

while read line; do
  echo "$line"
done < "$root/files.txt"
