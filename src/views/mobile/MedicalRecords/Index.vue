<template>
<div class="medical-records-container">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>
    <!-- Top Bar -->
    <TopBar
        :title="getTabTitle()"
        :profile-name="activeProfileName"
        :show-back="false"
        @profile-click="showProfileSwitcher = true"
    >
        <template #actions>
            <div class="top-bar-actions">
                <mdicon 
                    name="bell-outline" 
                    :size="24" 
                    class="action-icon"
                    @click="handleNotificationBell"
                />
                <mdicon 
                    name="magnify" 
                    :size="24" 
                    class="action-icon"
                />
                <mdicon 
                    name="home-outline" 
                    :size="24" 
                    class="action-icon"
                    @click="router.push('/')"
                />
            </div>
        </template>
    </TopBar>

    <div v-if="showNotificationsPanel" class="notification-overlay">
        <div class="notification-backdrop" @click="showNotificationsPanel = false"></div>
        <div class="notification-panel glass-card">
            <div class="notification-header">
                <div>
                    <p class="label">Notifications</p>
                    <h4>Overdue reminders</h4>
                </div>
                <button class="icon-btn ghost" @click="showNotificationsPanel = false">
                    <mdicon name="close" :size="18" />
                </button>
            </div>
            <div v-if="!overdueReminders.length" class="notification-empty">
                <p class="sub">No overdue reminders.</p>
            </div>
            <div v-else class="notification-list">
                <div class="notification-item" v-for="reminder in overdueReminders" :key="reminder.id">
                    <div class="notif-main">
                        <p class="notif-title">{{ reminder.medicineName || 'Reminder' }}</p>
                        <p class="notif-sub">{{ reminder.intakeMethod || 'Anytime' }}</p>
                    </div>
                    <div class="notif-slots">
                        <span class="notif-slot overdue" v-for="slot in reminder.slots" :key="slot.id">
                            {{ slot.label }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Content Area -->
    <div class="content-wrapper">
        <!-- Home Tab -->
        <div v-if="activeTab === 'home'" class="tab-content home-tab">

            <!-- Active illness alert -->
            <div class="home-alert" v-if="activeIllness" @click="navigateToIllness">
                <mdicon name="alert-circle-outline" :size="18" class="home-alert-icon"/>
                <div class="home-alert-body">
                    <p class="home-alert-title">{{ activeIllness.diagnosis }}</p>
                    <p class="home-alert-sub">{{ activeIllness.status }} · {{ activeIllness.severity || 'Mild' }}</p>
                </div>
                <mdicon name="chevron-right" :size="16" class="home-alert-arrow"/>
            </div>

            <!-- Today's Medications -->
            <div class="home-meds-card glass-card">
                <div class="home-meds-header">
                    <div class="hmc-left">
                        <div class="hmc-icon"><mdicon name="pill" :size="18"/></div>
                        <div>
                            <p class="hmc-title">Today's Medications</p>
                            <p class="hmc-sub" v-if="todaysReminders.length">
                                {{ todayMedsTaken }} of {{ todayMedsTotal }} doses taken
                            </p>
                            <p class="hmc-sub" v-else>No reminders set for today</p>
                        </div>
                    </div>
                    <div class="hmc-pct-block" v-if="todayMedsTotal">
                        <p class="hmc-pct">{{ Math.round((todayMedsTaken / todayMedsTotal) * 100) }}%</p>
                        <div class="hmc-bar-track">
                            <div class="hmc-bar-fill"
                                :style="{ width: `${Math.round((todayMedsTaken / todayMedsTotal) * 100)}%` }">
                            </div>
                        </div>
                    </div>
                </div>
                <template v-if="hasActiveProfile && !remindersLoading">
                    <div class="home-reminder-item"
                        v-for="reminder in todaysReminders"
                        :key="reminder.id"
                    >
                        <div class="hri-left">
                            <p class="hri-name">{{ reminder.medicineName }}</p>
                            <p class="hri-detail">{{ formatFrequency(reminder) }} · {{ reminder.intakeMethod || 'Anytime' }}</p>
                        </div>
                        <div class="hri-slots">
                            <button
                                class="hri-slot-pill"
                                v-for="slot in reminder.slots" :key="slot.id"
                                :class="{ taken: slot.status === 'taken', missed: slot.status === 'missed' }"
                                @click.stop="toggleHomeReminder(reminder, slot)"
                            >
                                {{ slot.label }}
                                <span class="hri-icon" v-if="slot.status === 'taken'">✓</span>
                                <span class="hri-icon" v-else-if="slot.status === 'missed'">✕</span>
                            </button>
                        </div>
                    </div>
                    <div class="home-meds-empty" v-if="!todaysReminders.length">
                        <p>No reminders yet.</p>
                        <button class="hme-btn" @click="navigateToMedicineReminder">+ Add reminder</button>
                    </div>
                </template>
                <div class="home-meds-loading" v-else-if="remindersLoading">Loading reminders…</div>
                <div class="home-meds-loading" v-else-if="!hasActiveProfile">Select a profile to see reminders.</div>
            </div>

            <!-- Vitals snapshot strip -->
            <div class="vitals-strip" v-if="bpLatest || bsLatest || bodyWeightLatest">
                <div class="vital-chip" @click="navigateToBloodPressure" v-if="bpLatest">
                    <div class="vchip-top">
                        <div class="vchip-icon vci-red"><mdicon name="heart-pulse" :size="13"/></div>
                        <span class="vchip-label">Blood Pressure</span>
                    </div>
                    <p class="vchip-val">{{ bpLatest.systolic }}/{{ bpLatest.diastolic }}</p>
                    <span class="vchip-badge" :class="`vb-${bpLatest.status?.toLowerCase()}`">{{ bpLatest.status }}</span>
                </div>
                <div class="vital-chip" @click="navigateToBloodSugar" v-if="bsLatest">
                    <div class="vchip-top">
                        <div class="vchip-icon vci-amber"><mdicon name="water-outline" :size="13"/></div>
                        <span class="vchip-label">Blood Sugar</span>
                    </div>
                    <p class="vchip-val">{{ bsLatest.value }}<span class="vchip-unit"> mg/dL</span></p>
                    <span class="vchip-badge" :class="`vb-${bsStatusLabel?.toLowerCase()}`">{{ bsStatusLabel }}</span>
                </div>
                <div class="vital-chip" @click="navigateToBodyWeight" v-if="bodyWeightLatest">
                    <div class="vchip-top">
                        <div class="vchip-icon vci-blue"><mdicon name="scale-bathroom" :size="13"/></div>
                        <span class="vchip-label">Body Weight</span>
                    </div>
                    <p class="vchip-val">{{ bodyWeightLatest.weight }}<span class="vchip-unit"> kg</span></p>
                    <span class="vchip-badge"
                        :class="bodyWeightLatest.change > 0.05 ? 'vb-up' : bodyWeightLatest.change < -0.05 ? 'vb-down' : 'vb-stable'">
                        {{ bodyWeightLatest.change > 0.05 ? `+${bodyWeightLatest.change}` : bodyWeightLatest.change < -0.05 ? `${bodyWeightLatest.change}` : 'Stable' }}
                    </span>
                </div>
            </div>

            <!-- Quick actions row -->
            <div class="quick-row">
                <button class="quick-btn" @click="navigateToAddRecord">
                    <div class="qb-icon qb-record"><mdicon name="clipboard-plus" :size="20"/></div>
                    <span>Add Record</span>
                </button>
                <button class="quick-btn" @click="navigateToMedicineReminder">
                    <div class="qb-icon qb-reminder"><mdicon name="bell-plus-outline" :size="20"/></div>
                    <span>Reminder</span>
                </button>
                <button class="quick-btn" @click="router.push('/medical-records/insights')">
                    <div class="qb-icon qb-ai"><mdicon name="brain" :size="20"/></div>
                    <span>AI Insights</span>
                </button>
            </div>

            <!-- Recent Records -->
            <div class="home-section-header">
                <h3 class="home-section-title">Recent records</h3>
                <a href="#" class="see-all-link" @click.prevent="handleTabChange('records')">See all</a>
            </div>
            <div class="records-list">
                <div v-if="medicalRecordsLoading" class="records-loading">Loading records…</div>
                <template v-else>
                    <div
                        class="record-item"
                        v-for="record in recentMedicalRecords"
                        :key="record.id"
                        @click="openRecordDetail(record)"
                    >
                        <div class="record-icon">
                            <mdicon :name="getRecordIcon(record.recordType)" :size="22"/>
                        </div>
                        <div class="record-content">
                            <h4 class="record-name">{{ record.title }}</h4>
                            <p class="record-type">
                                {{ getRecordTypeLabel(record.recordType) }} · {{ formatRecordDate(record.recordDate) }}
                            </p>
                        </div>
                        <mdicon name="chevron-right" :size="18" class="record-arrow"/>
                    </div>
                    <div v-if="recentMedicalRecords.length === 0" class="empty-state small">
                        <p class="empty-title">No records yet</p>
                        <p class="empty-text">Add your first record to see it here.</p>
                    </div>
                </template>
            </div>
        </div>

        <!-- Records Tab -->
        <div v-if="activeTab === 'records'" class="tab-content">
            <div class="records-list-view">

                <!-- Search bar -->
                <div class="records-search glass-card">
                    <mdicon name="magnify" :size="20" />
                    <input
                        v-model="recordSearch"
                        type="text"
                        placeholder="Search records…"
                        aria-label="Search records"
                    />
                    <button
                        v-if="recordSearch"
                        class="clear-btn"
                        type="button"
                        @click="recordSearch = ''"
                    >
                        <mdicon name="close-circle" :size="18"/>
                    </button>
                </div>

                <!-- Type filter chips -->
                <div class="type-filter-scroll" v-if="availableTypeFilters.length > 1">
                    <div class="type-filter-row">
                        <button
                            v-for="f in availableTypeFilters"
                            :key="f.key"
                            class="type-filter-chip"
                            :class="{ active: recordTypeFilter === f.key }"
                            @click="recordTypeFilter = f.key"
                        >
                            {{ f.label }}
                            <span class="tfc-count">{{ f.count }}</span>
                        </button>
                    </div>
                </div>

                <div v-if="medicalRecordsLoading" class="records-loading large">
                    Loading medical records...
                </div>

                <template v-else>
                    <template v-for="group in groupedRecords" :key="group.label">
                        <!-- Month header -->
                        <div class="rec-group-header">
                            <span class="rec-group-label">{{ group.label }}</span>
                            <span class="rec-group-count">{{ group.records.length }}</span>
                        </div>

                        <!-- Record rows -->
                        <div
                            class="record-card"
                            v-for="record in group.records"
                            :key="record.id"
                            @click="openRecordDetail(record)"
                        >
                            <div
                                class="record-icon-large"
                                :style="{
                                    background: getRecordTypeColor(record.recordType).bg,
                                    borderColor: getRecordTypeColor(record.recordType).border,
                                    color: getRecordTypeColor(record.recordType).icon
                                }"
                            >
                                <mdicon :name="getRecordIcon(record.recordType)" :size="22"/>
                            </div>
                            <div class="record-info">
                                <div class="record-title-row">
                                    <h4 class="record-title">{{ record.title }}</h4>
                                    <span v-if="record.files?.length" class="rec-attach-badge">
                                        <mdicon name="paperclip" :size="11"/>
                                        {{ record.files.length }}
                                    </span>
                                </div>
                                <p class="record-meta">
                                    {{ getRecordTypeLabel(record.recordType) }} · {{ formatRecordDate(record.recordDate) }}
                                </p>
                                <div class="rec-tags" v-if="record.tags?.length">
                                    <span class="rec-tag" v-for="tag in record.tags.slice(0, 2)" :key="tag">{{ tag }}</span>
                                    <span class="rec-tag rec-tag-more" v-if="record.tags.length > 2">+{{ record.tags.length - 2 }}</span>
                                </div>
                            </div>
                            <mdicon name="chevron-right" :size="18" class="record-chevron"/>
                        </div>
                    </template>

                    <div v-if="filteredMedicalRecords.length === 0" class="empty-state">
                        <mdicon name="file-document-multiple" :size="64" class="empty-icon"/>
                        <p class="empty-title">{{ recordSearch || recordTypeFilter !== 'all' ? 'No results' : 'No Records Yet' }}</p>
                        <p class="empty-text">
                            {{ recordSearch || recordTypeFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Start adding medical records to track your health history' }}
                        </p>
                    </div>

                    <p v-if="medicalRecordsError" class="records-error">
                        {{ medicalRecordsError.message || 'Something went wrong while loading records.' }}
                    </p>
                </template>
            </div>

            <!-- Floating Action Button -->
            <button class="fab" @click="navigateToAddRecord">
                <mdicon name="plus" :size="28"/>
            </button>
        </div>

        <!-- My Health Tab -->
        <div v-if="activeTab === 'health'" class="tab-content health-tab">

            <!-- Today's Medication Progress -->
            <div class="health-meds-row" v-if="todaysReminders.length" @click="setTab('home')">
                <div class="hm-left">
                    <div class="hm-icon"><mdicon name="pill" :size="18"/></div>
                    <div>
                        <p class="hm-label">Today's medications</p>
                        <p class="hm-sub">{{ todayMedsTaken }} of {{ todayMedsTotal }} doses taken</p>
                    </div>
                </div>
                <div class="hm-right">
                    <div class="hm-bar-track">
                        <div class="hm-bar-fill" :style="{ width: todayMedsTotal ? `${Math.round((todayMedsTaken / todayMedsTotal) * 100)}%` : '0%' }"></div>
                    </div>
                    <span class="hm-pct">{{ todayMedsTotal ? Math.round((todayMedsTaken / todayMedsTotal) * 100) : 0 }}%</span>
                    <mdicon name="chevron-right" :size="16" class="hm-chevron"/>
                </div>
            </div>

            <!-- Active illness alert -->
            <div class="health-alert-card" v-if="activeIllness" @click="navigateToIllness">
                <div class="ha-icon"><mdicon name="alert-circle-outline" :size="20"/></div>
                <div class="ha-body">
                    <p class="ha-title">{{ activeIllness.diagnosis }}</p>
                    <p class="ha-sub">{{ activeIllness.status }} · {{ activeIllness.severity || 'Mild' }}{{ activeIllness.bodyTemperature ? ` · ${activeIllness.bodyTemperature}°${activeIllness.temperatureUnit || 'C'}` : '' }}</p>
                </div>
                <mdicon name="chevron-right" :size="16" class="ha-chevron"/>
            </div>

            <!-- Vitals section label -->
            <p class="health-section-label">Vitals</p>

            <!-- Blood Pressure -->
            <div class="vital-card glass-card" @click="navigateToBloodPressure">
                <div class="vc-top">
                    <div class="vc-icon vc-icon-red"><mdicon name="heart-pulse" :size="18"/></div>
                    <div class="vc-meta">
                        <p class="vc-name">Blood Pressure</p>
                        <p class="vc-date">{{ bpLastDate || 'No data' }}</p>
                    </div>
                    <mdicon name="chevron-right" :size="18" class="vc-chevron"/>
                </div>
                <div class="vc-body" v-if="bpLatest">
                    <div class="vc-reading">
                        <span class="vc-value">{{ bpLatest.systolic }}/{{ bpLatest.diastolic }}</span>
                        <span class="vc-unit">mmHg</span>
                        <span class="vc-badge" :class="`vb-${bpLatest.status?.toLowerCase().replace(/\s+/g,'-')}`">{{ bpLatest.status }}</span>
                    </div>
                    <svg v-if="bpSparklinePoints" class="vc-spark" viewBox="0 0 100 28" preserveAspectRatio="none">
                        <polyline :points="bpSparklinePoints" fill="none" stroke="#f87171" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <p v-else class="vc-empty">No readings yet — tap to add</p>
            </div>

            <!-- Blood Sugar -->
            <div class="vital-card glass-card" @click="navigateToBloodSugar">
                <div class="vc-top">
                    <div class="vc-icon vc-icon-amber"><mdicon name="water-outline" :size="18"/></div>
                    <div class="vc-meta">
                        <p class="vc-name">Blood Sugar</p>
                        <p class="vc-date">{{ bsLastDate || 'No data' }}</p>
                    </div>
                    <mdicon name="chevron-right" :size="18" class="vc-chevron"/>
                </div>
                <div class="vc-body" v-if="bsLatest">
                    <div class="vc-reading">
                        <span class="vc-value">{{ bsLatest.value }}</span>
                        <span class="vc-unit">mg/dL</span>
                        <span class="vc-badge" :class="`vb-${(bsStatusLabel || bsLatest.type)?.toLowerCase()}`">{{ bsStatusLabel || bsLatest.type }}</span>
                    </div>
                    <svg v-if="bsSparklinePoints" class="vc-spark" viewBox="0 0 100 28" preserveAspectRatio="none">
                        <polyline :points="bsSparklinePoints" fill="none" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <p v-else class="vc-empty">No readings yet — tap to add</p>
            </div>

            <!-- Body Weight -->
            <div class="vital-card glass-card" @click="navigateToBodyWeight">
                <div class="vc-top">
                    <div class="vc-icon vc-icon-blue"><mdicon name="scale-bathroom" :size="18"/></div>
                    <div class="vc-meta">
                        <p class="vc-name">Body Weight</p>
                        <p class="vc-date">{{ bwLastDate || 'No data' }}</p>
                    </div>
                    <mdicon name="chevron-right" :size="18" class="vc-chevron"/>
                </div>
                <div class="vc-body" v-if="bodyWeightLatest">
                    <div class="vc-reading">
                        <span class="vc-value">{{ bodyWeightLatest.weight }}</span>
                        <span class="vc-unit">kg</span>
                        <span class="vc-badge" :class="bodyWeightLatest.change > 0 ? 'vb-up' : bodyWeightLatest.change < 0 ? 'vb-down' : 'vb-stable'">
                            {{ bodyWeightLatest.change > 0 ? `+${bodyWeightLatest.change} kg` : bodyWeightLatest.change < 0 ? `${bodyWeightLatest.change} kg` : 'Stable' }}
                        </span>
                    </div>
                    <svg v-if="bwSparklinePoints" class="vc-spark" viewBox="0 0 100 28" preserveAspectRatio="none">
                        <polyline :points="bwSparklinePoints" fill="none" stroke="#60a5fa" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <p v-else class="vc-empty">No readings yet — tap to add</p>
            </div>

            <!-- Illness history (if no active, show last entry) -->
            <template v-if="!activeIllness">
                <p class="health-section-label">Conditions</p>
                <div class="vital-card glass-card" @click="navigateToIllness">
                    <div class="vc-top">
                        <div class="vc-icon vc-icon-purple"><mdicon name="medical-bag" :size="18"/></div>
                        <div class="vc-meta">
                            <p class="vc-name">Illness log</p>
                            <p class="vc-date">{{ latestIllness ? formatRecordDate(latestIllness.recordedAt || latestIllness.createdAt) : 'No entries' }}</p>
                        </div>
                        <mdicon name="chevron-right" :size="18" class="vc-chevron"/>
                    </div>
                    <div v-if="latestIllness" class="vc-illness-row">
                        <span class="vc-illness-name">{{ latestIllness.diagnosis }}</span>
                        <span class="vc-badge" :class="`vb-${latestIllness.status?.toLowerCase()}`">{{ latestIllness.status }}</span>
                        <span class="vc-badge vb-subtle">{{ latestIllness.severity || 'MILD' }}</span>
                    </div>
                    <p v-else class="vc-empty">No illness entries yet — tap to add</p>
                </div>
            </template>

            <!-- AI Health Insights CTA -->
            <div class="health-ai-cta" @click="router.push('/medical-records/insights')">
                <div class="hai-icon"><mdicon name="brain" :size="20"/></div>
                <div class="hai-body">
                    <p class="hai-title">AI Health Insights</p>
                    <p class="hai-sub">Trends, alerts, and recommendations</p>
                </div>
                <mdicon name="chevron-right" :size="18" class="hai-chevron"/>
            </div>

        </div>

        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'" class="tab-content profile-tab">
            <div class="profile-header">
                <button class="back-btn" @click="router.back()">
                    <mdicon name="arrow-left" :size="22"/>
                </button>
                <h2>Profile</h2>
                <button class="icon-btn">
                    <mdicon name="account-plus" :size="22"/>
                </button>
            </div>

            <div class="profile-switcher" v-if="profileMembers.length">
                <div 
                    v-for="member in profileMembers" 
                    :key="member.id"
                    class="profile-avatar"
                    :class="{ active: member.id === activeMemberId }"
                    @click="selectProfileMember(member)"
                >
                    <div class="avatar-circle">
                        <mdicon :name="activeMemberId === member.id ? 'account' : 'account-outline'" :size="28"/>
                    </div>
                    <span>{{ member.name }}</span>
                </div>
                <div class="profile-avatar add" @click="addFamilyMember">
                    <div class="avatar-circle">
                        <mdicon name="plus" :size="26"/>
                    </div>
                    <span>Add</span>
                </div>
            </div>
            <div v-else class="profile-switcher empty">
                <div class="profile-avatar add" @click="addFamilyMember">
                    <div class="avatar-circle">
                        <mdicon name="plus" :size="26"/>
                    </div>
                    <span>Add Profile</span>
                </div>
            </div>

            <div class="profile-card glass-card">
                <div 
                    class="profile-row"
                    v-for="item in profileSections"
                    :key="item.label"
                    @click="navigateProfileSection(item.action)"
                >
                    <div class="row-left">
                        <mdicon :name="item.icon" :size="20"/>
                        <span>{{ item.label }}</span>
                    </div>
                    <mdicon name="chevron-right" :size="20"/>
                </div>
            </div>

            <div class="profile-card glass-card">
                <div 
                    class="profile-row"
                    v-for="item in supportSections"
                    :key="item.label"
                    @click="navigateProfileSection(item.action)"
                >
                    <div class="row-left">
                        <mdicon :name="item.icon" :size="20"/>
                        <span>{{ item.label }}</span>
                    </div>
                    <mdicon name="chevron-right" :size="20"/>
                </div>
            </div>
        </div>
    </div>

    <!-- Bottom Navigation -->
    <BottomNav 
        :active-tab="activeTab"
        :profile-name="activeProfileName"
        @change-tab="handleTabChange"
    />

        <div v-if="showProfilePrompt && !hasActiveProfile" class="overlay">
            <div class="sheet confirm-sheet">
                <div class="sheet-head">
                    <div class="badge round-pill text-bg-danger">Attention!</div>
                </div>
                <h3 class="sheet-title">Profile needed</h3>
                <p class="sub">Create a profile to access medical records and reminders.</p>
                <div class="actions">
                    <button type="button" class="btn btn-primary" @click="goAddProfile">Add profile</button>&nbsp;&nbsp;
                    <button type="button" class="btn btn-secondary" @click="router.push('/')">Home</button>
                </div>
            </div>
        </div>
    <!-- Health Category Modal -->
    <div v-if="showHealthModal" class="modal-overlay" @click="showHealthModal = false">
        <div class="modal-content" @click.stop>
            <div class="modal-header">
                <mdicon name="plus" :size="24" class="modal-icon"/>
                <h3 class="modal-title">Add new category</h3>
            </div>
            <div class="modal-options">
                <div 
                    class="modal-option"
                    v-for="category in healthCategories" 
                    :key="category.id"
                    @click="selectHealthCategory(category.id)"
                >
                    <div class="option-radio" :class="{ selected: selectedCategory === category.id }">
                        <div class="radio-dot" v-if="selectedCategory === category.id"></div>
                    </div>
                    <span class="option-label">{{ category.name }}</span>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Profile Switcher Sheet -->
<div v-if="showProfileSwitcher" class="modal-overlay" @click="showProfileSwitcher = false">
    <div class="modal-content profile-switcher-sheet" @click.stop>
        <div class="modal-header">
            <mdicon name="account-circle" :size="24" class="modal-icon"/>
            <h3 class="modal-title">Switch profile</h3>
            <button class="icon-btn ghost sheet-close" @click="showProfileSwitcher = false">
                <mdicon name="close" :size="18"/>
            </button>
        </div>
        <div class="switcher-list">
            <div
                v-for="member in profileMembers"
                :key="member.id"
                class="switcher-item"
                :class="{ active: member.id === activeMemberId }"
                @click="selectProfileMember(member); showProfileSwitcher = false"
            >
                <div class="switcher-avatar">
                    <mdicon :name="member.id === activeMemberId ? 'account' : 'account-outline'" :size="26"/>
                </div>
                <span class="switcher-name">{{ member.name }}</span>
                <mdicon v-if="member.id === activeMemberId" name="check-circle" :size="20" class="switcher-check"/>
            </div>
            <div class="switcher-item add-profile" @click="addFamilyMember(); showProfileSwitcher = false">
                <div class="switcher-avatar add">
                    <mdicon name="plus" :size="22"/>
                </div>
                <span class="switcher-name">Add profile</span>
            </div>
        </div>
    </div>
</div>

<div v-if="showToast" class="toast-notification">
    <div class="toast-icon">
        <mdicon name="account-check" :size="22"/>
    </div>
    <div class="toast-text">
        <p class="toast-title">Profile Selected</p>
        <p class="toast-message">{{ toastMessage }}</p>
    </div>
</div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import TopBar from '@/components/MedicalRecords/TopBar.vue'
import BottomNav from '@/components/MedicalRecords/BottomNav.vue'
import { useProfiles } from '@/composables/profiles'
import { useBloodPressure } from '@/composables/vitals/bloodPressure'
import { useBloodSugar } from '@/composables/vitals/bloodSugar'
import { useIllness } from '@/composables/vitals/illness'
import { useMedicalRecords } from '@/composables/medicalRecords'
import { useMedicineReminders } from '@/composables/medicineReminders'
import { ensureLocalNotificationPermission, triggerImmediateReminderNotification, cancelReminderNotifications, scheduleReminderNotifications, clearNotificationsExcept } from '@/composables/localNotifications'
import { API_BASE_URL } from '@/constants/config'

export default {
    name: "MedicalRecordsMobile",
    components: {
        TopBar,
        BottomNav
    },
    setup() {
        const router = useRouter()
        const route = useRoute()
        const activeTab = ref(typeof route.query.tab === 'string' ? route.query.tab : 'home')
        const showHealthModal = ref(false)
        const selectedCategory = ref('blood-pressure')
        const showProfilePrompt = ref(false)
        const showToast = ref(false)
        const toastMessage = ref('')
        const notificationBusy = ref(false)
        const notifiedSlotsToday = ref(new Set())
        const notifiedDateKey = ref(new Date().toISOString().slice(0, 10))
        const previousReminderIds = ref(new Set())
        const showNotificationsPanel = ref(false)
        const showProfileSwitcher = ref(false)

        const handleTabChange = (tab) => {
            activeTab.value = tab
            router.replace({ path: '/medical-records', query: { tab } })
        }

        const getTabTitle = () => {
            const titles = {
                home: 'Medical Records',
                records: 'Records',
                health: 'My Health',
                profile: 'Profile'
            }
            return titles[activeTab.value] || 'Medical Records'
        }

        const navigateToAddRecord = () => {
            router.push('/medical-records/add-record')
        }

        const navigateToMedicineReminder = () => {
            router.push('/medical-records/medicine-reminders')
        }

        const openRecordDetail = (record) => {
            if (!record?.id) return
            const profileId = activeMemberId.value || record.profileId || ''
            const profileName = activeProfileName.value || record.profile?.displayName || ''
            const tab = activeTab.value
            router.push({
                path: `/medical-records/records/${record.id}`,
                query: {
                    profileId,
                    profileName,
                    from: `/medical-records?tab=${tab}`
                }
            })
        }

        // Health categories for modal
        const healthCategories = [
            { id: 'blood-pressure', name: 'Blood pressure' },
            { id: 'blood-sugar', name: 'Blood sugar' },
            { id: 'body-weight', name: 'Body weight' }
        ]

        const selectHealthCategory = (categoryId) => {
            selectedCategory.value = categoryId
            // TODO: Navigate to add health data page or show form
            console.log('Selected category:', categoryId)
            showHealthModal.value = false
        }

        const goProfileTab = () => {
            activeTab.value = 'profile'
            showProfilePrompt.value = true
            router.replace({ path: '/medical-records', query: { tab: 'profile' } })
        }

        const goAddProfile = () => {
            router.push('/medical-records/profile/add')
        }

        const handleNotificationBell = async() => {
            showNotificationsPanel.value = !showNotificationsPanel.value
            if (!notificationBusy.value) {
                notificationBusy.value = true
                // Try to ensure permissions in the background so future notifications work
                await ensureLocalNotificationPermission().catch(() => {})
                notificationBusy.value = false
            }
        }

        const ensureProfileSelected = () => {
            if (!activeMemberId.value) {
                alert('Please select a profile first.')
                return false
            }
            return true
        }

        const navigateToBloodPressure = () => {
            if (!ensureProfileSelected()) return
            router.push({
                path: '/medical-records/blood-pressure',
                query: {
                    profileId: activeMemberId.value,
                    profileName: activeProfileName.value
                }
            })
        }

        const navigateToBloodSugar = () => {
            if (!ensureProfileSelected()) return
            router.push({
                path: '/medical-records/blood-sugar',
                query: {
                    profileId: activeMemberId.value,
                    profileName: activeProfileName.value
                }
            })
        }

        const navigateToBodyWeight = () => {
            if (!ensureProfileSelected()) return
            router.push({
                path: '/medical-records/body-weight',
                query: {
                    profileId: activeMemberId.value,
                    profileName: activeProfileName.value
                }
            })
        }

        const navigateToIllness = () => {
            if (!ensureProfileSelected()) return
            router.push({
                path: '/medical-records/illness',
                query: {
                    profileId: activeMemberId.value,
                    profileName: activeProfileName.value
                }
            })
        }

        // Week days for charts
        const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
        
        const { records: bpRecords, fetchRecords: fetchBpRecords } = useBloodPressure()
        const { records: bsRecords, fetchRecords: fetchBsRecords } = useBloodSugar()
        const { records: illnessRecords, fetchRecords: fetchIllnessRecords } = useIllness()
        const {
            records: medicalRecords,
            loading: medicalRecordsLoading,
            error: medicalRecordsError,
            fetchRecords: fetchMedicalRecords
        } = useMedicalRecords()
        const recordSearch = ref('')
        const recordTypeFilter = ref('all')

        const recordTypeColors = {
            LAB_RESULT:         { bg: 'rgba(34,211,238,0.15)',  icon: '#22d3ee', border: 'rgba(34,211,238,0.28)'  },
            PRESCRIPTION:       { bg: 'rgba(167,139,250,0.15)', icon: '#a78bfa', border: 'rgba(167,139,250,0.28)' },
            DIAGNOSIS:          { bg: 'rgba(52,211,153,0.15)',  icon: '#34d399', border: 'rgba(52,211,153,0.28)'  },
            IMAGING:            { bg: 'rgba(251,191,36,0.15)',  icon: '#fbbf24', border: 'rgba(251,191,36,0.28)'  },
            VACCINATION:        { bg: 'rgba(248,113,113,0.15)', icon: '#f87171', border: 'rgba(248,113,113,0.28)' },
            DISCHARGE_SUMMARY:  { bg: 'rgba(96,165,250,0.15)',  icon: '#60a5fa', border: 'rgba(96,165,250,0.28)'  },
            OTHER:              { bg: 'rgba(148,163,184,0.15)', icon: '#94a3b8', border: 'rgba(148,163,184,0.28)' },
        }
        const getRecordTypeColor = (type) => recordTypeColors[type] || recordTypeColors.OTHER
        const {
            reminders: medicineReminders,
            loading: remindersLoading,
            fetchReminders: fetchMedicineReminders,
            setReminderStatus: setMedicineReminderStatus
        } = useMedicineReminders()
        const bodyWeightRecords = ref([])

        const fetchBodyWeightRecords = async(profileId) => {
            const token = localStorage.getItem('token')
            if (!token || !profileId) {
                bodyWeightRecords.value = []
                return
            }
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/vitals/body-weight?profileId=${profileId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                const data = await res.json()
                if (res.ok) {
                    bodyWeightRecords.value = data.records || []
                } else {
                    bodyWeightRecords.value = []
                }
            } catch (err) {
                console.error(err)
                bodyWeightRecords.value = []
            }
        }

        const loadHealthData = async(profileId) => {
            const token = localStorage.getItem('token')
            if (!token || !profileId) {
                bpRecords.value = []
                bsRecords.value = []
                bodyWeightRecords.value = []
                illnessRecords.value = []
                return
            }
            await Promise.all([
                fetchBpRecords(token, profileId),
                fetchBsRecords(token, profileId),
                fetchBodyWeightRecords(profileId),
                fetchIllnessRecords(token, profileId)
            ])
        }

        const loadMedicalRecords = async(profileId) => {
            const token = localStorage.getItem('token')
            if (!token || !profileId) {
                medicalRecords.value = []
                medicalRecordsError.value = null
                return
            }
            medicalRecordsError.value = null
            await fetchMedicalRecords(token, profileId)
        }

        const loadMedicineReminders = async(profileId, referenceDate = new Date()) => {
            const token = localStorage.getItem('token')
            if (!token || !profileId) {
                medicineReminders.value = []
                return
            }
            await fetchMedicineReminders(token, profileId, { date: referenceDate })
            // Cancel any scheduled notifications for reminders that no longer exist
            const currentIds = new Set(medicineReminders.value.map(r => r.id))
            previousReminderIds.value.forEach((id) => {
                if (!currentIds.has(id)) {
                    cancelReminderNotifications(id)
                }
            })
            await clearNotificationsExcept(Array.from(currentIds))
            previousReminderIds.value = currentIds
            await notifyDueReminders()
        }

        const profileMembers = ref([])
        const activeMemberId = ref(localStorage.getItem('selectedProfileId'))
        const hasActiveProfile = computed(() => Boolean(activeMemberId.value))

        const profileSections = [
            { label: 'Personal information', icon: 'account-outline', action: 'personal' },
            { label: 'Medical Conditions', icon: 'stethoscope', action: 'conditions' },
            { label: 'Drug Allergies', icon: 'pill', action: 'allergies' },
            { label: 'Family History', icon: 'account-group-outline', action: 'family' }
        ]

        const supportSections = [
            { label: 'Notifications', icon: 'bell-outline', action: 'notifications' },
            { label: 'Settings', icon: 'cog-outline', action: 'settings' },
            { label: 'Help Center', icon: 'help-circle-outline', action: 'help' }
        ]

        const recordTypeLabels = {
            PRESCRIPTION: 'Prescription',
            DIAGNOSIS: 'Diagnosis',
            LAB_RESULT: 'Lab Report',
            IMAGING: 'Imaging',
            VACCINATION: 'Vaccination',
            DISCHARGE_SUMMARY: 'Discharge Summary',
            OTHER: 'Other'
        }

        const recordTypeIcons = {
            PRESCRIPTION: 'file-document-edit',
            DIAGNOSIS: 'stethoscope',
            LAB_RESULT: 'flask-outline',
            IMAGING: 'image-multiple',
            VACCINATION: 'needle',
            DISCHARGE_SUMMARY: 'clipboard-text-outline',
            OTHER: 'file-document'
        }

        const getRecordTypeLabel = (type) => {
            return recordTypeLabels[type] || recordTypeLabels.OTHER
        }

        const getRecordIcon = (type) => {
            return recordTypeIcons[type] || recordTypeIcons.OTHER
        }

        const formatRecordDate = (date) => {
            if (!date) return ''
            const parsed = new Date(date)
            if (Number.isNaN(parsed.getTime())) return ''
            return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        }

        const recentMedicalRecords = computed(() => {
            return medicalRecords.value.slice(0, 3)
        })

        const filteredMedicalRecords = computed(() => {
            let list = medicalRecords.value
            if (recordTypeFilter.value !== 'all') {
                list = list.filter(r => r.recordType === recordTypeFilter.value)
            }
            const term = recordSearch.value.trim().toLowerCase()
            if (term) {
                list = list.filter(r =>
                    (r.title || '').toLowerCase().includes(term) ||
                    (getRecordTypeLabel(r.recordType) || '').toLowerCase().includes(term) ||
                    (r.tags || []).some(t => t.toLowerCase().includes(term))
                )
            }
            return list
        })

        const availableTypeFilters = computed(() => {
            const counts = {}
            medicalRecords.value.forEach(r => { counts[r.recordType] = (counts[r.recordType] || 0) + 1 })
            const order = ['LAB_RESULT', 'PRESCRIPTION', 'DIAGNOSIS', 'IMAGING', 'VACCINATION', 'DISCHARGE_SUMMARY', 'OTHER']
            const filters = [{ key: 'all', label: 'All', count: medicalRecords.value.length }]
            order.forEach(type => {
                if (counts[type]) filters.push({ key: type, label: recordTypeLabels[type], count: counts[type] })
            })
            return filters
        })

        const groupedRecords = computed(() => {
            const groups = []
            const map = new Map()
            filteredMedicalRecords.value.forEach(record => {
                const d = record.recordDate ? new Date(record.recordDate) : null
                const key = d && !isNaN(d.getTime())
                    ? d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                    : 'Unknown Date'
                if (!map.has(key)) {
                    const arr = []
                    map.set(key, arr)
                    groups.push({ label: key, records: arr })
                }
                map.get(key).push(record)
            })
            return groups
        })

        const addFamilyMember = () => {
            router.push('/medical-records/profile/add')
        }

        const triggerToast = (message) => {
            toastMessage.value = message
            showToast.value = true
            setTimeout(() => {
                showToast.value = false
            }, 2000)
        }

        const selectProfileMember = (member) => {
            activeMemberId.value = member.id
            localStorage.setItem('selectedProfileId', member.id)
            localStorage.setItem('selectedProfileName', member.name)
            triggerToast(`${member.name} selected`)
            handleTabChange('home')
        }

        const activeProfileName = computed(() => {
            const active = profileMembers.value.find(member => member.id === activeMemberId.value)
            if (active) {
                return active.name
            }
            return localStorage.getItem('selectedProfileName') || ''
        })

        const classifyBloodPressureStatus = (systolic, diastolic) => {
            if (systolic < 120 && diastolic < 80) return 'Normal'
            if (systolic < 130 && diastolic < 80) return 'Elevated'
            return 'High'
        }

        const formatReminderTime = (timeString) => {
            if (!timeString) return '—'
            const [hour, minute] = timeString.split(':')
            const date = new Date()
            date.setHours(Number(hour), Number(minute))
            return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        }

        const toTodayDate = (timeString) => {
            if (!timeString) return null
            const [hour, minute] = timeString.split(':')
            const date = new Date()
            date.setHours(Number(hour) || 0, Number(minute) || 0, 0, 0)
            return Number.isNaN(date.getTime()) ? null : date
        }

        const overdueReminders = computed(() => {
            const now = new Date()
            return medicineReminders.value
                .map((reminder) => {
                    const reminderSlots = reminder.slots && reminder.slots.length
                        ? reminder.slots
                        : [{ time: reminder.time, status: reminder.status }]
                    const overdueSlots = reminderSlots
                        .map((slot, index) => {
                            const rawTime = typeof slot === 'string' ? slot : slot.time
                            if (!rawTime || slot.status === 'taken') return null
                            const slotDate = toTodayDate(rawTime)
                            if (!slotDate || slotDate > now) return null
                            return {
                                id: `${reminder.id}-${rawTime}-${index}-overdue`,
                                label: formatReminderTime(rawTime)
                            }
                        })
                        .filter(Boolean)
                    if (!overdueSlots.length) return null
                    return {
                        id: reminder.id,
                        medicineName: reminder.medicineName,
                        intakeMethod: reminder.intakeMethod,
                        slots: overdueSlots
                    }
                })
                .filter(Boolean)
        })

        const resetNotifiedIfNewDay = () => {
            const todayKey = new Date().toISOString().slice(0, 10)
            if (notifiedDateKey.value !== todayKey) {
                notifiedDateKey.value = todayKey
                notifiedSlotsToday.value = new Set()
            }
            return todayKey
        }

        const notifyDueReminders = async() => {
            const todayKey = resetNotifiedIfNewDay()
            const now = new Date()
            const dueSlots = []

            medicineReminders.value.forEach((reminder) => {
                const reminderSlots = reminder.slots && reminder.slots.length
                    ? reminder.slots
                    : [{ time: reminder.time, status: reminder.status }]

                reminderSlots.forEach((slot, index) => {
                    const rawTime = typeof slot === 'string' ? slot : slot.time
                    if (!rawTime) return
                    const status = slot.status || null
                    if (status === 'taken') return
                    const slotDate = toTodayDate(rawTime)
                    if (!slotDate || slotDate > now) return
                    const key = `${reminder.id}-${rawTime}-${todayKey}`
                    if (notifiedSlotsToday.value.has(key)) return
                    dueSlots.push({ reminder, rawTime, index, key })
                })
            })

            for (const item of dueSlots) {
                const ok = await triggerImmediateReminderNotification({
                    id: item.reminder.id,
                    medicineName: item.reminder.medicineName,
                    intakeMethod: item.reminder.intakeMethod,
                    time: item.rawTime,
                    slotLabel: formatReminderTime(item.rawTime)
                }, item.index)
                if (ok) {
                    notifiedSlotsToday.value.add(item.key)
                }
            }
        }

        const todaysReminders = computed(() => {
            const remindersList = medicineReminders.value.map((reminder) => {
                const reminderSlots = reminder.slots && reminder.slots.length
                    ? reminder.slots
                    : [{ time: reminder.time, status: reminder.status }]
                const slots = reminderSlots
                    .map((slot, index) => {
                        const rawTime = typeof slot === 'string' ? slot : slot.time
                        if (!rawTime) return null
                        return {
                            id: `${reminder.id}-${rawTime}-${index}`,
                            reminderId: reminder.id,
                            rawTime,
                            status: slot.status || null,
                            label: formatReminderTime(rawTime)
                        }
                    })
                    .filter(Boolean)
                    .slice(0, 3)
                return {
                    id: reminder.id,
                    medicineName: reminder.medicineName,
                    frequency: reminder.frequency,
                    intakeMethod: reminder.intakeMethod,
                    dosage: reminder.dosage,
                    unit: reminder.unit,
                    slots
                }
            })
            return remindersList.slice(0, 3)
        })

        const frequencyMap = {
            'Once daily': 1,
            'Twice daily': 2,
            'Thrice daily': 3,
            'Weekly': 1
        }

        const formatFrequency = (reminder) => {
            if (reminder.slots && reminder.slots.length) {
                return `${reminder.slots.length}x`
            }
            const mapped = frequencyMap[reminder.frequency]
            if (mapped) {
                return `${mapped}x`
            }
            const durationMatch = reminder.frequency?.match?.(/(\d+)/)
            if (durationMatch) {
                return `${durationMatch[1]}x`
            }
            return reminder.frequency || ''
        }

        const toggleHomeReminder = async(reminder, reminderSlot) => {
            const token = localStorage.getItem('token')
            if (!token) return
            const newStatus = reminderSlot.status === 'taken' ? 'pending' : 'taken'
            try {
                await setMedicineReminderStatus(token, reminderSlot.reminderId, newStatus, new Date(), reminderSlot.rawTime)
                const target = medicineReminders.value.find(r => r.id === reminderSlot.reminderId)
                if (target?.slots) {
                    const targetSlot = target.slots.find(slot => slot.time === reminderSlot.rawTime)
                    if (targetSlot) {
                        targetSlot.status = newStatus === 'pending' ? null : newStatus
                    }
                }
                reminderSlot.status = newStatus === 'pending' ? null : newStatus
                if (newStatus === 'taken') {
                    await cancelReminderNotifications(reminderSlot.reminderId)
                    const targetReminder = medicineReminders.value.find(r => r.id === reminderSlot.reminderId)
                    if (targetReminder) {
                        const tomorrow = new Date()
                        tomorrow.setDate(tomorrow.getDate() + 1)
                        await scheduleReminderNotifications({
                            ...targetReminder,
                            startDate: tomorrow.toISOString(),
                        })
                    }
                }
            } catch (err) {
                console.error(err)
            }
        }

        const bpDisplayRecords = computed(() => {
            return bpRecords.value.map(record => ({
                id: record.id,
                systolic: record.systolic || record.valueNumber,
                diastolic: record.diastolic || 0,
                recordedAt: record.recordedAt
            }))
        })

        const bpLatest = computed(() => {
            if (bpDisplayRecords.value.length === 0) return null
            const latest = bpDisplayRecords.value[bpDisplayRecords.value.length - 1]
            const systolic = latest.systolic || latest.valueNumber || 0
            const diastolic = latest.diastolic || 0
            return {
                systolic,
                diastolic,
                status: classifyBloodPressureStatus(systolic, diastolic)
            }
        })

        const bpChartData = computed(() => {
            const recent = bpDisplayRecords.value.slice(-7)
            if (!recent.length) {
                return []
            }
            const systolics = recent.map(entry => entry.systolic || entry.valueNumber || 0)
            const diastolics = recent.map(entry => entry.diastolic || 0)
            const max = Math.max(...systolics)
            const min = Math.min(...diastolics)
            const range = (max - min) || 1
            return recent.map((record, index) => {
                const systolic = systolics[index]
                const diastolic = diastolics[index]
                const label = new Date(record.recordedAt || record.date).toLocaleDateString(undefined, { weekday: 'short' })
                const topOffset = ((max - systolic) / range) * 70
                const bottomOffset = ((max - diastolic) / range) * 70
                return {
                    id: record.id,
                    label,
                    rangeHeight: `${Math.max(bottomOffset - topOffset, 6)}%`,
                    topOffset: `${topOffset}%`
                }
            })
        })

        const bsLatest = computed(() => {
            if (bsRecords.value.length === 0) return null
            const latest = bsRecords.value[bsRecords.value.length - 1]
            return {
                value: latest.valueNumber,
                type: latest.chartGroup || 'Fasting',
                recordedAt: latest.recordedAt
            }
        })

        const classifyBloodSugarStatusLabel = (value, context = '') => {
            const ctx = context.toLowerCase()
            if (ctx.includes('after')) {
                if (value < 140) return 'Normal'
                if (value < 200) return 'Elevated'
                return 'High'
            }
            if (value < 100) return 'Normal'
            if (value < 126) return 'Elevated'
            return 'High'
        }

        const bsStatusLabel = computed(() => {
            if (!bsLatest.value) return ''
            const value = Number(bsLatest.value.value)
            if (Number.isNaN(value)) return ''
            return classifyBloodSugarStatusLabel(value, bsLatest.value.type || '')
        })

        const bsChartPoints = computed(() => {
            const values = bsRecords.value.slice(-7)
            if (!values.length) return []
            const numbers = values.map(entry => Number(entry.valueNumber) || 0)
            const max = Math.max(...numbers)
            const min = Math.min(...numbers)
            const range = (max - min) || 1
            const width = 280
            const height = 120
            const step = numbers.length > 1 ? width / (numbers.length - 1) : 0
            return numbers.map((value, index) => {
                const x = numbers.length === 1 ? width / 2 : index * step
                const normalized = (value - min) / range
                const y = height - (normalized * height)
                return {
                    x,
                    y,
                    label: new Date(values[index].recordedAt).toLocaleDateString(undefined, { weekday: 'short' })
                }
            })
        })

        const bsChartPath = computed(() => {
            const points = bsChartPoints.value
            if (!points.length) return ''
            return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
        })

        const bodyWeightLatest = computed(() => {
            if (bodyWeightRecords.value.length === 0) return null
            const latest = bodyWeightRecords.value[bodyWeightRecords.value.length - 1]
            const previous = bodyWeightRecords.value[bodyWeightRecords.value.length - 2]
            const weight = latest.valueNumber
            const change = previous ? +(weight - previous.valueNumber).toFixed(1) : 0
            return { weight, change }
        })

        const latestIllness = computed(() => {
            if (!illnessRecords.value.length) return null
            return illnessRecords.value[0]
        })

        const activeIllness = computed(() => {
            return illnessRecords.value.find(r => r.status?.toUpperCase() === 'ACTIVE' || r.status?.toUpperCase() === 'RECOVERING') || null
        })

        // sparkline helper: returns SVG polyline points string from an array of numbers
        const buildHealthSparkline = (values, w = 100, h = 28) => {
            if (values.length < 2) return ''
            const min = Math.min(...values)
            const max = Math.max(...values)
            const range = max - min || 1
            const pad = 2
            return values.map((v, i) => {
                const x = pad + (i / (values.length - 1)) * (w - pad * 2)
                const y = h - pad - ((v - min) / range) * (h - pad * 2)
                return `${x.toFixed(1)},${y.toFixed(1)}`
            }).join(' ')
        }

        const bpSparklinePoints = computed(() => {
            const vals = bpDisplayRecords.value.slice(-7).map(r => r.systolic || r.valueNumber || 0)
            return buildHealthSparkline(vals)
        })

        const bsSparklinePoints = computed(() => {
            const vals = bsRecords.value.slice(-7).map(r => Number(r.valueNumber) || 0)
            return buildHealthSparkline(vals)
        })

        const bwSparklinePoints = computed(() => {
            const vals = bodyWeightRecords.value.slice(-7).map(r => Number(r.valueNumber) || 0)
            return buildHealthSparkline(vals)
        })

        const timeAgo = (dateStr) => {
            if (!dateStr) return null
            const diff = Date.now() - new Date(dateStr).getTime()
            const days = Math.floor(diff / 86400000)
            if (days === 0) return 'Today'
            if (days === 1) return 'Yesterday'
            if (days < 7) return `${days}d ago`
            if (days < 30) return `${Math.floor(days / 7)}w ago`
            return `${Math.floor(days / 30)}mo ago`
        }

        const bpLastDate = computed(() => {
            const r = bpDisplayRecords.value[bpDisplayRecords.value.length - 1]
            return r ? timeAgo(r.recordedAt || r.date) : null
        })

        const bsLastDate = computed(() => {
            const r = bsRecords.value[bsRecords.value.length - 1]
            return r ? timeAgo(r.recordedAt) : null
        })

        const bwLastDate = computed(() => {
            const r = bodyWeightRecords.value[bodyWeightRecords.value.length - 1]
            return r ? timeAgo(r.recordedAt) : null
        })

        const todayMedsTotal = computed(() => {
            return todaysReminders.value.reduce((sum, r) => sum + (r.slots?.length || 0), 0)
        })

        const todayMedsTaken = computed(() => {
            return todaysReminders.value.reduce((sum, r) => {
                return sum + (r.slots?.filter(s => s.status === 'taken').length || 0)
            }, 0)
        })

        const profilesComposable = useProfiles()
        const loadProfiles = async () => {
            const token = localStorage.getItem('token')
            if (!token) {
                profileMembers.value = []
                activeMemberId.value = null
                localStorage.removeItem('selectedProfileId')
                localStorage.removeItem('selectedProfileName')
                return
            }
            const { response, error } = await profilesComposable.fetchProfiles(token)
            if (error.value === null && response.value?.profiles) {
                profileMembers.value = response.value.profiles.map(profile => ({
                    id: profile.id,
                    name: profile.displayName || 'Profile'
                }))
                if (profileMembers.value.length > 0) {
                    const savedId = localStorage.getItem('selectedProfileId')
                    const match = profileMembers.value.find(member => member.id === savedId)
                    if (match) {
                        activeMemberId.value = match.id
                    } else {
                        activeMemberId.value = profileMembers.value[0].id
                        localStorage.setItem('selectedProfileId', activeMemberId.value)
                        localStorage.setItem('selectedProfileName', profileMembers.value[0].name)
                    }
                } else {
                    activeMemberId.value = null
                    localStorage.removeItem('selectedProfileId')
                    localStorage.removeItem('selectedProfileName')
                }
            }
        }

        onMounted(() => {
            loadProfiles()
            if (!activeMemberId.value) {
                activeTab.value = 'profile'
                showProfilePrompt.value = true
            }
        })

        watch(activeTab, (val) => {
            if (val === 'profile' && profileMembers.value.length === 0) {
                loadProfiles()
            }
        })

        watch(
            () => route.query.tab,
            (val) => {
                if (typeof val === 'string') {
                    activeTab.value = val
                } else if (!val) {
                    activeTab.value = 'home'
                }
            }
        )

        watch(activeMemberId, (id) => {
            if (id) {
                loadHealthData(id)
                loadMedicalRecords(id)
                loadMedicineReminders(id)
                showProfilePrompt.value = false
            } else {
                bpRecords.value = []
                bsRecords.value = []
                bodyWeightRecords.value = []
                illnessRecords.value = []
                medicalRecords.value = []
                medicalRecordsError.value = null
                medicineReminders.value = []
                showProfilePrompt.value = true
                activeTab.value = 'profile'
            }
        }, { immediate: true })

        watch(medicineReminders, () => {
            notifyDueReminders()
        })

        const navigateProfileSection = (section) => {
            if (section === 'personal') {
                router.push({
                    path: '/medical-records/profile/personal-information',
                    query: {
                        profileId: activeMemberId.value
                    }
                })
            } else {
                console.log('Navigate to', section)
            }
        }

        return {
            router,
            activeTab,
            handleTabChange,
            getTabTitle,
            navigateToAddRecord,
            navigateToMedicineReminder,
            openRecordDetail,
            medicalRecords,
            medicalRecordsLoading,
            medicalRecordsError,
            recentMedicalRecords,
            getRecordTypeLabel,
            getRecordIcon,
            formatRecordDate,
            recordSearch,
            recordTypeFilter,
            filteredMedicalRecords,
            availableTypeFilters,
            groupedRecords,
            getRecordTypeColor,
            weekDays,
            bpChartData,
            showProfilePrompt,
            showHealthModal,
            selectedCategory,
            healthCategories,
            selectHealthCategory,
            navigateToBloodPressure,
            navigateToBloodSugar,
            navigateToBodyWeight,
            navigateToIllness,
            profileMembers,
            profileSections,
            supportSections,
            activeMemberId,
            addFamilyMember,
            navigateProfileSection,
            selectProfileMember,
            activeProfileName,
            loadProfiles,
            goProfileTab,
            goAddProfile,
            handleNotificationBell,
            showNotificationsPanel,
            showProfileSwitcher,
            showToast,
            toastMessage,
            notifyDueReminders,
            overdueReminders,
            bpLatest,
            bsLatest,
            bsStatusLabel,
            bsChartPoints,
            bsChartPath,
            bodyWeightLatest,
            illnessRecords,
            latestIllness,
            activeIllness,
            medicineReminders,
            remindersLoading,
            todaysReminders,
            formatFrequency,
            toggleHomeReminder,
            hasActiveProfile,
            bpSparklinePoints,
            bsSparklinePoints,
            bwSparklinePoints,
            bpLastDate,
            bsLastDate,
            bwLastDate,
            todayMedsTotal,
            todayMedsTaken,
        }
    }
}

</script>

<style scoped>
.medical-records-container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    height: 100dvh;
    background: radial-gradient(circle at 20% 20%, rgba(79,70,229,0.15), transparent 40%),
                radial-gradient(circle at 80% 10%, rgba(14,165,233,0.18), transparent 35%),
                radial-gradient(circle at 50% 100%, rgba(34,197,94,0.12), transparent 40%),
                var(--bg-main);
    position: relative;
    overflow: hidden;
}

.bg-orb {
    position: absolute;
    filter: blur(60px);
    opacity: 0.28;
    z-index: 0;
}
.orb-1 {
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4f46e5, #06b6d4);
    top: -140px;
    left: -110px;
}
.orb-2 {
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: linear-gradient(135deg, #22c55e, #8b5cf6);
    bottom: -110px;
    right: -100px;
}

.action-icon {
    cursor: pointer;
    color: var(--accent-1);
    transition: all 0.2s ease;
    padding: 8px;
    border-radius: 12px;
    background: linear-gradient(145deg, rgba(103,232,249,0.25), rgba(168,85,247,0.3));
    border: 1px solid var(--glass-card-border);
    box-shadow: 0 6px 14px rgba(0,0,0,0.12);
    color: var(--text-primary);
}

.action-icon:active {
    background: linear-gradient(145deg, rgba(103,232,249,0.35), rgba(168,85,247,0.4));
    transform: scale(0.95);
}

.top-bar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.notification-overlay {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 80px 16px 16px;
    pointer-events: none;
}

.notification-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(10px);
    pointer-events: auto;
}

.notification-panel {
    position: relative;
    width: 100%;
    max-width: 480px;
    max-height: 70vh;
    overflow: hidden;
    pointer-events: auto;
    z-index: 1;
    padding: 16px;
    background: rgba(12, 15, 30, 0.9);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 18px 40px rgba(0,0,0,0.45);
    color: var(--text-primary);
}

.notification-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.notification-header h4,
.notification-header .label {
    margin: 0;
    color: var(--text-primary);
}

.notification-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 4px;
}

