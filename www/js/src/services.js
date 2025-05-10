// Low-level functionality essential for basic operation of the application
export const core = [
    'Config',
    //'db', 
    //'events', 
  ];
  
  // Main services that contain the application business logic
  export const services = [
    'NOOPService',
    'FeedService'
  ];
  
  // Objects containing generalized functionality consumed by the services above 
  export const providers = [
    'FeedProvider'
  ];