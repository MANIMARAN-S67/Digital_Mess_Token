import express from 'express';
import { authenticateFirebase } from '../middleware/authenticateFirebase.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import sfConn from '../config/salesforce.js';

const router = express.Router();

router.get('/', authenticateFirebase, authorizeRole(['Admin', 'Warden', 'Mess Management']), async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // In a real app we would use aggregated SOQL (e.g. GROUP BY)
    // For simplicity, retrieving count via queries or aggregated queries
    const tokensQuery = await sfConn.query(`SELECT Meal_Type__c, Diet_Preference__c, Status__c FROM Meal_Token__c WHERE Token_Date__c = ${today}`);
    
    const stats = {
      totalTokensIssued: tokensQuery.totalSize,
      totalEligible: 500, // Dummy value, would query total active students
      vegCount: 0,
      nonVegCount: 0,
      breakfastTokens: 0,
      lunchTokens: 0,
      dinnerTokens: 0,
      snacksTokens: 0,
      collectedTokens: 0,
      pendingTokens: 0
    };

    tokensQuery.records.forEach(t => {
      if (t.Diet_Preference__c === 'Veg') stats.vegCount++;
      if (t.Diet_Preference__c === 'Non-Veg') stats.nonVegCount++;
      
      if (t.Meal_Type__c === 'Breakfast') stats.breakfastTokens++;
      if (t.Meal_Type__c === 'Lunch') stats.lunchTokens++;
      if (t.Meal_Type__c === 'Dinner') stats.dinnerTokens++;
      if (t.Meal_Type__c === 'Evening Snacks' || t.Meal_Type__c === 'Snacks') stats.snacksTokens++;
      
      if (t.Status__c === 'Collected') stats.collectedTokens++;
      if (t.Status__c === 'Issued') stats.pendingTokens++;
    });
    
    // Dummy active students count query
    const studentCountQuery = await sfConn.query(`SELECT COUNT(Id) cnt FROM Student__c WHERE Status__c = 'Active Plan'`);
    stats.activeStudents = studentCountQuery.records[0].cnt;

    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

export default router;
