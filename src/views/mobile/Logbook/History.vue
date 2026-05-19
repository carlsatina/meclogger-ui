<template>
<div class="logbook-shell">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <!-- ── Edit bottom sheet ── -->
    <div v-if="showEditModal" class="hs-backdrop" @click.self="closeEditModal">
        <div class="hs-sheet glass-card">
            <div class="hs-handle"></div>
            <div class="hs-head">
                <div>
                    <h4>Edit Payment</h4>
                    <p>Update details or delete this entry.</p>
                </div>
                <button class="hs-close" type="button" @click="closeEditModal">
                    <mdicon name="close" size="18"/>
                </button>
            </div>
            <div class="hs-form">
                <div class="hs-form-row">
                    <label class="hs-field">
                        <span>Date</span>
                        <input type="date" v-model="editForm.date" class="hs-input"/>
                    </label>
                    <label class="hs-field">
                        <span>Amount</span>
                        <input type="number" step="0.01" v-model="editForm.amount" class="hs-input"/>
                    </label>
                </div>
                <div class="hs-form-row">
                    <label class="hs-field">
                        <span>Main Category</span>
                        <input list="hm-main-cats" v-model="editForm.mainCategory" class="hs-input" placeholder="Category"/>
                        <datalist id="hm-main-cats">
                            <option v-for="cat in mainCategoryOptions" :key="cat" :value="cat"/>
                        </datalist>
                    </label>
                    <label class="hs-field">
                        <span>Sub Category</span>
                        <input list="hm-sub-cats" v-model="editForm.subCategory" class="hs-input" placeholder="Sub"/>
                        <datalist id="hm-sub-cats">
                            <option v-for="sub in subCategoryOptions" :key="sub" :value="sub"/>
                        </datalist>
                    </label>
                </div>
                <label class="hs-field hs-field-full">
                    <span>Description</span>
                    <textarea rows="2" v-model="editForm.description" class="hs-textarea"></textarea>
                </label>
            </div>
            <div v-if="modalError" class="hs-error">{{ modalError }}</div>
            <div class="hs-actions">
                <button class="glass-btn-ghost danger-btn" type="button" :disabled="modalDeleting" @click="openDeleteConfirm">
                    {{ modalDeleting ? 'Deleting…' : 'Delete' }}
                </button>
                <button class="glass-btn-primary" type="button" :disabled="modalSaving" @click="saveEdit">
                    {{ modalSaving ? 'Saving…' : 'Save' }}
                </button>
            </div>
        </div>
    </div>

    <!-- ── Delete confirm sheet ── -->
    <div v-if="showDeleteConfirm" class="hs-backdrop hs-confirm-backdrop" @click.self="closeDeleteConfirm">
        <div class="hs-sheet hs-confirm glass-card">
            <div class="hs-handle"></div>
            <div class="hs-confirm-body">
                <div class="hs-warn-icon">
                    <mdicon name="alert-circle-outline" size="28"/>
                </div>
                <h4>Delete this payment?</h4>
                <p>This action cannot be undone.</p>
            </div>
            <div class="hs-actions">
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
    />

    <!-- ── AI Audit banner ── -->
    <div class="hist-ai-card glass-card" @click="openAuditModal">
        <div class="hist-ai-left">
            <div class="hist-ai-icon">
                <mdicon name="magnify-scan" size="20"/>
            </div>
            <div class="hist-ai-text">
                <div class="hist-ai-title">AI Data Audit</div>
                <div class="hist-ai-sub">Detect gaps, duplicates &amp; anomalies</div>
            </div>
        </div>
        <mdicon name="chevron-right" size="18" class="hist-ai-chev"/>
    </div>

    <!-- ── Tab bar ── -->
    <div class="hist-tabs">
        <button :class="['hist-tab', { active: activeTab === 'mama' }]" type="button" @click="activeTab = 'mama'">
            <mdicon name="account-heart-outline" size="16"/>
            Mama
        </button>
        <button :class="['hist-tab', { active: activeTab === 'rc' }]" type="button" @click="activeTab = 'rc'">
            <mdicon name="office-building-outline" size="16"/>
            RC
        </button>
    </div>

    <!-- ── Mama ── -->
    <section v-if="activeTab === 'mama'" class="hist-section">
        <div class="hist-search-bar">
            <mdicon name="magnify" size="16" class="hist-search-ic"/>
            <input v-model="searchA" type="text" placeholder="Search payments…" class="hist-search-input"/>
        </div>
        <div class="hist-meta-row">
            <span class="hist-count">{{ filteredGroupA.length }} entries</span>
            <span class="hist-page-info">{{ pageA }} / {{ totalPagesA }}</span>
        </div>

        <div v-if="loading" class="hist-state">
            <mdicon name="loading" size="22" class="spin"/> Loading…
        </div>
        <div v-else-if="error" class="hist-error-state">{{ error }}</div>
        <div v-else class="hist-list">
            <div
                v-for="item in pagedGroupA" :key="item.id"
                class="hist-row glass-card"
                @click="openEdit(item)"
            >
                <div class="hist-dot-col">
                    <span class="hist-dot" :class="catDot(item)"></span>
                </div>
                <div class="hist-body">
                    <div class="hist-row-top">
                        <span class="hist-main">{{ item.mainCategory || '—' }}</span>
                        <span :class="['hist-amt', isExpense(item) ? 'neg' : 'pos']">
                            {{ isExpense(item) ? '−' : '+' }}{{ formatMoney(item.amount) }}
                        </span>
                    </div>
                    <div class="hist-row-mid">
                        <span class="hist-sub">{{ [item.subCategory, formatDate(item.paymentDate)].filter(Boolean).join(' · ') }}</span>
                        <span class="hist-bal">{{ formatMoney(groupARunningMap.get(item.id) || 0) }}</span>
                    </div>
                    <div v-if="item.description" class="hist-desc">{{ item.description }}</div>
                </div>
            </div>
            <div v-if="!pagedGroupA.length" class="hist-state">No entries found.</div>
        </div>

        <div class="hist-pager">
            <button class="glass-btn-ghost hist-page-btn" type="button" :disabled="pageA <= 1" @click="pageA -= 1">
                <mdicon name="chevron-left" size="16"/>
            </button>
            <span class="hist-page-label">Page {{ pageA }} of {{ totalPagesA }}</span>
            <button class="glass-btn-ghost hist-page-btn" type="button" :disabled="pageA >= totalPagesA" @click="pageA += 1">
                <mdicon name="chevron-right" size="16"/>
            </button>
        </div>
    </section>

    <!-- ── RC ── -->
    <section v-else class="hist-section">
        <div class="hist-search-bar">
            <mdicon name="magnify" size="16" class="hist-search-ic"/>
            <input v-model="searchB" type="text" placeholder="Search payments…" class="hist-search-input"/>
        </div>
        <div class="hist-meta-row">
            <span class="hist-count">{{ filteredGroupB.length }} entries</span>
            <span class="hist-page-info">{{ pageB }} / {{ totalPagesB }}</span>
        </div>

        <div v-if="loading" class="hist-state">
            <mdicon name="loading" size="22" class="spin"/> Loading…
        </div>
        <div v-else-if="error" class="hist-error-state">{{ error }}</div>
        <div v-else class="hist-list">
            <div
                v-for="item in pagedGroupB" :key="item.id"
                class="hist-row glass-card"
                @click="openEdit(item)"
            >
                <div class="hist-dot-col">
                    <span class="hist-dot" :class="catDot(item)"></span>
                </div>
                <div class="hist-body">
                    <div class="hist-row-top">
                        <span class="hist-main">{{ item.mainCategory || '—' }}</span>
                        <span :class="['hist-amt', isExpense(item) ? 'neg' : 'pos']">
                            {{ isExpense(item) ? '−' : '+' }}{{ formatMoney(item.amount) }}
                        </span>
                    </div>
                    <div class="hist-row-mid">
                        <span class="hist-sub">{{ [item.subCategory, formatDate(item.paymentDate)].filter(Boolean).join(' · ') }}</span>
                        <span class="hist-bal">{{ formatMoney(groupBRunningMap.get(item.id) || 0) }}</span>
                    </div>
                    <div v-if="item.description" class="hist-desc">{{ item.description }}</div>
                </div>
            </div>
            <div v-if="!pagedGroupB.length" class="hist-state">No entries found.</div>
        </div>

        <div class="hist-pager">
            <button class="glass-btn-ghost hist-page-btn" type="button" :disabled="pageB <= 1" @click="pageB -= 1">
                <mdicon name="chevron-left" size="16"/>
            </button>
            <span class="hist-page-label">Page {{ pageB }} of {{ totalPagesB }}</span>
            <button class="glass-btn-ghost hist-page-btn" type="button" :disabled="pageB >= totalPagesB" @click="pageB += 1">
                <mdicon name="chevron-right" size="16"/>
            </button>
        </div>
    </section>

    <!-- ── AI Audit Modal ── -->
    <div v-if="showAuditModal" class="aud-backdrop" @click.self="closeAuditModal">
        <div class="aud-sheet glass-card">
            <div class="aud-handle"></div>
            <div class="aud-head">
                <div class="aud-head-left">
                    <div class="aud-head-icon"><mdicon name="magnify-scan" size="18"/></div>
                    <div>
                        <div class="aud-title">AI Data Audit</div>
                        <div class="aud-desc">Detect missing payments, duplicates &amp; anomalies.</div>
                    </div>
                </div>
                <button class="aud-close" type="button" @click="closeAuditModal">
                    <mdicon name="close" size="16"/>
                </button>
            </div>
            <div class="aud-seg">
                <button class="aud-seg-opt" :class="{ active: auditGroup === 'A' }" type="button" @click="auditGroup = 'A'; auditResult = null; auditError = ''">
                    Mama / Yellow Fantasy
                </button>
                <button class="aud-seg-opt" :class="{ active: auditGroup === 'B' }" type="button" @click="auditGroup = 'B'; auditResult = null; auditError = ''">
                    RC / Fuji View
                </button>
            </div>
            <div class="aud-dates">
                <label class="aud-date-field">
                    <span>From</span>
                    <input type="date" v-model="auditStartDate" class="aud-date-in"/>
                </label>
                <div class="aud-date-sep">–</div>
                <label class="aud-date-field">
                    <span>To</span>
                    <input type="date" v-model="auditEndDate" class="aud-date-in"/>
                </label>
                <button v-if="auditStartDate || auditEndDate" class="aud-date-clear" type="button" @click="auditStartDate = ''; auditEndDate = ''">
                    <mdicon name="close-circle-outline" size="16"/>
                </button>
            </div>
            <div class="aud-run-wrap">
                <button class="glass-btn-primary aud-run-btn" type="button" :disabled="auditLoading" @click="runAudit">
                    <mdicon v-if="auditLoading" name="loading" size="16" class="spin"/>
                    <mdicon v-else name="magnify-scan" size="16"/>
                    {{ auditLoading ? 'Analyzing…' : 'Run Audit' }}
                </button>
            </div>
            <div v-if="auditError" class="aud-error">{{ auditError }}</div>
            <div v-if="auditResult" class="aud-results">
                <!-- Score row -->
                <div class="aud-score-row">
                    <span class="aud-score-stat">{{ auditResult.totalEntries }} entries · {{ auditResult.issuesFound }} issues</span>
                    <span class="aud-score-badge" :class="auditResult.healthScore >= 80 ? 'aud-good' : auditResult.healthScore >= 50 ? 'aud-warn' : 'aud-bad'">
                        Health {{ auditResult.healthScore }}/100
                    </span>
                </div>
                <p class="aud-summary">{{ auditResult.summary }}</p>

                <!-- Cash flow stats -->
                <div v-if="auditResult.cashFlowSummary" class="aud-cf-grid">
                    <div class="aud-cf-cell">
                        <span class="aud-cf-lbl">Income</span>
                        <span class="aud-cf-val pos">{{ formatMoney(auditResult.cashFlowSummary.totalIncome) }}</span>
                    </div>
                    <div class="aud-cf-cell">
                        <span class="aud-cf-lbl">Expenses</span>
                        <span class="aud-cf-val neg">{{ formatMoney(auditResult.cashFlowSummary.totalExpenses) }}</span>
                    </div>
                    <div class="aud-cf-cell">
                        <span class="aud-cf-lbl">Net</span>
                        <span class="aud-cf-val" :class="auditResult.cashFlowSummary.netBalance >= 0 ? 'pos' : 'neg'">{{ formatMoney(auditResult.cashFlowSummary.netBalance) }}</span>
                    </div>
                    <div class="aud-cf-cell">
                        <span class="aud-cf-lbl">Data Quality</span>
                        <span class="aud-cf-val" :class="(auditResult.dataQualityScore || 0) >= 80 ? 'pos' : (auditResult.dataQualityScore || 0) >= 50 ? 'neu' : 'neg'">{{ auditResult.dataQualityScore ?? '—' }}/100</span>
                    </div>
                </div>

                <!-- Top categories -->
                <div v-if="auditResult.topCategories?.length" class="aud-cats">
                    <div class="aud-issues-lbl">Top categories</div>
                    <div v-for="cat in auditResult.topCategories" :key="cat.category" class="aud-cat-row">
                        <span class="aud-cat-name">{{ cat.category }}</span>
                        <div class="aud-cat-bar-wrap">
                            <div class="aud-cat-bar" :style="{ width: Math.min(cat.percentage, 100) + '%' }"></div>
                        </div>
                        <span class="aud-cat-pct">{{ cat.percentage }}%</span>
                    </div>
                </div>

                <!-- Issues -->
                <div v-if="auditResult.issues?.length" class="aud-issues">
                    <div class="aud-issues-lbl">Issues found</div>
                    <div v-for="(issue, i) in auditResult.issues" :key="i" class="aud-issue" :class="'aud-sev-' + issue.severity.toLowerCase()">
                        <div class="aud-issue-meta">
                            <div class="aud-issue-type-row">
                                <mdicon :name="auditIssueIcon(issue.type)" size="13" class="aud-issue-icon"/>
                                <span class="aud-issue-type">{{ issue.type.replace(/_/g, ' ') }}</span>
                            </div>
                            <span v-if="issue.date" class="aud-issue-date">{{ issue.date }}</span>
                        </div>
                        <p>{{ issue.message }}</p>
                        <span v-if="issue.affectedCategory" class="aud-issue-cat">{{ issue.affectedCategory }}</span>
                    </div>
                </div>
                <div v-else class="aud-clean">
                    <mdicon name="check-circle-outline" size="16"/>
                    No issues detected.
                </div>

                <!-- Recommendations -->
                <div v-if="auditResult.recommendations?.length" class="aud-recs">
                    <div class="aud-issues-lbl">Recommendations</div>
                    <div v-for="(rec, i) in auditResult.recommendations" :key="i" class="aud-rec-row">
                        <mdicon name="lightbulb-outline" size="14" class="aud-rec-icon"/>
                        <span>{{ rec }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <LogbookBottomNav variant="mobile"/>
</div>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import { API_BASE_URL } from '@/constants/config'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

export default {
    name: "LogbookHistoryMobile",
    components: { LogbookBottomNav, LogbookTopNav },
    setup() {
        const payments = ref([])
        const loading = ref(false)
        const error = ref('')
        const activeTab = ref('mama')
        const searchA = ref('')
        const searchB = ref('')
        const pageA = ref(1)
        const pageB = ref(1)
        const pageSize = ref(20)

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
            const sub  = normalize(item.subCategory)
            return main === 'mama expense' || sub.startsWith('mama') || main === 'yellow fantasy' || main === 'parking'
        }

        const isGroupB = (item) => {
            const main = normalize(item.mainCategory)
            const sub  = normalize(item.subCategory)
            return main === 'rc expense' || sub.startsWith('rc') || main === 'fuji' || main === 'fuji view'
        }

        const catDot = (item) => {
            const main = normalize(item.mainCategory)
            if (main === 'yellow fantasy') return 'dot-yellow'
            if (main === 'parking')        return 'dot-cyan'
            if (main === 'mama expense')   return 'dot-pink'
            if (main === 'fuji' || main === 'fuji view') return 'dot-indigo'
            if (main === 'rc expense')     return 'dot-orange'
            if (main === 'bank deposit')   return 'dot-green'
            return 'dot-default'
        }

        const groupA = computed(() => payments.value.filter(isGroupA))
        const groupB = computed(() => payments.value.filter(isGroupB))

        const sortA = ref({ key: 'date', dir: 'desc' })
        const sortB = ref({ key: 'date', dir: 'desc' })
        const showEditModal    = ref(false)
        const showDeleteConfirm = ref(false)
        const editForm = ref({ id: '', date: '', mainCategory: '', subCategory: '', description: '', amount: '' })
        const modalError    = ref('')
        const modalSaving   = ref(false)
        const modalDeleting = ref(false)

        const buildRunningMap = (items) => {
            const map = new Map()
            const sorted = [...items].sort((a, b) => {
                const aDate = new Date(a.paymentDate).getTime() || 0
                const bDate = new Date(b.paymentDate).getTime() || 0
                if (aDate !== bDate) return aDate - bDate
                return (new Date(a.createdAt || 0).getTime() || 0) - (new Date(b.createdAt || 0).getTime() || 0)
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
            return [item.paymentDate, item.mainCategory, item.subCategory, item.description, item.amount]
                .some(v => String(v || '').toLowerCase().includes(needle))
        }

        const filteredGroupA = computed(() => groupA.value.filter(item => matchesSearch(item, searchA.value)))
        const filteredGroupB = computed(() => groupB.value.filter(item => matchesSearch(item, searchB.value)))
        const groupARunningMap = computed(() => buildRunningMap(filteredGroupA.value))
        const groupBRunningMap = computed(() => buildRunningMap(filteredGroupB.value))

        const toggleSort = (group, key) => {
            const sortRef = group === 'A' ? sortA : sortB
            if (sortRef.value.key === key) {
                sortRef.value = { ...sortRef.value, dir: sortRef.value.dir === 'asc' ? 'desc' : 'asc' }
            } else {
                sortRef.value = { key, dir: key === 'date' ? 'desc' : 'asc' }
            }
        }

        const sortItems = (items, sort, balanceMap) => {
            const dir = sort.dir === 'asc' ? 1 : -1
            const val = (item) => {
                if (sort.key === 'date')        return new Date(item.paymentDate || 0).getTime() || 0
                if (sort.key === 'main')        return String(item.mainCategory || '').toLowerCase()
                if (sort.key === 'sub')         return String(item.subCategory || '').toLowerCase()
                if (sort.key === 'description') return String(item.description || '').toLowerCase()
                if (sort.key === 'amount')      return Number(item.amount || 0)
                if (sort.key === 'balance')     return Number(balanceMap.get(item.id) || 0)
                return 0
            }
            return [...items].sort((a, b) => {
                const av = val(a), bv = val(b)
                if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
                return String(av).localeCompare(String(bv)) * dir
            })
        }

        const sortedGroupA = computed(() => sortItems(filteredGroupA.value, sortA.value, groupARunningMap.value))
        const sortedGroupB = computed(() => sortItems(filteredGroupB.value, sortB.value, groupBRunningMap.value))
        const totalPagesA = computed(() => Math.max(1, Math.ceil(filteredGroupA.value.length / pageSize.value)))
        const totalPagesB = computed(() => Math.max(1, Math.ceil(filteredGroupB.value.length / pageSize.value)))
        const pagedGroupA = computed(() => sortedGroupA.value.slice((pageA.value - 1) * pageSize.value, pageA.value * pageSize.value))
        const pagedGroupB = computed(() => sortedGroupB.value.slice((pageB.value - 1) * pageSize.value, pageB.value * pageSize.value))

        watch(searchA,  () => { pageA.value = 1 })
        watch(searchB,  () => { pageB.value = 1 })
        watch(pageSize, () => { pageA.value = 1; pageB.value = 1 })
        watch(() => [sortA.value.key, sortA.value.dir], () => { pageA.value = 1 })
        watch(() => [sortB.value.key, sortB.value.dir], () => { pageB.value = 1 })
        watch(totalPagesA, (t) => { if (pageA.value > t) pageA.value = t })
        watch(totalPagesB, (t) => { if (pageB.value > t) pageB.value = t })

        const formatDate = (value) => {
            if (!value) return '—'
            const d = new Date(value)
            if (isNaN(d.getTime())) return '—'
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }

        const formatMoney = (value) => {
            const num = Number(value || 0)
            return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }

        const mainCategories = ['Fuji View','Yellow Fantasy','Parking','Mama Expense','RC Expense','Bank Deposit','Misc']

        const subCategoryMap = {
            'Fuji View':     ['Rental','Repair Materials','Labor Fee','Rental Refund','Business Permit','Others Cash-in','Others Cash-out'],
            'Yellow Fantasy':['Rental','Repair Materials','Labor Fee','Rental Refund','Business Permit','Others Cash-in','Others Cash-out'],
            'Parking':       ['Rental','Repair Materials','Labor Fee','Others Cash-in','Others Cash-out'],
            'Mama Expense':  ['Donations','Monetary Gifts','Money Transfer','House Repair/Materials','House Labor Fee'],
            'RC Expense':    ['Donations','Monetary Gifts','Money Transfer','House Repair/Materials','House Labor Fee'],
            'Bank Deposit':  ['mama','RC'],
            'Misc':          ['Mama cash-in','Mama cash-out','RC Cash-in','RC Cash-out']
        }

        const mainCategoryOptions = computed(() => {
            const cur = editForm.value.mainCategory
            return (cur && !mainCategories.includes(cur)) ? [cur, ...mainCategories] : mainCategories
        })

        const subCategoryOptions = computed(() => {
            const list = subCategoryMap[editForm.value.mainCategory] || []
            const cur  = editForm.value.subCategory
            return (cur && !list.includes(cur)) ? [cur, ...list] : list
        })

        const toDateInput = (value) => {
            if (!value) return ''
            const d = new Date(value)
            if (isNaN(d.getTime())) return ''
            return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
        }

        const openEdit = (item) => {
            editForm.value = {
                id: item.id,
                date: toDateInput(item.paymentDate),
                mainCategory: item.mainCategory || '',
                subCategory:  item.subCategory  || '',
                description:  item.description  || '',
                amount: String(item.amount ?? '')
            }
            modalError.value   = ''
            showEditModal.value = true
        }
        const closeEditModal    = () => { showEditModal.value = false; showDeleteConfirm.value = false; modalError.value = '' }
        const openDeleteConfirm  = () => { showDeleteConfirm.value = true }
        const closeDeleteConfirm = () => { showDeleteConfirm.value = false }

        const saveEdit = async () => {
            if (!editForm.value.id) return
            const token = localStorage.getItem('token')
            if (!token) return
            const amountValue = Number(editForm.value.amount)
            if (isNaN(amountValue)) { modalError.value = 'Amount is required.'; return }
            modalSaving.value = true
            modalError.value  = ''
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/logbook/payments/${editForm.value.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        date: editForm.value.date || null,
                        mainCategory: editForm.value.mainCategory || null,
                        subCategory:  editForm.value.subCategory  || null,
                        description:  editForm.value.description  || null,
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
            error.value   = ''
            try {
                const res  = await fetch(`${API_BASE_URL}/api/v1/logbook/payments`, { headers: { Authorization: `Bearer ${token}` } })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to load history')
                payments.value = Array.isArray(data.payments) ? data.payments : []
            } catch (err) {
                error.value = err?.message || 'Unable to load history'
            } finally {
                loading.value = false
            }
        }

        const showAuditModal  = ref(false)
        const auditGroup      = ref('A')
        const auditLoading    = ref(false)
        const auditError      = ref('')
        const auditResult     = ref(null)
        const auditStartDate  = ref('')
        const auditEndDate    = ref('')

        const openAuditModal  = () => { showAuditModal.value = true }
        const closeAuditModal = () => { showAuditModal.value = false }

        const auditIssueIcon = (type) => {
            const map = {
                DUPLICATE: 'content-copy',
                MISSING_RENT: 'calendar-alert',
                UNUSUAL_AMOUNT: 'alert-circle-outline',
                DATA_GAP: 'timeline-remove-outline',
                CASH_FLOW_NEGATIVE: 'trending-down',
                CATEGORY_SPIKE: 'chart-line',
                DORMANT_PROPERTY: 'timer-off-outline',
                DATA_QUALITY: 'text-box-remove-outline',
                EXPENSE_RATIO: 'percent-outline',
                ROUND_NUMBER: 'numeric',
                OTHER: 'help-circle-outline'
            }
            return map[type] || 'help-circle-outline'
        }

        const runAudit = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            auditLoading.value = true
            auditError.value   = ''
            auditResult.value  = null
            try {
                const params = new URLSearchParams({ group: auditGroup.value })
                if (auditStartDate.value) params.set('from', auditStartDate.value)
                if (auditEndDate.value)   params.set('to',   auditEndDate.value)
                const res  = await fetch(`${API_BASE_URL}/api/v1/insights/logbook/audit?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to run audit')
                auditResult.value = data.audit
            } catch (err) {
                auditError.value = err?.message || 'Unable to run audit'
            } finally {
                auditLoading.value = false
            }
        }

        onMounted(loadPayments)

        return {
            payments, loading, error,
            activeTab, searchA, searchB,
            filteredGroupA, filteredGroupB,
            pageA, pageB, pageSize, totalPagesA, totalPagesB,
            pagedGroupA, pagedGroupB,
            groupARunningMap, groupBRunningMap,
            sortA, sortB, toggleSort,
            showEditModal, showDeleteConfirm, editForm, modalError, modalSaving, modalDeleting,
            openEdit, closeEditModal, saveEdit, confirmDelete, openDeleteConfirm, closeDeleteConfirm,
            mainCategoryOptions, subCategoryOptions,
            formatDate, formatMoney, isExpense, catDot,
            showAuditModal, auditGroup, auditLoading, auditError, auditResult,
            auditStartDate, auditEndDate, openAuditModal, closeAuditModal, runAudit, auditIssueIcon
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-mobile.css"></style>

<style scoped>
/* ── Bottom sheet ── */
.hs-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
}
.hs-confirm-backdrop { z-index: 1010; }
.hs-sheet {
    width: 100%;
    max-height: 92vh;
    overflow-y: auto;
    border-radius: 22px 22px 0 0;
    padding-bottom: env(safe-area-inset-bottom, 16px);
}
.hs-handle {
    width: 36px;
    height: 4px;
    background: var(--glass-card-border);
    border-radius: 2px;
    margin: 10px auto 4px;
}
.hs-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 10px 18px 14px;
}
.hs-head h4 { font-size: 17px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
.hs-head p  { font-size: 13px; color: var(--text-muted); }
.hs-close {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 50%;
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text-secondary); flex-shrink: 0;
}

/* Form */
.hs-form { padding: 0 16px 4px; }
.hs-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.hs-field { display: flex; flex-direction: column; gap: 4px; }
.hs-field > span { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.hs-field-full { margin-bottom: 10px; }
.hs-input, .hs-textarea {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 10px;
    padding: 9px 12px;
    color: var(--text-primary);
    font-size: 14px;
    width: 100%;
}
.hs-input:focus, .hs-textarea:focus { outline: none; border-color: rgba(56, 189, 248, 0.5); }
.hs-textarea { resize: none; min-height: 58px; }
.hs-error { color: #f87171; font-size: 13px; padding: 0 16px 8px; }
.hs-actions { display: flex; gap: 10px; padding: 8px 16px 20px; justify-content: flex-end; }

/* Delete confirm */
.hs-confirm .hs-confirm-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 8px 20px 18px;
    text-align: center;
}
.hs-warn-icon { color: #f97316; margin-bottom: 4px; }
.hs-confirm .hs-confirm-body h4 { font-size: 17px; font-weight: 700; color: var(--text-primary); }
.hs-confirm .hs-confirm-body p  { font-size: 13px; color: var(--text-muted); }
.hs-confirm .hs-actions { justify-content: center; }

/* ── AI Audit banner ── */
.hist-ai-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    margin: 0 14px 14px;
    border-radius: 16px;
    cursor: pointer;
    position: relative; overflow: hidden;
    transition: transform 0.12s;
    z-index: 1;
}
.hist-ai-card::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 2px;
    background: linear-gradient(90deg, #818cf8, #a78bfa, #c084fc);
}
.hist-ai-card:active { transform: scale(0.985); }

.hist-ai-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.hist-ai-icon {
    width: 40px; height: 40px; flex-shrink: 0;
    border-radius: 12px;
    background: rgba(129, 140, 248, 0.12);
    border: 1px solid rgba(129, 140, 248, 0.22);
    display: grid; place-items: center;
    color: #818cf8;
}
.hist-ai-text { min-width: 0; }
.hist-ai-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.hist-ai-sub   { font-size: 12px; color: var(--text-muted); margin-top: 1px; }
.hist-ai-chev  { color: var(--text-muted); flex-shrink: 0; }

/* ── Tabs ── */
.hist-tabs {
    display: flex; gap: 6px;
    margin: 0 14px 12px;
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 14px;
    padding: 4px;
    position: relative; z-index: 1;
}
.hist-tab {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 9px 12px;
    border-radius: 10px; border: none;
    background: transparent; color: var(--text-secondary);
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: background 0.18s, color 0.18s;
}
.hist-tab.active {
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(34, 197, 94, 0.18));
    color: var(--text-primary);
    border: 1px solid rgba(56, 189, 248, 0.3);
}

/* ── Section ── */
.hist-section {
    position: relative; z-index: 1;
    padding: 0 14px 96px;
}

/* ── Search ── */
.hist-search-bar {
    display: flex; align-items: center; gap: 8px;
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 12px;
    padding: 8px 12px; margin-bottom: 8px;
}
.hist-search-ic { color: var(--text-muted); flex-shrink: 0; }
.hist-search-input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--text-primary); font-size: 14px;
}
.hist-search-input::placeholder { color: var(--text-muted); }

/* Meta row */
.hist-meta-row {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 8px;
}
.hist-count { font-size: 12px; color: var(--text-muted); }
.hist-page-info { font-size: 12px; color: var(--text-muted); }

/* ── List ── */
.hist-list { display: flex; flex-direction: column; gap: 5px; }

.hist-row {
    display: flex; gap: 10px;
    padding: 11px 12px;
    cursor: pointer;
    border-radius: 14px;
    transition: transform 0.12s ease;
}
.hist-row:active { transform: scale(0.985); }

.hist-dot-col { padding-top: 5px; }
.hist-dot {
    display: block; width: 8px; height: 8px;
    border-radius: 50%; flex-shrink: 0;
}
.dot-yellow  { background: #f59e0b; }
.dot-cyan    { background: #06b6d4; }
.dot-pink    { background: #ec4899; }
.dot-indigo  { background: #6366f1; }
.dot-orange  { background: #f97316; }
.dot-green   { background: #22c55e; }
.dot-default { background: var(--text-muted); }

.hist-body { flex: 1; min-width: 0; }
.hist-row-top, .hist-row-mid {
    display: flex; justify-content: space-between;
    align-items: baseline; gap: 8px;
}
.hist-row-mid { margin-top: 3px; }

.hist-main {
    font-size: 14px; font-weight: 600; color: var(--text-primary);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
}
.hist-amt { font-size: 14px; font-weight: 700; flex-shrink: 0; }
.hist-amt.pos { color: #22c55e; }
.hist-amt.neg { color: #fb923c; }

.hist-sub {
    font-size: 12px; color: var(--text-muted);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
}
.hist-bal { font-size: 11px; color: var(--text-secondary); flex-shrink: 0; }

.hist-desc {
    font-size: 12px; color: var(--text-secondary); margin-top: 4px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ── States ── */
.hist-state {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 40px 16px; color: var(--text-muted); font-size: 14px;
}
.hist-error-state {
    text-align: center; padding: 24px 16px;
    color: #f87171; font-size: 13px;
}

/* ── Pagination ── */
.hist-pager {
    display: flex; align-items: center; justify-content: center;
    gap: 16px; margin-top: 16px;
}
.hist-page-btn { padding: 8px; }
.hist-page-label { font-size: 13px; color: var(--text-secondary); }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; display: inline-block; }

/* ── AI Audit bottom sheet ── */
.aud-backdrop {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.82);
    z-index: 1020;
    display: flex; align-items: flex-end;
    backdrop-filter: blur(5px);
}
.aud-sheet {
    width: 100%; max-height: 90vh; overflow-y: auto;
    border-radius: 22px 22px 0 0;
    padding-bottom: env(safe-area-inset-bottom, 20px);
    background: var(--confirm-bg);
    box-shadow: 0 -24px 60px rgba(0, 0, 0, 0.5);
}
.aud-handle {
    width: 36px; height: 4px;
    background: var(--glass-card-border); border-radius: 2px;
    margin: 10px auto 0;
}

/* Head */
.aud-head {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding: 14px 18px 12px;
}
.aud-head-left { display: flex; align-items: flex-start; gap: 12px; }
.aud-head-icon {
    width: 38px; height: 38px; flex-shrink: 0;
    border-radius: 11px;
    background: rgba(129, 140, 248, 0.12);
    border: 1px solid rgba(129, 140, 248, 0.22);
    display: grid; place-items: center; color: #818cf8;
}
.aud-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
.aud-desc  { font-size: 12px; color: var(--text-muted); }
.aud-close {
    background: var(--glass-ghost-bg); border: 1px solid var(--glass-card-border);
    border-radius: 50%; width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text-secondary); flex-shrink: 0;
}

/* Segmented control */
.aud-seg {
    display: flex; gap: 5px;
    margin: 0 16px 14px;
    background: var(--glass-ghost-bg); border: 1px solid var(--glass-card-border);
    border-radius: 12px; padding: 4px;
}
.aud-seg-opt {
    flex: 1; padding: 9px 10px; border-radius: 8px; border: 1px solid transparent;
    background: transparent; color: var(--text-secondary);
    font-size: 13px; font-weight: 500; cursor: pointer; text-align: center;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
}
.aud-seg-opt.active {
    background: rgba(129, 140, 248, 0.18);
    border-color: rgba(129, 140, 248, 0.32);
    color: #a5b4fc; font-weight: 600;
}

/* Date range */
.aud-dates {
    display: flex; align-items: flex-end; gap: 8px;
    margin: 0 16px 14px;
}
.aud-date-field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.aud-date-field > span {
    font-size: 11px; font-weight: 600; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.05em;
}
.aud-date-in {
    background: var(--glass-ghost-bg); border: 1px solid var(--glass-card-border);
    border-radius: 10px; padding: 9px 10px;
    color: var(--text-primary); font-size: 13px; width: 100%;
}
.aud-date-in:focus { outline: none; border-color: rgba(129, 140, 248, 0.5); }
.aud-date-sep { color: var(--text-muted); font-size: 16px; padding-bottom: 10px; flex-shrink: 0; }
.aud-date-clear {
    background: none; border: none; cursor: pointer;
    color: var(--text-muted); padding: 0 0 10px; flex-shrink: 0;
    display: flex; align-items: flex-end;
}

/* Run button */
.aud-run-wrap { padding: 0 16px 14px; }
.aud-run-btn {
    width: 100%; display: flex; align-items: center; justify-content: center;
    gap: 8px; font-size: 14px; padding: 13px;
}

/* Error / results */
.aud-error { color: #f87171; font-size: 13px; padding: 0 16px 10px; }
.aud-results { padding: 0 16px 8px; }
.aud-score-row {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
}
.aud-score-stat { font-size: 13px; color: var(--text-muted); }
.aud-score-badge { font-size: 12px; font-weight: 600; border-radius: 20px; padding: 3px 10px; }
.aud-good { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.aud-warn { background: rgba(251, 146, 60, 0.12); color: #fb923c; }
.aud-bad  { background: rgba(248, 113, 113, 0.12); color: #f87171; }
.aud-summary { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px; }
.aud-issues-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); margin-bottom: 8px; }

/* Cash flow grid */
.aud-cf-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 8px; margin-bottom: 14px;
}
.aud-cf-cell {
    background: var(--glass-ghost-bg); border: 1px solid var(--glass-card-border);
    border-radius: 10px; padding: 10px 12px;
}
.aud-cf-lbl { display: block; font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
.aud-cf-val { font-size: 14px; font-weight: 700; }
.aud-cf-val.pos { color: #22c55e; }
.aud-cf-val.neg { color: #fb923c; }
.aud-cf-val.neu { color: var(--text-secondary); }

/* Top categories */
.aud-cats { margin-bottom: 14px; }
.aud-cat-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.aud-cat-name { font-size: 12px; color: var(--text-secondary); width: 110px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aud-cat-bar-wrap { flex: 1; height: 5px; background: var(--glass-ghost-bg); border-radius: 3px; overflow: hidden; }
.aud-cat-bar { height: 100%; background: linear-gradient(90deg, #818cf8, #a78bfa); border-radius: 3px; transition: width 0.4s; }
.aud-cat-pct { font-size: 11px; color: var(--text-muted); width: 32px; text-align: right; flex-shrink: 0; }

/* Issues */
.aud-issue {
    background: var(--glass-ghost-bg); border: 1px solid var(--glass-card-border);
    border-radius: 12px; padding: 10px 12px; margin-bottom: 6px;
}
.aud-sev-high   { border-left: 3px solid #f87171; }
.aud-sev-medium { border-left: 3px solid #fb923c; }
.aud-sev-low    { border-left: 3px solid #facc15; }
.aud-issue-meta { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
.aud-issue-type-row { display: flex; align-items: center; gap: 5px; }
.aud-issue-icon { color: var(--text-muted); }
.aud-issue-type { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); }
.aud-issue-date { font-size: 11px; color: var(--text-muted); }
.aud-issue p    { font-size: 13px; color: var(--text-primary); margin: 0 0 3px; }
.aud-issue-cat  { font-size: 11px; color: #a5b4fc; }

/* Recommendations */
.aud-recs { margin-top: 10px; }
.aud-rec-row {
    display: flex; align-items: flex-start; gap: 8px;
    padding: 8px 10px; margin-bottom: 5px;
    background: rgba(129, 140, 248, 0.06);
    border: 1px solid rgba(129, 140, 248, 0.14);
    border-radius: 10px;
    font-size: 13px; color: var(--text-secondary); line-height: 1.4;
}
.aud-rec-icon { color: #a78bfa; flex-shrink: 0; margin-top: 1px; }

.aud-clean {
    display: flex; align-items: center; gap: 8px;
    font-size: 14px; color: #22c55e; padding: 10px 0;
}
</style>
