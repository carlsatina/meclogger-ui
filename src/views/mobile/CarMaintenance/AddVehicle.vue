<template>
<div class="car-shell stagger-page stagger-seq" :class="{ 'stagger-ready': staggerReady }">
    <div class="car-orb one"></div>
    <div class="car-orb two"></div>
    <CarTopBar :title="isEditing ? 'Edit Vehicle' : 'Add Vehicle'" subtitle="Keep your garage organized" leading="back" />

    <form class="car-body car-form" @submit.prevent="submitVehicle">
        <div class="car-card upload-card">
            <label>Vehicle Image</label>
            <div class="upload-box" @click="triggerFileInput">
                <mdicon name="image-multiple" :size="22"/>
                <span>{{ imagePreview ? 'Change image' : 'Tap to upload image' }}</span>
            </div>
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileChange" />
            <div v-if="imagePreview" class="preview">
                <img :src="imagePreview" alt="Vehicle preview" />
            </div>
        </div>
        
        <div class="car-grid-2">
            <div class="car-field">
                <label>Make</label>
                <input v-model="form.make" type="text" required placeholder="Toyota" class="car-input" />
            </div>
            <div class="car-field">
                <label>Model</label>
                <input v-model="form.model" type="text" required placeholder="Fortuner" class="car-input" />
            </div>
        </div>
        <div class="car-grid-2">
            <div class="car-field">
                <label>Year</label>
                <input v-model="form.year" type="number" min="1900" max="2100" placeholder="2012" class="car-input" />
            </div>
            <div class="car-field">
                <label>Vehicle Type</label>
                <select v-model="form.vehicleType" class="car-select">
                    <option value="CAR">Car</option>
                    <option value="SUV">SUV</option>
                    <option value="PICKUP">Pickup</option>
                    <option value="MOTORCYCLE">Motorcycle</option>
                    <option value="TRUCK">Truck</option>
                    <option value="VAN">Van</option>
                    <option value="OTHER">Other</option>
                </select>
            </div>
        </div>

        <div class="car-grid-2">
            <div class="car-field">
                <label>Color</label>
                <input v-model="form.color" type="text" placeholder="Blue" class="car-input" />
            </div>
            <div class="car-field">
                <label>License Plate</label>
                <input v-model="form.licensePlate" type="text" placeholder="ABC123" class="car-input" />
            </div>
        </div>
        <div class="car-field">
            <label>Reg. Exp. Date</label>
            <input v-model="form.registrationExpiryDate" type="date" class="car-input" />
        </div>
        <div class="car-field">
            <label>VIN</label>
            <input v-model="form.vin" type="text" placeholder="Optional" class="car-input" />
        </div>
        <div class="car-grid-2">
            <div class="car-field">
                <label>Purchase Date</label>
                <input v-model="form.purchaseDate" type="date" class="car-input" />
            </div>
            <div class="car-field">
                <label>Current Mileage</label>
                <input v-model="form.currentMileage" type="number" min="0" placeholder="80456" class="car-input" />
            </div>
        </div>
        <div class="car-field">
            <label>Notes</label>
            <textarea v-model="form.notes" rows="3" placeholder="Extra details" class="car-textarea"></textarea>
        </div>

        <button class="car-btn" type="submit" :disabled="submitting">
            {{ submitting ? 'Saving...' : (isEditing ? 'Update Vehicle' : 'Save Vehicle') }}
        </button>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-text">{{ successMessage }}</p>
    </form>
    <Loading v-if="loadingOverlay" :label="loadingMessage"/>
</div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { API_BASE_URL } from '@/constants/config'
import { useCarMaintenance } from '@/composables/carMaintenance'
import Loading from '@/components/Loading.vue'
import CarTopBar from '@/components/CarMaintenance/CarTopBar.vue'
import { useStaggerReady } from '@/composables/staggerReady'

