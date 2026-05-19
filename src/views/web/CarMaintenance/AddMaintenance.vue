<template>
<div class="car-shell">
    <div class="car-orb one"></div>
    <div class="car-orb two"></div>
    <header class="car-hero">
        <div class="car-brand">
            <button class="car-icon-btn" @click="router.back()">
                <mdicon name="chevron-left" :size="22"/>
            </button>
            <div>
                <p class="eyebrow">Car Maintenance</p>
                <h2 class="headline">Add Maintenance</h2>
            </div>
        </div>
    </header>
    <main class="car-body">
        <form class="car-panel car-form" @submit.prevent="submitRecord">
            <div class="car-field">
                <label>Vehicle</label>
                <select class="car-select" v-model="form.vehicleId" required>
                    <option value="" disabled>Select vehicle</option>
                    <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ displayName(v) }}</option>
                </select>
            </div>

            <div class="car-field">
                <label>Maintenance Type</label>
                <div class="car-type-input">
                    <input class="car-input" v-model="form.maintenanceType" type="text" placeholder="Select or type" />
                    <button type="button" class="car-type-toggle" @click="showTypeList = !showTypeList">
                        <mdicon name="menu-down" :size="20"/>
                    </button>
                </div>
                <div v-if="showTypeList" class="car-type-list car-card">
                    <button v-for="option in typeOptions" :key="option" type="button" class="car-type-option" @click="selectType(option)">
                        {{ option }}
                    </button>
                </div>
            </div>

            <div class="car-two-col">
                <div class="car-field">
                    <label>Service Date</label>
                    <input class="car-input" v-model="form.serviceDate" type="date" required />
                </div>
                <div class="car-field">
                    <label>Mileage at Service</label>
                    <input class="car-input" v-model="form.mileageAtService" type="number" min="0" :placeholder="distanceUnit === 'mi' ? '50000' : '80456'" />
                </div>
            </div>

            <div class="car-two-col">
                <div class="car-field">
                    <label>Cost</label>
                    <input class="car-input" v-model="form.cost" type="number" min="0" step="0.01" placeholder="4000" />
                </div>
                <div class="car-field">
                    <label>Currency</label>
                    <select class="car-select" v-model="form.currency">
                        <option v-for="c in currencyOptions" :key="c" :value="c">{{ c }}</option>
                    </select>
                </div>
            </div>

            <div class="car-two-col">
                <div class="car-field">
                    <label>Serviced By</label>
                    <input class="car-input" v-model="form.servicedBy" type="text" placeholder="Service Center" />
                </div>
                <div class="car-field">
                    <label>Location</label>
                    <input class="car-input" v-model="form.location" type="text" placeholder="City / Garage" />
                </div>
            </div>

            <div class="car-field">
                <label>Parts Used</label>
                <textarea class="car-textarea" v-model="form.partsUsed" rows="2" placeholder="List parts used"></textarea>
            </div>

            <div class="car-field">
                <label>Labor Hours</label>
                <input class="car-input" v-model="form.laborHours" type="number" min="0" step="0.1" placeholder="2.5" />
            </div>

            <div class="car-field">
                <label>Description</label>
                <textarea class="car-textarea" v-model="form.description" rows="3" placeholder="Notes or details"></textarea>
            </div>

            <button class="car-btn" type="submit" :disabled="submitting">
                {{ submitting ? 'Saving...' : 'Save Maintenance' }}
            </button>
            <p v-if="errorMessage" class="car-text-error">{{ errorMessage }}</p>
            <p v-if="successMessage" class="car-text-success">{{ successMessage }}</p>
        </form>
    </main>
</div>
</template>

