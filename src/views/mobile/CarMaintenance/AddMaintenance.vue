<template>
<div class="car-shell stagger-page stagger-seq" :class="{ 'stagger-ready': staggerReady }">
    <div class="car-orb one"></div>
    <div class="car-orb two"></div>
    <CarTopBar title="Add Maintenance" subtitle="Track service details and costs" leading="back" />

    <form class="car-body car-form" @submit.prevent="submitRecord">
        <div v-if="isEditing" class="car-field">
            <label>Vehicle</label>
            <div class="car-input" style="background: var(--glass-ghost-bg); border: 1px solid var(--glass-card-border);">
                {{ selectedVehicleName }}
            </div>
        </div>
        <div v-else class="car-field">
            <label>Vehicle</label>
            <select v-model="form.vehicleId" required class="car-select">
                <option value="" disabled>Select vehicle</option>
                <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
                    {{ displayName(vehicle) }}
                </option>
            </select>
        </div>

        <div class="car-field">
            <label>Maintenance Type</label>
            <div class="car-type-input car-input" style="display:flex; align-items:center; gap:8px; border:1px solid var(--glass-card-border);">
                <input
                    class="car-input"
                    v-model="form.maintenanceType"
                    type="text"
                    placeholder="Select or type"
                    @focus="showTypeList = true"
                    style="border:none; background:transparent; padding:0; box-shadow:none;"
                />
                <button type="button" class="type-icon" @click="showTypeList = !showTypeList">
                    <mdicon name="menu-down" :size="20"/>
                </button>
            </div>
            <div v-if="showTypeList" class="car-type-list">
                <button type="button" class="car-type-option" v-for="option in typeOptions" :key="option" @click="selectType(option)">
                    {{ option }}
                </button>
            </div>
        </div>

        <div class="car-grid-2">
            <div class="car-field">
                <label>Service Date</label>
                <input v-model="form.serviceDate" type="date" required class="car-input" />
            </div>
        </div>

        <div class="car-grid-2">
            <div class="car-field">
                <label>Mileage at Service ({{ distanceUnitLabel }})</label>
                <input v-model="form.mileageAtService" type="number" min="0" :placeholder="distanceUnit === 'mi' ? '50000' : '80456'" class="car-input" />
            </div>
            <div class="car-field">
                <label>Cost</label>
                <input v-model="form.cost" type="number" min="0" step="0.01" placeholder="4000" class="car-input" />
            </div>
        </div>

        <div class="car-grid-2">
            <div class="car-field">
                <label>Currency</label>
                <select v-model="form.currency" class="car-select">
                    <option v-for="c in currencyOptions" :key="c" :value="c">{{ c }}</option>
                </select>
            </div>
            <div class="car-field">
                <label>Serviced By</label>
                <input v-model="form.servicedBy" type="text" placeholder="Service Center" class="car-input" />
            </div>
        </div>

        <div class="car-field">
            <label>Location</label>
            <input v-model="form.location" type="text" placeholder="City / Garage" class="car-input" />
        </div>

        <div class="car-field">
            <label>Parts Used</label>
            <textarea v-model="form.partsUsed" rows="2" placeholder="List parts used" class="car-textarea"></textarea>
        </div>

        <div class="car-field">
            <label>Labor Hours</label>
            <input v-model="form.laborHours" type="number" min="0" step="0.1" placeholder="2.5" class="car-input" />
        </div>

        <div class="car-field">
            <label>Description</label>
            <textarea v-model="form.description" rows="3" placeholder="Notes or details" class="car-textarea"></textarea>
        </div>

        <button class="car-btn" type="submit" :disabled="submitting">
            {{ submitting ? 'Saving...' : 'Save Maintenance' }}
        </button>
        <button 
            v-if="isEditing" 
            class="car-btn ghost" 
            type="button" 
            @click="cancelEdit"
        >
            Cancel
        </button>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-text">{{ successMessage }}</p>
    </form>
    <Loading v-if="loadingOverlay"/>
</div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCarMaintenance } from '@/composables/carMaintenance'
import Loading from '@/components/Loading.vue'
import CarTopBar from '@/components/CarMaintenance/CarTopBar.vue'
import { useStaggerReady } from '@/composables/staggerReady'

