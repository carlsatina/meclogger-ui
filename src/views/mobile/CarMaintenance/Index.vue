<template>
<div class="car-shell stagger-page stagger-seq" :class="{ 'stagger-ready': staggerReady }">
    <div class="car-orb one"></div>
    <div class="car-orb two"></div>
    <CarTopBar title="Vehicle Logs" subtitle="Maintenance, costs, and history" />

    <div class="vehicle-card-host">
        <VehicleCard
            :vehicle="selectedVehicle"
            :vehicles="vehicles"
            :odometer="formattedOdometer"
            :last-update="formattedOdometerDate"
            :format-mileage="formatMileage"
            @update="updateOdometer"
            @select="selectVehicle"
        />
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
                <p class="history-cost">{{ formatCurrency(item.cost, item.currency) }}</p>
            </div>
            <p class="history-meta-line">{{ [formatDate(item.serviceDate), item.servicedBy, item.partsUsed].filter(Boolean).join('  ·  ') }}</p>
        </div>
    </section>

    <div class="fab-wrapper">
        <button class="fab" @click="addMaintenance">
            <mdicon name="plus" :size="20"/>
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
import CarTopBar from '@/components/CarMaintenance/CarTopBar.vue'
import VehicleCard from '@/components/CarMaintenance/VehicleCard.vue'
import { useStaggerReady } from '@/composables/staggerReady'

export default {
    name: "CarMaintenanceMobile",
    components: {
        Loading,
        CarTopBar,
        VehicleCard
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
        const loading = ref(false)
        const loadingOverlay = ref(false)
        const errorMessage = ref('')
        const distanceUnit = ref('km')
        const staggerReady = useStaggerReady()

        const selectedVehicle = computed(() => {
            return vehicles.value.find(v => v.id === selectedVehicleId.value) || null
        })

        const goHome = () => router.push('/car-maintenance')
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

        const selectVehicle = async(vehicleId) => {
            selectedVehicleId.value = vehicleId
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


        return {
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
            goSchedules,
            goReport,
            goVehicles,
            goSettings,
            addVehicle,
            searchTerm,
            debouncedSearch,
            selectVehicle,
            selectedVehicleId,
            loading,
            loadingOverlay,
            errorMessage,
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
/* Vehicle card host — spacing around the shared VehicleCard component */
.vehicle-card-host { margin: 16px 16px 0; }

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
    border-radius: 12px !important;
    padding: 10px 14px !important;
    margin-top: 0 !important;
    cursor: pointer;
    box-shadow: var(--glass-card-shadow) !important;
    display: flex; flex-direction: column; gap: 2px;
    transition: transform 0.15s, box-shadow 0.15s;
}
.history-card:active { transform: scale(0.99); }
.history-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.history-title { margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.history-cost { margin: 0; flex-shrink: 0; font-size: 14px; font-weight: 700; color: var(--text-primary); }
.history-meta-line { margin: 0; font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

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
.fab-wrapper { position: fixed; bottom: 84px; right: 16px; }
.fab {
    width: 46px; height: 46px; border-radius: 14px; border: none;
    background: linear-gradient(135deg, #f97316, #fb923c);
    color: #fff;
    box-shadow: 0 6px 18px rgba(249, 115, 22, 0.38);
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
}
.fab:active { transform: scale(0.93); }

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
