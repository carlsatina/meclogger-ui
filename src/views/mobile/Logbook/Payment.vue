<template>
<div class="logbook-shell">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <div v-if="showToast" class="logbook-toast">
        <div class="toast-icon">
            <mdicon name="check-circle" size="22"/>
        </div>
        <div>
            <p class="toast-title">Payment saved</p>
            <p class="toast-message">{{ toastMessage }}</p>
        </div>
    </div>

    <LogbookTopNav
        variant="mobile"
        title="Payments"
        subtitle="Track rent collections and dues."
        icon="credit-card-outline"
    />

    <section class="logbook-section">

        <!-- Balance summary -->
        <div class="pmt-balances">
            <div class="pmt-balance-block">
                <div class="pmt-balance-icon mama-icon">
                    <mdicon name="account-outline" size="18" />
                </div>
                <span class="pmt-balance-label">Mama</span>
                <strong class="pmt-balance-amount">{{ formatMoney(balances.mama) }}</strong>
            </div>
            <div class="pmt-balance-divider"></div>
            <div class="pmt-balance-block">
                <div class="pmt-balance-icon rc-icon">
                    <mdicon name="account-outline" size="18" />
                </div>
                <span class="pmt-balance-label">RC</span>
                <strong class="pmt-balance-amount">{{ formatMoney(balances.rc) }}</strong>
            </div>
            <div class="pmt-balance-divider"></div>
            <div class="pmt-balance-block total-block">
                <div class="pmt-balance-icon total-icon">
                    <mdicon name="sigma" size="18" />
                </div>
                <span class="pmt-balance-label">Total</span>
                <strong class="pmt-balance-amount total-amount">{{ formatMoney(balances.total) }}</strong>
            </div>
        </div>

        <!-- Entry form -->
        <article class="glass-card pmt-form">

            <!-- Amount — prominent -->
            <div class="pmt-amount-wrap">
                <span class="pmt-currency">₱</span>
                <input
                    class="pmt-amount-input"
                    type="number"
                    step="0.01"
                    v-model="form.amount"
                    placeholder="0.00"
                    inputmode="decimal"
                />
            </div>

            <!-- Date -->
            <label class="pmt-field">
                <span class="pmt-label">
                    <mdicon name="calendar-outline" size="15" />
                    Date
                </span>
                <input class="pmt-input" type="date" v-model="form.date" />
            </label>

            <!-- Main category chips -->
            <div class="pmt-field">
                <span class="pmt-label">
                    <mdicon name="tag-outline" size="15" />
                    Category
                </span>
                <div class="pmt-chip-row">
                    <button
                        v-for="cat in mainCategories"
                        :key="cat"
                        type="button"
                        class="pmt-chip"
                        :class="{ active: form.mainCategory === cat }"
                        @click="selectMain(cat)"
                    >{{ cat }}</button>
                </div>
            </div>

            <!-- Sub category chips -->
            <div v-if="subCategories.length" class="pmt-field">
                <span class="pmt-label">
                    <mdicon name="tag-multiple-outline" size="15" />
                    Sub category
                </span>
                <div class="pmt-chip-row">
                    <button
                        v-for="sub in subCategories"
                        :key="sub"
                        type="button"
                        class="pmt-chip"
                        :class="{ active: form.subCategory === sub }"
                        @click="form.subCategory = sub"
                    >{{ sub }}</button>
                </div>
            </div>

            <!-- Renter + Month (contextual) -->
            <div v-if="renterVisible" class="pmt-field-row">
                <label class="pmt-field">
                    <span class="pmt-label">
                        <mdicon name="account-outline" size="15" />
                        Renter
                    </span>
                    <select class="pmt-input" v-model="form.renterId" :disabled="renterLoading">
                        <option value="" disabled>
                            {{ renterLoading ? 'Loading…' : 'Select renter' }}
                        </option>
                        <option v-for="renter in filteredRenters" :key="renter.id" :value="renter.id">
                            {{ renterLabel(renter) }}
                        </option>
                    </select>
                </label>
                <label class="pmt-field">
                    <span class="pmt-label">
                        <mdicon name="calendar-month-outline" size="15" />
                        Month paid
                    </span>
                    <select class="pmt-input" v-model="form.monthPaid">
                        <option value="" disabled>Select month</option>
                        <option v-for="month in monthOptions" :key="month" :value="month">{{ month }}</option>
                    </select>
                </label>
            </div>

            <!-- Description -->
            <label class="pmt-field">
                <span class="pmt-label">
                    <mdicon name="note-text-outline" size="15" />
                    Description
                </span>
                <textarea class="pmt-input pmt-textarea" rows="2" v-model="form.description" placeholder="Add a note"></textarea>
            </label>

            <div class="pmt-actions">
                <button class="glass-btn-primary pmt-save-btn" type="button" :disabled="saving || !amountValid" @click="savePayment()">
                    <mdicon name="content-save-outline" size="18" />
                    {{ saving ? 'Saving…' : 'Save payment' }}
                </button>
                <span v-if="saveError" class="error-text pmt-error">{{ saveError }}</span>
            </div>
        </article>
    </section>

    <LogbookBottomNav variant="mobile" />