export default {
    name: 'CarMaintenanceAddMaintenanceMobile',
    components: {
        Loading,
        CarTopBar
    },
    setup() {
        const router = useRouter()
        const route = useRoute()
        const { createMaintenanceRecord, updateMaintenanceRecord, listVehicles, getMaintenanceRecord, getPreferences } = useCarMaintenance()

        const vehicles = ref([])
        const isEditing = ref(false)
        const editingId = ref('')
        const selectedVehicleName = ref('')
        const initialVehicleId = ref('')
        const showTypeList = ref(false)
        const defaultTypeOptions = [
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
        const typeOptions = ref([...defaultTypeOptions])
        const distanceUnit = ref('km')
        const currencyOptions = ref(['USD', 'PHP', 'EUR', 'JPY', 'SGD'])
        const loadingOverlay = ref(false)
        const staggerReady = useStaggerReady()

        const form = ref({
            vehicleId: '',
            serviceDate: '',
            maintenanceType: '',
            mileageAtService: '',
            cost: '',
            currency: 'USD',
            servicedBy: '',
            location: '',
            partsUsed: '',
            laborHours: '',
            description: ''
        })

        const submitting = ref(false)
        const errorMessage = ref('')
        const successMessage = ref('')

        const payload = computed(() => ({
            ...form.value,
            title: form.value.maintenanceType || 'Maintenance',
            mileageAtService: form.value.mileageAtService || undefined,
            cost: form.value.cost || undefined,
            laborHours: form.value.laborHours || undefined
        }))

        const distanceUnitLabel = computed(() => distanceUnit.value === 'mi' ? 'miles' : 'km')

        const withOverlay = async(fn) => {
            loadingOverlay.value = true
            try {
                return await fn()
            } finally {
                loadingOverlay.value = false
            }
        }

        const loadVehicles = async() => {
            await withOverlay(async() => {
                try {
                    const token = localStorage.getItem('token')
                    if (!token) throw new Error('You must be logged in.')
                    vehicles.value = await listVehicles(token)
                    if (!isEditing.value) {
                        if (initialVehicleId.value) {
                            const match = vehicles.value.find(v => v.id === initialVehicleId.value)
                            if (match) {
                                form.value.vehicleId = match.id
                            }
                        }
                        if (!form.value.vehicleId && vehicles.value.length) {
                            form.value.vehicleId = vehicles.value[0].id
                        }
                    }
                } catch (err) {
                    errorMessage.value = err?.message || 'Unable to load vehicles'
                    vehicles.value = []
                }
            })
        }

        const loadRecord = async(id) => {
            try {
                const token = localStorage.getItem('token')
                if (!token) throw new Error('You must be logged in.')
                const rec = await getMaintenanceRecord(token, id)
                editingId.value = rec.id
                isEditing.value = true
                form.value = {
                    vehicleId: rec.vehicleId,
                    serviceDate: rec.serviceDate ? rec.serviceDate.split('T')[0] : '',
                    maintenanceType: rec.maintenanceType || '',
                    mileageAtService: rec.mileageAtService || '',
                    cost: rec.cost || '',
                    currency: rec.currency || 'USD',
                    servicedBy: rec.servicedBy || '',
                    location: rec.location || '',
                    partsUsed: rec.partsUsed || '',
                    laborHours: rec.laborHours || '',
                    description: rec.description || ''
                }
                selectedVehicleName.value = rec.vehicleId
            } catch (err) {
                console.error(err)
            }
        }

        const submitRecord = async() => {
            errorMessage.value = ''
            successMessage.value = ''
            submitting.value = true
            try {
                await withOverlay(async() => {
                    const token = localStorage.getItem('token')
                    if (!token) throw new Error('You must be logged in.')
                    if (isEditing.value && editingId.value) {
                        await updateMaintenanceRecord(token, editingId.value, payload.value)
                        successMessage.value = 'Maintenance updated'
                    } else {
                        await createMaintenanceRecord(token, payload.value)
                        successMessage.value = 'Maintenance saved'
                    }
                    setTimeout(() => {
                        router.push('/car-maintenance')
                    }, 600)
                })
            } catch (err) {
                errorMessage.value = err?.message || 'Unable to save maintenance'
            } finally {
                submitting.value = false
            }
        }

        const selectType = (option) => {
            form.value.maintenanceType = option
            showTypeList.value = false
        }

        const cancelEdit = () => {
            if (isEditing.value && editingId.value) {
                router.push(`/car-maintenance/maintenance/${editingId.value}`)
            } else {
                router.push('/car-maintenance')
            }
        }

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
                } else {
                    typeOptions.value = [...defaultTypeOptions]
                }
                if (prefs?.distanceUnit) distanceUnit.value = prefs.distanceUnit
                if (prefs?.currency) form.value.currency = prefs.currency
                const uniqueCurrencies = new Set([prefs?.currency || 'USD', ...currencyOptions.value])
                currencyOptions.value = Array.from(uniqueCurrencies)
            } catch (err) {
                typeOptions.value = [...defaultTypeOptions]
            }
        }

        onMounted(async() => {
            await withOverlay(async() => {
                const editId = route.query.id
                const vehicleIdQuery = Array.isArray(route.query.vehicleId) ? route.query.vehicleId[0] : route.query.vehicleId
                if (vehicleIdQuery) {
                    initialVehicleId.value = vehicleIdQuery
                    form.value.vehicleId = vehicleIdQuery
                }
                if (editId) {
                    await loadRecord(editId)
                }
                await loadPreferences()
                await loadVehicles()
                if (isEditing.value) {
                    const veh = vehicles.value.find(v => v.id === form.value.vehicleId)
                    selectedVehicleName.value = veh ? displayName(veh) : ''
                }
            })
        })

        return {
            vehicles,
            form,
            submitting,
            errorMessage,
            successMessage,
            submitRecord,
            displayName,
            isEditing,
            selectedVehicleName,
            showTypeList,
            typeOptions,
            selectType,
            distanceUnit,
            distanceUnitLabel,
            currencyOptions,
            cancelEdit,
            loadingOverlay,
            staggerReady
        }
    }
}
</script>

