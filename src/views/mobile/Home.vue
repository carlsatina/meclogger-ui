<template>
<div class="hm-shell">

  <!-- Sticky Mobile Header -->
  <header class="hm-header">
    <div class="hm-header-brand" @click="navigateTo('/')">
      <div class="hm-header-logo">
        <img src="@/assets/MECLogger.png" alt="MECLogger Logo"/>
      </div>
      <span class="hm-header-app-name">MECLogger</span>
    </div>

    <div class="hm-header-actions">
      <button class="hm-icon-btn" @click="navigateTo('/landing')" title="Landing Overview">
        <mdicon name="earth" size="18"/>
      </button>
      <button class="hm-icon-btn" @click="navigateTo('/settings')" title="Settings">
        <mdicon name="cog-outline" size="18"/>
      </button>
      <button class="hm-icon-btn hm-icon-logout" @click="logout" title="Logout">
        <mdicon name="logout" size="18"/>
      </button>
    </div>
  </header>

  <!-- Mobile Body Content -->
  <div class="hm-content">

    <!-- Profile Greeting Card -->
    <div class="hm-profile-card">
      <div class="hm-profile-inner">
        <div class="hm-avatar">{{ userInitials }}</div>
        <div class="hm-profile-text">
          <p class="hm-greeting">{{ greeting }}</p>
          <h2 class="hm-profile-name">{{ userName }}</h2>
          <p class="hm-profile-date">{{ currentDay }}, {{ currentDate }}</p>
        </div>
      </div>
    </div>

    <!-- Quick Action Shortcut Buttons -->
    <div class="hm-shortcuts-section">
      <span class="hm-label">Quick Actions</span>
      <div class="hm-shortcuts-scroll">
        <button class="hm-shortcut-pill medical" @click="navigateTo('/medical-records/add-record')">
          <mdicon name="plus-circle-outline" size="15"/>
          <span>Add Vital</span>
        </button>
        <button class="hm-shortcut-pill car" @click="navigateTo('/car-maintenance/maintenance/add')">
          <mdicon name="wrench-clock" size="15"/>
          <span>Log Service</span>
        </button>
        <button class="hm-shortcut-pill expense" @click="navigateTo('/expense-tracking')">
          <mdicon name="cash-plus" size="15"/>
          <span>Expense</span>
        </button>
        <button v-if="canAccessLogbook" class="hm-shortcut-pill logbook" @click="navigateTo('/logbook/payment')">
          <mdicon name="book-plus-outline" size="15"/>
          <span>Payment</span>
        </button>
      </div>
    </div>

    <!-- Section Label -->
    <div class="hm-section-label">
      <span>Modules</span>
    </div>

    <!-- Module List Cards -->
    <div class="hm-modules">

      <!-- Medical Records -->
      <div class="hm-module-card medical" @click="navigateTo('/medical-records')">
        <div class="hm-module-stripe medical"></div>
        <div class="hm-module-icon medical">
          <mdicon name="hospital-box-outline" size="24"/>
        </div>
        <div class="hm-module-body">
          <div class="hm-module-header">
            <h3 class="hm-module-title">Medical Records</h3>
            <span class="hm-pill medical">Health</span>
          </div>
          <p class="hm-module-desc">Vitals, medications, lab results &amp; insights</p>
        </div>
        <div class="hm-module-arrow">
          <mdicon name="chevron-right" size="20"/>
        </div>
      </div>

      <!-- Car Maintenance -->
      <div class="hm-module-card car" @click="navigateTo('/car-maintenance')">
        <div class="hm-module-stripe car"></div>
        <div class="hm-module-icon car">
          <mdicon name="car-wrench" size="24"/>
        </div>
        <div class="hm-module-body">
          <div class="hm-module-header">
            <h3 class="hm-module-title">Car Maintenance</h3>
            <span class="hm-pill car">Auto</span>
          </div>
          <p class="hm-module-desc">Service history, reminders &amp; odometer logs</p>
        </div>
        <div class="hm-module-arrow">
          <mdicon name="chevron-right" size="20"/>
        </div>
      </div>

      <!-- Expense Tracking -->
      <div class="hm-module-card expense" @click="navigateTo('/expense-tracking')">
        <div class="hm-module-stripe expense"></div>
        <div class="hm-module-icon expense">
          <mdicon name="cash-multiple" size="24"/>
        </div>
        <div class="hm-module-body">
          <div class="hm-module-header">
            <h3 class="hm-module-title">Expense Tracking</h3>
            <span class="hm-pill expense">Finance</span>
          </div>
          <p class="hm-module-desc">Category budgets, daily spending &amp; analytics</p>
        </div>
        <div class="hm-module-arrow">
          <mdicon name="chevron-right" size="20"/>
        </div>
      </div>

      <!-- Logbook (Conditional) -->
      <div v-if="canAccessLogbook" class="hm-module-card logbook" @click="navigateTo('/logbook/payment')">
        <div class="hm-module-stripe logbook"></div>
        <div class="hm-module-icon logbook">
          <mdicon name="book-open-page-variant-outline" size="24"/>
        </div>
        <div class="hm-module-body">
          <div class="hm-module-header">
            <h3 class="hm-module-title">Logbook</h3>
            <span class="hm-pill logbook">Ledger</span>
          </div>
          <p class="hm-module-desc">Renter payments, savings goals &amp; reports</p>
        </div>
        <div class="hm-module-arrow">
          <mdicon name="chevron-right" size="20"/>
        </div>
      </div>

      <!-- Admin Users (Conditional) -->
      <div v-if="isAdmin" class="hm-module-card admin" @click="navigateTo('/admin/users')">
        <div class="hm-module-stripe admin"></div>
        <div class="hm-module-icon admin">
          <mdicon name="shield-account-outline" size="24"/>
        </div>
        <div class="hm-module-body">
          <div class="hm-module-header">
            <h3 class="hm-module-title">User Approvals</h3>
            <span class="hm-pill admin">Admin</span>
          </div>
          <p class="hm-module-desc">Pending registrations &amp; role security</p>
        </div>
        <div class="hm-module-arrow">
          <mdicon name="chevron-right" size="20"/>
        </div>
      </div>

    </div>

    <!-- App Version -->
    <p class="hm-version">Version {{ appVersion }}</p>
  </div>

