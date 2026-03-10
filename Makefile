#
# Makefile for AWS plugins workspace
# - Handles frontend and backend plugins
# - Supports both static and dynamic plugin builds
#

VERSION ?= 0.1.0
NPM_REGISTRY =
NPM_REGISTRY_ARGS = $(if $(NPM_REGISTRY),--registry $(NPM_REGISTRY))

# OCI image settings
IMAGE_REGISTRY ?= quay.io/veecode
IMAGE_NAME ?= backstage-aws-dynamic-plugins
IMAGE_TAG = $(IMAGE_REGISTRY)/$(IMAGE_NAME):$(VERSION)
CONTAINER_TOOL ?= podman

# ECS plugin directories
ECS_FRONTEND_DIR = plugins/ecs/frontend
ECS_BACKEND_DIR = plugins/ecs/backend

# ECR plugin directories
ECR_FRONTEND_DIR = plugins/ecr/frontend
ECR_BACKEND_DIR = plugins/ecr/backend

ALL_PLUGIN_DIRS = $(ECS_FRONTEND_DIR) $(ECS_BACKEND_DIR) $(ECR_FRONTEND_DIR) $(ECR_BACKEND_DIR)

.PHONY: help build build-dynamic package-dynamic publish publish-dynamic \
	set-version get-version unpublish clean clean-dynamic

help:
	@echo "AWS Plugins Workspace Makefile"
	@echo "=============================="
	@echo ""
	@echo "Build Commands:"
	@echo "  make build               - Build all static plugins"
	@echo "  make build-dynamic       - Build all dynamic plugins"
	@echo ""
	@echo "Dynamic Plugin Image Commands:"
	@echo "  make package-dynamic     - Build OCI image with all dynamic plugins"
	@echo "  make publish-dynamic     - Build and push OCI image to registry"
	@echo ""
	@echo "Publish Commands:"
	@echo "  make publish             - Publish all static plugins to npm"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make set-version VERSION=x.y.z - Set version for all packages"
	@echo "  make get-version         - Show latest published versions"
	@echo "  make unpublish           - Unpublish all packages at current version"
	@echo "  make clean               - Full clean (node_modules, dist, logs, .tgz)"
	@echo "  make clean-dynamic       - Clean only dist-dynamic directories"

# Set version for all AWS packages
# Usage: make set-version VERSION=0.2.0
set-version:
	@echo "Setting AWS packages to version $(VERSION)..."
	@for dir in $(ALL_PLUGIN_DIRS); do \
		sed -i '' 's/"version": "[^"]*"/"version": "$(VERSION)"/' $$dir/package.json; \
		echo "  Updated $$dir"; \
	done
	@echo "All packages updated to version $(VERSION)"
	@yarn install

# Build all static plugins
build:
	yarn install && yarn tsc && yarn build:all

# Build all dynamic plugins
build-dynamic: build
	cd $(ECS_FRONTEND_DIR) && yarn export-dynamic
	cd $(ECS_BACKEND_DIR) && yarn export-dynamic
	cd $(ECR_FRONTEND_DIR) && yarn export-dynamic
	cd $(ECR_BACKEND_DIR) && yarn export-dynamic

# Helper: publish a single plugin if not already published
define publish_plugin
	@cd $(1) && \
	PACKAGE_NAME=$$(node -p "require('./package.json').name") && \
	if npm view $$PACKAGE_NAME@$(VERSION) version $(NPM_REGISTRY_ARGS) >/dev/null 2>&1; then \
		echo "$$PACKAGE_NAME@$(VERSION) is already published. Skipping."; \
	else \
		echo "Publishing $$PACKAGE_NAME@$(VERSION)..."; \
		npm publish $(NPM_REGISTRY_ARGS); \
	fi
endef

# Publish all static plugins
publish: build
	@echo "Publishing AWS plugins..."
	$(call publish_plugin,$(ECS_FRONTEND_DIR))
	$(call publish_plugin,$(ECS_BACKEND_DIR))
	$(call publish_plugin,$(ECR_FRONTEND_DIR))
	$(call publish_plugin,$(ECR_BACKEND_DIR))

# Build OCI image with all dynamic plugins (re-uses existing dist-dynamic if present)
package-dynamic: build
	rhdh-cli plugin package \
		--tag $(IMAGE_TAG) \
		--container-tool $(CONTAINER_TOOL)

# Build and push OCI image to registry
publish-dynamic: package-dynamic
	@echo "Pushing $(IMAGE_TAG)..."
	$(CONTAINER_TOOL) push $(IMAGE_TAG)

# Get latest versions in npm registry
get-version:
	@echo "Getting latest versions in npm registry for AWS plugins..."
	@for dir in $(ALL_PLUGIN_DIRS); do \
		PACKAGE_NAME=$$(node -p "require('./$$dir/package.json').name"); \
		echo "$$PACKAGE_NAME:"; \
		npm view $$PACKAGE_NAME version $(NPM_REGISTRY_ARGS) 2>/dev/null || echo "  Not published yet"; \
	done

# Unpublish all packages
unpublish:
	@echo "Unpublishing AWS packages..."
	@for dir in $(ALL_PLUGIN_DIRS); do \
		PACKAGE_NAME=$$(node -p "require('./$$dir/package.json').name"); \
		npm unpublish $$PACKAGE_NAME@$(VERSION) $(NPM_REGISTRY_ARGS) 2>/dev/null || true; \
		echo "  Unpublished $$PACKAGE_NAME@$(VERSION)"; \
	done
	@echo "Packages unpublished."

# Full clean
clean:
	@echo "Cleaning AWS workspace..."
	yarn clean || true
	rm -rf node_modules
	rm -rf packages/*/node_modules
	rm -rf plugins/*/*/node_modules
	rm -rf dist-types
	rm -rf plugins/*/*/dist
	rm -rf plugins/*/*/dist-dynamic
	rm -rf plugins/*/*/**.tgz
	rm -rf packages/*/dist
	find . -name "*.log" -type f -delete || true
	find . -name "yarn-error.log" -type f -delete || true
	find . -name "npm-debug.log*" -type f -delete || true
	find . -name ".DS_Store" -type f -delete || true
	@echo "AWS workspace clean complete!"

# Clean only dist-dynamic directories
clean-dynamic:
	@echo "Cleaning AWS dist-dynamic directories..."
	@for dir in $(ALL_PLUGIN_DIRS); do \
		rm -rf $$dir/dist-dynamic; \
	done
	@echo "Cleaned. Run build-dynamic to rebuild."
