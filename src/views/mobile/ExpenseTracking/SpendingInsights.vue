<template>
<div class="page-container">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <div class="header glass-nav">
        <button class="back-btn" @click="router.back()">
            <mdicon name="arrow-left" :size="24"/>
        </button>
        <div class="title-block">
            <h2 class="page-title">Spending Insights</h2>
            <p class="page-sub">AI-powered analysis</p>
        </div>
        <button class="refresh-btn" :disabled="loading" @click="load">
            <mdicon :name="loading ? 'loading' : 'refresh'" :size="20" :class="{ spin: loading }"/>
        </button>
    </div>

    <div class="content">
        <div class="period-row">
            <button
                v-for="opt in periodOptions"
                :key="opt.value"
                class="period-chip"
                :class="{ active: days === opt.value }"
                @click="days = opt.value; load()"
            >{{ opt.label }}</button>
        </div>

        <div v-if="loading" class="state-box">
            <mdicon name="loading" :size="36" class="spin"/>
            <p class="loading-text">Analyzing your spending…</p>
        </div>

        <div v-else-if="error" class="state-box error-state">
            <mdicon name="alert-circle-outline" :size="48" class="error-icon"/>
            <p class="error-title">Could not generate insights</p>
            <p class="error-msg">{{ error }}</p>
            <button class="retry-btn" @click="load">Try again</button>
        </div>

        <template v-else-if="insights">
            <!-- Summary -->
            <div class="card glass-card summary-card">
                <div class="card-label">
                    <mdicon name="chart-line" :size="16"/>
                    Summary
                </div>
                <p class="summary-text">{{ insights.summary }}</p>
            </div>

            <!-- Alerts -->
            <template v-if="insights.alerts?.length">
                <div
                    v-for="alert in insights.alerts"
                    :key="alert.message"
                    class="alert-card"
                    :class="`alert-${alert.severity.toLowerCase()}`"
                >
                    <mdicon :name="alert.severity === 'HIGH' ? 'alert' : 'alert-circle-outline'" :size="18"/>
                    <span>{{ alert.message }}</span>
                </div>
            </template>

            <!-- Top Categories -->
            <template v-if="insights.topCategories?.length">
                <div class="card glass-card">
                    <div class="card-label">
                        <mdicon name="tag-multiple-outline" :size="16"/>
                        Top Categories
                    </div>
                    <div class="category-list">
                        <div
                            class="category-row"
                            v-for="cat in insights.topCategories"
                            :key="cat.name"
                        >
                            <div class="cat-left">
                                <span class="cat-name">{{ cat.name }}</span>
                                <span class="cat-note">{{ cat.note }}</span>
                            </div>
                            <div class="cat-right">
                                <span class="cat-amount">{{ formatMoney(cat.amount) }}</span>
                                <span class="trend-chip" :class="`trend-${cat.trend.toLowerCase()}`">
                                    {{ trendIcon(cat.trend) }} {{ cat.trend }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Budget Alerts -->
            <template v-if="insights.budgetAlerts?.length">
                <div class="card glass-card">
                    <div class="card-label">
                        <mdicon name="wallet-outline" :size="16"/>
                        Budgets
                    </div>
                    <div class="budget-list">
                        <div
                            class="budget-row"
                            v-for="b in insights.budgetAlerts"
                            :key="b.budgetName"
                        >
                            <div class="budget-info">
                                <span class="budget-name">{{ b.budgetName }}</span>
                                <span class="budget-msg">{{ b.message }}</span>
                            </div>
                            <div class="budget-right">
                                <span class="budget-pct" :class="`sev-${b.severity.toLowerCase()}`">{{ b.percentUsed }}%</span>
                                <div class="budget-bar-bg">
                                    <div
                                        class="budget-bar-fill"
                                        :class="`sev-${b.severity.toLowerCase()}`"
                                        :style="{ width: Math.min(b.percentUsed, 100) + '%' }"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Subscriptions -->
            <div v-if="insights.subscriptionSummary" class="card glass-card">
                <div class="card-label">
                    <mdicon name="repeat" :size="16"/>
                    Subscriptions
                </div>
                <div class="sub-summary">
                    <div class="sub-total">
                        <span class="sub-amount">{{ formatMoney(insights.subscriptionSummary.monthlyTotal) }}</span>
                        <span class="sub-label">/ month</span>
                    </div>
                    <p class="sub-note">{{ insights.subscriptionSummary.note }}</p>
                </div>
            </div>

            <!-- Goal Progress -->
            <template v-if="insights.goalProgress?.length">
                <div class="card glass-card">
                    <div class="card-label">
                        <mdicon name="flag-outline" :size="16"/>
                        Goals
                    </div>
                    <div class="goal-list">
                        <div class="goal-row" v-for="g in insights.goalProgress" :key="g.title">
                            <div class="goal-info">
                                <span class="goal-name">{{ g.title }}</span>
                                <span class="goal-note">{{ g.note }}</span>
                            </div>
                            <div class="goal-right">
                                <span class="goal-pct">{{ g.percentComplete }}%</span>
                                <div class="goal-bar-bg">
                                    <div class="goal-bar-fill" :style="{ width: Math.min(g.percentComplete, 100) + '%' }"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Recommendations -->
            <template v-if="insights.recommendations?.length">
                <div class="card glass-card">
                    <div class="card-label">
                        <mdicon name="lightbulb-outline" :size="16"/>
                        Recommendations
                    </div>
                    <ul class="rec-list">
                        <li v-for="rec in insights.recommendations" :key="rec" class="rec-item">
                            <mdicon name="chevron-right" :size="14" class="rec-arrow"/>
                            {{ rec }}
                        </li>
                    </ul>
                </div>
            </template>

            <p class="disclaimer">AI-generated analysis · Not financial advice</p>
        </template>

        <div v-else class="state-box empty">
            <mdicon name="chart-bar" :size="56" class="empty-icon"/>
            <p class="empty-title">No insights yet</p>
            <p class="empty-text">Add some expenses to get started.</p>
        </div>
    </div>
</div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/constants/config'

export default {
    name: 'SpendingInsightsMobile',
    setup() {
        const router = useRouter()
        const insights = ref(null)
        const loading = ref(false)
        const error = ref('')
        const days = ref(30)

        const periodOptions = [
            { label: '30 days', value: 30 },
            { label: '60 days', value: 60 },
            { label: '90 days', value: 90 }
        ]

        const formatMoney = (amount) => {
            if (amount == null) return '—'
            return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
        }

        const trendIcon = (trend) => {
            if (trend === 'UP') return '↑'
            if (trend === 'DOWN') return '↓'
            if (trend === 'NEW') return '★'
            return '→'
        }

        const load = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            loading.value = true
            error.value = ''
            insights.value = null
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/insights/spending?days=${days.value}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (res.ok) {
                    insights.value = data.insights
                } else {
                    error.value = data.message || 'Unable to generate insights'
                }
            } catch (err) {
                error.value = err.message || 'Network error'
            } finally {
                loading.value = false
            }
        }

        onMounted(load)

        return { router, insights, loading, error, days, periodOptions, formatMoney, trendIcon, load }
    }
}
</script>