</div>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import { API_BASE_URL } from '@/constants/config'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

export default {
    name: "LogbookPaymentMobile",
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
            mainCategory: '',
            subCategory: '',
            renterId: '',
            monthPaid: '',
            amount: '',
            description: ''
        })
        const form = ref(defaultForm())
        const paymentId = ref('')
        const saving = ref(false)
        const saveError = ref('')
        const showToast = ref(false)
        const toastMessage = ref('')
        let toastTimer = null
        const renters = ref([])
        const renterLoading = ref(false)
        const balances = ref({ mama: 0, rc: 0, total: 0 })
        const balanceLoading = ref(false)
        let saveQueued = false
        const lastAutoDescription = ref('')

        const mainCategories = [
            'Fuji View',
            'Yellow Fantasy',
            'Parking',
            'Mama Expense',
            'RC Expense',
            'Bank Deposit',
            'Misc'
        ]

        const subCategoryMap = {
            'Fuji View': [
                'Rental',
                'Repair Materials',
                'Labor Fee',
                'Rental Refund',
                'Business Permit',
                'Others Cash-in',
                'Others Cash-out'
            ],
            'Yellow Fantasy': [
                'Rental',
                'Repair Materials',
                'Labor Fee',
                'Rental Refund',
                'Business Permit',
                'Others Cash-in',
                'Others Cash-out'
            ],
            'Parking': [
                'Rental',
                'Repair Materials',
                'Labor Fee',
                'Others Cash-in',
                'Others Cash-out'
            ],
            'Mama Expense': [
                'Donations',
                'Monetary Gifts',
                'Money Transfer',
                'House Repair/Materials',
                'House Labor Fee'
            ],
            'RC Expense': [
                'Donations',
                'Monetary Gifts',
                'Money Transfer',
                'House Repair/Materials',
                'House Labor Fee'
            ],
            'Bank Deposit': [
                'mama',
                'RC'
            ],
            'Misc': [
                'Mama cash-in',
                'Mama cash-out',
                'RC Cash-in',
                'RC Cash-out'
            ]
        }

        const subCategories = computed(() => subCategoryMap[form.value.mainCategory] || [])

        const monthOptions = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]

        const selectMain = (cat) => {
            if (form.value.mainCategory === cat) {
                form.value.mainCategory = ''
                return
            }
            form.value.mainCategory = cat
        }

        const renterLabel = (renter) => {
            const first = renter.firstName || ''
            const last = renter.lastName || ''
            const name = `${first} ${last}`.trim()
            return name.length ? name : (renter.apartment || 'Renter')
        }

        const isApartmentMatch = (renter, keyword) => {
            const apartment = String(renter?.apartment || '').toLowerCase()
            return apartment.includes(keyword)
        }

        const renterEnabled = computed(() => {
            const category = form.value.mainCategory
            return category === 'Fuji View' || category === 'Yellow Fantasy' || category === 'Parking'
        })

        const renterVisible = computed(() => {
            return renterEnabled.value && form.value.subCategory === 'Rental'
        })

        const filteredRenters = computed(() => {
            const category = form.value.mainCategory
            if (!renterEnabled.value) return []
            if (category === 'Fuji View') return renters.value.filter(r => isApartmentMatch(r, 'fuji view'))
            if (category === 'Yellow Fantasy') return renters.value.filter(r => isApartmentMatch(r, 'yellow fantasy'))
            if (category === 'Parking') return renters.value.filter(r => isApartmentMatch(r, 'parking'))
            return renters.value
        })

        watch(
            () => form.value.mainCategory,
            () => {
                if (!subCategories.value.includes(form.value.subCategory)) {
                    form.value.subCategory = ''
                }
                if (!renterVisible.value || !filteredRenters.value.some(r => r.id === form.value.renterId)) {
                    form.value.renterId = ''
                }
            }
        )

        watch(
            () => renterVisible.value,
            (visible) => { if (!visible) form.value.monthPaid = '' }
        )

        const amountValid = computed(() => {
            if (form.value.amount === '' || form.value.amount === null || form.value.amount === undefined) return false
            return !Number.isNaN(Number(form.value.amount))
        })

        const hasContent = computed(() => {
            const textFilled = [form.value.mainCategory, form.value.subCategory, form.value.description]
                .some(v => String(v || '').trim().length > 0)
            return amountValid.value || textFilled
        })

        const buildPayload = () => {
            const amountValue = Number(form.value.amount)
            return {
                date: form.value.date || getToday(),
                mainCategory: form.value.mainCategory || null,
                subCategory: form.value.subCategory || null,
                description: form.value.description || null,
                amount: Number.isNaN(amountValue) ? 0 : amountValue
            }
        }

        const formatMoney = (value) => {
            const num = Number(value || 0)
            return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }

        const normalize = (value) => String(value || '').trim().toLowerCase()

        const isExpense = (item) => {
            const main = normalize(item.mainCategory)
            const sub = normalize(item.subCategory)
            if (main === 'mama expense') return true
            if (main === 'misc' && sub === 'mama cash-out') return true
            if (main === 'rc expense') return true
            if (main === 'misc' && sub === 'rc cash-out') return true
            if (main === 'bank deposit') return true
            if (main.includes('expense')) return true
            if (sub.includes('cash-out')) return true
            if (sub.includes('refund')) return true
            if (sub.includes('repair')) return true
            if (sub.includes('labor')) return true
            if (sub.includes('permit')) return true
            return false
        }

        const isGroupA = (item) => {
            const main = normalize(item.mainCategory)
            const sub = normalize(item.subCategory)
            return main === 'mama expense' || sub.startsWith('mama') || main === 'yellow fantasy' || main === 'parking'
        }

        const isGroupB = (item) => {
            const main = normalize(item.mainCategory)
            const sub = normalize(item.subCategory)
            return main === 'rc expense' || sub.startsWith('rc') || main === 'fuji' || main === 'fuji view'
        }

        const loadBalances = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            balanceLoading.value = true
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/logbook/payments`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to load balances')
                const items = Array.isArray(data.payments) ? data.payments : []
                const sum = (list) => list.reduce((total, item) => {
                    const amount = Number(item.amount || 0)
                    return total + (isExpense(item) ? -Math.abs(amount) : Math.abs(amount))
                }, 0)
                const mama = sum(items.filter(isGroupA))
                const rc = sum(items.filter(isGroupB))
                balances.value = { mama, rc, total: mama + rc }
            } catch {
                balances.value = { mama: 0, rc: 0, total: 0 }
            } finally {
                balanceLoading.value = false
            }
        }

        const savePayment = async () => {
            if (!amountValid.value) {
                saveError.value = 'Amount is required.'
                return
            }
            if (!hasContent.value && !paymentId.value) return
            const token = localStorage.getItem('token')
            if (!token) return
            if (saving.value) {
                saveQueued = true
                return
            }
            saving.value = true
            saveError.value = ''
            try {
                const payload = buildPayload()
                const url = paymentId.value
                    ? `${API_BASE_URL}/api/v1/logbook/payments/${paymentId.value}`
                    : `${API_BASE_URL}/api/v1/logbook/payments`
                const method = paymentId.value ? 'PUT' : 'POST'
                const res = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to save payment')
                paymentId.value = ''
                form.value = defaultForm()
                saveError.value = ''
                toastMessage.value = 'Payment has been saved.'
                showToast.value = true
                if (toastTimer) clearTimeout(toastTimer)
                toastTimer = setTimeout(() => { showToast.value = false }, 3000)
                loadBalances()
            } catch (err) {
                saveError.value = err?.message || 'Unable to save payment'
            } finally {
                saving.value = false
                if (saveQueued) {
                    saveQueued = false
                    savePayment()
                }
            }
        }

        watch(
            () => form.value.amount,
            () => {
                if (amountValid.value && saveError.value === 'Amount is required.') saveError.value = ''
            }
        )

        const updateAutoDescription = () => {
            const renter = renters.value.find(r => r.id === form.value.renterId)
            const isRental = form.value.subCategory === 'Rental'
            const isParking = form.value.mainCategory === 'Parking'
            if ((isRental || isParking) && renter) {
                const monthSuffix = form.value.monthPaid ? ` - ${form.value.monthPaid}` : ''
                const autoText = isParking
                    ? `Parking payment - ${renterLabel(renter)}${monthSuffix}`
                    : `Rental payment - ${renterLabel(renter)}${monthSuffix}`
                if (!form.value.description || form.value.description === lastAutoDescription.value) {
                    form.value.description = autoText
                }
                lastAutoDescription.value = autoText
                return
            }
            if (form.value.description === lastAutoDescription.value) form.value.description = ''
            lastAutoDescription.value = ''
        }

        watch([() => form.value.renterId, () => form.value.subCategory, () => form.value.mainCategory, () => form.value.monthPaid], updateAutoDescription)

        const loadRenters = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            renterLoading.value = true
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/logbook/renters?status=ACTIVE`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (res.ok && Array.isArray(data.renters)) {
                    renters.value = data.renters
                    updateAutoDescription()
                }
            } finally {
                renterLoading.value = false
            }
        }

        onMounted(loadRenters)
        onMounted(loadBalances)

        return {
            form,
            mainCategories,
            subCategories,
            saving,
            saveError,
            savePayment,
            selectMain,
            amountValid,
            showToast,
            toastMessage,
            balances,
            balanceLoading,
            formatMoney,
            renters,
            monthOptions,
            renterEnabled,
            renterVisible,
            filteredRenters,
            renterLoading,
            renterLabel
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-mobile.css"></style>

<style scoped>
/* Balance summary */
.pmt-balances {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: stretch;
    background: var(--glass-card-bg);
    border-top: 1px solid var(--glass-card-border);
    border-bottom: 1px solid var(--glass-card-border);
    backdrop-filter: blur(16px);
    overflow: hidden;
    margin-bottom: 4px;
}

.pmt-balance-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 14px 10px;
}

