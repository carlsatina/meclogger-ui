<template>
<div class="auth-page">

  <!-- Ambient Background Orbs -->
  <div class="auth-bg" aria-hidden="true">
    <div class="auth-orb orb-1"></div>
    <div class="auth-orb orb-2"></div>
    <div class="auth-orb orb-3"></div>
  </div>

  <!-- Top Bar -->
  <div class="auth-topbar">
    <button class="topbar-btn" @click="router.push('/landing')">
      <mdicon name="arrow-left" size="18" />
      <span>Back to Landing Overview</span>
    </button>
    <button class="topbar-btn theme-toggle" @click="toggleTheme" :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
      <mdicon :name="isDark ? 'white-balance-sunny' : 'moon-waning-crescent'" size="18" />
      <span>{{ isDark ? 'Light' : 'Dark' }}</span>
    </button>
  </div>

  <!-- Auth Card Container -->
  <div class="auth-card">
    
    <!-- Left Brand Panel -->
    <div class="brand-side">
      <div class="brand-header">
        <div class="brand-logo-wrap">
          <img src="@/assets/MECLogger.png" alt="MECLogger Logo" />
        </div>
        <div>
          <h1 class="brand-title">MECLogger</h1>
          <span class="brand-version">v{{ appVersion }}</span>
        </div>
      </div>

      <p class="brand-tagline">
        Your unified, color-coded records hub for health, vehicle maintenance, finances, and ledgers.
      </p>

      <!-- Feature Color Badges -->
      <div class="feature-chips">
        <div class="f-chip medical">
          <mdicon name="hospital-box-outline" size="16" />
          <span>Medical Records</span>
        </div>
        <div class="f-chip car">
          <mdicon name="car-wrench" size="16" />
          <span>Car Maintenance</span>
        </div>
        <div class="f-chip expense">
          <mdicon name="cash-multiple" size="16" />
          <span>Expense Tracking</span>
        </div>
        <div class="f-chip logbook">
          <mdicon name="book-open-page-variant-outline" size="16" />
          <span>Logbook Ledger</span>
        </div>
      </div>

      <div class="brand-footer-note">
        <mdicon name="shield-check-outline" size="18" class="sec-icon" />
        <span>JWT Secured &bull; Multi-Tier Storage &bull; Dual-UI Experience</span>
      </div>
    </div>

    <!-- Right Form Panel -->
    <form class="form-side" @submit.prevent="handleLogin">
      <div class="form-header">
        <h2 class="form-title">Sign In</h2>
        <p class="form-sub">Enter your credentials to access your account</p>
      </div>

      <!-- Email Field -->
      <div class="field-group">
        <label class="field-label">Email Address</label>
        <div class="input-box">
          <mdicon name="email-outline" size="20" class="input-icon" />
          <input
            type="email"
            class="field-input"
            placeholder="name@example.com"
            v-model="email"
            autocomplete="email"
            required
          />
        </div>
      </div>

      <!-- Password Field -->
      <div class="field-group">
        <div class="field-label-row">
          <label class="field-label">Password</label>
          <button class="forgot-link" type="button" @click="router.push('/forgot-password')">
            Forgot password?
          </button>
        </div>
        <div class="input-box">
          <mdicon name="lock-outline" size="20" class="input-icon" />
          <input
            :type="showPassword ? 'text' : 'password'"
            class="field-input"
            placeholder="Enter password"
            v-model="password"
            autocomplete="current-password"
            required
            @keypress.enter="handleLogin"
          />
          <button type="button" class="eye-toggle" @click="showPassword = !showPassword" tabIndex="-1">
            <mdicon :name="showPassword ? 'eye-off-outline' : 'eye-outline'" size="20" />
          </button>
        </div>
      </div>

      <!-- Error Message Banner -->
      <div v-if="hasError" class="error-banner">
        <mdicon name="alert-circle" size="18" />
        <span>{{ errorMsg }}</span>
      </div>

      <!-- Submit Button -->
      <button class="submit-btn" type="submit" :disabled="loadingModal">
        <span v-if="!loadingModal">Sign In</span>
        <span v-else class="btn-spinner"></span>
      </button>

      <!-- Sign Up Switch -->
      <div class="switch-row">
        <span>Don't have an account yet?</span>
        <button type="button" class="switch-link" @click="router.push('/register')">
          Create Account
        </button>
      </div>
    </form>

  </div>

  <Loading v-if="loadingModal" />
</div>
</template>

<script>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import login from '@/composables/auth/login'
import store from '@/store'
import getProfile from '@/composables/getProfile'
import Loading from '@/components/Loading.vue'
import { Role } from '@/constants/enums'
import { useTheme } from '@/composables/theme'
import appMeta from '../../../../package.json'

