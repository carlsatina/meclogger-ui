<template>
<div class="medical-shell stagger-page stagger-seq" :class="{ 'stagger-ready': staggerReady }">
    <div class="medical-orb orb-1"></div>
    <div class="medical-orb orb-2"></div>

    <div class="med-hero">
        <button class="icon-btn-ghost" @click="$router.back()">
            <mdicon name="arrow-left" :size="20" />
        </button>
        <div>
            <p class="eyebrow">Medical Records</p>
            <h2 class="page-title">AI Health Insights</h2>
        </div>
    </div>

    <div class="med-body">
        <!-- Controls -->
        <div class="glass-card control-card">
            <div class="control-row">
                <label>Profile</label>
                <select class="car-select" v-model="selectedProfileId">
                    <option value="" disabled>Select profile</option>
                    <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.displayName }}</option>
                </select>
            </div>
            <div class="control-row">
                <label>Period</label>
                <select class="car-select" v-model="days">
                    <option :value="7">7 days</option>
                    <option :value="14">14 days</option>
                    <option :value="30">30 days</option>
                    <option :value="60">60 days</option>
                    <option :value="90">90 days</option>
                </select>
            </div>
            <button class="car-btn analyze-btn" :disabled="loading || !selectedProfileId" @click="run">
                <mdicon v-if="loading" name="loading" :size="18" class="spin" />
                <mdicon v-else name="brain" :size="18" />
                {{ loading ? 'Analyzing…' : 'Generate Insights' }}
            </button>
        </div>

        <div v-if="error" class="glass-card error-card">
            <mdicon name="alert-circle-outline" :size="18" />
            {{ error }}
        </div>

        <div v-if="!insights && !loading && !error" class="glass-card state-msg">
            Select a profile and tap Generate Insights.
        </div>

        <template v-if="insights">
            <!-- Summary -->
            <div class="glass-card insight-card">
                <div class="ic-header">
                    <mdicon name="text-box-check-outline" :size="20" />
                    <span>Summary</span>
                </div>
                <p class="summary-text">{{ insights.summary }}</p>
            </div>

            <!-- Alerts -->
            <div v-if="insights.alerts?.length" class="glass-card insight-card">
                <div class="ic-header">
                    <mdicon name="bell-alert-outline" :size="20" />
                    <span>Alerts</span>
                </div>
                <div v-for="alert in insights.alerts" :key="alert.message"
                     class="alert-row" :class="'alert-' + alert.severity.toLowerCase()">
                    <mdicon :name="severityIcon(alert.severity)" :size="15" />
                    <span>{{ alert.message }}</span>
                </div>
            </div>

            <!-- Vital Trends -->
            <div v-if="insights.vitalTrends?.length" class="glass-card insight-card">
                <div class="ic-header">
                    <mdicon name="chart-line" :size="20" />
                    <span>Vital Trends</span>
                </div>
                <div v-for="vt in insights.vitalTrends" :key="vt.type" class="trend-row">
                    <div class="trend-left">
                        <span class="trend-type">{{ formatVitalType(vt.type) }}</span>
                        <span class="trend-badge" :class="'trend-' + vt.trend.toLowerCase()">
                            <mdicon :name="trendIcon(vt.trend)" :size="12" />
                            {{ formatTrend(vt.trend) }}
                        </span>
                    </div>
                    <p class="trend-note">{{ vt.note }}</p>
                </div>
            </div>

            <!-- Medication Adherence -->
            <div v-if="insights.medicationAdherence?.length" class="glass-card insight-card">
                <div class="ic-header">
                    <mdicon name="pill" :size="20" />
                    <span>Medication Adherence</span>
                </div>
                <div v-for="med in insights.medicationAdherence" :key="med.name" class="med-row">
                    <div class="med-header-row">
                        <span class="med-name">{{ med.name }}</span>
                        <span v-if="med.lowStock" class="low-stock-badge">Low Stock</span>
                        <span class="med-pct">{{ med.adherencePercent }}%</span>
                    </div>
                    <div class="med-bar-wrap">
                        <div class="med-bar" :style="{ width: med.adherencePercent + '%' }"
                             :class="adherenceClass(med.adherencePercent)"></div>
                    </div>
                    <p class="med-note">{{ med.note }}</p>
                </div>
            </div>

            <!-- Recommendations -->
            <div v-if="insights.recommendations?.length" class="glass-card insight-card">
                <div class="ic-header">
                    <mdicon name="lightbulb-outline" :size="20" />
                    <span>Recommendations</span>
                </div>
                <ul class="rec-list">
                    <li v-for="rec in insights.recommendations" :key="rec">{{ rec }}</li>
                </ul>
            </div>

            <p class="disclaimer">AI-generated analysis only — not medical advice.</p>
        </template>
    </div>
