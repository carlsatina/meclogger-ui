<template>
<div class="settings-shell">
    <div class="settings-orb orb-1"></div>
    <div class="settings-orb orb-2"></div>
    <div class="settings-card">
        <div class="settings-header">
            <button class="icon-btn-ghost" @click="router.back()">
                <mdicon name="arrow-left" :size="20"/>
            </button>
            <div class="title-block">
                <p class="eyebrow">MECLogger</p>
                <h2 class="page-title">Settings</h2>
            </div>
        </div>

        <div v-if="loading" class="state-box">
            <mdicon name="loading" :size="32" class="spin"/>
        </div>

        <template v-else>
            <div class="settings-grid">
                <!-- AI Integration -->
                <section class="settings-section">
                    <h3 class="section-title">
                        <mdicon name="robot-outline" :size="17"/>
                        AI Integration
                    </h3>
                    <div class="section-card">
                        <div class="section-card-header">
                            <div class="section-icon ai-icon"><mdicon name="brain" :size="20"/></div>
                            <div>
                                <p class="section-card-title">AI Provider</p>
                                <p class="section-card-desc">Powers health insights and spending analysis across all modules</p>
                            </div>
                            <div class="status-pill" :class="form.aiProvider && (aiKeySet || form.aiApiKey) ? 'on' : 'off'">
                                <span class="status-dot"></span>
                                {{ form.aiProvider && (aiKeySet || form.aiApiKey) ? 'Configured' : 'Not configured' }}
                            </div>
                        </div>
                        <div class="field-row">
                            <div class="field-group">
                                <label class="field-label">Provider</label>
                                <select class="field-input" v-model="form.aiProvider">
                                    <option value="">No provider</option>
                                    <option value="anthropic">Anthropic (Claude)</option>
                                    <option value="openai">OpenAI (GPT)</option>
                                </select>
                            </div>
                            <div class="field-group" v-if="form.aiProvider">
                                <label class="field-label">
                                    API Key
                                    <span v-if="aiKeySet && !form.aiApiKey" class="key-set-badge">Key saved — enter a new one to replace</span>
                                </label>
                                <input
                                    class="field-input"
                                    type="password"
                                    v-model="form.aiApiKey"
                                    :placeholder="aiKeySet && !form.aiApiKey ? '••••••••••••••••••••' : (form.aiProvider === 'anthropic' ? 'sk-ant-…' : 'sk-…')"
                                    autocomplete="new-password"
                                    spellcheck="false"
                                    @copy.prevent
                                    @cut.prevent
                                />
                                <p class="field-hint" v-if="form.aiProvider === 'anthropic'">console.anthropic.com → API Keys</p>
                                <p class="field-hint" v-else-if="form.aiProvider === 'openai'">platform.openai.com → API keys</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Preferences -->
                <section class="settings-section">
                    <h3 class="section-title">
                        <mdicon name="tune-variant" :size="17"/>
                        Preferences
                    </h3>
                    <div class="section-card">
                        <div class="field-row">
                            <div class="field-group">
                                <label class="field-label">Default currency</label>
                                <input class="field-input" v-model="form.currency" placeholder="PHP" maxlength="5"/>
                            </div>
                            <div class="field-group">
                                <label class="field-label">Distance unit</label>
                                <div class="segment-control">
                                    <button class="segment-btn" :class="{ active: form.distanceUnit === 'km' }" @click="form.distanceUnit = 'km'">km</button>
                                    <button class="segment-btn" :class="{ active: form.distanceUnit === 'mi' }" @click="form.distanceUnit = 'mi'">mi</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Appearance -->
                <section class="settings-section">
                    <h3 class="section-title">
                        <mdicon name="palette-outline" :size="17"/>
                        Appearance
                    </h3>
                    <div class="section-card">
                        <div class="appearance-row">
                            <div>
                                <p class="section-card-title">Theme</p>
                                <p class="section-card-desc">{{ isDark ? 'Dark mode is active' : 'Light mode is active' }}</p>
                            </div>
                            <button class="theme-toggle" @click="toggleTheme">
                                <mdicon :name="isDark ? 'white-balance-sunny' : 'moon-waning-crescent'" :size="17"/>
                                <span>Switch to {{ isDark ? 'light' : 'dark' }}</span>
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <div class="save-row">
                <p v-if="saveError" class="save-error">{{ saveError }}</p>
                <button class="save-btn" :disabled="saving" @click="save">
                    <mdicon v-if="saving" name="loading" :size="17" class="spin"/>
                    <mdicon v-else-if="saved" name="check" :size="17"/>
                    <mdicon v-else name="content-save-outline" :size="17"/>
                    <span>{{ saving ? 'Saving…' : saved ? 'Saved!' : 'Save settings' }}</span>
                </button>
            </div>
        </template>
    </div>
</div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettings } from '@/composables/settings'
import { useTheme } from '@/composables/theme'

