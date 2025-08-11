
## Overview

### Feed Ingestion & Monitoring

The `FeedService` and `FeedMonitor` classes work together to manage the ingestion and scheduled refresh of news feeds in the Current.ly platform.

#### FeedService

Handles:

* Selecting the appropriate **feed fetching strategy** from the configured `FeedProvider`.
* Respecting feed TTL values to avoid excessive requests.
* Pulling fresh feed data from the network.
* Caching fetched feed data to prevent redundant processing.
* Broadcasting `FEED_UPDATED` and `FEEDS_REFRESHED` events for downstream consumers.

> **Note:** Future integration point for the MLService to automatically categorize incoming feed items before caching.

#### FeedMonitor

Handles:

* Scheduling regular refreshes of all configured feeds via a cron job.
* Ensuring `FeedService.refresh()` is called at the configured interval.
* Emitting initialization events (`FEED_MONITOR_INITIALIZED`).

#### Workflow:

1. **FeedMonitor** starts and sets up a cron job.
2. At each interval:

   * **FeedService** loops through all feeds from `FeedProvider`.
   * Only feeds past their TTL and configured for `"pull"` refresh are fetched.
   * New feed data is cached and events are dispatched.
3. Downstream services (like ML categorization or frontend update pushers) listen to these events to react in real time.

#### Dependencies:

* **`FeedProvider`** – Supplies concrete fetching strategies.
* **`MemoryCache`** – Stores last refresh times and feed data snapshots.
* **`Events`** – System-wide event bus for triggering follow-up processes.
* **`logger`** – Logs operational details and errors.

## 💡 Current.ly in Context

`FeedService` sits in the data ingestion layer of Current.ly.

It depends on:

`FeedProvider` (supplies the actual strategy objects for fetching feeds).

`MemoryCache` (prevents redundant fetches and provides fast read access).

`Events` (notifies other parts of the app when new feed data arrives).

`FeedMonitor` is essentially the scheduler for FeedService; it ensures feeds are refreshed regularly without manual intervention.

Together, they:

 * Keep the feed cache fresh and up-to-date.

 * Provide a consistent entry point for other services (e.g., MLService) to consume canonicalized feed data.

 * Serve as a trigger point for downstream processes, like running ML classification, storing to persistent storage, or pushing updates to the frontend.