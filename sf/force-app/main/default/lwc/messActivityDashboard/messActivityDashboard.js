import { LightningElement, wire, track } from 'lwc';
import getDashboardSummary from '@salesforce/apex/MessDashboardController.getDashboardSummary';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';

export default class MessActivityDashboard extends NavigationMixin(LightningElement) {
    @track summaryData;
    @track error;
    wiredSummaryResult;

    @wire(getDashboardSummary)
    wiredSummary(result) {
        this.wiredSummaryResult = result;
        if (result.data) {
            this.summaryData = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.summaryData = undefined;
        }
    }

    get userName() {
        return this.summaryData?.currentUser?.Name || 'User';
    }

    get userEmail() {
        return this.summaryData?.currentUser?.Email || 'user@salesforce.com';
    }

    get userProfile() {
        return this.summaryData?.currentUser?.Profile?.Name || 'System Administrator';
    }

    get userUsername() {
        return this.summaryData?.currentUser?.Username || 'N/A';
    }

    get userInitials() {
        const name = this.userName;
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }

    get totalTokensToday() {
        return this.summaryData?.totalTokensToday || 0;
    }

    get vegCount() {
        return this.summaryData?.vegCount || 0;
    }

    get nonVegCount() {
        return this.summaryData?.nonVegCount || 0;
    }

    get totalStudents() {
        return this.summaryData?.totalStudents || 0;
    }

    get recentTokens() {
        if (!this.summaryData?.recentTokens) return [];
        return this.summaryData.recentTokens.map(t => ({
            ...t,
            StudentName: t.Student__r ? t.Student__r.Name : 'Student',
            StudentRoll: t.Student__r ? t.Student__r.Student_ID__c : 'N/A'
        }));
    }

    get hasTokens() {
        return this.recentTokens.length > 0;
    }

    handleRefresh() {
        return refreshApex(this.wiredSummaryResult);
    }

    navigateToReports() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Report',
                actionName: 'home'
            }
        });
    }
}
