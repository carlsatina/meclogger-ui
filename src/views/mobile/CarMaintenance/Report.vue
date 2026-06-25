<template>
<div class="car-shell stagger-page stagger-seq" :class="{ 'stagger-ready': staggerReady }">
    <div class="car-orb one"></div>
    <div class="car-orb two"></div>
    <CarTopBar title="Report" subtitle="Service cost breakdown" />

    <div class="car-body">
        <div class="report-card" v-if="chartData.length">
            <div class="chart-placeholder">
                <div class="donut">
                    <div 
                        class="donut-segment" 
                        v-for="(slice, idx) in chartData" 
                        :key="slice.label"
                        :style="segmentStyle(slice, idx)"
                    ></div>
                </div>
            </div>
            <div class="total">
                <p class="total-label">Total : {{ formatCurrency(totalCost, currency) }}</p>
                <p class="total-range">{{ dateRange }}</p>
            </div>
        </div>

        <div v-else class="car-empty">
            <div class="icon-circle teal">
                <mdicon name="chart-donut" :size="22" />
            </div>
            <h4>No reports yet</h4>
            <p class="sub">Log maintenance for your vehicles to see reports here.</p>
        </div>

        <div class="legend" v-if="legendData.length">
            <div class="legend-row" v-for="item in legendData" :key="item.label">
                <span class="dot" :style="{ background: item.color }">{{ item.percent }}%</span>
                <span class="legend-text">{{ item.label }}</span>
                <span class="legend-value">{{ formatCurrency(item.cost, currency) }}</span>
            </div>
        </div>
    </div>

    <nav class="car-bottom-nav glass-nav-orb">
        <button class="car-nav-item" @click="goHome">
            <mdicon name="view-dashboard-outline" :size="22"/>
            <span>Dashboard</span>
        </button>
        <button class="car-nav-item" @click="goSchedules">
            <mdicon name="clipboard-list-outline" :size="22"/>
            <span>Schedules</span>
        </button>
        <button class="car-nav-item active">
            <mdicon name="chart-pie" :size="22"/>
            <span>Report</span>
        </button>
        <button class="car-nav-item" @click="goVehicles">
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCarMaintenance } from '@/composables/carMaintenance'
import Loading from '@/components/Loading.vue'
import CarTopBar from '@/components/CarMaintenance/CarTopBar.vue'
import { useStaggerReady } from '@/composables/staggerReady'