export default {
    name: 'CarMaintenanceAddVehicleMobile',
    components: {
        Loading,
        CarTopBar
    },
    setup() {
        const router = useRouter()
        const route = useRoute()
        const { createVehicle, getVehicle, updateVehicle } = useCarMaintenance()
        const form = ref({
            make: '',
            model: '',
            year: '',
            color: '',
            licensePlate: '',
            registrationExpiryDate: '',
            vin: '',
            vehicleType: 'CAR',
            purchaseDate: '',
            currentMileage: '',
            notes: ''
        })
        const fileInput = ref(null)
        const imageFile = ref(null)
        const imagePreview = ref('')
        const submitting = ref(false)
        const errorMessage = ref('')
        const successMessage = ref('')
        const isEditing = ref(false)
        const editingId = ref('')
        const existingImageUrl = ref('')
        const loadingOverlay = ref(false)
        const loadingMessage = ref('')
        const staggerReady = useStaggerReady()


        const withOverlay = async(fn, message = 'Loading…') => {
            loadingMessage.value = message
            loadingOverlay.value = true
            try {
                return await fn()
            } finally {
                loadingOverlay.value = false
                loadingMessage.value = ''
            }
        }

        const triggerFileInput = () => {
            if (fileInput.value) {
                fileInput.value.click()
            }
        }

        const handleFileChange = (event) => {
            const file = event.target.files?.[0]
            if (!file) return
            if (file.size > 10 * 1024 * 1024) {
                errorMessage.value = 'Image must be 10MB or smaller.'
                event.target.value = ''
                return
            }
            errorMessage.value = ''
            imageFile.value = file
            imagePreview.value = URL.createObjectURL(file)
        }

        const compressImage = (file, maxSize = 1024 * 1024) => {
            return new Promise((resolve) => {
                const img = new Image()
                const reader = new FileReader()
                reader.onload = (e) => {
                    img.src = e.target.result
                }
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')
                    const maxDimension = 1200
                    let { width, height } = img
                    if (width > maxDimension || height > maxDimension) {
                        const scale = Math.min(maxDimension / width, maxDimension / height)
                        width = Math.round(width * scale)
                        height = Math.round(height * scale)
                    }
                    canvas.width = width
                    canvas.height = height
                    ctx.drawImage(img, 0, 0, width, height)
                    let quality = 0.9
                    const attempt = () => {
                        canvas.toBlob(
                            (blob) => {
                                if (blob && blob.size <= maxSize) {
                                    resolve(new File([blob], file.name, { type: blob.type }))
                                } else if (quality > 0.1) {
                                    quality -= 0.1
                                    attempt()
                                } else {
                                    resolve(file)
                                }
                            },
                            'image/jpeg',
                            quality
                        )
                    }
                    attempt()
                }
                reader.readAsDataURL(file)
            })
        }

        const loadVehicle = async() => {
            await withOverlay(async() => {
                try {
                    const token = localStorage.getItem('token')
                    const id = route.params.id || route.query.vehicleId
                    if (!token || !id) return
                    const vehicle = await getVehicle(token, id)
                    editingId.value = vehicle.id
                    isEditing.value = true
                    form.value = {
                        make: vehicle.make || '',
                        model: vehicle.model || '',
                        year: vehicle.year || '',
                        color: vehicle.color || '',
                        licensePlate: vehicle.licensePlate || '',
                        registrationExpiryDate: vehicle.registrationExpiryDate ? vehicle.registrationExpiryDate.split('T')[0] : '',
                        vin: vehicle.vin || '',
                        vehicleType: vehicle.vehicleType || 'CAR',
                        purchaseDate: vehicle.purchaseDate ? vehicle.purchaseDate.split('T')[0] : '',
                        currentMileage: vehicle.currentMileage || '',
                        notes: vehicle.notes || ''
                    }
                    if (vehicle.imageUrl) {
                        existingImageUrl.value = vehicle.imageUrl
                        imagePreview.value = vehicle.imageUrl.startsWith('http') ? vehicle.imageUrl : `${API_BASE_URL}${vehicle.imageUrl}`
                    }
                } catch (err) {
                    console.error(err)
                }
            })
        }

        const submitVehicle = async() => {
            errorMessage.value = ''
            successMessage.value = ''
            submitting.value = true
            try {
                const saveMessage = imageFile.value ? 'Uploading photo…' : 'Saving…'
                await withOverlay(async() => {
                    const token = localStorage.getItem('token')
                    if (!token) {
                        throw new Error('You must be logged in.')
                    }
                    const payload = new FormData()
                    Object.entries(form.value).forEach(([key, value]) => {
                        if (value !== null && value !== undefined && value !== '') {
                            payload.append(key, value)
                        }
                    })
                    if (!imageFile.value && existingImageUrl.value) {
                        payload.append('imageUrl', existingImageUrl.value)
                    }
                    if (imageFile.value) {
                        const compressed = await compressImage(imageFile.value)
                        payload.append('image', compressed)
                    }
                    if (isEditing.value && editingId.value) {
                        await updateVehicle(token, editingId.value, payload)
                        successMessage.value = 'Vehicle updated successfully'
                    } else {
                        await createVehicle(token, payload)
                        successMessage.value = 'Vehicle added successfully'
                    }
                    setTimeout(() => {
                        router.push('/car-maintenance/vehicles')
                    }, 600)
                }, saveMessage)
            } catch (err) {
                errorMessage.value = err?.message || 'Something went wrong'
            } finally {
                submitting.value = false
            }
        }

        onMounted(() => {
            loadVehicle()
        })

        return {
            form,
            fileInput,
            imagePreview,
            submitting,
            errorMessage,
            successMessage,
            triggerFileInput,
            handleFileChange,
            submitVehicle,
            isEditing,
            loadingOverlay,
            loadingMessage,
            staggerReady
        }
    }
}
</script>

