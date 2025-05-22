// Low-level functionality essential for basic operation of the application
export const core = [
    'Cache', 
    'Config',
    'Events'
  ];
  
  // Main services that contain the application business logic
  export const services = [
    'FeedMonitor',
    'FeedService',
    'HTTPService',
    'MLService',
    'NOOPService',
    'RouteService',
  ];
  
  // Objects containing generalized functionality consumed by the services above 
  export const providers = [
    'FeedProvider',
    'PatchProvider',
  ];