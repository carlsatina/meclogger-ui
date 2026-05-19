<template>
<div class="logbook-page">

    <!-- ── Edit Modal ── -->
    <div v-if="showEditModal" class="logbook-modal-backdrop" @click.self="closeEditModal">
        <div class="logbook-modal glass-card hw-edit-modal">
            <div class="hw-modal-head">
                <div class="hw-modal-title-row">
                    <div class="hw-modal-icon">
                        <mdicon name="pencil-outline" size="16"/>
                    </div>
                    <div>
                        <h4>Edit Payment</h4>
                        <p>Update details or delete this entry.</p>
                    </div>
                </div>
                <button class="glass-btn-ghost hw-modal-close" type="button" @click="closeEditModal">
                    <mdicon name="close" size="16"/>
                </button>
            </div>
            <div class="hw-modal-form">
                <div class="hw-modal-row">
                    <label class="hw-modal-field">
                        <span>Date</span>
                        <input type="date" v-model="editForm.date"/>
                    </label>
                    <label class="hw-modal-field">
                        <span>Amount</span>
                        <input type="number" step="0.01" v-model="editForm.amount"/>
                    </label>
                </div>
                <div class="hw-modal-row">
                    <label class="hw-modal-field">
                        <span>Main Category</span>
                        <input list="hw-main-cats" v-model="editForm.mainCategory" placeholder="Category"/>
                        <datalist id="hw-main-cats">
                            <option v-for="cat in mainCategoryOptions" :key="cat" :value="cat"/>
                        </datalist>
                    </label>
                    <label class="hw-modal-field">
                        <span>Sub Category</span>
                        <input list="hw-sub-cats" v-model="editForm.subCategory" placeholder="Sub"/>
                        <datalist id="hw-sub-cats">
                            <option v-for="sub in subCategoryOptions" :key="sub" :value="sub"/>
                        </datalist>
                    </label>
                </div>
                <label class="hw-modal-field">
                    <span>Description</span>
                    <textarea rows="3" v-model="editForm.description"></textarea>
                </label>
            </div>
            <div v-if="modalError" class="hw-modal-error">{{ modalError }}</div>
            <div class="hw-modal-actions">
                <button class="glass-btn-ghost danger-btn" type="button" :disabled="modalDeleting" @click="openDeleteConfirm">
                    {{ modalDeleting ? 'Deleting…' : 'Delete' }}
                </button>
                <button class="glass-btn-primary" type="button" :disabled="modalSaving" @click="saveEdit">
                    {{ modalSaving ? 'Saving…' : 'Save changes' }}
                </button>
            </div>
        </div>
    </div>

    <!-- ── Delete Confirm ── -->
    <div v-if="showDeleteConfirm" class="logbook-modal-backdrop" @click.self="closeDeleteConfirm">
        <div class="logbook-modal glass-card hw-confirm-modal">
            <div class="hw-confirm-icon"><mdicon name="alert-circle-outline" size="26"/></div>
            <h4>Delete this payment?</h4>
            <p>This action cannot be undone.</p>
            <div class="hw-modal-actions hw-modal-actions-center">
                <button class="glass-btn-ghost" type="button" @click="closeDeleteConfirm">Cancel</button>
                <button class="glass-btn-ghost danger-btn" type="button" :disabled="modalDeleting" @click="confirmDelete">
                    {{ modalDeleting ? 'Deleting…' : 'Delete' }}
                </button>
            </div>
        </div>
    </div>

    <LogbookTopNav
        variant="web"
        title="History"
        subtitle="Review every log entry and transaction in time order."
        icon="format-list-bulleted-square"
    />

    <!-- ── AI Audit banner ── -->
    <div class="hw-ai-banner glass-card">
        <div class="hw-ai-icon-zone">
            <mdicon name="magnify-scan" size="22"/>
        </div>
        <div class="hw-ai-text">
            <span class="hw-ai-title">AI Data Audit</span>
            <span class="hw-ai-sub">Detect missing payments, duplicates, and unusual entries across your logbook.</span>
        </div>
        <button class="glass-btn-primary hw-ai-run" type="button" @click="openAuditModal">
            Run Audit
            <mdicon name="arrow-right" size="15"/>
        </button>
    </div>

    <!-- ══ Mama section ══ -->
    <div class="hw-section glass-card">
        <div class="hw-sec-head">
            <div class="hw-sec-title">
                <span class="hw-sec-dot dot-yellow"></span>
                <h3>Mama · Yellow Fantasy · Parking</h3>
                <span class="hw-sec-badge">{{ filteredGroupA.length }}</span>
            </div>
            <button class="glass-btn-ghost hw-collapse-btn" type="button" @click="showGroupA = !showGroupA" :title="showGroupA ? 'Collapse' : 'Expand'">
                <mdicon :name="showGroupA ? 'chevron-up' : 'chevron-down'" size="18"/>
            </button>
        </div>

        <template v-if="showGroupA">
            <div class="hw-toolbar">
                <div class="hw-search-wrap">
                    <mdicon name="magnify" size="15" class="hw-search-ic"/>
                    <input v-model="searchA" type="text" placeholder="Search…" class="hw-search-inp"/>
                </div>
                <div class="hw-toolbar-right">
                    <span class="hw-range-label">{{ entryRangeA }}</span>
                    <select v-model.number="pageSize" class="hw-page-sel">
                        <option :value="10">10 / page</option>
                        <option :value="20">20 / page</option>
                        <option :value="50">50 / page</option>
                    </select>
                </div>
            </div>

            <div v-if="loading" class="hw-state">
                <mdicon name="loading" size="20" class="spin"/> Loading…
            </div>
            <div v-else-if="error" class="hw-error-state">{{ error }}</div>
            <div v-else class="hw-table-wrap">
                <table class="hw-table">
                    <thead>
                        <tr>
                            <th class="hw-th hw-th-date sortable" @click="toggleSort('A','date')" :aria-sort="ariaSort(sortA,'date')">
                                Date <mdicon v-if="sortA.key==='date'" :name="sortA.dir==='asc'?'chevron-up':'chevron-down'" size="12"/>
                            </th>
                            <th class="hw-th hw-th-cat sortable" @click="toggleSort('A','main')" :aria-sort="ariaSort(sortA,'main')">
                                Category <mdicon v-if="sortA.key==='main'" :name="sortA.dir==='asc'?'chevron-up':'chevron-down'" size="12"/>
                            </th>
                            <th class="hw-th hw-th-desc sortable" @click="toggleSort('A','description')" :aria-sort="ariaSort(sortA,'description')">
                                Description <mdicon v-if="sortA.key==='description'" :name="sortA.dir==='asc'?'chevron-up':'chevron-down'" size="12"/>
                            </th>
                            <th class="hw-th hw-th-amt sortable" @click="toggleSort('A','amount')" :aria-sort="ariaSort(sortA,'amount')">
                                Amount <mdicon v-if="sortA.key==='amount'" :name="sortA.dir==='asc'?'chevron-up':'chevron-down'" size="12"/>
                            </th>
                            <th class="hw-th hw-th-bal sortable" @click="toggleSort('A','balance')" :aria-sort="ariaSort(sortA,'balance')">
                                Balance <mdicon v-if="sortA.key==='balance'" :name="sortA.dir==='asc'?'chevron-up':'chevron-down'" size="12"/>
                            </th>
                            <th class="hw-th hw-th-act"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in pagedGroupA" :key="item.id" class="hw-tr">
                            <td class="hw-td hw-td-date">{{ formatDate(item.paymentDate) }}</td>
                            <td class="hw-td hw-td-cat">
                                <span class="hw-cat-dot" :class="catDot(item)"></span>
                                <span class="hw-cat-main">{{ item.mainCategory || '—' }}</span>
                                <span v-if="item.subCategory" class="hw-cat-sub">· {{ item.subCategory }}</span>
                            </td>
                            <td class="hw-td hw-td-desc">{{ item.description || '—' }}</td>
                            <td class="hw-td hw-td-amt" :class="isExpense(item) ? 'amt-neg' : 'amt-pos'">{{ formatMoney(item.amount) }}</td>
                            <td class="hw-td hw-td-bal">{{ formatMoney(groupARunningMap.get(item.id) || 0) }}</td>
                            <td class="hw-td hw-td-act">
                                <button class="hw-row-edit" type="button" @click="openEdit(item)" title="Edit entry">
                                    <mdicon name="pencil-outline" size="14"/>
                                </button>
                            </td>
                        </tr>
                        <tr v-if="!pagedGroupA.length">
                            <td colspan="6" class="hw-empty-row">No entries found.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="totalPagesA > 1" class="hw-pager">
                <button class="glass-btn-ghost" type="button" :disabled="pageA <= 1" @click="pageA -= 1">
                    <mdicon name="chevron-left" size="16"/>
                </button>
                <span class="hw-pager-label">{{ entryRangeA }}</span>
                <button class="glass-btn-ghost" type="button" :disabled="pageA >= totalPagesA" @click="pageA += 1">
                    <mdicon name="chevron-right" size="16"/>
                </button>
            </div>
        </template>
    </div>

    <!-- ══ RC section ══ -->
    <div class="hw-section glass-card">
        <div class="hw-sec-head">
            <div class="hw-sec-title">
                <span class="hw-sec-dot dot-indigo"></span>
                <h3>RC · Fuji View</h3>
                <span class="hw-sec-badge">{{ filteredGroupB.length }}</span>
            </div>
            <button class="glass-btn-ghost hw-collapse-btn" type="button" @click="showGroupB = !showGroupB" :title="showGroupB ? 'Collapse' : 'Expand'">
                <mdicon :name="showGroupB ? 'chevron-up' : 'chevron-down'" size="18"/>
            </button>
        </div>

        <template v-if="showGroupB">
            <div class="hw-toolbar">
                <div class="hw-search-wrap">
                    <mdicon name="magnify" size="15" class="hw-search-ic"/>
                    <input v-model="searchB" type="text" placeholder="Search…" class="hw-search-inp"/>
                </div>
                <div class="hw-toolbar-right">
                    <span class="hw-range-label">{{ entryRangeB }}</span>
                    <select v-model.number="pageSize" class="hw-page-sel">
                        <option :value="10">10 / page</option>
                        <option :value="20">20 / page</option>
                        <option :value="50">50 / page</option>
                    </select>
                </div>
            </div>

            <div v-if="loading" class="hw-state">
                <mdicon name="loading" size="20" class="spin"/> Loading…
            </div>
            <div v-else-if="error" class="hw-error-state">{{ error }}</div>
            <div v-else class="hw-table-wrap">
                <table class="hw-table">
                    <thead>
                        <tr>
                            <th class="hw-th hw-th-date sortable" @click="toggleSort('B','date')" :aria-sort="ariaSort(sortB,'date')">
                                Date <mdicon v-if="sortB.key==='date'" :name="sortB.dir==='asc'?'chevron-up':'chevron-down'" size="12"/>
                            </th>
                            <th class="hw-th hw-th-cat sortable" @click="toggleSort('B','main')" :aria-sort="ariaSort(sortB,'main')">
                                Category <mdicon v-if="sortB.key==='main'" :name="sortB.dir==='asc'?'chevron-up':'chevron-down'" size="12"/>
                            </th>
                            <th class="hw-th hw-th-desc sortable" @click="toggleSort('B','description')" :aria-sort="ariaSort(sortB,'description')">
                                Description <mdicon v-if="sortB.key==='description'" :name="sortB.dir==='asc'?'chevron-up':'chevron-down'" size="12"/>
                            </th>
                            <th class="hw-th hw-th-amt sortable" @click="toggleSort('B','amount')" :aria-sort="ariaSort(sortB,'amount')">
                                Amount <mdicon v-if="sortB.key==='amount'" :name="sortB.dir==='asc'?'chevron-up':'chevron-down'" size="12"/>
                            </th>
                            <th class="hw-th hw-th-bal sortable" @click="toggleSort('B','balance')" :aria-sort="ariaSort(sortB,'balance')">
                                Balance <mdicon v-if="sortB.key==='balance'" :name="sortB.dir==='asc'?'chevron-up':'chevron-down'" size="12"/>
                            </th>
                            <th class="hw-th hw-th-act"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in pagedGroupB" :key="item.id" class="hw-tr">
                            <td class="hw-td hw-td-date">{{ formatDate(item.paymentDate) }}</td>
                            <td class="hw-td hw-td-cat">
                                <span class="hw-cat-dot" :class="catDot(item)"></span>
                                <span class="hw-cat-main">{{ item.mainCategory || '—' }}</span>
                                <span v-if="item.subCategory" class="hw-cat-sub">· {{ item.subCategory }}</span>
                            </td>
                            <td class="hw-td hw-td-desc">{{ item.description || '—' }}</td>
                            <td class="hw-td hw-td-amt" :class="isExpense(item) ? 'amt-neg' : 'amt-pos'">{{ formatMoney(item.amount) }}</td>
                            <td class="hw-td hw-td-bal">{{ formatMoney(groupBRunningMap.get(item.id) || 0) }}</td>
                            <td class="hw-td hw-td-act">
                                <button class="hw-row-edit" type="button" @click="openEdit(item)" title="Edit entry">
                                    <mdicon name="pencil-outline" size="14"/>
                                </button>
                            </td>
                        </tr>
                        <tr v-if="!pagedGroupB.length">
                            <td colspan="6" class="hw-empty-row">No entries found.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="totalPagesB > 1" class="hw-pager">
                <button class="glass-btn-ghost" type="button" :disabled="pageB <= 1" @click="pageB -= 1">
                    <mdicon name="chevron-left" size="16"/>
                </button>
                <span class="hw-pager-label">{{ entryRangeB }}</span>
                <button class="glass-btn-ghost" type="button" :disabled="pageB >= totalPagesB" @click="pageB += 1">
                    <mdicon name="chevron-right" size="16"/>
                </button>
            </div>
        </template>
    </div>

    <!-- ── AI Audit Modal ── -->
    <div v-if="showAuditModal" class="logbook-modal-backdrop" @click.self="closeAuditModal">
        <div class="logbook-modal glass-card aud-dialog">
            <div class="aud-head">
                <div class="aud-head-left">
                    <div class="aud-head-icon"><mdicon name="magnify-scan" size="20"/></div>
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
                        <span class="aud-cf-lbl">Net Balance</span>
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
                    <mdicon name="check-circle-outline" size="18"/>
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

    <LogbookBottomNav variant="web"/>
