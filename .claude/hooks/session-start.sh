#!/bin/bash
set -euo pipefail

echo '{"async": true, "asyncTimeout": 60000}'

pip install --quiet --disable-pip-version-check fal-client
pip install --quiet --disable-pip-version-check markitdown

if [ -d "$(dirname "$0")/../skills/career-ops" ]; then
  (cd "$(dirname "$0")/../skills/career-ops" && npm install --quiet --no-progress >/dev/null 2>&1 || true)
fi
echo 'export CAREER_OPS_CHROMIUM_PATH=/opt/pw-browsers/chromium' > /etc/profile.d/career-ops-chromium.sh 2>/dev/null || true
export CAREER_OPS_CHROMIUM_PATH=/opt/pw-browsers/chromium

if [ -f "$(dirname "$0")/../skills/ads/requirements.txt" ]; then
  pip install --quiet --disable-pip-version-check -r "$(dirname "$0")/../skills/ads/requirements.txt"
fi
echo 'export CLAUDE_ADS_CHROMIUM_PATH=/opt/pw-browsers/chromium' > /etc/profile.d/claude-ads-chromium.sh 2>/dev/null || true
export CLAUDE_ADS_CHROMIUM_PATH=/opt/pw-browsers/chromium
