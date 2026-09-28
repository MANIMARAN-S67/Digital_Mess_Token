import jsforce from 'jsforce';
import dotenv from 'dotenv';
dotenv.config();

const conn = new jsforce.Connection({
  loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com'
});

export const connectToSF = async () => {
  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;
  const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';

  // Fallback to username/password if clientId doesn't exist (for backward compatibility if needed)
  if (!clientId) {
    const username = process.env.SF_USERNAME;
    const password = process.env.SF_PASSWORD;
    if (username && password) {
       await conn.login(username, password);
       console.log(`Connected to Salesforce as ${username}`);
       return conn;
    }
    console.warn('SF_CLIENT_ID or SF_USERNAME missing. Salesforce connection skipped.');
    return null;
  }

  try {
    // Client Credentials Flow
    const tokenResponse = await fetch(`${loginUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      }).toString()
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(`Salesforce OAuth Error: ${data.error_description || data.error}`);
    }

    // Initialize the existing jsforce connection with the new token
    conn.initialize({
      instanceUrl: data.instance_url,
      accessToken: data.access_token
    });

    console.log(`Connected to Salesforce using Client Credentials Flow`);
    return conn;
  } catch (err) {
    console.error('Salesforce login error:', err);
    throw err;
  }
};

export default conn;
