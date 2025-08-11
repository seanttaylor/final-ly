
## Overview

### **RouteService**

This is the central service for wiring up API route handlers in the Current.ly application.

---

### **Purpose**

`RouteService` is the central factory for HTTP route controllers in the application.
It uses the sandbox dependency injection system to supply routers with configuration, events, and other required services.

---

### 💡 Current.ly in Context

The `RouteService` is part of the API presentation layer, instantiating routers that handle specific categories of endpoints.
This keeps route initialization centralized, making it easier to add, remove, or modify endpoints while maintaining separation of concerns.

---

### **Responsibilities**

* Instantiate each router with the appropriate dependencies.
* Keep route initialization in one place for maintainability.
* Maintain separation of concerns between wiring and request-handling logic.