<script>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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
    name: 'CarMaintenanceAddMaintenanceWeb',
    setup() {
        const router = useRouter()
        const route = useRoute()
        const { listVehicles, createMaintenanceRecord, getPreferences } = useCarMaintenance()
        const vehicles = ref([])
        const form = ref({
            vehicleId: '',
            maintenanceType: '',
            serviceDate: '',
            mileageAtService: '',
            cost: '',
            currency: 'USD',
            servicedBy: '',
            location: '',
            partsUsed: '',
            laborHours: '',
            description: ''
        })
        const typeOptions = ref([...defaultTypes])
        const currencyOptions = ref(['USD', 'PHP', 'EUR', 'JPY', 'SGD'])
        const distanceUnit = ref('km')
        const showTypeList = ref(false)
        const submitting = ref(false)
        const errorMessage = ref('')
        const successMessage = ref('')

        const displayName = (vehicle) => {
            if (!vehicle) return 'Vehicle'
            const parts = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean)
            const assembled = parts.join(' ').trim()
            return assembled || vehicle.licensePlate || vehicle.vin || 'Vehicle'
        }

        const loadPreferences = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                const prefs = await getPreferences(token)
                if (Array.isArray(prefs?.maintenanceTypes) && prefs.maintenanceTypes.length) {
                    typeOptions.value = prefs.maintenanceTypes
                }
                if (prefs?.currency) {
                    form.value.currency = prefs.currency
                    currencyOptions.value = Array.from(new Set([prefs.currency, ...currencyOptions.value]))
                }
                if (prefs?.distanceUnit) distanceUnit.value = prefs.distanceUnit
            } catch (err) {
                // ignore
            }
        }

        const loadVehicles = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token) throw new Error('You must be logged in.')
                vehicles.value = await listVehicles(token)
                if (!form.value.vehicleId && vehicles.value.length) {
                    form.value.vehicleId = vehicles.value[0].id
                }
                const vehicleId = route.query.vehicleId
                if (vehicleId) {
                    const match = vehicles.value.find(v => v.id === vehicleId)
                    if (match) form.value.vehicleId = match.id
                }
            } catch (err) {
                errorMessage.value = err?.message || 'Unable to load vehicles'
                vehicles.value = []
            }
        }

        const selectType = (option) => {
            form.value.maintenanceType = option
            showTypeList.value = false
        }

        const submitRecord = async() => {
            errorMessage.value = ''
            successMessage.value = ''
            submitting.value = true
            try {
                const token = localStorage.getItem('token')
                if (!token) throw new Error('You must be logged in.')
                const payload = {
                    ...form.value,
                    mileageAtService: form.value.mileageAtService ? Number(form.value.mileageAtService) : null,
                    cost: form.value.cost ? Number(form.value.cost) : null,
                    laborHours: form.value.laborHours ? Number(form.value.laborHours) : null
                }
                await createMaintenanceRecord(token, payload)
                successMessage.value = 'Maintenance saved'
                setTimeout(() => router.push('/web/car-maintenance'), 500)
            } catch (err) {
                errorMessage.value = err?.message || 'Unable to save maintenance'
            } finally {
                submitting.value = false
            }
        }

        loadPreferences()
        loadVehicles()

        return {
            router,
            vehicles,
            form,
            typeOptions,
            currencyOptions,
            distanceUnit,
            showTypeList,
            submitting,
            errorMessage,
            successMessage,
            displayName,
            selectType,
            submitRecord
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
}
.theme-light .car-hero { background: rgba(238, 242, 255, 0.96) !important; border-bottom-color: rgba(249, 115, 22, 0.1) !important; }

.car-brand { display: flex; align-items: center; gap: 14px; }

.car-icon-btn {
    width: 38px !important; height: 38px !important;
    border-radius: 10px !important;
    background: rgba(249, 115, 22, 0.1) !important;
    border: 1px solid rgba(249, 115, 22, 0.2) !important;
    color: #fb923c !important;
    display: inline-flex !important; align-items: center !important; justify-content: center !important;
    cursor: pointer !important;
    padding: 0 !important;
    transition: background 0.15s !important;
    flex-shrink: 0 !important;
}
.car-icon-btn:hover { background: rgba(249, 115, 22, 0.18) !important; }

.eyebrow {
    color: #fb923c !important;
    font-size: 11px !important; font-weight: 700 !important;
    letter-spacing: 0.08em !important; text-transform: uppercase !important;
    margin: 0 !important;
}
.headline { font-size: 16px !important; font-weight: 700 !important; color: var(--text-primary) !important; margin: 2px 0 0 !important; }

/* ── Main layout ── */
.car-body {
    padding: 32px !important;
    display: flex !important;
    justify-content: center !important;
    align-items: flex-start !important;
}

