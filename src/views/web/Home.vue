<template>
<div class="hw-shell">

  <!-- Header Topbar -->
  <header class="hw-topbar">
    <div class="hw-topbar-inner">
      <div class="hw-brand" @click="navigateTo('/')">
        <div class="hw-brand-logo">
          <img src="@/assets/MECLogger.png" alt="MECLogger Logo" />
        </div>
        <div class="hw-brand-text">
          <span class="hw-brand-name">MECLogger</span>
          <span class="hw-brand-ver">v{{ appVersion }}</span>
        </div>
      </div>

      <div class="hw-nav-right">
        <button class="hw-nav-btn" @click="navigateTo('/landing')">
          <mdicon name="earth" size="16"/>
          <span>Landing Overview</span>
        </button>
        <button class="hw-nav-btn" @click="navigateTo('/settings/web')">
          <mdicon name="cog-outline" size="16"/>
          <span>Settings</span>
        </button>
        <div class="hw-user-chip">
          <div class="hw-avatar">{{ userInitials }}</div>
          <span class="hw-chip-name">{{ userName }}</span>
        </div>
        <button class="hw-logout-btn" @click="logout">
          <mdicon name="logout" size="16"/>
          <span>Logout</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Dashboard Main Content -->
  <main class="hw-main">

    <!-- Greeting & Quick Actions Header -->
    <section class="hw-welcome-card">
      <div class="hw-welcome-info">
        <span class="hw-greeting-tag">{{ greeting }}</span>
        <h1 class="hw-user-title">{{ userName }}</h1>
        <p class="hw-welcome-sub">Select a module below or use quick actions to log new records.</p>
      </div>
      <div class="hw-date-badge">
        <span class="hw-date-day">{{ currentDay }}</span>
        <span class="hw-date-full">{{ currentDate }}</span>
      </div>
    </section>

    <!-- Quick Action Shortcut Buttons -->
    <section class="hw-shortcuts-section">
      <span class="hw-section-title">Quick Actions</span>
      <div class="hw-shortcuts-grid">
        <button class="hw-shortcut-btn medical" @click="navigateTo('/medical-records/add-record')">
          <mdicon name="plus-circle-outline" size="18"/>
          <span>Add Medical Record</span>
        </button>
        <button class="hw-shortcut-btn car" @click="navigateTo('/car-maintenance/maintenance/add')">
          <mdicon name="wrench-clock" size="18"/>
          <span>Log Car Service</span>
        </button>
        <button class="hw-shortcut-btn expense" @click="navigateTo('/expense-tracking')">
          <mdicon name="cash-plus" size="18"/>
          <span>Record Expense</span>
        </button>
        <button v-if="canAccessLogbook" class="hw-shortcut-btn logbook" @click="navigateTo('/logbook/payment')">
          <mdicon name="book-plus-outline" size="18"/>
          <span>Log Renter Payment</span>
        </button>
      </div>
    </section>

    <!-- Today's Reminders & Agenda Panel -->
    <section v-if="reminders && reminders.length" class="hw-reminders-card">
      <div class="hw-reminders-header">
        <div class="hw-reminders-title">
          <mdicon name="bell-ring-outline" size="18" class="rem-icon"/>
          <h3>Today's Medicine Reminders</h3>
        </div>
        <button class="hw-text-btn" @click="navigateTo('/medical-records/medicine-reminders')">
          View All <mdicon name="arrow-right" size="14"/>
        </button>
      </div>
      <div class="hw-reminders-list">
        <div v-for="rem in reminders.slice(0, 3)" :key="rem.id" class="hw-reminder-item">
          <div class="rem-icon-box">
            <mdicon name="pill" size="18"/>
          </div>
          <div class="rem-info">
            <strong>{{ rem.medicineName || rem.title || 'Medication' }}</strong>
            <span>{{ rem.dosage || 'Prescribed dose' }} &bull; {{ rem.time || 'Daily' }}</span>
          </div>
          <span class="rem-status-chip">Scheduled</span>
        </div>
      </div>
    </section>

    <!-- Section Header for Modules -->
    <div class="hw-section-divider">
      <span class="hw-divider-text">Record Modules</span>
    </div>

    <!-- Clean Modules Bento Grid -->
    <div class="hw-modules-grid">

      <!-- Medical Records Module Card -->
      <div class="hw-module-card medical" @click="navigateTo('/medical-records')">
        <div class="card-stripe medical"></div>
        <div class="card-head">
          <div class="card-icon-box medical">
            <mdicon name="hospital-box-outline" size="26"/>
          </div>
          <span class="card-badge medical">Health &amp; Vitals</span>
        </div>
        <h2 class="card-title">Medical Records</h2>
        <p class="card-desc">Track blood pressure, blood sugar, body weight, medications, lab results, and health insights for your family.</p>
        <ul class="card-bullets">
          <li><mdicon name="check-small" size="16"/> Vitals &amp; daily reminders</li>
          <li><mdicon name="check-small" size="16"/> Prescriptions &amp; lab reports</li>
        </ul>
        <div class="card-action medical">
          <span>Open Health Hub</span>
          <mdicon name="arrow-right" size="16"/>
        </div>
      </div>

      <!-- Car Maintenance Module Card -->
      <div class="hw-module-card car" @click="navigateTo('/car-maintenance')">
        <div class="card-stripe car"></div>
        <div class="card-head">
          <div class="card-icon-box car">
            <mdicon name="car-wrench" size="26"/>
          </div>
          <span class="card-badge car">Auto &amp; Fleet</span>
        </div>
        <h2 class="card-title">Car Maintenance</h2>
        <p class="card-desc">Keep track of vehicle service history, odometer mileage, oil change schedules, and overall maintenance costs.</p>
        <ul class="card-bullets">
          <li><mdicon name="check-small" size="16"/> Service logs &amp; odometer history</li>
          <li><mdicon name="check-small" size="16"/> Maintenance alerts &amp; reminders</li>
        </ul>
        <div class="card-action car">
          <span>Open Vehicle Hub</span>
          <mdicon name="arrow-right" size="16"/>
        </div>
      </div>

      <!-- Expense Tracking Module Card -->
      <div class="hw-module-card expense" @click="navigateTo('/expense-tracking')">
        <div class="card-stripe expense"></div>
        <div class="card-head">
          <div class="card-icon-box expense">
            <mdicon name="cash-multiple" size="26"/>
          </div>
          <span class="card-badge expense">Finance &amp; Budgets</span>
        </div>
        <h2 class="card-title">Expense Tracking</h2>
        <p class="card-desc">Log daily spending, organize category budgets, monitor recurring payments, and analyze your financial cash flow.</p>
        <ul class="card-bullets">
          <li><mdicon name="check-small" size="16"/> Quick expense entry &amp; categories</li>
          <li><mdicon name="check-small" size="16"/> Monthly budget &amp; spending charts</li>
        </ul>
        <div class="card-action expense">
          <span>Open Finance Hub</span>
          <mdicon name="arrow-right" size="16"/>
        </div>
      </div>

      <!-- Logbook Module Card (Conditional) -->
      <div v-if="canAccessLogbook" class="hw-module-card logbook" @click="navigateTo('/logbook/payment')">
        <div class="card-stripe logbook"></div>
        <div class="card-head">
          <div class="card-icon-box logbook">
            <mdicon name="book-open-page-variant-outline" size="26"/>
          </div>
          <span class="card-badge logbook">Executive Ledger</span>
        </div>
        <h2 class="card-title">Logbook</h2>
        <p class="card-desc">Manage rental payments, track tenant ledgers, monitor savings goals, and audit borrowed assets.</p>
        <ul class="card-bullets">
          <li><mdicon name="check-small" size="16"/> Renter payments &amp; savings goals</li>
          <li><mdicon name="check-small" size="16"/> Borrowed items &amp; transaction history</li>
        </ul>
        <div class="card-action logbook">
          <span>Open Logbook Hub</span>
          <mdicon name="arrow-right" size="16"/>
        </div>
      </div>

      <!-- User Approvals / Admin Module Card (Conditional) -->
      <div v-if="isAdmin" class="hw-module-card admin" @click="navigateTo('/admin/users')">
        <div class="card-stripe admin"></div>
        <div class="card-head">
          <div class="card-icon-box admin">
            <mdicon name="shield-account-outline" size="26"/>
          </div>
          <span class="card-badge admin">Administration</span>
        </div>
        <h2 class="card-title">User Approvals</h2>
        <p class="card-desc">Review pending user registrations, manage user permissions, and control application security roles.</p>
        <ul class="card-bullets">
          <li><mdicon name="check-small" size="16"/> Pending guest account approvals</li>
          <li><mdicon name="check-small" size="16"/> User roles &amp; access control</li>
        </ul>
        <div class="card-action admin">
          <span>Open Admin Panel</span>
          <mdicon name="arrow-right" size="16"/>
        </div>
      </div>

    </div>

  </main>
