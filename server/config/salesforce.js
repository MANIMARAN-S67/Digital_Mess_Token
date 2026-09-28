import jsforce from 'jsforce';
import dotenv from 'dotenv';
dotenv.config();

const conn = new jsforce.Connection({
  loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com'
});

export const connectToSF = async () => {
  const username = process.env.SF_USERNAME;
  const password = process.env.SF_PASSWORD; // Must include security token

  if (!username || !password) {
    console.warn('SF_USERNAME or SF_PASSWORD missing. Salesforce connection skipped.');
    return null;
  }

  try {
    await conn.login(username, password);
    console.log(`Connected to Salesforce as ${username}`);
    return conn;
  } catch (err) {
    console.error('Salesforce login error:', err);
    throw err;
  }
};

export default conn;
