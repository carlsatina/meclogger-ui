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
        Create your free account today and start tracking your medical records, vehicle service history, daily expenses, and ledgers in one secure hub.
      </p>

      <ul class="value-bullets">
        <li>
          <mdicon name="check-circle-outline" size="18" class="val-icon teal" />
          <span>Full access to all 4 color-coded features</span>
        </li>
        <li>
          <mdicon name="check-circle-outline" size="18" class="val-icon orange" />
          <span>Mobile app & desktop web sync</span>
        </li>
        <li>
          <mdicon name="check-circle-outline" size="18" class="val-icon green" />
          <span>Encrypted storage & private audit trails</span>
        </li>
      </ul>

      <div class="brand-footer-note">
        <mdicon name="shield-check-outline" size="18" class="sec-icon" />
        <span>Free Plan &bull; No Credit Card Required</span>
      </div>
    </div>

    <!-- Right Form Panel -->
    <form class="form-side" @submit.prevent="handleRegister">
      <div class="form-header">
        <h2 class="form-title">Create Account</h2>
        <p class="form-sub">Join MECLogger in just a few simple steps</p>
      </div>

      <!-- Full Name -->
      <div class="field-group">
        <label class="field-label">Full Name</label>
        <div class="input-box">
          <mdicon name="account-outline" size="20" class="input-icon" />
          <input
            type="text"
            class="field-input"
            placeholder="John Doe"
            v-model="userInfo.fullName"
            required
          />
        </div>
      </div>

      <!-- Contact Phone & Email Row -->
      <div class="field-row">
        <div class="field-group">
          <label class="field-label">Contact Number</label>
          <div class="input-box">
            <mdicon name="phone-outline" size="20" class="input-icon" />
            <input
              type="tel"
              class="field-input"
              placeholder="+1 (555) 000-0000"
              v-model="userInfo.phone"
              required
            />
          </div>
          <p v-if="hasError && errorMsg.phone" class="field-error">{{ errorMsg.phone }}</p>
        </div>

        <div class="field-group">
          <label class="field-label">Email Address</label>
          <div class="input-box">
            <mdicon name="email-outline" size="20" class="input-icon" />
            <input
              type="email"
              class="field-input"
              :class="{ 'invalid-input': userInfo.email && !isValidEmailFormat }"
              placeholder="name@example.com"
              v-model="userInfo.email"
              required
            />
          </div>
          <p v-if="hasError && errorMsg.email" class="field-error">{{ errorMsg.email }}</p>
        </div>
      </div>

      <!-- Password & Confirm Password Row -->
      <div class="field-row">
        <div class="field-group">
          <label class="field-label">Password</label>
          <div class="input-box">
            <mdicon name="lock-outline" size="20" class="input-icon" />
            <input
              type="password"
              class="field-input"
              placeholder="Create password"
              v-model="userInfo.password"
              required
            />
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">Confirm Password</label>
          <div class="input-box">
            <mdicon name="lock-check-outline" size="20" class="input-icon" />
            <input
              type="password"
              class="field-input"
              placeholder="Re-enter password"
              v-model="userInfo.verifyPassword"
              required
            />
          </div>
          <p v-if="hasError && errorMsg.password" class="field-error">{{ errorMsg.password }}</p>
        </div>
      </div>

      <!-- Password Hints Box -->
      <div class="hints-box">
        <div class="hint-item" :class="{ ok: hasMinimumChar }">
          <mdicon :name="hasMinimumChar ? 'check-circle' : 'circle-outline'" size="14" />
          <span>8 to 20 characters long</span>
        </div>
        <div class="hint-item" :class="{ ok: isStrongPassword }">
          <mdicon :name="isStrongPassword ? 'check-circle' : 'circle-outline'" size="14" />
          <span>Includes uppercase, lowercase, numbers & symbols</span>
        </div>
      </div>

      <!-- Submit Button -->
      <button class="submit-btn" type="submit" :disabled="submitting">
        <span v-if="!submitting">Get Started</span>
        <span v-else class="btn-spinner"></span>
      </button>

      <!-- Switch to Sign In -->
      <div class="switch-row">
        <span>Already registered?</span>
        <button type="button" class="switch-link" @click="router.push('/login')">
          Sign In
        </button>
      </div>
    </form>

  </div>

