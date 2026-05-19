<template>
<div class="car-shell stagger-page stagger-seq" :class="{ 'stagger-ready': staggerReady }">
    <div class="car-orb one"></div>
    <div class="car-orb two"></div>
    <div class="car-hero">
        <div>
            <h2 class="car-hero-title">Vehicle Logs</h2>
            <p class="car-hero-sub">Maintenance, costs, and history</p>
        </div>
        <button class="car-icon-btn" @click="goAppHome">
            <mdicon name="home" :size="24"/>
        </button>
    </div>

    <div class="vehicle-pill car-card" @click="toggleVehiclePicker">
        <div class="avatar">
            <img v-if="selectedVehicle?.imageUrl" :src="selectedVehicle.imageUrl.startsWith('http') ? selectedVehicle.imageUrl : `${API_BASE_URL}${selectedVehicle.imageUrl}`" alt="Vehicle" />
            <mdicon v-else name="car-sports" :size="26"/>
        </div>
        <div class="vehicle-meta">
            <p class="vehicle-name">{{ selectedVehicle ? displayName(selectedVehicle) : 'Select a vehicle' }}</p>
            <p class="vehicle-type">{{ selectedVehicle?.vehicleType || '' }}</p>
            <p class="vehicle-odo" v-if="selectedVehicle">Odometer: {{ formattedOdometer }}</p>
            <p class="vehicle-updated">Last update: {{ formattedOdometerDate || '—' }}</p>
        </div>
        <div class="vehicle-actions">
            <button class="update-btn small" @click.stop="updateOdometer" :disabled="!selectedVehicle">
                Update
            </button>
            <mdicon name="chevron-down" :size="22" class="vehicle-dropdown"/>
        </div>
    </div>
    <div v-if="showVehiclePicker" class="vehicle-picker">
        <button 
            v-for="v in vehicles" 
            :key="v.id" 
            class="picker-item"
            @click.stop="selectVehicle(v.id)"
        >
            <span class="picker-name">{{ displayName(v) }}</span>
            <span class="picker-odo">Odometer: {{ formatMileage(v.currentMileage) }}</span>
        </button>
        <p v-if="!vehicles.length" class="picker-empty">No vehicles yet.</p>
    </div>

    <section class="history-section car-body">
        <div class="section-header">
            <h3>Maintenance History</h3>
        </div>

        <div class="search-bar car-card">
            <mdicon name="magnify" :size="20"/>
            <input
                v-model="searchTerm"
                type="text"
                placeholder="Search maintenance..."
                @input="debouncedSearch"
            />
        </div>
        <div v-if="errorMessage" class="empty-state">{{ errorMessage }}</div>
        <div v-else-if="loading" class="empty-state small">Loading maintenance records...</div>
        <div v-else-if="!maintenanceRecords.length" class="empty-state">
            No maintenance records yet.
        </div>
        <div 
            v-else
            class="history-card car-card"
            v-for="item in maintenanceRecords"
            :key="item.id || item._id"
            @click="openRecordDetail(item)"
        >
            <div class="history-top">
                <p class="history-title">{{ item.maintenanceType || item.title }}</p>
                <p class="history-date">{{ formatDate(item.serviceDate) }}</p>
            </div>
            <div class="history-bottom">
                <div class="history-meta">
                    <mdicon name="counter" :size="18"/>
                    <span>{{ formatMileage(item.mileageAtService) }}</span>
                </div>
                <div class="history-meta">
                    <mdicon name="cash" :size="18"/>
                    <span>{{ formatCurrency(item.cost, item.currency) }}</span>
                </div>
            </div>
        </div>
    </section>

    <div class="fab-wrapper">
        <button class="fab" @click="addMaintenance">
            <mdicon name="plus" :size="24"/>
        </button>
    </div>

    <div v-if="showOdometerModal" class="modal-backdrop" @click.self="showOdometerModal = false">
        <div class="modal">
            <p class="modal-title">Update Odometer</p>
            <p class="modal-text">Current: {{ formattedOdometer }}</p>
            <input v-model="odometerInput" type="number" min="0" class="modal-input" />
            <div class="modal-actions">
                <button class="cancel" @click="showOdometerModal = false">Cancel</button>
                <button class="confirm" :disabled="savingOdometer" @click="saveOdometer">
                    {{ savingOdometer ? 'Saving...' : 'Save' }}
                </button>
            </div>
        </div>
    </div>

    <nav class="bottom-nav glass-nav-orb">
        <button class="nav-item active" @click="goHome">
            <mdicon name="view-dashboard-outline" :size="22"/>
            <span>Dashboard</span>
        </button>
        <button class="nav-item" @click="goSchedules">
            <mdicon name="clipboard-list-outline" :size="22"/>
            <span>Schedules</span>
        </button>
        <button class="nav-item" @click="goReport">
            <mdicon name="chart-pie" :size="22"/>
            <span>Report</span>
        </button>
        <button class="nav-item" @click="goVehicles">
            <mdicon name="car" :size="22"/>
            <span>Vehicles</span>
        </button>
        <button class="nav-item" @click="goSettings">
            <mdicon name="cog-outline" :size="22"/>
            <span>Settings</span>
        </button>
    </nav>
    <Loading v-if="loadingOverlay"/>
