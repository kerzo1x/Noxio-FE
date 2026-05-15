const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is not defined. Copy .env.example to .env and set the API URL.');
}

export { apiBaseUrl };