</div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import store from '@/store'
import getProfile from '@/composables/getProfile'
import { Role } from '@/constants/enums'
import { useTheme } from '@/composables/theme'
import appMeta from '../../../package.json'

export default {
  name: "HomeMobile",
  setup() {
    const router = useRouter()
    const { isDark, toggleTheme } = useTheme()
    const appVersion = appMeta.version || '1.0.0'

    const navigateTo = (path) => {
      router.push(path)
    }

    const logout = () => {
      store.methods.logoutUser()
      router.push('/login')
    }

    const ensureProfile = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        logout()
        return
      }
      store.methods.loginUser(token)
      if (!store.state.userProfile) {
        const { response, error } = await getProfile(token)
        if (error.value === null && response.value?.userInfo) {
          const profile = response.value.userInfo
          store.methods.setUserAdmin(profile.role === Role.ADMIN)
          store.methods.setUserProfile(profile)
          if (profile.role === Role.GUEST) {
            router.push('/pending-approval')
          }
        } else {
          logout()
        }
      }
    }

    onMounted(() => {
      ensureProfile()
    })

    const userName = computed(() => store.state.userProfile?.fullName || 'User')
    const isAdmin = computed(() => store.state.userProfile?.role === Role.ADMIN || store.state.isUserAdmin)
    const canAccessLogbook = computed(() => {
      const role = store.state.userProfile?.role
      return role === Role.ADMIN || role === Role.FAMILY
    })

    const userInitials = computed(() => {
      const name = store.state.userProfile?.fullName || ''
      return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U'
    })

    const greeting = computed(() => {
      const h = new Date().getHours()
      if (h < 12) return 'Good Morning'
      if (h < 17) return 'Good Afternoon'
      return 'Good Evening'
    })

    const currentDay = computed(() =>
      new Date().toLocaleDateString('en-US', { weekday: 'long' })
    )

    const currentDate = computed(() =>
      new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    )

    return {
      navigateTo,
      logout,
      userName,
      userInitials,
      greeting,
      currentDay,
      currentDate,
      isAdmin,
      canAccessLogbook,
      isDark,
      appVersion,
      toggleTheme,
    }
  }
}
</script>

