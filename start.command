#!/bin/bash
# Double-click this file in Finder to start your Yorkie desktop pet.
cd "$(dirname "$0")"
nohup npx electron . > /tmp/yorkie.log 2>&1 &
echo "Yorkie started."