export default {
    name: 'SettingsWeb',
    setup() {
        const router = useRouter()
        const { getSettings, saveSettings } = useSettings()
        const { isDark, toggleTheme } = useTheme()

        const loading = ref(true)
        const saving  = ref(false)
        const saved   = ref(false)
        const saveError = ref('')
        const aiKeySet = ref(false)
        const form = ref({ aiProvider: '', aiApiKey: '', currency: 'PHP', distanceUnit: 'km' })

        const token = () => localStorage.getItem('token')

        onMounted(async () => {
            try {
                const s = await getSettings(token())
                form.value.aiProvider   = s.aiProvider   || ''
                form.value.aiApiKey     = ''
                aiKeySet.value          = !!s.aiKeySet
                form.value.currency     = s.currency     || 'PHP'
                form.value.distanceUnit = s.distanceUnit || 'km'
            } catch (e) { /* ignore */ }
            finally { loading.value = false }
        })

        const save = async () => {
            saving.value = true
            saveError.value = ''
            try {
                const payload = {
                    aiProvider:   form.value.aiProvider,
                    currency:     form.value.currency.trim().toUpperCase(),
                    distanceUnit: form.value.distanceUnit,
                }
                if (form.value.aiApiKey.trim()) payload.aiApiKey = form.value.aiApiKey.trim()
                await saveSettings(token(), payload)
                if (form.value.aiApiKey.trim()) { aiKeySet.value = true; form.value.aiApiKey = '' }
                saved.value = true
                setTimeout(() => { saved.value = false }, 2500)
            } catch (e) {
                saveError.value = e.message || 'Failed to save.'
            } finally {
                saving.value = false
            }
        }

        return { router, form, aiKeySet, loading, saving, saved, saveError, isDark, toggleTheme, save }
    }
}
</script>

<style scoped>
.settings-shell {
    min-height: 100vh;
    background: var(--bg-main);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 32px 24px 60px;
    position: relative;
    overflow: hidden;
}
.settings-orb { position: absolute; filter: blur(90px); opacity: 0.14; z-index: 0; border-radius: 50%; pointer-events: none; }
.orb-1 { width: 420px; height: 420px; background: linear-gradient(135deg, #a78bfa, #38bdf8); top: -160px; left: -120px; }
.orb-2 { width: 300px; height: 300px; background: linear-gradient(135deg, #22c55e, #f59e0b); bottom: -100px; right: -80px; }

.settings-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 760px;
    background: var(--glass-card-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 22px;
    padding: 28px 32px 36px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.settings-header { display: flex; align-items: center; gap: 16px; }
.icon-btn-ghost {
    background: transparent;
    border: 1px solid var(--glass-card-border);
    border-radius: 10px;
    padding: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    flex-shrink: 0;
}
.icon-btn-ghost:hover { background: var(--glass-ghost-bg); }
.title-block { flex: 1; }
.eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin: 0; }
.page-title { font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 2px 0 0; }

.state-box { display: flex; justify-content: center; padding: 40px; color: var(--text-muted); }

.settings-grid { display: flex; flex-direction: column; gap: 24px; }

.settings-section { display: flex; flex-direction: column; gap: 10px; }
.section-title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-muted);
    margin: 0;
}

.section-card {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.section-card-header { display: flex; align-items: center; gap: 14px; }
.section-icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ai-icon { background: rgba(167,139,250,0.18); color: #a78bfa; }
.section-card-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0; flex: 1; }
.section-card-desc  { font-size: 12px; color: var(--text-muted); margin: 2px 0 0; }

.status-pill {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 700;
    padding: 4px 10px; border-radius: 999px; flex-shrink: 0;
}
.status-pill.on  { background: rgba(34,197,94,0.12); color: #4ade80; border: 1px solid rgba(34,197,94,0.25); }
.status-pill.off { background: rgba(148,163,184,0.1); color: var(--text-muted); border: 1px solid rgba(148,163,184,0.2); }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field-group { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.field-input {
    padding: 9px 12px; border-radius: 9px;
    border: 1px solid var(--glass-card-border);
    background: rgba(255,255,255,0.05);
    color: var(--text-primary); font-size: 14px;
    outline: none; width: 100%;
}
.field-input:focus { border-color: rgba(167,139,250,0.45); }
.field-hint { font-size: 11px; color: var(--text-muted); margin: 2px 0 0; }
.key-set-badge { font-size: 10px; font-weight: 600; color: #4ade80; margin-left: 6px; text-transform: none; letter-spacing: 0; }


.segment-control { display: flex; border-radius: 9px; overflow: hidden; border: 1px solid var(--glass-card-border); width: fit-content; }
.segment-btn { padding: 7px 20px; border: none; background: transparent; color: var(--text-muted); font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
.segment-btn.active { background: rgba(167,139,250,0.2); color: #a78bfa; }

.appearance-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.theme-toggle {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 16px; border-radius: 10px;
    border: 1px solid var(--glass-card-border);
    background: var(--glass-ghost-bg);
    color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer;
    flex-shrink: 0;
}

.save-row { display: flex; align-items: center; justify-content: flex-end; gap: 14px; padding-top: 4px; }
.save-error { font-size: 13px; color: #fca5a5; margin: 0; }
.save-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 24px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #a78bfa, #38bdf8);
    color: #0b1020; font-size: 14px; font-weight: 700; cursor: pointer;
    transition: opacity 0.15s;
}
.save-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
