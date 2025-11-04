#!/usr/bin/env bash

set -euo pipefail

# Optional .env overrides
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

# Configuration (overridable via environment/.env)
PROJECT_NAME=${PROJECT_NAME:-"cdn-test"}
REMOTE_USER=${REMOTE_USER:-"ubuntu"}
REMOTE_HOST=${REMOTE_HOST:-"142.93.208.111"}
REMOTE_DIR=${REMOTE_DIR:-"/opt/${PROJECT_NAME}"}
SSH_OPTS=${SSH_OPTS:-"-o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=3"}
RSYNC_OPTS=${RSYNC_OPTS:-"-az --delete"}

ssh_cmd() { ssh ${SSH_OPTS} "$@"; }
rsync_cmd() { rsync ${RSYNC_OPTS} -e "ssh ${SSH_OPTS}" "$@"; }

echo "Deploying ${PROJECT_NAME} to ${REMOTE_USER}@${REMOTE_HOST}..."

# Connectivity pre-check with clear diagnostics
echo "[check] Verifying SSH connectivity..."
if ! ssh_cmd -q ${REMOTE_USER}@${REMOTE_HOST} 'echo ok' >/dev/null 2>&1; then
  echo "[error] Unable to connect via SSH to ${REMOTE_USER}@${REMOTE_HOST}." >&2
  echo "        Tips: (1) Ensure your SSH key is loaded (ssh-add -l)." >&2
  echo "              (2) Try agent forwarding: SSH_OPTS='-A' ./deploy.sh" >&2
  echo "              (3) Or specify identity:  SSH_OPTS='-i ~/.ssh/id_rsa' ./deploy.sh" >&2
  exit 1
fi

# Ensure SSL certs exist (self-signed for testing)
if [ ! -f nginx/ssl/server.crt ] || [ ! -f nginx/ssl/server.key ]; then
  echo "[info] Generating self-signed certificate..."
  bash ./create-ssl-cert.sh
fi

# Create remote directory
ssh_cmd ${REMOTE_USER}@${REMOTE_HOST} "sudo mkdir -p ${REMOTE_DIR} && sudo chown ${REMOTE_USER}:${REMOTE_USER} ${REMOTE_DIR}"

# Rsync files (exclude local caches/node_modules if present)
rsync_cmd \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude "**/.DS_Store" \
  ./ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

# Start/Restart docker-compose stack
ssh_cmd ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && (docker compose down || docker-compose down || true) && (docker compose up -d || docker-compose up -d)"

echo "Deployment complete. Services running on http(s)://${REMOTE_HOST}"