</div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import register from '@/composables/auth/register'
import store from '@/store'
import { useTheme } from '@/composables/theme'
import appMeta from '../../../../package.json'

export default {
  name: "RegisterWeb",
  setup() {
    const appVersion = appMeta.version || '1.0.0'
    const router = useRouter()
    const { isDark, toggleTheme } = useTheme()
    
    const validated = ref(null)
    const submitting = ref(false)
    const userInfo = ref({
      fullName: '',
      phone: '',
      email: '',
      password: '',
      verifyPassword: ''
    })
    const errorMsg = ref({ email: '', password: '', phone: '' })
    const hasError = ref(false)

    const handleRegister = async () => {
      hasError.value = false
      errorMsg.value.email = ''
      errorMsg.value.password = ''
      errorMsg.value.phone = ''

      if (!validated.value) {
        hasError.value = true
        errorMsg.value.email = "Please enter a valid email address format."
        return
      }

      if (!userInfo.value.phone) {
        hasError.value = true
        errorMsg.value.phone = "Contact phone number is required."
        return
      }

      if (userInfo.value.password !== userInfo.value.verifyPassword) {
        hasError.value = true
        errorMsg.value.password = "Passwords do not match."
        return
      }

      submitting.value = true
      const payload = {
        fullName: userInfo.value.fullName.trim(),
        phone: userInfo.value.phone.trim(),
        email: userInfo.value.email.trim(),
        password: userInfo.value.password,
        verifyPassword: userInfo.value.verifyPassword
      }

      const { response, error } = await register(payload)
      submitting.value = false

      if (error.value === null) {
        if (response.value.status > 201) {
          hasError.value = true
          errorMsg.value.password = response.value.message || 'Registration failed. Please try again.'
        } else {
          router.push('/login')
        }
      } else {
        hasError.value = true
        errorMsg.value.password = 'Server connection error. Please try again.'
      }
    }

    const isStrongPassword = computed(() => store.methods.isStrongPassword(userInfo.value.password))
    const hasMinimumChar = computed(() => store.methods.hasMinimumChar(userInfo.value.password))
    const isValidEmailFormat = computed(() => {
      validated.value = store.methods.isValidEmailFormat(userInfo.value.email)
      return validated.value
    })

    return {
      router,
      userInfo,
      handleRegister,
      isStrongPassword,
      hasMinimumChar,
      isValidEmailFormat,
      errorMsg,
      hasError,
      submitting,
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
  width: 550px; height: 550px;
  top: -180px; right: -100px;
  background: radial-gradient(circle, #06b6d4, #4f46e5);
}
.orb-2 {
  width: 450px; height: 450px;
  bottom: -120px; left: -100px;
  background: radial-gradient(circle, #10b981, #8b5cf6);
}
.orb-3 {
  width: 350px; height: 350px;
  top: 30%; left: 10%;
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
  max-width: 1020px;
  background: var(--glass-card-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  overflow: hidden;
  backdrop-filter: blur(16px);
}

/* ── Left Brand Side ──────────────────────── */
.brand-side {
  padding: 40px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(79, 70, 229, 0.15));
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

.value-bullets {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.value-bullets li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.val-icon.teal { color: #06b6d4; }
.val-icon.orange { color: #f97316; }
.val-icon.green { color: #10b981; }

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
  gap: 16px;
}
.form-header {
  margin-bottom: 2px;
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

/* Fields & Grid */
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

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
  padding: 10px 14px 10px 42px;
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
.field-input.invalid-input {
  border-color: #ef4444;
}
.field-input::placeholder { color: var(--text-muted); }

.field-error {
  margin: 2px 0 0;
  font-size: 11px;
  color: #ef4444;
  font-weight: 600;
}

/* Hints Box */
.hints-box {
  background: var(--glass-ghost-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.hint-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
}
.hint-item.ok {
  color: #22c55e;
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
  margin-top: 4px;
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
@media (max-width: 880px) {
  .auth-card { grid-template-columns: 1fr; }
  .brand-side { display: none; }
  .field-row { grid-template-columns: 1fr; }
  .form-side { padding: 32px 24px; }
  .auth-topbar { left: 16px; right: 16px; }
}
</style>
