const fs = require('fs');
const path = require('path');

const sfDir = path.join(__dirname, 'sf', 'force-app', 'main', 'default', 'objects');

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const writeXml = (filePath, content) => {
    fs.writeFileSync(filePath, content, 'utf8');
};

const studentObjDir = path.join(sfDir, 'Student__c');
ensureDir(studentObjDir);
ensureDir(path.join(studentObjDir, 'fields'));

const studentFields = {
    'Firebase_UID__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Firebase_UID__c</fullName>
    <externalId>true</externalId>
    <label>Firebase UID</label>
    <length>128</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Text</type>
    <unique>true</unique>
</CustomField>`,
    'Role__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Role__c</fullName>
    <label>Role</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value>
                <fullName>Student</fullName>
                <default>true</default>
                <label>Student</label>
            </value>
            <value>
                <fullName>Mess Management</fullName>
                <default>false</default>
                <label>Mess Management</label>
            </value>
            <value>
                <fullName>Admin</fullName>
                <default>false</default>
                <label>Admin</label>
            </value>
            <value>
                <fullName>Warden</fullName>
                <default>false</default>
                <label>Warden</label>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>`,
    'Academic_Year__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Academic_Year__c</fullName>
    <label>Academic Year</label>
    <length>20</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Text</type>
    <unique>false</unique>
</CustomField>`
};

for (const [fieldName, fieldContent] of Object.entries(studentFields)) {
    writeXml(path.join(studentObjDir, 'fields', fieldName + '.field-meta.xml'), fieldContent);
}

// Menu__c
const menuObjDir = path.join(sfDir, 'Menu__c');
ensureDir(menuObjDir);
ensureDir(path.join(menuObjDir, 'fields'));

writeXml(path.join(menuObjDir, 'Menu__c.object-meta.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <deploymentStatus>Deployed</deploymentStatus>
    <enableActivities>true</enableActivities>
    <enableBulkApi>true</enableBulkApi>
    <enableHistory>true</enableHistory>
    <enableReports>true</enableReports>
    <enableSearch>true</enableSearch>
    <enableSharing>true</enableSharing>
    <enableStreamingApi>true</enableStreamingApi>
    <label>Menu</label>
    <nameField>
        <displayFormat>MNU-{000000}</displayFormat>
        <label>Menu Number</label>
        <type>AutoNumber</type>
    </nameField>
    <pluralLabel>Menus</pluralLabel>
    <sharingModel>ReadWrite</sharingModel>
</CustomObject>`);

const menuFields = {
    'Menu_Date__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Menu_Date__c</fullName>
    <label>Menu Date</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Date</type>
</CustomField>`,
    'Meal_Type__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Meal_Type__c</fullName>
    <label>Meal Type</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value>
                <fullName>Breakfast</fullName>
                <default>false</default>
            </value>
            <value>
                <fullName>Lunch</fullName>
                <default>false</default>
            </value>
            <value>
                <fullName>Dinner</fullName>
                <default>false</default>
            </value>
            <value>
                <fullName>Evening Snacks</fullName>
                <default>false</default>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>`,
    'Diet_Preference__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Diet_Preference__c</fullName>
    <label>Diet Preference</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value>
                <fullName>Veg</fullName>
                <default>false</default>
            </value>
            <value>
                <fullName>Non-Veg</fullName>
                <default>false</default>
            </value>
            <value>
                <fullName>Common</fullName>
                <default>false</default>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>`,
    'Item_Name__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Item_Name__c</fullName>
    <label>Item Name</label>
    <length>255</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Text</type>
    <unique>false</unique>
</CustomField>`,
    'Is_Available__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Is_Available__c</fullName>
    <defaultValue>true</defaultValue>
    <label>Is Available</label>
    <trackHistory>false</trackHistory>
    <type>Checkbox</type>
</CustomField>`
};

for (const [fieldName, fieldContent] of Object.entries(menuFields)) {
    writeXml(path.join(menuObjDir, 'fields', fieldName + '.field-meta.xml'), fieldContent);
}

// Meal_Attendance__c
const attendanceObjDir = path.join(sfDir, 'Meal_Attendance__c');
ensureDir(attendanceObjDir);
ensureDir(path.join(attendanceObjDir, 'fields'));

writeXml(path.join(attendanceObjDir, 'Meal_Attendance__c.object-meta.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <deploymentStatus>Deployed</deploymentStatus>
    <enableActivities>true</enableActivities>
    <enableBulkApi>true</enableBulkApi>
    <enableHistory>true</enableHistory>
    <enableReports>true</enableReports>
    <enableSearch>true</enableSearch>
    <enableSharing>true</enableSharing>
    <enableStreamingApi>true</enableStreamingApi>
    <label>Meal Attendance</label>
    <nameField>
        <displayFormat>ATD-{000000}</displayFormat>
        <label>Attendance ID</label>
        <type>AutoNumber</type>
    </nameField>
    <pluralLabel>Meal Attendances</pluralLabel>
    <sharingModel>ControlledByParent</sharingModel>
</CustomObject>`);

