<template>
<div class="medical-shell vital-page">
    <div class="medical-orb orb-1"></div>
    <div class="medical-orb orb-2"></div>
    <div class="vital-wrapper glass-card">
        <div class="vital-header">
            <button class="icon-btn-ghost" @click="$router.back()">
                <mdicon name="arrow-left" :size="20" />
            </button>
            <div class="title-block">
                <p class="eyebrow">Expense Tracking</p>
                <h2 class="page-title">Spending Insights</h2>
            </div>
            <button class="primary-btn" :disabled="loading" @click="load">
                <mdicon v-if="loading" name="loading" :size="18" class="spin" />
                <mdicon v-else name="chart-bar" :size="18" />
                <span>{{ loading ? 'Analyzing…' : 'Analyze' }}</span>
            </button>
        </div>

        <div class="insights-controls">
            <div class="control-group">
                <label>Period</label>
                <select class="car-select" v-model="days" @change="load">
                    <option :value="30">Last 30 days</option>
                    <option :value="60">Last 60 days</option>
                    <option :value="90">Last 90 days</option>
                </select>
            </div>
        </div>

        <div v-if="error" class="state-card error-card">
            <mdicon name="alert-circle-outline" :size="20" />
            {{ error }}
        </div>

        <div v-if="!insights && !loading && !error" class="state-card">
            Select a period and click Analyze to generate your spending summary.
        </div>

        <div v-if="loading" class="state-card loading-card">
            <mdicon name="loading" :size="28" class="spin" />
            <span>Analyzing your spending…</span>
        </div>

        <div v-if="insights" class="insights-grid">
            <!-- Summary -->
            <div class="insight-card summary-card span-full">
                <div class="insight-card-header">
                    <mdicon name="chart-line" :size="22" />
                    <span>Summary</span>
                </div>
                <p class="summary-text">{{ insights.summary }}</p>
            </div>

            <!-- Alerts -->
            <div v-if="insights.alerts?.length" class="insight-card alerts-card">
                <div class="insight-card-header">
                    <mdicon name="bell-alert-outline" :size="22" />
                    <span>Alerts</span>
                </div>
                <div
                    v-for="alert in insights.alerts"
                    :key="alert.message"
                    class="alert-row"
                    :class="'alert-' + alert.severity.toLowerCase()"
                >
                    <mdicon :name="alert.severity === 'HIGH' ? 'alert' : 'alert-circle-outline'" :size="16" />
                    <span>{{ alert.message }}</span>
                </div>
            </div>

            <!-- Top Categories -->
            <div v-if="insights.topCategories?.length" class="insight-card">
                <div class="insight-card-header">
                    <mdicon name="tag-multiple-outline" :size="22" />
                    <span>Top Categories</span>
                </div>
                <div class="category-list">
                    <div v-for="cat in insights.topCategories" :key="cat.name" class="category-row">
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

            <!-- Budget Alerts -->
            <div v-if="insights.budgetAlerts?.length" class="insight-card">
                <div class="insight-card-header">
                    <mdicon name="wallet-outline" :size="22" />
                    <span>Budgets</span>
                </div>
                <div class="budget-list">
                    <div v-for="b in insights.budgetAlerts" :key="b.budgetName" class="budget-row">
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

            <!-- Subscriptions -->
            <div v-if="insights.subscriptionSummary" class="insight-card sub-card">
                <div class="insight-card-header">
                    <mdicon name="repeat" :size="22" />
                    <span>Subscriptions</span>
                </div>
                <div class="sub-summary">
                    <div class="sub-total-row">
                        <span class="sub-amount">{{ formatMoney(insights.subscriptionSummary.monthlyTotal) }}</span>
                        <span class="sub-label">/ month · {{ insights.subscriptionSummary.count }} active</span>
                    </div>
                    <p class="sub-note">{{ insights.subscriptionSummary.note }}</p>
                </div>
            </div>

            <!-- Goal Progress -->
            <div v-if="insights.goalProgress?.length" class="insight-card">
                <div class="insight-card-header">
                    <mdicon name="flag-outline" :size="22" />
                    <span>Goals</span>
                </div>
                <div class="goal-list">
                    <div v-for="g in insights.goalProgress" :key="g.title" class="goal-row">
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

            <!-- Recommendations -->
            <div v-if="insights.recommendations?.length" class="insight-card span-full">
                <div class="insight-card-header">
                    <mdicon name="lightbulb-outline" :size="22" />
                    <span>Recommendations</span>
                </div>
                <ul class="rec-list">
                    <li v-for="rec in insights.recommendations" :key="rec" class="rec-item">
                        <mdicon name="chevron-right" :size="14" class="rec-arrow" />
                        {{ rec }}
                    </li>
                </ul>
            </div>

            <p class="disclaimer span-full">AI-generated analysis · Not financial advice</p>
        </div>
    </div>
