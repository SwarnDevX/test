#!/bin/sh
set -e
timeout "${TIMEOUT:-30}" node /tmp/test.js 2>&1

