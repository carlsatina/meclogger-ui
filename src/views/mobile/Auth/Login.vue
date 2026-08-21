<template>
<div class="m-auth-page">

  <!-- Ambient Background Orbs -->
  <div class="m-auth-bg" aria-hidden="true">
    <div class="m-orb orb-1"></div>
    <div class="m-orb orb-2"></div>
  </div>

  <!-- Mobile Header Bar -->
  <header class="m-auth-header">
    <button class="m-header-btn" @click="router.push('/landing')">
      <mdicon name="arrow-left" size="18" />
      <span>Overview</span>
    </button>
    <button class="m-header-btn" @click="toggleTheme" :title="isDark ? 'Light mode' : 'Dark mode'">
      <mdicon :name="isDark ? 'white-balance-sunny' : 'moon-waning-crescent'" size="18" />
    </button>
  </header>

  <!-- Mobile Form Content -->
  <div class="m-auth-content">
    
    <!-- Brand Banner -->
    <div class="m-brand-section">
      <div class="m-brand-logo">
        <img src="@/assets/MECLogger.png" alt="MECLogger Logo" />
      </div>
      <h1 class="m-brand-title">MECLogger</h1>
      <p class="m-brand-sub">Welcome back! Sign in to access your records</p>

      <!-- Mini Feature Chips -->
      <div class="m-feature-pills">
        <span class="m-pill medical"><mdicon name="hospital-box-outline" size="12"/> Health</span>
        <span class="m-pill car"><mdicon name="car-wrench" size="12"/> Auto</span>
        <span class="m-pill expense"><mdicon name="cash-multiple" size="12"/> Finance</span>
        <span class="m-pill logbook"><mdicon name="book-open-page-variant-outline" size="12"/> Ledger</span>
      </div>
    </div>

    <!-- Login Form Card -->
    <form class="m-form-card" @submit.prevent="handleLogin">
      <div class="m-field-group">
        <label class="m-field-label">Email Address</label>
        <div class="m-input-box">
          <mdicon name="email-outline" size="18" class="m-input-icon" />
          <input
            type="email"
            class="m-field-input"
            placeholder="Enter your email"
            v-model="email"
            autocomplete="email"
            required
          />
        </div>
      </div>

      <div class="m-field-group">
        <div class="m-label-row">
          <label class="m-field-label">Password</label>
          <button class="m-forgot-btn" type="button" @click="router.push('/forgot-password')">
            Forgot?
          </button>
        </div>
        <div class="m-input-box">
          <mdicon name="lock-outline" size="18" class="m-input-icon" />
          <input
            :type="showPassword ? 'text' : 'password'"
            class="m-field-input"
            placeholder="Enter your password"
            v-model="password"
            autocomplete="current-password"
            required
            @keypress.enter="handleLogin"
          />
          <button type="button" class="m-eye-btn" @click="showPassword = !showPassword">
            <mdicon :name="showPassword ? 'eye-off-outline' : 'eye-outline'" size="18" />
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="hasError" class="m-error-banner">
        <mdicon name="alert-circle" size="16" />
        <span>{{ errorMsg }}</span>
      </div>

      <!-- Submit Button -->
      <button class="m-submit-btn" type="submit" :disabled="loadingModal">
        <span v-if="!loadingModal">Sign In</span>
        <span v-else class="m-btn-spinner"></span>
      </button>

      <!-- Switch to Register -->
      <div class="m-switch-section">
        <span>Don't have an account?</span>
        <button type="button" class="m-switch-btn" @click="router.push('/register')">
          Sign Up
        </button>
      </div>
    </form>

    <p class="m-version-text">Version {{ appVersion }}</p>
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
  name: "LoginMobile",
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
          errorMsg.value = response.value.message || 'Login failed. Check credentials.'
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
        errorMsg.value = 'Network error. Please try again.'
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
/* ── Mobile Container ─────────────────────── */
.m-auth-page {
  position: relative;
  min-height: 100vh;
  background: var(--bg-main);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

/* ── Orbs ─────────────────────────────────── */
.m-auth-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.m-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.22;
}
.orb-1 {
  width: 280px; height: 280px;
  top: -80px; left: -60px;
  background: linear-gradient(135deg, #06b6d4, #4f46e5);
}
.orb-2 {
  width: 240px; height: 240px;
  bottom: 40px; right: -60px;
  background: linear-gradient(135deg, #f97316, #8b5cf6);
}

/* ── Mobile Top Header ────────────────────── */
.m-auth-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top, 0px));
  background: rgba(5, 6, 10, 0.75);
  border-bottom: 1px solid var(--glass-card-border);
  backdrop-filter: blur(14px);
}
.theme-light .m-auth-header {
  background: rgba(238, 242, 255, 0.88);
}
.m-header-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--glass-card-border);
  background: var(--glass-ghost-bg);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

