# OCI Dynamic Plugins — Local Testing

## Prerequisites

- Docker (or Podman) installed
- All plugins built: `make build-dynamic`

## Steps

### 1. Start the local OCI registry

```bash
docker compose -f docker-compose-oci.yaml up -d registry
```

This starts a local container registry on port 5100 (mapped to 5000 inside
the compose network).

### 2. Build and push the OCI image

```bash
make publish-oci IMAGE_REGISTRY=localhost:5100
```

This will:

- Build all static and dynamic plugins (`make build-dynamic`)
- Build the OCI image from `Containerfile.dynamic`
- Push the image to the local registry at `localhost:5100`

### 3. Start the DevPortal

```bash
docker compose -f docker-compose-oci.yaml up devportal
```

The DevPortal container will:

- Pull dynamic plugins from the local registry using `oci://` references
  defined in `dynamic-plugins-oci.yaml`
- Mount `registries.conf` so the internal registry is trusted (insecure HTTP)
- Be available at `http://localhost:7007`

## Notes

- The registry data is persisted in a Docker volume (`registry-data`). To
  start fresh, run `docker compose -f docker-compose-oci.yaml down -v`.
- To use Podman instead of Docker, set `CONTAINER_TOOL=podman` when calling
  make targets.
- The OCI image tag defaults to the `version` field in root `package.json`
  (read by the Makefile via `jq`). Override with
  `make publish-oci IMAGE_REGISTRY=localhost:5100 VERSION=x.y.z`.
- After a successful `make package-oci` (or `publish-oci`), the Makefile
  rewrites the `:<tag>` in every `oci://...!<plugin>` reference inside
  `dynamic-plugins-oci.yaml` so DevPortal pulls the image just built. The
  resulting YAML diff should be committed alongside the version bump.
