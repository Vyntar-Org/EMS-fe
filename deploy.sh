#!/usr/bin/env bash
# Build the frontend and deploy it to the server.
#
# Usage:
#   ./deploy.sh dev     # build + deploy to /var/www/bms-dev/html
#   ./deploy.sh prod    # build + deploy to /var/www/ems/html (asks for confirmation)
#
# Options:
#   --skip-build        deploy the existing dist/ without rebuilding
#   -y                  skip the production confirmation prompt

set -euo pipefail

SERVER="root@104.251.212.17"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$PROJECT_DIR/dist"

TARGET=""
SKIP_BUILD=false
ASSUME_YES=false

for arg in "$@"; do
	case "$arg" in
		dev | prod) TARGET="$arg" ;;
		--skip-build) SKIP_BUILD=true ;;
		-y | --yes) ASSUME_YES=true ;;
		*)
			echo "Unknown argument: $arg"
			echo "Usage: ./deploy.sh <dev|prod> [--skip-build] [-y]"
			exit 1
			;;
	esac
done

case "$TARGET" in
	dev) REMOTE_DIR="/var/www/bms-dev/html" ;;
	prod) REMOTE_DIR="/var/www/ems/html" ;;
	*)
		echo "Usage: ./deploy.sh <dev|prod> [--skip-build] [-y]"
		exit 1
		;;
esac

cd "$PROJECT_DIR"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"

echo "=============================================="
echo " Target : $TARGET"
echo " Server : $SERVER:$REMOTE_DIR"
echo " Branch : $BRANCH ($COMMIT)"
echo "=============================================="

if [[ "$TARGET" == "prod" && "$ASSUME_YES" == false ]]; then
	if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
		echo "WARNING: you have uncommitted changes."
	fi
	read -r -p "Deploy to PRODUCTION? Type 'yes' to continue: " answer
	if [[ "$answer" != "yes" ]]; then
		echo "Cancelled."
		exit 1
	fi
fi

if [[ "$SKIP_BUILD" == false ]]; then
	echo ">> Building..."
	rm -rf "$DIST_DIR"
	npm run build
fi

if [[ ! -f "$DIST_DIR/index.html" ]]; then
	echo "ERROR: $DIST_DIR/index.html not found. Build failed or dist/ is empty."
	exit 1
fi

echo ">> Uploading to $SERVER:$REMOTE_DIR ..."
scp -r "$DIST_DIR"/* "$SERVER:$REMOTE_DIR"

echo ">> Deployed $BRANCH ($COMMIT) to $TARGET successfully."