<style scoped>
/* Hero — orange gradient matching index */

/* Form body */
.car-body { padding: 16px !important; gap: 16px !important; }

/* Section card wrapper for field groups */
.car-form { gap: 14px !important; }

/* Labels — uppercase caption style */
.car-field label {
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.07em !important;
    color: var(--text-muted) !important;
    margin-bottom: 1px !important;
}

/* Inputs */
.car-input {
    background: var(--glass-card-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 12px !important;
    padding: 12px 14px !important;
    font-size: 15px !important;
    color: var(--text-primary) !important;
    width: 100% !important;
    box-sizing: border-box !important;
    transition: border-color 0.15s, box-shadow 0.15s !important;
}
.car-input:focus {
    outline: none !important;
    border-color: rgba(249, 115, 22, 0.5) !important;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1) !important;
}
.car-select {
    background: var(--glass-card-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 12px !important;
    padding: 12px 14px !important;
    font-size: 15px !important;
    color: var(--text-primary) !important;
    width: 100% !important;
}
.car-select:focus { outline: none !important; border-color: rgba(249, 115, 22, 0.5) !important; }
.car-textarea {
    background: var(--glass-card-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 12px !important;
    padding: 12px 14px !important;
    font-size: 15px !important;
    color: var(--text-primary) !important;
    width: 100% !important;
    resize: vertical !important;
    box-sizing: border-box !important;
}
.car-textarea:focus { outline: none !important; border-color: rgba(249, 115, 22, 0.5) !important; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1) !important; }

/* Maintenance type combo input */
.car-type-input {
    background: var(--glass-card-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 12px !important;
    overflow: hidden !important;
    display: flex !important;
    align-items: center !important;
    gap: 0 !important;
}
.car-type-input :deep(input) { border: none !important; outline: none !important; padding: 12px 14px !important; background: transparent !important; font-size: 15px !important; color: var(--text-primary) !important; flex: 1 !important; }
.type-icon { border: none !important; background: transparent !important; color: var(--text-muted) !important; padding: 0 12px !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; }

/* Type dropdown list */
.car-type-list {
    margin-top: 4px !important;
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 4px !important;
    background: var(--glass-card-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 12px !important;
    padding: 8px !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
}
.car-type-option {
    border: none !important;
    background: transparent !important;
    color: var(--text-primary) !important;
    padding: 9px 10px !important;
    border-radius: 8px !important;
    cursor: pointer !important;
    text-align: left !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    transition: background 0.12s !important;
}
.car-type-option:hover { background: rgba(249, 115, 22, 0.1) !important; color: #fb923c !important; }

/* 2-col grid — single column on narrow screens */
.car-grid-2 { gap: 12px !important; }
@media (max-width: 400px) {
    .car-grid-2 { grid-template-columns: 1fr !important; }
}

/* Submit button */
.car-btn {
    background: linear-gradient(135deg, #f97316, #fb923c) !important;
    color: #fff !important;
    border: none !important;
    border-radius: 14px !important;
    padding: 14px !important;
    font-size: 15px !important;
    font-weight: 700 !important;
    box-shadow: 0 6px 20px rgba(249, 115, 22, 0.35) !important;
    width: 100% !important;
    cursor: pointer !important;
    transition: opacity 0.15s !important;
}
.car-btn:disabled { opacity: 0.6 !important; cursor: not-allowed !important; }
.car-btn.ghost {
    background: var(--glass-card-bg) !important;
    color: var(--text-muted) !important;
    border: 1px solid var(--glass-card-border) !important;
    box-shadow: none !important;
}

/* Status messages */
.error-text { color: #f87171 !important; font-size: 13px !important; margin: 0 !important; font-weight: 600 !important; }
.success-text { color: #34d399 !important; font-size: 13px !important; margin: 0 !important; font-weight: 600 !important; }
</style>
