<template>
<div class="medical-records-container">
    <!-- Side Navigation -->
    <SideNav 
        :active-tab="activeTab"
        @change-tab="handleTabChange"
        @go-back="router.push('/')"
    />

    <!-- Main Content Area -->
    <div class="main-content">
        <div class="medical-orb orb-1"></div>
        <div class="medical-orb orb-2"></div>
        <!-- Top Bar -->
        <TopBar 
            :title="getTabTitle()"
            :show-back="false"
        >
            <template #actions>
                <div 
                    v-if="profileChipName" 
                    class="toolbar-profile-chip"
                >
                    <span class="toolbar-profile-avatar">
                        <mdicon name="account-circle" :size="24"/>
                    </span>
                    <span class="toolbar-profile-name">{{ profileChipName }}</span>
                </div>
                <mdicon 
                    v-if="activeTab === 'records'"
                    name="magnify" 
                    :size="24" 
                    class="action-icon"
                />
                <mdicon 
                    name="bell-outline" 
                    :size="24" 
                    class="action-icon"
                />
                <mdicon 
                    name="cog-outline" 
                    :size="24" 
                    class="action-icon"
                />
            </template>
        </TopBar>

        <!-- Content Wrapper -->
        <div class="content-wrapper">
            <!-- Home Tab -->
            <div v-if="activeTab === 'home'" class="tab-content home-tab">
                <div class="home-actions">
                    <div class="action-card home" @click="navigateToAddRecord">
                        <mdicon name="clipboard-plus" :size="40" class="action-icon-primary"/>
                        <div>
                            <h4>Add medical record</h4>
                            <p>Create a new entry</p>
                        </div>
                    </div>
                    <div class="action-card home" @click="navigateToMedicineReminder">
                        <mdicon name="pill" :size="40" class="action-icon-primary"/>
                        <div>
                            <h4>Add medicine reminder</h4>
                            <p>Set up dosage alerts</p>
                        </div>
                    </div>
                </div>

                <div class="home-quick-links">
                    <div class="quick-link-card" @click="router.push({ path: '/medical-records/web/insights' })">
                        <mdicon name="brain" :size="22" class="ql-icon ai-ql"/>
                        <span>AI Insights</span>
                        <mdicon name="chevron-right" :size="16" class="ql-arrow"/>
                    </div>
                    <div class="quick-link-card" @click="router.push({ path: '/medical-records/web/medications', query: { profileId: activeProfileId, profileName: profileChipName } })">
                        <mdicon name="pill" :size="22" class="ql-icon pill-ql"/>
                        <span>Medications</span>
                        <mdicon name="chevron-right" :size="16" class="ql-arrow"/>
                    </div>
                    <div class="quick-link-card" @click="router.push({ path: '/medical-records/web/lab-results', query: { profileId: activeProfileId, profileName: profileChipName } })">
                        <mdicon name="test-tube" :size="22" class="ql-icon lab-ql"/>
                        <span>Lab Results</span>
                        <mdicon name="chevron-right" :size="16" class="ql-arrow"/>
                    </div>
                </div>

                <section class="home-section">
                    <div class="home-section-header">
                        <h3>Today's Reminders</h3>
                        <button class="link-button" @click="router.push('/medical-records/medicine-reminders/history')">
                            View history
                        </button>
                    </div>
                    <div class="home-reminders">
                        <p v-if="!activeProfileId" class="home-empty">
                            Select or add a profile to view reminders.
                        </p>
                        <p v-else-if="remindersLoading" class="home-empty">Loading reminders...</p>
                        <template v-else>
                            <div 
                                class="reminder-card" 
                                v-for="reminder in todaysReminders" 
                                :key="reminder.id"
                            >
                                <div class="reminder-card-header">
                                    <h4>{{ reminder.medicineName }}</h4>
                                    <span class="reminder-frequency">{{ formatFrequency(reminder) }}</span>
                                </div>
                                <p class="reminder-meta">
                                    {{ reminder.intakeMethod || 'Anytime' }}
                                </p>
                                <div class="reminder-slots" v-if="reminder.slots.length">
                                    <button 
                                        class="slot-chip" 
                                        v-for="slot in reminder.slots" 
                                        :key="slot.id"
                                        :class="{ checked: slot.status === 'taken', missed: slot.status === 'missed' }"
                                        @click="toggleHomeReminder(reminder, slot)"
                                    >
                                        {{ slot.label }}
                                        <span class="slot-status" v-if="slot.status">
                                            {{ slot.status === 'taken' ? '☑︎' : '✖︎' }}
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <p v-if="!todaysReminders.length" class="home-empty">
                                No reminders scheduled for today.
                            </p>
                        </template>
                        <p v-if="remindersError" class="records-error">
                            {{ remindersError.message || 'Unable to load reminders.' }}
                        </p>
                    </div>
                </section>

                <section class="home-section">
                    <div class="home-section-header">
                        <h3>Recent medical records</h3>
                        <button class="link-button" @click="handleTabChange('records')">
                            View all
                        </button>
                    </div>
                    <div v-if="medicalRecordsLoading" class="records-loading">
                        <mdicon name="loading" :size="32" class="spin"/>
                        <p>Loading recent records...</p>
                    </div>
                    <div v-else-if="recentRecords.length" class="home-records">
                        <div 
                            class="home-record-card" 
                            v-for="record in recentRecords" 
                            :key="record.id"
                            @click="openRecordDetail(record.id)"
                        >
                            <div class="home-record-icon">
                                <mdicon :name="record.icon" :size="24"/>
                            </div>
                            <div class="home-record-info">
                                <h4>{{ record.title }}</h4>
                                <p>{{ record.date }} · {{ record.typeLabel }}</p>
                            </div>
                            <mdicon name="chevron-right" :size="18" class="home-record-chevron"/>
                        </div>
                    </div>
                    <p v-else class="home-empty">No medical records yet.</p>
                </section>
            </div>

            <!-- Records Tab -->
            <div v-if="activeTab === 'records'" class="tab-content">
                <div class="records-header">
                    <h3 class="records-title">All Medical Records</h3>
                    <button class="add-record-btn" @click="navigateToAddRecord">
                        <mdicon name="plus" :size="20"/>
                        Add Record
                    </button>
                </div>

                <div v-if="medicalRecordsLoading" class="records-loading">
                    <mdicon name="loading" :size="48" class="spin"/>
                    <p>Loading medical records...</p>
                </div>
                <template v-else>
                    <div class="records-grid" v-if="medicalRecords.length > 0">
                        <div class="record-card-web" v-for="record in medicalRecords" :key="record.id" @click="openRecordDetail(record.id)">
                            <div class="record-card-content">
                                <div class="record-icon-web">
                                    <mdicon :name="record.icon" :size="32"/>
                                </div>
                                <div class="record-details-web">
                                    <div class="record-header-web">
                                        <h4 class="record-title-web">{{ record.title }}</h4>
                                        <span class="record-type-chip">{{ record.typeLabel }}</span>
                                    </div>
                                    <p class="record-meta-web">{{ record.date }} · {{ record.provider }}</p>
                                    <p class="record-description-web">{{ record.description }}</p>
                                    <div class="record-tags-web" v-if="record.tags.length">
                                        <span class="record-tag-web" v-for="tag in record.tags" :key="`${record.id}-${tag}`">{{ tag }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else class="empty-state">
                        <mdicon name="file-document-multiple" :size="80" class="empty-icon"/>
                        <p class="empty-title">No Records Yet</p>
                        <p class="empty-text">Start adding medical records to track your health history</p>
                        <button class="primary-button" @click="navigateToAddRecord">
                            <mdicon name="plus" :size="20"/>
                            Add First Record
                        </button>
                    </div>
                </template>
                <p v-if="medicalRecordsError" class="records-error">
                    {{ medicalRecordsError.message || 'Something went wrong while loading records.' }}
                </p>
            </div>

            <!-- My Health Tab -->
            <div v-if="activeTab === 'health'" class="tab-content">
                <div v-if="healthLoading" class="empty-state">
                    <mdicon name="loading" :size="60" class="empty-icon spin"/>
                    <p class="empty-title">Loading vitals...</p>
                </div>
                <div v-else class="health-grid">
                    <div class="health-card">
                        <div class="health-card-header">
                            <div>
                                <h4>Blood Pressure</h4>
                                <p>Latest reading</p>
                            </div>
                            <button class="health-link" @click="navigateToBloodPressure">
                                View details
                            </button>
                        </div>
                        <div v-if="bpLatest" class="health-reading">
                            <p class="health-value">{{ bpLatest.systolic }}/{{ bpLatest.diastolic }} <span>mmHg</span></p>
                            <span class="health-status" :class="bpLatest.status.toLowerCase()">{{ bpLatest.status }}</span>
                        </div>
                        <p v-else class="health-empty">No blood pressure records yet.</p>
                        <div v-if="bpChartData.length" class="health-chart stacked">
                            <div class="chart-y-axis">
                                <span>145</span>
                                <span>110</span>
                                <span>75</span>
                            </div>
                            <div class="chart-area">
                                <div class="chart-bars">
                                    <div 
                                        class="chart-bar-group" 
                                        v-for="record in bpChartData" 
                                        :key="record.id"
                                    >
                                        <div class="bp-bar">
                                            <div 
                                                class="bp-range" 
                                                :style="{ height: record.rangeHeight, top: record.topOffset }"
                                            >
                                                <span class="bp-dot-top"></span>
                                                <span class="bp-dot-bottom"></span>
                                            </div>
                                        </div>
                                        <span class="chart-label">{{ record.label }}</span>
                                    </div>
                                </div>
                            </div>
                            <span class="chart-unit">mmHg</span>
                        </div>
                        <div v-else class="health-chart-placeholder">
                            <p class="placeholder-text">Add records to see trends</p>
                        </div>
                    </div>

                    <div class="health-card">
                        <div class="health-card-header">
                            <div>
                                <h4>Blood Sugar</h4>
                                <p>Latest reading</p>
                            </div>
                            <button class="health-link" @click="navigateToBloodSugar">
                                View details
                            </button>
                        </div>
                        <div v-if="bsLatest">
                            <div class="health-reading">
                                <p class="health-value">{{ bsLatest.value }} <span>mg/dL</span></p>
                                <span class="health-status" :class="bsLatest.status.toLowerCase()">{{ bsLatest.status }}</span>
                            </div>
                        </div>
                        <p v-else class="health-empty">No blood sugar records yet.</p>
                        <div class="health-chart">
                            <div class="chart-y-axis">
                                <span>110</span>
                                <span>100</span>
                                <span>90</span>
                                <span>80</span>
                                <span>70</span>
                            </div>
                            <div class="chart-area">
                                <svg class="line-chart" viewBox="0 0 280 120" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="webSugarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.25"/>
                                            <stop offset="100%" style="stop-color:#667eea;stop-opacity:0.05"/>
                                        </linearGradient>
                                    </defs>
                                    <path 
                                        v-if="bsChartPath"
                                        :d="bsChartPath"
                                        fill="url(#webSugarGradient)"
                                        stroke="none"
                                    />
                                    <path 
                                        v-if="bsChartPath"
                                        :d="bsChartPath"
                                        fill="none"
                                        stroke="#667eea"
                                        stroke-width="2"
                                    />
                                    <circle 
                                        v-for="(point, index) in bsChartPoints"
                                        :key="`bs-point-${index}`"
                                        :cx="point.x"
                                        :cy="point.y"
                                        r="3"
                                        fill="#667eea"
                                    />
                                </svg>
                                <div class="chart-x-labels">
                                    <span v-for="(point, index) in bsChartPoints" :key="`bs-label-${index}`">{{ point.label }}</span>
                                </div>
                            </div>
                            <span class="chart-unit">mg/dL</span>
                        </div>
                    </div>
                    <div class="health-card">
                        <div class="health-card-header">
                            <div>
                                <h4>Body Weight</h4>
                                <p>Latest measurement</p>
                            </div>
                            <button class="health-link" @click="navigateToBodyWeight">
                                View details
                            </button>
                        </div>
                        <div v-if="bodyWeightLatest" class="health-reading">
                            <p class="health-value">{{ bodyWeightLatest.weight }} <span>kg</span></p>
                            <span class="health-status body-weight" :class="{ increase: bodyWeightLatest.change > 0, decrease: bodyWeightLatest.change < 0 }">
                                <template v-if="bodyWeightLatest.change > 0">+{{ bodyWeightLatest.change }} kg</template>
                                <template v-else-if="bodyWeightLatest.change < 0">{{ bodyWeightLatest.change }} kg</template>
                                <template v-else>Stable</template>
                            </span>
                        </div>
                        <p v-else class="health-empty">No body weight records yet.</p>
                    </div>
                    <div class="health-card">
                        <div class="health-card-header">
                            <div>
                                <h4>Illness</h4>
                                <p>Latest summary</p>
                            </div>
                            <button class="health-link" @click="router.push('/medical-records/web/illness')">
                                View details
                            </button>
                        </div>
                        <div v-if="latestIllness" class="illness-summary-web">
                            <div class="illness-row">
                                <div class="illness-title">{{ latestIllness.diagnosis }}</div>
                                <span class="pill-badge" :class="latestIllness.status?.toLowerCase()">
                                    {{ latestIllness.status }}
                                </span>
                            </div>
                            <div class="illness-row meta">
                                <span class="pill-badge subtle">{{ latestIllness.severity || 'MILD' }}</span>
                                <span v-if="latestIllness.bodyTemperature" class="pill-badge subtle">
                                    {{ latestIllness.bodyTemperature }}°{{ latestIllness.temperatureUnit || 'C' }}
                                </span>
                                <span class="illness-date">{{ formatRecordDate(latestIllness.recordedAt || latestIllness.createdAt) }}</span>
                            </div>
                            <div v-if="latestIllness.symptoms?.length" class="illness-symptoms">
                                <span class="symptom-chip" v-for="symptom in latestIllness.symptoms" :key="symptom">
                                    {{ symptom }}
                                </span>
                            </div>
                        </div>
                        <p v-else class="health-empty">No illness entries yet.</p>
                    </div>
                </div>
            </div>

            <!-- Profile Tab -->
            <div v-if="activeTab === 'profile'" class="tab-content profile-tab">
                <ProfileOverview />
            </div>
        </div>
    </div>
</div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import TopBar from '@/components/MedicalRecords/TopBar.vue'
import SideNav from '@/components/MedicalRecords/SideNav.vue'
import ProfileOverview from '@/views/web/Profile/ProfileOverview.vue'
import { useBloodPressure } from '@/composables/vitals/bloodPressure'
import { useBloodSugar } from '@/composables/vitals/bloodSugar'
import { useBodyWeight } from '@/composables/vitals/bodyWeight'
import { useIllness } from '@/composables/vitals/illness'
import { useMedicalRecords } from '@/composables/medicalRecords'
import { useMedicineReminders } from '@/composables/medicineReminders'

export default {
    name: "MedicalRecordsWeb",
    components: {
        TopBar,
        SideNav,
        ProfileOverview
    },
    setup() {
        const router = useRouter()
        const route = useRoute()
        const allowedTabs = ['home', 'records', 'health', 'profile']
        const initialTab = () => {
            const tab = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab
            return tab && allowedTabs.includes(tab) ? tab : 'home'
        }
        const activeTab = ref(initialTab())
        const activeProfileId = ref(localStorage.getItem('selectedProfileId') || null)
        const profileChipName = ref(localStorage.getItem('selectedProfileName') || 'Select profile')

        const updateProfileChipName = () => {
            profileChipName.value = localStorage.getItem('selectedProfileName') || 'Select profile'
        }

        const handleTabChange = (tab) => {
            activeTab.value = tab
            updateProfileChipName()
            router.replace({ path: route.path, query: { ...route.query, tab } })
        }

        const getTabTitle = () => {
            const titles = {
                home: 'Medical Records Dashboard',
                records: 'Medical Records',
                health: 'My Health',
                profile: 'Profile Settings'
            }
            return titles[activeTab.value] || 'Medical Records'
        }

        const navigateToAddRecord = () => {
            router.push('/medical-records/add-record')
        }

        const navigateToMedicineReminder = () => {
            router.push('/medical-records/web/medicine-reminders/week')
        }

        const navigateToBloodPressure = () => {
            router.push('/medical-records/web/blood-pressure')
        }

        const navigateToBloodSugar = () => {
            router.push('/medical-records/web/blood-sugar')
        }

        const navigateToBodyWeight = () => {
            router.push('/medical-records/web/body-weight')
        }

        const openRecordDetail = (recordId) => {
            router.push(`/medical-records/web/records/${recordId}`)
        }

        const recordTypeMeta = {
            LAB_RESULT: { label: 'Lab Report', icon: 'file-document' },
            PRESCRIPTION: { label: 'Prescription', icon: 'file-document-edit' },
            INVOICE: { label: 'Invoice', icon: 'receipt' },
            VACCINATION: { label: 'Vaccination', icon: 'needle' },
            DIAGNOSIS: { label: 'Diagnosis', icon: 'clipboard-text' },
            IMAGING: { label: 'Imaging', icon: 'image' },
            DISCHARGE_SUMMARY: { label: 'Discharge Summary', icon: 'file-chart' },
            OTHER: { label: 'Other', icon: 'file-question' }
        }

        const formatRecordDate = (value) => {
            if (!value) return 'Unknown date'
            return new Date(value).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })
        }

        const {
            records: medicalRecordsSource,
            loading: medicalRecordsLoading,
            error: medicalRecordsError,
            fetchRecords: fetchMedicalRecords
        } = useMedicalRecords()

        const {
            reminders: reminderSource,
            loading: remindersLoading,
            error: remindersError,
            fetchReminders,
            setReminderStatus: setMedicineReminderStatus
        } = useMedicineReminders()

        const medicalRecords = computed(() => {
            return medicalRecordsSource.value.map(record => {
                const meta = recordTypeMeta[record.recordType] || recordTypeMeta.OTHER
                return {
                    id: record.id,
                    title: record.title,
                    typeLabel: meta.label,
                    icon: meta.icon,
                    date: formatRecordDate(record.recordDate),
                    provider: record.providerName || 'Provider not specified',
                    description: record.notes || 'No notes added for this record.',
                    tags: Array.isArray(record.tags) ? record.tags : []
                }
            })
        })

        const recentRecords = computed(() => medicalRecords.value.slice(0, 5))

        const {
            records: bpRecords,
            fetchRecords: fetchBpRecords
        } = useBloodPressure()
        const {
            records: bsRecords,
            fetchRecords: fetchBsRecords
        } = useBloodSugar()
        const {
            records: bodyWeightRecords,
            fetchRecords: fetchBodyWeightRecords
        } = useBodyWeight()
        const {
            records: illnessRecords,
            fetchRecords: fetchIllnessRecords
        } = useIllness()

        const healthLoading = ref(false)

        const classifyBloodPressureStatus = (systolic, diastolic) => {
            if (systolic < 120 && diastolic < 80) return 'Normal'
            if (systolic < 130 && diastolic < 80) return 'Elevated'
            return 'High'
        }

        const classifyBloodSugarStatus = (value, context = '') => {
            const ctx = (context || '').toLowerCase()
            if (ctx.includes('after')) {
                if (value < 140) return 'Normal'
                if (value < 200) return 'Elevated'
                return 'High'
            }
            if (value < 100) return 'Normal'
            if (value < 126) return 'Elevated'
            return 'High'
        }

        const bpDisplayRecords = computed(() => {
            return bpRecords.value.map(record => ({
                id: record.id,
                systolic: record.systolic || record.valueNumber,
                diastolic: record.diastolic || 0,
                recordedAt: record.recordedAt
            }))
        })

        const bpChartData = computed(() => {
            const recent = bpDisplayRecords.value.slice(-7)
            if (!recent.length) {
                return []
            }
            const systolics = recent.map(entry => Number(entry.systolic) || 0)
            const diastolics = recent.map(entry => Number(entry.diastolic) || 0)
            const max = Math.max(...systolics)
            const min = Math.min(...diastolics)
            const range = (max - min) || 1
            return recent.map((record, index) => {
                const systolic = systolics[index]
                const diastolic = diastolics[index]
                const labelSource = record.recordedAt || record.date || new Date().toISOString()
                const label = new Date(labelSource).toLocaleDateString(undefined, { weekday: 'short' })
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

        const bpLatest = computed(() => {
            if (!bpDisplayRecords.value.length) return null
            const latest = bpDisplayRecords.value[bpDisplayRecords.value.length - 1]
            const systolic = latest.systolic || 0
            const diastolic = latest.diastolic || 0
            return {
                systolic,
                diastolic,
                status: classifyBloodPressureStatus(systolic, diastolic)
            }
        })

        const bsLatest = computed(() => {
            if (!bsRecords.value.length) return null
            const latest = bsRecords.value[bsRecords.value.length - 1]
            const value = Number(latest.valueNumber) || 0
            const type = latest.chartGroup || 'Fasting'
            return {
                value,
                type,
                status: classifyBloodSugarStatus(value, type)
            }
        })

        const bodyWeightLatest = computed(() => {
            if (!bodyWeightRecords.value.length) return null
            const latest = bodyWeightRecords.value[bodyWeightRecords.value.length - 1]
            const previous = bodyWeightRecords.value[bodyWeightRecords.value.length - 2]
            const weight = Number(latest.valueNumber) || 0
            const change = previous ? +(weight - previous.valueNumber).toFixed(1) : 0
            return { weight, change }
        })

        const latestIllness = computed(() => {
            if (!illnessRecords.value.length) return null
            return illnessRecords.value[0]
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
                const label = new Date(values[index].recordedAt).toLocaleDateString(undefined, { weekday: 'short' })
                return { x, y, label }
            })
        })

        const bsChartPath = computed(() => {
            const points = bsChartPoints.value
            if (!points.length) return ''
            return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
        })

        const formatReminderTime = (timeString) => {
            if (!timeString) return '—'
            const [hour, minute] = timeString.split(':')
            const date = new Date()
            date.setHours(Number(hour), Number(minute), 0, 0)
            return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        }

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
            const durationMatch = reminder.frequency?.match?.(/(\d]+)/)
            if (durationMatch) {
                return `${durationMatch[1]}x`
            }
            return reminder.frequency || ''
        }

        const todaysReminders = computed(() => {
            const mapped = reminderSource.value.map(reminder => {
                const reminderSlots = Array.isArray(reminder.slots) && reminder.slots.length
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
                return {
                    id: reminder.id,
                    medicineName: reminder.medicineName,
                    intakeMethod: reminder.intakeMethod,
                    frequency: reminder.frequency,
                    slots
                }
            })
            return mapped.slice(0, 3)
        })

        const toggleHomeReminder = async(reminder, reminderSlot) => {
            const token = localStorage.getItem('token')
            if (!token) return
            const newStatus = reminderSlot.status === 'taken' ? 'pending' : 'taken'
            try {
                await setMedicineReminderStatus(token, reminderSlot.reminderId, newStatus, new Date(), reminderSlot.rawTime)
                const target = reminderSource.value.find(r => r.id === reminderSlot.reminderId)
                if (target?.slots) {
                    const targetSlot = target.slots.find(slot => slot.time === reminderSlot.rawTime)
                    if (targetSlot) {
                        targetSlot.status = newStatus === 'pending' ? null : newStatus
                    }
                }
                reminderSlot.status = newStatus === 'pending' ? null : newStatus
            } catch (err) {
                console.error(err)
            }
        }

        const loadHealthData = async () => {
            const token = localStorage.getItem('token')
            activeProfileId.value = localStorage.getItem('selectedProfileId')
            updateProfileChipName()
            if (!token || !activeProfileId.value) {
                bpRecords.value = []
                bsRecords.value = []
                bodyWeightRecords.value = []
                illnessRecords.value = []
                return
            }
            healthLoading.value = true
            await Promise.all([
                fetchBpRecords(token, activeProfileId.value),
                fetchBsRecords(token, activeProfileId.value),
                fetchBodyWeightRecords(token, activeProfileId.value),
                fetchIllnessRecords(token, activeProfileId.value)
            ])
            healthLoading.value = false
        }

        const loadMedicalRecords = async () => {
            const token = localStorage.getItem('token')
            activeProfileId.value = localStorage.getItem('selectedProfileId')
            updateProfileChipName()
            medicalRecordsError.value = null
            if (!token || !activeProfileId.value) {
                medicalRecordsSource.value = []
                return
            }
            await fetchMedicalRecords(token, activeProfileId.value)
        }

        const loadReminders = async () => {
            const token = localStorage.getItem('token')
            activeProfileId.value = localStorage.getItem('selectedProfileId')
            updateProfileChipName()
            if (!token || !activeProfileId.value) {
                reminderSource.value = []
                return
            }
            await fetchReminders(token, activeProfileId.value, { date: new Date() })
        }

        const loadHomeData = async () => {
            await Promise.all([
                loadMedicalRecords(),
                loadReminders()
            ])
        }

        watch(activeTab, (tab) => {
            if (tab === 'health') {
                loadHealthData()
            }
            if (tab === 'records') {
                loadMedicalRecords()
            }
            if (tab === 'home') {
                loadHomeData()
            }
        })

        const handleStorage = (event) => {
            if (event.key === 'selectedProfileName') {
                updateProfileChipName()
            }
            if (event.key === 'selectedProfileId') {
                if (activeTab.value === 'health') {
                    loadHealthData()
                }
                if (activeTab.value === 'records') {
                    loadMedicalRecords()
                }
                if (activeTab.value === 'home') {
                    loadHomeData()
                }
            }
        }

        onMounted(() => {
            updateProfileChipName()
            if (activeTab.value === 'health') {
                loadHealthData()
            }
            if (activeTab.value === 'records') {
                loadMedicalRecords()
            }
            if (activeTab.value === 'home') {
                loadHomeData()
            }
            if (route.query.tab && allowedTabs.includes(Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab)) {
                activeTab.value = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab
            }
            window.addEventListener('storage', handleStorage)
        })

        watch(
            () => route.query.tab,
            (val) => {
                const parsed = Array.isArray(val) ? val[0] : val
                if (parsed && allowedTabs.includes(parsed)) {
                    activeTab.value = parsed
                }
            }
        )

        onUnmounted(() => {
            window.removeEventListener('storage', handleStorage)
        })

        return {
            router,
            activeTab,
            handleTabChange,
            getTabTitle,
            navigateToAddRecord,
            navigateToMedicineReminder,
            navigateToBloodPressure,
            navigateToBloodSugar,
            navigateToBodyWeight,
            openRecordDetail,
            medicalRecords,
            medicalRecordsLoading,
            medicalRecordsError,
            recentRecords,
            remindersLoading,
            remindersError,
            todaysReminders,
            formatFrequency,
            toggleHomeReminder,
            healthLoading,
            bpLatest,
            bsLatest,
            bodyWeightLatest,
            bpChartData,
            bsChartPoints,
            bsChartPath,
            profileChipName,
            activeProfileId,
            latestIllness,
            formatRecordDate
        }
    }
}
</script>

