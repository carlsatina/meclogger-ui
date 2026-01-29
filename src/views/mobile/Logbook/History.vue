<template>
<div class="logbook-shell">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <div v-if="showEditModal" class="logbook-modal-backdrop" @click.self="closeEditModal">
        <div class="logbook-modal glass-card">
            <div class="modal-header">
                <div>
                    <h4>Edit payment</h4>
                    <p>Update details or remove this entry.</p>
                </div>
                <button class="glass-btn-ghost" type="button" @click="closeEditModal">
                    <mdicon name="close" size="16" />
                </button>
            </div>
            <div class="form-grid modal-grid">
                <label class="form-field">
                    <span>Date</span>
                    <input type="date" v-model="editForm.date" />
                </label>
                <label class="form-field">
                    <span>Amount</span>
                    <input type="number" step="0.01" v-model="editForm.amount" />
                </label>
                <div class="modal-row">
                    <label class="form-field">
                        <span>Main category</span>
                        <input list="main-categories-mobile" v-model="editForm.mainCategory" placeholder="Main category" />
                        <datalist id="main-categories-mobile">
                            <option v-for="cat in mainCategoryOptions" :key="cat" :value="cat"></option>
                        </datalist>
                    </label>
                    <label class="form-field">
                        <span>Sub category</span>
                        <input list="sub-categories-mobile" v-model="editForm.subCategory" placeholder="Sub category" />
                        <datalist id="sub-categories-mobile">
                            <option v-for="sub in subCategoryOptions" :key="sub" :value="sub"></option>
                        </datalist>
                    </label>
                </div>
                <label class="form-field span-two">
                    <span>Description</span>
                    <textarea rows="3" v-model="editForm.description"></textarea>
                </label>
            </div>
            <div v-if="modalError" class="error-text">{{ modalError }}</div>
            <div class="modal-actions inline-actions">
                <button class="glass-btn-ghost danger-btn" type="button" :disabled="modalDeleting" @click="openDeleteConfirm">
                    {{ modalDeleting ? 'Deleting…' : 'Delete' }}
                </button>
                <button class="glass-btn-primary" type="button" :disabled="modalSaving" @click="saveEdit">
                    {{ modalSaving ? 'Saving…' : 'Save changes' }}
                </button>
            </div>
        </div>
    </div>
    <div v-if="showDeleteConfirm" class="logbook-modal-backdrop" @click.self="closeDeleteConfirm">
        <div class="logbook-modal glass-card confirm-modal">
            <h4>Delete this payment?</h4>
            <p>This action cannot be undone.</p>
            <div class="modal-actions">
                <button class="glass-btn-ghost" type="button" @click="closeDeleteConfirm">Cancel</button>
                <button class="glass-btn-ghost danger-btn" type="button" :disabled="modalDeleting" @click="confirmDelete">
                    {{ modalDeleting ? 'Deleting…' : 'Delete' }}
                </button>
            </div>
        </div>
    </div>

    <LogbookTopNav
        variant="mobile"
        title="History"
        subtitle="Every log entry in one timeline."
        action-icon="tune-variant"
        action-label="Display options"
        @action="showDisplayPanel = !showDisplayPanel"
    />

    <div v-if="showDisplayPanel" class="display-flyout">
        <div class="display-panel glass-card">
            <label class="display-option">
                <input type="checkbox" v-model="showMain" />
                <span>Main</span>
            </label>
            <label class="display-option">
                <input type="checkbox" v-model="showSub" />
                <span>Sub</span>
            </label>
            <label class="display-option">
                <span>Rows</span>
                <select v-model.number="pageSize">
                    <option :value="10">10</option>
                    <option :value="20">20</option>
                    <option :value="50">50</option>
                </select>
            </label>
        </div>
    </div>

    <section class="logbook-section">
        <div class="section-head">
            <div class="section-title-row">
                <h3>Mama / Yellow Fantasy / Parking</h3>
                <button
                    class="glass-btn-ghost collapse-toggle"
                    type="button"
                    :aria-label="showGroupA ? 'Hide table' : 'Show table'"
                    :title="showGroupA ? 'Hide table' : 'Show table'"
                    @click="showGroupA = !showGroupA"
                >
                    <mdicon :name="showGroupA ? 'chevron-up' : 'chevron-down'" size="18" />
                </button>
            </div>
        </div>
        <div v-if="showGroupA" class="table-search">
            <input v-model="searchA" type="text" placeholder="Search entries" />
        </div>
        <article v-if="showGroupA" class="glass-card table-card">
            <div v-if="loading" class="empty-state">Loading history…</div>
            <div v-else-if="error" class="empty-state error-text">{{ error }}</div>
            <div v-else class="table-wrap">
                <table class="logbook-table" :class="{ 'compact-table': !showMain && !showSub }">
                    <thead>
                        <tr>
                            <th class="sortable" @click="toggleSort('A', 'date')" :aria-sort="ariaSort(sortA, 'date')">
                                Date
                                <mdicon v-if="sortA.key === 'date'" :name="sortA.dir === 'asc' ? 'chevron-up' : 'chevron-down'" size="12" class="sort-icon"/>
                            </th>
                            <th v-if="showMain" class="sortable" @click="toggleSort('A', 'main')" :aria-sort="ariaSort(sortA, 'main')">
                                Main
                                <mdicon v-if="sortA.key === 'main'" :name="sortA.dir === 'asc' ? 'chevron-up' : 'chevron-down'" size="12" class="sort-icon"/>
                            </th>
                            <th v-if="showSub" class="sortable" @click="toggleSort('A', 'sub')" :aria-sort="ariaSort(sortA, 'sub')">
                                Sub
                                <mdicon v-if="sortA.key === 'sub'" :name="sortA.dir === 'asc' ? 'chevron-up' : 'chevron-down'" size="12" class="sort-icon"/>
                            </th>
                            <th class="desc-col sortable" @click="toggleSort('A', 'description')" :aria-sort="ariaSort(sortA, 'description')">
                                Description
                                <mdicon v-if="sortA.key === 'description'" :name="sortA.dir === 'asc' ? 'chevron-up' : 'chevron-down'" size="12" class="sort-icon"/>
                            </th>
                            <th class="number sortable" @click="toggleSort('A', 'amount')" :aria-sort="ariaSort(sortA, 'amount')">
                                Amount
                                <mdicon v-if="sortA.key === 'amount'" :name="sortA.dir === 'asc' ? 'chevron-up' : 'chevron-down'" size="12" class="sort-icon"/>
                            </th>
                            <th class="number sortable" @click="toggleSort('A', 'balance')" :aria-sort="ariaSort(sortA, 'balance')">
                                Balance
                                <mdicon v-if="sortA.key === 'balance'" :name="sortA.dir === 'asc' ? 'chevron-up' : 'chevron-down'" size="12" class="sort-icon"/>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in pagedGroupA" :key="item.id">
                            <td>{{ formatDate(item.paymentDate) }}</td>
                            <td v-if="showMain">{{ item.mainCategory || '—' }}</td>
                            <td v-if="showSub">{{ item.subCategory || '—' }}</td>
                            <td class="desc-col">{{ item.description || '—' }}</td>
                            <td class="number">{{ formatMoney(item.amount) }}</td>
                            <td class="number">
                                <button class="balance-btn" type="button" @click="openEdit(item)" aria-label="View payment details">
                                    {{ formatMoney(groupARunningMap.get(item.id) || 0) }}
                                </button>
                            </td>
                        </tr>
                        <tr v-if="!pagedGroupA.length">
                            <td :colspan="columnCount" class="empty-row">No entries yet.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </article>
        <div v-if="showGroupA" class="table-pagination">
            <button class="glass-btn-ghost" type="button" :disabled="pageA <= 1" @click="pageA -= 1">
                <mdicon name="chevron-left" size="16" />
            </button>
            <span>Page {{ pageA }} of {{ totalPagesA }}</span>
            <button class="glass-btn-ghost" type="button" :disabled="pageA >= totalPagesA" @click="pageA += 1">
                <mdicon name="chevron-right" size="16" />
            </button>
        </div>
    </section>

    <section class="logbook-section">
        <div class="section-head">
            <div class="section-title-row">
                <h3>RC / Fuji View</h3>
                <button
                    class="glass-btn-ghost collapse-toggle"
                    type="button"
                    :aria-label="showGroupB ? 'Hide table' : 'Show table'"
                    :title="showGroupB ? 'Hide table' : 'Show table'"
                    @click="showGroupB = !showGroupB"
                >
                    <mdicon :name="showGroupB ? 'chevron-up' : 'chevron-down'" size="18" />
                </button>
            </div>
        </div>
        <div v-if="showGroupB" class="table-search">
            <input v-model="searchB" type="text" placeholder="Search entries" />
        </div>
        <article v-if="showGroupB" class="glass-card table-card">
            <div v-if="loading" class="empty-state">Loading history…</div>
            <div v-else-if="error" class="empty-state error-text">{{ error }}</div>
            <div v-else class="table-wrap">
                <table class="logbook-table" :class="{ 'compact-table': !showMain && !showSub }">
                    <thead>
                        <tr>
                            <th class="sortable" @click="toggleSort('B', 'date')" :aria-sort="ariaSort(sortB, 'date')">
                                Date
                                <mdicon v-if="sortB.key === 'date'" :name="sortB.dir === 'asc' ? 'chevron-up' : 'chevron-down'" size="12" class="sort-icon"/>
                            </th>
                            <th v-if="showMain" class="sortable" @click="toggleSort('B', 'main')" :aria-sort="ariaSort(sortB, 'main')">
                                Main
                                <mdicon v-if="sortB.key === 'main'" :name="sortB.dir === 'asc' ? 'chevron-up' : 'chevron-down'" size="12" class="sort-icon"/>
                            </th>
                            <th v-if="showSub" class="sortable" @click="toggleSort('B', 'sub')" :aria-sort="ariaSort(sortB, 'sub')">
                                Sub
                                <mdicon v-if="sortB.key === 'sub'" :name="sortB.dir === 'asc' ? 'chevron-up' : 'chevron-down'" size="12" class="sort-icon"/>
                            </th>
                            <th class="desc-col sortable" @click="toggleSort('B', 'description')" :aria-sort="ariaSort(sortB, 'description')">
                                Description
                                <mdicon v-if="sortB.key === 'description'" :name="sortB.dir === 'asc' ? 'chevron-up' : 'chevron-down'" size="12" class="sort-icon"/>
                            </th>
                            <th class="number sortable" @click="toggleSort('B', 'amount')" :aria-sort="ariaSort(sortB, 'amount')">
                                Amount
                                <mdicon v-if="sortB.key === 'amount'" :name="sortB.dir === 'asc' ? 'chevron-up' : 'chevron-down'" size="12" class="sort-icon"/>
                            </th>
                            <th class="number sortable" @click="toggleSort('B', 'balance')" :aria-sort="ariaSort(sortB, 'balance')">
                                Balance
                                <mdicon v-if="sortB.key === 'balance'" :name="sortB.dir === 'asc' ? 'chevron-up' : 'chevron-down'" size="12" class="sort-icon"/>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in pagedGroupB" :key="item.id">
                            <td>{{ formatDate(item.paymentDate) }}</td>
                            <td v-if="showMain">{{ item.mainCategory || '—' }}</td>
                            <td v-if="showSub">{{ item.subCategory || '—' }}</td>
                            <td class="desc-col">{{ item.description || '—' }}</td>
                            <td class="number">{{ formatMoney(item.amount) }}</td>
                            <td class="number">
                                <button class="balance-btn" type="button" @click="openEdit(item)" aria-label="View payment details">
                                    {{ formatMoney(groupBRunningMap.get(item.id) || 0) }}
                                </button>
                            </td>
                        </tr>
                        <tr v-if="!pagedGroupB.length">
                            <td :colspan="columnCount" class="empty-row">No entries yet.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </article>
        <div v-if="showGroupB" class="table-pagination">
            <button class="glass-btn-ghost" type="button" :disabled="pageB <= 1" @click="pageB -= 1">
                <mdicon name="chevron-left" size="16" />
            </button>
            <span>Page {{ pageB }} of {{ totalPagesB }}</span>
            <button class="glass-btn-ghost" type="button" :disabled="pageB >= totalPagesB" @click="pageB += 1">
                <mdicon name="chevron-right" size="16" />
            </button>
        </div>
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
    name: "LogbookHistoryMobile",
    components: {
        LogbookBottomNav,
        LogbookTopNav
    },
    setup() {
        const payments = ref([])
        const loading = ref(false)
        const error = ref('')
        const showDisplayPanel = ref(false)
        const showMain = ref(false)
        const showSub = ref(false)
        const showGroupA = ref(true)
        const showGroupB = ref(true)
        const searchA = ref('')
        const searchB = ref('')
        const pageA = ref(1)
        const pageB = ref(1)
        const pageSize = ref(10)

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

        const groupA = computed(() => payments.value.filter(isGroupA))
        const groupB = computed(() => payments.value.filter(isGroupB))
        const columnCount = computed(() => 4 + (showMain.value ? 1 : 0) + (showSub.value ? 1 : 0))
        const sortA = ref({ key: 'date', dir: 'desc' })
        const sortB = ref({ key: 'date', dir: 'desc' })
        const showEditModal = ref(false)
        const showDeleteConfirm = ref(false)
        const editForm = ref({
            id: '',
            date: '',
            mainCategory: '',
            subCategory: '',
            description: '',
            amount: ''
        })
        const modalError = ref('')
        const modalSaving = ref(false)
        const modalDeleting = ref(false)

        const buildRunningMap = (items) => {
            const map = new Map()
            const hasServerBalance = items.some(item => item.runningBalance !== null && typeof item.runningBalance !== 'undefined')
            if (hasServerBalance) {
                items.forEach((item) => {
                    map.set(item.id, Number(item.runningBalance || 0))
                })
                return map
            }
            const sorted = [...items].sort((a, b) => {
                const aDate = new Date(a.paymentDate).getTime() || 0
                const bDate = new Date(b.paymentDate).getTime() || 0
                if (aDate !== bDate) return aDate - bDate
                const aCreated = new Date(a.createdAt || 0).getTime() || 0
                const bCreated = new Date(b.createdAt || 0).getTime() || 0
                return aCreated - bCreated
            })
            let running = 0
            sorted.forEach((item) => {
                const amount = Number(item.amount || 0)
                running += isExpense(item) ? -Math.abs(amount) : Math.abs(amount)
                map.set(item.id, running)
            })
            return map
        }

        const matchesSearch = (item, query) => {
            const needle = String(query || '').trim().toLowerCase()
            if (!needle) return true
            return [
                item.paymentDate,
                item.mainCategory,
                item.subCategory,
                item.description,
                item.amount,
                item.runningBalance
            ].some(value => String(value || '').toLowerCase().includes(needle))
        }

        const filteredGroupA = computed(() => groupA.value.filter(item => matchesSearch(item, searchA.value)))
        const filteredGroupB = computed(() => groupB.value.filter(item => matchesSearch(item, searchB.value)))
        const groupARunningMap = computed(() => buildRunningMap(groupA.value))
        const groupBRunningMap = computed(() => buildRunningMap(groupB.value))

        const defaultDirForKey = (key) => (key === 'date' ? 'desc' : 'asc')

        const toggleSort = (group, key) => {
            const sortRef = group === 'A' ? sortA : sortB
            if (sortRef.value.key === key) {
                sortRef.value = { ...sortRef.value, dir: sortRef.value.dir === 'asc' ? 'desc' : 'asc' }
                return
            }
            sortRef.value = { key, dir: defaultDirForKey(key) }
        }

        const ariaSort = (sort, key) => {
            if (sort.key !== key) return 'none'
            return sort.dir === 'asc' ? 'ascending' : 'descending'
        }

        const sortItems = (items, sort, balanceMap) => {
            const direction = sort.dir === 'asc' ? 1 : -1
            const getValue = (item) => {
                if (sort.key === 'date') return new Date(item.paymentDate || 0).getTime() || 0
                if (sort.key === 'main') return String(item.mainCategory || '').toLowerCase()
                if (sort.key === 'sub') return String(item.subCategory || '').toLowerCase()
                if (sort.key === 'description') return String(item.description || '').toLowerCase()
                if (sort.key === 'amount') return Number(item.amount || 0)
                if (sort.key === 'balance') return Number(balanceMap.get(item.id) || 0)
                return 0
            }
            return [...items].sort((a, b) => {
                const aVal = getValue(a)
                const bVal = getValue(b)
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return (aVal - bVal) * direction
                }
                return String(aVal).localeCompare(String(bVal)) * direction
            })
        }

        const sortedGroupA = computed(() => sortItems(filteredGroupA.value, sortA.value, groupARunningMap.value))
        const sortedGroupB = computed(() => sortItems(filteredGroupB.value, sortB.value, groupBRunningMap.value))
        const totalPagesA = computed(() => Math.max(1, Math.ceil(filteredGroupA.value.length / pageSize.value)))
        const totalPagesB = computed(() => Math.max(1, Math.ceil(filteredGroupB.value.length / pageSize.value)))
        const pagedGroupA = computed(() => {
            const start = (pageA.value - 1) * pageSize.value
            return sortedGroupA.value.slice(start, start + pageSize.value)
        })
        const pagedGroupB = computed(() => {
            const start = (pageB.value - 1) * pageSize.value
            return sortedGroupB.value.slice(start, start + pageSize.value)
        })

        watch(searchA, () => { pageA.value = 1 })
        watch(searchB, () => { pageB.value = 1 })
        watch(pageSize, () => {
            pageA.value = 1
            pageB.value = 1
        })
        watch(() => [sortA.value.key, sortA.value.dir], () => { pageA.value = 1 })
        watch(() => [sortB.value.key, sortB.value.dir], () => { pageB.value = 1 })
        watch(totalPagesA, (total) => {
            if (pageA.value > total) pageA.value = total
        })
        watch(totalPagesB, (total) => {
            if (pageB.value > total) pageB.value = total
        })

        const formatDate = (value) => {
            if (!value) return '—'
            return new Date(value).toLocaleDateString()
        }

        const formatMoney = (value) => {
            const num = Number(value || 0)
            return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }

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

        const mainCategoryOptions = computed(() => {
            const current = editForm.value.mainCategory
            if (current && !mainCategories.includes(current)) {
                return [current, ...mainCategories]
            }
            return mainCategories
        })

        const subCategoryOptions = computed(() => {
            const main = editForm.value.mainCategory
            const list = subCategoryMap[main] || []
            const current = editForm.value.subCategory
            if (current && !list.includes(current)) {
                return [current, ...list]
            }
            return list
        })

        const toDateInput = (value) => {
            if (!value) return ''
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return ''
            return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 10)
        }

        const openEdit = (item) => {
            editForm.value = {
                id: item.id,
                date: toDateInput(item.paymentDate),
                mainCategory: item.mainCategory || '',
                subCategory: item.subCategory || '',
                description: item.description || '',
                amount: String(item.amount ?? '')
            }
            modalError.value = ''
            showEditModal.value = true
        }

        const closeEditModal = () => {
            showEditModal.value = false
            showDeleteConfirm.value = false
            modalError.value = ''
        }

        const openDeleteConfirm = () => {
            showDeleteConfirm.value = true
        }

        const closeDeleteConfirm = () => {
            showDeleteConfirm.value = false
        }

        const saveEdit = async () => {
            if (!editForm.value.id) return
            const token = localStorage.getItem('token')
            if (!token) return
            const amountValue = Number(editForm.value.amount)
            if (Number.isNaN(amountValue)) {
                modalError.value = 'Amount is required.'
                return
            }
            modalSaving.value = true
            modalError.value = ''
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/logbook/payments/${editForm.value.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        date: editForm.value.date || null,
                        mainCategory: editForm.value.mainCategory || null,
                        subCategory: editForm.value.subCategory || null,
                        description: editForm.value.description || null,
                        amount: amountValue
                    })
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to update payment')
                await loadPayments()
                closeEditModal()
            } catch (err) {
                modalError.value = err?.message || 'Unable to update payment'
            } finally {
                modalSaving.value = false
            }
        }

        const confirmDelete = async () => {
            if (!editForm.value.id) return
            const token = localStorage.getItem('token')
            if (!token) return
            modalDeleting.value = true
            modalError.value = ''
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/logbook/payments/${editForm.value.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to delete payment')
                await loadPayments()
                closeDeleteConfirm()
                closeEditModal()
            } catch (err) {
                modalError.value = err?.message || 'Unable to delete payment'
            } finally {
                modalDeleting.value = false
            }
        }

        const loadPayments = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            loading.value = true
            error.value = ''
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/logbook/payments`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to load history')
                payments.value = Array.isArray(data.payments) ? data.payments : []
            } catch (err) {
                error.value = err?.message || 'Unable to load history'
            } finally {
                loading.value = false
            }
        }

        onMounted(loadPayments)

        return {
            payments,
            loading,
            error,
            groupA,
            groupB,
            showDisplayPanel,
            showMain,
            showSub,
            showGroupA,
            showGroupB,
            searchA,
            searchB,
            columnCount,
            filteredGroupA,
            filteredGroupB,
            pageA,
            pageB,
            pageSize,
            totalPagesA,
            totalPagesB,
            pagedGroupA,
            pagedGroupB,
            groupARunningMap,
            groupBRunningMap,
            sortA,
            sortB,
            toggleSort,
            ariaSort,
            showEditModal,
            showDeleteConfirm,
            editForm,
            modalError,
            modalSaving,
            modalDeleting,
            openEdit,
            closeEditModal,
            saveEdit,
            confirmDelete,
            openDeleteConfirm,
            closeDeleteConfirm,
            mainCategoryOptions,
            subCategoryOptions,
            formatDate,
            formatMoney
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-mobile.css"></style>
