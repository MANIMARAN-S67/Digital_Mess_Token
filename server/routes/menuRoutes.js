import express from 'express';
import { authenticateFirebase } from '../middleware/authenticateFirebase.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import sfConn from '../config/salesforce.js';

const router = express.Router();

// Get today's menu
router.get('/', authenticateFirebase, async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await sfConn.query(`SELECT Id, Item_Name__c, Meal_Type__c, Diet_Preference__c, Is_Available__c FROM Menu__c WHERE Menu_Date__c = ${today}`);
    res.json({ success: true, data: result.records });
  } catch (err) {
    next(err);
  }
});

// Create menu (Admin/Mess Management)
router.post('/', authenticateFirebase, authorizeRole(['Admin', 'Mess Management']), async (req, res, next) => {
  try {
    const result = await sfConn.sobject('Menu__c').create(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
