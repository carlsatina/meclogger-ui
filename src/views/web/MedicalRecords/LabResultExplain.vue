<template>
<div class="explain-container medical-shell">
    <div class="medical-orb orb-1"></div>
    <div class="medical-orb orb-2"></div>

    <div class="explain-wrapper">
        <div class="explain-header glass-card">
            <button class="back-btn" @click="router.back()">
                <mdicon name="arrow-left" :size="22"/>
            </button>
            <div class="header-icon">
                <mdicon name="test-tube" :size="26"/>
            </div>
            <div class="header-text">
                <p class="header-label">About this test</p>
                <h2 class="header-title">{{ displayName }}</h2>
            </div>
            <div class="header-reading" v-if="value">
                <span class="reading-value">{{ value }}{{ unit ? ' ' + unit : '' }}</span>
                <span v-if="status" class="status-badge" :class="`status-${status.toLowerCase()}`">{{ status }}</span>
            </div>
        </div>

        <div v-if="loading" class="state-box glass-card">
            <mdicon name="loading" :size="40" class="spin"/>
            <p class="state-text">Preparing explanation…</p>
        </div>

        <div v-else-if="error" class="state-box glass-card">
            <mdicon name="alert-circle-outline" :size="44" class="state-icon"/>
            <p class="state-title">Couldn't load explanation</p>
            <p class="state-text">{{ error }}</p>
            <button class="retry-btn" @click="load">Try again</button>
        </div>

        <template v-else-if="explanation">
            <div class="explain-grid">
                <section class="info-card glass-card span-2">
                    <p class="card-label">Overview</p>
                    <p class="card-text">{{ explanation.summary }}</p>
                    <p v-if="explanation.measures" class="card-text muted">{{ explanation.measures }}</p>
                </section>

                <section class="info-card glass-card high-card">
                    <div class="card-head">
                        <span class="dot high"></span>
                        <p class="card-label">When it's high</p>
                    </div>
                    <p class="card-text">{{ explanation.highMeaning }}</p>
                    <ul v-if="explanation.highCauses?.length" class="cause-list">
                        <li v-for="(c, i) in explanation.highCauses" :key="i">{{ c }}</li>
                    </ul>
                </section>

                <section class="info-card glass-card low-card">
                    <div class="card-head">
                        <span class="dot low"></span>
                        <p class="card-label">When it's low</p>
                    </div>
                    <p class="card-text">{{ explanation.lowMeaning }}</p>
                    <ul v-if="explanation.lowCauses?.length" class="cause-list">
                        <li v-for="(c, i) in explanation.lowCauses" :key="i">{{ c }}</li>
                    </ul>
                </section>

                <section class="info-card glass-card" v-if="explanation.prevention?.length">
                    <p class="card-label">How to keep it healthy</p>
                    <ul class="tip-list">
                        <li v-for="(t, i) in explanation.prevention" :key="i">
                            <mdicon name="check-circle-outline" :size="16" class="tip-icon"/>
                            <span>{{ t }}</span>
                        </li>
                    </ul>
                </section>

                <section class="info-card glass-card warn-card" v-if="explanation.whenToWorry">
                    <div class="card-head">
                        <mdicon name="stethoscope" :size="18" class="warn-icon"/>
                        <p class="card-label">When to see a doctor</p>
                    </div>
                    <p class="card-text">{{ explanation.whenToWorry }}</p>
                </section>
            </div>

            <p class="disclaimer">
                This is general educational information, not medical advice. Always consult a healthcare
                professional about your results.
            </p>
        </template>
    </div>
</div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMedicalRecords } from '@/composables/medicalRecords'

export default {
    name: 'LabResultExplainWeb',
    setup() {
        const router = useRouter()
        const route = useRoute()
        const { fetchLabExplanation } = useMedicalRecords()

        const testName = String(route.query.testName || '')
        const value = String(route.query.value || '')
        const unit = String(route.query.unit || '')
        const status = String(route.query.status || '')
        const referenceRange = String(route.query.referenceRange || '')

        const explanation = ref(null)
        const loading = ref(false)
        const error = ref('')

        const displayName = computed(() => explanation.value?.testName || testName || 'Lab Result')

        const load = async () => {
            if (!testName) { error.value = 'No test specified.'; return }
            const token = localStorage.getItem('token')
            if (!token) { router.push('/login'); return }
            loading.value = true
            error.value = ''
            try {
                explanation.value = await fetchLabExplanation(token, testName)
            } catch (err) {
                error.value = err.message || 'Something went wrong.'
            } finally {
                loading.value = false
            }
        }

        onMounted(load)

        return {
            router, displayName, value, unit, status, referenceRange,
            explanation, loading, error, load
        }
    }
}
</script>

