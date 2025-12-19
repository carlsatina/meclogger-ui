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
