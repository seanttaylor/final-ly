// Low-level functionality essential for basic operation of the application
export const core = [
    'Cache', 
    'Config',
    'Events',
    'UtilityService'
  ];
  
  // Main services that contain the application business logic
  export const services = [
    'Database',
    'FeedMonitor',
    'FeedService',
    'HTTPService',
    'MLService',
    'NOOPService',
    'RouteService',
    'SubscriptionService',
    'UserService'
  ];
  
  // Objects containing generalized functionality consumed by the services above 
  export const providers = [
    'FeedProvider',
    'MiddlewareProvider',
    'PatchProvider',
  ];