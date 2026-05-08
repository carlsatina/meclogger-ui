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
        <div class="rl-toolbar">
            <div class="rl-count-label">
                <span v-if="!loading">{{ filteredRenters.length }} renter{{ filteredRenters.length !== 1 ? 's' : '' }}</span>
            </div>
            <div class="table-search rl-search">
                <mdicon name="magnify" size="18" class="rl-search-icon" />
                <input v-model="search" type="text" placeholder="Search renters" />
            </div>
        </div>

        <div v-if="loading" class="glass-card empty-state">Loading renters…</div>
        <div v-else-if="error" class="glass-card empty-state error-text">{{ error }}</div>
        <div v-else class="rl-list">
            <article v-for="renter in filteredRenters" :key="renter.id" class="glass-card rl-card">

                <!-- Header row: avatar + name + status + edit -->
                <div class="rl-card-head">
                    <div class="rl-avatar" :class="statusClass(renter.status)">
                        {{ initials(renter) }}
                    </div>
                    <div class="rl-identity">
                        <h3 class="rl-name">{{ renterName(renter) }}</h3>
                        <p class="rl-unit">{{ renter.apartment || 'No unit specified' }}</p>
                    </div>
                    <div class="rl-head-right">
                        <span class="status-pill" :class="statusClass(renter.status)">
                            {{ formatStatus(renter.status) }}
                        </span>
                        <button class="glass-btn-ghost rl-edit-btn" type="button" @click="goToEdit(renter)">
                            <mdicon name="pencil-outline" size="16" />
                            <span>Edit</span>
                        </button>
                    </div>
                </div>

                <!-- Detail rows with icons -->
                <div class="rl-details">
                    <div class="rl-detail-row" v-if="renter.contactNo">
                        <mdicon name="phone-outline" size="16" class="rl-detail-icon" />
                        <span>{{ renter.contactNo }}</span>
                    </div>
                    <div class="rl-detail-row" v-if="renter.email">
                        <mdicon name="email-outline" size="16" class="rl-detail-icon" />
                        <span>{{ renter.email }}</span>
                    </div>
                    <div class="rl-detail-row">
                        <mdicon name="cash-multiple" size="16" class="rl-detail-icon" />
                        <span class="rl-rental-amount">{{ formatMoney(renter.rentalAmount) }}<span class="rl-per-mo"> / mo</span></span>
                    </div>
                    <div class="rl-detail-row" v-if="renter.transferDate">
                        <mdicon name="calendar-outline" size="16" class="rl-detail-icon" />
                        <span>Transfer: {{ formatDate(renter.transferDate) }}</span>
                    </div>
                </div>

                <p class="rl-remarks" v-if="renter.remarks">
                    <mdicon name="note-text-outline" size="14" />
                    {{ renter.remarks }}
                </p>
            </article>

            <div v-if="!filteredRenters.length" class="glass-card empty-state">
                {{ search ? 'No renters match your search.' : 'No renters yet.' }}
            </div>
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

        const initials = (renter) => {
            const first = (renter.firstName || '').trim()
            const last = (renter.lastName || '').trim()
            if (first && last) return (first[0] + last[0]).toUpperCase()
            if (first) return first.slice(0, 2).toUpperCase()
            if (last) return last.slice(0, 2).toUpperCase()
            return '?'
        }

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
            initials,
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
