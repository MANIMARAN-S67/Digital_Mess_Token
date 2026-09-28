import jsforce from 'jsforce';

let conn;

async function getConnection() {
  if (conn) return conn;
  
  conn = new jsforce.Connection({
    loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com'
  });
  
  const username = process.env.SF_USERNAME;
  const password = process.env.SF_PASSWORD;
  
  if (!username || !password) {
    throw new Error('SF_USERNAME or SF_PASSWORD environment variables are missing');
  }
  
  await conn.login(username, password);
  return conn;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const connection = await getConnection();

    if (req.method === 'GET') {
      const result = await connection.query("SELECT Id, Name, Token_Number__c, Token_Time__c, Token_Date__c, Meal_Type__c, Diet_Preference__c, Status__c, Decline_Reason__c, Student__r.Student_ID__c, Student__r.Name FROM Meal_Token__c");
      const tokens = result.records.map(record => ({
        id: record.Id,
        tokenNumber: record.Token_Number__c,
        time: record.Token_Time__c,
        date: record.Token_Date__c,
        studentId: record.Student__r ? record.Student__r.Student_ID__c : '',
        studentName: record.Student__r ? record.Student__r.Name : '',
        mealType: record.Meal_Type__c,
        dietPreference: record.Diet_Preference__c,
        status: record.Status__c,
        declineReason: record.Decline_Reason__c
      }));
      return res.status(200).json(tokens);
      
    } else if (req.method === 'POST') {
      const t = req.body;
      
      const studentQuery = await connection.query(`SELECT Id FROM Student__c WHERE Student_ID__c = '${t.studentId}' LIMIT 1`);
      if (studentQuery.totalSize === 0) {
         return res.status(404).json({ error: 'Student not found in Salesforce' });
      }
      
      const sfToken = {
        Token_Number__c: t.tokenNumber,
        Token_Time__c: t.time,
        Token_Date__c: t.date,
        Student__c: studentQuery.records[0].Id,
        Meal_Type__c: t.mealType,
        Diet_Preference__c: t.dietPreference,
        Status__c: t.status,
        Decline_Reason__c: t.declineReason || ''
      };
      
      const result = await connection.sobject('Meal_Token__c').create(sfToken);
      return res.status(200).json({ success: true, result });
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Salesforce API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