<style scoped>
.page-container {
    min-height: 100vh;
    background: var(--bg-main);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}

.bg-orb { position: absolute; filter: blur(60px); opacity: 0.2; z-index: 0; }
.orb-1 { width: 320px; height: 320px; border-radius: 50%; background: linear-gradient(135deg, #22c55e, #6366f1); top: -130px; left: -100px; }
.orb-2 { width: 260px; height: 260px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #22d3ee); bottom: -100px; right: -80px; }

.header {
    background: var(--glass-ghost-bg);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--glass-card-border);
}

.back-btn, .refresh-btn {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 12px;
    padding: 8px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
}
.refresh-btn:disabled { opacity: 0.5; }

.title-block { flex: 1; }
.page-title { font-size: 19px; font-weight: 700; color: var(--text-primary); margin: 0; }
.page-sub { font-size: 12px; color: var(--text-muted); margin: 0; }

.content { flex: 1; padding: 16px 16px 40px; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 12px; }

.period-row { display: flex; gap: 8px; }
.period-chip {
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
}
.period-chip.active {
    background: rgba(34,197,94,0.15);
    border-color: rgba(34,197,94,0.35);
    color: #4ade80;
}

.card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.card-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.07em;
}

.summary-text { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin: 0; }

.alert-card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
}
.alert-high   { background: rgba(248,113,113,0.12); border: 1px solid rgba(248,113,113,0.3); color: #fca5a5; }
.alert-medium { background: rgba(251,146,60,0.12);  border: 1px solid rgba(251,146,60,0.3);  color: #fdba74; }
.alert-low    { background: rgba(96,165,250,0.12);  border: 1px solid rgba(96,165,250,0.3);  color: #93c5fd; }

.category-list { display: flex; flex-direction: column; gap: 10px; }
.category-row  { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.cat-left  { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.cat-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.cat-name   { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.cat-note   { font-size: 12px; color: var(--text-muted); }
.cat-amount { font-size: 15px; font-weight: 800; color: var(--text-primary); }
.trend-chip {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 999px;
    text-transform: uppercase;
}
.trend-up     { background: rgba(251,146,60,0.15); color: #fb923c; border: 1px solid rgba(251,146,60,0.3); }
.trend-down   { background: rgba(34,197,94,0.15);  color: #4ade80; border: 1px solid rgba(34,197,94,0.25); }
.trend-stable { background: rgba(148,163,184,0.1); color: var(--text-muted); border: 1px solid rgba(148,163,184,0.2); }
.trend-new    { background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); }

.budget-list { display: flex; flex-direction: column; gap: 12px; }
.budget-row  { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.budget-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.budget-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.budget-msg  { font-size: 12px; color: var(--text-muted); }
.budget-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; min-width: 80px; }
.budget-pct  { font-size: 13px; font-weight: 800; }
.sev-over    { color: #f87171; }
.sev-warning { color: #fb923c; }
.sev-ok      { color: #4ade80; }
.budget-bar-bg   { width: 80px; height: 5px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; }
.budget-bar-fill { height: 100%; border-radius: 999px; transition: width 0.4s; }
.budget-bar-fill.sev-over    { background: #f87171; }
.budget-bar-fill.sev-warning { background: #fb923c; }
.budget-bar-fill.sev-ok      { background: #4ade80; }

.sub-summary { display: flex; flex-direction: column; gap: 4px; }
.sub-total   { display: flex; align-items: baseline; gap: 6px; }
.sub-amount  { font-size: 22px; font-weight: 800; color: var(--text-primary); }
.sub-label   { font-size: 13px; color: var(--text-muted); }
.sub-note    { font-size: 13px; color: var(--text-secondary); margin: 0; }

.goal-list { display: flex; flex-direction: column; gap: 12px; }
.goal-row  { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.goal-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.goal-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.goal-note { font-size: 12px; color: var(--text-muted); }
.goal-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; min-width: 80px; }
.goal-pct   { font-size: 13px; font-weight: 800; color: #818cf8; }
.goal-bar-bg   { width: 80px; height: 5px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; }
.goal-bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #6366f1, #22d3ee); transition: width 0.4s; }

.rec-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
.rec-item { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
.rec-arrow { color: #4ade80; flex-shrink: 0; margin-top: 2px; }

.disclaimer { font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 4px; }

.state-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    gap: 12px;
}
.loading-text  { font-size: 14px; color: var(--text-muted); }
.error-icon    { color: #f87171; }
.error-title   { font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0; }
.error-msg     { font-size: 13px; color: var(--text-muted); margin: 0; max-width: 280px; }
.retry-btn {
    margin-top: 4px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
    padding: 8px 20px;
    cursor: pointer;
}
.empty-icon  { color: #64748b; }
.empty-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }
.empty-text  { font-size: 14px; color: var(--text-muted); margin: 0; max-width: 260px; line-height: 1.5; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
