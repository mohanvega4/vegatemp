#!/bin/bash

# Load production environment
source <(node load-env.js prod)

# Build the application for production
vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist