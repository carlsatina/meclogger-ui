<template>
<div class="page-container">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <div class="header glass-nav">
        <button class="back-btn" @click="router.back()">
            <mdicon name="arrow-left" :size="24"/>
        </button>
        <div class="title-block">
            <h2 class="page-title">{{ displayName }}</h2>
            <p class="profile-subtitle">About this test</p>
        </div>
        <div style="width:40px"></div>
    </div>

    <div class="content-scroll">
        <div class="reading-card glass-card" v-if="value">
            <div class="reading-icon">
                <mdicon name="test-tube" :size="22"/>
            </div>
            <div class="reading-body">
                <p class="reading-label">Your result</p>
                <p class="reading-value">{{ value }}{{ unit ? ' ' + unit : '' }}</p>
                <p v-if="referenceRange" class="reading-ref">Reference: {{ referenceRange }}</p>
            </div>
            <span v-if="status" class="status-badge" :class="`status-${status.toLowerCase()}`">{{ status }}</span>
        </div>

        <div v-if="loading" class="state-box">
            <mdicon name="loading" :size="40" class="spin"/>
            <p class="state-text">Preparing explanation…</p>
        </div>

        <div v-else-if="error" class="state-box">
            <mdicon name="alert-circle-outline" :size="44" class="state-icon"/>
            <p class="state-title">Couldn't load explanation</p>
            <p class="state-text">{{ error }}</p>
            <button class="retry-btn" @click="load">Try again</button>
        </div>

        <template v-else-if="explanation">
            <section class="info-card glass-card">
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
    name: 'LabResultExplainMobile',
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
.page-container {
    min-height: 100dvh;
    background: var(--bg-main);
    position: relative;
    overflow-x: hidden;
}

.bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.28;
    z-index: 0;
    pointer-events: none;
}
.orb-1 { width: 280px; height: 280px; top: -120px; left: -80px; background: linear-gradient(135deg, var(--accent-2), var(--accent-3)); }
.orb-2 { width: 260px; height: 260px; bottom: -120px; right: -90px; background: linear-gradient(135deg, var(--accent-1), var(--accent-4)); }

.header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    padding-top: calc(14px + var(--safe-top));
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
.title-block { flex: 1; min-width: 0; }
.page-title {
    margin: 0;
    font-size: 19px;
    font-weight: 700;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.profile-subtitle { margin: 2px 0 0; font-size: 13px; color: var(--text-muted); }

.content-scroll {
    position: relative;
    z-index: 1;
    padding: 8px 16px calc(40px + var(--safe-bottom));
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.reading-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    border-radius: 16px;
}
.reading-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--accent-2), var(--accent-3));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.reading-body { flex: 1; min-width: 0; }
.reading-label { margin: 0; font-size: 12px; color: var(--text-muted); }
.reading-value { margin: 2px 0 0; font-size: 18px; font-weight: 700; color: var(--text-primary); }
.reading-ref { margin: 2px 0 0; font-size: 12px; color: var(--text-muted); }

.status-badge {
    flex-shrink: 0;
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

.info-card {
    padding: 18px;
    border-radius: 16px;
}
.card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.dot.high { background: #fb923c; }
.dot.low { background: #60a5fa; }
.high-card { border-left: 3px solid rgba(251,146,60,0.5); }
.low-card { border-left: 3px solid rgba(96,165,250,0.5); }
.warn-card { border-left: 3px solid rgba(168,85,247,0.5); }
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
.card-text { margin: 0; color: var(--text-secondary); line-height: 1.6; font-size: 16px; }
.card-text.muted { margin-top: 8px; color: var(--text-muted); font-size: 15px; }

.cause-list {
    margin: 10px 0 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.cause-list li { color: var(--text-secondary); font-size: 15px; line-height: 1.5; }

.tip-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 11px; }
.tip-list li { display: flex; align-items: flex-start; gap: 9px; color: var(--text-secondary); font-size: 16px; line-height: 1.55; }
.tip-icon { color: #4ade80; flex-shrink: 0; margin-top: 1px; }

.disclaimer {
    margin: 4px 4px 0;
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
}
.state-icon { color: #f87171; }
.state-title { margin: 0; font-size: 17px; font-weight: 700; color: var(--text-primary); }
.state-text { margin: 0; font-size: 14px; color: var(--text-muted); max-width: 280px; line-height: 1.5; }
.retry-btn {
    margin-top: 6px;
    padding: 10px 20px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, var(--accent-1), var(--accent-4));
    color: #fff;
    font-weight: 600;
    cursor: pointer;
}

.spin { animation: spin 1s linear infinite; color: var(--accent-2); }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
