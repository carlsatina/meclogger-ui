<template>
<div class="car-shell stagger-page stagger-seq" :class="{ 'stagger-ready': staggerReady }">
    <div class="car-orb one"></div>
    <div class="car-orb two"></div>
    <header class="car-hero">
        <div class="brand">
            <button class="logo-circle" @click="goLanding">
                <mdicon name="home" :size="22"/>
            </button>
            <div>
                <p class="eyebrow">Car Maintenance</p>
                <h1 class="headline">Keep every ride in peak shape</h1>
            </div>
        </div>
        <nav class="car-tabs">
            <button :class="{ active: currentTab === 'home' }" @click="setTab('home')">Home</button>
            <button :class="{ active: currentTab === 'schedules' }" @click="setTab('schedules')">Schedules</button>
            <button :class="{ active: currentTab === 'report' }" @click="setTab('report')">Report</button>
            <button :class="{ active: currentTab === 'vehicles' }" @click="setTab('vehicles')">Vehicles</button>
            <button :class="{ active: currentTab === 'settings' }" @click="setTab('settings')">Settings</button>
        </nav>
    </header>

    <main class="car-body">
        <section v-if="currentTab === 'home'" class="car-panel">
            <div class="car-panel-header">
                <div class="vehicle-select">
                    <label>Vehicle</label>
                    <div class="select-wrapper">
                        <select class="car-select" v-model="selectedVehicleId" @change="handleVehicleChange">
                            <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ displayName(v) }}</option>
                        </select>
                    </div>
                </div>
                <button class="car-btn" @click="goAddMaintenance">
                    <mdicon name="plus" :size="18"/><span>Add Maintenance</span>
                </button>
            </div>

            <div class="car-search">
                <mdicon name="magnify" :size="20"/>
                <input v-model="searchTerm" type="text" placeholder="Search maintenance..." @input="debouncedSearch">
            </div>

            <div v-if="loading" class="car-empty">Loading maintenance...</div>
            <div v-else-if="errorMessage" class="car-empty">{{ errorMessage }}</div>
            <div v-else-if="!maintenanceRecords.length" class="car-empty">No maintenance records yet. Add one to get started.</div>

            <div v-else class="car-records">
                <div class="car-record-card" v-for="item in maintenanceRecords" :key="item.id" @click="openRecordDetail(item.id)">
                    <div class="car-record-top">
                        <div>
                            <p class="car-record-title">{{ item.maintenanceType || 'Maintenance' }}</p>
                            <p class="car-record-date">{{ formatDate(item.serviceDate) }}</p>
                        </div>
                        <span class="car-pill">{{ formatMileage(item.mileageAtService) }}</span>
                    </div>
                    <div class="car-record-bottom">
                        <div class="car-meta">
                            <mdicon name="cash" :size="18"/>
                            <span>{{ formatCurrency(item.cost, item.currency || defaultCurrency) }}</span>
                        </div>
                        <div class="car-meta">
                            <mdicon name="map-marker" :size="18"/>
                            <span>{{ item.location || '—' }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section v-else-if="currentTab === 'schedules'" class="car-panel">
            <div class="car-panel-header">
                <div class="vehicle-select">
                    <label>Vehicle</label>
                    <div class="select-wrapper">
                        <select class="car-select" v-model="selectedVehicleId" @change="handleVehicleChange">
                            <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ displayName(v) }}</option>
                        </select>
                    </div>
                </div>
                <button class="car-btn" @click="goAddSchedule">
                    <mdicon name="plus" :size="18"/><span>Add Schedule</span>
                </button>
            </div>

            <div class="car-search">
                <mdicon name="magnify" :size="20"/>
                <input v-model="scheduleSearch" type="text" placeholder="Search schedules..." @input="debouncedScheduleSearch">
            </div>

            <div v-if="loadingReminders" class="car-empty">Loading schedules...</div>
            <div v-else-if="errorMessage" class="car-empty">{{ errorMessage }}</div>
            <div v-else-if="!filteredReminders.length" class="car-empty">No schedules found.</div>
            <div class="car-schedule-grid" v-else>
                <div class="car-schedule-card" v-for="item in filteredReminders" :key="item.id" @click="openScheduleDetail(item.id)">
                    <div class="car-record-top">
                        <div>
                            <p class="car-record-title">{{ item.maintenanceType || 'Schedule' }}</p>
                            <p class="car-record-date">{{ formatDate(item.dueDate) }}</p>
                        </div>
                        <button class="car-status-pill" :class="statusFor(item).class" @click.stop="toggleStatus(item)">
                            <mdicon :name="statusFor(item).icon" :size="18"/>
                            <span>{{ statusFor(item).label }}</span>
                        </button>
                    </div>
                    <div class="car-meta-row">
                        <div class="car-meta">
                            <mdicon name="counter" :size="18"/>
                            <span>{{ formatMileage(item.dueMileage) }}</span>
                        </div>
                        <div class="car-meta">
                            <mdicon name="timer-sand" :size="18"/>
                            <span>{{ deadlineText(item) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section v-else-if="currentTab === 'report'" class="car-panel">
            <div class="car-panel-header">
                <div class="vehicle-select">
                    <label>Vehicle</label>
                    <div class="select-wrapper">
                        <select class="car-select" v-model="selectedVehicleId" @change="handleVehicleChange">
                            <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ displayName(v) }}</option>
                        </select>
                    </div>
                </div>
            </div>
            <div v-if="!chartData.length" class="car-empty">No maintenance records to show.</div>
            <div v-else class="car-chart-card">
                <div class="car-donut">
                    <div class="car-donut-visual">
                        <svg viewBox="0 0 42 42">
                            <circle class="car-donut-ring" cx="21" cy="21" r="15.91549431" fill="transparent" stroke-width="5"></circle>
                            <circle
                                v-for="(slice, idx) in chartSlices"
                                :key="idx"
                                class="car-donut-segment"
                                cx="21" cy="21" r="15.91549431"
                                fill="transparent"
                                stroke-width="5"
                                :stroke="slice.color"
                                :stroke-dasharray="slice.dash"
                                :stroke-dashoffset="slice.offset"
                            ></circle>
                        </svg>
                        <div class="car-donut-center">
                            <p class="car-donut-total">{{ formatCurrency(totalCost, defaultCurrency) }}</p>
                            <p class="car-donut-range">Across {{ chartData.length }} types</p>
                        </div>
                    </div>
                </div>
                <div class="car-legend">
                    <div class="car-legend-item" v-for="item in chartData" :key="item.type">
                        <span class="car-legend-dot" :style="{ background: item.color }"></span>
                        <div class="car-legend-meta">
                            <p class="label">{{ item.type }}</p>
                            <p class="value">{{ formatCurrency(item.cost, defaultCurrency) }} ({{ item.percent }}%)</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section v-else-if="currentTab === 'vehicles'" class="car-panel">
            <div class="car-panel-header">
                <h3 class="car-record-title" style="margin: 0;">Vehicles</h3>
                <button class="car-btn" @click="addVehicle">
                    <mdicon name="plus" :size="18"/><span>Add Vehicle</span>
                </button>
            </div>
            <div class="car-search">
                <mdicon name="magnify" :size="20"/>
                <input v-model="vehicleSearch" type="text" placeholder="Search vehicle..." />
            </div>
            <div v-if="loading" class="car-empty">Loading vehicles...</div>
            <div v-else-if="errorMessage" class="car-empty">{{ errorMessage }}</div>
            <div v-else-if="!filteredVehicles.length" class="car-empty">No vehicles yet. Add your first vehicle.</div>
            <div class="car-vehicle-grid" v-else>
                <div class="car-vehicle-card" v-for="v in filteredVehicles" :key="v.id" @click="openVehicle(v.id)">
                    <div class="car-thumb">
                        <img v-if="v.imageUrl" :src="v.imageUrl.startsWith('http') ? v.imageUrl : `${API_BASE_URL}${v.imageUrl}`" alt="vehicle" />
                        <mdicon v-else name="clipboard-list-outline" :size="28"/>
                    </div>
                    <div class="car-info">
                        <p class="car-name">{{ displayName(v) }}</p>
                        <p class="car-sub">License: {{ v.licensePlate || '—' }}</p>
                        <p class="car-sub">VIN: {{ v.vin || '—' }}</p>
                    </div>
                </div>
            </div>
        </section>

        <section v-else-if="currentTab === 'settings'" class="car-panel">
            <div class="car-profile">
                <div class="car-avatar"><mdicon name="account-circle" :size="36"/></div>
                <div>
                    <p class="car-record-title">{{ userName }}</p>
                    <p class="car-record-date">{{ userEmail }}</p>
                </div>
            </div>
            <div class="car-card-grid">
                <div class="car-card">
                    <p class="car-record-title">Distance Unit</p>
                    <div class="car-inline">
                        <label><input type="radio" value="km" v-model="distanceUnit" @change="persistPreferences"> Kilometers</label>
                        <label><input type="radio" value="mi" v-model="distanceUnit" @change="persistPreferences"> Miles</label>
                    </div>
                </div>
                <div class="car-card">
                    <p class="car-record-title">Currency</p>
                    <select class="car-select" v-model="defaultCurrency" @change="persistPreferences">
                        <option v-for="c in currencyOptions" :key="c" :value="c">{{ c }}</option>
                    </select>
                </div>
                <div class="car-card">
                    <p class="car-record-title">Maintenance Types</p>
                    <div class="car-inline">
                        <input class="car-input" v-model="newMaintenanceType" type="text" placeholder="Add type" />
                        <button class="car-btn" type="button" @click="addType">Add</button>
                    </div>
                    <div class="car-chip-row">
                        <span v-for="t in visibleTypes" :key="t" class="car-chip">
                            {{ t }}
                            <button @click="removeType(t)">
                                <mdicon name="close" :size="14"/>
                            </button>
                        </span>
                    </div>
                </div>
            </div>
        </section>
    </main>
    <Loading v-if="showLoading"/>