</div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import store from '@/store'
import getProfile from '@/composables/getProfile'
import { useMedicineReminders } from '@/composables/medicineReminders'
import { Role } from '@/constants/enums'
import { useTheme } from '@/composables/theme'
import appMeta from '../../../package.json'

export default {
  name: "HomeWeb",
  setup() {
    const router = useRouter()
    const activeProfileId = ref(localStorage.getItem('selectedProfileId') || null)
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

    const {
      reminders: reminderSource,
      loading: remindersLoading,
      error: remindersError,
      fetchReminders
    } = useMedicineReminders()

    const loadReminders = async () => {
      const token = localStorage.getItem('token')
      activeProfileId.value = localStorage.getItem('selectedProfileId')
      if (!token || !activeProfileId.value) {
        reminderSource.value = []
        return
      }
      await fetchReminders(token, activeProfileId.value, { date: new Date() })
    }

    onMounted(() => {
      ensureProfile()
      loadReminders()
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
      new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
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
      reminders: reminderSource
    }
  }
}
</script>

<style scoped>
/* ── Page Shell ───────────────────────────── */
.hw-shell {
  min-height: 100vh;
  background: var(--bg-main);
  color: var(--text-primary);
}

/* ── Topbar Navigation ────────────────────── */
.hw-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(5, 6, 10, 0.85);
  border-bottom: 1px solid var(--glass-card-border);
  backdrop-filter: blur(16px);
}
.theme-light .hw-topbar {
  background: rgba(238, 242, 255, 0.90);
}
.hw-topbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 28px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.hw-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.hw-brand-logo {
  width: 34px; height: 34px;
  border-radius: 9px;
  overflow: hidden;
  border: 1px solid var(--glass-card-border);
}
.hw-brand-logo img { width: 100%; height: 100%; object-fit: contain; }
.hw-brand-name {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.3px;
}
.hw-brand-ver {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: 4px;
  font-weight: 600;
}

