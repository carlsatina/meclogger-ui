<template>
<div class="page-container">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <div class="header glass-nav">
        <button class="back-btn" @click="router.back()">
            <mdicon name="arrow-left" :size="24"/>
        </button>
        <div class="title-block">
            <h2 class="page-title">Medications</h2>
            <p class="profile-subtitle">{{ profileName }}</p>
        </div>
        <div style="width:40px"></div>
    </div>

    <div class="content">
        <div v-if="loading" class="state-box">
            <mdicon name="loading" :size="32" class="spin"/>
            <p>Loading medications…</p>
        </div>

        <template v-else>
            <div v-if="medications.length" class="list">
                <div class="med-card glass-card" v-for="med in medications" :key="med.id">
                    <template v-if="editingId !== med.id">
                        <div class="med-top">
                            <div class="med-icon">
                                <mdicon name="pill" :size="22"/>
                            </div>
                            <div class="med-body">
                                <h4 class="med-name">{{ med.name }}</h4>
                                <p v-if="med.dosage" class="med-detail">{{ med.dosage }}</p>
                                <p v-if="med.instructions" class="med-instructions">{{ med.instructions }}</p>
                            </div>
                            <div class="med-right">
                                <div class="adherence-ring" :style="ringStyle(adherence(med))">
                                    <span class="adherence-num">{{ adherence(med) }}%</span>
                                </div>
                                <span v-if="med.inventoryQuantity != null" class="stock-badge" :class="isLowStock(med) ? 'low' : 'ok'">
                                    {{ med.inventoryQuantity }} left
                                </span>
                            </div>
                        </div>

                        <div class="med-meta-row">
                            <span v-if="lastTaken(med)" class="last-taken">
                                <mdicon name="check-circle-outline" :size="14"/>
                                Last taken {{ formatRelative(lastTaken(med)) }}
                            </span>
                            <span v-else class="last-taken muted">No doses logged yet</span>
                            <span class="adherence-label">30-day adherence</span>
                        </div>

                        <div class="med-actions">
                            <button class="dose-btn took" :disabled="loggingId === med.id" @click="logDose(med.id, 'taken')">
                                <mdicon name="check" :size="16"/>
                                Took it
                            </button>
                            <button class="dose-btn skip" :disabled="loggingId === med.id" @click="logDose(med.id, 'skipped')">
                                Skip
                            </button>
                            <button class="dose-btn remind" @click="setReminder(med)">
                                <mdicon name="bell-outline" :size="16"/>
                            </button>
                            <button class="dose-btn edit" @click="startEdit(med)">
                                <mdicon name="pencil-outline" :size="16"/>
                            </button>
                            <button class="dose-btn del" :disabled="deletingId === med.id" @click="confirmDelete(med)">
                                <mdicon name="trash-can-outline" :size="16"/>
                            </button>
                        </div>
                    </template>

                    <template v-else>
                        <div class="edit-form">
                            <input class="edit-input" v-model="editDraft.name" placeholder="Name"/>
                            <input class="edit-input" v-model="editDraft.dosage" placeholder="Dosage (e.g. 500mg)"/>
                            <input class="edit-input" v-model="editDraft.instructions" placeholder="Instructions"/>
                        </div>
                        <div class="med-actions">
                            <button class="dose-btn took" :disabled="savingId === med.id" @click="saveEdit(med)">
                                <mdicon name="check" :size="16"/>
                                Save
                            </button>
                            <button class="dose-btn skip" @click="cancelEdit()">
                                Cancel
                            </button>
                        </div>
                    </template>
                </div>
            </div>

            <div v-else class="state-box empty">
                <mdicon name="pill-off" :size="56" class="empty-icon"/>
                <p class="empty-title">No medications yet</p>
                <p class="empty-text">Add a record and use "Extract with AI" on a prescription to save medications here.</p>
            </div>

            <p v-if="error" class="error-text">{{ error }}</p>
        </template>
    </div>
</div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { API_BASE_URL } from '@/constants/config'

