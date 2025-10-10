# Consumer (Rust) Dockerfile - simple build
FROM rust:1.81 AS build
WORKDIR /app

# Copy context
COPY . .

# Create placeholder project only if none exists
RUN if [ ! -f Cargo.toml ]; then \
      echo "[package]\nname=consumer\nversion=0.1.0\nedition=2021\n\n[dependencies]\nrumqttc=\"0.24\"\ntokio= { version=\"1\", features=[\"full\"] }\n" > Cargo.toml && \
      mkdir -p src && \
      echo "#[tokio::main]\nasync fn main(){ println!(\"Consumer placeholder - implement logic\"); }" > src/main.rs; \
    fi; \
    cargo build --release

FROM debian:stable-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
# Copy binary only if it exists (Docker will error if missing, so ensure previous stage attempted build)
COPY --from=build /app/target/release/consumer /usr/local/bin/consumer

ENTRYPOINT ["/usr/local/bin/consumer"]