<style scoped>
/* ── Mobile Container ─────────────────────── */
.hm-shell {
  position: relative;
  min-height: 100vh;
  background: var(--bg-main);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

/* ── Mobile Header Bar ────────────────────── */
.hm-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top, 0px));
  background: rgba(5, 6, 10, 0.85);
  border-bottom: 1px solid var(--glass-card-border);
  backdrop-filter: blur(14px);
}
.theme-light .hm-header {
  background: rgba(238, 242, 255, 0.88);
}
.hm-header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hm-header-logo {
  width: 30px; height: 30px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--glass-card-border);
}
.hm-header-logo img { width: 100%; height: 100%; object-fit: contain; }
.hm-header-app-name {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.3px;
}

.hm-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hm-icon-btn {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--glass-ghost-bg);
  border: 1px solid var(--glass-card-border);
  color: var(--text-secondary);
  cursor: pointer;
}
.hm-icon-btn:active { color: var(--text-primary); }
.hm-icon-logout { color: #ef4444; }

/* ── Content Body ─────────────────────────── */
.hm-content {
  flex: 1;
  padding: 16px 14px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Profile Greeting Card */
.hm-profile-card {
  background: var(--glass-card-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 18px;
  padding: 16px;
  box-shadow: var(--glass-card-shadow);
}
.hm-profile-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}
.hm-avatar {
  width: 48px; height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  color: white;
  display: grid;
  place-items: center;
  font-size: 16px;
  font-weight: 800;
  flex-shrink: 0;
}
.hm-profile-text {
  flex: 1;
  min-width: 0;
}
.hm-greeting {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #06b6d4;
  margin: 0;
}
.hm-profile-name {
  font-size: 18px;
  font-weight: 800;
  margin: 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hm-profile-date {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
}

/* Quick Action Shortcuts */
.hm-shortcuts-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hm-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}
.hm-shortcuts-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}
.hm-shortcut-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}
.hm-shortcut-pill.medical { background: rgba(6, 182, 212, 0.12); color: #06b6d4; border-color: rgba(6, 182, 212, 0.25); }
.hm-shortcut-pill.car { background: rgba(249, 115, 22, 0.12); color: #f97316; border-color: rgba(249, 115, 22, 0.25); }
.hm-shortcut-pill.expense { background: rgba(16, 185, 129, 0.12); color: #10b981; border-color: rgba(16, 185, 129, 0.25); }
.hm-shortcut-pill.logbook { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; border-color: rgba(139, 92, 246, 0.25); }

/* Section Label */
.hm-section-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Modules List */
.hm-modules {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hm-module-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--glass-card-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 16px;
  padding: 14px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--glass-card-shadow);
}
.hm-module-card:active {
  transform: scale(0.985);
}

.hm-module-stripe {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
}
.hm-module-stripe.medical { background: #06b6d4; }
.hm-module-stripe.car { background: #f97316; }
.hm-module-stripe.expense { background: #10b981; }
.hm-module-stripe.logbook { background: #8b5cf6; }
.hm-module-stripe.admin { background: #f59e0b; }

.hm-module-icon {
  width: 42px; height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  margin-left: 4px;
}
.hm-module-icon.medical { background: rgba(6, 182, 212, 0.14); color: #06b6d4; }
.hm-module-icon.car { background: rgba(249, 115, 22, 0.14); color: #f97316; }
.hm-module-icon.expense { background: rgba(16, 185, 129, 0.14); color: #10b981; }
.hm-module-icon.logbook { background: rgba(139, 92, 246, 0.14); color: #8b5cf6; }
.hm-module-icon.admin { background: rgba(245, 158, 11, 0.14); color: #f59e0b; }

.hm-module-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.hm-module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.hm-module-title {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.2px;
}

.hm-pill {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid;
  text-transform: uppercase;
}
.hm-pill.medical { background: rgba(6, 182, 212, 0.12); color: #06b6d4; border-color: rgba(6, 182, 212, 0.25); }
.hm-pill.car { background: rgba(249, 115, 22, 0.12); color: #f97316; border-color: rgba(249, 115, 22, 0.25); }
.hm-pill.expense { background: rgba(16, 185, 129, 0.12); color: #10b981; border-color: rgba(16, 185, 129, 0.25); }
.hm-pill.logbook { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; border-color: rgba(139, 92, 246, 0.25); }
.hm-pill.admin { background: rgba(245, 158, 11, 0.12); color: #f59e0b; border-color: rgba(245, 158, 11, 0.25); }

.hm-module-desc {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hm-module-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
}

.hm-version {
  text-align: center;
  margin: 24px 0 0;
  font-size: 11px;
  color: var(--text-muted);
}
</style>
