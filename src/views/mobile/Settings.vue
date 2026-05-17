<template>
<div class="settings-shell">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <header class="settings-nav glass-nav">
        <button class="back-btn" @click="router.back()">
            <mdicon name="arrow-left" :size="24"/>
        </button>
        <div class="nav-title-block">
            <h2 class="nav-title">Settings</h2>
            <p class="nav-sub">Global preferences</p>
        </div>
    </header>

    <div class="settings-content">
        <div v-if="loading" class="state-box">
            <mdicon name="loading" :size="32" class="spin"/>
        </div>

        <template v-else>
            <!-- AI Integration -->
            <div class="settings-section">
                <div class="section-label">
                    <mdicon name="robot-outline" :size="14"/>
                    AI Integration
                </div>
                <div class="settings-card">
                    <div class="setting-row-header">
                        <div class="setting-icon ai-icon">
                            <mdicon name="brain" :size="20"/>
                        </div>
                        <div class="setting-info">
                            <p class="setting-title">AI Provider</p>
                            <p class="setting-desc">Powers health insights and spending analysis</p>
                        </div>
                        <div class="status-pill" :class="form.aiProvider && (aiKeySet || form.aiApiKey) ? 'on' : 'off'">
                            <span class="status-dot"></span>
                            {{ form.aiProvider && (aiKeySet || form.aiApiKey) ? 'On' : 'Off' }}
                        </div>
                    </div>

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
                        <p class="field-hint" v-if="form.aiProvider === 'anthropic'">
                            Get your key → console.anthropic.com → API Keys
                        </p>
                        <p class="field-hint" v-else-if="form.aiProvider === 'openai'">
                            Get your key → platform.openai.com → API keys
                        </p>
                    </div>
                </div>
            </div>

            <!-- Preferences -->
            <div class="settings-section">
                <div class="section-label">
                    <mdicon name="tune-variant" :size="14"/>
                    Preferences
                </div>
                <div class="settings-card">
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

            <!-- Appearance -->
            <div class="settings-section">
                <div class="section-label">
                    <mdicon name="palette-outline" :size="14"/>
                    Appearance
                </div>
                <div class="settings-card">
                    <div class="setting-row-inline">
                        <div class="setting-info">
                            <p class="setting-title">Theme</p>
                            <p class="setting-desc">{{ isDark ? 'Dark mode' : 'Light mode' }}</p>
                        </div>
                        <button class="theme-toggle" @click="toggleTheme">
                            <mdicon :name="isDark ? 'white-balance-sunny' : 'moon-waning-crescent'" :size="18"/>
                            <span>{{ isDark ? 'Light' : 'Dark' }}</span>
                        </button>
                    </div>
                </div>
            </div>

            <p v-if="saveError" class="save-error">{{ saveError }}</p>

            <button class="save-btn" :disabled="saving" @click="save">
                <mdicon v-if="saving" name="loading" :size="18" class="spin"/>
                <mdicon v-else-if="saved" name="check" :size="18"/>
                <mdicon v-else name="content-save-outline" :size="18"/>
                <span>{{ saving ? 'Saving…' : saved ? 'Saved!' : 'Save settings' }}</span>
            </button>

            <div class="account-section">
                <div class="section-label">
                    <mdicon name="account-outline" :size="14"/>
                    Account
                </div>
                <div class="settings-card">
                    <button class="logout-row" @click="logout">
                        <mdicon name="logout" :size="18"/>
                        <span>Log out</span>
                    </button>
                </div>
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
import store from '@/store'

export default {
    name: 'SettingsMobile',
    setup() {
        const router = useRouter()
        const { getSettings, saveSettings } = useSettings()
        const { isDark, toggleTheme } = useTheme()

        const loading = ref(true)
        const saving  = ref(false)
        const saved   = ref(false)
        const saveError = ref('')

        const aiKeySet = ref(false)
        const form = ref({
            aiProvider: '',
            aiApiKey: '',
            currency: 'PHP',
            distanceUnit: 'km',
        })

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

        const logout = () => {
            store.methods.logoutUser()
            router.push('/login')
        }

        return { router, form, aiKeySet, loading, saving, saved, saveError, isDark, toggleTheme, save, logout }
    }
}
</script>

<style scoped>
.settings-shell {
    min-height: 100vh;
    background: var(--bg-main);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}
.bg-orb { position: absolute; filter: blur(60px); opacity: 0.18; z-index: 0; border-radius: 50%; pointer-events: none; }
.orb-1 { width: 300px; height: 300px; background: linear-gradient(135deg, #a78bfa, #38bdf8); top: -120px; left: -80px; }
.orb-2 { width: 240px; height: 240px; background: linear-gradient(135deg, #22c55e, #f59e0b); bottom: -80px; right: -60px; }

.settings-nav {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--glass-ghost-bg);
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
    cursor: pointer;
    flex-shrink: 0;
}
.nav-title-block { flex: 1; }
.nav-title { font-size: 19px; font-weight: 700; color: var(--text-primary); margin: 0; }
.nav-sub   { font-size: 12px; color: var(--text-muted); margin: 0; }

.settings-content {
    flex: 1;
    padding: 20px 16px 48px;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.state-box { display: flex; justify-content: center; padding: 60px 0; color: var(--text-muted); }

.settings-section { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
.section-label {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 4px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
}

.settings-card {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.setting-row-header {
    display: flex;
    align-items: center;
    gap: 12px;
}
.setting-row-inline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}
.setting-icon {
    width: 38px; height: 38px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.ai-icon { background: rgba(167,139,250,0.18); color: #a78bfa; }
.setting-info { flex: 1; }
.setting-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0; }
.setting-desc  { font-size: 12px; color: var(--text-muted); margin: 2px 0 0; }

.status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
    flex-shrink: 0;
}
.status-pill.on  { background: rgba(34,197,94,0.12); color: #4ade80; border: 1px solid rgba(34,197,94,0.25); }
.status-pill.off { background: rgba(148,163,184,0.1); color: var(--text-muted); border: 1px solid rgba(148,163,184,0.2); }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.field-group { display: flex; flex-direction: column; gap: 5px; }
.field-label {
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--text-muted);
}
.field-input {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--glass-card-border);
    background: rgba(255,255,255,0.05);
    color: var(--text-primary);
    font-size: 14px;
    width: 100%;
    outline: none;
}
.field-input:focus { border-color: rgba(167,139,250,0.45); }
.field-hint { font-size: 11px; color: var(--text-muted); margin: 2px 0 0; line-height: 1.4; }
.key-set-badge { font-size: 10px; font-weight: 600; color: #4ade80; margin-left: 6px; text-transform: none; letter-spacing: 0; }


.segment-control { display: flex; border-radius: 10px; overflow: hidden; border: 1px solid var(--glass-card-border); width: fit-content; }
.segment-btn {
    padding: 8px 20px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
}
.segment-btn.active { background: rgba(167,139,250,0.2); color: #a78bfa; }

.theme-toggle {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 14px;
    border-radius: 10px;
    border: 1px solid var(--glass-card-border);
    background: var(--glass-ghost-bg);
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
}

.save-error { font-size: 13px; color: #fca5a5; text-align: center; margin: 0; }

.save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 13px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #a78bfa, #38bdf8);
    color: #0b1020;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    margin-top: 8px;
    transition: opacity 0.15s;
}
.save-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.account-section { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
.logout-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 0;
    background: none;
    border: none;
    color: #f87171;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    text-align: left;
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
