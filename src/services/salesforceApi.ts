import { getSalesforceToken, getSalesforceInstanceUrl, logoutSalesforce } from './salesforceAuth';

const getApiVersion = () => import.meta.env.VITE_SALESFORCE_API_VERSION || 'v60.0';

const sfRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getSalesforceToken();
  const instanceUrl = getSalesforceInstanceUrl();

  if (!token || !instanceUrl) {
    throw new Error('Salesforce authentication required.');
  }

  const url = `${instanceUrl}/services/data/${getApiVersion()}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      logoutSalesforce();
      window.location.href = '/';
      throw new Error('Your Salesforce session has expired. Please reconnect.');
    }

    if (!response.ok) {
      let errorMsg = 'Salesforce API Error';
      try {
        const errorData = await response.json();
        if (Array.isArray(errorData) && errorData.length > 0) {
          errorMsg = errorData[0].message;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        }
      } catch (e) {}
      throw new Error(errorMsg);
    }
    
    if (response.status === 204) return null;

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Unable to connect to Salesforce. Please try again.');
  }
};

export const sfApi = {
  get: (endpoint: string, options?: RequestInit) => sfRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, body: any, options?: RequestInit) => sfRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint: string, body: any, options?: RequestInit) => sfRequest(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint: string, options?: RequestInit) => sfRequest(endpoint, { ...options, method: 'DELETE' }),
  query: (soql: string) => sfRequest(`/query?q=${encodeURIComponent(soql)}`, { method: 'GET' })
};

export default sfApi;