</div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import store from '@/store'
import { useCarMaintenance } from '@/composables/carMaintenance'
import { API_BASE_URL } from '@/constants/config'
import Loading from '@/components/Loading.vue'
import { useStaggerReady } from '@/composables/staggerReady'

const palette = ['#f472b6', '#6f6cf7', '#34d399', '#f59e0b', '#60a5fa', '#9ca3af']

export default {
    name: "CarMaintenanceWeb",
    components: {
        Loading
    },
    setup() {
        const router = useRouter()
        const {
            listVehicles,
            listMaintenanceRecords,
            listReminders,
            updateReminder,
            getPreferences,
            savePreferences
        } = useCarMaintenance()

        const vehicles = ref([])
        const selectedVehicleId = ref('')
        const maintenanceRecords = ref([])
        const reminders = ref([])
        const searchTerm = ref('')
        const scheduleSearch = ref('')
        const vehicleSearch = ref('')
        const loading = ref(false)
        const loadingReminders = ref(false)
        const overlayActive = ref(false)
        const errorMessage = ref('')
        const staggerReady = useStaggerReady()
        const distanceUnit = ref('km')
        const defaultCurrency = ref('USD')
        const maintenanceTypes = ref([])
        const newMaintenanceType = ref('')
        const visibleTypes = computed(() => maintenanceTypes.value?.length ? maintenanceTypes.value : ['Oil Change', 'Brake Pad Replacement', 'Tire Rotation', 'Tire Replacement', 'Battery Replacement', 'Air Filter Replacement', 'Transmission Service', 'Coolant Flush', 'Spark Plug Replacement', 'Brake Fluid Change', 'Alignment', 'Inspection', 'Repair', 'Other'])
        const userName = ref('User')
        const userEmail = ref('user@example.com')
        const currencyOptions = ref(['USD', 'PHP', 'EUR', 'JPY', 'SGD'])
        let searchTimer = null
        let scheduleTimer = null

        const currentTab = ref('home')

        const withOverlay = async(fn) => {
            overlayActive.value = true
            try {
                return await fn()
            } finally {
                overlayActive.value = false
            }
        }

        const setTab = (tab) => {
            currentTab.value = tab
        }

        const displayName = (vehicle) => {
            if (!vehicle) return 'Vehicle'
            const parts = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean)
            const assembled = parts.join(' ').trim()
            return assembled || vehicle.licensePlate || vehicle.vin || 'Vehicle'
        }

        const formatDate = (value) => {
            if (!value) return '—'
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return '—'
            return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
        }

        const formatMileage = (value) => {
            if (value === null || value === undefined) return '—'
            const num = Number(value) || 0
            const converted = distanceUnit.value === 'mi' ? num * 0.621371 : num
            const unitLabel = distanceUnit.value === 'mi' ? 'mi' : 'km'
            return `${converted.toLocaleString()} ${unitLabel}`
        }

        const formatCurrency = (value, currency = 'USD') => {
            if (value === null || value === undefined) return '—'
            try {
                return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value)
            } catch (e) {
                return `${value.toLocaleString()} ${currency}`
            }
        }

        const loadPreferences = async() => {
            await withOverlay(async() => {
                try {
                    const token = localStorage.getItem('token')
                    if (!token) return
                    const prefs = await getPreferences(token)
                    if (prefs?.distanceUnit) distanceUnit.value = prefs.distanceUnit
                    if (prefs?.currency) defaultCurrency.value = prefs.currency
                    if (Array.isArray(prefs?.maintenanceTypes) && prefs.maintenanceTypes.length) {
                        maintenanceTypes.value = prefs.maintenanceTypes
                    }
                } catch (err) {
                    distanceUnit.value = 'km'
                    defaultCurrency.value = 'USD'
                }
            })
        }

        const loadVehicles = async() => {
            loading.value = true
            errorMessage.value = ''
            await withOverlay(async() => {
                try {
                    const token = localStorage.getItem('token')
                    if (!token) throw new Error('You must be logged in.')
                    vehicles.value = await listVehicles(token)
                    if (!vehicles.value.length) {
                        selectedVehicleId.value = ''
                        maintenanceRecords.value = []
                        reminders.value = []
                        return
                    }
                    const stored = localStorage.getItem('selectedVehicleId')
                    const preferred = vehicles.value.find(v => v.id === stored) || vehicles.value[0]
                    selectedVehicleId.value = preferred.id
                    await loadMaintenanceRecords()
                    await loadReminders()
                } catch (err) {
                    errorMessage.value = err?.message || 'Unable to load vehicles'
                    vehicles.value = []
                } finally {
                    loading.value = false
                }
            })
        }

        const loadMaintenanceRecords = async() => {
            if (!selectedVehicleId.value) {
                maintenanceRecords.value = []
                return
            }
            loading.value = true
            await withOverlay(async() => {
                try {
                    const token = localStorage.getItem('token')
                    if (!token) throw new Error('You must be logged in.')
                    const params = new URLSearchParams()
                    params.append('vehicleId', selectedVehicleId.value)
                    if (searchTerm.value.trim()) params.append('search', searchTerm.value.trim())
                    maintenanceRecords.value = await listMaintenanceRecords(token, selectedVehicleId.value, params)
                } catch (err) {
                    maintenanceRecords.value = []
                } finally {
                    loading.value = false
                }
            })
        }

        const loadReminders = async() => {
            if (!selectedVehicleId.value) {
                reminders.value = []
                return
            }
            loadingReminders.value = true
            await withOverlay(async() => {
                try {
                    const token = localStorage.getItem('token')
                    if (!token) throw new Error('You must be logged in.')
                    reminders.value = await listReminders(token, selectedVehicleId.value)
                } catch (err) {
                    reminders.value = []
                } finally {
                    loadingReminders.value = false
                }
            })
        }

        const handleVehicleChange = async() => {
            localStorage.setItem('selectedVehicleId', selectedVehicleId.value)
            await loadMaintenanceRecords()
            await loadReminders()
        }

        const debouncedSearch = () => {
            if (searchTimer) clearTimeout(searchTimer)
            searchTimer = setTimeout(() => {
                loadMaintenanceRecords()
            }, 250)
        }

        const debouncedScheduleSearch = () => {
            if (scheduleTimer) clearTimeout(scheduleTimer)
            scheduleTimer = setTimeout(() => {
                // filter is computed; no extra fetch needed
            }, 250)
        }

        const goAddMaintenance = () => {
            const query = selectedVehicleId.value ? { vehicleId: selectedVehicleId.value } : {}
            router.push({ path: '/web/car-maintenance/maintenance/add', query })
        }

        const openRecordDetail = (id) => {
            if (!id) return
            router.push(`/web/car-maintenance/maintenance/${id}`)
        }

        const goAddSchedule = () => {
            const query = selectedVehicleId.value ? { vehicleId: selectedVehicleId.value } : {}
            router.push({ path: '/web/car-maintenance/schedules/add', query })
        }

        const goLanding = () => router.push('/')

        const filteredReminders = computed(() => {
            const term = scheduleSearch.value.toLowerCase().trim()
            if (!term) return reminders.value
            return reminders.value.filter(r => {
                return [r.maintenanceType, r.title, r.description].filter(Boolean).some(f => String(f).toLowerCase().includes(term))
            })
        })
        const showLoading = computed(() => loading.value || loadingReminders.value || overlayActive.value)

        const statusFor = (reminder) => {
            const now = new Date()
            if (reminder?.completed) return { class: 'done', icon: 'check-circle', label: 'Done' }
            const due = reminder?.dueDate ? new Date(reminder.dueDate) : null
            if (due && due.getTime() < now.getTime()) return { class: 'missed', icon: 'close-circle', label: 'Missed' }
            return { class: 'upcoming', icon: 'clock-outline', label: 'Upcoming' }
        }

        const daysLeft = (reminder) => {
            if (!reminder?.dueDate) return null
            const due = new Date(reminder.dueDate)
            if (Number.isNaN(due.getTime())) return null
            const now = new Date()
            return Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }

        const deadlineText = (reminder) => {
            if (reminder?.completed) return 'Completed'
            const d = daysLeft(reminder)
            if (d === null) return 'No due date'
            if (d < 0) return 'Missed'
            if (d === 0) return 'Due today'
            if (d === 1) return 'Due tomorrow'
            return `${d} days left`
        }

        const toggleStatus = async(reminder) => {
            if (!reminder?.id) return
            await withOverlay(async() => {
                try {
                    const token = localStorage.getItem('token')
                    if (!token) throw new Error('You must be logged in.')
                    const updated = await updateReminder(token, reminder.id, { completed: !reminder.completed })
                    reminders.value = reminders.value.map(r => r.id === reminder.id ? updated : r)
                } catch (err) {
                    alert(err?.message || 'Unable to update status')
                }
            })
        }

        const filteredVehicles = computed(() => {
            const term = vehicleSearch.value.toLowerCase().trim()
            if (!term) return vehicles.value
            return vehicles.value.filter(v => {
                const name = `${v.make || ''} ${v.model || ''} ${v.year || ''}`.trim().toLowerCase()
                const plate = (v.licensePlate || '').toLowerCase()
                return name.includes(term) || plate.includes(term)
            })
        })

        const openVehicle = (id) => router.push(`/web/car-maintenance/vehicles/${id}`)
        const addVehicle = () => router.push('/web/car-maintenance/vehicles/add')
        const openScheduleDetail = (id) => router.push(`/web/car-maintenance/schedules/${id}`)

        const chartData = computed(() => {
            if (!maintenanceRecords.value.length) return []
            const totals = {}
            maintenanceRecords.value.forEach(r => {
                const type = r.maintenanceType || 'Other'
                const cost = Number(r.cost) || 0
                totals[type] = (totals[type] || 0) + cost
            })
            const sum = Object.values(totals).reduce((a, b) => a + b, 0)
            return Object.entries(totals).map(([type, cost], idx) => ({
                type,
                cost,
                percent: sum ? Math.round((cost / sum) * 100) : 0,
                color: palette[idx % palette.length]
            }))
        })

        const totalCost = computed(() => chartData.value.reduce((acc, item) => acc + item.cost, 0))

        const chartSlices = computed(() => {
            let cumulative = 0
            return chartData.value.map(item => {
                const dash = `${item.percent} ${100 - item.percent}`
                const offset = 25 - cumulative
                cumulative += (item.percent / 100) * 100
                return { dash, offset, color: item.color }
            })
        })

        const persistPreferences = async() => {
            try {
                const token = localStorage.getItem('token')
                if (token) {
                    await savePreferences(token, {
                        distanceUnit: distanceUnit.value,
                        currency: defaultCurrency.value,
                        maintenanceTypes: maintenanceTypes.value
                    })
                }
            } catch (err) {
                // fallback to local storage if backend fails
                localStorage.setItem('distanceUnit', distanceUnit.value)
                localStorage.setItem('currencyPreference', defaultCurrency.value)
                localStorage.setItem('maintenanceTypes', JSON.stringify(maintenanceTypes.value))
            }
        }

        const addType = () => {
            const value = newMaintenanceType.value.trim()
            if (!value) return
            if (!maintenanceTypes.value.includes(value)) {
                maintenanceTypes.value.push(value)
                persistPreferences()
            }
            newMaintenanceType.value = ''
        }

        const removeType = (val) => {
            maintenanceTypes.value = maintenanceTypes.value.filter(t => t !== val)
            persistPreferences()
        }

        onMounted(async() => {
            await withOverlay(async() => {
                await loadPreferences()
                await loadVehicles()
            })
        })

        // const userName = computed(() => store.state.userProfile?.fullName || 'there')
        userName.value = (store.state.userProfile?.fullName)
        userEmail.value = (store.state.userProfile?.email)
        return {
            router,
            API_BASE_URL,
            vehicles,
            filteredVehicles,
            vehicleSearch,
            selectedVehicleId,
            maintenanceRecords,
            searchTerm,
            scheduleSearch,
            loading,
            loadingReminders,
            errorMessage,
            displayName,
            formatDate,
            formatMileage,
            formatCurrency,
            currentTab,
            setTab,
            handleVehicleChange,
            debouncedSearch,
            debouncedScheduleSearch,
            goAddMaintenance,
            goAddSchedule,
            goLanding,
            openRecordDetail,
            defaultCurrency,
            reminders,
            filteredReminders,
            statusFor,
            deadlineText,
            toggleStatus,
            distanceUnit,
            chartData,
            chartSlices,
            totalCost,
            addVehicle,
            openVehicle,
            openScheduleDetail,
            userName,
            userEmail,
            maintenanceTypes,
            visibleTypes,
            currencyOptions,
            vehicleSearch,
            persistPreferences,
            setTab,
            newMaintenanceType,
            addType,
            removeType,
            showLoading,
            staggerReady
        }
    }
}
</script>

