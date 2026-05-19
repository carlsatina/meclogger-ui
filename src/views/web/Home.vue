<template>
<div class="hw-shell">

  <!-- Ambient Background -->
  <div class="hw-bg" aria-hidden="true">
    <div class="hw-orb hw-orb-1"></div>
    <div class="hw-orb hw-orb-2"></div>
    <div class="hw-orb hw-orb-3"></div>
  </div>

  <!-- Sticky Top Nav -->
  <header class="hw-topbar">
    <div class="hw-topbar-inner">
      <div class="hw-brand">
        <div class="hw-brand-logo">
          <img src="@/assets/MECLogger.png" alt="MECLogger"/>
        </div>
        <div class="hw-brand-text">
          <span class="hw-brand-name">MECLogger</span>
          <span class="hw-brand-ver">v{{ appVersion }}</span>
        </div>
      </div>
      <div class="hw-nav-right">
        <button class="hw-nav-btn" @click="toggleTheme">
          <mdicon :name="isDark ? 'white-balance-sunny' : 'moon-waning-crescent'" size="16"/>
          <span>{{ isDark ? 'Light' : 'Dark' }}</span>
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

  <!-- Page Content -->
  <main class="hw-main">

    <!-- Welcome Hero -->
    <section class="hw-welcome">
      <div class="hw-welcome-left">
        <p class="hw-greeting-label">{{ greeting }}</p>
        <h1 class="hw-hero-name">{{ userName }}</h1>
        <p class="hw-hero-sub">Your personal records dashboard is ready.</p>
      </div>
      <div class="hw-welcome-right">
        <p class="hw-date-day">{{ currentDay }}</p>
        <p class="hw-date-full">{{ currentDate }}</p>
      </div>
    </section>

    <!-- Section Divider -->
    <div class="hw-divider">
      <span class="hw-divider-label">Modules</span>
      <div class="hw-divider-line"></div>
    </div>

    <!-- Bento Grid -->
    <div class="hw-grid">

      <!-- Medical Records — 2-column wide -->
      <div class="hw-card hw-medical hw-wide" @click="navigateTo('/medical-records')">
        <div class="hw-accent hw-accent-medical"></div>
        <div class="hw-wide-layout">
          <div class="hw-wide-content">
            <span class="hw-tag hw-tag-health">Health</span>
            <h2 class="hw-card-title">Medical Records</h2>
            <p class="hw-card-desc">Comprehensive health tracking for you and your family. Monitor vitals, manage prescriptions, and store medical history securely.</p>
            <ul class="hw-feat-list">
              <li><span class="hw-feat-dot hw-dot-medical"></span>Blood pressure &amp; blood sugar</li>
              <li><span class="hw-feat-dot hw-dot-medical"></span>Body weight history</li>
              <li><span class="hw-feat-dot hw-dot-medical"></span>Medications &amp; daily reminders</li>
              <li><span class="hw-feat-dot hw-dot-medical"></span>Lab results &amp; visit records</li>
              <li><span class="hw-feat-dot hw-dot-medical"></span>Health insights &amp; trends</li>
            </ul>
            <div class="hw-cta">Open Medical Records <mdicon name="arrow-right" size="15"/></div>
          </div>
          <div class="hw-wide-vis hw-vis-medical">
            <mdicon name="hospital-box-outline" size="64"/>
          </div>
        </div>
      </div>

      <!-- Car Maintenance -->
      <div class="hw-card hw-vehicle" @click="navigateTo('/car-maintenance')">
        <div class="hw-accent hw-accent-vehicle"></div>
        <span class="hw-tag hw-tag-auto">Auto</span>
        <div class="hw-card-icon hw-icon-vehicle">
          <mdicon name="car-wrench" size="34"/>
        </div>
        <h2 class="hw-card-title">Car Maintenance</h2>
        <p class="hw-card-desc">Track service history, set maintenance reminders, and manage vehicle costs across your entire fleet.</p>
        <div class="hw-cta">Open <mdicon name="arrow-right" size="14"/></div>
      </div>

      <!-- Expense Tracking -->
      <div class="hw-card hw-expense" @click="navigateTo('/expense-tracking')">
        <div class="hw-accent hw-accent-expense"></div>
        <span class="hw-tag hw-tag-finance">Finance</span>
        <div class="hw-card-icon hw-icon-expense">
          <mdicon name="cash-multiple" size="34"/>
        </div>
        <h2 class="hw-card-title">Expense Tracking</h2>
        <p class="hw-card-desc">Monitor daily spending, set budgets, track subscriptions, and analyze your financial patterns over time.</p>
        <div class="hw-cta">Open <mdicon name="arrow-right" size="14"/></div>
      </div>

      <!-- Logbook (conditional) -->
      <div v-if="canAccessLogbook" class="hw-card hw-logbook" @click="navigateTo('/logbook/payment')">
        <div class="hw-accent hw-accent-logbook"></div>
        <span class="hw-tag hw-tag-logbook">Logbook</span>
        <div class="hw-card-icon hw-icon-logbook">
          <mdicon name="book-open-page-variant-outline" size="34"/>
        </div>
        <h2 class="hw-card-title">Logbook</h2>
        <p class="hw-card-desc">Manage rental payments, track savings, record transactions, and generate detailed financial reports.</p>
        <div class="hw-cta">Open <mdicon name="arrow-right" size="14"/></div>
      </div>

      <!-- Admin (conditional) -->
      <div v-if="isAdmin" class="hw-card hw-admin" @click="navigateTo('/admin/users')">
        <div class="hw-accent hw-accent-admin"></div>
        <span class="hw-tag hw-tag-admin">Admin</span>
        <div class="hw-card-icon hw-icon-admin">
          <mdicon name="shield-account-outline" size="34"/>
        </div>
        <h2 class="hw-card-title">User Approvals</h2>
        <p class="hw-card-desc">Review pending registrations, manage user roles, and control access to the application.</p>
        <div class="hw-cta">Open Panel <mdicon name="arrow-right" size="14"/></div>
      </div>

    </div>

  </main>
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
import { useMedicineReminders } from '@/composables/medicineReminders'
import { Role } from '@/constants/enums'
import { useTheme } from '@/composables/theme'
import appMeta from '../../../package.json'
import { useCarMaintenance } from '@/composables/carMaintenance'