.notification-item {
    border: 1px solid rgba(255,255,255,0.08);
    padding: 14px;
    border-radius: 14px;
    background: rgba(255,255,255,0.06);
}

.notif-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.notif-title {
    margin: 0;
    font-weight: 700;
    color: var(--text-primary);
}

.notif-sub {
    margin: 0;
    font-size: 13px;
    color: var(--text-secondary);
}

.notif-slots {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}

.notif-slot {
    padding: 6px 10px;
    border-radius: 10px;
    border: 1px solid rgba(103,232,249,0.35);
    background: rgba(103,232,249,0.08);
    color: #67e8f9;
    font-weight: 700;
    font-size: 13px;
}

.notif-slot.overdue {
    border-color: rgba(248,113,113,0.5);
    background: rgba(248,113,113,0.12);
    color: #fca5a5;
}

.notification-empty {
    padding: 12px;
    color: var(--text-secondary);
}

.content-wrapper {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 18px 0 96px;
    position: relative;
    z-index: 1;
}

.tab-content {
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideFadeUp {
    from {
        opacity: 0;
        transform: translateY(16px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes floatPulse {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
}

/* ── Home Tab ─────────────────────────────────────────────────────────────── */
.home-tab {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 16px;
}

/* Active illness alert */
.home-alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 13px;
    background: rgba(251,191,36,0.1);
    border: 1px solid rgba(251,191,36,0.3);
    cursor: pointer;
    transition: background 0.15s;
}
.home-alert:active { background: rgba(251,191,36,0.15); }
.home-alert-icon  { color: #fbbf24; flex-shrink: 0; }
.home-alert-arrow { color: var(--text-muted); flex-shrink: 0; }
.home-alert-body  { flex: 1; }
.home-alert-title { margin: 0; font-size: 13px; font-weight: 800; color: var(--text-primary); }
.home-alert-sub   { margin: 1px 0 0; font-size: 11px; color: var(--text-muted); }

/* Medications card */
.home-meds-card {
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 12px 28px rgba(0,0,0,0.3);
    display: flex;
    flex-direction: column;
    gap: 0;
}
.home-meds-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.hmc-left  { display: flex; align-items: center; gap: 10px; }
.hmc-icon  { width: 36px; height: 36px; border-radius: 10px; background: rgba(167,139,250,0.15); color: #a78bfa; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.hmc-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0; }
.hmc-sub   { font-size: 12px; color: var(--text-muted); margin: 1px 0 0; }
.hmc-pct-block { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.hmc-pct { font-size: 13px; font-weight: 800; color: var(--text-secondary); margin: 0; }
.hmc-bar-track { width: 56px; height: 4px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden; }
.hmc-bar-fill  { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #a78bfa, #38bdf8); transition: width 0.4s ease; }

.home-reminder-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 9px 0;
    border-top: 1px solid rgba(255,255,255,0.06);
}
.hri-left  { flex: 1; min-width: 0; }
.hri-name  { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hri-detail { font-size: 11px; color: var(--text-muted); margin: 2px 0 0; }
.hri-slots { display: flex; flex-wrap: wrap; gap: 6px; flex-shrink: 0; }
.hri-slot-pill {
    border: 1px solid rgba(103,232,249,0.3);
    background: rgba(103,232,249,0.08);
    color: #67e8f9;
    border-radius: 999px;
    padding: 5px 10px;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.15s;
    cursor: pointer;
}
.hri-slot-pill.taken {
    background: linear-gradient(135deg, rgba(34,197,94,0.25), rgba(16,185,129,0.2));
    border-color: rgba(34,197,94,0.4);
    color: #4ade80;
}
.hri-slot-pill.missed {
    background: rgba(239,68,68,0.1);
    border-color: rgba(239,68,68,0.3);
    color: #f87171;
}
.hri-icon { font-size: 11px; }
.home-meds-empty { display: flex; align-items: center; justify-content: space-between; padding: 10px 0 0; border-top: 1px solid rgba(255,255,255,0.06); }
.home-meds-empty p { font-size: 13px; color: var(--text-muted); margin: 0; }
.hme-btn { background: rgba(167,139,250,0.15); border: 1px solid rgba(167,139,250,0.25); color: #c4b5fd; border-radius: 10px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer; }
.home-meds-loading { font-size: 13px; color: var(--text-muted); padding: 4px 0; }

/* Vitals strip */
.vitals-strip {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
}
.vital-chip {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 11px 10px;
    cursor: pointer;
    transition: background 0.15s;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.vital-chip:active { background: rgba(255,255,255,0.09); }
.vchip-top { display: flex; align-items: center; gap: 5px; margin-bottom: 2px; }
.vchip-icon { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.vci-red   { background: rgba(248,113,113,0.18); color: #f87171; }
.vci-amber { background: rgba(251,191,36,0.18);  color: #fbbf24; }
.vci-blue  { background: rgba(96,165,250,0.18);  color: #60a5fa; }
.vchip-label { font-size: 9px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; }
.vchip-val   { font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1.1; }
.vchip-unit  { font-size: 10px; font-weight: 400; color: var(--text-muted); }
.vchip-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 700;
    border: 1px solid transparent;
    align-self: flex-start;
}

/* Vital badge classes (shared with health tab) */
.vb-normal   { background: rgba(34,197,94,0.12);  color: #4ade80; border-color: rgba(34,197,94,0.25);  }
.vb-elevated { background: rgba(251,191,36,0.12); color: #fbbf24; border-color: rgba(251,191,36,0.3);  }
.vb-high     { background: rgba(239,68,68,0.12);  color: #f87171; border-color: rgba(239,68,68,0.25);  }
.vb-stage-1  { background: rgba(249,115,22,0.12); color: #fb923c; border-color: rgba(249,115,22,0.25); }
.vb-stage-2  { background: rgba(239,68,68,0.12);  color: #f87171; border-color: rgba(239,68,68,0.25);  }
.vb-up       { background: rgba(248,113,113,0.12); color: #f87171; border-color: rgba(248,113,113,0.25); }
.vb-down     { background: rgba(34,197,94,0.12);  color: #4ade80; border-color: rgba(34,197,94,0.25);  }
.vb-stable   { background: rgba(255,255,255,0.06); color: var(--text-muted); border-color: rgba(255,255,255,0.1); }

/* Quick actions row */
.quick-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
}
.quick-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 12px 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    transition: background 0.15s;
    color: var(--text-primary);
    font-size: 11px;
    font-weight: 700;
}
.quick-btn:active { background: rgba(255,255,255,0.09); transform: scale(0.97); }
.qb-icon {
    width: 42px; height: 42px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
}
.qb-record  { background: linear-gradient(135deg, #6f7efc, #9b57f4); box-shadow: 0 6px 14px rgba(111,126,252,0.3); }
.qb-reminder { background: linear-gradient(135deg, #f59e0b, #ef4444); box-shadow: 0 6px 14px rgba(245,158,11,0.3); }
.qb-ai      { background: linear-gradient(135deg, #a78bfa, #38bdf8); box-shadow: 0 6px 14px rgba(167,139,250,0.3); }

/* Home section header */
.home-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2px;
}
.home-section-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
}

/* Section Header */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    padding: 0 16px;
}

.section-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -0.2px;
}

.see-all-link {
    font-size: 13px;
    color: #67e8f9;
    text-decoration: none;
    font-weight: 600;
}

/* Reminder List */
.reminder-list {
    background: rgba(255,255,255,0.04);
    border-top: 1px solid rgba(255,255,255,0.08);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    border-left: none;
    border-right: none;
    border-radius: 0;
    padding: 6px 0;
    margin-bottom: 28px;
    box-shadow: none;
    animation: slideFadeUp 0.55s ease both;
}

.reminder-empty {
    text-align: center;
    padding: 18px 16px;
    color: var(--text-muted);
    font-size: 13px;
}

.reminder-item {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(148,163,184,0.15);
}

.reminder-item:last-child {
    border-bottom: none;
}

.reminder-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.reminder-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
}

.reminder-details {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0;
}

.reminder-slot-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.reminder-slot-pill {
    border: 1px solid var(--glass-card-border);
    background: linear-gradient(145deg, rgba(103,232,249,0.25), rgba(168,85,247,0.3));
    color: var(--accent-1);
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 6px 14px rgba(0,0,0,0.12);
}

.reminder-slot-pill.checked {
    background: linear-gradient(135deg, var(--accent-2), var(--accent-4));
    border-color: transparent;
    color: #0b1020;
}

.reminder-slot-pill .slot-icon {
    font-size: 14px;
}

/* Records */
.records-list {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.records-loading {
    padding: 16px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
}

.records-loading.large {
    padding: 40px 16px;
}

.records-error {
    color: #f87171;
    text-align: center;
    font-size: 14px;
    margin-top: 12px;
}

.empty-state.small {
    padding: 20px 12px;
}

.record-item {
    background: rgba(255,255,255,0.05);
    border-radius: 0;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-top: 1px solid rgba(255,255,255,0.08);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    border-left: none;
    border-right: none;
    cursor: pointer;
    transition: all 0.25s ease;
    animation: slideFadeUp 0.5s ease both;
}

.records-list .record-item:nth-child(2) { animation-delay: 0.05s; }
.records-list .record-item:nth-child(3) { animation-delay: 0.1s; }

.record-item:active {
    transform: translateY(1px) scale(0.99);
}

.record-icon {
    width: 46px;
    height: 46px;
    background: linear-gradient(145deg, rgba(103,232,249,0.25), rgba(168,85,247,0.3));
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent-1);
    flex-shrink: 0;
    border: 1px solid var(--glass-card-border);
    box-shadow: 0 6px 14px rgba(0,0,0,0.12);
}

.record-content {
    flex: 1;
}

.record-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 2px 0;
}

.record-type {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0;
}

.record-arrow {
    color: var(--text-muted);
    flex-shrink: 0;
}

.records-list-view {
    display: flex;
    flex-direction: column;
    gap: 0;
    position: relative;
    padding-bottom: 88px;
}

.records-search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-shadow: none;
}

.records-search input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-size: 14px;
}

.records-search .clear-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    padding: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.record-card {
    background: rgba(255,255,255,0.05);
    border-radius: 0;
    padding: 14px 16px;
    border-top: 1px solid rgba(255,255,255,0.08);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    border-left: none;
    border-right: none;
    cursor: pointer;
    transition: all 0.25s ease;
    display: flex;
    align-items: center;
    gap: 12px;
}

.record-card:hover {
    background: rgba(103,232,249,0.06);
}

.record-icon-large {
    width: 46px;
    height: 46px;
    background: linear-gradient(145deg, rgba(103,232,249,0.25), rgba(168,85,247,0.3));
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent-1);
    flex-shrink: 0;
    border: 1px solid var(--glass-card-border);
    box-shadow: 0 6px 14px rgba(0,0,0,0.12);
}

.record-info {
    flex: 1;
    min-width: 0;
}

.record-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
}

.record-meta {
    font-size: 12px;
    color: var(--text-muted);
    margin: 2px 0 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.record-chevron {
    color: var(--text-muted);
    flex-shrink: 0;
}

/* Type filter chips */
.type-filter-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: 8px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
}
.type-filter-scroll::-webkit-scrollbar { display: none; }
.type-filter-row {
    display: flex;
    gap: 7px;
    width: max-content;
}
.type-filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid var(--glass-card-border);
    background: transparent;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
}
.type-filter-chip.active {
    background: rgba(167,139,250,0.18);
    border-color: rgba(167,139,250,0.45);
    color: #a78bfa;
}
.tfc-count {
    font-size: 11px;
    font-weight: 700;
    background: rgba(255,255,255,0.08);
    padding: 1px 5px;
    border-radius: 999px;
}
.type-filter-chip.active .tfc-count {
    background: rgba(167,139,250,0.25);
}

/* Month group headers */
.rec-group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px 6px;
    background: var(--bg-main);
    position: sticky;
    top: 0;
    z-index: 2;
}
.rec-group-label {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-muted);
}
.rec-group-count {
    font-size: 11px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 999px;
    background: rgba(255,255,255,0.07);
    color: var(--text-muted);
}

/* Record card title row (title + attachment badge) */
.record-title-row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}
.rec-attach-badge {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    font-size: 10px;
    font-weight: 700;
    color: var(--text-muted);
    background: rgba(255,255,255,0.07);
    padding: 2px 5px;
    border-radius: 999px;
}

/* Tag chips */
.rec-tags {
    display: flex;
    gap: 5px;
    flex-wrap: nowrap;
    overflow: hidden;
    margin-top: 4px;
}
.rec-tag {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 999px;
    background: rgba(255,255,255,0.07);
    color: var(--text-muted);
    white-space: nowrap;
    text-transform: lowercase;
}
.rec-tag-more {
    background: rgba(167,139,250,0.12);
    color: #a78bfa;
}

/* Floating Action Button */
.fab {
    position: fixed;
    bottom: 98px;
    right: 16px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #22d3ee, #a855f7);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 50%;
    box-shadow: 0 16px 40px rgba(34, 211, 238, 0.35);
    color: #0b1020;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 1000;
}

.fab:active {
    transform: scale(0.94);
}

/* Health Metrics */
/* ── Health Tab ────────────────────────────────────────────────────────────── */
.health-tab { display: flex; flex-direction: column; gap: 10px; padding: 0 16px; }

/* Meds progress row */
.health-meds-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 14px;
    padding: 12px 14px;
    cursor: pointer;
}
.hm-left  { display: flex; align-items: center; gap: 10px; }
.hm-icon  { width: 36px; height: 36px; border-radius: 10px; background: rgba(167,139,250,0.15); color: #a78bfa; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.hm-label { font-size: 13px; font-weight: 700; color: var(--text-primary); margin: 0; }
.hm-sub   { font-size: 12px; color: var(--text-muted); margin: 0; }
.hm-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.hm-bar-track { width: 60px; height: 5px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden; }
.hm-bar-fill  { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #a78bfa, #38bdf8); transition: width 0.4s ease; }
.hm-pct     { font-size: 12px; font-weight: 700; color: var(--text-secondary); min-width: 30px; text-align: right; }
.hm-chevron { color: var(--text-muted); }

/* Active illness alert */
.health-alert-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(251,146,60,0.08);
    border: 1px solid rgba(251,146,60,0.3);
    border-radius: 14px;
    padding: 12px 14px;
    cursor: pointer;
}
.ha-icon { color: #fb923c; flex-shrink: 0; }
.ha-body { flex: 1; }
.ha-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0; }
.ha-sub   { font-size: 12px; color: #fb923c; margin: 2px 0 0; }
.ha-chevron { color: var(--text-muted); flex-shrink: 0; }

/* Section label */
.health-section-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin: 4px 0 0;
    padding: 0 2px;
}

/* Vital card */
.vital-card {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 16px;
    padding: 14px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: border-color 0.15s;
}
.vital-card:active { border-color: rgba(167,139,250,0.4); }

.vc-top { display: flex; align-items: center; gap: 10px; }
.vc-icon { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.vc-icon-red    { background: rgba(248,113,113,0.15); color: #f87171; }
.vc-icon-amber  { background: rgba(251,191,36,0.15);  color: #fbbf24; }
.vc-icon-blue   { background: rgba(96,165,250,0.15);  color: #60a5fa; }
.vc-icon-purple { background: rgba(167,139,250,0.15); color: #a78bfa; }
.vc-meta { flex: 1; }
.vc-name { font-size: 13px; font-weight: 700; color: var(--text-primary); margin: 0; }
.vc-date { font-size: 11px; color: var(--text-muted); margin: 1px 0 0; }
.vc-chevron { color: var(--text-muted); flex-shrink: 0; }

.vc-body { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.vc-reading { display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap; }
.vc-value { font-size: 22px; font-weight: 800; color: var(--text-primary); line-height: 1; }
.vc-unit  { font-size: 12px; color: var(--text-muted); }
.vc-spark { width: 80px; height: 28px; flex-shrink: 0; }

/* Vital badges */
.vc-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
    text-transform: capitalize;
    flex-shrink: 0;
}
.vb-normal, .vb-normal-fasting  { background: rgba(34,197,94,0.12);  color: #4ade80; border: 1px solid rgba(34,197,94,0.25); }
.vb-elevated, .vb-elevated-fasting { background: rgba(251,191,36,0.12); color: #fbbf24; border: 1px solid rgba(251,191,36,0.25); }
.vb-high, .vb-high-fasting { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.25); }
.vb-low  { background: rgba(96,165,250,0.12);  color: #60a5fa; border: 1px solid rgba(96,165,250,0.25); }
.vb-up   { background: rgba(34,197,94,0.12);   color: #4ade80; border: 1px solid rgba(34,197,94,0.25); }
.vb-down { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.25); }
.vb-stable { background: rgba(148,163,184,0.1); color: var(--text-muted); border: 1px solid rgba(148,163,184,0.2); }
.vb-active, .vb-recovering { background: rgba(251,146,60,0.12); color: #fb923c; border: 1px solid rgba(251,146,60,0.25); }
.vb-resolved, .vb-recovered { background: rgba(34,197,94,0.12); color: #4ade80; border: 1px solid rgba(34,197,94,0.25); }
.vb-subtle { background: rgba(255,255,255,0.06); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1); }

.vc-empty { font-size: 13px; color: var(--text-muted); margin: 0; }

.vc-illness-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.vc-illness-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }

/* AI CTA */
.health-ai-cta {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(167,139,250,0.07);
    border: 1px solid rgba(167,139,250,0.25);
    border-radius: 14px;
    padding: 14px;
    cursor: pointer;
    margin-top: 4px;
}
.hai-icon { width: 38px; height: 38px; border-radius: 11px; background: rgba(167,139,250,0.15); color: #a78bfa; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.hai-body { flex: 1; }
.hai-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0; }
.hai-sub   { font-size: 12px; color: var(--text-muted); margin: 2px 0 0; }
.hai-chevron { color: var(--text-muted); flex-shrink: 0; }

/* Empty State */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: var(--text-secondary);
}

.empty-icon {
    color: #64748b;
    margin-bottom: 16px;
}

.empty-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 8px 0;
}

.empty-text {
    font-size: 14px;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
    max-width: 280px;
}

/* Profile Tab */
.profile-tab {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.profile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
}

.profile-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
}

.back-btn,
.icon-btn {
    border: 1px solid var(--glass-card-border);
    background: var(--glass-ghost-bg);
    border-radius: 12px;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-primary);
}

.profile-switcher {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    padding: 0 16px 6px;
}

.profile-switcher.empty {
    justify-content: center;
}

.profile-avatar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 72px;
    cursor: pointer;
}

.avatar-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 1px solid var(--glass-card-border);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--glass-ghost-bg);
    color: var(--text-primary);
}

.profile-avatar.active .avatar-circle {
    border-color: var(--accent-2);
    color: var(--accent-2);
    background: var(--glass-ghost-bg);
    background: color-mix(in srgb, var(--accent-2) 12%, transparent);
}

.profile-avatar span {
    font-size: 12px;
    color: var(--text-primary);
}

.profile-avatar.add .avatar-circle {
    border-color: var(--glass-card-border);
    background: var(--glass-ghost-bg);
}

.profile-card {
    background: rgba(255,255,255,0.05);
    border-radius: 0;
    box-shadow: none;
    padding: 6px 0;
    border-top: 1px solid rgba(255,255,255,0.08);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    border-left: none;
    border-right: none;
}

.profile-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(148,163,184,0.12);
    color: var(--text-primary);
}

.profile-row:last-child {
    border-bottom: none;
}

.profile-row .row-left {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
}

/* Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(5, 6, 10, 0.7);
    display: flex;
    align-items: flex-end;
    z-index: 1200;
    animation: fadeIn 0.25s ease;
}

.modal-content {
    background: rgba(10, 12, 20, 0.95);
    border-radius: 22px 22px 0 0;
    width: 100%;
    padding: 22px;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 -6px 30px rgba(0,0,0,0.4);
    animation: slideUp 0.25s ease;
}

@keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
}

.modal-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(148,163,184,0.12);
}

.modal-icon {
    color: #67e8f9;
}

.modal-title {
    font-size: 17px;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
}

.modal-options {
    display: flex;
    flex-direction: column;
}

.modal-option {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 6px;
    cursor: pointer;
    transition: background 0.2s ease;
    border-radius: 12px;
    color: var(--text-primary);
}

.modal-option:active {
    background: rgba(255,255,255,0.05);
}

.option-radio {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255,255,255,0.25);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.option-radio.selected {
    border-color: #67e8f9;
    background: #67e8f9;
}

.radio-dot {
    width: 8px;
    height: 8px;
    background: #0b1020;
    border-radius: 50%;
}

.option-label {
    font-size: 15px;
    color: var(--text-primary);
    font-weight: 500;
}

/* Toast */
.toast-notification {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #22d3ee, #a855f7);
    color: #0b1020;
    padding: 14px 18px;
    border-radius: 18px;
    font-size: 13px;
    z-index: 1500;
    box-shadow: 0 18px 36px rgba(168,85,247,0.35);
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 280px;
    border: 1px solid rgba(255,255,255,0.16);
}

.toast-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(255,255,255,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
}

.toast-text {
    flex: 1;
}

.toast-title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
}

.toast-message {
    margin: 2px 0 0;
    font-size: 12px;
    color: rgba(11,16,32,0.8);
}

/* Profile prompt sheet */
.overlay {
    position: fixed;
    inset: 0;
    background: rgba(5, 6, 10, 0.75);
    display: grid;
    place-items: center;
    padding: 16px;
    z-index: 1300;
}

.sheet {
    width: 100%;
    max-width: 480px;
    background: rgba(10,12,20,0.95);
    border-radius: 18px;
    padding: 16px;
    box-shadow: 0 18px 36px rgba(0,0,0,0.35);
    border: 1px solid rgba(255,255,255,0.08);
    color: var(--text-primary);
}

.confirm-sheet {
    border: 1px solid rgba(103,232,249,0.25);
}

.sheet-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

/* Profile Switcher Sheet */
.profile-switcher-sheet .modal-header {
    display: flex;
    align-items: center;
    gap: 10px;
}

.sheet-close {
    margin-left: auto;
    padding: 6px;
}

.icon-btn.ghost {
    background: transparent;
    border: none;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
}

.switcher-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.switcher-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 10px;
    border-radius: 14px;
    cursor: pointer;
    transition: background 0.2s ease;
    color: var(--text-primary);
}

.switcher-item:active {
    background: rgba(255,255,255,0.06);
}

.switcher-item.active {
    background: rgba(103,232,249,0.08);
}

.switcher-avatar {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    border: 1px solid var(--glass-card-border);
    background: var(--glass-ghost-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-primary);
    flex-shrink: 0;
}

.switcher-item.active .switcher-avatar {
    border-color: #67e8f9;
    color: #67e8f9;
    background: rgba(103,232,249,0.1);
}

.switcher-avatar.add {
    border-style: dashed;
    color: var(--text-muted);
}

.switcher-name {
    flex: 1;
    font-size: 15px;
    font-weight: 600;
}

.switcher-item.active .switcher-name {
    color: #67e8f9;
}

.switcher-check {
    color: #67e8f9;
    flex-shrink: 0;
}

.add-profile .switcher-name {
    color: var(--text-muted);
    font-weight: 500;
}
</style>
