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
                <h2 class="headline">Schedule Detail</h2>
            </div>
        </div>
    </header>
    <main class="car-body">
        <div v-if="loading" class="car-empty">Loading...</div>
        <div v-else-if="errorMessage" class="car-empty">{{ errorMessage }}</div>
        <div v-else-if="!reminder" class="car-empty">Schedule not found.</div>
        <div v-else class="car-panel">
            <div class="car-record-top">
                <div>
                    <p class="car-record-title">{{ reminder.maintenanceType || 'Schedule' }}</p>
                    <p class="car-record-date">{{ formatDate(reminder.dueDate) }}</p>
                </div>
                <span class="car-pill">{{ statusFor(reminder).label }}</span>
            </div>

            <div class="car-meta-row">
                <div class="car-meta">
                    <mdicon name="counter" :size="18"/>
                    <span>{{ formatMileage(reminder.dueMileage) }}</span>
                </div>
                <div class="car-meta">
                    <mdicon name="timer-sand" :size="18"/>
                    <span>{{ statusFor(reminder).label }}</span>
                </div>
            </div>

            <div class="car-detail-grid">
                <div class="car-detail-row">
                    <span class="car-detail-label">Vehicle</span>
                    <span class="car-detail-value">{{ displayName(reminder.vehicle) }}</span>
                </div>
                <div class="car-detail-row">
                    <span class="car-detail-label">Notes</span>
                    <span class="car-detail-value">{{ reminder.description || '—' }}</span>
                </div>
            </div>

            <div class="car-detail-actions">
                <button class="car-btn ghost full" @click="editSchedule">Edit</button>
                <button class="car-btn danger full" @click="showDelete = true">Delete</button>
            </div>
        </div>
    </main>

    <div v-if="showDelete" class="car-modal-backdrop" @click.self="showDelete = false">
        <div class="car-modal">
            <p class="car-modal-title">Delete schedule?</p>
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
    name: 'CarMaintenanceScheduleDetailWeb',
    setup() {
        const route = useRoute()
        const router = useRouter()
        const { getReminder, deleteReminder, getPreferences } = useCarMaintenance()
        const reminder = ref(null)
        const loading = ref(false)
        const deleting = ref(false)
        const errorMessage = ref('')
        const showDelete = ref(false)
        const distanceUnit = ref('km')

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

        const daysLeft = (rem) => {
            if (!rem?.dueDate) return null
            const due = new Date(rem.dueDate)
            if (Number.isNaN(due.getTime())) return null
            const now = new Date()
            return Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }

        const statusFor = (rem) => {
            if (rem?.completed) return { label: 'Completed' }
            const d = daysLeft(rem)
            if (d === null) return { label: 'No due date' }
            if (d < 0) return { label: 'Missed' }
            if (d === 0) return { label: 'Due today' }
            if (d === 1) return { label: 'Due tomorrow' }
            return { label: `${d} days left` }
        }

        const loadPrefs = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                const prefs = await getPreferences(token)
                if (prefs?.distanceUnit) distanceUnit.value = prefs.distanceUnit
            } catch (err) {
                distanceUnit.value = 'km'
            }
        }

        const loadReminder = async() => {
            loading.value = true
            errorMessage.value = ''
            try {
                const token = localStorage.getItem('token')
                if (!token) throw new Error('You must be logged in.')
                const data = await getReminder(token, route.params.id)
                reminder.value = data
            } catch (err) {
                errorMessage.value = err?.message || 'Unable to load schedule'
            } finally {
                loading.value = false
            }
        }

        const editSchedule = () => {
            if (!reminder.value?.id) return
            router.push({ path: '/web/car-maintenance/schedules/add', query: { id: reminder.value.id } })
        }

        const confirmDelete = async() => {
            if (!reminder.value?.id) return
            deleting.value = true
            try {
                const token = localStorage.getItem('token')
                if (!token) throw new Error('You must be logged in.')
                await deleteReminder(token, reminder.value.id)
                showDelete.value = false
                router.push('/web/car-maintenance')
            } catch (err) {
                alert(err?.message || 'Unable to delete schedule')
            } finally {
                deleting.value = false
            }
        }

        onMounted(async() => {
            await loadPrefs()
            await loadReminder()
        })

        return {
            router,
            reminder,
            loading,
            deleting,
            errorMessage,
            showDelete,
            displayName,
            formatDate,
            formatMileage,
            statusFor,
            editSchedule,
            confirmDelete
        }
    }
}
</script>
