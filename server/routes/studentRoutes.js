import express from 'express';
import { authenticateFirebase } from '../middleware/authenticateFirebase.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import sfConn from '../config/salesforce.js';

const router = express.Router();

// Get all students (Admin/Warden/Mess Management)
router.get('/', authenticateFirebase, authorizeRole(['Admin', 'Warden', 'Mess Management']), async (req, res, next) => {
  try {
    const result = await sfConn.query("SELECT Id, Name, Student_ID__c, Department__c, Hostel_Room__c, Diet_Preference__c, Status__c, Photo_URL__c, Phone__c, Email__c, Role__c FROM Student__c");
    res.json({ success: true, data: result.records });
  } catch (err) {
    next(err);
  }
});

// Get specific student by ID (Admin/Warden/Mess Management or self)
router.get('/:id', authenticateFirebase, async (req, res, next) => {
  try {
    const studentId = req.params.id;
    if (req.user.role === 'Student' && req.user.studentId !== studentId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to perform this action', code: 'FORBIDDEN' });
    }
    const result = await sfConn.query(`SELECT Id, Name, Student_ID__c, Department__c, Hostel_Room__c, Diet_Preference__c, Status__c, Photo_URL__c, Phone__c, Email__c, Role__c FROM Student__c WHERE Student_ID__c = '${studentId}' LIMIT 1`);
    if (result.totalSize === 0) {
      return res.status(404).json({ success: false, message: 'Student record was not found.' });
    }
    res.json({ success: true, data: result.records[0] });
  } catch (err) {
    next(err);
  }
});

// Register new student (Admin/Warden/Mess Management)
router.post('/', authenticateFirebase, authorizeRole(['Admin', 'Warden', 'Mess Management']), async (req, res, next) => {
  try {
    const { name, department, hostelRoom, preference, email, phone, status, studentId } = req.body;
    
    // Check if student exists
    const existing = await sfConn.query(`SELECT Id FROM Student__c WHERE Student_ID__c = '${studentId}' LIMIT 1`);
    if (existing.totalSize > 0) {
      return res.status(400).json({ success: false, message: 'Student ID already exists' });
    }

    const sfStudent = {
      Name: name,
      Student_ID__c: studentId,
      Department__c: department,
      Hostel_Room__c: hostelRoom,
      Diet_Preference__c: preference,
      Email__c: email,
      Phone__c: phone,
      Status__c: status || 'Active Plan',
      Role__c: 'Student'
    };

    const result = await sfConn.sobject('Student__c').create(sfStudent);
    res.json({ success: true, message: 'Student registered successfully', data: { id: result.id, ...sfStudent } });
  } catch (err) {
    next(err);
  }
});

export default router;
