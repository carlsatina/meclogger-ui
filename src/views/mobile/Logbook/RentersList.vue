<template>
<div class="logbook-shell">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <LogbookTopNav
        variant="mobile"
        title="Renters List"
        subtitle="All renters saved in your logbook."
        icon="account-group-outline"
    />

    <section class="logbook-section">
        <div class="section-head">
            <h3>Renters</h3>
            <p>Active and inactive renters.</p>
        </div>
        <div class="table-search">
            <input v-model="search" type="text" placeholder="Search renters" />
        </div>
        <div v-if="loading" class="glass-card empty-state">Loading renters…</div>
        <div v-else-if="error" class="glass-card empty-state error-text">{{ error }}</div>
        <div v-else class="renter-list">
            <article v-for="renter in filteredRenters" :key="renter.id" class="glass-card renter-card">
                <div class="renter-head">
                    <div>
                        <h3>{{ renterName(renter) }}</h3>
                        <p>{{ renter.apartment || '—' }}</p>
                    </div>
                    <div class="status-group">
                        <span class="status-pill" :class="statusClass(renter.status)">
                            {{ formatStatus(renter.status) }}
                        </span>
                        <button class="status-edit-btn" type="button" @click="goToEdit(renter)" aria-label="Edit renter">
                            <mdicon name="pencil-outline" size="14" />
                        </button>
                    </div>
                </div>
                <div class="renter-row">
                    <span>Contact</span>
                    <span>{{ renter.contactNo || '—' }}</span>
                </div>
                <div class="renter-row">
                    <span>Email</span>
                    <span>{{ renter.email || '—' }}</span>
                </div>
                <div class="renter-row">
                    <span>Rental</span>
                    <span>{{ formatMoney(renter.rentalAmount) }}</span>
                </div>
                <div class="renter-row">
                    <span>Transfer</span>
                    <span>{{ formatDate(renter.transferDate) }}</span>
                </div>
                <p class="remarks" v-if="renter.remarks">{{ renter.remarks }}</p>
            </article>
            <div v-if="!filteredRenters.length" class="glass-card empty-state">No renters yet.</div>
        </div>
    </section>

    <LogbookBottomNav variant="mobile" />
</div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/constants/config'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

export default {
    name: "LogbookRentersListMobile",
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

        const statusClass = (value) => {
            return String(value || '').toLowerCase() === 'active' ? 'active' : 'inactive'
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
            statusClass,
            goToEdit
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-mobile.css"></style>