.hw-nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.hw-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 10px;
  border: 1px solid var(--glass-card-border);
  background: var(--glass-ghost-bg);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.hw-nav-btn:hover {
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.25);
}

.hw-user-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: 999px;
  background: var(--glass-ghost-bg);
  border: 1px solid var(--glass-card-border);
  font-size: 13px;
  font-weight: 700;
}
.hw-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  color: white;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 800;
}
.hw-logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}
.hw-logout-btn:hover { background: rgba(239, 68, 68, 0.2); }

/* ── Main Layout ──────────────────────────── */
.hw-main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 28px 64px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ── Welcome Card ─────────────────────────── */
.hw-welcome-card {
  background: var(--glass-card-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 20px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  box-shadow: var(--glass-card-shadow);
}
.hw-greeting-tag {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #06b6d4;
}
.hw-user-title {
  font-size: 32px;
  font-weight: 800;
  margin: 2px 0 4px;
  letter-spacing: -0.6px;
}
.hw-welcome-sub {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}
.hw-date-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  background: var(--glass-ghost-bg);
  border: 1px solid var(--glass-card-border);
  padding: 10px 16px;
  border-radius: 14px;
}
.hw-date-day {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
}
.hw-date-full {
  font-size: 12px;
  color: var(--text-muted);
}