export default {
  name: "LoginWeb",
  components: {
    Loading,
  },
  setup() {
    const appVersion = appMeta.version || '1.0.0'
    const router = useRouter()
    const route = useRoute()
    const { isDark, toggleTheme } = useTheme()
    
    const email = ref('')
    const password = ref('')
    const showPassword = ref(false)
    const hasError = ref(false)
    const errorMsg = ref('')
    const loadingModal = ref(false)

    const handleLogin = async () => {
      hasError.value = false
      if (!email.value || !password.value) return
      
      loadingModal.value = true
      const { response, error } = await login(email.value, password.value)
      loadingModal.value = false

      if (error.value === null) {
        if (response.value.status > 201) {
          hasError.value = true
          errorMsg.value = response.value.message || 'Login failed. Please check your credentials.'
        } else {
          store.methods.loginUser(response.value.token)
          const profileData = await getProfile(response.value.token)
          if (profileData.error.value === null) {
            const profile = profileData.response.value.userInfo
            store.methods.setUserAdmin(profile.role === Role.ADMIN)
            store.methods.setUserProfile(profile)
          }
          const redirectTarget = route.query.redirect
          if (typeof redirectTarget === 'string' && redirectTarget.length) {
            router.replace(redirectTarget)
          } else {
            router.push('/')
          }
        }
      } else {
        hasError.value = true
        errorMsg.value = 'Network error during login. Please try again.'
      }
    }

    return {
      router,
      route,
      email,
      password,
      showPassword,
      handleLogin,
      hasError,
      errorMsg,
      loadingModal,
      appVersion,
      isDark,
      toggleTheme
    }
  }
}
</script>

<style scoped>
/* ── Page Shell ───────────────────────────── */
.auth-page {
  min-height: 100vh;
  background: var(--bg-main);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px 40px;
  position: relative;
  overflow: hidden;
}

/* ── Ambient Orbs ─────────────────────────── */
.auth-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.auth-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.18;
}
.orb-1 {
  width: 500px; height: 500px;
  top: -150px; left: -100px;
  background: radial-gradient(circle, #4f46e5, #06b6d4);
}
.orb-2 {
  width: 450px; height: 450px;
  bottom: -100px; right: -100px;
  background: radial-gradient(circle, #8b5cf6, #10b981);
}
.orb-3 {
  width: 350px; height: 350px;
  top: 40%; left: 60%;
  background: radial-gradient(circle, #f97316, transparent 70%);
}

/* ── Topbar Navigation ────────────────────── */
.auth-topbar {
  position: absolute;
  top: 24px;
  left: 28px; right: 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}
.topbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid var(--glass-card-border);
  background: var(--glass-ghost-bg);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.2s;
}
.topbar-btn:hover {
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* ── Split Auth Card ──────────────────────── */
.auth-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 960px;
  background: var(--glass-card-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
  backdrop-filter: blur(16px);
}

/* ── Left Brand Side ──────────────────────── */
.brand-side {
  padding: 40px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(6, 182, 212, 0.15));
  border-right: 1px solid var(--glass-card-border);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
}
.brand-header {
  display: flex;
  align-items: center;
  gap: 14px;
}
.brand-logo-wrap {
  width: 46px; height: 46px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--glass-card-border);
}
.brand-logo-wrap img { width: 100%; height: 100%; object-fit: contain; }
.brand-title {
  font-size: 24px;
  font-weight: 900;
  margin: 0;
  letter-spacing: -0.4px;
}
.brand-version {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
}
.brand-tagline {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* Feature Chips */
.feature-chips {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.f-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid;
}
.f-chip.medical { background: rgba(6, 182, 212, 0.12); color: #06b6d4; border-color: rgba(6, 182, 212, 0.25); }
.f-chip.car { background: rgba(249, 115, 22, 0.12); color: #f97316; border-color: rgba(249, 115, 22, 0.25); }
.f-chip.expense { background: rgba(16, 185, 129, 0.12); color: #10b981; border-color: rgba(16, 185, 129, 0.25); }
.f-chip.logbook { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; border-color: rgba(139, 92, 246, 0.25); }

.brand-footer-note {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}
.sec-icon { color: #22c55e; }

/* ── Right Form Side ──────────────────────── */
.form-side {
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form-header {
  margin-bottom: 4px;
}
.form-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
}
.form-sub {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 4px 0 0;
}

/* Fields */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.field-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}
.forgot-link {
  background: none;
  border: none;
  color: #06b6d4;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
.forgot-link:hover { text-decoration: underline; }

.input-box {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
  pointer-events: none;
}
.field-input {
  width: 100%;
  padding: 12px 42px 12px 44px;
  border-radius: 12px;
  border: 1px solid var(--glass-card-border);
  background: var(--glass-ghost-bg);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s ease;
}
.field-input:focus {
  outline: none;
  border-color: #06b6d4;
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2);
}
.field-input::placeholder { color: var(--text-muted); }

.eye-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
}
.eye-toggle:hover { color: var(--text-primary); }

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
}

/* Submit Button */
.submit-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  color: white;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(6, 182, 212, 0.35);
  transition: all 0.2s ease;
  margin-top: 6px;
}
.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(6, 182, 212, 0.45);
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  display: inline-block;
  width: 20px; height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Switch Row */
.switch-row {
  display: flex;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 10px;
}
.switch-link {
  background: none;
  border: none;
  color: #06b6d4;
  font-weight: 800;
  cursor: pointer;
  padding: 0;
}
.switch-link:hover { text-decoration: underline; }

/* ── Responsive ───────────────────────────── */
@media (max-width: 840px) {
  .auth-card { grid-template-columns: 1fr; }
  .brand-side { display: none; }
  .form-side { padding: 32px 24px; }
  .auth-topbar { left: 16px; right: 16px; }
}
</style>
