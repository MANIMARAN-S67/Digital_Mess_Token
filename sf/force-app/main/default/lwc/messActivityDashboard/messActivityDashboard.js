import { LightningElement, wire, track } from 'lwc';
import getDashboardSummary from '@salesforce/apex/MessDashboardController.getDashboardSummary';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';

export default class MessActivityDashboard extends NavigationMixin(LightningElement) {
    @track summaryData;
    @track error;
    @track activeTab = 'tokensTab';
    @track tokenSearchKey = '';
    @track selectedMealFilter = 'All';
    @track userSearchKey = '';
    @track studentSearchKey = '';
    @track isRefreshing = false;

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

    // --- Tab Selection ---
    handleTabSelect(event) {
        this.activeTab = event.target.value;
    }

    get isTokensTabActive() {
        return this.activeTab === 'tokensTab';
    }

    get isUsersTabActive() {
        return this.activeTab === 'usersTab';
    }

    get isStudentsTabActive() {
        return this.activeTab === 'studentsTab';
    }

    // --- Logged-In User Information ---
    get userName() {
        return this.summaryData?.currentUser?.Name || 'Mess Operations Staff';
    }

    get userEmail() {
        return this.summaryData?.currentUser?.Email || 'staff@institution.edu';
    }

    get userProfile() {
        return this.summaryData?.currentUser?.Profile?.Name || 'Authorized Staff';
    }

    get userUsername() {
        return this.summaryData?.currentUser?.Username || 'N/A';
    }

    get userDepartment() {
        return this.summaryData?.currentUser?.Department || 'Dining Services';
    }

    get userInitials() {
        const name = this.userName;
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }

    // --- KPI Metrics ---
    get totalTokensToday() {
        return this.summaryData?.totalTokensToday || 0;
    }

    get vegCount() {
        return this.summaryData?.vegCount || 0;
    }

    get nonVegCount() {
        return this.summaryData?.nonVegCount || 0;
    }

    get vegPercentage() {
        const total = this.vegCount + this.nonVegCount;
        if (total === 0) return 50;
        return Math.round((this.vegCount / total) * 100);
    }

    get vegStyleWidth() {
        return `width: ${this.vegPercentage}%;`;
    }

    get breakfastCount() {
        return this.summaryData?.breakfastCount || 0;
    }

    get lunchCount() {
        return this.summaryData?.lunchCount || 0;
    }

    get snacksCount() {
        return this.summaryData?.snacksCount || 0;
    }

    get dinnerCount() {
        return this.summaryData?.dinnerCount || 0;
    }

    get totalStudents() {
        return this.summaryData?.totalStudents || 0;
    }

    get totalMessUsers() {
        return this.summaryData?.totalMessUsers || 0;
    }

    get attendanceRate() {
        return this.summaryData?.attendanceRate || 0;
    }

    // --- Filter Handlers ---
    handleTokenSearch(event) {
        this.tokenSearchKey = (event.target.value || '').toLowerCase();
    }

    handleMealFilterChange(event) {
        this.selectedMealFilter = event.target.value;
    }

    handleUserSearch(event) {
        this.userSearchKey = (event.target.value || '').toLowerCase();
    }

    handleStudentSearch(event) {
        this.studentSearchKey = (event.target.value || '').toLowerCase();
    }

    get mealFilterOptions() {
        return [
            { label: 'All Meal Sessions', value: 'All' },
            { label: 'Breakfast', value: 'Breakfast' },
            { label: 'Lunch', value: 'Lunch' },
            { label: 'Evening Snacks', value: 'Snacks' },
            { label: 'Dinner', value: 'Dinner' }
        ];
    }