/* ── Shortcuts Section ────────────────────── */
.hw-shortcuts-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hw-section-title {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}
.hw-shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
.hw-shortcut-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.hw-shortcut-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}
.hw-shortcut-btn.medical { background: rgba(6, 182, 212, 0.1); color: #06b6d4; border-color: rgba(6, 182, 212, 0.25); }
.hw-shortcut-btn.car { background: rgba(249, 115, 22, 0.1); color: #f97316; border-color: rgba(249, 115, 22, 0.25); }
.hw-shortcut-btn.expense { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.25); }
.hw-shortcut-btn.logbook { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border-color: rgba(139, 92, 246, 0.25); }

/* ── Reminders Widget ─────────────────────── */
.hw-reminders-card {
  background: var(--glass-card-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 18px;
  padding: 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.hw-reminders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hw-reminders-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hw-reminders-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}
.rem-icon { color: #06b6d4; }
.hw-text-btn {
  background: none;
  border: none;
  color: #06b6d4;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.hw-reminders-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}
.hw-reminder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--glass-ghost-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 12px;
  padding: 10px 14px;
}
.rem-icon-box {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: rgba(6, 182, 212, 0.15);
  color: #06b6d4;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.rem-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.rem-info strong {
  font-size: 13px;
  color: var(--text-primary);
}
.rem-info span {
  font-size: 11px;
  color: var(--text-muted);
}
.rem-status-chip {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

/* ── Section Divider ─────────────────────── */
.hw-section-divider {
  display: flex;
  align-items: center;
  margin-top: 8px;
}
.hw-divider-text {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

/* ── Modules Grid ─────────────────────────── */
.hw-modules-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.hw-module-card {
  background: var(--glass-card-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 20px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.hw-module-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.25);
}

.card-stripe {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
}
.card-stripe.medical { background: #06b6d4; }
.card-stripe.car { background: #f97316; }
.card-stripe.expense { background: #10b981; }
.card-stripe.logbook { background: #8b5cf6; }
.card-stripe.admin { background: #f59e0b; }

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-icon-box {
  width: 48px; height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
}
.card-icon-box.medical { background: rgba(6, 182, 212, 0.14); color: #06b6d4; }
.card-icon-box.car { background: rgba(249, 115, 22, 0.14); color: #f97316; }
.card-icon-box.expense { background: rgba(16, 185, 129, 0.14); color: #10b981; }
.card-icon-box.logbook { background: rgba(139, 92, 246, 0.14); color: #8b5cf6; }
.card-icon-box.admin { background: rgba(245, 158, 11, 0.14); color: #f59e0b; }

.card-badge {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid;
}
.card-badge.medical { background: rgba(6, 182, 212, 0.12); color: #06b6d4; border-color: rgba(6, 182, 212, 0.25); }
.card-badge.car { background: rgba(249, 115, 22, 0.12); color: #f97316; border-color: rgba(249, 115, 22, 0.25); }
.card-badge.expense { background: rgba(16, 185, 129, 0.12); color: #10b981; border-color: rgba(16, 185, 129, 0.25); }
.card-badge.logbook { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; border-color: rgba(139, 92, 246, 0.25); }
.card-badge.admin { background: rgba(245, 158, 11, 0.12); color: #f59e0b; border-color: rgba(245, 158, 11, 0.25); }

.card-title {
  margin: 4px 0 0;
  font-size: 20px;
  font-weight: 800;
}
.card-desc {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  flex: 1;
}

.card-bullets {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.card-bullets li {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

.card-action {
  margin-top: auto;
  padding-top: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
}
.card-action.medical { color: #06b6d4; }
.card-action.car { color: #f97316; }
.card-action.expense { color: #10b981; }
.card-action.logbook { color: #8b5cf6; }
.card-action.admin { color: #f59e0b; }

/* ── Responsive Queries ──────────────────── */
@media (max-width: 900px) {
  .hw-modules-grid { grid-template-columns: 1fr; }
  .hw-welcome-card { flex-direction: column; align-items: flex-start; }
  .hw-date-badge { align-items: flex-start; }
}

@media (max-width: 600px) {
  .hw-topbar-inner { padding: 0 16px; }
  .hw-main { padding: 20px 16px 40px; }
  .hw-chip-name { display: none; }
}
</style>