<style scoped>
.medical-shell {
    min-height: 100vh;
    background: var(--bg-main);
    position: relative;
    overflow: hidden;
    padding: 32px 28px;
    display: flex;
    justify-content: center;
}
.medical-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.3;
    z-index: 0;
}
.medical-orb.orb-1 { width: 340px; height: 340px; top: -130px; left: -90px; background: linear-gradient(135deg, var(--accent-2), var(--accent-3)); }
.medical-orb.orb-2 { width: 300px; height: 300px; bottom: -150px; right: -110px; background: linear-gradient(135deg, var(--accent-1), var(--accent-4)); }

.explain-wrapper {
    width: 100%;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.explain-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 24px;
    border-radius: 18px;
}
.back-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid var(--glass-card-border);
    background: var(--glass-ghost-bg);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
}
.header-icon {
    width: 52px;
    height: 52px;
    border-radius: 15px;
    background: linear-gradient(135deg, var(--accent-2), var(--accent-3));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.header-text { flex: 1; min-width: 0; }
.header-label {
    margin: 0 0 4px;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
}
.header-title { margin: 0; font-size: 24px; color: var(--text-primary); }
.header-reading { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.reading-value { font-size: 20px; font-weight: 700; color: var(--text-primary); }

.status-badge {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
}
.status-normal   { background: rgba(34,197,94,0.15);  color: #4ade80; border: 1px solid rgba(34,197,94,0.25); }
.status-high     { background: rgba(251,146,60,0.15); color: #fb923c; border: 1px solid rgba(251,146,60,0.3); }
.status-low      { background: rgba(96,165,250,0.15); color: #60a5fa; border: 1px solid rgba(96,165,250,0.3); }
.status-critical { background: rgba(248,113,113,0.15);color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
.status-unknown  { background: rgba(148,163,184,0.1); color: var(--text-muted); border: 1px solid rgba(148,163,184,0.2); }

.explain-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}
.info-card { padding: 22px; border-radius: 16px; }
.info-card.span-2 { grid-column: 1 / -1; }

.card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.dot.high { background: #fb923c; }
.dot.low { background: #60a5fa; }
.high-card { border-left: 3px solid rgba(251,146,60,0.5); }
.low-card { border-left: 3px solid rgba(96,165,250,0.5); }
.warn-card { border-left: 3px solid rgba(168,85,247,0.5); grid-column: 1 / -1; }
.warn-icon { color: #c084fc; }

.card-label {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--text-muted);
}
.card-head .card-label { margin: 0; }
.card-text { margin: 0; color: var(--text-secondary); line-height: 1.65; font-size: 16px; }
.card-text.muted { margin-top: 10px; color: var(--text-muted); font-size: 15px; }

.cause-list { margin: 12px 0 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; }
.cause-list li { color: var(--text-secondary); font-size: 15px; line-height: 1.55; }

.tip-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.tip-list li { display: flex; align-items: flex-start; gap: 10px; color: var(--text-secondary); font-size: 16px; line-height: 1.55; }
.tip-icon { color: #4ade80; flex-shrink: 0; margin-top: 2px; }

.disclaimer {
    margin: 0;
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
    text-align: center;
}

.state-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    gap: 12px;
    border-radius: 18px;
}
.state-icon { color: #f87171; }
.state-title { margin: 0; font-size: 18px; font-weight: 700; color: var(--text-primary); }
.state-text { margin: 0; font-size: 14px; color: var(--text-muted); max-width: 320px; line-height: 1.5; }
.retry-btn {
    margin-top: 6px;
    padding: 10px 22px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, var(--accent-1), var(--accent-4));
    color: #fff;
    font-weight: 600;
    cursor: pointer;
}

.spin { animation: spin 1s linear infinite; color: var(--accent-2); }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 720px) {
    .explain-grid { grid-template-columns: 1fr; }
    .warn-card, .info-card.span-2 { grid-column: auto; }
    .header-reading { display: none; }
}
</style>
