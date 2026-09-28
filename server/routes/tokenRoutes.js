import express from 'express';
import { authenticateFirebase } from '../middleware/authenticateFirebase.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import sfConn from '../config/salesforce.js';

const router = express.Router();

// Issue token
router.post('/', authenticateFirebase, authorizeRole(['Admin', 'Mess Management']), async (req, res, next) => {
  try {
    const { studentId, date, mealType, time } = req.body;
    
    // 1. Verify student
    const studentQuery = await sfConn.query(`SELECT Id, Status__c, Diet_Preference__c FROM Student__c WHERE Student_ID__c = '${studentId}' LIMIT 1`);
    if (studentQuery.totalSize === 0) {
       return res.status(404).json({ success: false, message: 'Student record was not found.' });
    }
    const sfStudent = studentQuery.records[0];

    // 2. Check active status
    if (sfStudent.Status__c !== 'Active Plan') {
      return res.status(403).json({ success: false, message: 'Student is inactive', code: 'FORBIDDEN' });
    }

    // 3. Check for duplicates
    // Using SOQL date format YYYY-MM-DD
    const dupQuery = await sfConn.query(`SELECT Id FROM Meal_Token__c WHERE Student__c = '${sfStudent.Id}' AND Token_Date__c = ${date} AND Meal_Type__c = '${mealType}' LIMIT 1`);
    if (dupQuery.totalSize > 0) {
      return res.status(400).json({ success: false, message: `${mealType} token has already been issued for today`, code: 'DUPLICATE_TOKEN' });
    }

    // 4. Create token
    const tokenNumber = `${mealType.substring(0,2).toUpperCase()}-${Date.now().toString().slice(-4)}`; // Basic generate, could use AutoNumber
    const sfToken = {
      Token_Date__c: date,
      Token_Time__c: time,
      Student__c: sfStudent.Id,
      Meal_Type__c: mealType,
      Diet_Preference__c: sfStudent.Diet_Preference__c,
      Status__c: 'Issued',
      Issued_By__c: req.user.salesforceId
    };
    
    const result = await sfConn.sobject('Meal_Token__c').create(sfToken);
    
    // Create attendance record
    const attendance = {
      Student__c: sfStudent.Id,
      Meal_Token__c: result.id,
      Attendance_Date__c: date,
      Meal_Type__c: mealType,
      Attendance_Status__c: 'Not Collected'
    };
    await sfConn.sobject('Meal_Attendance__c').create(attendance);

    res.json({ success: true, message: 'Token issued successfully', data: { id: result.id, tokenNumber, ...sfToken } });
  } catch (err) {
    next(err);
  }
});

// Get token history
router.get('/history', authenticateFirebase, async (req, res, next) => {
  try {
    let query = "SELECT Id, Token_Number__c, Token_Date__c, Token_Time__c, Meal_Type__c, Diet_Preference__c, Status__c, Student__r.Name, Student__r.Student_ID__c FROM Meal_Token__c";
    
    if (req.user.role === 'Student') {
      query += ` WHERE Student__c = '${req.user.salesforceId}'`;
    }
    
    query += " ORDER BY Token_Date__c DESC, Token_Time__c DESC LIMIT 100";
    
    const result = await sfConn.query(query);
    res.json({ success: true, data: result.records });
  } catch (err) {
    next(err);
  }
});

// Collect token
router.patch('/:id/collect', authenticateFirebase, authorizeRole(['Admin', 'Warden', 'Mess Management']), async (req, res, next) => {
  try {
    const tokenId = req.params.id;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    await sfConn.sobject('Meal_Token__c').update({
      Id: tokenId,
      Status__c: 'Collected',
      Collected_Time__c: timeStr
    });

    const attendanceQuery = await sfConn.query(`SELECT Id FROM Meal_Attendance__c WHERE Meal_Token__c = '${tokenId}' LIMIT 1`);
    if (attendanceQuery.totalSize > 0) {
      await sfConn.sobject('Meal_Attendance__c').update({
        Id: attendanceQuery.records[0].Id,
        Attendance_Status__c: 'Present',
        Recorded_Time__c: timeStr
      });
    }

    res.json({ success: true, message: 'Token collected successfully' });
  } catch (err) {
    next(err);
  }
});

// Delete/Cancel token (Admin override)
router.delete('/:id', authenticateFirebase, authorizeRole(['Admin', 'Warden', 'Mess Management']), async (req, res, next) => {
  try {
    const tokenId = req.params.id;

    // First delete associated attendance
    const attendanceQuery = await sfConn.query(`SELECT Id FROM Meal_Attendance__c WHERE Meal_Token__c = '${tokenId}'`);
    if (attendanceQuery.totalSize > 0) {
      const attendanceIds = attendanceQuery.records.map(r => r.Id);
      await sfConn.sobject('Meal_Attendance__c').destroy(attendanceIds);
    }

    await sfConn.sobject('Meal_Token__c').destroy(tokenId);
    res.json({ success: true, message: 'Token cancelled successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