export default {
    name: 'MedicationsMobile',
    setup() {
        const router = useRouter()
        const route = useRoute()
        const profileId = route.query.profileId || localStorage.getItem('selectedProfileId') || ''
        const profileName = route.query.profileName || localStorage.getItem('selectedProfileName') || ''
        const medications = ref([])
        const loading = ref(false)
        const error = ref('')
        const loggingId = ref(null)
        const deletingId = ref(null)
        const editingId = ref(null)
        const savingId = ref(null)
        const editDraft = ref({ name: '', dosage: '', instructions: '' })

        const formatDate = (d) => {
            if (!d) return ''
            return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        }

        const formatRelative = (d) => {
            if (!d) return ''
            const diff = Date.now() - new Date(d).getTime()
            const mins = Math.floor(diff / 60000)
            if (mins < 60) return mins <= 1 ? 'just now' : `${mins}m ago`
            const hrs = Math.floor(mins / 60)
            if (hrs < 24) return `${hrs}h ago`
            const days = Math.floor(hrs / 24)
            if (days === 1) return 'yesterday'
            if (days < 7) return `${days}d ago`
            return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        }

        const isLowStock = (med) => {
            if (med.inventoryQuantity == null || med.lowStockThreshold == null) return false
            return med.inventoryQuantity <= med.lowStockThreshold
        }

        const adherence = (med) => {
            const logs = med.logs || []
            const counted = logs.filter(l => l.status === 'taken' || l.status === 'missed' || l.status === 'skipped')
            if (!counted.length) return 0
            const taken = logs.filter(l => l.status === 'taken').length
            return Math.round((taken / counted.length) * 100)
        }

        const lastTaken = (med) => {
            const log = (med.logs || []).find(l => l.status === 'taken')
            return log?.occurredAt || null
        }

        const ringStyle = (pct) => {
            const color = pct >= 80 ? '#4ade80' : pct >= 50 ? '#fb923c' : '#f87171'
            return {
                background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`
            }
        }

        const load = async () => {
            if (!profileId) return
            const token = localStorage.getItem('token')
            if (!token) return
            loading.value = true
            error.value = ''
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/medications?profileId=${profileId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (res.ok) {
                    medications.value = data.medications || []
                } else {
                    error.value = data.message || 'Unable to load medications'
                }
            } catch (err) {
                error.value = err.message || 'Network error'
            } finally {
                loading.value = false
            }
        }

        const logDose = async (medicationId, status) => {
            const token = localStorage.getItem('token')
            if (!token) return
            loggingId.value = medicationId
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/medications/${medicationId}/log`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                })
                if (res.ok) {
                    const data = await res.json()
                    const med = medications.value.find(m => m.id === medicationId)
                    if (med) med.logs = [data.log, ...(med.logs || [])]
                }
            } finally {
                loggingId.value = null
            }
        }

        const startEdit = (med) => {
            editingId.value = med.id
            editDraft.value = { name: med.name, dosage: med.dosage || '', instructions: med.instructions || '' }
        }

        const cancelEdit = () => {
            editingId.value = null
        }

        const saveEdit = async (med) => {
            const token = localStorage.getItem('token')
            if (!token) return
            savingId.value = med.id
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/medications/${med.id}`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(editDraft.value)
                })
                if (res.ok) {
                    const data = await res.json()
                    const idx = medications.value.findIndex(m => m.id === med.id)
                    if (idx !== -1) medications.value[idx] = { ...medications.value[idx], ...data.medication }
                    editingId.value = null
                }
            } finally {
                savingId.value = null
            }
        }

        const setReminder = (med) => {
            router.push({
                name: 'medicine-reminders-add',
                query: { prefillName: med.name, prefillDosage: med.dosage || '' }
            })
        }

        const confirmDelete = async (med) => {
            if (!confirm(`Remove ${med.name}?`)) return
            const token = localStorage.getItem('token')
            if (!token) return
            deletingId.value = med.id
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/medications/${med.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) medications.value = medications.value.filter(m => m.id !== med.id)
            } finally {
                deletingId.value = null
            }
        }

        onMounted(load)

        return {
            router, medications, loading, error, profileName, loggingId, deletingId,
            editingId, savingId, editDraft,
            formatDate, formatRelative, isLowStock, adherence, lastTaken, ringStyle,
            logDose, startEdit, cancelEdit, saveEdit, setReminder, confirmDelete
        }
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

.bg-orb { position: absolute; filter: blur(60px); opacity: 0.25; z-index: 0; }
.orb-1 { width: 300px; height: 300px; border-radius: 50%; background: linear-gradient(135deg, #a855f7, #22d3ee); top: -130px; left: -100px; }
.orb-2 { width: 240px; height: 240px; border-radius: 50%; background: linear-gradient(135deg, #22c55e, #6366f1); bottom: -100px; right: -80px; }

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

.back-btn {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 12px;
    padding: 8px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.title-block { flex: 1; }
.page-title { font-size: 19px; font-weight: 700; color: var(--text-primary); margin: 0; }
.profile-subtitle { font-size: 13px; color: var(--text-muted); margin: 0; }

.content { flex: 1; padding: 18px 16px 32px; position: relative; z-index: 1; }

.list { display: flex; flex-direction: column; gap: 12px; }

.med-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
}

.med-top { display: flex; align-items: flex-start; gap: 12px; }

.med-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(168,85,247,0.25), rgba(34,211,238,0.2));
    border: 1px solid rgba(168,85,247,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c084fc;
    flex-shrink: 0;
}

.med-body { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.med-name { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; }
.med-detail { font-size: 13px; color: var(--text-secondary); margin: 0; }
.med-instructions { font-size: 12px; color: var(--text-muted); font-style: italic; margin: 0; }

.med-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }

.adherence-ring {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.adherence-ring::before {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    background: var(--bg-main, #0f172a);
}

.adherence-num {
    font-size: 11px;
    font-weight: 800;
    color: var(--text-primary);
    position: relative;
    z-index: 1;
}

.stock-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 999px;
}
.stock-badge.ok  { background: rgba(34,197,94,0.15);  color: #4ade80; border: 1px solid rgba(34,197,94,0.25); }
.stock-badge.low { background: rgba(251,146,60,0.15); color: #fb923c; border: 1px solid rgba(251,146,60,0.3); }

.med-meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    border-top: 1px solid rgba(255,255,255,0.06);
    border-bottom: 1px solid rgba(255,255,255,0.06);
}

.last-taken {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #4ade80;
}
.last-taken.muted { color: var(--text-muted); }
.adherence-label { font-size: 11px; color: var(--text-muted); }

.med-actions { display: flex; gap: 8px; }

.dose-btn {
    flex: 1;
    padding: 9px 12px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: opacity 0.15s;
}
.dose-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.dose-btn.took {
    background: linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,211,238,0.15));
    border: 1px solid rgba(34,197,94,0.35);
    color: #4ade80;
}
.dose-btn.skip {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--text-muted);
}
.edit-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.edit-input {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    padding: 9px 12px;
    color: var(--text-primary);
    font-size: 14px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
}
.edit-input:focus { border-color: rgba(99,102,241,0.5); }

.dose-btn.edit {
    flex: none;
    padding: 9px 12px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--text-muted);
}

.dose-btn.remind {
    flex: none;
    padding: 9px 12px;
    background: rgba(99,102,241,0.1);
    border: 1px solid rgba(99,102,241,0.25);
    color: #818cf8;
}
.dose-btn.del {
    flex: none;
    padding: 9px 12px;
    background: rgba(248,113,113,0.08);
    border: 1px solid rgba(248,113,113,0.2);
    color: #f87171;
}

.state-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: var(--text-secondary);
    gap: 12px;
}

.empty-icon { color: #64748b; }
.empty-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }
.empty-text  { font-size: 14px; color: var(--text-muted); margin: 0; max-width: 280px; line-height: 1.5; }

.error-text { color: #f87171; font-size: 13px; text-align: center; margin-top: 12px; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
