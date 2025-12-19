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