export default {
    name: "HomeWeb",
    components: {
        Modal,
        Loading,
        Datepicker
    },
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
            if (h < 12) return 'Good morning,'
            if (h < 17) return 'Good afternoon,'
            return 'Good evening,'
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
        }
    }
}
</script>

<style scoped>

/* ── Shell ───────────────────────────────── */
.hw-shell {
  min-height: 100vh;
  background: var(--home-bg-web);
  color: var(--text-primary);
  position: relative;
}

/* ── Ambient orbs ────────────────────────── */
.hw-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.hw-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.14;
}
.hw-orb-1 {
  width: 700px; height: 700px;
  top: -250px; left: -150px;
  background: radial-gradient(circle, #4f46e5, transparent 70%);
}
.hw-orb-2 {
  width: 550px; height: 550px;
  top: 10%; right: -180px;
  background: radial-gradient(circle, #06b6d4, transparent 70%);
}
.hw-orb-3 {
  width: 450px; height: 450px;
  bottom: 5%; left: 30%;
  background: radial-gradient(circle, #22c55e, transparent 70%);
}
.theme-light .hw-orb { opacity: 0.10; }

/* ── Topbar ──────────────────────────────── */
.hw-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(5, 6, 10, 0.82);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
.theme-light .hw-topbar {
  background: rgba(238, 242, 255, 0.88);
  border-bottom-color: rgba(79, 70, 229, 0.12);
}
.hw-topbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 28px;
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.hw-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.hw-brand-logo {
  width: 34px; height: 34px;
  border-radius: 9px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.hw-brand-logo img { width: 100%; height: 100%; object-fit: contain; }
.hw-brand-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}
.hw-brand-ver {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: 6px;
  font-weight: 500;
}
.hw-nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hw-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.theme-light .hw-nav-btn {
  border-color: rgba(79, 70, 229, 0.15);
  background: rgba(79, 70, 229, 0.05);
  color: var(--text-secondary);
}
.hw-nav-btn:hover { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
.theme-light .hw-nav-btn:hover { background: rgba(79, 70, 229, 0.1); color: var(--text-primary); }

.hw-user-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.theme-light .hw-user-chip {
  background: rgba(79, 70, 229, 0.08);
  border-color: rgba(79, 70, 229, 0.18);
}
.hw-avatar {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 800;
  color: white;
  flex-shrink: 0;
}
.hw-logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.18);
  color: #fca5a5;
  cursor: pointer;
  transition: background 0.15s;
}
.theme-light .hw-logout-btn {
  background: rgba(239, 68, 68, 0.07);
  border-color: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}
.hw-logout-btn:hover { background: rgba(239, 68, 68, 0.18); }

/* ── Main content ────────────────────────── */
.hw-main {
  position: relative;
  z-index: 1;
  max-width: 1280px;
  margin: 0 auto;
  padding: 48px 28px 72px;
}

/* ── Welcome ─────────────────────────────── */
.hw-welcome {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 52px;
  flex-wrap: wrap;
}
.hw-greeting-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 6px;
}
.hw-hero-name {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -1.5px;
  margin: 0 0 10px;
  background: linear-gradient(135deg, var(--text-primary) 40%, var(--text-muted));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
}
.hw-hero-sub {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
}
.hw-date-day {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  text-align: right;
}
.hw-date-full {
  font-size: 13px;
  color: var(--text-muted);
  margin: 4px 0 0;
  text-align: right;
}

/* ── Section divider ─────────────────────── */
.hw-divider {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}
.hw-divider-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  white-space: nowrap;
}
.hw-divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.25), transparent);
}

/* ── Bento Grid ──────────────────────────── */
.hw-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  animation: hw-rise 0.45s ease both;
}
.hw-wide { grid-column: span 2; }

