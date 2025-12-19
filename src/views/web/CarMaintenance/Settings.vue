<template>
<div class="car-shell">
    <div class="car-orb one"></div>
    <div class="car-orb two"></div>
    <header class="car-hero">
        <div class="car-brand">
            <div class="logo-circle">
                <mdicon name="cog-outline" :size="24"/>
            </div>
            <div>
                <p class="eyebrow">Car Maintenance</p>
                <h1 class="headline">Settings</h1>
            </div>
        </div>
        <nav class="car-tabs">
            <button @click="goHome">Home</button>
            <button @click="goSchedules">Schedules</button>
            <button @click="goReport">Report</button>
            <button @click="goVehicles">Vehicles</button>
            <button class="active">Settings</button>
        </nav>
    </header>

    <main class="car-body">
        <div class="car-panel">
            <div class="car-profile">
                <div class="car-avatar">
                    <mdicon name="account-circle" :size="36"/>
                </div>
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
                    <select class="car-select" v-model="currency" @change="persistPreferences">
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
        </div>
    </main>
</div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCarMaintenance } from '@/composables/carMaintenance'

const defaultTypes = [
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
    'Repair',
    'Other'
]

export default {
    name: 'CarMaintenanceSettingsWeb',
    setup() {
        const router = useRouter()
        const { getPreferences, savePreferences } = useCarMaintenance()

        const userName = ref('User')
        const userEmail = ref('user@example.com')
        const distanceUnit = ref('km')
        const currency = ref('USD')
        const currencyOptions = ref(['USD', 'PHP', 'EUR', 'JPY', 'SGD'])
        const maintenanceTypes = ref([...defaultTypes])
        const newMaintenanceType = ref('')
        const visibleTypes = computed(() => maintenanceTypes.value?.length ? maintenanceTypes.value : defaultTypes)

        const goHome = () => router.push('/')
        const goSchedules = () => router.push('/car-maintenance/schedules')
        const goVehicles = () => router.push('/car-maintenance/vehicles')
        const goReport = () => router.push('/car-maintenance/report')

        const persistPreferences = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                await savePreferences(token, {
                    distanceUnit: distanceUnit.value,
                    currency: currency.value,
                    maintenanceTypes: maintenanceTypes.value
                })
            } catch (err) {
                // ignore persistence errors for now
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

        const loadProfile = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                const res = await fetch(`${window.location.origin}/api/v1/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (res.ok && data?.userInfo) {
                    userName.value = data.userInfo.fullName || data.userInfo.displayName || data.userInfo.name || userName.value
                    userEmail.value = data.userInfo.email || userEmail.value
                }
            } catch (err) {
                // ignore profile errors
            }
        }

        const loadPreferences = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                const prefs = await getPreferences(token)
                if (prefs?.distanceUnit) distanceUnit.value = prefs.distanceUnit
                if (prefs?.currency) currency.value = prefs.currency
                if (Array.isArray(prefs?.maintenanceTypes) && prefs.maintenanceTypes.length) {
                    maintenanceTypes.value = prefs.maintenanceTypes
                }
            } catch (err) {
                // ignore
            }
        }

        onMounted(async() => {
            await loadProfile()
            await loadPreferences()
        })

        return {
            goHome,
            goSchedules,
            goVehicles,
            goReport,
            userName,
            userEmail,
            distanceUnit,
            currency,
            currencyOptions,
            maintenanceTypes,
            visibleTypes,
            newMaintenanceType,
            addType,
            removeType,
            persistPreferences
        }
    }
}
</script>
