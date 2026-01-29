<template>
<div class="logbook-page">
    <LogbookTopNav
        variant="web"
        title="Renters List"
        subtitle="All renters saved in your logbook."
        icon="account-group-outline"
    />

    <section class="logbook-section">
        <div class="section-head">
            <h3>Renters</h3>
            <p>Active and inactive renters with their details.</p>
        </div>
        <div class="table-search">
            <input v-model="search" type="text" placeholder="Search renters" />
        </div>
        <div class="glass-card table-card">
            <div v-if="loading" class="empty-state">Loading renters…</div>
            <div v-else-if="error" class="empty-state error-text">{{ error }}</div>
            <div v-else class="table-wrap">
                <table class="logbook-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Apartment</th>
                            <th>Contact</th>
                            <th>Email</th>
                            <th class="number">Rental</th>
                            <th>Transfer Date</th>
                            <th>Status</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="renter in filteredRenters" :key="renter.id">
                            <td>{{ renterName(renter) }}</td>
                            <td>{{ renter.apartment || '—' }}</td>
                            <td>{{ renter.contactNo || '—' }}</td>
                            <td>{{ renter.email || '—' }}</td>
                            <td class="number">{{ formatMoney(renter.rentalAmount) }}</td>
                            <td>{{ formatDate(renter.transferDate) }}</td>
                            <td>
                                <div class="status-cell">
                                    <span>{{ formatStatus(renter.status) }}</span>
                                    <button class="status-edit-btn" type="button" @click="goToEdit(renter)" aria-label="Edit renter">
                                        <mdicon name="pencil-outline" size="14" />
                                    </button>
                                </div>
                            </td>
                            <td>{{ renter.remarks || '—' }}</td>
                        </tr>
                        <tr v-if="!filteredRenters.length">
                            <td colspan="8" class="empty-row">No renters yet.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>

    <LogbookBottomNav variant="web" />
</div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/constants/config'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

export default {
    name: "LogbookRentersListWeb",
    components: {
        LogbookBottomNav,
        LogbookTopNav
    },
    setup() {
        const router = useRouter()
        const renters = ref([])
        const loading = ref(false)
        const error = ref('')
        const search = ref('')

        const renterName = (renter) => {
            const first = renter.firstName || ''
            const last = renter.lastName || ''
            const name = `${first} ${last}`.trim()
            return name.length ? name : '—'
        }

        const formatDate = (value) => {
            if (!value) return '—'
            return new Date(value).toLocaleDateString()
        }

        const formatMoney = (value) => {
            const num = Number(value || 0)
            if (!value && value !== 0) return '—'
            return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }

        const formatStatus = (value) => {
            if (!value) return '—'
            return String(value).toLowerCase() === 'active' ? 'Active' : 'Inactive'
        }

        const loadRenters = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            loading.value = true
            error.value = ''
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/logbook/renters`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to load renters')
                renters.value = Array.isArray(data.renters) ? data.renters : []
            } catch (err) {
                error.value = err?.message || 'Unable to load renters'
            } finally {
                loading.value = false
            }
        }

        onMounted(loadRenters)

        const matchesSearch = (renter) => {
            const needle = String(search.value || '').trim().toLowerCase()
            if (!needle) return true
            return [
                renter.firstName,
                renter.lastName,
                renter.apartment,
                renter.contactNo,
                renter.email,
                renter.status,
                renter.remarks
            ].some(value => String(value || '').toLowerCase().includes(needle))
        }

        const filteredRenters = computed(() => renters.value.filter(matchesSearch))

        const goToEdit = (renter) => {
            router.push(`/logbook/renter/${renter.id}`)
        }

        return {
            renters,
            filteredRenters,
            loading,
            error,
            search,
            renterName,
            formatDate,
            formatMoney,
            formatStatus,
            goToEdit
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-web.css"></style>
