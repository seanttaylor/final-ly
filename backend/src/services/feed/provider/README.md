
## Overview

This module defines the feed ingestion subsystem for Current.ly, supporting pluggable RSS strategies via a base `FeedStrategy` class. 

Each external feed is instantiated dynamically from config, proxied through [justcors.com](https://justcors.com/) if needed, parsed via fast-xml-parser, and exposed for downstream processing. A separate `PatchProvider` service exposes transformation logic (via [JSON Patch](https://datatracker.ietf.org/doc/html/rfc6902)) to normalize the shape of raw feed entries into a canonical format suitable for classification and rendering.

### 🌐 Context in Current.ly
Together, these components form the data ingestion and normalization pipeline for external feeds in Current.ly. Here’s how this fits into the larger architecture:

| Layer                  | Responsibility                                          | Code                                  |
| ---------------------- | ------------------------------------------------------- | ------------------------------------- |
| **Feed Retrieval**     | Fetch and parse raw feed data                           | `FeedStrategy`, `DefaultFeedStrategy` |
| **Feed Registration**  | Dynamically instantiates feed fetchers                  | `FeedProvider`                        |
| **Feed Normalization** | Translates raw feed entries into app-specific structure | `PatchProvider`                       |

### ⚠️ Caution

Every feed defined in the feed configuration (see `/services/config/feeds.js`) must have a corresponding JSON Patch specification in the `PatchProvider`. If a patch is missing:

Canonicalization of the feed will fail.

The resulting feed update will be lost, silently corrupted, or rendered unusable downstream.

This requirement ensures that Current.ly can rely on all incoming feeds being translated into a predictable, consumable format.