.pmt-balance-divider {
    width: 1px;
    background: var(--glass-card-border);
    margin: 12px 0;
}

.pmt-balance-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: grid;
    place-items: center;
}

.mama-icon {
    background: rgba(34, 197, 94, 0.18);
    color: #16a34a;
}

.rc-icon {
    background: rgba(56, 189, 248, 0.18);
    color: #0284c7;
}

.total-icon {
    background: rgba(168, 85, 247, 0.18);
    color: #9333ea;
}

.pmt-balance-label {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
}

.pmt-balance-amount {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
}

.total-block .pmt-balance-amount {
    font-size: 15px;
    background: linear-gradient(135deg, #a855f7, #38bdf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Form card */
.pmt-form {
    display: grid;
    gap: 16px;
    padding: 18px 16px;
}

/* Amount */
.pmt-amount-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 0 4px;
}

.pmt-currency {
    font-size: 28px;
    font-weight: 300;
    color: var(--text-muted);
    line-height: 1;
}

.pmt-amount-input {
    background: transparent;
    border: none;
    border-bottom: 2px solid var(--glass-card-border);
    border-radius: 0;
    padding: 4px 8px;
    color: var(--text-primary);
    font-size: 36px;
    font-weight: 700;
    width: 100%;
    max-width: 240px;
    text-align: center;
    outline: none;
    transition: border-color 0.18s ease;
}

.pmt-amount-input:focus {
    border-bottom-color: #38bdf8;
}

.pmt-amount-input::placeholder {
    color: var(--text-muted);
    font-weight: 300;
}

/* Fields */
.pmt-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.pmt-field-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.pmt-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.pmt-input {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 12px;
    padding: 11px 14px;
    color: var(--text-primary);
    font-size: 15px;
    width: 100%;
    box-sizing: border-box;
}

.pmt-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.pmt-textarea {
    resize: none;
    font-family: inherit;
}

/* Category chips */
.pmt-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.pmt-chip {
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--glass-card-border);
    background: var(--glass-ghost-bg);
    color: var(--text-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    white-space: nowrap;
}

.pmt-chip.active {
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(34, 197, 94, 0.2));
    border-color: rgba(56, 189, 248, 0.5);
    color: var(--text-primary);
    font-weight: 600;
}

/* Save button */
.pmt-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 4px;
}

.pmt-save-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 13px 16px;
    font-size: 15px;
}

.pmt-error {
    font-size: 13px;
    text-align: center;
}
</style>
