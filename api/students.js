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
      const result = await connection.query("SELECT Id, Name, Student_ID__c, Department__c, Hostel_Room__c, Diet_Preference__c, Status__c, Photo_URL__c, Phone__c, Email__c FROM Student__c");
      const students = result.records.map(record => ({
        id: record.Student_ID__c,
        name: record.Name,
        department: record.Department__c,
        hostelRoom: record.Hostel_Room__c,
        preference: record.Diet_Preference__c,
        status: record.Status__c,
        photoUrl: record.Photo_URL__c,
        phone: record.Phone__c,
        email: record.Email__c,
        issuedSessionsToday: {} 
      }));
      return res.status(200).json(students);
      
    } else if (req.method === 'POST') {
      const s = req.body;
      const sfStudent = {
        Name: s.name,
        Student_ID__c: s.id,
        Department__c: s.department,
        Hostel_Room__c: s.hostelRoom,
        Diet_Preference__c: s.preference,
        Status__c: s.status,
        Photo_URL__c: s.photoUrl,
        Phone__c: s.phone || '',
        Email__c: s.email || ''
      };
      
      const result = await connection.sobject('Student__c').upsert(sfStudent, 'Student_ID__c');
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
