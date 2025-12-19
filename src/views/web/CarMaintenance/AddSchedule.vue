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
                <h2 class="headline">Add Schedule</h2>
            </div>
        </div>
    </header>
    <main class="car-body">
        <form class="car-panel car-form" @submit.prevent="submitSchedule">
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
                    <button type="button" class="car-type-toggle" @click="toggleTypeDropdown">
                        <mdicon name="menu-down" :size="20"/>
                    </button>
                </div>
                <div v-if="showTypeDropdown" class="car-type-list">
                    <button
                        v-for="option in typeOptions"
                        :key="option"
                        type="button"
                        class="car-type-option"
                        @click="chooseType(option)"
                    >
                        {{ option }}
                    </button>
                </div>
            </div>

            <div class="car-two-col">
                <div class="car-field">
                    <label>Due Date</label>
                    <input class="car-input" v-model="form.dueDate" type="date" required />
                </div>
                <div class="car-field">
                    <label>Due Mileage</label>
                    <input class="car-input" v-model="form.dueMileage" type="number" min="0" placeholder="100000" />
                </div>
            </div>
            <div class="car-field">
                <label>Notes</label>
                <textarea class="car-textarea" v-model="form.notes" rows="3" placeholder="Add details"></textarea>
            </div>

            <button class="car-btn" type="submit" :disabled="submitting">
                {{ submitting ? 'Saving...' : 'Save Schedule' }}
            </button>
            <p v-if="errorMessage" class="car-text-error">{{ errorMessage }}</p>
            <p v-if="successMessage" class="car-text-success">{{ successMessage }}</p>
        </form>
    </main>
</div>
</template>

<script>
import { ref, onMounted } from 'vue'
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
    name: 'CarMaintenanceAddScheduleWeb',
    setup() {
        const router = useRouter()
        const route = useRoute()
        const { listVehicles, createReminder, getPreferences } = useCarMaintenance()

        const vehicles = ref([])
        const form = ref({
            vehicleId: '',
            maintenanceType: '',
            dueDate: '',
            dueMileage: '',
            notes: ''
        })
        const typeOptions = ref([...defaultTypes])
        const showTypeDropdown = ref(false)
        const submitting = ref(false)
        const errorMessage = ref('')
        const successMessage = ref('')

        const displayName = (vehicle) => {
            const parts = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean)
            return parts.join(' ').trim() || 'Vehicle'
        }

        const loadPreferences = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                const prefs = await getPreferences(token)
                if (Array.isArray(prefs?.maintenanceTypes) && prefs.maintenanceTypes.length) {
                    typeOptions.value = prefs.maintenanceTypes
                }
            } catch (err) {
                // ignore
            }
        }

        const loadVehicles = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token) throw new Error('You must be logged in.')
                vehicles.value = await listVehicles(token)
                if (vehicles.value.length) {
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

        const submitSchedule = async() => {
            errorMessage.value = ''
            successMessage.value = ''
            submitting.value = true
            try {
                const token = localStorage.getItem('token')
                if (!token) throw new Error('You must be logged in.')
                await createReminder(token, {
                    vehicleId: form.value.vehicleId,
                    maintenanceType: form.value.maintenanceType,
                    title: form.value.maintenanceType,
                    description: form.value.notes,
                    dueDate: form.value.dueDate,
                    dueMileage: form.value.dueMileage ? Number(form.value.dueMileage) : null
                })
                successMessage.value = 'Schedule saved'
                setTimeout(() => router.push('/web/car-maintenance'), 400)
            } catch (err) {
                errorMessage.value = err?.message || 'Unable to save schedule'
            } finally {
                submitting.value = false
            }
        }

        const toggleTypeDropdown = () => {
            showTypeDropdown.value = !showTypeDropdown.value
        }

        const chooseType = (option) => {
            form.value.maintenanceType = option
            showTypeDropdown.value = false
        }

        onMounted(() => {
            loadPreferences()
            loadVehicles()
        })

        return {
            router,
            vehicles,
            form,
            typeOptions,
            showTypeDropdown,
            toggleTypeDropdown,
            chooseType,
            submitSchedule,
            submitting,
            errorMessage,
            successMessage,
            displayName
        }
    }
}
</script>
