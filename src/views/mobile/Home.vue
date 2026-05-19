<template>
<div class="hm-shell">

  <!-- Background orbs -->
  <div class="hm-bg" aria-hidden="true">
    <div class="hm-orb hm-orb-1"></div>
    <div class="hm-orb hm-orb-2"></div>
  </div>

  <!-- Sticky Header -->
  <header class="hm-header">
    <div class="hm-header-brand">
      <div class="hm-header-logo">
        <img src="@/assets/MECLogger.png" alt="MECLogger"/>
      </div>
      <span class="hm-header-app-name">MECLogger</span>
    </div>
    <div class="hm-header-actions">
      <button class="hm-icon-btn" @click="toggleTheme" :title="isDark ? 'Light mode' : 'Dark mode'">
        <mdicon :name="isDark ? 'white-balance-sunny' : 'moon-waning-crescent'" size="20"/>
      </button>
      <button class="hm-icon-btn" @click="navigateTo('/settings')" title="Settings">
        <mdicon name="cog-outline" size="20"/>
      </button>
      <button class="hm-icon-btn hm-icon-logout" @click="logout" title="Logout">
        <mdicon name="logout" size="20"/>
      </button>
    </div>
  </header>

  <!-- Profile Card -->
  <div class="hm-profile-card">
    <div class="hm-profile-inner">
      <div class="hm-avatar-wrap">
        <div class="hm-avatar">{{ userInitials }}</div>
      </div>
      <div class="hm-profile-text">
        <p class="hm-greeting">{{ greeting }}</p>
        <h2 class="hm-profile-name">{{ userName }}</h2>
        <p class="hm-profile-date">{{ currentDay }}, {{ currentDate }}</p>
      </div>
    </div>
  </div>

  <!-- Section Label -->
  <div class="hm-section-label">
    <span>Modules</span>
  </div>

  <!-- Module List -->
  <div class="hm-modules">

    <!-- Medical Records -->
    <div class="hm-module-card hm-medical" @click="navigateTo('/medical-records')">
      <div class="hm-module-stripe hm-stripe-medical"></div>
      <div class="hm-module-icon hm-micon-medical">
        <mdicon name="hospital-box-outline" size="26"/>
      </div>
      <div class="hm-module-body">
        <h3 class="hm-module-title">Medical Records</h3>
        <p class="hm-module-desc">Vitals, medications, lab results &amp; health insights</p>
      </div>
      <div class="hm-module-arrow">
        <mdicon name="chevron-right" size="20"/>
      </div>
    </div>

    <!-- Car Maintenance -->
    <div class="hm-module-card hm-vehicle" @click="navigateTo('/car-maintenance')">
      <div class="hm-module-stripe hm-stripe-vehicle"></div>
      <div class="hm-module-icon hm-micon-vehicle">
        <mdicon name="car-wrench" size="26"/>
      </div>
      <div class="hm-module-body">
        <h3 class="hm-module-title">Car Maintenance</h3>
        <p class="hm-module-desc">Service history, reminders &amp; cost tracking</p>
      </div>
      <div class="hm-module-arrow">
        <mdicon name="chevron-right" size="20"/>
      </div>
    </div>

    <!-- Expense Tracking -->
    <div class="hm-module-card hm-expense" @click="navigateTo('/expense-tracking')">
      <div class="hm-module-stripe hm-stripe-expense"></div>
      <div class="hm-module-icon hm-micon-expense">
        <mdicon name="cash-multiple" size="26"/>
      </div>
      <div class="hm-module-body">
        <h3 class="hm-module-title">Expense Tracking</h3>
        <p class="hm-module-desc">Budgets, spending insights &amp; subscriptions</p>
      </div>
      <div class="hm-module-arrow">
        <mdicon name="chevron-right" size="20"/>
      </div>
    </div>

    <!-- Logbook (conditional) -->
    <div v-if="canAccessLogbook" class="hm-module-card hm-logbook" @click="navigateTo('/logbook/payment')">
      <div class="hm-module-stripe hm-stripe-logbook"></div>
      <div class="hm-module-icon hm-micon-logbook">
        <mdicon name="book-open-page-variant-outline" size="26"/>
      </div>
      <div class="hm-module-body">
        <h3 class="hm-module-title">Logbook</h3>
        <p class="hm-module-desc">Payments, savings, renters &amp; reports</p>
      </div>
      <div class="hm-module-arrow">
        <mdicon name="chevron-right" size="20"/>
      </div>
    </div>

    <!-- Admin (conditional) -->
    <div v-if="isAdmin" class="hm-module-card hm-admin" @click="navigateTo('/admin/users')">
      <div class="hm-module-stripe hm-stripe-admin"></div>
      <div class="hm-module-icon hm-micon-admin">
        <mdicon name="shield-account-outline" size="26"/>
      </div>
      <div class="hm-module-body">
        <h3 class="hm-module-title">User Approvals</h3>
        <p class="hm-module-desc">Manage registrations &amp; user roles</p>
      </div>
      <div class="hm-module-arrow">
        <mdicon name="chevron-right" size="20"/>
      </div>
    </div>

  </div>

