---
name: Markitdown
description: Converts office and web documents to Markdown for review, without storing the original secrets.
---

# Markitdown

Source: https://github.com/microsoft/markitdown
Pin: b8f79c57ebc0044be41323d89b2a45d3fda8460e
License: MIT (microsoft/markitdown). Local summary, not a vendored copy.

## Method

1. Convert a copy. Do not overwrite the source document.
2. Check the markdown for lost tables, headings, and images.
3. Strip secrets and tokens from the converted output before it is committed.
4. Use the external markitdown tool. Do not vendor its source here.
5. Record the source filename and conversion command in the progress file.
