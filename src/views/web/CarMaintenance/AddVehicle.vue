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
                <h2 class="headline">Add Vehicle</h2>
            </div>
        </div>
    </header>
    <main class="car-body">
        <form class="car-panel car-form" @submit.prevent="submitVehicle">
            <div class="two-col">
                <div class="car-field">
                    <label>Make</label>
                    <input class="car-input" v-model="form.make" type="text" required />
                </div>
                <div class="car-field">
                    <label>Model</label>
                    <input class="car-input" v-model="form.model" type="text" required />
                </div>
            </div>
            <div class="two-col">
                <div class="car-field">
                    <label>Year</label>
                    <input class="car-input" v-model="form.year" type="number" min="1900" placeholder="2020" />
                </div>
                <div class="car-field">
                    <label>Vehicle Type</label>
                    <select class="car-select" v-model="form.vehicleType">
                        <option value="CAR">Car</option>
                        <option value="SUV">SUV</option>
                        <option value="TRUCK">Truck</option>
                        <option value="MOTORCYCLE">Motorcycle</option>
                        <option value="VAN">Van</option>
                    </select>
                </div>
            </div>
            <div class="two-col">
                <div class="car-field">
                    <label>Color</label>
                    <input class="car-input" v-model="form.color" type="text" placeholder="Blue" />
                </div>
                <div class="car-field">
                    <label>License Plate</label>
                    <input class="car-input" v-model="form.licensePlate" type="text" placeholder="ABC1234" />
                </div>
            </div>
            <div class="two-col">
                <div class="car-field">
                    <label>VIN</label>
                    <input class="car-input" v-model="form.vin" type="text" placeholder="VIN" />
                </div>
                <div class="car-field">
                    <label>Registration Expiry</label>
                    <input class="car-input" v-model="form.registrationExpiryDate" type="date" />
                </div>
            </div>
            <div class="two-col">
                <div class="car-field">
                    <label>Odometer</label>
                    <input class="car-input" v-model="form.currentMileage" type="number" min="0" placeholder="50000" />
                </div>
                <div class="car-field">
                    <label>Notes</label>
                    <textarea class="car-textarea" v-model="form.notes" rows="2" placeholder="Notes..."></textarea>
                </div>
            </div>

            <div class="car-field">
                <label>Image</label>
                <div class="car-card upload-box" @click="triggerFile">
                    <mdicon name="image-multiple" :size="20"/>
                    <span>{{ imagePreview ? 'Change image' : 'Tap to upload image' }}</span>
                </div>
                <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileChange" />
                <div v-if="imagePreview" class="preview car-card">
                    <img :src="imagePreview" alt="Preview" />
                </div>
            </div>

            <button class="car-btn" type="submit" :disabled="submitting">
                {{ submitting ? 'Saving...' : 'Save Vehicle' }}
            </button>
            <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
            <p v-if="successMessage" class="success">{{ successMessage }}</p>
        </form>
    </main>
</div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCarMaintenance } from '@/composables/carMaintenance'

export default {
    name: 'CarMaintenanceAddVehicleWeb',
    setup() {
        const router = useRouter()
        const { createVehicle } = useCarMaintenance()
        const form = ref({
            make: '',
            model: '',
            year: '',
            vehicleType: 'CAR',
            color: '',
            licensePlate: '',
            vin: '',
            registrationExpiryDate: '',
            currentMileage: '',
            notes: ''
        })
        const fileInput = ref(null)
        const imageFile = ref(null)
        const imagePreview = ref('')
        const submitting = ref(false)
        const errorMessage = ref('')
        const successMessage = ref('')

        const triggerFile = () => fileInput.value?.click()

        const handleFileChange = (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            imageFile.value = file
            imagePreview.value = URL.createObjectURL(file)
        }

        const submitVehicle = async() => {
            errorMessage.value = ''
            successMessage.value = ''
            submitting.value = true
            try {
                const token = localStorage.getItem('token')
                if (!token) throw new Error('You must be logged in.')
                const payload = new FormData()
                Object.entries(form.value).forEach(([key, val]) => {
                    if (val !== null && val !== undefined && val !== '') {
                        payload.append(key, val)
                    }
                })
                if (imageFile.value) {
                    payload.append('image', imageFile.value)
                }
                await createVehicle(token, payload)
                successMessage.value = 'Vehicle saved'
                setTimeout(() => router.push('/web/car-maintenance/vehicles'), 500)
            } catch (err) {
                errorMessage.value = err?.message || 'Unable to save vehicle'
            } finally {
                submitting.value = false
            }
        }

        return {
            router,
            form,
            fileInput,
            imagePreview,
            triggerFile,
            handleFileChange,
            submitVehicle,
            submitting,
            errorMessage,
            successMessage
        }
    }
}
</script>

<style scoped>
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.upload-box {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    justify-content: flex-start;
}
.hidden { display: none; }
.preview img {
    margin-top: 8px;
    width: 100%;
    border-radius: 12px;
    border: 1px solid var(--glass-card-border);
    object-fit: cover;
}
.error { color: #dc2626; margin: 0; }
.success { color: #16a34a; margin: 0; }

@media (max-width: 720px) {
    .two-col { grid-template-columns: 1fr; }
}
</style>