</div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useHealthInsights } from '@/composables/healthInsights'
import { useStaggerReady } from '@/composables/staggerReady'
import { API_BASE_URL } from '@/constants/config'

export default {
    name: 'HealthInsightsMobile',
    setup() {
        const { insights, loading, error, fetchInsights } = useHealthInsights()
        const staggerReady = useStaggerReady()
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
            run, severityIcon, trendIcon, formatTrend, formatVitalType, adherenceClass,
            staggerReady
        }
    }
}
</script>

<style scoped>
.med-hero {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 16px 12px;
}
.med-body {
    padding: 0 16px 120px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}
.control-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 16px;
}
.control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}
.control-row label {
    font-weight: 700;
    color: var(--text-primary);
    font-size: 14px;
}
.analyze-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
}
.error-card {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #ff6b6b;
    padding: 12px 16px;
    border-radius: 12px;
    background: rgba(255,100,100,0.1);
    border: 1px solid rgba(255,100,100,0.2);
}
.state-msg {
    padding: 16px;
    color: var(--text-muted);
    text-align: center;
}
.insight-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
}
.ic-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 800;
    font-size: 14px;
    color: var(--text-primary);
}
.summary-text {
    margin: 0;
    color: var(--text-secondary, var(--text-primary));
    font-size: 14px;
    line-height: 1.6;
}
.alert-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    font-size: 13px;
}
.alert-high { background: rgba(255,100,100,0.15); color: #ff6b6b; }
.alert-medium { background: rgba(255,185,0,0.15); color: #ffb900; }
.alert-low { background: rgba(100,180,255,0.12); color: #64b4ff; }
.trend-row {
    padding: 8px 0;
    border-bottom: 1px solid var(--glass-card-border, rgba(255,255,255,0.07));
}
.trend-row:last-child { border-bottom: none; }
.trend-left {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}
.trend-type { font-weight: 700; color: var(--text-primary); font-size: 13px; }
.trend-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 7px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
}
.trend-improving { background: rgba(0,200,100,0.15); color: #00c864; }
.trend-worsening { background: rgba(255,100,100,0.15); color: #ff6b6b; }
.trend-stable { background: rgba(150,150,200,0.15); color: var(--text-muted); }
.trend-insufficient_data { background: rgba(150,150,200,0.10); color: var(--text-muted); }
.trend-note { color: var(--text-muted); font-size: 12px; margin: 0; }
.med-row {
    padding: 8px 0;
    border-bottom: 1px solid var(--glass-card-border, rgba(255,255,255,0.07));
}
.med-row:last-child { border-bottom: none; }
.med-header-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}
.med-name { font-weight: 700; color: var(--text-primary); font-size: 13px; flex: 1; }
.med-pct { font-weight: 700; color: var(--text-primary); font-size: 13px; }
.low-stock-badge {
    font-size: 10px;
    font-weight: 700;
    background: rgba(255,185,0,0.2);
    color: #ffb900;
    padding: 2px 6px;
    border-radius: 999px;
}
.med-bar-wrap {
    height: 5px;
    background: var(--glass-card-border, rgba(255,255,255,0.1));
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 4px;
}
.med-bar { height: 100%; border-radius: 999px; }
.bar-good { background: #00c864; }
.bar-warn { background: #ffb900; }
.bar-poor { background: #ff6b6b; }
.med-note { color: var(--text-muted); font-size: 12px; margin: 0; }
.rec-list {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: var(--text-secondary, var(--text-primary));
    font-size: 13px;
    line-height: 1.5;
}
.disclaimer {
    font-size: 11px;
    color: var(--text-muted);
    text-align: center;
    margin: 0;
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