</div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { API_BASE_URL } from '@/constants/config'

export default {
    name: 'SpendingInsightsWeb',
    setup() {
        const insights = ref(null)
        const loading = ref(false)
        const error = ref('')
        const days = ref(30)

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

        return { insights, loading, error, days, formatMoney, trendIcon, load }
    }
}
</script>

<style scoped>
.medical-shell {
    min-height: 100vh;
    background: var(--bg-main);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 32px 24px;
    position: relative;
    overflow: hidden;
}

.medical-orb {
    position: absolute;
    filter: blur(80px);
    opacity: 0.18;
    z-index: 0;
    border-radius: 50%;
}
.orb-1 { width: 420px; height: 420px; background: linear-gradient(135deg, #22c55e, #6366f1); top: -160px; left: -120px; }
.orb-2 { width: 300px; height: 300px; background: linear-gradient(135deg, #f59e0b, #22d3ee); bottom: -100px; right: -80px; }

.vital-wrapper {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 900px;
    background: var(--glass-card-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 20px;
    padding: 28px 32px 36px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.vital-header {
    display: flex;
    align-items: center;
    gap: 16px;
}

.icon-btn-ghost {
    background: transparent;
    border: 1px solid var(--glass-card-border);
    border-radius: 10px;
    padding: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.icon-btn-ghost:hover { background: var(--glass-ghost-bg); }

.title-block { flex: 1; }
.eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin: 0; }
.page-title { font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 2px 0 0; }

.primary-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none;
    border-radius: 12px;
    padding: 9px 18px;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
}
.primary-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.insights-controls {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}
.control-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.control-group label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-muted);
}
.car-select {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 10px;
    color: var(--text-primary);
    padding: 8px 12px;
    font-size: 14px;
    min-width: 160px;
}

.state-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 12px;
    font-size: 14px;
    color: var(--text-muted);
}
.error-card { border-color: rgba(248,113,113,0.35); color: #fca5a5; background: rgba(248,113,113,0.07); }
.loading-card { justify-content: flex-start; }

.insights-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

.insight-card {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 16px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}
.span-full { grid-column: 1 / -1; }

.insight-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.summary-card .summary-text {
    font-size: 15px;
    color: var(--text-secondary);
    line-height: 1.65;
    margin: 0;
}

.alert-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 9px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;
}
.alert-high   { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); color: #fca5a5; }
.alert-medium { background: rgba(251,146,60,0.1);  border: 1px solid rgba(251,146,60,0.25);  color: #fdba74; }
.alert-low    { background: rgba(96,165,250,0.1);  border: 1px solid rgba(96,165,250,0.25);  color: #93c5fd; }

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
.budget-row  { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.budget-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.budget-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.budget-msg  { font-size: 12px; color: var(--text-muted); }
.budget-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; min-width: 100px; }
.budget-pct  { font-size: 13px; font-weight: 800; }
.sev-over    { color: #f87171; }
.sev-warning { color: #fb923c; }
.sev-ok      { color: #4ade80; }
.budget-bar-bg   { width: 100px; height: 5px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; }
.budget-bar-fill { height: 100%; border-radius: 999px; transition: width 0.4s; }
.budget-bar-fill.sev-over    { background: #f87171; }
.budget-bar-fill.sev-warning { background: #fb923c; }
.budget-bar-fill.sev-ok      { background: #4ade80; }

.sub-summary { display: flex; flex-direction: column; gap: 6px; }
.sub-total-row { display: flex; align-items: baseline; gap: 8px; }
.sub-amount { font-size: 26px; font-weight: 800; color: var(--text-primary); }
.sub-label  { font-size: 13px; color: var(--text-muted); }
.sub-note   { font-size: 13px; color: var(--text-secondary); margin: 0; }

.goal-list { display: flex; flex-direction: column; gap: 12px; }
.goal-row  { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.goal-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.goal-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.goal-note { font-size: 12px; color: var(--text-muted); }
.goal-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; min-width: 100px; }
.goal-pct   { font-size: 13px; font-weight: 800; color: #818cf8; }
.goal-bar-bg   { width: 100px; height: 5px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; }
.goal-bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #6366f1, #22d3ee); transition: width 0.4s; }

.rec-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
.rec-item  { display: flex; align-items: flex-start; gap: 6px; font-size: 14px; color: var(--text-secondary); line-height: 1.5; }
.rec-arrow { color: #4ade80; flex-shrink: 0; margin-top: 3px; }

.disclaimer { font-size: 11px; color: var(--text-muted); text-align: center; margin: 4px 0 0; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