@keyframes hw-rise {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Card base ───────────────────────────── */
.hw-card {
  background: var(--glass-card-bg);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 22px;
  padding: 26px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  overflow: hidden;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
.theme-light .hw-card {
  border-color: rgba(79, 70, 229, 0.1);
}
.hw-card:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.13);
}
.theme-light .hw-card:hover { border-color: rgba(79, 70, 229, 0.22); }

/* Per-module hover glow */
.hw-medical:hover { box-shadow: 0 28px 56px rgba(79, 70, 229, 0.14), 0 0 0 1px rgba(79, 70, 229, 0.12); }
.hw-vehicle:hover { box-shadow: 0 28px 56px rgba(249, 115, 22, 0.14), 0 0 0 1px rgba(249, 115, 22, 0.12); }
.hw-expense:hover { box-shadow: 0 28px 56px rgba(16, 185, 129, 0.14), 0 0 0 1px rgba(16, 185, 129, 0.12); }
.hw-logbook:hover { box-shadow: 0 28px 56px rgba(139, 92, 246, 0.14), 0 0 0 1px rgba(139, 92, 246, 0.12); }
.hw-admin:hover   { box-shadow: 0 28px 56px rgba(245, 158, 11, 0.14), 0 0 0 1px rgba(245, 158, 11, 0.12); }

/* ── Accent top bar ──────────────────────── */
.hw-accent {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  border-radius: 22px 22px 0 0;
}
.hw-accent-medical { background: linear-gradient(90deg, #4f46e5, #818cf8, #06b6d4); }
.hw-accent-vehicle { background: linear-gradient(90deg, #f97316, #fb923c, #fbbf24); }
.hw-accent-expense { background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7); }
.hw-accent-logbook { background: linear-gradient(90deg, #8b5cf6, #a78bfa, #c4b5fd); }
.hw-accent-admin   { background: linear-gradient(90deg, #f59e0b, #fbbf24, #fde68a); }

/* ── Tags ────────────────────────────────── */
.hw-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  width: fit-content;
}
.hw-tag-health  { background: rgba(79, 70, 229, 0.14);  color: #818cf8; border: 1px solid rgba(79, 70, 229, 0.25); }
.hw-tag-auto    { background: rgba(249, 115, 22, 0.14); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.25); }
.hw-tag-finance { background: rgba(16, 185, 129, 0.14); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25); }
.hw-tag-logbook { background: rgba(139, 92, 246, 0.14); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.25); }
.hw-tag-admin   { background: rgba(245, 158, 11, 0.14); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.25); }

/* ── Card icon zone ──────────────────────── */
.hw-card-icon {
  width: 60px; height: 60px;
  border-radius: 16px;
  display: grid;
  place-items: center;
}
.hw-icon-vehicle { background: rgba(249,115,22,0.14); color: #fb923c; border: 1px solid rgba(249,115,22,0.18); }
.hw-icon-expense { background: rgba(16,185,129,0.14); color: #34d399; border: 1px solid rgba(16,185,129,0.18); }
.hw-icon-logbook { background: rgba(139,92,246,0.14); color: #a78bfa; border: 1px solid rgba(139,92,246,0.18); }
.hw-icon-admin   { background: rgba(245,158,11,0.14); color: #fbbf24; border: 1px solid rgba(245,158,11,0.18); }

/* ── Card text ───────────────────────────── */
.hw-card-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}
.hw-card-desc {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.65;
  flex: 1;
}
.hw-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  margin-top: auto;
  transition: color 0.15s, gap 0.15s;
}
.hw-card:hover .hw-cta { color: var(--text-primary); gap: 10px; }

/* ── Wide card (Medical) ─────────────────── */
.hw-wide-layout {
  display: flex;
  gap: 36px;
  align-items: flex-start;
}
.hw-wide-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.hw-feat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.hw-feat-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-secondary);
}
.hw-feat-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.hw-dot-medical { background: #818cf8; box-shadow: 0 0 6px rgba(129,140,248,0.5); }

.hw-wide-vis {
  flex-shrink: 0;
  width: 148px; height: 148px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  align-self: center;
}
.hw-vis-medical {
  background: linear-gradient(135deg, rgba(79,70,229,0.18), rgba(6,182,212,0.18));
  border: 1px solid rgba(79,70,229,0.2);
  color: #818cf8;
}

/* ── Responsive ──────────────────────────── */
@media (max-width: 1024px) {
  .hw-grid { grid-template-columns: repeat(2, 1fr); }
  .hw-wide { grid-column: span 2; }
  .hw-hero-name { font-size: 38px; }
}

@media (max-width: 768px) {
  .hw-grid { grid-template-columns: 1fr; }
  .hw-wide { grid-column: span 1; }
  .hw-wide-layout { flex-direction: column; }
  .hw-wide-vis { width: 100%; height: 100px; }
  .hw-main { padding: 28px 16px 48px; }
  .hw-hero-name { font-size: 30px; }
  .hw-welcome { margin-bottom: 36px; }
  .hw-topbar-inner { padding: 0 16px; }
  .hw-nav-btn span { display: none; }
  .hw-chip-name { display: none; }
}

@media (max-width: 480px) {
  .hw-brand-ver { display: none; }
}
</style>