    // --- Tab 1: Filtered Tokens List ---
    get filteredTokens() {
        if (!this.summaryData?.recentTokens) return [];
        return this.summaryData.recentTokens
            .filter((t) => {
                const search = this.tokenSearchKey;
                const tokenNum = (t.Token_Number__c || '').toLowerCase();
                const studentName = (t.Student__r?.Name || '').toLowerCase();
                const studentRoll = (t.Student__r?.Student_ID__c || '').toLowerCase();
                const issuer = (t.Issued_By_User__r?.Name || t.Issued_By__c || '').toLowerCase();

                const matchesSearch = !search || tokenNum.includes(search) || studentName.includes(search) || studentRoll.includes(search) || issuer.includes(search);

                const filter = this.selectedMealFilter;
                const matchesMeal = filter === 'All' || t.Meal_Type__c === filter || (filter === 'Snacks' && t.Meal_Type__c?.includes('Snacks'));

                return matchesSearch && matchesMeal;
            })
            .map((t) => {
                const isVeg = t.Diet_Preference__c === 'Veg';
                const issuerName = t.Issued_By_User__r?.Name || t.Issued_By__c || 'Mess Manager';
                const issuerEmail = t.Issued_By_User__r?.Email__c || '';
                const issuerRole = t.Issued_By_User__r?.Role__c || 'Mess Manager';

                return {
                    ...t,
                    recordUrl: `/lightning/r/Meal_Token__c/${t.Id}/view`,
                    StudentName: t.Student__r ? t.Student__r.Name : 'Student',
                    StudentRoll: t.Student__r ? t.Student__r.Student_ID__c : 'N/A',
                    StudentDept: t.Student__r ? `${t.Student__r.Academic_Year__c ? t.Student__r.Academic_Year__c + ' • ' : ''}${t.Student__r.Department__c || ''} • ${t.Student__r.Hostel_Room__c || ''}` : '',
                    isVeg,
                    dietBadgeClass: isVeg ? 'badge-veg slds-badge' : 'badge-nonveg slds-badge',
                    issuerName,
                    issuerEmail,
                    issuerRole,
                    issuerUserId: t.Issued_By_User__c,
                    issuerUrl: t.Issued_By_User__c ? `/lightning/r/Mess_User__c/${t.Issued_By_User__c}/view` : null
                };
            });
    }

    get hasTokens() {
        return this.filteredTokens.length > 0;
    }

    // --- Tab 2: Filtered Mess Users (Login Accounts) ---
    get filteredMessUsers() {
        if (!this.summaryData?.messUsers) return [];
        return this.summaryData.messUsers
            .filter((u) => {
                const search = this.userSearchKey;
                const name = (u.Name || '').toLowerCase();
                const email = (u.Email__c || '').toLowerCase();
                const role = (u.Role__c || '').toLowerCase();
                const dept = (u.Department__c || '').toLowerCase();
                return !search || name.includes(search) || email.includes(search) || role.includes(search) || dept.includes(search);
            })
            .map((u) => {
                const isPrincipal = u.Role__c === 'College Principal';
                const roleBadgeClass = isPrincipal ? 'badge-role-principal slds-badge' : 'badge-role-manager slds-badge';
                const formattedLastLogin = u.Last_Login__c ? new Date(u.Last_Login__c).toLocaleString() : 'Recent';

                return {
                    ...u,
                    recordUrl: `/lightning/r/Mess_User__c/${u.Id}/view`,
                    roleBadgeClass,
                    formattedLastLogin,
                    tokensToday: u.Tokens_Issued_Today__c || 0,
                    totalTokens: u.Total_Tokens_Issued__c || 0,
                    cleanPhone: u.Phone__c || 'N/A',
                    statusBadgeClass: u.Status__c === 'Active' ? 'slds-badge slds-theme_success' : 'slds-badge'
                };
            });
    }

    get hasMessUsers() {
        return this.filteredMessUsers.length > 0;
    }

    // --- Tab 3: Filtered Registered Students ---
    get filteredStudents() {
        if (!this.summaryData?.studentsList) return [];
        return this.summaryData.studentsList
            .filter((s) => {
                const search = this.studentSearchKey;
                const name = (s.Name || '').toLowerCase();
                const roll = (s.Student_ID__c || '').toLowerCase();
                const dept = (s.Department__c || '').toLowerCase();
                const room = (s.Hostel_Room__c || '').toLowerCase();
                return !search || name.includes(search) || roll.includes(search) || dept.includes(search) || room.includes(search);
            })
            .map((s) => {
                const isVeg = s.Diet_Preference__c === 'Veg';
                return {
                    ...s,
                    recordUrl: `/lightning/r/Student__c/${s.Id}/view`,
                    academicYear: s.Academic_Year__c || '1st Year',
                    isVeg,
                    dietBadgeClass: isVeg ? 'badge-veg slds-badge' : 'badge-nonveg slds-badge',
                    cleanPhone: s.Phone__c || 'N/A',
                    cleanEmail: s.Email__c || `${(s.Student_ID__c || '').toLowerCase()}@institution.edu`,
                    statusBadgeClass: 'slds-badge slds-theme_success'
                };
            });
    }

    get hasStudents() {
        return this.filteredStudents.length > 0;
    }

    // --- Actions & Navigation ---
    async handleRefresh() {
        this.isRefreshing = true;
        try {
            await refreshApex(this.wiredSummaryResult);
        } finally {
            this.isRefreshing = false;
        }
    }

    navigateToMessUsers() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Mess_User__c',
                actionName: 'home'
            }
        });
    }

    navigateToStudents() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Student__c',
                actionName: 'home'
            }
        });
    }

    navigateToMealTokens() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Meal_Token__c',
                actionName: 'home'
            }
        });
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
