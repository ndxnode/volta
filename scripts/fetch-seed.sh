#!/usr/bin/env bash
set -euo pipefail

seed_dir="data/seed"
mkdir -p "$seed_dir/epa"

curl -L \
  "https://github.com/OpenEVData/open-ev-data/releases/download/v1.24.0/open-ev-data.json" \
  -o "$seed_dir/openev-v1.24.0.json"

curl -L \
  "https://www.fueleconomy.gov/feg/epadata/vehicles.csv.zip" \
  -o "$seed_dir/epa/vehicles.csv.zip"

unzip -o "$seed_dir/epa/vehicles.csv.zip" -d "$seed_dir/epa"
