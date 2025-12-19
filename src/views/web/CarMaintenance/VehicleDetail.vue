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
                <h2 class="headline">Vehicle Detail</h2>
            </div>
        </div>
    </header>
    <main class="car-body">
        <div v-if="loading" class="car-empty">Loading...</div>
        <div v-else-if="errorMessage" class="car-empty">{{ errorMessage }}</div>
        <div v-else-if="!vehicle" class="car-empty">Vehicle not found.</div>
        <div v-else class="car-panel">
            <div class="hero-image">
                <img
                    v-if="vehicle.imageUrl"
                    :src="vehicle.imageUrl.startsWith('http') ? vehicle.imageUrl : `${API_BASE_URL}${vehicle.imageUrl}`"
                    alt="vehicle"
                />
                <div v-else class="placeholder">
                    <mdicon name="car-sports" :size="48"/>
                </div>
            </div>

            <div class="top">
                <div class="meta">
                    <p class="car-record-title">{{ displayName(vehicle) }}</p>
                    <p class="car-record-date">{{ vehicle.vehicleType || 'Vehicle' }}</p>
                    <p class="car-record-date" v-if="vehicle.currentMileage">Odometer: {{ vehicle.currentMileage.toLocaleString() }} km</p>
                </div>
            </div>

            <div class="car-detail-grid">
                <div class="car-detail-row"><span class="car-detail-label">License Plate</span><span class="car-detail-value">{{ vehicle.licensePlate || '—' }}</span></div>
                <div class="car-detail-row"><span class="car-detail-label">VIN</span><span class="car-detail-value">{{ vehicle.vin || '—' }}</span></div>
                <div class="car-detail-row"><span class="car-detail-label">Registration Exp.</span><span class="car-detail-value">{{ formatExpiry(vehicle.registrationExpiryDate) }}</span></div>
                <div class="car-detail-row"><span class="car-detail-label">Color</span><span class="car-detail-value">{{ vehicle.color || '—' }}</span></div>
                <div class="car-detail-row"><span class="car-detail-label">Notes</span><span class="car-detail-value">{{ vehicle.notes || '—' }}</span></div>
            </div>

            <div class="car-detail-actions">
                <button class="car-btn ghost full" @click="editVehicle">Edit</button>
                <button class="car-btn danger full" @click="showDelete = true">Delete</button>
            </div>
        </div>
    </main>

    <div v-if="showDelete" class="car-modal-backdrop" @click.self="showDelete = false">
        <div class="car-modal">
            <p class="car-modal-title">Delete vehicle?</p>
            <p class="car-modal-text">This cannot be undone.</p>
            <div class="car-modal-actions">
                <button class="cancel" @click="showDelete = false">Cancel</button>
                <button class="confirm" :disabled="deleting" @click="confirmDelete">
                    {{ deleting ? 'Deleting...' : 'Delete' }}
                </button>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCarMaintenance } from '@/composables/carMaintenance'
import { API_BASE_URL } from '@/constants/config'

export default {
    name: 'CarMaintenanceVehicleDetailWeb',
    setup() {
        const route = useRoute()
        const router = useRouter()
        const { getVehicle, deleteVehicle } = useCarMaintenance()
        const vehicle = ref(null)
        const loading = ref(false)
        const deleting = ref(false)
        const errorMessage = ref('')
        const showDelete = ref(false)

        const displayName = (v) => {
            const parts = [v?.make, v?.model, v?.year].filter(Boolean)
            return parts.join(' ').trim() || 'Vehicle'
        }
        const formatExpiry = (value) => {
            if (!value) return '(No date set)'
            const d = new Date(value)
            if (Number.isNaN(d.getTime())) return '(No date set)'
            return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
        }

        const loadVehicle = async() => {
            loading.value = true
            errorMessage.value = ''
            try {
                const token = localStorage.getItem('token')
                if (!token) throw new Error('You must be logged in.')
                const data = await getVehicle(token, route.params.id)
                vehicle.value = data
            } catch (err) {
                errorMessage.value = err?.message || 'Unable to load vehicle'
            } finally {
                loading.value = false
            }
        }

        const editVehicle = () => {
            if (!vehicle.value?.id) return
            router.push(`/web/car-maintenance/vehicles/${vehicle.value.id}/edit`)
        }

        const confirmDelete = async() => {
            if (!vehicle.value?.id) return
            deleting.value = true
            try {
                const token = localStorage.getItem('token')
                if (!token) throw new Error('You must be logged in.')
                await deleteVehicle(token, vehicle.value.id)
                showDelete.value = false
                router.push('/web/car-maintenance/vehicles')
            } catch (err) {
                alert(err?.message || 'Unable to delete vehicle')
            } finally {
                deleting.value = false
            }
        }

        onMounted(() => {
            loadVehicle()
        })

        return {
            router,
            API_BASE_URL,
            vehicle,
            loading,
            errorMessage,
            showDelete,
            displayName,
            formatExpiry,
            editVehicle,
            confirmDelete,
            deleting
        }
    }
}
</script>

<style scoped>
.hero-image {
    width: 100%;
    height: 400px;
    aspect-ratio: 16 / 9;
    border-radius: 16px;
    overflow: hidden;
    background: linear-gradient(135deg, var(--accent-1), var(--accent-3));
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--glass-card-shadow);
}
.hero-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.placeholder { color: var(--text-muted); }
.top { margin-top: 12px; }
</style>