<style scoped>
/* ── Topbar ── */
.car-hero {
    background: rgba(5, 6, 10, 0.94) !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
    box-shadow: none !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 100 !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    padding: 16px 32px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    flex-wrap: wrap !important;
    gap: 16px !important;
}
.theme-light .car-hero { background: rgba(238, 242, 255, 0.96) !important; border-bottom-color: rgba(249, 115, 22, 0.1) !important; }

.brand { display: flex; align-items: center; gap: 14px; }

.logo-circle {
    width: 40px !important; height: 40px !important;
    border-radius: 12px !important;
    background: rgba(249, 115, 22, 0.12) !important;
    border: 1px solid rgba(249, 115, 22, 0.25) !important;
    color: #fb923c !important;
}

.eyebrow {
    color: #fb923c !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    margin: 0 !important;
}

.headline {
    font-size: 16px !important;
    font-weight: 700 !important;
    color: var(--text-primary) !important;
    margin: 2px 0 0 !important;
}

/* ── Tab nav ── */
.car-tabs {
    display: flex !important;
    gap: 0 !important;
    flex-wrap: nowrap !important;
    margin-top: 0 !important;
    padding: 4px !important;
    background: rgba(255, 255, 255, 0.04) !important;
    border: 1px solid rgba(255, 255, 255, 0.07) !important;
    border-radius: 12px !important;
}
.theme-light .car-tabs { background: rgba(249, 115, 22, 0.05) !important; border-color: rgba(249, 115, 22, 0.12) !important; }