<style scoped>

/* ── Layout fix: sidebar + main ──────────────────────────── */
.medical-records-container {
    display: flex;
    flex-direction: row !important;
    min-height: 100vh;
}

.main-content {
    margin-left: 240px !important;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--home-bg-web);
    position: relative;
}

.medical-orb { display: none; } /* orbs handled by bg gradient */

.content-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 28px 32px 48px;
    max-width: 1100px;
    width: 100%;
}

.tab-content { animation: mr-fade-up 0.3s ease both; }
@keyframes mr-fade-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
}

/* ── Action icons in TopBar ──────────────────────────────── */
.action-icon {
    cursor: pointer;
    color: var(--text-secondary);
    padding: 7px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.04);
    transition: background 0.15s, color 0.15s;
}
.action-icon:hover { background: rgba(255,255,255,0.09); color: var(--text-primary); }

.toolbar-profile-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 12px 5px 6px;
    border-radius: 999px;
    background: rgba(79,70,229,0.12);
    border: 1px solid rgba(79,70,229,0.22);
    font-size: 13px;
    font-weight: 600;
    color: #818cf8;
    cursor: pointer;
}
.toolbar-profile-avatar { color: #818cf8; display: flex; }
.toolbar-profile-name { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── HOME TAB ────────────────────────────────────────────── */
.home-tab { display: flex; flex-direction: column; gap: 24px; }

.home-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}

.action-card.home {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 22px;
    background: var(--glass-card-bg);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px;
    cursor: pointer;
    transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
    position: relative;
    overflow: hidden;
}
.action-card.home::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #4f46e5, #818cf8, #06b6d4);
}
.action-card.home:hover { transform: translateY(-3px); border-color: rgba(129,140,248,0.25); box-shadow: 0 12px 28px rgba(79,70,229,0.12); }