<style scoped>
/* ── Hero ── */

/* ── Form body ── */
.car-body { padding: 16px !important; display: flex !important; flex-direction: column !important; gap: 14px !important; }

/* ── Field labels ── */
.car-field label { color: var(--text-primary); font-size: 13px; font-weight: 700; }

/* ── Inputs / select / textarea — orange focus ── */
.car-input:focus,
.car-select:focus,
.car-textarea:focus {
  outline: none !important;
  border-color: rgba(249, 115, 22, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.15) !important;
}

/* ── Upload card ── */
.upload-card {
  background: var(--glass-card-bg) !important;
  border: 1px solid var(--glass-card-border) !important;
  border-radius: 16px !important;
  box-shadow: var(--glass-card-shadow) !important;
  padding: 16px !important;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.upload-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #f97316, #fb923c);
}
.upload-card label { font-size: 13px; font-weight: 700; color: var(--text-primary); }

.upload-box {
  border: 1px dashed rgba(249, 115, 22, 0.35);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fb923c;
  background: rgba(249, 115, 22, 0.06);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.15s;
}
.upload-box:hover { background: rgba(249, 115, 22, 0.1); }

.hidden { display: none; }

.preview {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(249, 115, 22, 0.2);
}
.preview img { width: 100%; height: auto; display: block; }

/* ── Submit button ── */
.car-btn[type="submit"] {
  background: linear-gradient(135deg, #f97316, #fb923c) !important;
  color: #fff !important;
  border: none !important;
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.35) !important;
  border-radius: 14px !important;
  padding: 14px !important;
  font-size: 15px !important;
  font-weight: 800 !important;
}
.car-btn[type="submit"]:disabled { opacity: 0.65 !important; cursor: not-allowed !important; }

/* ── Messages ── */
.error-text { color: #f87171; margin: 4px 0 0; font-size: 13px; }
.success-text { color: #4ade80; margin: 4px 0 0; font-size: 13px; }
</style>
