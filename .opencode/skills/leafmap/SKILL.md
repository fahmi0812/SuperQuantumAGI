---
name: Leafmap
description: Analyzes geospatial raster and vector data with leafmap-style map workflows.
---

# Leafmap

Source: https://github.com/opengeos/leafmap
Pin: # TODO: resolve pin
License: Upstream pin unresolved. Local summary only. leafmap itself is a library pointer, not vendored here.

## Method

1. Name the dataset, CRS, and bounding box before plotting.
2. Keep large rasters out of git. Write outputs under a local artifact path.
3. Overlay vector and raster only after confirming they share a CRS or an explicit reprojection.
4. State the source and date of imagery in the progress file.
5. Do not vendor the leafmap package into this repository.