.action-icon-primary { color: #818cf8; flex-shrink: 0; }
.action-card.home h4 { margin: 0 0 2px; font-size: 15px; font-weight: 700; color: var(--text-primary); }
.action-card.home p  { margin: 0; font-size: 13px; color: var(--text-muted); }

/* Quick links */
.home-quick-links {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}
.quick-link-card {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 10px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-secondary);
    transition: background 0.15s, color 0.15s;
    flex: 1;
    min-width: 130px;
}
.quick-link-card:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }
.ql-icon { flex-shrink: 0; }
.ai-ql   { color: #a78bfa; }
.pill-ql { color: #c084fc; }
.lab-ql  { color: #67e8f9; }
.ql-arrow { color: var(--text-muted); margin-left: auto; }

/* Home sections */
.home-section { display: flex; flex-direction: column; gap: 12px; }

.home-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.home-section-header h3 {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -0.2px;
}
.link-button {
    background: none;
    border: none;
    font-size: 13px;
    font-weight: 700;
    color: #818cf8;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s;
}
.link-button:hover { color: #a5b4fc; }

/* Reminder cards */
.home-reminders { display: flex; flex-direction: column; gap: 10px; }
.reminder-card {
    background: var(--glass-card-bg);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 14px 16px;
}
.reminder-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}
.reminder-card-header h4 { margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary); }
.reminder-frequency {
    font-size: 12px;
    font-weight: 700;
    padding: 2px 9px;
    border-radius: 999px;
    background: rgba(79,70,229,0.12);
    color: #818cf8;
    border: 1px solid rgba(79,70,229,0.2);
}
.reminder-meta { margin: 0 0 10px; font-size: 12px; color: var(--text-muted); }
.reminder-slots { display: flex; flex-wrap: wrap; gap: 6px; }
.slot-chip {
    padding: 5px 11px;
    border-radius: 8px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}
.slot-chip.checked { background: rgba(34,197,94,0.12); border-color: rgba(34,197,94,0.25); color: #4ade80; }
.slot-chip.missed  { background: rgba(249,115,22,0.12); border-color: rgba(249,115,22,0.25); color: #fb923c; }

/* Recent records in home */
.home-records { display: flex; flex-direction: column; gap: 8px; }
.home-record-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: var(--glass-card-bg);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
}
.home-record-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(129,140,248,0.2); }
.home-record-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: rgba(79,70,229,0.14);
    border: 1px solid rgba(79,70,229,0.18);
    color: #818cf8;
    display: grid;
    place-items: center;
    flex-shrink: 0;
}
.home-record-info { flex: 1; min-width: 0; }
.home-record-info h4 { margin: 0; font-size: 14px; font-weight: 700; color: var(--text-primary); }
.home-record-info p  { margin: 2px 0 0; font-size: 12px; color: var(--text-muted); }
.home-record-chevron { color: var(--text-muted); opacity: 0.5; flex-shrink: 0; }

/* Empty states */
.home-empty { font-size: 14px; color: var(--text-muted); margin: 4px 0; }

/* ── RECORDS TAB ─────────────────────────────────────────── */
.records-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}
.records-title { margin: 0; font-size: 20px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.3px; }

