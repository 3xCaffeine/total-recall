#!/bin/bash
set -e

# Check if Cosdata is already initialized
if [ ! -f /root/.cosdata/admin_key ]; then
    echo "Initializing Cosdata with admin key..."
    # Pass the admin key to cosdata on startup
    (echo "cosdata123"; echo "cosdata123") | /usr/local/bin/cosdata
else
    echo "Cosdata already initialized"
    /usr/local/bin/cosdata
fi
