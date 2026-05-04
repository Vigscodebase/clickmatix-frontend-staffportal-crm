import axios from 'axios';

// Set base URL for API calls
const baseURL = import.meta.env.VITE_API_URL;
axios.defaults.baseURL = baseURL !== undefined ? baseURL : 'http://localhost:5000';

// Set default headers
axios.defaults.headers.common['Content-Type'] = 'application/json';

export default axios;