.add-record-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    border-radius: 10px;
    background: linear-gradient(135deg, #4f46e5, #06b6d4);
    color: white;
    border: none;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s;
}
.add-record-btn:hover { opacity: 0.9; }

.records-grid { display: flex; flex-direction: column; gap: 10px; }

.record-card-web {
    background: var(--glass-card-bg);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 16px 18px;
    cursor: pointer;
    transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;
}
.record-card-web:hover { transform: translateY(-2px); border-color: rgba(129,140,248,0.22); box-shadow: 0 8px 24px rgba(79,70,229,0.1); }

.record-card-content { display: flex; align-items: flex-start; gap: 14px; }

.record-icon-web {
    width: 48px; height: 48px;
    border-radius: 13px;
    background: rgba(79,70,229,0.14);
    border: 1px solid rgba(79,70,229,0.18);
    color: #818cf8;
    display: grid;
    place-items: center;
    flex-shrink: 0;
}

.record-details-web { flex: 1; min-width: 0; }
.record-header-web { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.record-title-web { margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary); }
.record-type-chip {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 9px;
    border-radius: 999px;
    background: rgba(79,70,229,0.12);
    color: #818cf8;
    border: 1px solid rgba(79,70,229,0.2);
    white-space: nowrap;
}
.record-meta-web { margin: 0 0 6px; font-size: 12px; color: var(--text-muted); }
.record-description-web { margin: 0 0 8px; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
.record-tags-web { display: flex; flex-wrap: wrap; gap: 6px; }
.record-tag-web {
    padding: 2px 9px;
    border-radius: 999px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    font-size: 11px;
    color: var(--text-muted);
}

/* ── HEALTH TAB ──────────────────────────────────────────── */
.health-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    animation: mr-fade-up 0.3s ease both;
}