</div>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import { API_BASE_URL } from '@/constants/config'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

export default {
    name: "LogbookHistoryWeb",
    components: { LogbookBottomNav, LogbookTopNav },
    setup() {
        const payments    = ref([])
        const loading     = ref(false)
        const error       = ref('')
        const showGroupA  = ref(true)
        const showGroupB  = ref(true)
        const searchA     = ref('')
        const searchB     = ref('')
        const pageA       = ref(1)
        const pageB       = ref(1)
        const pageSize    = ref(20)

        const normalize = (value) => String(value || '').trim().toLowerCase()

        const isExpense = (item) => {
            const main = normalize(item.mainCategory)
            const sub  = normalize(item.subCategory)
            if (main === 'mama expense') return true
            if (main === 'misc' && sub === 'mama cash-out') return true
            if (main === 'rc expense') return true
            if (main === 'misc' && sub === 'rc cash-out') return true
            if (main === 'bank deposit') return true
            if (main.includes('expense')) return true
            if (sub.includes('cash-out')) return true
            if (sub.includes('refund'))   return true
            if (sub.includes('repair'))   return true
            if (sub.includes('labor'))    return true
            if (sub.includes('permit'))   return true
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
        const showEditModal     = ref(false)
        const showDeleteConfirm = ref(false)
        const editForm = ref({ id: '', date: '', mainCategory: '', subCategory: '', description: '', amount: '' })
        const modalError    = ref('')
        const modalSaving   = ref(false)
        const modalDeleting = ref(false)

        const buildRunningMap = (items) => {
            const map = new Map()
            const sorted = [...items].sort((a, b) => {
                const ad = new Date(a.paymentDate).getTime() || 0
                const bd = new Date(b.paymentDate).getTime() || 0
                if (ad !== bd) return ad - bd
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

        const ariaSort = (sort, key) => {
            if (sort.key !== key) return 'none'
            return sort.dir === 'asc' ? 'ascending' : 'descending'
        }

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
                if (sort.key === 'sub')         return String(item.subCategory  || '').toLowerCase()
                if (sort.key === 'description') return String(item.description  || '').toLowerCase()
                if (sort.key === 'amount')      return Number(item.amount       || 0)
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

        const entryRangeA = computed(() => {
            const total = filteredGroupA.value.length
            if (!total) return '0 entries'
            const start = (pageA.value - 1) * pageSize.value + 1
            const end   = Math.min(pageA.value * pageSize.value, total)
            return `${start}–${end} of ${total}`
        })
        const entryRangeB = computed(() => {
            const total = filteredGroupB.value.length
            if (!total) return '0 entries'
            const start = (pageB.value - 1) * pageSize.value + 1
            const end   = Math.min(pageB.value * pageSize.value, total)
            return `${start}–${end} of ${total}`
        })

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
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
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

        const showAuditModal = ref(false)
        const auditGroup     = ref('A')
        const auditLoading   = ref(false)
        const auditError     = ref('')
        const auditResult    = ref(null)
        const auditStartDate = ref('')
        const auditEndDate   = ref('')

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
            showGroupA, showGroupB,
            searchA, searchB,
            filteredGroupA, filteredGroupB,
            pageA, pageB, pageSize, totalPagesA, totalPagesB,
            pagedGroupA, pagedGroupB, entryRangeA, entryRangeB,
            groupARunningMap, groupBRunningMap,
            sortA, sortB, toggleSort, ariaSort,
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

<style scoped src="@/assets/styles/logbook/subpage-web.css"></style>

<style scoped>
/* ── AI Audit banner ── */
.hw-ai-banner {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 20px 24px;
    margin-bottom: 20px;
    border-radius: 20px;
    position: relative; overflow: hidden;
    transition: box-shadow 0.2s;
}
.hw-ai-banner::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: linear-gradient(90deg, #818cf8, #a78bfa, #c084fc);
}
.hw-ai-banner:hover {
    box-shadow: 0 8px 32px rgba(129, 140, 248, 0.14);
}
.hw-ai-icon-zone {
    width: 50px; height: 50px; flex-shrink: 0;
    border-radius: 15px;
    background: rgba(129, 140, 248, 0.12);
    border: 1px solid rgba(129, 140, 248, 0.22);
    display: grid; place-items: center;
    color: #818cf8;
}
.hw-ai-text { flex: 1; min-width: 0; }
.hw-ai-title {
    display: block;
    font-size: 15px; font-weight: 700;
    color: var(--text-primary); margin-bottom: 4px;
}
.hw-ai-sub { font-size: 13px; color: var(--text-muted); }
.hw-ai-run {
    display: flex; align-items: center; gap: 7px;
    font-size: 13.5px; padding: 10px 20px; flex-shrink: 0;
}

/* ── Section card ── */
.hw-section {
    overflow: hidden;
    border-radius: 20px;
    margin-bottom: 20px;
}

.hw-sec-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px;
    border-bottom: 1px solid var(--glass-card-border);
}
.hw-sec-title {
    display: flex; align-items: center; gap: 10px;
}
.hw-sec-dot {
    width: 10px; height: 10px;
    border-radius: 50%; flex-shrink: 0;
}
.hw-sec-title h3 {
    font-size: 15px; font-weight: 600;
    color: var(--text-primary); margin: 0;
}
.hw-sec-badge {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 20px;
    padding: 2px 10px;
    font-size: 12px; color: var(--text-secondary);
}
.hw-collapse-btn { padding: 6px; }

/* ── Toolbar ── */
.hw-toolbar {
    display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
    padding: 12px 22px;
    border-bottom: 1px solid var(--glass-card-border);
    background: rgba(255, 255, 255, 0.015);
}
.hw-search-wrap {
    display: flex; align-items: center; gap: 8px;
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 10px;
    padding: 7px 12px;
    flex: 1; max-width: 340px;
}
.hw-search-ic { color: var(--text-muted); flex-shrink: 0; }
.hw-search-inp {
    flex: 1; background: none; border: none; outline: none;
    color: var(--text-primary); font-size: 14px;
}
.hw-search-inp::placeholder { color: var(--text-muted); }
.hw-toolbar-right { display: flex; align-items: center; gap: 14px; }
.hw-range-label { font-size: 13px; color: var(--text-muted); white-space: nowrap; }
.hw-page-sel {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 8px;
    color: var(--text-secondary);
    font-size: 13px; padding: 6px 10px; cursor: pointer;
}

/* ── Table ── */
.hw-table-wrap { overflow-x: auto; }
.hw-table { width: 100%; border-collapse: collapse; }

.hw-th {
    padding: 10px 16px;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.07em;
    color: var(--text-muted); text-align: left;
    white-space: nowrap;
    background: rgba(255, 255, 255, 0.015);
    border-bottom: 1px solid var(--glass-card-border);
    user-select: none;
}
.hw-th.sortable { cursor: pointer; }
.hw-th.sortable:hover { color: var(--text-secondary); }
.hw-th-date { width: 130px; }
.hw-th-cat  { width: 220px; }
.hw-th-amt, .hw-th-bal { text-align: right; width: 130px; }
.hw-th-act  { width: 44px; }

.hw-tr {
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    transition: background 0.12s;
}
.hw-tr:hover { background: rgba(255, 255, 255, 0.04); }

.hw-td { padding: 10px 16px; vertical-align: middle; }

.hw-td-date {
    font-size: 13px; color: var(--text-muted);
    white-space: nowrap;
}
.hw-td-cat {
    display: flex; align-items: center; gap: 6px;
}
.hw-cat-dot {
    width: 7px; height: 7px;
    border-radius: 50%; flex-shrink: 0;
}
.hw-cat-main { font-size: 13.5px; font-weight: 500; color: var(--text-primary); }
.hw-cat-sub  { font-size: 12px; color: var(--text-muted); }

.hw-td-desc {
    font-size: 13px; color: var(--text-secondary);
    max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.hw-td-amt {
    text-align: right; font-size: 13.5px; font-weight: 600;
    white-space: nowrap;
}
.hw-td-amt.amt-pos { color: #22c55e; }
.hw-td-amt.amt-neg { color: #fb923c; }

.hw-td-bal {
    text-align: right; font-size: 13px;
    color: var(--text-secondary); white-space: nowrap;
}
.hw-td-act { text-align: right; }

.hw-row-edit {
    background: none; border: none; cursor: pointer;
    color: var(--text-muted);
    padding: 6px; border-radius: 8px;
    display: inline-flex; align-items: center; justify-content: center;
    opacity: 0;
    transition: opacity 0.15s, background 0.15s, color 0.15s;
}
.hw-tr:hover .hw-row-edit { opacity: 1; }
.hw-row-edit:hover {
    background: var(--glass-ghost-bg);
    color: var(--text-primary);
}

.hw-empty-row {
    text-align: center; padding: 40px 16px;
    color: var(--text-muted); font-size: 14px;
}

/* ── States ── */
.hw-state {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 40px 16px; color: var(--text-muted); font-size: 14px;
}
.hw-error-state {
    text-align: center; padding: 24px;
    color: #f87171; font-size: 13px;
}

/* ── Pagination ── */
.hw-pager {
    display: flex; align-items: center; justify-content: center; gap: 14px;
    padding: 14px 22px;
    border-top: 1px solid var(--glass-card-border);
}
.hw-pager-label { font-size: 13px; color: var(--text-secondary); }

/* ── Category dots (shared) ── */
.dot-yellow  { background: #f59e0b; }
.dot-cyan    { background: #06b6d4; }
.dot-pink    { background: #ec4899; }
.dot-indigo  { background: #6366f1; }
.dot-orange  { background: #f97316; }
.dot-green   { background: #22c55e; }
.dot-default { background: var(--text-muted); }

/* ── Edit modal ── */
.hw-edit-modal { max-width: 540px; width: 100%; }
.hw-modal-head {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 20px;
}
.hw-modal-title-row { display: flex; align-items: flex-start; gap: 12px; }
.hw-modal-icon {
    width: 36px; height: 36px;
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-secondary); flex-shrink: 0;
}
.hw-modal-head h4 { font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
.hw-modal-head p  { font-size: 13px; color: var(--text-muted); }
.hw-modal-close { padding: 6px; }

.hw-modal-form { display: flex; flex-direction: column; gap: 12px; margin-bottom: 4px; }
.hw-modal-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.hw-modal-field {
    display: flex; flex-direction: column; gap: 5px;
}
.hw-modal-field > span {
    font-size: 11px; font-weight: 600; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.05em;
}
.hw-modal-field input,
.hw-modal-field textarea {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 10px;
    padding: 9px 12px;
    color: var(--text-primary);
    font-size: 14px; width: 100%;
}
.hw-modal-field input:focus,
.hw-modal-field textarea:focus {
    outline: none; border-color: rgba(56, 189, 248, 0.45);
}
.hw-modal-field textarea { resize: none; }

.hw-modal-error { color: #f87171; font-size: 13px; margin-bottom: 8px; }
.hw-modal-actions {
    display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px;
}
.hw-modal-actions-center { justify-content: center; }

/* ── Confirm modal ── */
.hw-confirm-modal {
    max-width: 360px; width: 100%;
    text-align: center; padding: 32px 28px 24px;
}
.hw-confirm-icon { color: #f97316; margin-bottom: 10px; }
.hw-confirm-modal h4 { font-size: 17px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
.hw-confirm-modal p  { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; display: inline-block; }

/* ── AI Audit dialog ── */
.aud-dialog {
    max-width: 520px;
    width: 100%;
    background: var(--confirm-bg);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.48);
}

/* Head */
.aud-head {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 20px;
}
.aud-head-left { display: flex; align-items: flex-start; gap: 14px; }
.aud-head-icon {
    width: 44px; height: 44px; flex-shrink: 0;
    border-radius: 13px;
    background: rgba(129, 140, 248, 0.12);
    border: 1px solid rgba(129, 140, 248, 0.22);
    display: grid; place-items: center; color: #818cf8;
}
.aud-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 3px; }
.aud-desc  { font-size: 13px; color: var(--text-muted); }
.aud-close {
    background: var(--glass-ghost-bg); border: 1px solid var(--glass-card-border);
    border-radius: 50%; width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--text-secondary); flex-shrink: 0;
    transition: background 0.15s;
}
.aud-close:hover { background: rgba(255, 255, 255, 0.08); }

/* Segmented control */
.aud-seg {
    display: flex; gap: 6px; margin-bottom: 18px;
    background: var(--glass-ghost-bg); border: 1px solid var(--glass-card-border);
    border-radius: 12px; padding: 4px;
}
.aud-seg-opt {
    flex: 1; padding: 10px 12px; border-radius: 8px; border: 1px solid transparent;
    background: transparent; color: var(--text-secondary);
    font-size: 13.5px; font-weight: 500; cursor: pointer; text-align: center;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
}
.aud-seg-opt.active {
    background: rgba(129, 140, 248, 0.18);
    border-color: rgba(129, 140, 248, 0.32);
    color: #a5b4fc; font-weight: 600;
}

/* Date range */
.aud-dates {
    display: flex; align-items: flex-end; gap: 10px; margin-bottom: 18px;
}
.aud-date-field { display: flex; flex-direction: column; gap: 5px; flex: 1; }
.aud-date-field > span {
    font-size: 11px; font-weight: 600; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.05em;
}
.aud-date-in {
    background: var(--glass-ghost-bg); border: 1px solid var(--glass-card-border);
    border-radius: 10px; padding: 10px 12px;
    color: var(--text-primary); font-size: 14px; width: 100%;
}
.aud-date-in:focus { outline: none; border-color: rgba(129, 140, 248, 0.5); }
.aud-date-sep { color: var(--text-muted); font-size: 18px; padding-bottom: 11px; flex-shrink: 0; }
.aud-date-clear {
    background: none; border: none; cursor: pointer;
    color: var(--text-muted); padding: 0 0 11px; flex-shrink: 0;
    display: flex; align-items: flex-end;
}

/* Run button */
.aud-run-wrap { margin-bottom: 16px; }
.aud-run-btn {
    width: 100%; display: flex; align-items: center; justify-content: center;
    gap: 8px; font-size: 14px; padding: 12px;
}

/* Error / results */
.aud-error { color: #f87171; font-size: 13px; margin-bottom: 12px; }
.aud-results { margin-top: 4px; }
.aud-score-row {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--glass-card-border);
}
.aud-score-stat { font-size: 13px; color: var(--text-muted); }
.aud-score-badge { font-size: 12px; font-weight: 600; border-radius: 20px; padding: 3px 12px; }
.aud-good { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.aud-warn { background: rgba(251, 146, 60, 0.12); color: #fb923c; }
.aud-bad  { background: rgba(248, 113, 113, 0.12); color: #f87171; }
.aud-summary { font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 14px; }
.aud-issues-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); margin-bottom: 8px; }

/* Cash flow grid */
.aud-cf-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 10px; margin-bottom: 16px;
}
.aud-cf-cell {
    background: var(--glass-ghost-bg); border: 1px solid var(--glass-card-border);
    border-radius: 10px; padding: 11px 14px;
}
.aud-cf-lbl { display: block; font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px; }
.aud-cf-val { font-size: 15px; font-weight: 700; }
.aud-cf-val.pos { color: #22c55e; }
.aud-cf-val.neg { color: #fb923c; }
.aud-cf-val.neu { color: var(--text-secondary); }

/* Top categories */
.aud-cats { margin-bottom: 16px; }
.aud-cat-row { display: flex; align-items: center; gap: 10px; margin-bottom: 7px; }
.aud-cat-name { font-size: 12.5px; color: var(--text-secondary); width: 130px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aud-cat-bar-wrap { flex: 1; height: 5px; background: var(--glass-ghost-bg); border-radius: 3px; overflow: hidden; }
.aud-cat-bar { height: 100%; background: linear-gradient(90deg, #818cf8, #a78bfa); border-radius: 3px; transition: width 0.4s; }
.aud-cat-pct { font-size: 11.5px; color: var(--text-muted); width: 36px; text-align: right; flex-shrink: 0; }

/* Issues */
.aud-issue {
    background: var(--glass-ghost-bg); border: 1px solid var(--glass-card-border);
    border-radius: 12px; padding: 12px 14px; margin-bottom: 8px;
}
.aud-sev-high   { border-left: 3px solid #f87171; }
.aud-sev-medium { border-left: 3px solid #fb923c; }
.aud-sev-low    { border-left: 3px solid #facc15; }
.aud-issue-meta { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; }
.aud-issue-type-row { display: flex; align-items: center; gap: 5px; }
.aud-issue-icon { color: var(--text-muted); }
.aud-issue-type { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); }
.aud-issue-date { font-size: 11px; color: var(--text-muted); }
.aud-issue p    { font-size: 13px; color: var(--text-primary); margin: 0 0 3px; }
.aud-issue-cat  { font-size: 11px; color: #a5b4fc; }

/* Recommendations */
.aud-recs { margin-top: 12px; }
.aud-rec-row {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 10px 12px; margin-bottom: 6px;
    background: rgba(129, 140, 248, 0.06);
    border: 1px solid rgba(129, 140, 248, 0.14);
    border-radius: 10px;
    font-size: 13px; color: var(--text-secondary); line-height: 1.5;
}
.aud-rec-icon { color: #a78bfa; flex-shrink: 0; margin-top: 2px; }

.aud-clean {
    display: flex; align-items: center; gap: 8px;
    font-size: 14px; color: #22c55e; padding: 10px 0;
}
</style>
