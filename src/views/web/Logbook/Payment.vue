<template>
<div class="logbook-page">
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
        variant="web"
        title="Payments"
        subtitle="Track rent collections, dues, and receipts in one place."
        icon="credit-card-outline"
    />

    <section class="logbook-section">
        <div class="section-head">
            <h3>New payment</h3>
            <p>Capture payment details for your logbook.</p>
        </div>
        <div class="glass-card balance-card">
            <div class="balance-item">
                <span>Mama running balance</span>
                <strong>{{ formatMoney(balances.mama) }}</strong>
            </div>
            <div class="balance-item">
                <span>RC running balance</span>
                <strong>{{ formatMoney(balances.rc) }}</strong>
            </div>
            <div class="balance-item balance-total">
                <span>Total balance</span>
                <strong>{{ formatMoney(balances.total) }}</strong>
            </div>
        </div>
        <form class="glass-card logbook-form" @submit.prevent>
            <div class="form-grid">
                <label class="form-field">
                    <span>Date</span>
                    <input type="date" v-model="form.date" />
                </label>

                <div class="form-row">
                    <label class="form-field">
                        <span>Main category</span>
                        <select v-model="form.mainCategory">
                            <option value="" disabled>Select category</option>
                            <option v-for="cat in mainCategories" :key="cat" :value="cat">{{ cat }}</option>
                        </select>
                    </label>

                    <label class="form-field">
                        <span>Sub category</span>
                        <select v-model="form.subCategory" :disabled="!form.mainCategory">
                            <option value="" disabled>
                                {{ form.mainCategory ? 'Select sub category' : 'Select main category first' }}
                            </option>
                            <option v-for="sub in subCategories" :key="sub" :value="sub">{{ sub }}</option>
                        </select>
                    </label>
                </div>

                <div v-if="renterVisible" class="form-row">
                    <label class="form-field">
                        <span>Renter</span>
                        <select v-model="form.renterId" :disabled="renterLoading">
                            <option value="" disabled>
                                {{ renterLoading ? 'Loading renters…' : 'Select renter' }}
                            </option>
                            <option v-for="renter in filteredRenters" :key="renter.id" :value="renter.id">
                                {{ renterLabel(renter) }}
                            </option>
                        </select>
                    </label>

                    <label class="form-field">
                        <span>Month paid (Auto-detected)</span>
                        <select v-model="form.monthPaid" @change="userOverrodeMonth = true">
                            <option value="" disabled>Select month</option>
                            <option v-for="month in monthOptions" :key="month" :value="month">{{ month }}</option>
                        </select>
                        <div v-if="renterMonthStatus && form.renterId" class="renter-status-hint">
                            <mdicon name="information-outline" size="14" />
                            <span v-if="renterMonthStatus.isPartial">
                                {{ renterMonthStatus.selectedMonth }} has <strong>{{ formatMoney(renterMonthStatus.remainingBalance) }}</strong> remaining balance ({{ formatMoney(renterMonthStatus.totalPaidForMonth) }} paid so far of {{ formatMoney(renterMonthStatus.expectedRent) }}).
                            </span>
                            <span v-else-if="renterMonthStatus.isFullyPaid">
                                {{ renterMonthStatus.selectedMonth }} is <strong>fully paid</strong> ({{ formatMoney(renterMonthStatus.totalPaidForMonth) }} paid).
                            </span>
                            <span v-else-if="renterMonthStatus.expectedRent">
                                Agreed rent for {{ renterMonthStatus.selectedMonth || 'month' }}: <strong>{{ formatMoney(renterMonthStatus.expectedRent) }}</strong>.
                            </span>
                        </div>
                    </label>
                </div>

                <label class="form-field">
                    <span>Amount</span>
                    <input type="number" step="0.01" v-model="form.amount" placeholder="0.00" />
                </label>

                <label class="form-field span-two">
                    <span>Description</span>
                    <textarea rows="3" v-model="form.description" placeholder="Add a note"></textarea>
                </label>
            </div>
            <div class="form-actions">
                <button class="glass-btn-primary" type="button" :disabled="saving || !amountValid" @click="savePayment()">
                    {{ saving ? 'Saving…' : 'Save payment' }}
                </button>
                <span v-if="saveError" class="error-text">{{ saveError }}</span>
            </div>
        </form>
    </section>

    <LogbookBottomNav variant="web" />
</div>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import { API_BASE_URL } from '@/constants/config'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

