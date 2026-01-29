<template>
<div class="logbook-shell">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <div v-if="showToast" class="logbook-toast">
        <div class="toast-icon">
            <mdicon name="check-circle" size="20"/>
        </div>
        <div>
            <p class="toast-title">Savings saved</p>
            <p class="toast-message">{{ toastMessage }}</p>
        </div>
    </div>
    <div v-if="showErrorPopup" class="error-popup-backdrop" @click.self="closeErrorPopup">
        <div class="error-popup glass-card">
            <h4>Something went wrong</h4>
            <p>{{ errorPopupMessage }}</p>
            <button class="glass-btn-primary" type="button" @click="closeErrorPopup">Okay</button>
        </div>
    </div>

    <LogbookTopNav
        variant="mobile"
        title="Savings"
        subtitle="Track savings without affecting balances."
        icon="piggy-bank-outline"
    />

    <section class="logbook-section">
        <div class="section-head">
            <div class="section-title-row">
                <h3>New savings entry</h3>
                <button class="glass-btn-ghost back-btn" type="button" @click="goBack">
                    <mdicon name="arrow-left" size="16" />
                    <span>Back</span>
                </button>
            </div>
            <p>Record deposits, transfers, or milestones.</p>
        </div>
        <article class="glass-card logbook-form">
            <div class="form-grid">
                <label class="form-field">
                    <span>Date</span>
                    <input type="date" v-model="form.date" />
                </label>

                <label class="form-field">
                    <span>Amount</span>
                    <input type="number" step="0.01" v-model="form.amount" placeholder="0.00" />
                </label>

                <label class="form-field">
                    <span>Option</span>
                    <select v-model="form.option">
                        <option value="CASH_IN">Cash-in</option>
                        <option value="CASH_OUT">Cash-out</option>
                    </select>
                </label>

                <label class="form-field">
                    <span>Source</span>
                    <input type="text" v-model="form.source" placeholder="e.g. Rental surplus" />
                </label>

                <label class="form-field span-two">
                    <span>Notes</span>
                    <textarea rows="3" v-model="form.notes" placeholder="Add a note"></textarea>
                </label>
            </div>
            <div class="form-actions">
                <button class="glass-btn-primary" type="button" :disabled="saving" @click="saveSavings">
                    {{ saving ? 'Saving…' : 'Save savings' }}
                </button>
            </div>
        </article>
    </section>

    <LogbookBottomNav variant="mobile" />
</div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/constants/config'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

export default {
    name: "LogbookSavingsMobile",
    components: {
        LogbookBottomNav,
        LogbookTopNav
    },
    setup() {
        const getToday = () => {
            const now = new Date()
            return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 10)
        }

        const defaultForm = () => ({
            date: getToday(),
            amount: '',
            option: 'CASH_IN',
            source: '',
            notes: ''
        })

        const router = useRouter()
        const form = ref(defaultForm())
        const saving = ref(false)
        const showToast = ref(false)
        const toastMessage = ref('')
        const showErrorPopup = ref(false)
        const errorPopupMessage = ref('')
        let toastTimer = null

        const saveSavings = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            if (saving.value) return
            saving.value = true
            try {
                const amountValue = Number(form.value.amount)
                const payload = {
                    date: form.value.date || getToday(),
                    amount: Number.isNaN(amountValue) ? 0 : amountValue,
                    option: form.value.option || 'CASH_IN',
                    source: form.value.source || null,
                    notes: form.value.notes || null
                }
                const res = await fetch(`${API_BASE_URL}/api/v1/logbook/savings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to save savings entry')
                form.value = defaultForm()
                toastMessage.value = 'Savings entry has been saved.'
                showToast.value = true
                if (toastTimer) clearTimeout(toastTimer)
                toastTimer = setTimeout(() => {
                    showToast.value = false
                }, 3000)
            } catch (err) {
                errorPopupMessage.value = err?.message || 'Unable to save savings entry'
                showErrorPopup.value = true
            } finally {
                saving.value = false
            }
        }

        const closeErrorPopup = () => {
            showErrorPopup.value = false
        }

        const goBack = () => {
            if (window.history.length > 1) {
                router.back()
                return
            }
            router.push('/logbook/more')
        }

        return {
            form,
            saving,
            showToast,
            toastMessage,
            showErrorPopup,
            errorPopupMessage,
            saveSavings,
            closeErrorPopup,
            goBack
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-mobile.css"></style>
