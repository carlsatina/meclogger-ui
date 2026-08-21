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
  </header>

  <!-- Mobile Form Content -->
  <div class="m-auth-content">
    
    <!-- Brand Banner -->
    <div class="m-brand-section">
      <div class="m-brand-logo">
        <img src="@/assets/MECLogger.png" alt="MECLogger Logo" />
      </div>
      <h1 class="m-brand-title">Create Account</h1>
      <p class="m-brand-sub">Join MECLogger to track health, auto, finance & ledgers</p>
    </div>

    <!-- Register Form Card -->
    <form class="m-form-card" @submit.prevent="handleRegister">
      <!-- Full Name -->
      <div class="m-field-group">
        <label class="m-field-label">Full Name</label>
        <div class="m-input-box">
          <mdicon name="account-outline" size="18" class="m-input-icon" />
          <input
            type="text"
            class="m-field-input"
            placeholder="John Doe"
            v-model="userInfo.fullName"
            required
          />
        </div>
      </div>

      <!-- Phone -->
      <div class="m-field-group">
        <label class="m-field-label">Contact Phone</label>
        <div class="m-input-box">
          <mdicon name="phone-outline" size="18" class="m-input-icon" />
          <input
            type="tel"
            class="m-field-input"
            placeholder="+1 (555) 000-0000"
            v-model="userInfo.phone"
            required
          />
        </div>
        <p v-if="hasError && errorMsg.phone" class="m-field-error">{{ errorMsg.phone }}</p>
      </div>

      <!-- Email -->
      <div class="m-field-group">
        <label class="m-field-label">Email Address</label>
        <div class="m-input-box">
          <mdicon name="email-outline" size="18" class="m-input-icon" />
          <input
            type="email"
            class="m-field-input"
            :class="{ 'invalid-input': userInfo.email && !isValidEmailFormat }"
            placeholder="name@example.com"
            v-model="userInfo.email"
            required
          />
        </div>
        <p v-if="hasError && errorMsg.email" class="m-field-error">{{ errorMsg.email }}</p>
      </div>

      <!-- Password -->
      <div class="m-field-group">
        <label class="m-field-label">Password</label>
        <div class="m-input-box">
          <mdicon name="lock-outline" size="18" class="m-input-icon" />
          <input
            type="password"
            class="m-field-input"
            placeholder="Create password"
            v-model="userInfo.password"
            required
          />
        </div>
      </div>

      <!-- Confirm Password -->
      <div class="m-field-group">
        <label class="m-field-label">Confirm Password</label>
        <div class="m-input-box">
          <mdicon name="lock-check-outline" size="18" class="m-input-icon" />
          <input
            type="password"
            class="m-field-input"
            placeholder="Re-enter password"
            v-model="userInfo.verifyPassword"
            required
          />
        </div>
        <p v-if="hasError && errorMsg.password" class="m-field-error">{{ errorMsg.password }}</p>
      </div>

      <!-- Hints -->
      <div class="m-hints-box">
        <div class="m-hint-item" :class="{ ok: hasMinimumChar }">
          <mdicon :name="hasMinimumChar ? 'check-circle' : 'circle-outline'" size="13" />
          <span>8 to 20 characters</span>
        </div>
        <div class="m-hint-item" :class="{ ok: isStrongPassword }">
          <mdicon :name="isStrongPassword ? 'check-circle' : 'circle-outline'" size="13" />
          <span>Uppercase, lowercase, numbers & symbols</span>
        </div>
      </div>

      <!-- Submit Button -->
      <button class="m-submit-btn" type="submit" :disabled="submitting">
        <span v-if="!submitting">Create Free Account</span>
        <span v-else class="m-btn-spinner"></span>
      </button>

      <!-- Switch to Sign In -->
      <div class="m-switch-section">
        <span>Already have an account?</span>
        <button type="button" class="m-switch-btn" @click="router.push('/login')">
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

export default {
  name: "RegisterMobile",
  setup() {
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
        errorMsg.value.email = "Invalid email format."
        return
      }

      if (!userInfo.value.phone) {
        hasError.value = true
        errorMsg.value.phone = "Phone number is required."
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
          errorMsg.value.password = response.value.message || 'Registration failed.'
        } else {
          router.push('/login')
        }
      } else {
        hasError.value = true
        errorMsg.value.password = 'Server connection error.'
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
  top: -80px; right: -60px;
  background: linear-gradient(135deg, #06b6d4, #10b981);
}
.orb-2 {
  width: 240px; height: 240px;
  bottom: 40px; left: -60px;
  background: linear-gradient(135deg, #4f46e5, #8b5cf6);
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
  margin-bottom: 20px;
}
.m-brand-logo {
  width: 48px; height: 48px;
  border-radius: 12px;
  overflow: hidden;
  margin: 0 auto 8px;
  border: 1px solid var(--glass-card-border);
}
.m-brand-logo img { width: 100%; height: 100%; object-fit: contain; }
.m-brand-title {
  font-size: 24px;
  font-weight: 900;
  margin: 0 0 4px;
  letter-spacing: -0.4px;
}
.m-brand-sub {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

/* Form Card */
.m-form-card {
  background: var(--glass-card-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 22px;
  padding: 22px 18px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.m-field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.m-field-label {
  font-size: 12px;
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
  padding: 10px 14px 10px 38px;
  border-radius: 12px;
  border: 1px solid var(--glass-card-border);
  background: var(--glass-ghost-bg);
  color: var(--text-primary);
  font-size: 13px;
}
.m-field-input:focus {
  outline: none;
  border-color: #06b6d4;
}
.m-field-input.invalid-input {
  border-color: #ef4444;
}
.m-field-error {
  margin: 2px 0 0;
  font-size: 11px;
  color: #ef4444;
  font-weight: 600;
}

/* Hints Box */
.m-hints-box {
  background: var(--glass-ghost-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 10px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.m-hint-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
}
.m-hint-item.ok {
  color: #22c55e;
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
  font-size: 14px;
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
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}
.m-switch-btn {
  background: none;
  border: none;
  color: #06b6d4;
  font-weight: 800;
  cursor: pointer;
  padding: 0;
}
</style>
