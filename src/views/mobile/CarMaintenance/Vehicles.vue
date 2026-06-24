<template>
<div class="car-shell stagger-page stagger-seq" :class="{ 'stagger-ready': staggerReady }">
    <div class="car-orb one"></div>
    <div class="car-orb two"></div>
    <CarTopBar title="Vehicles" subtitle="Manage your garage" />

    <div class="car-body">
        <div class="car-search car-card">
            <mdicon name="magnify" :size="20" />
            <input v-model="search" type="text" placeholder="Search vehicle" />
        </div>

        <div class="car-list">
            <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
            <template v-if="filteredVehicles.length">
                <div
                    class="vehicle-card car-card"
                    v-for="vehicle in filteredVehicles"
                    :key="vehicle.id"
                    @click="openDetail(vehicle.id)"
                >
                    <div class="vehicle-thumb">
                        <img 
                            v-if="vehicle.imageUrl" 
                            :src="vehicle.imageUrl.startsWith('http') ? vehicle.imageUrl : `${API_BASE_URL}${vehicle.imageUrl}`" 
                            alt="Vehicle" 
                        />
                        <mdicon v-else name="clipboard-list-outline" :size="24"/>
                    </div>
                    <div class="vehicle-info">
                        <p class="vehicle-name">{{ displayName(vehicle) }}</p>
                        <div class="info-row">
                            <span class="label">License Plate</span>
                            <span class="value">{{ formatValue(vehicle.licensePlate) }}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">VIN</span>
                            <span class="value">{{ formatValue(vehicle.vin) }}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Reg. Exp. Date</span>
                            <span class="value"><em>{{ formatExpiry(vehicle.registrationExpiryDate) }}</em></span>
                        </div>
                    </div>
                </div>
            </template>
            <div v-else class="car-empty">
                <div class="icon-circle teal">
                    <mdicon name="car" :size="24" />
                </div>
                <h4>No vehicles yet</h4>
                <p class="sub">Create your first vehicle to start tracking maintenance and schedules.</p>
                <div class="empty-actions">
                    <button class="car-btn" type="button" @click="addVehicle">
                        <mdicon name="plus" :size="18" />
                        <span>Add vehicle</span>
                    </button>
                    <button class="car-btn ghost" type="button" @click="goHome">
                        <mdicon name="home" :size="18" />
                        <span>Home</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <button class="car-fab wide" @click="addVehicle">
        <mdicon name="car" :size="20"/>
        <span>Add vehicle</span>
    </button>

    <nav class="car-bottom-nav glass-nav-orb">
        <button class="car-nav-item" @click="goDashboard">
            <mdicon name="view-dashboard-outline" :size="22"/>
            <span>Dashboard</span>
        </button>
        <button class="car-nav-item" @click="goSchedules">
            <mdicon name="clipboard-list-outline" :size="22"/>
            <span>Schedules</span>
        </button>
        <button class="car-nav-item" @click="goReport">
            <mdicon name="chart-pie" :size="22"/>
            <span>Report</span>
        </button>
        <button class="car-nav-item active">
            <mdicon name="car" :size="22"/>
            <span>Vehicles</span>
        </button>
        <button class="car-nav-item" @click="goSettings">
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
import { useStaggerReady } from '@/composables/staggerReady'

export default {
    name: 'CarMaintenanceVehiclesMobile',
    components: {
        Loading,
        CarTopBar
    },
    setup() {
        const router = useRouter()
        const { listVehicles } = useCarMaintenance()
        const search = ref('')
        const vehicles = ref([])
        const errorMessage = ref('')
        const openMenuId = ref('')
        const loadingOverlay = ref(false)
        const staggerReady = useStaggerReady()

        const goHome = () => router.push('/car-maintenance')
        const goDashboard = () => router.push('/car-maintenance')
        const goSchedules = () => router.push('/car-maintenance/schedules')
        const goSettings = () => router.push('/car-maintenance/settings')
        const goReport = () => router.push('/car-maintenance/report')
        const addVehicle = () => router.push('/car-maintenance/vehicles/add')

        const withOverlay = async(fn) => {
            loadingOverlay.value = true
            try {
                return await fn()
            } finally {
                loadingOverlay.value = false
            }
        }

        const openDetail = (id) => {
            if (!id) return
            router.push(`/car-maintenance/vehicles/${id}`)
        }

        const loadVehicles = async() => {
            errorMessage.value = ''
            await withOverlay(async() => {
                try {
                    const token = localStorage.getItem('token')
                    if (!token) throw new Error('You must be logged in.')
                    vehicles.value = await listVehicles(token)
                } catch (err) {
                    errorMessage.value = err?.message || 'Unable to load vehicles'
                    vehicles.value = []
                }
            })
        }

        const filteredVehicles = computed(() => {
            const term = search.value.toLowerCase()
            return vehicles.value.filter(v => {
                const name = `${v.make || ''} ${v.model || ''} ${v.year || ''}`.trim()
                return name.toLowerCase().includes(term)
            })
        })

        const displayName = (vehicle) => {
            const parts = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean)
            return parts.join(' ').trim() || 'Vehicle'
        }

        const formatValue = (value, fallback = 'No data') => value || fallback

        const formatExpiry = (value) => value || '(No date set)'

        onMounted(() => {
            loadVehicles()
        })

        return {
            search,
            vehicles,
            filteredVehicles,
            errorMessage,
            goHome,
            goDashboard,
            goSchedules,
            goSettings,
            goReport,
            displayName,
            formatValue,
            formatExpiry,
            openDetail,
            addVehicle,
            API_BASE_URL,
            loadingOverlay,
            staggerReady
        }
    }
}
</script>

