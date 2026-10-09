// src/services/salesforceAuth.ts

const generateRandomString = (length: number) => {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => ('0' + byte.toString(16)).slice(-2)).join('');
};

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  return hash;
};

const base64urlencode = (a: ArrayBuffer) => {
  let str = '';
  const bytes = new Uint8Array(a);
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const getSalesforceLoginUrl = () => import.meta.env.VITE_SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
const getClientId = () => import.meta.env.VITE_SALESFORCE_CLIENT_ID;
const getRedirectUri = () => import.meta.env.VITE_SALESFORCE_REDIRECT_URI || `${window.location.origin}/oauth/callback`;

export const initiateSalesforceOAuth = async (firebaseEmail: string) => {
  const codeVerifier = generateRandomString(64);
  sessionStorage.setItem('code_verifier', codeVerifier);
  sessionStorage.setItem('firebase_email', firebaseEmail);
  
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64urlencode(hashed);
  
  const loginUrl = getSalesforceLoginUrl();
  const clientId = getClientId();
  const redirectUri = getRedirectUri();
  
  const url = `${loginUrl}/services/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  
  window.location.href = url;
};

export const handleSalesforceCallback = async (code: string) => {
  const codeVerifier = sessionStorage.getItem('code_verifier');
  if (!codeVerifier) {
    throw new Error('Code verifier not found. Authentication failed.');
  }

  const loginUrl = getSalesforceLoginUrl();
  const clientId = getClientId();
  const redirectUri = getRedirectUri();

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code: code,
    code_verifier: codeVerifier
  });

  const response = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error_description || 'Failed to authenticate with Salesforce');
  }

  const data = await response.json();
  localStorage.setItem('sf_access_token', data.access_token);
  localStorage.setItem('sf_instance_url', data.instance_url);
  
  sessionStorage.removeItem('code_verifier');
  return data;
};

export const getSalesforceToken = () => {
  return localStorage.getItem('sf_access_token');
};

export const getSalesforceInstanceUrl = () => {
  return localStorage.getItem('sf_instance_url');
};

export const logoutSalesforce = () => {
  localStorage.removeItem('sf_access_token');
  localStorage.removeItem('sf_instance_url');
};
