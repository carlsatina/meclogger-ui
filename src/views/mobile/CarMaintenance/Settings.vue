<template>
<div class="car-shell stagger-page stagger-seq" :class="{ 'stagger-ready': staggerReady }">
    <div class="car-orb one"></div>
    <div class="car-orb two"></div>
    <CarTopBar title="Settings" subtitle="Personalize your maintenance" />

    <div class="car-body settings-body">
        <div class="profile-card car-card">
            <div class="avatar">
                <mdicon name="account-circle" :size="42"/>
            </div>
            <div class="profile-meta">
                <p class="name">{{ userName }}</p>
                <p class="email">{{ userEmail }}</p>
            </div>
        </div>

        <div class="settings-group car-card">
            <p class="group-title">Preferences</p>
            <div class="settings-item static">
                <div class="item-left">
                    <mdicon name="map-marker-distance" :size="20"/>
                    <span>Distance Unit</span>
                </div>
                <select v-model="distanceUnit" @change="persistPreferences" class="inline-select car-select">
                    <option value="km">Kilometers</option>
                    <option value="mi">Miles</option>
                </select>
            </div>
            <div class="settings-item static">
                <div class="item-left">
                    <mdicon name="currency-usd" :size="20"/>
                    <span>Currency</span>
                </div>
                <select v-model="currency" @change="persistPreferences" class="inline-select car-select">
                    <option value="USD">USD</option>
                    <option value="PHP">PHP</option>
                    <option value="EUR">EUR</option>
                    <option value="JPY">JPY</option>
                    <option value="SGD">SGD</option>
                </select>
            </div>
            <div class="settings-item static column">
                <div class="item-left">
                    <mdicon name="wrench-outline" :size="20"/>
                    <span>Maintenance Types</span>
                </div>
                <div class="type-row">
                    <input v-model="newMaintenanceType" type="text" placeholder="Add maintenance type" class="car-input" />
                    <button class="add-btn car-btn" type="button" @click="addMaintenanceType">Add</button>
                </div>
                <div class="chip-row">
                    <span v-for="t in maintenanceTypes" :key="t" class="chip">
                        {{ t }}
                        <button class="chip-remove" type="button" @click="removeType(t)">
                            <mdicon name="close" :size="14"/>
                        </button>
                    </span>
                </div>
            </div>
        </div>
    </div>

    <nav class="car-bottom-nav glass-nav-orb">
        <button class="car-nav-item" @click="goHome">
            <mdicon name="home" :size="22"/>
            <span>Home</span>
        </button>
        <button class="car-nav-item" @click="goSchedules">
            <mdicon name="clipboard-list-outline" :size="22"/>
            <span>Schedules</span>
        </button>
        <button class="car-nav-item">
            <mdicon name="chart-pie" :size="22"/>
            <span>Report</span>
        </button>
        <button class="car-nav-item" @click="goVehicles">
            <mdicon name="car" :size="22"/>
            <span>Vehicles</span>
        </button>
        <button class="car-nav-item active">
            <mdicon name="cog-outline" :size="22"/>
            <span>Settings</span>
        </button>
    </nav>
    <Loading v-if="loadingOverlay"/>
</div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCarMaintenance } from '@/composables/carMaintenance'
import Loading from '@/components/Loading.vue'
import CarTopBar from '@/components/CarMaintenance/CarTopBar.vue'
import { useStaggerReady } from '@/composables/staggerReady'