const attendanceFields = {
    'Student__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Student__c</fullName>
    <label>Student</label>
    <referenceTo>Student__c</referenceTo>
    <relationshipLabel>Meal Attendances</relationshipLabel>
    <relationshipName>Meal_Attendances</relationshipName>
    <relationshipOrder>0</relationshipOrder>
    <reparentableMasterDetail>false</reparentableMasterDetail>
    <trackHistory>false</trackHistory>
    <type>MasterDetail</type>
    <writeRequiresMasterRead>false</writeRequiresMasterRead>
</CustomField>`,
    'Meal_Token__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Meal_Token__c</fullName>
    <deleteConstraint>SetNull</deleteConstraint>
    <label>Meal Token</label>
    <referenceTo>Meal_Token__c</referenceTo>
    <relationshipLabel>Meal Attendances</relationshipLabel>
    <relationshipName>Meal_Attendances</relationshipName>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Lookup</type>
</CustomField>`,
    'Attendance_Date__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Attendance_Date__c</fullName>
    <label>Attendance Date</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Date</type>
</CustomField>`,
    'Meal_Type__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Meal_Type__c</fullName>
    <label>Meal Type</label>
    <length>50</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Text</type>
    <unique>false</unique>
</CustomField>`,
    'Attendance_Status__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Attendance_Status__c</fullName>
    <label>Attendance Status</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value>
                <fullName>Present</fullName>
                <default>false</default>
            </value>
            <value>
                <fullName>Not Collected</fullName>
                <default>true</default>
            </value>
            <value>
                <fullName>Cancelled</fullName>
                <default>false</default>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>`,
    'Recorded_Time__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Recorded_Time__c</fullName>
    <label>Recorded Time</label>
    <length>50</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Text</type>
    <unique>false</unique>
</CustomField>`
};

for (const [fieldName, fieldContent] of Object.entries(attendanceFields)) {
    writeXml(path.join(attendanceObjDir, 'fields', fieldName + '.field-meta.xml'), fieldContent);
}

// Token object fields addition (Issued_By__c, Collected_Time__c, Menu__c)
const tokenObjDir = path.join(sfDir, 'Meal_Token__c');
const extraTokenFields = {
    'Issued_By__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Issued_By__c</fullName>
    <label>Issued By</label>
    <length>100</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Text</type>
    <unique>false</unique>
</CustomField>`,
    'Collected_Time__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Collected_Time__c</fullName>
    <label>Collected Time</label>
    <length>50</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Text</type>
    <unique>false</unique>
</CustomField>`,
    'Menu__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Menu__c</fullName>
    <deleteConstraint>SetNull</deleteConstraint>
    <label>Menu</label>
    <referenceTo>Menu__c</referenceTo>
    <relationshipLabel>Meal Tokens</relationshipLabel>
    <relationshipName>Meal_Tokens</relationshipName>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Lookup</type>
</CustomField>`
};

for (const [fieldName, fieldContent] of Object.entries(extraTokenFields)) {
    writeXml(path.join(tokenObjDir, 'fields', fieldName + '.field-meta.xml'), fieldContent);
}

console.log('Extra Salesforce metadata files generated successfully.');