</div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '@/components/Modal.vue'
import Loading from '@/components/Loading.vue'
import store from '@/store'
import Datepicker from 'vuejs3-datepicker'
import getProfile from '@/composables/getProfile'
import { Role } from '@/constants/enums'
import { useTheme } from '@/composables/theme'
import appMeta from '../../../package.json'
import { useCarMaintenance } from '@/composables/carMaintenance'

export default {
    name: "HomeMobile",
    components: {
        Modal,
        Loading,
        Datepicker
    },
    setup() {
        const router = useRouter()
        const { isDark, toggleTheme } = useTheme()
        const appVersion = appMeta.version || '1.0.0'
        const { getPreferences, savePreferences } = useCarMaintenance()

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

        const loadAiSettings = async () => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                const prefs = await getPreferences(token)
            } catch (e) { /* ignore */ }
        }

        onMounted(() => {
            ensureProfile()
            loadAiSettings()
        })

        const userName = computed(() => store.state.userProfile?.fullName || 'there')
        const isAdmin = computed(() => store.state.userProfile?.role === Role.ADMIN || store.state.isUserAdmin)
        const canAccessLogbook = computed(() => {
            const role = store.state.userProfile?.role
            return role === Role.ADMIN || role === Role.FAMILY
        })

        const userInitials = computed(() => {
            const name = store.state.userProfile?.fullName || ''
            return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'
        })

        const greeting = computed(() => {
            const h = new Date().getHours()
            if (h < 12) return 'Good morning'
            if (h < 17) return 'Good afternoon'
            return 'Good evening'
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

/* ── Shell ───────────────────────────────── */
.hm-shell {
  position: relative;
  min-height: 100vh;
  padding-bottom: 88px;
  background: var(--home-bg-mobile);
  color: var(--text-primary);
  overflow: hidden;
}

/* ── Background orbs ─────────────────────── */
.hm-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.hm-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.28;
}
.hm-orb-1 {
  width: 320px; height: 320px;
  top: -120px; left: -80px;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
}
.hm-orb-2 {
  width: 260px; height: 260px;
  bottom: 120px; right: -80px;
  background: linear-gradient(135deg, #22c55e, #8b5cf6);
}
.theme-light .hm-orb { opacity: 0.22; }

/* ── Header ──────────────────────────────── */
.hm-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top, 0px));
  background: rgba(5, 6, 10, 0.78);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.theme-light .hm-header {
  background: rgba(238, 242, 255, 0.88);
  border-bottom-color: rgba(79, 70, 229, 0.1);
}
.hm-header-brand {
  display: flex;
  align-items: center;
  gap: 9px;
}
.hm-header-logo {
  width: 30px; height: 30px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.hm-header-logo img { width: 100%; height: 100%; object-fit: contain; }
.hm-header-app-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}
.hm-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.hm-icon-btn {
  width: 38px; height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.theme-light .hm-icon-btn {
  background: rgba(79, 70, 229, 0.06);
  border-color: rgba(79, 70, 229, 0.12);
}
.hm-icon-btn:active { background: rgba(255, 255, 255, 0.12); color: var(--text-primary); }
.theme-light .hm-icon-btn:active { background: rgba(79, 70, 229, 0.14); }
.hm-icon-logout { color: #fca5a5; }
.theme-light .hm-icon-logout { color: #dc2626; }

/* ── Profile Card ────────────────────────── */
.hm-profile-card {
  position: relative;
  z-index: 1;
  margin: 16px 14px 8px;
  background: var(--glass-card-bg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 18px 18px;
  overflow: hidden;
}
.hm-profile-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, #4f46e5, #06b6d4, #22c55e);
}
.theme-light .hm-profile-card { border-color: rgba(79, 70, 229, 0.12); }
.hm-profile-inner {
  display: flex;
  align-items: center;
  gap: 14px;
}
.hm-avatar-wrap { flex-shrink: 0; }
.hm-avatar {
  width: 52px; height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 800;
  color: white;
  letter-spacing: -0.5px;
}
.hm-profile-text { flex: 1; min-width: 0; }
.hm-greeting {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0 0 2px;
}
.hm-profile-name {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.4px;
  margin: 0 0 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hm-profile-date {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

/* ── Section label ───────────────────────── */
.hm-section-label {
  position: relative;
  z-index: 1;
  padding: 16px 18px 8px;
}
.hm-section-label span {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

/* ── Module List ─────────────────────────── */
.hm-modules {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 14px;
}

/* ── Module Card ─────────────────────────── */
.hm-module-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--glass-card-bg);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 18px;
  padding: 14px 14px 14px 0;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: background 0.18s, transform 0.18s;
}
.theme-light .hm-module-card { border-color: rgba(79, 70, 229, 0.1); }
.hm-module-card:active { transform: scale(0.985); }

/* Left colored stripe */
.hm-module-stripe {
  width: 4px;
  align-self: stretch;
  border-radius: 0 3px 3px 0;
  flex-shrink: 0;
}
.hm-stripe-medical { background: linear-gradient(180deg, #4f46e5, #06b6d4); }
.hm-stripe-vehicle { background: linear-gradient(180deg, #f97316, #fbbf24); }
.hm-stripe-expense { background: linear-gradient(180deg, #10b981, #6ee7b7); }
.hm-stripe-logbook { background: linear-gradient(180deg, #8b5cf6, #c4b5fd); }
.hm-stripe-admin   { background: linear-gradient(180deg, #f59e0b, #fde68a); }

/* Module icon */
.hm-module-icon {
  width: 46px; height: 46px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.hm-micon-medical { background: rgba(79,70,229,0.14); color: #818cf8; border: 1px solid rgba(79,70,229,0.18); }
.hm-micon-vehicle { background: rgba(249,115,22,0.14); color: #fb923c; border: 1px solid rgba(249,115,22,0.18); }
.hm-micon-expense { background: rgba(16,185,129,0.14); color: #34d399; border: 1px solid rgba(16,185,129,0.18); }
.hm-micon-logbook { background: rgba(139,92,246,0.14); color: #a78bfa; border: 1px solid rgba(139,92,246,0.18); }
.hm-micon-admin   { background: rgba(245,158,11,0.14); color: #fbbf24; border: 1px solid rgba(245,158,11,0.18); }

/* Module body */
.hm-module-body { flex: 1; min-width: 0; }
.hm-module-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 3px;
  letter-spacing: -0.2px;
}
.hm-module-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Module arrow */
.hm-module-arrow {
  flex-shrink: 0;
  color: var(--text-muted);
  padding-right: 4px;
  opacity: 0.5;
}

/* ── Smaller screens ─────────────────────── */
@media (max-width: 375px) {
  .hm-profile-name { font-size: 18px; }
  .hm-avatar { width: 44px; height: 44px; font-size: 15px; }
  .hm-module-title { font-size: 15px; }
}
</style>
