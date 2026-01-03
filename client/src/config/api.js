// API configuration
// In development: uses proxy from package.json or explicit localhost:5000
// In production: uses relative /api (same domain) or REACT_APP_API_URL env var
const API_BASE_URL = 
  process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000/api' 
    : '/api');

export default API_BASE_URL;