<style scoped>
/* ── Hero ── */

/* ── Body ── */
.car-body { padding: 16px 16px 90px !important; display: flex !important; flex-direction: column !important; gap: 8px !important; }

/* ── Search bar ── */
.car-search {
  display: flex !important; align-items: center !important; gap: 10px !important;
  background: var(--glass-card-bg) !important;
  border: 1px solid var(--glass-card-border) !important;
  border-radius: 12px !important;
  padding: 11px 14px !important;
  box-shadow: var(--glass-card-shadow) !important;
  color: var(--text-muted);
}
.car-search input { border: none !important; outline: none !important; flex: 1; font-size: 14px; background: transparent; color: var(--text-primary); }

/* ── Vehicle cards ── */
.vehicle-card {
  background: var(--glass-card-bg) !important;
  border-top: 1px solid var(--glass-card-border) !important;
  border-bottom: 1px solid var(--glass-card-border) !important;
  border-right: 1px solid var(--glass-card-border) !important;
  border-left: 3px solid #f97316 !important;
  border-radius: 14px !important;
  padding: 14px 16px !important;
  box-shadow: var(--glass-card-shadow) !important;
  display: flex;
  gap: 14px;
  cursor: pointer;
  transition: transform 0.15s;
}
.vehicle-card:active { transform: scale(0.99); }

.vehicle-thumb {
  width: 60px; height: 60px;
  border-radius: 12px;
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.2) !important;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  color: #fb923c;
  flex-shrink: 0;
}
.vehicle-thumb img { width: 100%; height: 100%; object-fit: cover; }

.vehicle-info { flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.vehicle-name { margin: 0; font-weight: 800; font-size: 15px; color: var(--text-primary); }
.info-row { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.label { font-weight: 700; text-transform: uppercase; font-size: 11px; color: var(--text-muted); flex-shrink: 0; }
.value { color: var(--text-primary); font-weight: 600; }

/* ── Empty state ── */
.car-empty {
  text-align: center !important;
  color: var(--text-muted) !important;
  font-size: 14px !important;
  padding: 40px 16px !important;
  background: var(--glass-card-bg) !important;
  border: 1px solid var(--glass-card-border) !important;
  border-radius: 18px !important;
  box-shadow: none !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 6px !important;
}
.car-empty h4 { margin: 0; font-size: 16px; font-weight: 800; color: var(--text-primary); }
.sub { margin: 0; color: var(--text-muted); font-size: 13px; }

.icon-circle {
  width: 48px; height: 48px;
  border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
  background: rgba(249, 115, 22, 0.15);
  border: 1px solid rgba(249, 115, 22, 0.25);
  color: #fb923c;
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.2);
}

.empty-actions { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; align-items: stretch; width: 100%; max-width: 260px; }
.empty-actions .car-btn {
  background: linear-gradient(135deg, #f97316, #fb923c) !important;
  color: #fff !important;
  border: none !important;
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.35) !important;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.empty-actions .car-btn.ghost {
  background: var(--glass-ghost-bg) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--glass-card-border) !important;
  box-shadow: none !important;
}

/* ── FAB ── */
.car-fab {
  background: linear-gradient(135deg, #f97316, #fb923c) !important;
  color: #fff !important;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4) !important;
  border-radius: 18px !important;
}

/* ── Bottom nav ── */
.car-bottom-nav {
  background: rgba(5, 6, 10, 0.92) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
}
.theme-light .car-bottom-nav { background: rgba(238, 242, 255, 0.94) !important; }
.car-nav-item.active { color: #fb923c !important; font-weight: 700; }

.error-text { color: #f87171; margin: 0; font-size: 13px; }
</style>
