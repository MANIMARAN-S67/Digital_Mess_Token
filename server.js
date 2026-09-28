import express from 'express';
import jsforce from 'jsforce';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Initialize JSForce connection
const conn = new jsforce.Connection({
  loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com'
});

let sfConnected = false;

// Connect to Salesforce
async function connectToSF() {
  const username = process.env.SF_USERNAME || '717823f132@resourceful-otter-8068vd.com';
  const password = process.env.SF_PASSWORD || ''; // Ensure this includes security token if required
  
  if (!password) {
    console.warn("SF_PASSWORD not provided in .env, skipping Salesforce login on startup. Please add SF_PASSWORD to your .env file.");
    return;
  }

  try {
    await conn.login(username, password);
    console.log(`Successfully connected to Salesforce as ${username}`);
    sfConnected = true;
  } catch (err) {
    console.error("Salesforce login error:", err);
  }
}

connectToSF();

// --- API Endpoints --- //

app.get('/api/status', (req, res) => {
  res.json({ connected: sfConnected });
});

// 1. Get all students
app.get('/api/students', async (req, res) => {
  if (!sfConnected) return res.status(503).json({ error: 'Salesforce not connected' });
  try {
    const result = await conn.query("SELECT Id, Name, Student_ID__c, Department__c, Hostel_Room__c, Diet_Preference__c, Status__c, Photo_URL__c, Phone__c, Email__c FROM Student__c");
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
      issuedSessionsToday: {} // Default empty, frontend can populate
    }));
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Sync/Create a student
app.post('/api/students', async (req, res) => {
  if (!sfConnected) return res.status(503).json({ error: 'Salesforce not connected' });
  try {
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
    
    // Upsert student based on Student_ID__c
    const result = await conn.sobject('Student__c').upsert(sfStudent, 'Student_ID__c');
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get all token logs
app.get('/api/tokens', async (req, res) => {
  if (!sfConnected) return res.status(503).json({ error: 'Salesforce not connected' });
  try {
    const result = await conn.query("SELECT Id, Name, Token_Number__c, Token_Time__c, Token_Date__c, Meal_Type__c, Diet_Preference__c, Status__c, Decline_Reason__c, Student__r.Student_ID__c, Student__r.Name FROM Meal_Token__c");
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
    res.json(tokens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Issue a new token
app.post('/api/tokens', async (req, res) => {
  if (!sfConnected) return res.status(503).json({ error: 'Salesforce not connected' });
  try {
    const t = req.body;
    
    const studentQuery = await conn.query(`SELECT Id FROM Student__c WHERE Student_ID__c = '${t.studentId}' LIMIT 1`);
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
    
    const result = await conn.sobject('Meal_Token__c').create(sfToken);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