.car-tabs button {
    padding: 8px 18px !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    border: none !important;
    background: transparent !important;
    color: var(--text-muted) !important;
    box-shadow: none !important;
    transition: background 0.15s, color 0.15s !important;
    cursor: pointer !important;
    white-space: nowrap !important;
}
.car-tabs button:hover { color: var(--text-primary) !important; background: rgba(255, 255, 255, 0.05) !important; }
.car-tabs button.active { background: linear-gradient(135deg, #f97316, #fb923c) !important; color: #fff !important; font-weight: 700 !important; }

/* ── Main body ── */
.car-body { padding: 28px 32px !important; max-width: 1200px !important; margin: 0 auto !important; }

/* ── Panel ── */
.car-panel {
    background: var(--glass-card-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 20px !important;
    padding: 0 !important;
    overflow: hidden !important;
    box-shadow: var(--glass-card-shadow) !important;
    position: relative !important;
}
.car-panel::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #f97316, #fb923c);
    z-index: 1;
}

.car-panel-header {
    padding: 20px 24px !important;
    border-bottom: 1px solid var(--glass-card-border) !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    gap: 16px !important;
    flex-wrap: wrap !important;
}

/* ── Search ── */
.car-search {
    display: flex !important; align-items: center !important; gap: 10px !important;
    padding: 14px 24px !important;
    border-bottom: 1px solid var(--glass-card-border) !important;
    border-top: none !important; border-left: none !important; border-right: none !important;
    border-radius: 0 !important;
    background: transparent !important;
    color: var(--text-muted) !important;
    margin-bottom: 0 !important;
    box-shadow: none !important;
}
.car-search input { border: none !important; outline: none !important; flex: 1; font-size: 14px; background: transparent; color: var(--text-primary); }

/* ── Record cards ── */
.car-records { padding: 16px 24px !important; display: grid !important; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important; gap: 12px !important; }

.car-record-card {
    background: rgba(255, 255, 255, 0.025) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-left: 3px solid #f97316 !important;
    border-radius: 14px !important;
    padding: 16px !important;
    cursor: pointer !important;
    transition: transform 0.15s, box-shadow 0.15s !important;
    box-shadow: none !important;
}
.car-record-card:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(249, 115, 22, 0.12) !important; }

.car-record-top { display: flex !important; justify-content: space-between !important; align-items: flex-start !important; gap: 8px !important; }
.car-record-title { font-size: 15px !important; font-weight: 700 !important; color: var(--text-primary) !important; margin: 0 !important; }
.car-record-date { font-size: 12px !important; color: var(--text-muted) !important; margin: 3px 0 0 !important; }
.car-record-bottom { display: flex !important; align-items: center !important; gap: 16px !important; margin-top: 10px !important; padding-top: 10px !important; border-top: 1px solid var(--glass-card-border) !important; }
.car-meta { font-size: 13px !important; color: var(--text-muted) !important; display: inline-flex !important; align-items: center !important; gap: 5px !important; }

.car-pill {
    background: rgba(249, 115, 22, 0.12) !important;
    color: #fb923c !important;
    border-radius: 8px !important;
    padding: 4px 10px !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    white-space: nowrap !important;
}

/* ── Empty state ── */
.car-empty { text-align: center !important; color: var(--text-muted) !important; font-size: 14px !important; padding: 40px 24px !important; background: transparent !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; }

/* ── Schedules ── */
.car-schedule-grid { padding: 16px 24px !important; display: grid !important; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important; gap: 12px !important; }

.car-schedule-card {
    border-left: 3px solid #f97316 !important;
    border-radius: 14px !important;
    padding: 16px !important;
    background: rgba(255, 255, 255, 0.025) !important;
    border-top: 1px solid var(--glass-card-border) !important;
    border-bottom: 1px solid var(--glass-card-border) !important;
    border-right: 1px solid var(--glass-card-border) !important;
    box-shadow: none !important;
}

.car-meta-row { display: flex !important; justify-content: space-between !important; gap: 10px !important; margin-top: 10px !important; color: var(--text-muted) !important; }

.car-status-pill { font-size: 12px !important; font-weight: 700 !important; padding: 5px 10px !important; border-radius: 8px !important; border: none !important; cursor: pointer !important; }
.car-status-pill.done { background: rgba(52, 211, 153, 0.12) !important; color: #34d399 !important; }
.car-status-pill.missed { background: rgba(248, 113, 113, 0.12) !important; color: #f87171 !important; }
.car-status-pill.upcoming { background: rgba(251, 146, 60, 0.12) !important; color: #fb923c !important; }

/* ── Report / Donut ── */
.car-chart-card { padding: 24px !important; display: grid !important; grid-template-columns: 280px 1fr !important; gap: 32px !important; align-items: center !important; }
.car-donut-total { font-size: 20px !important; font-weight: 800 !important; color: var(--text-primary) !important; margin: 0 !important; }
.car-donut-range { font-size: 12px !important; color: var(--text-muted) !important; margin: 0 !important; }
.car-legend { display: flex !important; flex-direction: column !important; gap: 12px !important; }
.car-legend-meta .label { font-size: 14px !important; font-weight: 700 !important; color: var(--text-primary) !important; margin: 0 !important; }
.car-legend-meta .value { font-size: 13px !important; color: var(--text-muted) !important; margin: 0 !important; }
.car-legend-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }

/* ── Vehicles ── */
.car-vehicle-grid { padding: 16px 24px !important; display: grid !important; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)) !important; gap: 14px !important; }
.car-vehicle-card { border-left: 3px solid #f97316 !important; border-radius: 14px !important; padding: 14px !important; }
.car-thumb { background: rgba(249, 115, 22, 0.1) !important; color: #fb923c !important; border-radius: 12px !important; border: none !important; }
.car-name { font-size: 15px !important; font-weight: 700 !important; color: var(--text-primary) !important; margin: 0 !important; }
.car-sub { font-size: 13px !important; color: var(--text-muted) !important; margin: 3px 0 0 !important; }

/* ── Settings ── */
.car-profile { padding: 20px 24px !important; margin-bottom: 0 !important; border-bottom: 1px solid var(--glass-card-border) !important; }
.car-card-grid { padding: 16px 24px !important; gap: 16px !important; display: grid !important; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important; }
.car-card {
    padding: 18px !important; border-radius: 14px !important;
    border: 1px solid var(--glass-card-border) !important;
    border-left: 3px solid rgba(249, 115, 22, 0.5) !important;
    background: rgba(255, 255, 255, 0.025) !important;
    box-shadow: none !important;
}
.car-avatar { width: 48px !important; height: 48px !important; border-radius: 14px !important; background: rgba(249, 115, 22, 0.1) !important; color: #fb923c !important; border: 1px solid rgba(249, 115, 22, 0.2) !important; }
.car-inline { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; margin-top: 10px; font-size: 14px; color: var(--text-primary); }

/* ── Inputs & Controls ── */
.car-select {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 10px !important;
    padding: 9px 12px !important;
    font-size: 14px !important;
    color: var(--text-primary) !important;
}
.car-select:focus { outline: none !important; border-color: rgba(249, 115, 22, 0.4) !important; box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.12) !important; }

.car-input {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 10px !important;
    padding: 9px 12px !important;
    font-size: 14px !important;
    color: var(--text-primary) !important;
}
.car-input:focus { outline: none !important; border-color: rgba(249, 115, 22, 0.4) !important; }

.vehicle-select label { font-size: 11px !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.06em !important; color: var(--text-muted) !important; margin-bottom: 6px !important; display: block !important; }

/* ── CTA Button ── */
.car-btn {
    background: linear-gradient(135deg, #f97316, #fb923c) !important;
    color: #fff !important;
    border-radius: 10px !important;
    padding: 9px 18px !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    border: none !important;
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3) !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    cursor: pointer !important;
}
.car-btn:disabled { opacity: 0.6 !important; cursor: not-allowed !important; }
.car-btn.ghost { background: var(--glass-ghost-bg) !important; color: var(--text-primary) !important; border: 1px solid var(--glass-card-border) !important; box-shadow: none !important; }

/* ── Chips ── */
.car-chip { background: rgba(249, 115, 22, 0.08) !important; border: 1px solid rgba(249, 115, 22, 0.2) !important; color: #fb923c !important; border-radius: 8px !important; padding: 5px 10px !important; font-size: 13px !important; font-weight: 600 !important; }
.car-chip button { color: #fb923c !important; opacity: 0.7; border: none; background: transparent; cursor: pointer; }
.car-chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }

@media (max-width: 900px) {
    .car-hero { padding: 12px 16px !important; flex-direction: column !important; align-items: flex-start !important; }
    .car-tabs { overflow-x: auto !important; width: 100% !important; }
    .car-body { padding: 16px !important; }
    .car-chart-card { grid-template-columns: 1fr !important; gap: 20px !important; padding: 16px !important; }
    .car-records, .car-schedule-grid, .car-vehicle-grid, .car-card-grid { padding: 12px 16px !important; }
    .car-panel-header { padding: 16px !important; }
    .car-search { padding: 12px 16px !important; }
}
</style>
