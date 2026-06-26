#!/bin/bash
set -euo pipefail

echo '{"async": true, "asyncTimeout": 60000}'

pip install --quiet --disable-pip-version-check fal-client
pip install --quiet --disable-pip-version-check markitdown
