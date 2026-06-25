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
            <div class="car-type-wrap" ref="typeWrapRef">
                <div class="car-type-input">
                    <input
                        class="car-type-field"
                        v-model="form.maintenanceType"
                        type="text"
                        placeholder="Select or type"
                        @focus="showTypeList = true"
                    />
                    <button type="button" class="type-icon" @click="showTypeList = !showTypeList">
                        <mdicon name="menu-down" :size="20"/>
                    </button>
                </div>
                <div v-if="showTypeList" class="car-type-list">
                    <button type="button" class="car-type-option" v-for="option in typeOptions" :key="option" @mousedown.prevent @click="selectType(option)">
                        {{ option }}
                    </button>
                </div>
            </div>
        </div>

        <div class="car-grid-2">
            <div class="car-field">
                <label>Service Date</label>
                <input v-model="form.serviceDate" type="date" required class="car-input" />
            </div>
            <div class="car-field">
                <label>Mileage at Service ({{ distanceUnitLabel }})</label>
                <input v-model="form.mileageAtService" type="number" min="0" :placeholder="distanceUnit === 'mi' ? '50000' : '80456'" class="car-input" />
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
                <label>Cost</label>
                <input v-model="form.cost" type="number" min="0" step="0.01" placeholder="4000" class="car-input" />
            </div>
        </div>

        <div class="car-grid-2">
            <div class="car-field">
                <label>Serviced By</label>
                <input v-model="form.servicedBy" type="text" placeholder="Service Center" class="car-input" />
            </div>
            <div class="car-field">
                <label>Location</label>
                <input v-model="form.location" type="text" placeholder="City / Garage" class="car-input" />
            </div>
        </div>

        <div class="car-field">
            <label>Parts Used</label>
            <textarea v-model="form.partsUsed" rows="2" placeholder="List parts used" class="car-textarea"></textarea>
        </div>

        <div class="car-field">
            <label>Photos (receipts or parts)</label>
            <label class="photo-dropzone" :class="{ disabled: totalPhotoCount >= 6 }">
                <input type="file" accept="image/*" multiple :disabled="totalPhotoCount >= 6" @change="onPhotoChange" />
                <mdicon name="tray-arrow-up" :size="24" class="photo-dropzone-icon" />
                <span class="photo-dropzone-title">
                    {{ totalPhotoCount >= 6 ? 'Maximum photos added' : 'Tap to add photos' }}
                </span>
                <span class="photo-dropzone-sub">{{ totalPhotoCount }}/6 · max 10MB each</span>
            </label>
            <div v-if="totalPhotoCount" class="maint-photo-grid">
                <div v-for="(url, i) in keptPhotos" :key="'k' + i" class="maint-photo-item">
                    <img :src="resolvePhoto(url)" alt="Maintenance photo" />
                    <button type="button" class="maint-photo-x" @click="removeKeptPhoto(i)">×</button>
                </div>
                <div v-for="(p, i) in newPhotos" :key="'n' + i" class="maint-photo-item">
                    <img :src="p.preview" alt="Maintenance photo" />
                    <button type="button" class="maint-photo-x" @click="removeNewPhoto(i)">×</button>
                </div>
            </div>
            <p v-if="photoError" class="maint-photo-error">{{ photoError }}</p>
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
    <Loading v-if="loadingOverlay" :label="loadingMessage"/>
