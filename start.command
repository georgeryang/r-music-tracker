#!/bin/bash
# Reddit Music Tracker — double-click this file to start

cd "$(dirname "$0")"

if ! command -v node &>/dev/null; then
    echo "Node.js is required but not installed."
    echo ""
    echo "Install it from: https://nodejs.org"
    echo "Download the LTS version and run the installer."
    open "https://nodejs.org"
    echo ""
    read -p "Press Enter to close..."
    exit 1
fi

if ! command -v curl &>/dev/null; then
    echo "curl is required but not installed."
    echo ""
    read -p "Press Enter to close..."
    exit 1
fi

echo "Starting Reddit Music Tracker..."
echo ""

# Start server, capture output, and open browser once we see the URL
node server.js 2>&1 | while IFS= read -r line; do
    echo "$line"
    if [[ "$line" == *"http://localhost:"* ]]; then
        url=$(echo "$line" | grep -o 'http://localhost:[0-9]*')
        open "$url" &
    fi
done

read -p "Press Enter to close..."