</div>
</template>

<script>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCarMaintenance } from '@/composables/carMaintenance'
import { API_BASE_URL } from '@/constants/config'
import Loading from '@/components/Loading.vue'
import { useStaggerReady } from '@/composables/staggerReady'

export default {
    name: "CarMaintenanceMobile",
    components: {
        Loading
    },
    setup() {
        const router = useRouter()
        const showOdometerModal = ref(false)
        const odometerInput = ref('')
        const savingOdometer = ref(false)
        const { listVehicles, listMaintenanceRecords, updateVehicle, getPreferences } = useCarMaintenance()

        const vehicles = ref([])
        const selectedVehicleId = ref(localStorage.getItem('selectedVehicleId') || '')
        const maintenanceRecords = ref([])
        const searchTerm = ref('')
        const showVehiclePicker = ref(false)
        const loading = ref(false)
        const loadingOverlay = ref(false)
        const errorMessage = ref('')
        const distanceUnit = ref('km')
        const staggerReady = useStaggerReady()

        const selectedVehicle = computed(() => {
            return vehicles.value.find(v => v.id === selectedVehicleId.value) || null
        })

        const goBack = () => {
            if (window.history.length > 1) {
                router.back()
            } else {
                router.push('/car-maintenance/vehicles')
            }
        }

        const goHome = () => router.push('/car-maintenance')
        const goAppHome = () => router.push('/')
        const goSchedules = () => router.push('/car-maintenance/schedules')
        const goReport = () => router.push('/car-maintenance/report')
        const goVehicles = () => router.push('/car-maintenance/vehicles')
        const goSettings = () => router.push('/car-maintenance/settings')

        const updateOdometer = () => {
            if (!selectedVehicle.value) return
            odometerInput.value = selectedVehicle.value.currentMileage || ''
            showOdometerModal.value = true
        }

        const saveOdometer = async() => {
            if (!selectedVehicle.value) return
            savingOdometer.value = true
            try {
                await withOverlay(async() => {
                    const token = localStorage.getItem('token')
                    if (!token) throw new Error('You must be logged in.')
                    const payload = new FormData()
                    payload.append('currentMileage', odometerInput.value || '0')
                    await updateVehicle(token, selectedVehicle.value.id, payload)
                    selectedVehicle.value.currentMileage = Number(odometerInput.value) || 0
                    showOdometerModal.value = false
                })
            } catch (err) {
                alert(err?.message || 'Unable to update odometer')
            } finally {
                savingOdometer.value = false
            }
        }

        const withOverlay = async(fn) => {
            loadingOverlay.value = true
            try {
                return await fn()
            } finally {
                loadingOverlay.value = false
            }
        }

        const addMaintenance = () => {
            router.push({
                path: '/car-maintenance/maintenance/add',
                query: selectedVehicleId.value ? { vehicleId: selectedVehicleId.value } : {}
            })
        }

        const addVehicle = () => {
            router.push('/car-maintenance/vehicles/add')
        }

        const openHistory = () => {
            alert('Open maintenance history')
        }

        const openRecordDetail = (record) => {
            const id = record?.id || record?._id
            if (!id) return
            const query = record?.vehicleId ? { vehicleId: record.vehicleId } : {}
            router.push({ path: `/car-maintenance/maintenance/${id}`, query })
        }

        const formattedOdometer = computed(() => {
            const value = selectedVehicle.value?.currentMileage
            if (value === null || value === undefined) return '—'
            const converted = distanceUnit.value === 'mi' ? Number(value) * 0.621371 : Number(value)
            const unitLabel = distanceUnit.value === 'mi' ? 'mi' : 'km'
            return `${Math.round(converted).toLocaleString()} ${unitLabel}`
        })

        const formattedOdometerDate = computed(() => formatDate(selectedVehicle.value?.updatedAt || selectedVehicle.value?.createdAt))

        const formatDate = (value) => {
            if (!value) return ''
            const date = value instanceof Date ? value : new Date(value)
            if (Number.isNaN(date.getTime())) return ''
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
                return new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency
                }).format(value)
            } catch (e) {
                return `${value.toLocaleString()} ${currency}`
            }
        }

        const loadVehicles = async() => {
            errorMessage.value = ''
            await withOverlay(async() => {
                try {
                    const token = localStorage.getItem('token')
                    if (!token) throw new Error('You must be logged in.')
                    const data = await listVehicles(token)
                    vehicles.value = data
                    const preferred = data.find(v => v.id === selectedVehicleId.value)
                    const targetId = preferred ? preferred.id : data[0]?.id || ''
                    selectedVehicleId.value = targetId
                    if (targetId) {
                        localStorage.setItem('selectedVehicleId', targetId)
                        await loadMaintenanceRecords(targetId, searchTerm.value)
                    } else {
                        localStorage.removeItem('selectedVehicleId')
                        maintenanceRecords.value = []
                        router.push('/car-maintenance/vehicles')
                    }
                } catch (err) {
                    errorMessage.value = err?.message || 'Unable to load vehicles'
                    vehicles.value = []
                    maintenanceRecords.value = []
                }
            })
        }

        const loadMaintenanceRecords = async(vehicleId, search = '') => {
            if (!vehicleId) {
                maintenanceRecords.value = []
                return
            }
            loading.value = true
            try {
                const token = localStorage.getItem('token')
                if (!token) throw new Error('You must be logged in.')
                const params = new URLSearchParams()
                params.append('vehicleId', vehicleId)
                if (search) params.append('search', search)
                maintenanceRecords.value = await listMaintenanceRecords(token, vehicleId, params)
            } catch (err) {
                console.error(err)
                maintenanceRecords.value = []
            } finally {
                loading.value = false
            }
        }

        const toggleVehiclePicker = () => {
            showVehiclePicker.value = !showVehiclePicker.value
        }

        const selectVehicle = async(vehicleId) => {
            selectedVehicleId.value = vehicleId
            showVehiclePicker.value = false
            localStorage.setItem('selectedVehicleId', vehicleId)
            await withOverlay(() => loadMaintenanceRecords(vehicleId, searchTerm.value))
        }

        const loadPreferences = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                const prefs = await getPreferences(token)
                if (prefs?.distanceUnit) distanceUnit.value = prefs.distanceUnit
            } catch (err) {
                distanceUnit.value = 'km'
            }
        }

        onMounted(() => {
            loadVehicles()
            loadPreferences()
        })

        let searchTimer = null
        const debouncedSearch = () => {
            if (searchTimer) clearTimeout(searchTimer)
            searchTimer = setTimeout(() => {
                if (selectedVehicleId.value) {
                    withOverlay(() => loadMaintenanceRecords(selectedVehicleId.value, searchTerm.value))
                }
            }, 300)
        }

        const displayName = (vehicle) => {
            if (!vehicle) return 'Vehicle'
            const parts = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean)
            return parts.join(' ').trim() || 'Vehicle'
        }

        return {
            goBack,
            vehicles,
            selectedVehicle,
            maintenanceRecords,
            formattedOdometer,
            formattedOdometerDate,
            formatDate,
            formatMileage,
            formatCurrency,
            updateOdometer,
            addMaintenance,
            openHistory,
            goHome,
            goAppHome,
            goSchedules,
            goReport,
            goVehicles,
            goSettings,
            addVehicle,
            searchTerm,
            debouncedSearch,
            showVehiclePicker,
            toggleVehiclePicker,
            selectVehicle,
            selectedVehicleId,
            loading,
            loadingOverlay,
            errorMessage,
            displayName,
            distanceUnit,
            API_BASE_URL,
            openRecordDetail,
            showOdometerModal,
            odometerInput,
            saveOdometer,
            savingOdometer,
            staggerReady
        }
    }
}
</script>