</div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCarMaintenance } from '@/composables/carMaintenance'
import { API_BASE_URL } from '@/constants/config'
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
        const loadingMessage = ref('')
        const staggerReady = useStaggerReady()

        const todayLocal = () => {
            const now = new Date()
            const offsetMs = now.getTimezoneOffset() * 60000
            return new Date(now.getTime() - offsetMs).toISOString().split('T')[0]
        }

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

        const MAX_PHOTOS = 6
        const MAX_FILE_BYTES = 10 * 1024 * 1024
        const newPhotos = ref([])   // [{ file, preview }] picked this session
        const keptPhotos = ref([])  // raw stored urls retained from an existing record
        const photoError = ref('')
        const totalPhotoCount = computed(() => keptPhotos.value.length + newPhotos.value.length)
        const resolvePhoto = (u) => u ? (u.startsWith('http') ? u : `${API_BASE_URL}${u}`) : ''

        const onPhotoChange = (e) => {
            const files = Array.from(e.target.files || [])
            photoError.value = ''
            const tooBig = files.filter(f => f.size > MAX_FILE_BYTES)
            const valid = files.filter(f => f.size <= MAX_FILE_BYTES)
            const room = Math.max(0, MAX_PHOTOS - totalPhotoCount.value)
            valid.slice(0, room).forEach(file => {
                newPhotos.value.push({ file, preview: URL.createObjectURL(file) })
            })
            const notes = []
            if (tooBig.length) notes.push(`${tooBig.length} photo${tooBig.length > 1 ? 's were' : ' was'} over 10MB and skipped`)
            if (valid.length > room) notes.push(`only ${MAX_PHOTOS} photos allowed`)
            if (notes.length) photoError.value = notes.join(' · ')
            e.target.value = '' // allow re-picking the same file
        }
        const removeNewPhoto = (i) => newPhotos.value.splice(i, 1)
        const removeKeptPhoto = (i) => keptPhotos.value.splice(i, 1)

        const payload = computed(() => ({
            ...form.value,
            title: form.value.maintenanceType || 'Maintenance',
            mileageAtService: form.value.mileageAtService || undefined,
            cost: form.value.cost || undefined,
            laborHours: form.value.laborHours || undefined
        }))

        // Multipart when photos are involved (new files, or editing where the kept set
        // must be communicated); otherwise plain JSON.
        const buildBody = () => {
            const base = payload.value
            if (newPhotos.value.length || isEditing.value) {
                const fd = new FormData()
                Object.entries(base).forEach(([k, v]) => {
                    if (v !== undefined && v !== null) fd.append(k, v)
                })
                fd.append('keepPhotos', JSON.stringify(keptPhotos.value))
                newPhotos.value.forEach(p => fd.append('photos', p.file))
                return fd
            }
            return base
        }

        const distanceUnitLabel = computed(() => distanceUnit.value === 'mi' ? 'miles' : 'km')

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
                keptPhotos.value = (rec.photos && rec.photos.length)
                    ? [...rec.photos]
                    : (rec.receiptUrl ? [rec.receiptUrl] : [])
                newPhotos.value = []
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
                const saveMessage = newPhotos.value.length ? 'Uploading photos…' : 'Saving…'
                await withOverlay(async() => {
                    const token = localStorage.getItem('token')
                    if (!token) throw new Error('You must be logged in.')
                    if (isEditing.value && editingId.value) {
                        await updateMaintenanceRecord(token, editingId.value, buildBody())
                        successMessage.value = 'Maintenance updated'
                    } else {
                        await createMaintenanceRecord(token, buildBody())
                        successMessage.value = 'Maintenance saved'
                    }
                    setTimeout(() => {
                        router.push('/car-maintenance')
                    }, 600)
                }, saveMessage)
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

        const typeWrapRef = ref(null)
        const handleClickOutside = (e) => {
            if (!showTypeList.value) return
            if (typeWrapRef.value && !typeWrapRef.value.contains(e.target)) {
                showTypeList.value = false
            }
        }
        onMounted(() => document.addEventListener('pointerdown', handleClickOutside))
        onBeforeUnmount(() => document.removeEventListener('pointerdown', handleClickOutside))

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
                } else {
                    if (!form.value.serviceDate) {
                        form.value.serviceDate = todayLocal()
                    }
                    if (!form.value.mileageAtService) {
                        const veh = vehicles.value.find(v => v.id === form.value.vehicleId)
                        if (veh?.currentMileage != null) {
                            form.value.mileageAtService = veh.currentMileage
                        }
                    }
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
            typeWrapRef,
            typeOptions,
            selectType,
            distanceUnit,
            distanceUnitLabel,
            currencyOptions,
            cancelEdit,
            loadingOverlay,
            loadingMessage,
            staggerReady,
            newPhotos,
            keptPhotos,
            photoError,
            totalPhotoCount,
            resolvePhoto,
            onPhotoChange,
            removeNewPhoto,
            removeKeptPhoto
        }
    }
}
</script>

<style scoped>
/* Hero — orange gradient matching index */

/* Form body */
.car-body { padding: 16px !important; gap: 16px !important; }

/* Maintenance photo gallery */
.maint-photo-grid {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}
.maint-photo-item {
    position: relative;
    aspect-ratio: 1 / 1;
}
.maint-photo-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
    border: 1px solid var(--glass-card-border);
}
.maint-photo-x {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    font-size: 15px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}
/* Styled photo upload dropzone (replaces native file input) */
.photo-dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 18px 14px;
    border: 1.5px dashed var(--glass-card-border);
    border-radius: 14px;
    background: var(--glass-ghost-bg);
    cursor: pointer;
    text-align: center;
    transition: border-color 0.15s, background 0.15s, transform 0.1s;
}
.photo-dropzone:hover { border-color: rgba(249, 115, 22, 0.55); background: rgba(249, 115, 22, 0.06); }
.photo-dropzone:active { transform: scale(0.99); }
.photo-dropzone input { display: none; }
.photo-dropzone-icon { color: #fb923c; }
.photo-dropzone-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.photo-dropzone-sub { font-size: 11px; color: var(--text-muted); }
.photo-dropzone.disabled {
    cursor: not-allowed;
    opacity: 0.55;
    border-style: solid;
}
.photo-dropzone.disabled:hover { border-color: var(--glass-card-border); background: var(--glass-ghost-bg); }
.photo-dropzone.disabled:active { transform: none; }
.maint-photo-error {
    margin-top: 4px;
    font-size: 12px;
    color: #f87171;
}

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
.car-type-wrap { position: relative; }
.car-type-input {
    background: var(--glass-card-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 12px !important;
    overflow: hidden !important;
    display: flex !important;
    align-items: center !important;
    gap: 0 !important;
    transition: border-color 0.15s, box-shadow 0.15s !important;
}
.car-type-input:focus-within {
    border-color: rgba(249, 115, 22, 0.5) !important;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1) !important;
}
.car-type-field { border: none !important; outline: none !important; padding: 12px 14px !important; background: transparent !important; font-size: 15px !important; color: var(--text-primary) !important; flex: 1 !important; width: 100% !important; box-sizing: border-box !important; }
.type-icon { border: none !important; background: transparent !important; color: var(--text-muted) !important; padding: 0 12px !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; }

/* Type dropdown list — floats over the fields below */
.car-type-list {
    position: absolute !important;
    top: calc(100% + 4px) !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 50 !important;
    max-height: 50vh !important;
    overflow-y: auto !important;
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 4px !important;
    background: var(--confirm-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 12px !important;
    padding: 8px !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55) !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
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

/* 2-col grid — always two columns to save vertical space */
.car-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 12px !important; }

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