export default {
    name: 'CarMaintenanceReportMobile',
    components: {
        Loading,
        CarTopBar
    },
    setup() {
        const router = useRouter()
        const { listVehicles, listMaintenanceRecords } = useCarMaintenance()
        const vehicles = ref([])
        const selectedVehicleId = ref(localStorage.getItem('selectedVehicleId') || '')
        const records = ref([])
        const currency = ref('USD')
        const loadingOverlay = ref(false)
        const staggerReady = useStaggerReady()

        const withOverlay = async(fn) => {
            loadingOverlay.value = true
            try {
                return await fn()
            } finally {
                loadingOverlay.value = false
            }
        }

        const goHome = () => router.push('/car-maintenance')
        const goSchedules = () => router.push('/car-maintenance/schedules')
        const goVehicles = () => router.push('/car-maintenance/vehicles')
        const goSettings = () => router.push('/car-maintenance/settings')

        const handleVehicleChange = async() => {
            await withOverlay(async() => {
                await loadRecords()
            })
        }

        const loadVehicles = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                vehicles.value = await listVehicles(token)
                const preferred = vehicles.value.find(v => v.id === selectedVehicleId.value)
                selectedVehicleId.value = preferred ? preferred.id : vehicles.value[0]?.id || ''
            } catch (err) {
                vehicles.value = []
            }
        }

        const loadRecords = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token || !selectedVehicleId.value) {
                    records.value = []
                    return
                }
                records.value = await listMaintenanceRecords(token, selectedVehicleId.value)
            } catch (err) {
                records.value = []
            }
        }

        const totalCost = computed(() => {
            return records.value.reduce((sum, rec) => sum + (rec.cost || 0), 0)
        })

        const legendData = computed(() => {
            if (!records.value.length || totalCost.value === 0) return []
            const colors = ['#a03364', '#824f79', '#23a127', '#f39c12', '#4f46e5']
            return records.value.map((rec, idx) => {
                const cost = rec.cost || 0
                const percent = Math.round((cost / totalCost.value) * 100)
                return {
                    label: rec.title || rec.maintenanceType,
                    cost,
                    percent,
                    color: colors[idx % colors.length]
                }
            })
        })

        const chartData = computed(() => legendData.value)

        const dateRange = computed(() => {
            if (!records.value.length) return ''
            const dates = records.value
                .map(rec => new Date(rec.serviceDate))
                .filter(d => !Number.isNaN(d.getTime()))
                .sort((a, b) => a - b)
            if (!dates.length) return ''
            const start = dates[0]
            const end = dates[dates.length - 1]
            const fmt = (d) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
            return `${fmt(start)} - ${fmt(end)}`
        })

        const formatCurrency = (value, cur = 'USD') => {
            if (value === null || value === undefined) return '—'
            try {
                return new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency: cur
                }).format(value)
            } catch (e) {
                return `${value.toLocaleString()} ${cur}`
            }
        }

        const segmentStyle = (slice, idx) => {
            const offset = legendData.value.slice(0, idx).reduce((sum, s) => sum + s.percent, 0)
            return {
                background: `conic-gradient(${slice.color} ${slice.percent}%, transparent 0)`,
                transform: `rotate(${offset * 3.6}deg)`
            }
        }

        onMounted(async() => {
            await withOverlay(async() => {
                await loadVehicles()
                await loadRecords()
            })
        })

        return {
            goHome,
            goSchedules,
            goVehicles,
            goSettings,
            records,
            chartData,
            legendData,
            totalCost,
            dateRange,
            formatCurrency,
            currency,
            segmentStyle,
            loadingOverlay,
            handleVehicleChange,
            staggerReady
        }
    }
}
</script>

<style scoped>
/* ── Hero ── */

/* ── Body — full width, no boxed cards ── */
.car-body { padding: 8px 0 90px !important; display: flex !important; flex-direction: column !important; gap: 0 !important; }

/* ── Chart section (full width) ── */
.report-card {
  padding: 20px 16px 24px !important;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  border-bottom: 1px solid var(--glass-card-border);
}

.chart-placeholder {
  width: 200px;
  height: 200px;
  display: grid;
  place-items: center;
}

.donut {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  background: rgba(249, 115, 22, 0.06);
  border: 1px solid rgba(249, 115, 22, 0.18);
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.12), 0 0 0 6px rgba(249, 115, 22, 0.06);
}

.donut-segment { position: absolute; inset: 0; }

.total { text-align: center; }
.total-label { margin: 0; font-size: 16px; font-weight: 800; color: var(--text-primary); }
.total-range { margin: 4px 0 0; font-size: 12px; color: var(--text-muted); }

/* ── Legend (full-width list) ── */
.legend {
  display: flex;
  flex-direction: column;
}

.legend-row {
  display: grid;
  grid-template-columns: 70px 1fr auto;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
  padding: 12px 16px;
  border-bottom: 1px solid var(--glass-card-border);
}
.legend-row:last-of-type { border-bottom: none; }

.dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 8px;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.legend-text { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.legend-value { font-size: 14px; font-weight: 800; color: var(--text-primary); }

/* ── Empty state ── */
.car-empty {
  text-align: center !important;
  color: var(--text-muted) !important;
  font-size: 14px !important;
  padding: 56px 16px !important;
  background: transparent !important;
  border: none !important;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  background: rgba(249, 115, 22, 0.15);
  border: 1px solid rgba(249, 115, 22, 0.25);
  color: #fb923c;
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.2);
}

/* ── Bottom nav ── */
.car-bottom-nav {
  background: rgba(5, 6, 10, 0.92) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
}
.theme-light .car-bottom-nav { background: rgba(238, 242, 255, 0.94) !important; }
.car-nav-item.active { color: #fb923c !important; font-weight: 700; }
</style>