.health-card {
    background: var(--glass-card-bg);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 20px 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.18s, box-shadow 0.18s;
}
.health-card:hover { border-color: rgba(129,140,248,0.2); box-shadow: 0 8px 24px rgba(79,70,229,0.1); }

.health-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
}
.health-card-header h4 { margin: 0 0 2px; font-size: 15px; font-weight: 700; color: var(--text-primary); }
.health-card-header p  { margin: 0; font-size: 12px; color: var(--text-muted); }
.health-link {
    background: none;
    border: none;
    font-size: 12px;
    font-weight: 700;
    color: #818cf8;
    cursor: pointer;
    padding: 0;
    white-space: nowrap;
    transition: color 0.15s;
    flex-shrink: 0;
}
.health-link:hover { color: #a5b4fc; }

.health-reading { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.health-value {
    font-size: 28px;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -0.5px;
    line-height: 1;
}
.health-value span { font-size: 14px; font-weight: 500; color: var(--text-muted); }

.health-status {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}
.health-status.normal   { background: rgba(34,197,94,0.12);  color: #4ade80; border: 1px solid rgba(34,197,94,0.22); }
.health-status.elevated { background: rgba(251,191,36,0.12); color: #fbbf24; border: 1px solid rgba(251,191,36,0.22); }
.health-status.high     { background: rgba(248,113,113,0.12);color: #f87171; border: 1px solid rgba(248,113,113,0.22); }
.health-status.body-weight { background: rgba(96,165,250,0.12); color: #60a5fa; border: 1px solid rgba(96,165,250,0.22); }
.health-status.increase { background: rgba(249,115,22,0.12); color: #fb923c; border: 1px solid rgba(249,115,22,0.22); }
.health-status.decrease { background: rgba(34,197,94,0.12);  color: #4ade80; border: 1px solid rgba(34,197,94,0.22); }

.health-empty { font-size: 13px; color: var(--text-muted); margin: 0; }

/* Chart */
.health-chart {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    height: 90px;
    position: relative;
}
.health-chart.stacked { align-items: flex-start; height: 100px; }
.chart-y-axis { display: flex; flex-direction: column; justify-content: space-between; font-size: 10px; color: var(--text-muted); height: 100%; padding: 2px 0; flex-shrink: 0; }
.chart-area { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; }
.chart-bars { display: flex; align-items: flex-end; gap: 4px; height: 80px; }
.chart-bar-group { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; position: relative; gap: 4px; }
.bp-bar { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; }
.bp-range {
    position: absolute;
    width: 6px;
    border-radius: 3px;
    background: linear-gradient(180deg, #f87171, #818cf8);
    min-height: 6px;
}
.bp-dot-top, .bp-dot-bottom {
    position: absolute;
    width: 8px; height: 8px;
    border-radius: 50%;
    left: -1px;
}
.bp-dot-top { background: #f87171; top: -4px; }
.bp-dot-bottom { background: #818cf8; bottom: -4px; }
.chart-label { font-size: 10px; color: var(--text-muted); }
.chart-unit { position: absolute; right: 0; top: 0; font-size: 10px; color: var(--text-muted); }
.chart-x-labels { display: flex; justify-content: space-between; margin-top: 4px; }
.chart-x-labels span { font-size: 10px; color: var(--text-muted); }
.health-chart-placeholder { display: flex; align-items: center; justify-content: center; height: 60px; border: 1px dashed rgba(255,255,255,0.08); border-radius: 10px; }
.placeholder-text { font-size: 12px; color: var(--text-muted); }
.line-chart { width: 100%; height: 100%; }

/* Illness */
.illness-summary-web { display: flex; flex-direction: column; gap: 8px; }
.illness-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.illness-row.meta { gap: 6px; }
.illness-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.illness-date { font-size: 12px; color: var(--text-muted); margin-left: auto; }
.illness-symptoms { display: flex; flex-wrap: wrap; gap: 6px; }
.symptom-chip {
    padding: 3px 9px;
    border-radius: 8px;
    background: rgba(192,132,252,0.1);
    border: 1px solid rgba(192,132,252,0.2);
    font-size: 12px;
    color: #c084fc;
}
.pill-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}
.pill-badge.active { background: rgba(34,197,94,0.12); color: #4ade80; border: 1px solid rgba(34,197,94,0.22); }
.pill-badge.recovered { background: rgba(96,165,250,0.12); color: #60a5fa; border: 1px solid rgba(96,165,250,0.22); }
.pill-badge.subtle { background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.09); }

/* ── LOADING / EMPTY STATES ─────────────────────────────── */
.records-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 48px 0;
    color: var(--text-muted);
    font-size: 14px;
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 56px 0;
    text-align: center;
}
.empty-icon { color: var(--text-muted); opacity: 0.35; }
.empty-title { margin: 0; font-size: 18px; font-weight: 700; color: var(--text-primary); }
.empty-text  { margin: 0; font-size: 14px; color: var(--text-muted); }
.primary-button {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 6px;
    padding: 10px 20px;
    border-radius: 10px;
    background: linear-gradient(135deg, #4f46e5, #06b6d4);
    color: white;
    border: none;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
}
.records-error { font-size: 13px; color: #f87171; margin-top: 8px; }

/* ── PROFILE TAB ────────────────────────────────────────── */
.profile-tab { padding-top: 8px; }

/* ── RESPONSIVE ─────────────────────────────────────────── */
@media (max-width: 900px) {
    .main-content { margin-left: 0 !important; }
    .health-grid { grid-template-columns: 1fr; }
    .home-actions { grid-template-columns: 1fr; }
    .content-wrapper { padding: 20px 16px 40px; }
}
</style>