import store from '@/store'
export default {
    name: 'CarMaintenanceSettingsMobile',
    components: {
        Loading,
        CarTopBar
    },
    setup() {
        const router = useRouter()
        const { getPreferences, savePreferences } = useCarMaintenance()
        const defaultMaintenanceTypes = [
            'Oil Change',
            'Brake Pad Replacement',
            'Tire Rotation',
            'Tire Replacement',
            'Battery Replacement',
            'Air Filter Replacement',
            'Transmission Service',
            'Coolant Flush',
            'Spark Plug Replacement',
            'Brake Fluid Change',
            'Alignment',
            'Inspection',
            'Repair'
        ]
        const userName = ref('User')
        const userEmail = ref('user@example.com')
        const distanceUnit = ref('km')
        const currency = ref('USD')
        const maintenanceTypes = ref([...defaultMaintenanceTypes])
        const newMaintenanceType = ref('')
        const loadingOverlay = ref(false)
        const aiProvider = ref('')
        const aiApiKey = ref('')
        const staggerReady = useStaggerReady()

        const withOverlay = async(fn) => {
            loadingOverlay.value = true
            try {
                return await fn()
            } finally {
                loadingOverlay.value = false
            }
        }

        const goHome = () => router.push('/')
        const goSchedules = () => router.push('/car-maintenance/schedules')
        const goVehicles = () => router.push('/car-maintenance/vehicles')

        const persistPreferences = async() => {
            await withOverlay(async() => {
                try {
                    const token = localStorage.getItem('token')
                    if (!token) throw new Error('You must be logged in.')
                    await savePreferences(token, {
                        distanceUnit: distanceUnit.value,
                        currency: currency.value,
                        maintenanceTypes: maintenanceTypes.value,
                        aiProvider: aiProvider.value,
                        aiApiKey: aiApiKey.value
                    })
                } catch (err) {
                    // fallback to local storage
                    localStorage.setItem('distanceUnit', distanceUnit.value)
                    localStorage.setItem('currencyPreference', currency.value)
                    localStorage.setItem('maintenanceTypes', JSON.stringify(maintenanceTypes.value))
                }
            })
        }

        const addMaintenanceType = () => {
            const value = newMaintenanceType.value.trim()
            if (!value) return
            if (!maintenanceTypes.value.includes(value)) {
                maintenanceTypes.value.push(value)
                persistPreferences()
            }
            newMaintenanceType.value = ''
        }

        const removeType = (type) => {
            maintenanceTypes.value = maintenanceTypes.value.filter(t => t !== type)
            persistPreferences()
        }

        onMounted(async() => {
            userName.value = store.state.userProfile?.fullName
            userEmail.value = store.state.userProfile?.email
            await withOverlay(async() => {
                try {
                    const token = localStorage.getItem('token')
                    if (token) {
                        const prefs = await getPreferences(token)
                        if (prefs?.distanceUnit) distanceUnit.value = prefs.distanceUnit
                        if (prefs?.currency) currency.value = prefs.currency
                        if (Array.isArray(prefs?.maintenanceTypes) && prefs.maintenanceTypes.length) {
                            maintenanceTypes.value = prefs.maintenanceTypes
                        } else {
                            maintenanceTypes.value = [...defaultMaintenanceTypes]
                        }
                        if (prefs?.aiProvider) aiProvider.value = prefs.aiProvider
                        if (prefs?.aiApiKey) aiApiKey.value = prefs.aiApiKey
                    }
                } catch (err) {
                    maintenanceTypes.value = [...defaultMaintenanceTypes]
                }
            })
        })

        return {
            goHome,
            goSchedules,
            goVehicles,
            userName,
            userEmail,
            distanceUnit,
            currency,
            maintenanceTypes,
            newMaintenanceType,
            addMaintenanceType,
            removeType,
            persistPreferences,
            loadingOverlay,
            staggerReady,
            aiProvider,
            aiApiKey
        }
    }
}
</script>

<style scoped>
/* ── Hero ── */

/* ── Body ── */
.car-body { padding: 16px 16px 90px !important; display: flex !important; flex-direction: column !important; gap: 12px !important; }
.settings-body { padding-bottom: 90px !important; }

/* ── Profile card ── */
.profile-card {
  background: var(--glass-card-bg) !important;
  border: 1px solid var(--glass-card-border) !important;
  border-radius: 18px !important;
  box-shadow: var(--glass-card-shadow) !important;
  padding: 16px !important;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 14px;
}
.profile-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #f97316, #fb923c);
}

.avatar {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: rgba(249, 115, 22, 0.12);
  border: 1px solid rgba(249, 115, 22, 0.25) !important;
  display: grid;
  place-items: center;
  color: #fb923c;
  flex-shrink: 0;
}

.profile-meta p { margin: 0; }
.name { font-weight: 800; font-size: 15px; color: var(--text-primary); }
.email { font-size: 13px; color: var(--text-muted); margin-top: 2px !important; }

/* ── Settings group card ── */
.settings-group {
  background: var(--glass-card-bg) !important;
  border-top: 1px solid var(--glass-card-border) !important;
  border-bottom: 1px solid var(--glass-card-border) !important;
  border-right: 1px solid var(--glass-card-border) !important;
  border-left: 3px solid #f97316 !important;
  border-radius: 14px !important;
  box-shadow: var(--glass-card-shadow) !important;
  padding: 16px !important;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.group-title {
  margin: 0 0 12px;
  font-weight: 800;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #fb923c;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  color: var(--text-primary);
  border-bottom: 1px solid var(--glass-card-border);
}
.settings-item:last-of-type { border-bottom: none; padding-bottom: 0; }
.settings-item.column { flex-direction: column; align-items: flex-start; gap: 10px; }

.item-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 14px;
  color: var(--text-primary);
}

/* ── Inline select — orange focus ── */
.inline-select { min-width: 140px; }
.car-select:focus,
.car-input:focus {
  outline: none !important;
  border-color: rgba(249, 115, 22, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.15) !important;
}

/* ── Type input row ── */
.type-row { display: flex; width: 100%; gap: 8px; }

.add-btn {
  background: linear-gradient(135deg, #f97316, #fb923c) !important;
  color: #fff !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.35) !important;
  padding: 10px 16px !important;
  border-radius: 12px !important;
  font-weight: 700 !important;
  white-space: nowrap;
}

/* ── Chips ── */
.chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.12);
  border: 1px solid rgba(249, 115, 22, 0.25);
  color: #fb923c;
  font-size: 13px;
  font-weight: 700;
}

.chip-remove {
  border: none;
  background: transparent;
  color: #fb923c;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  cursor: pointer;
}
.chip-remove:hover { opacity: 1; }

/* ── Bottom nav ── */
.car-bottom-nav {
  background: rgba(5, 6, 10, 0.92) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
}
.theme-light .car-bottom-nav { background: rgba(238, 242, 255, 0.94) !important; }
.car-nav-item.active { color: #fb923c !important; font-weight: 700; }
</style>
