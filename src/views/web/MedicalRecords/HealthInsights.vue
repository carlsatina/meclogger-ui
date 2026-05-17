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
                <p class="eyebrow">Medical Records</p>
                <h2 class="page-title">AI Health Insights</h2>
            </div>
            <button class="primary-btn" :disabled="loading || !selectedProfileId" @click="run">
                <mdicon v-if="loading" name="loading" :size="18" class="spin" />
                <mdicon v-else name="brain" :size="18" />
                <span>{{ loading ? 'Analyzing…' : 'Analyze' }}</span>
            </button>
        </div>

        <!-- Profile & days selector -->
        <div class="insights-controls">
            <div class="control-group">
                <label>Profile</label>
                <select class="car-select" v-model="selectedProfileId">
                    <option value="" disabled>Select a profile</option>
                    <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.displayName }}</option>
                </select>
            </div>
            <div class="control-group">
                <label>Period</label>
                <select class="car-select" v-model="days">
                    <option :value="7">Last 7 days</option>
                    <option :value="14">Last 14 days</option>
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
            Select a profile and click Analyze to generate your health summary.
        </div>

        <!-- Results -->
        <div v-if="insights" class="insights-grid">
            <!-- Summary -->
            <div class="insight-card summary-card">
                <div class="insight-card-header">
                    <mdicon name="text-box-check-outline" :size="22" />
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
                <div v-for="alert in insights.alerts" :key="alert.message"
                     class="alert-row" :class="'alert-' + alert.severity.toLowerCase()">
                    <mdicon :name="severityIcon(alert.severity)" :size="16" />
                    <span>{{ alert.message }}</span>
                </div>
            </div>

            <!-- Vital Trends -->
            <div v-if="insights.vitalTrends?.length" class="insight-card">
                <div class="insight-card-header">
                    <mdicon name="chart-line" :size="22" />
                    <span>Vital Trends</span>
                </div>
                <div v-for="vt in insights.vitalTrends" :key="vt.type" class="trend-row">
                    <div class="trend-type">{{ formatVitalType(vt.type) }}</div>
                    <div class="trend-badge" :class="'trend-' + vt.trend.toLowerCase()">
                        <mdicon :name="trendIcon(vt.trend)" :size="14" />
                        {{ formatTrend(vt.trend) }}
                    </div>
                    <div class="trend-note">{{ vt.note }}</div>
                </div>
            </div>

            <!-- Medication Adherence -->
            <div v-if="insights.medicationAdherence?.length" class="insight-card">
                <div class="insight-card-header">
                    <mdicon name="pill" :size="22" />
                    <span>Medication Adherence</span>
                </div>
                <div v-for="med in insights.medicationAdherence" :key="med.name" class="med-row">
                    <div class="med-name">
                        {{ med.name }}
                        <span v-if="med.lowStock" class="low-stock-badge">Low Stock</span>
                    </div>
                    <div class="med-bar-wrap">
                        <div class="med-bar" :style="{ width: med.adherencePercent + '%' }"
                             :class="adherenceClass(med.adherencePercent)"></div>
                    </div>
                    <div class="med-pct">{{ med.adherencePercent }}%</div>
                    <div class="med-note">{{ med.note }}</div>
                </div>
            </div>

            <!-- Recommendations -->
            <div v-if="insights.recommendations?.length" class="insight-card">
                <div class="insight-card-header">
                    <mdicon name="lightbulb-outline" :size="22" />
                    <span>Recommendations</span>
                </div>
                <ul class="rec-list">
                    <li v-for="rec in insights.recommendations" :key="rec">{{ rec }}</li>
                </ul>
            </div>

            <p class="disclaimer">This is AI-generated analysis and is not medical advice. Always consult a healthcare professional.</p>
        </div>
    </div>
</div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useHealthInsights } from '@/composables/healthInsights'
import { API_BASE_URL } from '@/constants/config'

