---
name: Leafmap
description: Analyzes geospatial raster and vector data with leafmap-style map workflows.
---

# Leafmap

Source: https://github.com/opengeos/leafmap
Pin: ed1970dab154b5a5f65f7cf31a43acf35bb15e12
Commit-Date: 2026-09-20
License: MIT, confirmed via GitHub API on 2026-10-21. Local summary only. Do not vendor.

## Method

1. Name the dataset, CRS, and bounding box before plotting.
2. Keep large rasters out of git. Write outputs under a local artifact path.
3. Overlay vector and raster only after confirming they share a CRS or an explicit reprojection.
4. State the source and date of imagery in the progress file.
5. Do not vendor the leafmap package into this repository.
