public with sharing class MessDashboardController {
    
    public class DashboardSummary {
        @AuraEnabled public Integer totalTokensToday;
        @AuraEnabled public Integer vegCount;
        @AuraEnabled public Integer nonVegCount;
        @AuraEnabled public Integer breakfastCount;
        @AuraEnabled public Integer lunchCount;
        @AuraEnabled public Integer snacksCount;
        @AuraEnabled public Integer dinnerCount;
        @AuraEnabled public Integer totalStudents;
        @AuraEnabled public Integer totalMessUsers;
        @AuraEnabled public Decimal attendanceRate;
        @AuraEnabled public User currentUser;
        @AuraEnabled public List<Meal_Token__c> recentTokens;
        @AuraEnabled public List<Mess_User__c> messUsers;
        @AuraEnabled public List<Student__c> studentsList;
    }

    @AuraEnabled(cacheable=true)
    public static DashboardSummary getDashboardSummary() {
        DashboardSummary summary = new DashboardSummary();
        Date today = Date.today();

        // 1. Current Logged In Salesforce User
        try {
            summary.currentUser = [
                SELECT Id, Name, Email, Username, Title, Department, Profile.Name
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];
        } catch (Exception e) {
            summary.currentUser = null;
        }

        // 2. Query Tokens issued today with issuing user and student relations
        List<Meal_Token__c> tokensToday = new List<Meal_Token__c>();
        try {
            tokensToday = [
                SELECT Id, Name, Token_Number__c, Token_Date__c, Token_Time__c, Meal_Type__c, 
                       Status__c, Diet_Preference__c, 
                       Student__c, Student__r.Name, Student__r.Student_ID__c,
                       Student__r.Academic_Year__c, Student__r.Department__c, Student__r.Hostel_Room__c,
                       Issued_By__c, Issued_By_User__c, 
                       Issued_By_User__r.Name, Issued_By_User__r.Email__c, Issued_By_User__r.Role__c,
                       CreatedBy.Name, CreatedDate
                FROM Meal_Token__c 
                WHERE Token_Date__c = :today 
                ORDER BY CreatedDate DESC 
                LIMIT 100
            ];

            // If no tokens for today yet, fetch most recent 50 tokens for live operational audit preview
            if (tokensToday.isEmpty()) {
                tokensToday = [
                    SELECT Id, Name, Token_Number__c, Token_Date__c, Token_Time__c, Meal_Type__c, 
                           Status__c, Diet_Preference__c, 
                           Student__c, Student__r.Name, Student__r.Student_ID__c,
                           Student__r.Academic_Year__c, Student__r.Department__c, Student__r.Hostel_Room__c,
                           Issued_By__c, Issued_By_User__c, 
                           Issued_By_User__r.Name, Issued_By_User__r.Email__c, Issued_By_User__r.Role__c,
                           CreatedBy.Name, CreatedDate
                    FROM Meal_Token__c 
                    ORDER BY CreatedDate DESC 
                    LIMIT 50
                ];
            }
        } catch (Exception e) {
            tokensToday = new List<Meal_Token__c>();
        }

        summary.recentTokens = tokensToday;
        summary.totalTokensToday = tokensToday.size();

        Integer veg = 0;
        Integer nonVeg = 0;
        Integer bCount = 0;
        Integer lCount = 0;
        Integer sCount = 0;
        Integer dCount = 0;

        for (Meal_Token__c t : tokensToday) {
            if (t.Diet_Preference__c == 'Veg') {
                veg++;
            } else if (t.Diet_Preference__c == 'Non-Veg') {
                nonVeg++;
            }

            if (t.Meal_Type__c == 'Breakfast') {
                bCount++;
            } else if (t.Meal_Type__c == 'Lunch') {
                lCount++;
            } else if (t.Meal_Type__c == 'Snacks' || t.Meal_Type__c == 'Evening Snacks') {
                sCount++;
            } else if (t.Meal_Type__c == 'Dinner') {
                dCount++;
            }
        }

        summary.vegCount = veg;
        summary.nonVegCount = nonVeg;
        summary.breakfastCount = bCount;
        summary.lunchCount = lCount;
        summary.snacksCount = sCount;
        summary.dinnerCount = dCount;

        // 3. Query Separate Object: Mess_User__c (Login Users who issue tokens)
        try {
            summary.messUsers = [
                SELECT Id, Name, Email__c, Phone__c, Role__c, Department__c, 
                       Tokens_Issued_Today__c, Total_Tokens_Issued__c, 
                       Last_Login__c, Last_Token_Issued_At__c, 
                       Is_Currently_Active__c, Status__c, Login_Provider__c
                FROM Mess_User__c 
                ORDER BY Tokens_Issued_Today__c DESC, Name ASC
                LIMIT 50
            ];
            summary.totalMessUsers = summary.messUsers.size();
        } catch (Exception e) {
            summary.messUsers = new List<Mess_User__c>();
            summary.totalMessUsers = 0;
        }

        // 4. Query Student__c records with all entered details
        try {
            summary.studentsList = [
                SELECT Id, Name, Student_ID__c, Academic_Year__c, Department__c, Hostel_Room__c, 
                       Diet_Preference__c, Phone__c, Email__c, Status__c, Photo_URL__c
                FROM Student__c 
                ORDER BY Name ASC 
                LIMIT 100
            ];
            summary.totalStudents = summary.studentsList.size();
        } catch (Exception e) {
            summary.studentsList = new List<Student__c>();
            summary.totalStudents = 0;
        }

        // 5. Calculate Attendance Rate
        if (summary.totalStudents > 0) {
            summary.attendanceRate = Math.min(100.0, (Decimal.valueOf(summary.totalTokensToday) / Decimal.valueOf(summary.totalStudents) * 100).setScale(1));
        } else {
            summary.attendanceRate = 0.0;
        }

        return summary;
    }
}
