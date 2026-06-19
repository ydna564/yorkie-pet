#!/bin/bash
# Double-click this file in Finder to stop the Yorkie desktop pet.
pkill -f "electron .*yorkie-pet" 2>/dev/null
pkill -f "yorkie-pet/node_modules/electron" 2>/dev/null
echo "Yorkie stopped."
