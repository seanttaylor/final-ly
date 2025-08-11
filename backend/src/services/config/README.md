# Configuration

>Centralized configuration provider for environment keys, application variables, and feed definitions.

## Overview
The Configuration service acts as a single source of truth for environment-specific settings and constants.
It abstracts away direct access to process.env and hardcoded constants, exposing them via getter methods for consistency and maintainability.
This makes it easy for other services to retrieve configuration values without worrying about where or how they are defined.

### 💡 Current.ly in Context
Environment keys: Provides secure, environment-dependent credentials such as database URLs or API keys.

**Application variables**: Stores fixed settings like API endpoints, ports, and paths used throughout the app.

**Feed configuration**: Supplies feed definitions from the Feeds module for services that process RSS or other incoming data sources.

Responsibilities:
* Encapsulate environment variable access.

* Centralize application-wide constants.

* Provide a structured way to retrieve feed configuration.

### ⚠️ Cautionary Notes
If required keys or variables (e.g., `SUPABASE_URL`, `SUPABASE_KEY`) are missing or misconfigured:

_Dependent services such as `Database` will fail to initialize._

API requests or database operations relying on these values will break.

Since values are loaded at runtime, incorrect settings will persist until environment variables are fixed and the app is restarted.

