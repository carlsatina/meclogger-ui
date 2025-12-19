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
                <h2 class="headline">Maintenance Detail</h2>
            </div>
        </div>
    </header>
    <main class="car-body">
        <div v-if="loading" class="car-empty">Loading...</div>
        <div v-else-if="errorMessage" class="car-empty">{{ errorMessage }}</div>
        <div v-else-if="!record" class="car-empty">Record not found.</div>
        <div v-else class="car-panel">
            <div class="car-record-top">
                <div>
                    <p class="car-record-title">{{ record.maintenanceType || 'Maintenance' }}</p>
                    <p class="car-record-date">{{ formatDate(record.serviceDate) }}</p>
                </div>
                <span class="car-pill">{{ formatCurrency(record.cost, record.currency || defaultCurrency) }}</span>
            </div>

            <div class="car-meta-row">
                <div class="car-meta">
                    <mdicon name="counter" :size="18"/>
                    <span>{{ formatMileage(record.mileageAtService) }}</span>
                </div>
                <div class="car-meta">
                    <mdicon name="account-wrench" :size="18"/>
                    <span>{{ record.servicedBy || '—' }}</span>
                </div>
            </div>

            <div class="car-detail-grid">
                <div class="car-detail-row">
                    <span class="car-detail-label">Vehicle</span>
                    <span class="car-detail-value">{{ displayName(record.vehicle) }}</span>
                </div>
                <div class="car-detail-row">
                    <span class="car-detail-label">Location</span>
                    <span class="car-detail-value">{{ record.location || '—' }}</span>
                </div>
                <div class="car-detail-row">
                    <span class="car-detail-label">Parts Used</span>
                    <span class="car-detail-value">{{ record.partsUsed || '—' }}</span>
                </div>
                <div class="car-detail-row">
                    <span class="car-detail-label">Labor Hours</span>
                    <span class="car-detail-value">{{ record.laborHours || '—' }}</span>
                </div>
                <div class="car-detail-row">
                    <span class="car-detail-label">Description</span>
                    <span class="car-detail-value">{{ record.description || '—' }}</span>
                </div>
            </div>

            <div class="car-detail-actions">
                <button class="car-btn ghost full" @click="editRecord">Edit</button>
                <button class="car-btn danger full" @click="showDelete = true">Delete</button>
            </div>
        </div>
    </main>

    <div v-if="showDelete" class="car-modal-backdrop" @click.self="showDelete = false">
        <div class="car-modal">
            <p class="car-modal-title">Delete maintenance?</p>
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

export default {
    name: 'CarMaintenanceMaintenanceDetailWeb',
    setup() {
        const route = useRoute()
        const router = useRouter()
        const { getMaintenanceRecord, deleteMaintenanceRecord, getPreferences } = useCarMaintenance()
        const record = ref(null)
        const loading = ref(false)
        const deleting = ref(false)
        const errorMessage = ref('')
        const showDelete = ref(false)
        const distanceUnit = ref('km')
        const defaultCurrency = ref('USD')

        const formatDate = (value) => {
            if (!value) return '—'
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return '—'
            return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
        }

        const formatMileage = (value) => {
            if (value === null || value === undefined) return '—'
            const num = Number(value) || 0
            const converted = distanceUnit.value === 'mi' ? num * 0.621371 : num
            const unitLabel = distanceUnit.value === 'mi' ? 'mi' : 'km'
            return `${converted.toLocaleString()} ${unitLabel}`
        }

        const displayName = (vehicle) => {
            if (!vehicle) return 'Vehicle'
            const parts = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean)
            return parts.join(' ').trim() || 'Vehicle'
        }

        const formatCurrency = (value, currency = 'USD') => {
            if (value === null || value === undefined) return '—'
            try {
                return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value)
            } catch (e) {
                return `${value.toLocaleString()} ${currency}`
            }
        }

        const loadPrefs = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                const prefs = await getPreferences(token)
                if (prefs?.distanceUnit) distanceUnit.value = prefs.distanceUnit
                if (prefs?.currency) defaultCurrency.value = prefs.currency
            } catch (err) {
                distanceUnit.value = 'km'
                defaultCurrency.value = 'USD'
            }
        }

        const loadRecord = async() => {
            loading.value = true
            errorMessage.value = ''
            try {
                const token = localStorage.getItem('token')
                if (!token) throw new Error('You must be logged in.')
                const rec = await getMaintenanceRecord(token, route.params.id)
                record.value = rec
            } catch (err) {
                errorMessage.value = err?.message || 'Unable to load record'
            } finally {
                loading.value = false
            }
        }

        const editRecord = () => {
            if (!record.value?.id) return
            router.push({ path: '/web/car-maintenance/maintenance/add', query: { id: record.value.id } })
        }

        const confirmDelete = async() => {
            if (!record.value?.id) return
            deleting.value = true
            try {
                const token = localStorage.getItem('token')
                if (!token) throw new Error('You must be logged in.')
                await deleteMaintenanceRecord(token, record.value.id)
                showDelete.value = false
                router.push('/web/car-maintenance')
            } catch (err) {
                alert(err?.message || 'Unable to delete record')
            } finally {
                deleting.value = false
            }
        }

        onMounted(async() => {
            await loadPrefs()
            await loadRecord()
        })

        return {
            router,
            record,
            loading,
            deleting,
            errorMessage,
            showDelete,
            formatDate,
            formatMileage,
            formatCurrency,
            displayName,
            editRecord,
            confirmDelete,
            defaultCurrency
        }
    }
}
</script>