/* ── Form card ── */
.car-panel {
    background: var(--glass-card-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 20px !important;
    padding: 28px 32px !important;
    box-shadow: var(--glass-card-shadow) !important;
    position: relative !important;
    overflow: visible !important;
    width: 100% !important;
    max-width: 740px !important;
}
.car-panel::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #f97316, #fb923c);
    border-radius: 20px 20px 0 0;
}

/* ── Field layout ── */
.car-form { display: flex !important; flex-direction: column !important; gap: 18px !important; }

.car-field { display: flex !important; flex-direction: column !important; gap: 6px !important; }

.car-field label {
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.07em !important;
    color: var(--text-muted) !important;
}

.car-two-col { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 18px !important; }

/* ── Inputs ── */
.car-input {
    background: rgba(255, 255, 255, 0.04) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 12px !important;
    padding: 12px 16px !important;
    font-size: 15px !important;
    color: var(--text-primary) !important;
    width: 100% !important;
    box-sizing: border-box !important;
    transition: border-color 0.15s, box-shadow 0.15s !important;
}
.car-input:focus {
    outline: none !important;
    border-color: rgba(249, 115, 22, 0.45) !important;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1) !important;
}

.car-select {
    background: rgba(255, 255, 255, 0.04) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 12px !important;
    padding: 12px 16px !important;
    font-size: 15px !important;
    color: var(--text-primary) !important;
    width: 100% !important;
    cursor: pointer !important;
}
.car-select:focus { outline: none !important; border-color: rgba(249, 115, 22, 0.45) !important; }

.car-textarea {
    background: rgba(255, 255, 255, 0.04) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 12px !important;
    padding: 12px 16px !important;
    font-size: 15px !important;
    color: var(--text-primary) !important;
    width: 100% !important;
    resize: vertical !important;
    box-sizing: border-box !important;
    font-family: inherit !important;
}
.car-textarea:focus { outline: none !important; border-color: rgba(249, 115, 22, 0.45) !important; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1) !important; }

/* ── Maintenance type combo ── */
.car-type-input {
    background: rgba(255, 255, 255, 0.04) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 12px !important;
    overflow: hidden !important;
}
.car-type-input input {
    background: transparent !important;
    border: none !important;
    padding: 12px 16px !important;
    font-size: 15px !important;
    color: var(--text-primary) !important;
}
.car-type-input input:focus { outline: none !important; }
.car-type-toggle {
    border: none !important;
    background: transparent !important;
    color: var(--text-muted) !important;
    padding: 0 14px !important;
    cursor: pointer !important;
    border-left: 1px solid var(--glass-card-border) !important;
    transition: color 0.15s !important;
}
.car-type-toggle:hover { color: #fb923c !important; }

.car-type-list {
    margin-top: 6px !important;
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 4px !important;
    background: var(--glass-card-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 14px !important;
    padding: 10px !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25) !important;
}
.car-type-option {
    border: none !important;
    background: transparent !important;
    color: var(--text-primary) !important;
    padding: 9px 12px !important;
    border-radius: 8px !important;
    cursor: pointer !important;
    text-align: left !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    transition: background 0.12s !important;
}
.car-type-option:hover { background: rgba(249, 115, 22, 0.1) !important; color: #fb923c !important; }

/* ── Submit button ── */
.car-btn {
    background: linear-gradient(135deg, #f97316, #fb923c) !important;
    color: #fff !important;
    border: none !important;
    border-radius: 12px !important;
    padding: 14px 24px !important;
    font-size: 15px !important;
    font-weight: 700 !important;
    box-shadow: 0 6px 20px rgba(249, 115, 22, 0.3) !important;
    cursor: pointer !important;
    transition: opacity 0.15s !important;
    align-self: flex-start !important;
}
.car-btn:disabled { opacity: 0.6 !important; cursor: not-allowed !important; }

/* ── Status messages ── */
.car-text-error { color: #f87171 !important; font-size: 13px !important; margin: 0 !important; font-weight: 600 !important; }
.car-text-success { color: #34d399 !important; font-size: 13px !important; margin: 0 !important; font-weight: 600 !important; }

@media (max-width: 900px) {
    .car-body { padding: 16px !important; }
    .car-panel { padding: 20px 18px !important; }
    .car-two-col { grid-template-columns: 1fr !important; gap: 14px !important; }
    .car-type-list { grid-template-columns: repeat(2, 1fr) !important; }
}
</style>