/* ── Mobile Content Body ─────────────────── */
.m-auth-content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 24px 16px 40px;
  max-width: 440px;
  margin: 0 auto;
  width: 100%;
}

/* Brand Banner */
.m-brand-section {
  text-align: center;
  margin-bottom: 24px;
}
.m-brand-logo {
  width: 52px; height: 52px;
  border-radius: 14px;
  overflow: hidden;
  margin: 0 auto 10px;
  border: 1px solid var(--glass-card-border);
}
.m-brand-logo img { width: 100%; height: 100%; object-fit: contain; }
.m-brand-title {
  font-size: 26px;
  font-weight: 900;
  margin: 0 0 4px;
  letter-spacing: -0.4px;
}
.m-brand-sub {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 14px;
}

/* Feature Pills */
.m-feature-pills {
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}
.m-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  border: 1px solid;
}
.m-pill.medical { background: rgba(6, 182, 212, 0.12); color: #06b6d4; border-color: rgba(6, 182, 212, 0.25); }
.m-pill.car { background: rgba(249, 115, 22, 0.12); color: #f97316; border-color: rgba(249, 115, 22, 0.25); }
.m-pill.expense { background: rgba(16, 185, 129, 0.12); color: #10b981; border-color: rgba(16, 185, 129, 0.25); }
.m-pill.logbook { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; border-color: rgba(139, 92, 246, 0.25); }

/* Form Card */
.m-form-card {
  background: var(--glass-card-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 22px;
  padding: 24px 20px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.m-field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.m-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.m-field-label {
  font-size: 13px;
  font-weight: 700;
}
.m-forgot-btn {
  background: none;
  border: none;
  color: #06b6d4;
  font-size: 11px;
  font-weight: 700;
}

.m-input-box {
  position: relative;
  display: flex;
  align-items: center;
}
.m-input-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  pointer-events: none;
}
.m-field-input {
  width: 100%;
  padding: 12px 36px 12px 38px;
  border-radius: 12px;
  border: 1px solid var(--glass-card-border);
  background: var(--glass-ghost-bg);
  color: var(--text-primary);
  font-size: 14px;
}
.m-field-input:focus {
  outline: none;
  border-color: #06b6d4;
}
.m-eye-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: var(--text-muted);
  display: flex;
  padding: 4px;
}

/* Error Banner */
.m-error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  font-size: 12px;
  font-weight: 600;
}

/* Submit Button */
.m-submit-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  color: white;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(6, 182, 212, 0.35);
  margin-top: 4px;
}
.m-submit-btn:disabled { opacity: 0.6; }

.m-btn-spinner {
  display: inline-block;
  width: 18px; height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Switch Section */
.m-switch-section {
  display: flex;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}
.m-switch-btn {
  background: none;
  border: none;
  color: #06b6d4;
  font-weight: 800;
  cursor: pointer;
  padding: 0;
}

.m-version-text {
  text-align: center;
  margin: 20px 0 0;
  font-size: 11px;
  color: var(--text-muted);
}
</style>
