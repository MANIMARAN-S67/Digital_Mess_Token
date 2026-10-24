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
    @track attendanceSearchKey = '';
    @track attendanceFilter = 'all'; // 'all' | 'present' | 'absent'
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

    // --- Executive KPI Metrics ---
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

    // --- Search & Filter Handlers ---
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

    handleAttendanceSearch(event) {
        this.attendanceSearchKey = (event.target.value || '').toLowerCase();
    }

    handleAttendanceFilterAll() {
        this.attendanceFilter = 'all';
    }

    handleAttendanceFilterPresent() {
        this.attendanceFilter = 'present';
    }

    handleAttendanceFilterAbsent() {
        this.attendanceFilter = 'absent';
    }

    get isAttendanceAll() {
        return this.attendanceFilter === 'all';
    }

    get isAttendancePresent() {
        return this.attendanceFilter === 'present';
    }

    get isAttendanceAbsent() {
        return this.attendanceFilter === 'absent';
    }

    get allPillClass() {
        return this.isAttendanceAll ? 'filter-pill-btn filter-pill-active' : 'filter-pill-btn filter-pill-inactive';
    }

    get presentPillClass() {
        return this.isAttendancePresent ? 'filter-pill-btn filter-pill-active' : 'filter-pill-btn filter-pill-inactive';
    }

    get absentPillClass() {
        return this.isAttendanceAbsent ? 'filter-pill-btn filter-pill-active' : 'filter-pill-btn filter-pill-inactive';
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

    // --- TAB 1: Filtered Tokens List ---
    get filteredTokens() {
        if (!this.summaryData?.recentTokens) return [];
        return this.summaryData.recentTokens
            .filter((t) => {
                const search = this.tokenSearchKey;
                const tokenNum = (t.Token_Number__c || '').toLowerCase();
                const studentName = (t.Student__r?.Name || '').toLowerCase();
                const studentRoll = (t.Student__r?.Student_ID__c || '').toLowerCase();
                const issuer = (t.Issued_By_User__r?.Name || t.Issued_By__c || '').toLowerCase();

                const matchesSearch =
                    !search ||
                    tokenNum.includes(search) ||
                    studentName.includes(search) ||
                    studentRoll.includes(search) ||
                    issuer.includes(search);

                const filter = this.selectedMealFilter;
                const matchesMeal =
                    filter === 'All' ||
                    t.Meal_Type__c === filter ||
                    (filter === 'Snacks' && t.Meal_Type__c?.includes('Snacks'));

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
                    StudentName: t.Student__r ? t.Student__r.Name : 'Resident Student',
                    StudentRoll: t.Student__r ? t.Student__r.Student_ID__c : 'N/A',
                    StudentDept: t.Student__r
                        ? `${t.Student__r.Academic_Year__c ? t.Student__r.Academic_Year__c + ' • ' : ''}${
                              t.Student__r.Department__c || ''
                          }`
                        : '',
                    StudentRoom: t.Student__r?.Hostel_Room__c || 'Hostel',
                    isVeg,
                    dietBadgeClass: isVeg ? 'badge-veg' : 'badge-nonveg',
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

    // --- TAB 2: Automated Hostel Attendance & Food Waste Tracker ---
    get fullAttendanceRoster() {
        if (!this.summaryData?.studentsList) return [];
        const tokens = this.summaryData.recentTokens || [];

        return this.summaryData.studentsList.map((s) => {
            const isVeg = s.Diet_Preference__c === 'Veg';
            // Match token to student by Student__c lookup or Student ID
            const matchedToken = tokens.find(
                (t) =>
                    t.Student__c === s.Id ||
                    (t.Student__r && t.Student__r.Student_ID__c === s.Student_ID__c)
            );

            const isPresent = Boolean(matchedToken);
            const tokenNumber = matchedToken ? matchedToken.Token_Number__c : '';
            const tokenTime = matchedToken ? matchedToken.Token_Time__c : '';
            const mealSession = matchedToken ? matchedToken.Meal_Type__c : 'Lunch';

            // Parse block and room
            let block = 'Hostel';
            let room = '-';
            if (s.Hostel_Room__c) {
                const parts = s.Hostel_Room__c.split('/');
                if (parts.length > 1) {
                    block = parts[0].trim();
                    room = parts[1].trim();
                } else {
                    block = s.Hostel_Room__c.trim();
                }
            }

            return {
                ...s,
                recordUrl: `/lightning/r/Student__c/${s.Id}/view`,
                isPresent,
                tokenNumber,
                tokenTime,
                mealSession,
                isVeg,
                hostelBlock: block,
                roomNumber: room,
                dietBadgeClass: isVeg ? 'badge-veg' : 'badge-nonveg',
                rowClass: isPresent ? 'table-row-present' : 'table-row-absent',
                statusBadgeClass: isPresent ? 'badge-present' : 'badge-absent',
                statusText: isPresent ? 'Present (Token Verified)' : 'Absent (Token Pending)',
                foodImpact: isPresent
                    ? `1x ${s.Diet_Preference__c || 'Veg'} Portion Served`
                    : `Hold 1x ${s.Diet_Preference__c || 'Veg'} (Waste Saved)`
            };
        });
    }

    // Filtered attendance for display in Tab 2
    get filteredAttendanceRoster() {
        return this.fullAttendanceRoster.filter((item) => {
            // Status filter
            if (this.attendanceFilter === 'present' && !item.isPresent) return false;
            if (this.attendanceFilter === 'absent' && item.isPresent) return false;

            // Search filter
            if (this.attendanceSearchKey) {
                const q = this.attendanceSearchKey;
                const name = (item.Name || '').toLowerCase();
                const roll = (item.Student_ID__c || '').toLowerCase();
                const room = (item.Hostel_Room__c || '').toLowerCase();
                const token = (item.tokenNumber || '').toLowerCase();
                return name.includes(q) || roll.includes(q) || room.includes(q) || token.includes(q);
            }

            return true;
        });
    }

    get hasAttendanceRecords() {
        return this.filteredAttendanceRoster.length > 0;
    }

    // Attendance & Food Waste Metrics
    get presentStudentsCount() {
        return this.fullAttendanceRoster.filter((r) => r.isPresent).length;
    }

    get absentStudentsCount() {
        return this.fullAttendanceRoster.filter((r) => !r.isPresent).length;
    }

    get presentVegCount() {
        return this.fullAttendanceRoster.filter((r) => r.isPresent && r.isVeg).length;
    }

    get presentNonVegCount() {
        return this.fullAttendanceRoster.filter((r) => r.isPresent && !r.isVeg).length;
    }

    get absentVegCount() {
        return this.fullAttendanceRoster.filter((r) => !r.isPresent && r.isVeg).length;
    }

    get absentNonVegCount() {
        return this.fullAttendanceRoster.filter((r) => !r.isPresent && !r.isVeg).length;
    }

    get totalVegResidents() {
        return this.presentVegCount + this.absentVegCount;
    }

    get totalNonVegResidents() {
        return this.presentNonVegCount + this.absentNonVegCount;
    }

    get vegServedWidthStyle() {
        const total = this.totalVegResidents || 1;
        const pct = Math.round((this.presentVegCount / total) * 100);
        return `width: ${pct}%; background-color: #059669;`;
    }

    get nonVegServedWidthStyle() {
        const total = this.totalNonVegResidents || 1;
        const pct = Math.round((this.presentNonVegCount / total) * 100);
        return `width: ${pct}%; background-color: #ea580c;`;
    }

    get foodPortionsSaved() {
        return this.absentStudentsCount;
    }

    get estFoodKgsPrevented() {
        return (this.absentStudentsCount * 0.42).toFixed(1);
    }

    get hasAbsentStudents() {
        return this.absentStudentsCount > 0;
    }

    // --- TAB 3: Filtered Mess Users (Login Accounts) ---
    get filteredMessUsers() {
        if (!this.summaryData?.messUsers) return [];
        return this.summaryData.messUsers
            .filter((u) => {
                const search = this.userSearchKey;
                const name = (u.Name || '').toLowerCase();
                const email = (u.Email__c || '').toLowerCase();
                const role = (u.Role__c || '').toLowerCase();
                const dept = (u.Department__c || '').toLowerCase();
                return (
                    !search ||
                    name.includes(search) ||
                    email.includes(search) ||
                    role.includes(search) ||
                    dept.includes(search)
                );
            })
            .map((u) => {
                const isPrincipal = u.Role__c === 'College Principal';
                const roleBadgeClass = isPrincipal ? 'badge-role-principal' : 'badge-role-manager';
                const formattedLastLogin = u.Last_Login__c ? new Date(u.Last_Login__c).toLocaleString() : 'Active Today';

                return {
                    ...u,
                    recordUrl: `/lightning/r/Mess_User__c/${u.Id}/view`,
                    roleBadgeClass,
                    formattedLastLogin,
                    tokensToday: u.Tokens_Issued_Today__c || 0,
                    totalTokens: u.Total_Tokens_Issued__c || 0,
                    cleanPhone: u.Phone__c || 'N/A',
                    statusBadgeClass:
                        u.Status__c === 'Active'
                            ? 'slds-badge slds-theme_success'
                            : 'slds-badge slds-badge_inverse'
                };
            });
    }

    get hasMessUsers() {
        return this.filteredMessUsers.length > 0;
    }

    // --- TAB 4: Filtered Registered Students ---
    get filteredStudents() {
        if (!this.summaryData?.studentsList) return [];
        return this.summaryData.studentsList
            .filter((s) => {
                const search = this.studentSearchKey;
                const name = (s.Name || '').toLowerCase();
                const roll = (s.Student_ID__c || '').toLowerCase();
                const dept = (s.Department__c || '').toLowerCase();
                const room = (s.Hostel_Room__c || '').toLowerCase();
                return (
                    !search ||
                    name.includes(search) ||
                    roll.includes(search) ||
                    dept.includes(search) ||
                    room.includes(search)
                );
            })
            .map((s) => {
                const isVeg = s.Diet_Preference__c === 'Veg';
                return {
                    ...s,
                    recordUrl: `/lightning/r/Student__c/${s.Id}/view`,
                    academicYear: s.Academic_Year__c || '1st Year',
                    isVeg,
                    dietBadgeClass: isVeg ? 'badge-veg' : 'badge-nonveg',
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
}
