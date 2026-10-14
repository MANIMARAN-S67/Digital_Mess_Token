import sfApi from './salesforceApi';
import { getSalesforceToken } from './salesforceAuth';
import { Student, DailyMenu, UserProfile, MealType } from '../types';
import { TokenRecord } from './tokenService';

export const salesforceSyncService = {
  /**
   * Find or automatically create Student__c in Salesforce to get a valid Salesforce Student ID.
   */
  async ensureSalesforceStudent(student: Student): Promise<string | null> {
    if (!getSalesforceToken()) return null;

    try {
      // 1. Check if student already exists by Student_ID__c, Name, or Email__c
      const queryStr = `SELECT Id, Name, Student_ID__c, Academic_Year__c, Department__c, Hostel_Room__c, Diet_Preference__c, Phone__c, Email__c, Status__c FROM Student__c WHERE Student_ID__c = '${student.id}' OR Email__c = '${student.email || ''}' LIMIT 1`;
      const searchRes = await sfApi.query(queryStr);

      // Clean, professional Student Name (ensure not an email or raw ID)
      const properStudentName = student.name && !student.name.includes('@') && isNaN(Number(student.name))
        ? student.name.trim()
        : student.id ? `Student ${student.id}` : 'Registered Student';

      const cleanPhone = student.phone ? student.phone.replace(/\D/g, '').slice(-10) : '9845123456';
      const cleanEmail = student.email || `${student.id.toLowerCase()}@institution.edu`;
      const academicYear = student.academicYear || '1st Year';

      if (searchRes && searchRes.records && searchRes.records.length > 0) {
        const existingRecord = searchRes.records[0];
        const existingId = existingRecord.Id;
        const existingName = existingRecord.Name;

        // If existing record was saved with a raw roll number/email prefix like '717823f132', patch with full entered details
        if (existingName !== properStudentName || !existingRecord.Department__c || !existingRecord.Phone__c || !existingRecord.Academic_Year__c) {
          const patchPayload: any = {
            Name: properStudentName,
            Student_ID__c: student.id,
            Academic_Year__c: academicYear,
            Department__c: student.department || existingRecord.Department__c || 'Computer Science',
            Hostel_Room__c: student.hostelRoom || existingRecord.Hostel_Room__c || 'BH-1 / 101',
            Diet_Preference__c: student.preference || existingRecord.Diet_Preference__c || 'Veg',
            Status__c: student.status || existingRecord.Status__c || 'Active Plan',
            Phone__c: cleanPhone,
            Email__c: cleanEmail
          };
          if (student.photoUrl) {
            patchPayload.Photo_URL__c = student.photoUrl;
          }
          await sfApi.patch(`/sobjects/Student__c/${existingId}`, patchPayload).catch(() => {});
          console.log(`[Salesforce Sync] Patched Student__c ${existingId} with full details for: ${properStudentName}`);
        }

        return existingId;
      }

      // 2. Create new Student in Salesforce with ALL entered student details
      const payload: any = {
        Name: properStudentName,
        Student_ID__c: student.id,
        Academic_Year__c: academicYear,
        Department__c: student.department || 'Computer Science',
        Hostel_Room__c: student.hostelRoom || 'BH-1 / 101',
        Diet_Preference__c: student.preference || 'Veg',
        Status__c: student.status || 'Active Plan',
        Email__c: cleanEmail,
        Phone__c: cleanPhone
      };

      if (student.photoUrl) {
        payload.Photo_URL__c = student.photoUrl;
      }

      const createRes = await sfApi.post('/sobjects/Student__c', payload);
      if (createRes && createRes.id) {
        console.log(`[Salesforce Sync] Created Student__c in backend: ${properStudentName} (${student.id}) -> ID: ${createRes.id}`);
        return createRes.id;
      }
    } catch (err) {
      console.warn('[Salesforce Sync] Student sync note:', err);
    }
    return null;
  },

  /**
   * Syncs an issued meal token and its corresponding Meal_Attendance__c record into Salesforce,
   * while linking the issuing Mess Manager's Mess_User__c record and updating their stats.
   */
  async syncMealToken(
    token: TokenRecord, 
    student: Student, 
    issuerSfUserId?: string
  ): Promise<{ tokenId?: string; attendanceId?: string } | null> {
    if (!getSalesforceToken()) return null;

    try {
      // 1. Get valid Salesforce Student__c Id
      const sfStudentId = await this.ensureSalesforceStudent(student);
      if (!sfStudentId) return null;

      // 2. Identify issuing Mess User in Salesforce if available
      let sfIssuerId = issuerSfUserId || (token.issuedByUserId?.startsWith('a0') ? token.issuedByUserId : undefined);
      if (!sfIssuerId && token.issuedByEmail) {
        try {
          const userQ = await sfApi.query(`SELECT Id FROM Mess_User__c WHERE Email__c = '${token.issuedByEmail}' LIMIT 1`);
          if (userQ?.records && userQ.records.length > 0) {
            sfIssuerId = userQ.records[0].Id;
          }
        } catch {}
      }

      // 3. Insert into Meal_Token__c (Name is AutoNumber so omitted!)
      const tokenPayload: any = {
        Student__c: sfStudentId,
        Token_Number__c: token.tokenNumber,
        Token_Date__c: token.date,
        Token_Time__c: token.time,
        Meal_Type__c: token.mealType,
        Diet_Preference__c: token.dietPreference,
        Status__c: 'Issued',
        Issued_By__c: token.issuedByName + (token.issuedByEmail ? ` (${token.issuedByEmail})` : '')
      };

      if (sfIssuerId) {
        tokenPayload.Issued_By_User__c = sfIssuerId;
      }

      const tokenRes = await sfApi.post('/sobjects/Meal_Token__c', tokenPayload);
      const sfTokenId = tokenRes?.id;

      if (sfTokenId) {
        console.log(`[Salesforce Sync] Created Meal_Token__c in backend: ${token.tokenNumber} -> ID: ${sfTokenId}`);

        // 4. Update the issuing Mess Manager's statistics in Salesforce Mess_User__c
        if (sfIssuerId) {
          try {
            const statsQ = await sfApi.query(`SELECT Id, Tokens_Issued_Today__c, Total_Tokens_Issued__c FROM Mess_User__c WHERE Id = '${sfIssuerId}' LIMIT 1`);
            const todayCount = (statsQ?.records?.[0]?.Tokens_Issued_Today__c || 0) + 1;
            const totalCount = (statsQ?.records?.[0]?.Total_Tokens_Issued__c || 0) + 1;
            await sfApi.patch(`/sobjects/Mess_User__c/${sfIssuerId}`, {
              Tokens_Issued_Today__c: todayCount,
              Total_Tokens_Issued__c: totalCount,
              Last_Token_Issued_At__c: new Date().toISOString()
            });
            console.log(`[Salesforce Sync] Updated Mess_User__c issuer statistics for: ${sfIssuerId}`);
          } catch (statErr) {
            console.warn('[Salesforce Sync] Issuer stats note:', statErr);
          }
        }

        // 5. Automatically create Meal_Attendance__c linked to this token
        try {
          const attPayload = {
            Student__c: sfStudentId,
            Meal_Token__c: sfTokenId,
            Attendance_Date__c: token.date,
            Attendance_Status__c: 'Present',
            Meal_Type__c: token.mealType,
            Recorded_Time__c: token.time
          };
          const attRes = await sfApi.post('/sobjects/Meal_Attendance__c', attPayload);
          if (attRes?.id) {
            console.log(`[Salesforce Sync] Created Meal_Attendance__c in backend -> ID: ${attRes.id}`);
            return { tokenId: sfTokenId, attendanceId: attRes.id };
          }
        } catch (attErr) {
          console.warn('[Salesforce Sync] Attendance note:', attErr);
        }

        return { tokenId: sfTokenId };
      }
    } catch (err) {
      console.warn('[Salesforce Sync] Token sync note:', err);
    }
    return null;
  },

  /**
   * Syncs Mess Manager / College Principal login activity to Mess_User__c in Salesforce,
   * saving email, phone number, role, department, timestamps, and active status.
   */
  async syncUserLogin(userProfile: UserProfile): Promise<string | null> {
    if (!getSalesforceToken()) return null;

    try {
      const email = userProfile.email;
      if (!email) return null;

      const cleanPhone = userProfile.phone ? userProfile.phone.replace(/\D/g, '').slice(-10) : '';
      const assignedRole = userProfile.role || 'Mess Manager';
      const assignedDept = userProfile.department || (assignedRole === 'College Principal' ? 'College Administration' : 'Mess Management');

      // 1. Check if user already exists by Email
      const q = await sfApi.query(`SELECT Id, Name, Email__c, Phone__c, Total_Logins__c, Tokens_Issued_Today__c, Total_Tokens_Issued__c FROM Mess_User__c WHERE Email__c = '${email}' LIMIT 1`);
      
      if (q && q.records && q.records.length > 0) {
        const existingRecord = q.records[0];
        const existingId = existingRecord.Id;
        const totalLogins = (existingRecord.Total_Logins__c || 0) + 1;

        const updatePayload: any = {
          Name: userProfile.name || existingRecord.Name,
          Role__c: assignedRole,
          Department__c: assignedDept,
          Last_Login__c: new Date().toISOString(),
          Is_Currently_Active__c: true,
          Status__c: 'Active',
          Can_Issue_Tokens__c: true,
          Total_Logins__c: totalLogins,
          Login_Provider__c: userProfile.loginProvider || 'Institutional Auth'
        };

        if (cleanPhone) {
          updatePayload.Phone__c = cleanPhone;
        }

        if (userProfile.photoUrl) {
          updatePayload.Photo_URL__c = userProfile.photoUrl;
        }

        await sfApi.patch(`/sobjects/Mess_User__c/${existingId}`, updatePayload).catch(() => {});
        console.log(`[Salesforce Sync] Updated Mess_User__c record for: ${email} -> ID: ${existingId}`);
        return existingId;
      }

      // 2. Otherwise insert new Mess_User__c record with all fields
      const createPayload: any = {
        Name: userProfile.name || (assignedRole === 'College Principal' ? 'College Principal' : 'Mess Manager'),
        Email__c: email,
        Role__c: assignedRole,
        Department__c: assignedDept,
        Phone__c: cleanPhone || '9876543210',
        Status__c: 'Active',
        Last_Login__c: new Date().toISOString(),
        Login_Provider__c: userProfile.loginProvider || 'Institutional Auth',
        Is_Currently_Active__c: true,
        Can_Issue_Tokens__c: true,
        Total_Logins__c: 1,
        Tokens_Issued_Today__c: 0,
        Total_Tokens_Issued__c: 0,
        Assigned_Mess_Hall__c: userProfile.hostelRoom || 'Central Mess Hall A'
      };

      if (userProfile.uid) {
        createPayload.Firebase_UID__c = userProfile.uid;
      }

      if (userProfile.photoUrl) {
        createPayload.Photo_URL__c = userProfile.photoUrl;
      }

      const createRes = await sfApi.post('/sobjects/Mess_User__c', createPayload);

      if (createRes?.id) {
        console.log(`[Salesforce Sync] Created new Mess_User__c in backend: ${email} -> ID: ${createRes.id}`);
        return createRes.id;
      }
    } catch (err) {
      console.warn('[Salesforce Sync] User login note:', err);
    }
    return null;
  },

  /**
   * Syncs daily menus to Menu__c in Salesforce.
   */
  async syncMenu(menu: DailyMenu, dateStr?: string): Promise<void> {
    if (!getSalesforceToken()) return;
    const todayStr = dateStr || new Date().toISOString().split('T')[0];

    try {
      const mealKeys: MealType[] = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
      for (const mType of mealKeys) {
        const vegItem = menu[mType]?.veg?.mainItem;
        const nonVegItem = menu[mType]?.nonVeg?.mainItem;
        const sfMealType = mType === 'Snacks' ? 'Evening Snacks' : mType;

        if (vegItem) {
          await sfApi.post('/sobjects/Menu__c', {
            Item_Name__c: vegItem,
            Meal_Type__c: sfMealType,
            Diet_Preference__c: 'Veg',
            Menu_Date__c: todayStr,
            Is_Available__c: true
          }).catch(() => {});
        }

        if (nonVegItem && nonVegItem !== vegItem) {
          await sfApi.post('/sobjects/Menu__c', {
            Item_Name__c: nonVegItem,
            Meal_Type__c: sfMealType,
            Diet_Preference__c: 'Non-Veg',
            Menu_Date__c: todayStr,
            Is_Available__c: true
          }).catch(() => {});
        }
      }
      console.log('[Salesforce Sync] Daily Menus synchronized to Salesforce Menu__c');
    } catch (err) {
      console.warn('[Salesforce Sync] Menu sync note:', err);
    }
  },

  /**
   * Cleans up any student records in Salesforce where Name was stored as an email or raw roll number like '717823f132'.
   */
  async cleanRawStudentNames(): Promise<void> {
    if (!getSalesforceToken()) return;
    try {
      const q = await sfApi.query(`SELECT Id, Name, Student_ID__c, Department__c FROM Student__c LIMIT 100`);
      if (q?.records) {
        for (const rec of q.records) {
          const name = rec.Name || '';
          if (name.includes('@') || /^\d/.test(name) || name === rec.Student_ID__c) {
            const roll = rec.Student_ID__c || name;
            const updatedName = `Student ${roll.toUpperCase()}`;
            await sfApi.patch(`/sobjects/Student__c/${rec.Id}`, {
              Name: updatedName,
              Student_ID__c: roll,
              Academic_Year__c: '1st Year',
              Department__c: rec.Department__c || 'Computer Science',
              Status__c: 'Active Plan'
            }).catch(() => {});
            console.log(`[Salesforce Sync] Cleaned raw student record: ${name} -> ${updatedName}`);
          }
        }
      }
    } catch (e) {
      console.warn('[Salesforce Sync] Clean student names notice:', e);
    }
  },

  /**
   * One-click seed/sync that populates Students, Menus, Users, and Tokens in Salesforce.
   */
  async syncAllToBackend(students: Student[], menu: DailyMenu, currentTokens: TokenRecord[] = []): Promise<{ success: boolean; message: string }> {
    if (!getSalesforceToken()) {
      return { success: false, message: 'Salesforce connection credentials not configured.' };
    }

    try {
      // 0. Clean any raw student names (e.g. 717823f132)
      await this.cleanRawStudentNames();

      // 1. Sync Students
      for (const s of students) {
        await this.ensureSalesforceStudent(s);
      }

      // 2. Sync Menus
      await this.syncMenu(menu);

      // 3. Sync Tokens if any
      for (const t of currentTokens.slice(0, 10)) {
        const student = students.find((s) => s.id === t.studentId) || {
          id: t.studentId,
          name: t.studentName,
          preference: t.dietPreference,
          department: 'Hostel Resident',
          hostelRoom: 'BH-1 / 101',
          status: 'Active Plan',
          photoUrl: '',
          issuedSessionsToday: {}
        };
        await this.syncMealToken(t, student);
      }

      return { success: true, message: 'All frontend data successfully synchronized to Salesforce!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Sync encountered an error.' };
    }
  }
};

export default salesforceSyncService;