<style scoped>
/* Hero — orange gradient */
.car-hero { background: linear-gradient(135deg, #c2410c, #f97316) !important; padding: 20px 16px !important; }

/* Vehicle pill — rounded glass card */
.vehicle-pill {
    margin: 16px 16px 0;
    background: var(--glass-card-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 16px !important;
    padding: 14px 16px !important;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: var(--glass-card-shadow) !important;
}
.vehicle-pill::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #f97316, #fb923c);
}
.avatar {
    width: 48px; height: 48px;
    border-radius: 14px;
    background: rgba(249, 115, 22, 0.12);
    border: 1px solid rgba(249, 115, 22, 0.2) !important;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    color: #fb923c;
    flex-shrink: 0;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.vehicle-meta { flex: 1; min-width: 0; }
.vehicle-meta p { margin: 0; }
.vehicle-name { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.vehicle-type { font-size: 12px; color: var(--text-muted); margin-top: 1px; }
.vehicle-odo { font-size: 13px; color: var(--text-primary); font-weight: 600; margin-top: 3px; }
.vehicle-updated { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
.vehicle-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.vehicle-dropdown { color: var(--text-muted); }
.update-btn {
    background: rgba(249, 115, 22, 0.1);
    border: 1px solid rgba(249, 115, 22, 0.25) !important;
    color: #fb923c;
    padding: 6px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: none !important;
}

/* Vehicle picker dropdown */
.vehicle-picker {
    background: var(--glass-card-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 12px !important;
    margin: 8px 16px 0;
    overflow: hidden;
    box-shadow: var(--glass-card-shadow);
}
.picker-item { width: 100%; border: none; background: transparent; padding: 12px 16px; text-align: left; display: flex; flex-direction: column; gap: 2px; cursor: pointer; transition: background 0.15s; }
.picker-item:hover { background: rgba(249, 115, 22, 0.06); }
.picker-item + .picker-item { border-top: 1px solid var(--glass-card-border); }
.picker-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.picker-odo { font-size: 12px; color: var(--text-muted); }
.picker-empty { margin: 0; padding: 12px 16px; color: var(--text-muted); font-size: 13px; }

/* History section */
.history-section { padding: 16px 16px 90px !important; display: flex !important; flex-direction: column !important; gap: 8px !important; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; padding: 0; }
.section-header h3 { margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary); }

/* Search bar */
.search-bar {
    display: flex !important; align-items: center !important; gap: 10px !important;
    background: var(--glass-card-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 12px !important;
    padding: 11px 14px !important;
    box-shadow: var(--glass-card-shadow) !important;
    color: var(--text-muted);
    margin-bottom: 0 !important;
}
.search-bar input { border: none !important; outline: none !important; flex: 1; font-size: 14px; background: transparent; color: var(--text-primary); }

/* History cards */
.history-card {
    background: var(--glass-card-bg) !important;
    border-top: 1px solid var(--glass-card-border) !important;
    border-bottom: 1px solid var(--glass-card-border) !important;
    border-right: 1px solid var(--glass-card-border) !important;
    border-left: 3px solid #f97316 !important;
    border-radius: 14px !important;
    padding: 14px 16px !important;
    margin-top: 0 !important;
    cursor: pointer;
    box-shadow: var(--glass-card-shadow) !important;
    display: flex; flex-direction: column;
    transition: transform 0.15s, box-shadow 0.15s;
}
.history-card:active { transform: scale(0.99); }
.history-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.history-title { margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary); }
.history-date { margin: 0; font-size: 12px; color: var(--text-muted); }
.history-bottom { display: flex; align-items: center; gap: 16px; font-size: 13px; color: var(--text-muted); padding-top: 8px; border-top: 1px solid var(--glass-card-border); margin-top: 6px; }
.history-meta { display: inline-flex; align-items: center; gap: 5px; }

/* Empty state */
.empty-state {
    text-align: center !important; color: var(--text-muted) !important; font-size: 14px !important;
    padding: 32px 16px !important;
    background: var(--glass-card-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 14px !important;
    box-shadow: none !important;
}

/* FAB */
.fab-wrapper { position: fixed; bottom: 76px; right: 16px; }
.fab {
    width: 56px; height: 56px; border-radius: 18px; border: none;
    background: linear-gradient(135deg, #f97316, #fb923c);
    color: #fff;
    box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);
    display: flex; align-items: center; justify-content: center; cursor: pointer;
}

/* Bottom nav */
.bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0;
    display: grid; grid-template-columns: repeat(5, 1fr);
    background: rgba(5, 6, 10, 0.92);
    border-top: 1px solid var(--glass-card-border);
    padding: 8px 4px 10px;
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    z-index: 100;
}
.theme-light .bottom-nav { background: rgba(238, 242, 255, 0.94); }
.nav-item { border: none; background: transparent; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; padding: 4px 0; cursor: pointer; transition: color 0.15s; }
.nav-item.active { color: #fb923c; font-weight: 700; }

/* Odometer modal */
.modal-backdrop { position: fixed; inset: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 3000; }
.modal {
    display: block; position: relative;
    background: var(--glass-card-bg); border: 1px solid var(--glass-card-border);
    border-radius: 20px; padding: 20px;
    width: 90%; max-width: 340px; height: auto;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
    overflow: hidden;
}
.modal::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #f97316, #fb923c); }
.modal-title { margin: 0 0 6px; font-size: 16px; font-weight: 700; color: var(--text-primary); }
.modal-text { margin: 0 0 14px; font-size: 13px; color: var(--text-muted); }
.modal-input { width: 100%; border: 1px solid var(--glass-card-border); border-radius: 12px; padding: 11px 14px; font-size: 16px; margin-bottom: 16px; background: var(--glass-ghost-bg); color: var(--text-primary); box-sizing: border-box; }
.modal-input:focus { outline: none; border-color: rgba(249, 115, 22, 0.5); }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.modal-actions .cancel { background: var(--glass-ghost-bg); border: 1px solid var(--glass-card-border); color: var(--text-muted); padding: 9px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
.modal-actions .confirm { background: linear-gradient(135deg, #f97316, #fb923c); border: none; color: #fff; padding: 9px 16px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; }
.modal-actions .confirm:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