export default {
    name: 'HealthInsightsWeb',
    setup() {
        const { insights, loading, error, fetchInsights } = useHealthInsights()
        const profiles = ref([])
        const selectedProfileId = ref('')
        const days = ref(30)

        const loadProfiles = async () => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                const res = await fetch(`${API_BASE_URL}/api/v1/profiles`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (res.ok && Array.isArray(data.profiles)) {
                    profiles.value = data.profiles
                    if (data.profiles.length) selectedProfileId.value = data.profiles[0].id
                }
            } catch (e) { /* ignore */ }
        }

        const run = async () => {
            if (!selectedProfileId.value) return
            try {
                await fetchInsights(selectedProfileId.value, days.value)
            } catch (e) { /* error shown via reactive */ }
        }

        const severityIcon = (s) => s === 'HIGH' ? 'alert' : s === 'MEDIUM' ? 'alert-circle' : 'information'
        const trendIcon = (t) => t === 'IMPROVING' ? 'trending-up' : t === 'WORSENING' ? 'trending-down' : t === 'STABLE' ? 'minus' : 'help-circle-outline'
        const formatTrend = (t) => ({ IMPROVING: 'Improving', WORSENING: 'Worsening', STABLE: 'Stable', INSUFFICIENT_DATA: 'No data' }[t] || t)
        const formatVitalType = (t) => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        const adherenceClass = (pct) => pct >= 80 ? 'bar-good' : pct >= 50 ? 'bar-warn' : 'bar-poor'

        onMounted(loadProfiles)

        return {
            insights, loading, error,
            profiles, selectedProfileId, days,
            run, severityIcon, trendIcon, formatTrend, formatVitalType, adherenceClass
        }
    }
}
</script>

<style scoped>
.insights-controls {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
}
.control-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.control-group label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
.insights-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.insight-card {
    background: var(--glass-card-bg, rgba(255,255,255,0.04));
    border: 1px solid var(--glass-card-border, rgba(255,255,255,0.1));
    border-radius: 14px;
    padding: 16px 20px;
}
.insight-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 800;
    font-size: 15px;
    color: var(--text-primary);
    margin-bottom: 12px;
}
.summary-text {
    margin: 0;
    color: var(--text-secondary, var(--text-primary));
    line-height: 1.6;
}
.error-card {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #ff6b6b;
}
/* Alerts */
.alert-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    margin-bottom: 6px;
    font-size: 14px;
}
.alert-high { background: rgba(255,100,100,0.15); color: #ff6b6b; }
.alert-medium { background: rgba(255,185,0,0.15); color: #ffb900; }
.alert-low { background: rgba(100,180,255,0.12); color: #64b4ff; }
/* Vital trends */
.trend-row {
    display: grid;
    grid-template-columns: 160px 110px 1fr;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid var(--glass-card-border, rgba(255,255,255,0.07));
    font-size: 13px;
}
.trend-row:last-child { border-bottom: none; }
.trend-type { font-weight: 700; color: var(--text-primary); }
.trend-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
}
.trend-improving { background: rgba(0,200,100,0.15); color: #00c864; }
.trend-worsening { background: rgba(255,100,100,0.15); color: #ff6b6b; }
.trend-stable { background: rgba(150,150,200,0.15); color: var(--text-muted); }
.trend-insufficient_data { background: rgba(150,150,200,0.10); color: var(--text-muted); }
.trend-note { color: var(--text-muted); }
/* Medications */
.med-row {
    display: grid;
    grid-template-columns: 1fr 100px 40px;
    grid-template-rows: auto auto;
    gap: 4px 10px;
    padding: 8px 0;
    border-bottom: 1px solid var(--glass-card-border, rgba(255,255,255,0.07));
    font-size: 13px;
    align-items: center;
}
.med-row:last-child { border-bottom: none; }
.med-name {
    font-weight: 700;
    color: var(--text-primary);
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 8px;
}
.low-stock-badge {
    font-size: 11px;
    font-weight: 700;
    background: rgba(255,185,0,0.2);
    color: #ffb900;
    padding: 2px 6px;
    border-radius: 999px;
}
.med-bar-wrap {
    height: 6px;
    background: var(--glass-card-border, rgba(255,255,255,0.1));
    border-radius: 999px;
    overflow: hidden;
}
.med-bar { height: 100%; border-radius: 999px; transition: width 0.4s; }
.bar-good { background: #00c864; }
.bar-warn { background: #ffb900; }
.bar-poor { background: #ff6b6b; }
.med-pct { font-weight: 700; color: var(--text-primary); text-align: right; }
.med-note { color: var(--text-muted); grid-column: 1 / -1; font-size: 12px; }
/* Recommendations */
.rec-list {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: var(--text-secondary, var(--text-primary));
    font-size: 14px;
    line-height: 1.5;
}
.disclaimer {
    font-size: 11px;
    color: var(--text-muted);
    text-align: center;
    margin: 4px 0 0;
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
