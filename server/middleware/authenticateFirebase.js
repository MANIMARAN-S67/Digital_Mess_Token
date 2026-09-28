import admin from '../config/firebaseAdmin.js';
import sfConn from '../config/salesforce.js';

export const authenticateFirebase = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // 1. Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // 2. Fetch user from Salesforce
    const query = `SELECT Id, Name, Student_ID__c, Role__c, Status__c, Diet_Preference__c, Firebase_UID__c, Email__c 
                   FROM Student__c 
                   WHERE Firebase_UID__c = '${decodedToken.uid}' 
                   OR Email__c = '${decodedToken.email}' LIMIT 1`;
                   
    const result = await sfConn.query(query);
    
    let userRecord = null;

    if (result.totalSize > 0) {
      userRecord = result.records[0];
      
      // Update Firebase UID if it was matched by email but UID is empty
      if (!userRecord.Firebase_UID__c && decodedToken.uid) {
        await sfConn.sobject('Student__c').update({
          Id: userRecord.Id,
          Firebase_UID__c: decodedToken.uid
        });
        userRecord.Firebase_UID__c = decodedToken.uid;
      }
    } else {
      // Create new student in Salesforce if not exists
      const newStudent = {
        Name: decodedToken.name || decodedToken.email.split('@')[0],
        Email__c: decodedToken.email,
        Firebase_UID__c: decodedToken.uid,
        Role__c: 'Student', // Default role
        Status__c: 'Active Plan',
        Student_ID__c: decodedToken.email.split('@')[0].toUpperCase(), // Just a fallback
        Diet_Preference__c: 'Veg' // Default
      };
      const createRes = await sfConn.sobject('Student__c').create(newStudent);
      userRecord = { Id: createRes.id, ...newStudent };
    }

    // Check status
    if (userRecord.Status__c === 'Plan Expired' || userRecord.Status__c === 'Inactive') {
       return res.status(403).json({ success: false, message: 'Your account is inactive', code: 'FORBIDDEN' });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      salesforceId: userRecord.Id,
      studentId: userRecord.Student_ID__c,
      name: userRecord.Name,
      role: userRecord.Role__c,
      status: userRecord.Status__c,
      dietPreference: userRecord.Diet_Preference__c
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token', code: 'UNAUTHORIZED' });
  }
};
