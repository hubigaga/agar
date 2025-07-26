#!/bin/sh

# Build Docker image
image_name="agar"

echo "Building Docker image $image_name..."
docker build -t "$image_name" . || exit 1

# Run Docker container
echo "Running $image_name container..."
docker run -d -p 8088:88 -p 8080:8080 -p 8090:9000 "$image_name"

