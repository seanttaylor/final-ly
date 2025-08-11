## Overview

The `Database` initializes and provides access to the Supabase database client for the Current.ly application.

## Purpose
`Database` is a wrapper around the Supabase client, initialized using application configuration keys.
It provides a single point of access for all database interactions in the app.


### 💡 Current.ly in Context
The `Database` service is part of the infrastructure layer.
It’s injected into other services through the sandbox so they can perform database operations without manually handling credentials or client creation.

Responsibilities:
* Initializes the Supabase client using secure config values.

* Provides a method (`getClient`) to retrieve the initialized client for queries.

* Centralizes database connection handling.

### ⚠️ Cautionary Notes
The `Database` service requires valid `SUPABASE_URL` and `SUPABASE_KEY` values in `Config.keys`.
If these are missing or incorrect:

_The client will fail to initialize._

Any dependent services will be unable to perform database operations.

This failure will not self-correct without redeployment or reconfiguration.