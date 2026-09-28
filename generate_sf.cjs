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

// Student__c
const studentObjDir = path.join(sfDir, 'Student__c');
ensureDir(studentObjDir);
ensureDir(path.join(studentObjDir, 'fields'));

writeXml(path.join(studentObjDir, 'Student__c.object-meta.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <deploymentStatus>Deployed</deploymentStatus>
    <enableActivities>true</enableActivities>
    <enableBulkApi>true</enableBulkApi>
    <enableHistory>true</enableHistory>
    <enableReports>true</enableReports>
    <enableSearch>true</enableSearch>
    <enableSharing>true</enableSharing>
    <enableStreamingApi>true</enableStreamingApi>
    <label>Student</label>
    <nameField>
        <label>Student Name</label>
        <type>Text</type>
    </nameField>
    <pluralLabel>Students</pluralLabel>
    <sharingModel>ReadWrite</sharingModel>
</CustomObject>`);

const studentFields = {
    'Student_ID__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Student_ID__c</fullName>
    <externalId>true</externalId>
    <label>Student ID</label>
    <length>50</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Text</type>
    <unique>true</unique>
</CustomField>`,
    'Department__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Department__c</fullName>
    <label>Department</label>
    <length>100</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Text</type>
    <unique>false</unique>
</CustomField>`,
    'Hostel_Room__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Hostel_Room__c</fullName>
    <label>Hostel Room</label>
    <length>50</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Text</type>
    <unique>false</unique>
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
                <label>Veg</label>
            </value>
            <value>
                <fullName>Non-Veg</fullName>
                <default>false</default>
                <label>Non-Veg</label>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>`,
    'Status__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Status__c</fullName>
    <label>Status</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value>
                <fullName>Active Plan</fullName>
                <default>true</default>
                <label>Active Plan</label>
            </value>
            <value>
                <fullName>Fee Dues Pending</fullName>
                <default>false</default>
                <label>Fee Dues Pending</label>
            </value>
            <value>
                <fullName>Plan Expired</fullName>
                <default>false</default>
                <label>Plan Expired</label>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>`,
    'Photo_URL__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Photo_URL__c</fullName>
    <label>Photo URL</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Url</type>
</CustomField>`,
    'Phone__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Phone__c</fullName>
    <label>Phone</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Phone</type>
</CustomField>`,
    'Email__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Email__c</fullName>
    <label>Email</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Email</type>
    <unique>false</unique>
</CustomField>`
};

for (const [fieldName, fieldContent] of Object.entries(studentFields)) {
    writeXml(path.join(studentObjDir, 'fields', fieldName + '.field-meta.xml'), fieldContent);
}

// Meal_Token__c
const tokenObjDir = path.join(sfDir, 'Meal_Token__c');
ensureDir(tokenObjDir);
ensureDir(path.join(tokenObjDir, 'fields'));

writeXml(path.join(tokenObjDir, 'Meal_Token__c.object-meta.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <deploymentStatus>Deployed</deploymentStatus>
    <enableActivities>true</enableActivities>
    <enableBulkApi>true</enableBulkApi>
    <enableHistory>true</enableHistory>
    <enableReports>true</enableReports>
    <enableSearch>true</enableSearch>
    <enableSharing>true</enableSharing>
    <enableStreamingApi>true</enableStreamingApi>
    <label>Meal Token</label>
    <nameField>
        <displayFormat>TKN-{000000}</displayFormat>
        <label>Meal Token Name</label>
        <type>AutoNumber</type>
    </nameField>
    <pluralLabel>Meal Tokens</pluralLabel>
    <sharingModel>ControlledByParent</sharingModel>
</CustomObject>`);

const tokenFields = {
    'Student__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Student__c</fullName>
    <label>Student</label>
    <referenceTo>Student__c</referenceTo>
    <relationshipLabel>Meal Tokens</relationshipLabel>
    <relationshipName>Meal_Tokens</relationshipName>
    <relationshipOrder>0</relationshipOrder>
    <reparentableMasterDetail>false</reparentableMasterDetail>
    <trackHistory>false</trackHistory>
    <type>MasterDetail</type>
    <writeRequiresMasterRead>false</writeRequiresMasterRead>
</CustomField>`,
    'Token_Number__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Token_Number__c</fullName>
    <label>Token Number</label>
    <length>50</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Text</type>
    <unique>false</unique>
</CustomField>`,
    'Token_Time__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Token_Time__c</fullName>
    <label>Token Time</label>
    <length>20</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Text</type>
    <unique>false</unique>
</CustomField>`,
    'Token_Date__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Token_Date__c</fullName>
    <label>Token Date</label>
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
                <label>Breakfast</label>
            </value>
            <value>
                <fullName>Lunch</fullName>
                <default>false</default>
                <label>Lunch</label>
            </value>
            <value>
                <fullName>Snacks</fullName>
                <default>false</default>
                <label>Snacks</label>
            </value>
            <value>
                <fullName>Dinner</fullName>
                <default>false</default>
                <label>Dinner</label>
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
                <label>Veg</label>
            </value>
            <value>
                <fullName>Non-Veg</fullName>
                <default>false</default>
                <label>Non-Veg</label>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>`,
    'Status__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Status__c</fullName>
    <label>Status</label>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value>
                <fullName>Issued</fullName>
                <default>true</default>
                <label>Issued</label>
            </value>
            <value>
                <fullName>Declined</fullName>
                <default>false</default>
                <label>Declined</label>
            </value>
            <value>
                <fullName>Already Issued</fullName>
                <default>false</default>
                <label>Already Issued</label>
            </value>
            <value>
                <fullName>Cancelled</fullName>
                <default>false</default>
                <label>Cancelled</label>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>`,
    'Decline_Reason__c': `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Decline_Reason__c</fullName>
    <label>Decline Reason</label>
    <length>255</length>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Text</type>
    <unique>false</unique>
</CustomField>`
};

for (const [fieldName, fieldContent] of Object.entries(tokenFields)) {
    writeXml(path.join(tokenObjDir, 'fields', fieldName + '.field-meta.xml'), fieldContent);
}

const adminProfileDir = path.join(sfDir, '..', 'profiles');
ensureDir(adminProfileDir);

const profileXml = '<?xml version="1.0" encoding="UTF-8"?>\\n<Profile xmlns="http://soap.sforce.com/2006/04/metadata">\\n' +
    Object.keys(studentFields).map(f => '    <fieldPermissions>\\n        <editable>true</editable>\\n        <field>Student__c.' + f + '</field>\\n        <readable>true</readable>\\n    </fieldPermissions>').join('\\n') + '\\n' +
    Object.keys(tokenFields).map(f => '    <fieldPermissions>\\n        <editable>true</editable>\\n        <field>Meal_Token__c.' + f + '</field>\\n        <readable>true</readable>\\n    </fieldPermissions>').join('\\n') + '\\n' +
    '    <custom>false</custom>\\n    <userLicense>Salesforce</userLicense>\\n</Profile>';

writeXml(path.join(adminProfileDir, 'Admin.profile-meta.xml'), profileXml);

console.log('Salesforce metadata files generated successfully.');
