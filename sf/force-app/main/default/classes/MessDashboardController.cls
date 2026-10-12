public with sharing class MessDashboardController {
    
    public class DashboardSummary {
        @AuraEnabled public Integer totalTokensToday;
        @AuraEnabled public Integer vegCount;
        @AuraEnabled public Integer nonVegCount;
        @AuraEnabled public Integer totalStudents;
        @AuraEnabled public User currentUser;
        @AuraEnabled public List<Meal_Token__c> recentTokens;
    }

    @AuraEnabled(cacheable=true)
    public static DashboardSummary getDashboardSummary() {
        DashboardSummary summary = new DashboardSummary();
        Date today = Date.today();

        // Query Current Logged In User details
        summary.currentUser = [
            SELECT Id, Name, Email, Username, Title, Department, Profile.Name
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        // Query Tokens issued today
        List<Meal_Token__c> tokensToday = [
            SELECT Id, Token_Number__c, Token_Date__c, Token_Time__c, Meal_Type__c, 
                   Status__c, Diet_Preference__c, Student__r.Name, Student__r.Student_ID__c,
                   CreatedBy.Name
            FROM Meal_Token__c 
            WHERE Token_Date__c = :today 
            ORDER BY CreatedDate DESC 
            LIMIT 50
        ];

        summary.recentTokens = tokensToday;
        summary.totalTokensToday = tokensToday.size();

        Integer veg = 0;
        Integer nonVeg = 0;
        for (Meal_Token__c t : tokensToday) {
            if (t.Diet_Preference__c == 'Veg') {
                veg++;
            } else if (t.Diet_Preference__c == 'Non-Veg') {
                nonVeg++;
            }
        }
        summary.vegCount = veg;
        summary.nonVegCount = nonVeg;

        try {
            summary.totalStudents = [SELECT COUNT() FROM Student__c];
        } catch (Exception e) {
            summary.totalStudents = 0;
        }

        return summary;
    }
}
