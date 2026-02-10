#!/bin/bash
# Test Cloudflare Worker OAuth Proxy

WORKER_URL="https://github-oauth-proxy.jstxshinerio.workers.dev"
CLIENT_ID="Ov23li65mtWdX973c2zm"

echo "Testing Worker at $WORKER_URL"
echo ""

echo "Test 1: Check root (should return 404)"
curl -s "$WORKER_URL"
echo ""
echo ""

echo "Test 2: POST /device/code"
curl -s -X POST "$WORKER_URL/device/code" \
  -H "Content-Type: application/json" \
  -d "{\"client_id\":\"$CLIENT_ID\",\"scope\":\"project\"}"
echo ""
echo ""

echo "If Test 2 returns JSON with user_code and device_code, Worker is working!"
echo "If Test 2 returns 404 or connection error, Worker is not deployed."