export default {
    name: "LogbookPaymentWeb",
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
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ]

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
            if (category === 'Fuji View') {
                return renters.value.filter(renter => isApartmentMatch(renter, 'fuji view'))
            }
            if (category === 'Yellow Fantasy') {
                return renters.value.filter(renter => isApartmentMatch(renter, 'yellow fantasy'))
            }
            if (category === 'Parking') {
                return renters.value.filter(renter => isApartmentMatch(renter, 'parking'))
            }
            return renters.value
        })

        const allPayments = ref([])
        const userOverrodeMonth = ref(false)

        const getMonthFromDateStr = (dateStr) => {
            if (!dateStr) return ''
            const parts = dateStr.split('-')
            if (parts.length === 3) {
                const monthIndex = parseInt(parts[1], 10) - 1
                if (monthIndex >= 0 && monthIndex < 12) {
                    return monthOptions[monthIndex]
                }
            }
            const d = new Date(dateStr)
            if (!isNaN(d.getTime())) {
                return monthOptions[d.getMonth()]
            }
            return ''
        }

        const getRenterMonthStatus = (renterId, targetMonth) => {
            if (!renterId || !renters.value.length) return null
            const renter = renters.value.find(r => r.id === renterId)
            if (!renter) return null

            const expectedRent = Number(renter.rentalAmount || 0)
            const rName = renterLabel(renter).toLowerCase()
            const selectedM = targetMonth || form.value.monthPaid

            if (!allPayments.value || !allPayments.value.length) {
                return {
                    renter,
                    expectedRent,
                    selectedMonth: selectedM,
                    totalPaidForMonth: 0,
                    isPartial: false,
                    isFullyPaid: false,
                    remainingBalance: expectedRent
                }
            }

            const renterPmts = allPayments.value.filter(p => {
                const desc = (p.description || '').toLowerCase()
                return desc.includes(rName)
            })

            let totalPaidForMonth = 0
            if (selectedM) {
                const smLower = selectedM.toLowerCase()
                for (const pmt of renterPmts) {
                    const desc = (pmt.description || '').toLowerCase()
                    if (desc.includes(smLower)) {
                        totalPaidForMonth += Math.abs(Number(pmt.amount || 0))
                    }
                }
            }

            const isPartial = expectedRent > 0 && totalPaidForMonth > 0 && totalPaidForMonth < expectedRent
            const isFullyPaid = expectedRent > 0 && totalPaidForMonth >= expectedRent
            const remainingBalance = expectedRent > 0 ? Math.max(0, expectedRent - totalPaidForMonth) : 0

            return {
                renter,
                expectedRent,
                selectedMonth: selectedM,
                totalPaidForMonth,
                isPartial,
                isFullyPaid,
                remainingBalance
            }
        }

        const renterMonthStatus = computed(() => getRenterMonthStatus(form.value.renterId, form.value.monthPaid))

        const detectRenterNextMonth = (renterId, dateStr) => {
            const defaultMonth = getMonthFromDateStr(dateStr) || monthOptions[new Date().getMonth()]
            if (!renterId || !renters.value.length) return defaultMonth

            const renter = renters.value.find(r => r.id === renterId)
            if (!renter) return defaultMonth

            const rName = renterLabel(renter).toLowerCase()
            const expectedRent = Number(renter.rentalAmount || 0)
            if (!allPayments.value || !allPayments.value.length) return defaultMonth

            const renterPmts = allPayments.value.filter(p => {
                const desc = (p.description || '').toLowerCase()
                return desc.includes(rName)
            })

            if (!renterPmts.length) return defaultMonth

            const monthTotals = {}
            for (const pmt of renterPmts) {
                const desc = (pmt.description || '').toLowerCase()
                const amount = Math.abs(Number(pmt.amount || 0))
                for (let i = 0; i < monthOptions.length; i++) {
                    const m = monthOptions[i].toLowerCase()
                    if (desc.includes(m)) {
                        monthTotals[monthOptions[i]] = (monthTotals[monthOptions[i]] || 0) + amount
                    }
                }
            }

            // 1. First check if any month has a partial payment balance
            for (let i = 0; i < monthOptions.length; i++) {
                const m = monthOptions[i]
                const paid = monthTotals[m] || 0
                if (paid > 0 && expectedRent > 0 && paid < expectedRent) {
                    return m
                }
            }

            // 2. Otherwise find the latest paid month and suggest next month
            for (let i = 11; i >= 0; i--) {
                const m = monthOptions[i]
                if (monthTotals[m] !== undefined && monthTotals[m] > 0) {
                    return monthOptions[(i + 1) % 12]
                }
            }

            return defaultMonth
        }

        const autoDetectMonth = () => {
            if (!userOverrodeMonth.value && (renterVisible.value || form.value.subCategory === 'Rental')) {
                form.value.monthPaid = detectRenterNextMonth(form.value.renterId, form.value.date)
            }
        }

        watch(
            () => form.value.mainCategory,
            () => {
                if (!subCategories.value.includes(form.value.subCategory)) {
                    form.value.subCategory = ''
                }
                if (!renterVisible.value || !filteredRenters.value.some(renter => renter.id === form.value.renterId)) {
                    form.value.renterId = ''
                }
            }
        )

        watch(
            () => renterVisible.value,
            (visible) => {
                if (!visible) {
                    form.value.monthPaid = ''
                    userOverrodeMonth.value = false
                } else {
                    autoDetectMonth()
                }
            }
        )

        watch([() => form.value.renterId, () => form.value.date], () => {
            if (renterVisible.value) {
                autoDetectMonth()
            }
        })

        const amountValid = computed(() => {
            if (form.value.amount === '' || form.value.amount === null || form.value.amount === undefined) return false
            const amountValue = Number(form.value.amount)
            return !Number.isNaN(amountValue)
        })

        const hasContent = computed(() => {
            const textFilled = [form.value.mainCategory, form.value.subCategory, form.value.description]
                .some(value => String(value || '').trim().length > 0)
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
            const mama = main === 'mama expense' || sub.startsWith('mama')
            const yellowFantasy = main === 'yellow fantasy'
            const parking = main === 'parking'
            return mama || yellowFantasy || parking
        }

        const isGroupB = (item) => {
            const main = normalize(item.mainCategory)
            const sub = normalize(item.subCategory)
            const rc = main === 'rc expense' || sub.startsWith('rc')
            const fuji = main === 'fuji' || main === 'fuji view'
            return rc || fuji
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
                allPayments.value = items
                autoDetectMonth()
                const sum = (list) => list.reduce((total, item) => {
                    const amount = Number(item.amount || 0)
                    return total + (isExpense(item) ? -Math.abs(amount) : Math.abs(amount))
                }, 0)
                const mama = sum(items.filter(isGroupA))
                const rc = sum(items.filter(isGroupB))
                balances.value = { mama, rc, total: mama + rc }
            } catch (err) {
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
                if (!res.ok) {
                    throw new Error(data?.message || 'Unable to save payment')
                }
                paymentId.value = ''
                userOverrodeMonth.value = false
                form.value = defaultForm()
                saveError.value = ''
                toastMessage.value = 'Payment has been saved.'
                showToast.value = true
                if (toastTimer) clearTimeout(toastTimer)
                toastTimer = setTimeout(() => {
                    showToast.value = false
                }, 3000)
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
                if (amountValid.value && saveError.value === 'Amount is required.') {
                    saveError.value = ''
                }
            }
        )

        const updateAutoDescription = () => {
            const renter = renters.value.find(item => item.id === form.value.renterId)
            const isRental = form.value.subCategory === 'Rental'
            const isParking = form.value.mainCategory === 'Parking'
            if ((isRental || isParking) && renter) {
                const status = getRenterMonthStatus(renter.id, form.value.monthPaid)
                let monthSuffix = ''
                if (form.value.monthPaid) {
                    if (status && status.isPartial) {
                        const paidStr = formatMoney(status.totalPaidForMonth)
                        const reqStr = formatMoney(status.expectedRent)
                        const balStr = formatMoney(status.remainingBalance)
                        monthSuffix = ` - ${form.value.monthPaid} (Partial advance: ₱${paidStr} paid so far of ₱${reqStr} rent, ₱${balStr} remaining)`
                    } else if (status && status.expectedRent > 0) {
                        monthSuffix = ` - ${form.value.monthPaid} (Agreed rent: ₱${formatMoney(status.expectedRent)})`
                    } else {
                        monthSuffix = ` - ${form.value.monthPaid}`
                    }
                }
                const autoText = isParking
                    ? `Parking payment - ${renterLabel(renter)}${monthSuffix}`
                    : `Rental payment - ${renterLabel(renter)}${monthSuffix}`
                if (!form.value.description || form.value.description === lastAutoDescription.value) {
                    form.value.description = autoText
                }
                lastAutoDescription.value = autoText
                return
            }
            if (form.value.description === lastAutoDescription.value) {
                form.value.description = ''
            }
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
            renterLabel,
            renterMonthStatus,
            userOverrodeMonth
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-web.css"></style>
