<template>
<div class="landing-shell">

  <!-- Ambient Background Orbs -->
  <div class="landing-bg" aria-hidden="true">
    <div class="landing-orb orb-medical"></div>
    <div class="landing-orb orb-car"></div>
    <div class="landing-orb orb-expense"></div>
    <div class="landing-orb orb-logbook"></div>
  </div>

  <!-- Sticky Top Navigation -->
  <header class="landing-nav">
    <div class="landing-nav-container">
      <div class="landing-brand" @click="scrollTo('hero')">
        <div class="landing-brand-logo">
          <img src="@/assets/MECLogger.png" alt="MECLogger Logo" />
        </div>
        <div class="landing-brand-text">
          <span class="landing-brand-name">MECLogger</span>
          <span class="landing-brand-badge">PROD</span>
        </div>
      </div>

      <nav class="landing-menu">
        <a href="#features" class="landing-link" @click.prevent="scrollTo('features')">Features</a>
        <a href="#branding" class="landing-link" @click.prevent="scrollTo('branding')">Color Branding</a>
        <a href="#security" class="landing-link" @click.prevent="scrollTo('security')">Security</a>
        <a href="#faq" class="landing-link" @click.prevent="scrollTo('faq')">FAQ</a>
      </nav>

      <div class="landing-nav-actions">
        <button class="landing-btn-ghost" @click="navigateTo('/login')">
          <mdicon name="login" size="16" />
          <span>Sign In</span>
        </button>
        <button class="landing-btn-primary" @click="navigateTo('/register')">
          <span>Get Started</span>
          <mdicon name="arrow-right" size="16" />
        </button>
      </div>
    </div>
  </header>

  <!-- Main Landing Container -->
  <main class="landing-main">

    <!-- HERO SECTION -->
    <section id="hero" class="landing-hero">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="hero-badge-pulse"></span>
          <mdicon name="sparkles" size="15" />
          <span>All-in-One Personal Records & Ledger</span>
        </div>

        <h1 class="hero-title">
          Master Your Life’s Records in One <span class="gradient-text">Unified Hub</span>
        </h1>

        <p class="hero-description">
          MECLogger seamlessly centralizes your <strong>Medical Records</strong>, <strong>Car Maintenance History</strong>, <strong>Expense Tracking</strong>, and <strong>Logbook Ledgers</strong> into a beautiful, color-coded dashboard designed for both Web and Mobile.
        </p>

        <div class="hero-ctas">
          <button class="hero-btn-main" @click="navigateTo('/register')">
            <span>Start Tracking Now</span>
            <mdicon name="rocket-launch-outline" size="18" />
          </button>
          <button class="hero-btn-secondary" @click="scrollTo('branding')">
            <mdicon name="palette-outline" size="18" />
            <span>Explore Color Branding</span>
          </button>
        </div>

        <div class="hero-stats">
          <div class="stat-pill">
            <span class="stat-num">4</span>
            <span class="stat-label">Core Modules</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-pill">
            <span class="stat-num">Dual-UI</span>
            <span class="stat-label">Mobile & Desktop</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-pill">
            <span class="stat-num">100%</span>
            <span class="stat-label">Private & Encrypted</span>
          </div>
        </div>
      </div>

      <!-- HERO DEMO / INTERACTIVE PREVIEW -->
      <div class="hero-visual">
        <div class="hero-card-frame">
          <div class="frame-header">
            <div class="frame-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <span class="frame-title">MECLogger Live Feature Switcher</span>
          </div>

          <div class="frame-tabs">
            <button 
              v-for="feature in features" 
              :key="feature.id"
              :class="['frame-tab', { active: activeTab === feature.id }]"
              :style="activeTab === feature.id ? { borderColor: feature.color, color: feature.color } : {}"
              @click="activeTab = feature.id"
            >
              <mdicon :name="feature.icon" size="16" />
              <span>{{ feature.shortName }}</span>
            </button>
          </div>

          <!-- DYNAMIC PREVIEW CONTENT -->
          <div class="frame-body" :class="`theme-${activeFeature.id}`">
            <div class="preview-header">
              <div class="preview-title-group">
                <span class="preview-tag" :style="{ backgroundColor: activeFeature.subtleBg, color: activeFeature.color, borderColor: activeFeature.borderColor }">
                  {{ activeFeature.category }}
                </span>
                <h3 class="preview-name">{{ activeFeature.name }}</h3>
              </div>
              <div class="preview-badge" :style="{ background: activeFeature.gradient, color: activeFeature.contrastColor }">
                <mdicon :name="activeFeature.icon" size="14" />
                <span>{{ activeFeature.hex }}</span>
              </div>
            </div>

            <p class="preview-desc">{{ activeFeature.description }}</p>

            <!-- Mock Widget Renderings -->
            <div v-if="activeTab === 'medical'" class="mock-widget medical-widget">
              <div class="mock-row">
                <div class="mock-stat-card">
                  <span class="mock-label">Blood Pressure</span>
                  <div class="mock-value">120/80 <span class="unit">mmHg</span></div>
                  <span class="mock-badge normal">Optimal</span>
                </div>
                <div class="mock-stat-card">
                  <span class="mock-label">Blood Sugar</span>
                  <div class="mock-value">95 <span class="unit">mg/dL</span></div>
                  <span class="mock-badge normal">Fasting</span>
                </div>
              </div>
              <div class="mock-item-row">
                <mdicon name="pill" size="18" class="mock-icon-medical" />
                <div class="mock-item-info">
                  <strong>Multivitamin & Omega 3</strong>
                  <span>Daily reminder &bull; 8:00 AM</span>
                </div>
                <span class="mock-status-done">Checked</span>
              </div>
            </div>

            <div v-else-if="activeTab === 'car'" class="mock-widget car-widget">
              <div class="mock-vehicle-banner">
                <div class="mock-vehicle-thumb">
                  <mdicon name="car-sports" size="24" />
                </div>
                <div class="mock-vehicle-details">
                  <h4>Toyota RAV4 Hybrid</h4>
                  <p>2023 &bull; 24,500 km</p>
                </div>
              </div>
              <div class="mock-item-row">
                <mdicon name="wrench" size="18" class="mock-icon-car" />
                <div class="mock-item-info">
                  <strong>Synthetic Oil & Filter Change</strong>
                  <span>Due at 25,000 km</span>
                </div>
                <span class="mock-status-upcoming">Upcoming</span>
              </div>
            </div>

            <div v-else-if="activeTab === 'expense'" class="mock-widget expense-widget">
              <div class="mock-row">
                <div class="mock-stat-card">
                  <span class="mock-label">Monthly Spending</span>
                  <div class="mock-value">$1,420.50</div>
                  <span class="mock-badge safe">Under Budget</span>
                </div>
                <div class="mock-stat-card">
                  <span class="mock-label">Cash Balance</span>
                  <div class="mock-value">$8,240.00</div>
                  <span class="mock-badge net">+12.4%</span>
                </div>
              </div>
              <div class="mock-item-row">
                <mdicon name="cart-outline" size="18" class="mock-icon-expense" />
                <div class="mock-item-info">
                  <strong>Whole Foods Supermarket</strong>
                  <span>Groceries &bull; Today</span>
                </div>
                <span class="mock-amount-out">-$84.20</span>
              </div>
            </div>

            <div v-else-if="activeTab === 'logbook'" class="mock-widget logbook-widget">
              <div class="mock-row">
                <div class="mock-stat-card">
                  <span class="mock-label">Active Renters</span>
                  <div class="mock-value">4 Tenants</div>
                  <span class="mock-badge logbook-badge">100% Paid</span>
                </div>
                <div class="mock-stat-card">
                  <span class="mock-label">Savings Ledger</span>
                  <div class="mock-value">$15,500.00</div>
                  <span class="mock-badge logbook-badge">Target Met</span>
                </div>
              </div>
              <div class="mock-item-row">
                <mdicon name="home-account" size="18" class="mock-icon-logbook" />
                <div class="mock-item-info">
                  <strong>Apartment 4B - Rent Payment</strong>
                  <span>Logged by Admin &bull; Aug 2026</span>
                </div>
                <span class="mock-amount-in">+$1,250.00</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>

    <!-- BRANDING SHOWCASE SECTION -->
    <section id="branding" class="landing-section">
      <div class="section-header center">
        <span class="section-eyebrow">Design System & Identity</span>
        <h2 class="section-title">Color Branding for Every Feature</h2>
        <p class="section-subtitle">
          Each feature in MECLogger carries a distinct visual identity, gradient accent, and purposeful color psychology for instant visual recognition.
        </p>
      </div>

      <div class="branding-grid">
        <div 
          v-for="feature in features" 
          :key="feature.id"
          class="branding-card"
          :style="{ '--feature-color': feature.color, '--feature-subtle': feature.subtleBg }"
        >
          <div class="branding-top-stripe" :style="{ background: feature.gradient }"></div>
          <div class="branding-header">
            <div class="branding-icon-box" :style="{ backgroundColor: feature.subtleBg, color: feature.color }">
              <mdicon :name="feature.icon" size="28" />
            </div>
            <div class="branding-title-meta">
              <span class="branding-tag" :style="{ backgroundColor: feature.subtleBg, color: feature.color, borderColor: feature.borderColor }">
                {{ feature.category }}
              </span>
              <h3 class="branding-feature-name">{{ feature.name }}</h3>
            </div>
          </div>

          <div class="branding-swatch-row">
            <div class="swatch-pill" :style="{ background: feature.color }">
              <span>Primary</span>
              <code>{{ feature.hex }}</code>
            </div>
            <div class="swatch-pill gradient-pill" :style="{ background: feature.gradient, color: feature.contrastColor }">
              <span>Accent Gradient</span>
            </div>
          </div>

          <p class="branding-rationale">
            <strong>Rationale:</strong> {{ feature.rationale }}
          </p>

          <ul class="branding-bullets">
            <li v-for="(item, i) in feature.highlights" :key="i">
              <mdicon name="check-circle-outline" size="15" :style="{ color: feature.color }" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- FEATURES & CAPABILITIES SECTION -->
    <section id="features" class="landing-section">
      <div class="section-header">
        <span class="section-eyebrow">Complete Capabilities</span>
        <h2 class="section-title">Built to Handle Your Everyday Data</h2>
        <p class="section-subtitle">
          Powerful tools designed for personal convenience, family health management, and financial precision.
        </p>
      </div>

      <div class="capabilities-grid">
        <div class="cap-card">
          <div class="cap-icon teal">
            <mdicon name="cellphone-link" size="26" />
          </div>
          <h3>Dual-UI Adaptive Architecture</h3>
          <p>Seamlessly transforms between mobile-optimized app screens and expansive desktop web views depending on your device.</p>
        </div>

        <div class="cap-card">
          <div class="cap-icon orange">
            <mdicon name="bell-ring-outline" size="26" />
          </div>
          <h3>Smart Reminders & Schedules</h3>
          <p>Never miss a medication dose or vehicle oil change with scheduled alerts and checked/missed slot tracking.</p>
        </div>

        <div class="cap-card">
          <div class="cap-icon green">
            <mdicon name="chart-box-outline" size="26" />
          </div>
          <h3>Analytics & Spending Insights</h3>
          <p>Visualize health vitals over time and analyze monthly spending patterns with interactive visual charts.</p>
        </div>

        <div class="cap-card">
          <div class="cap-icon purple">
            <mdicon name="notebook-outline" size="26" />
          </div>
          <h3>Rental & Savings Ledgers</h3>
          <p>Keep track of renter payments, tenant records, savings goals, and borrowed assets with full balance auditing.</p>
        </div>
      </div>
    </section>

    <!-- SECURITY SECTION -->
    <section id="security" class="landing-section dark-accent-box">
      <div class="security-layout">
        <div class="security-text">
          <div class="security-badge">
            <mdicon name="shield-check-outline" size="18" />
            <span>Privacy & Storage Infrastructure</span>
          </div>
          <h2 class="security-title">Your Data Stays Safe and Under Your Control</h2>
          <p class="security-desc">
            MECLogger uses JWT authentication, fine-grained role-based permissions (ADMIN, USER, FAMILY, GUEST), and automatic multi-tier storage failover.
          </p>

          <div class="security-features">
            <div class="sec-item">
              <mdicon name="lock-outline" size="20" class="sec-icon" />
              <div>
                <strong>JWT Secured API & Role Guards</strong>
                <p>Strict endpoint level authentication preventing unauthorized data access.</p>
              </div>
            </div>

            <div class="sec-item">
              <mdicon name="cloud-upload-outline" size="20" class="sec-icon" />
              <div>
                <strong>Multi-Provider Blob Storage</strong>
                <p>Automatic waterfall upload support for Cloudflare R2, Vercel Blob, MinIO, or Local Disk fallback.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="security-vis">
          <div class="sec-card-shield">
            <mdicon name="shield-lock-outline" size="72" class="shield-main-icon" />
            <div class="sec-status-row">
              <span class="status-dot"></span>
              <span>Encrypted & Operational</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ SECTION -->
    <section id="faq" class="landing-section">
      <div class="section-header center">
        <span class="section-eyebrow">Got Questions?</span>
        <h2 class="section-title">Frequently Asked Questions</h2>
      </div>

      <div class="faq-list">
        <div v-for="(item, index) in faqs" :key="index" class="faq-item" :class="{ open: openFaq === index }" @click="toggleFaq(index)">
          <div class="faq-question">
            <span>{{ item.q }}</span>
            <mdicon :name="openFaq === index ? 'minus' : 'plus'" size="18" class="faq-icon" />
          </div>
          <div v-if="openFaq === index" class="faq-answer">
            <p>{{ item.a }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA BANNER -->
    <section class="landing-cta-banner">
      <div class="cta-inner">
        <h2>Ready to Organize Your Personal Records?</h2>
        <p>Experience the power of color-coded tracking for medical, vehicle, expense, and ledger management today.</p>
        <div class="cta-btn-group">
          <button class="landing-btn-primary large" @click="navigateTo('/register')">
            <span>Create Free Account</span>
            <mdicon name="arrow-right" size="18" />
          </button>
          <button class="landing-btn-ghost large" @click="navigateTo('/login')">
            <span>Sign In to Existing Account</span>
          </button>
        </div>
      </div>
    </section>

  </main>

  <!-- FOOTER -->
  <footer class="landing-footer">
    <div class="footer-container">
      <div class="footer-brand">
        <div class="footer-logo">
          <img src="@/assets/MECLogger.png" alt="MECLogger" />
        </div>
        <div>
          <span class="footer-title">MECLogger</span>
          <p class="footer-copy">&copy; 2026 MECLogger. All rights reserved.</p>
        </div>
      </div>

      <div class="footer-links">
        <a href="#hero" @click.prevent="scrollTo('hero')">Back to Top</a>
        <a href="#branding" @click.prevent="scrollTo('branding')">Branding</a>
        <a href="#security" @click.prevent="scrollTo('security')">Security</a>
        <a @click.prevent="navigateTo('/login')">Sign In</a>
        <a @click.prevent="navigateTo('/register')">Register</a>
      </div>
    </div>
  </footer>

</div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/theme'

export default {
  name: "PublicLanding",
  setup() {
    const router = useRouter()
    const { isDark, toggleTheme } = useTheme()
    const activeTab = ref('medical')
    const openFaq = ref(0)

    const features = [
      {
        id: 'medical',
        name: 'Medical Records',
        shortName: 'Medical',
        category: 'Health & Care',
        icon: 'hospital-box-outline',
        color: '#06b6d4',
        hex: '#06b6d4 / #4f46e5',
        contrastColor: '#ffffff',
        gradient: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
        subtleBg: 'rgba(6, 182, 212, 0.14)',
        borderColor: 'rgba(6, 182, 212, 0.3)',
        description: 'Comprehensive health monitoring for you and your family. Track vitals, daily medicine reminders, lab results, and illness recovery logs.',
        rationale: 'Clinical Cyan & Deep Indigo represent medical trust, calmness, physiological stability, and hygiene. High-risk readings utilize amber/red indicators.',
        highlights: [
          'Blood pressure & blood sugar tracking',
          'Body weight & BMI progression',
          'Medication reminders with checked/missed slots',
          'Lab results & health trend insights'
        ]
      },
      {
        id: 'car',
        name: 'Car Maintenance',
        shortName: 'Auto',
        category: 'Automotive & Fleet',
        icon: 'car-wrench',
        color: '#f97316',
        hex: '#f97316 / #fbbf24',
        contrastColor: '#0b1020',
        gradient: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
        subtleBg: 'rgba(249, 115, 22, 0.14)',
        borderColor: 'rgba(249, 115, 22, 0.3)',
        description: 'Vehicle management made easy. Keep service history, track odometer mileage, receive maintenance reminders, and calculate fleet costs.',
        rationale: 'Automotive Orange & Gear Amber signify engine heat, mechanical energy, workshop tools, performance monitoring, and active service alerts.',
        highlights: [
          'Vehicle profile & odometer logging',
          'Preventative maintenance schedules',
          'Service receipt attachments',
          'Total cost of ownership breakdown'
        ]
      },
      {
        id: 'expense',
        name: 'Expense Tracking',
        shortName: 'Finance',
        category: 'Finance & Budgeting',
        icon: 'cash-multiple',
        color: '#10b981',
        hex: '#10b981 / #34d399',
        contrastColor: '#0b1020',
        gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        subtleBg: 'rgba(16, 185, 129, 0.14)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        description: 'Monitor daily cash flow, establish category budgets, track recurring subscriptions, and gain deep visual insights into your personal finances.',
        rationale: 'Financial Emerald Green evokes monetary liquidity, positive cash balances, budget growth, and financial peace of mind.',
        highlights: [
          'Quick natural language expense entry',
          'Category-wise budget allocations',
          'Monthly income vs expense summary',
          'Spending category analytics'
        ]
      },
      {
        id: 'logbook',
        name: 'Logbook',
        shortName: 'Logbook',
        category: 'Executive Ledger',
        icon: 'book-open-page-variant-outline',
        color: '#8b5cf6',
        hex: '#8b5cf6 / #c4b5fd',
        contrastColor: '#0b1020',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)',
        subtleBg: 'rgba(139, 92, 246, 0.14)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        description: 'Structured ledger management for property rentals, renter payment histories, long-term savings goals, and borrowed asset tracking.',
        rationale: 'Executive Violet & Royal Purple convey legal authority, contract management, property ledger integrity, and formal audit balance recording.',
        highlights: [
          'Renter management & monthly rent tracking',
          'Savings goals & deposit progression',
          'Borrowed item & loan balance history',
          'CSV import & detailed audit reports'
        ]
      }
    ]

    const faqs = [
      {
        q: "What is MECLogger?",
        a: "MECLogger is an all-in-one personal records application designed to track Medical Records, Car Maintenance, Daily Expenses, and Logbook Ledgers in a single secure account."
      },
      {
        q: "How does the feature color branding work?",
        a: "Each feature module utilizes a dedicated color palette (Cyan/Indigo for Health, Orange/Amber for Auto, Emerald Green for Finance, and Violet/Purple for Logbook) so you can navigate instinctively across mobile and web UI."
      },
      {
        q: "Can I use MECLogger on both Desktop and Mobile?",
        a: "Yes! MECLogger features an adaptive dual-UI architecture. On web browsers, you get an expansive multi-column bento dashboard; on mobile devices, you get touch-optimized native screens."
      },
      {
        q: "Is my data stored securely?",
        a: "Absolutely. All API requests are protected by JWT authentication and role-based access guards. Images and records are uploaded to your choice of Cloudflare R2, Vercel Blob, MinIO, or local disk."
      }
    ]

    const activeFeature = computed(() => {
      return features.find(f => f.id === activeTab.value) || features[0]
    })

    const navigateTo = (path) => {
      router.push(path)
    }

    const scrollTo = (id) => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }

    const toggleFaq = (index) => {
      openFaq.value = openFaq.value === index ? -1 : index
    }

    return {
      isDark,
      toggleTheme,
      activeTab,
      features,
      activeFeature,
      faqs,
      openFaq,
      toggleFaq,
      navigateTo,
      scrollTo
    }
  }
}
</script>

<style scoped>
/* ── Shell & Layout ───────────────────────── */
.landing-shell {
  min-height: 100vh;
  background: var(--bg-main);
  color: var(--text-primary);
  position: relative;
  overflow-x: hidden;
}

/* ── Ambient Background Orbs ──────────────── */
.landing-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.landing-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.16;
}
.orb-medical {
  width: 600px; height: 600px;
  top: -200px; left: -150px;
  background: radial-gradient(circle, #06b6d4, transparent 70%);
}
.orb-car {
  width: 500px; height: 500px;
  top: 20%; right: -150px;
  background: radial-gradient(circle, #f97316, transparent 70%);
}
.orb-expense {
  width: 550px; height: 550px;
  bottom: 15%; left: -100px;
  background: radial-gradient(circle, #10b981, transparent 70%);
}
.orb-logbook {
  width: 500px; height: 500px;
  bottom: -150px; right: 20%;
  background: radial-gradient(circle, #8b5cf6, transparent 70%);
}

/* ── Sticky Navigation ────────────────────── */
.landing-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(5, 6, 10, 0.84);
  border-bottom: 1px solid var(--glass-card-border);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.theme-light .landing-nav {
  background: rgba(238, 242, 255, 0.90);
}
.landing-nav-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 28px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.landing-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}
.landing-brand-logo {
  width: 38px; height: 38px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--glass-card-border);
}
.landing-brand-logo img { width: 100%; height: 100%; object-fit: contain; }
.landing-brand-name {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.4px;
}
.landing-brand-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
  background: linear-gradient(135deg, #06b6d4, #8b5cf6);
  color: #0b1020;
}
.landing-menu {
  display: flex;
  gap: 28px;
}
.landing-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: color 0.2s;
}
.landing-link:hover { color: var(--text-primary); }

.landing-nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.landing-theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--glass-card-border);
  background: var(--glass-ghost-bg);
  color: var(--text-primary);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}
.landing-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid var(--glass-card-border);
  background: var(--glass-ghost-bg);
  color: var(--text-primary);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.landing-btn-ghost:hover {
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}
.landing-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  color: #ffffff;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(6, 182, 212, 0.3);
  transition: all 0.2s;
}
.landing-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(6, 182, 212, 0.45);
}

/* ── Main Content Container ───────────────── */
.landing-main {
  position: relative;
  z-index: 1;
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 28px 80px;
}

/* ── Hero Section ─────────────────────────── */
.landing-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  padding: 40px 0 80px;
}
.hero-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(6, 182, 212, 0.12);
  border: 1px solid rgba(6, 182, 212, 0.3);
  color: #06b6d4;
  font-size: 13px;
  font-weight: 700;
  width: fit-content;
}
.hero-badge-pulse {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #06b6d4;
  box-shadow: 0 0 8px #06b6d4;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { transform: scale(0.95); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.6; }
  100% { transform: scale(0.95); opacity: 1; }
}

.hero-title {
  font-size: 52px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -1.5px;
  margin: 0;
}
.gradient-text {
  background: linear-gradient(135deg, #06b6d4 0%, #f97316 35%, #10b981 70%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-description {
  font-size: 17px;
  color: var(--text-secondary);
  line-height: 1.65;
  margin: 0;
}
.hero-ctas {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.hero-btn-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  color: white;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(79, 70, 229, 0.35);
  transition: all 0.25s ease;
}
.hero-btn-main:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 36px rgba(6, 182, 212, 0.45);
}
.hero-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  border-radius: 14px;
  border: 1px solid var(--glass-card-border);
  background: var(--glass-ghost-bg);
  color: var(--text-primary);
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.hero-btn-secondary:hover {
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 16px;
  padding-top: 20px;
  border-top: 1px solid var(--glass-card-border);
}
.stat-pill {
  display: flex;
  flex-direction: column;
}
.stat-num {
  font-size: 22px;
  font-weight: 900;
  color: var(--text-primary);
}
.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}
.stat-divider {
  width: 1px;
  height: 28px;
  background: var(--glass-card-border);
}

/* ── Hero Live Visual Frame ────────────────── */
.hero-visual {
  position: relative;
}
.hero-card-frame {
  background: var(--glass-card-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
.frame-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--glass-card-border);
  gap: 10px;
}
.frame-dots {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.dot {
  width: 10px; height: 10px;
  border-radius: 50%;
}
.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #10b981; }
.frame-title {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.frame-tabs {
  display: flex;
  gap: 6px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid var(--glass-card-border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  flex-wrap: nowrap;
}
.frame-tabs::-webkit-scrollbar {
  display: none;
}
.frame-tab {
  flex: 1 0 auto;
  min-width: max-content;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.frame-tab.active {
  background: var(--glass-ghost-bg);
  box-shadow: var(--glass-card-shadow);
}
.frame-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 280px;
}
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.preview-tag {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid;
}
.preview-name {
  margin: 6px 0 0;
  font-size: 22px;
  font-weight: 800;
}
.preview-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
}
.preview-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

/* Mock Widgets */
.mock-widget {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}
.mock-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.mock-stat-card {
  background: var(--glass-ghost-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mock-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
}
.mock-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
}
.mock-value .unit {
  font-size: 12px;
  color: var(--text-muted);
}
.mock-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
  margin-top: 2px;
}
.mock-badge.normal { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.mock-badge.safe { background: rgba(16, 185, 129, 0.2); color: #10b981; }
.mock-badge.net { background: rgba(6, 182, 212, 0.2); color: #06b6d4; }
.mock-badge.logbook-badge { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }

.mock-item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--glass-ghost-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 14px;
  padding: 10px 14px;
}
.mock-icon-medical { color: #06b6d4; }
.mock-icon-car { color: #f97316; }
.mock-icon-expense { color: #10b981; }
.mock-icon-logbook { color: #8b5cf6; }

.mock-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.mock-item-info strong {
  font-size: 13px;
  color: var(--text-primary);
}
.mock-item-info span {
  font-size: 11px;
  color: var(--text-muted);
}
.mock-status-done {
  font-size: 11px;
  font-weight: 800;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
  padding: 3px 8px;
  border-radius: 6px;
}
.mock-status-upcoming {
  font-size: 11px;
  font-weight: 800;
  color: #f97316;
  background: rgba(249, 115, 22, 0.15);
  padding: 3px 8px;
  border-radius: 6px;
}
.mock-amount-out {
  font-size: 13px;
  font-weight: 800;
  color: #ef4444;
}
.mock-amount-in {
  font-size: 13px;
  font-weight: 800;
  color: #10b981;
}

.mock-vehicle-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--glass-ghost-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 14px;
  padding: 12px;
}
.mock-vehicle-thumb {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f97316, #fbbf24);
  color: #0b1020;
  display: grid;
  place-items: center;
}
.mock-vehicle-details h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
}
.mock-vehicle-details p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

/* ── Section Standard Styling ─────────────── */
.landing-section {
  padding: 80px 0;
}
.section-header {
  margin-bottom: 48px;
}
.section-header.center {
  text-align: center;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}
.section-eyebrow {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #06b6d4;
}
.section-title {
  font-size: 38px;
  font-weight: 800;
  letter-spacing: -0.8px;
  margin: 8px 0 12px;
}
.section-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* ── Branding Showcase Grid ──────────────── */
.branding-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.branding-card {
  background: var(--glass-card-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 20px;
  padding: 28px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.branding-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}
.branding-top-stripe {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
}
.branding-header {
  display: flex;
  align-items: center;
  gap: 14px;
}
.branding-icon-box {
  width: 54px; height: 54px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.branding-tag {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid;
  width: fit-content;
}
.branding-feature-name {
  margin: 4px 0 0;
  font-size: 22px;
  font-weight: 800;
}
.branding-swatch-row {
  display: flex;
  gap: 10px;
}
.swatch-pill {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  gap: 6px;
}
.swatch-pill code {
  font-family: monospace;
  opacity: 0.9;
}
.branding-rationale {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}
.branding-bullets {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.branding-bullets li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary);
}

/* ── Capabilities Section ────────────────── */
.capabilities-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.cap-card {
  background: var(--glass-card-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 18px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cap-icon {
  width: 50px; height: 50px;
  border-radius: 14px;
  display: grid;
  place-items: center;
}
.cap-icon.teal { background: rgba(6, 182, 212, 0.15); color: #06b6d4; }
.cap-icon.orange { background: rgba(249, 115, 22, 0.15); color: #f97316; }
.cap-icon.green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.cap-icon.purple { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }

.cap-card h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
}
.cap-card p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ── Security Section ────────────────────── */
.dark-accent-box {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.06), rgba(139, 92, 246, 0.06));
  border: 1px solid var(--glass-card-border);
  border-radius: 28px;
  padding: 48px;
}
.security-layout {
  display: grid;
  grid-template-columns: 1.3fr 0.7fr;
  gap: 36px;
  align-items: center;
}
.security-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 12px;
}
.security-title {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 12px;
}
.security-desc {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 24px;
}
.security-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.sec-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.sec-icon {
  color: #06b6d4;
  flex-shrink: 0;
  margin-top: 2px;
}
.sec-item strong {
  display: block;
  font-size: 15px;
  color: var(--text-primary);
}
.sec-item p {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.security-vis {
  display: flex;
  justify-content: center;
}
.sec-card-shield {
  background: var(--glass-card-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 24px;
  padding: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-shadow: var(--glass-card-shadow);
}
.shield-main-icon {
  color: #22c55e;
}
.sec-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 800;
  color: var(--text-primary);
}
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

/* ── FAQ Section ─────────────────────────── */
.faq-list {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.faq-item {
  background: var(--glass-card-bg);
  border: 1px solid var(--glass-card-border);
  border-radius: 16px;
  padding: 18px 22px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.faq-item:hover {
  border-color: rgba(255, 255, 255, 0.3);
}
.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 700;
}
.faq-answer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--glass-card-border);
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ── CTA Banner ──────────────────────────── */
.landing-cta-banner {
  margin-top: 60px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(6, 182, 212, 0.2));
  border: 1px solid var(--glass-card-border);
  border-radius: 28px;
  padding: 60px 28px;
  text-align: center;
  backdrop-filter: blur(10px);
}
.cta-inner {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.cta-inner h2 {
  font-size: 34px;
  font-weight: 900;
  margin: 0;
  letter-spacing: -0.6px;
}
.cta-inner p {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
}
.cta-btn-group {
  display: flex;
  gap: 14px;
  margin-top: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.landing-btn-primary.large,
.landing-btn-ghost.large {
  padding: 14px 28px;
  font-size: 15px;
  border-radius: 12px;
}

/* ── Footer ──────────────────────────────── */
.landing-footer {
  border-top: 1px solid var(--glass-card-border);
  background: rgba(5, 6, 10, 0.9);
  padding: 32px 28px;
  position: relative;
  z-index: 1;
}
.theme-light .landing-footer {
  background: rgba(238, 242, 255, 0.95);
}
.footer-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.footer-logo {
  width: 32px; height: 32px;
  border-radius: 8px;
  overflow: hidden;
}
.footer-logo img { width: 100%; height: 100%; object-fit: contain; }
.footer-title {
  font-size: 15px;
  font-weight: 800;
}
.footer-copy {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}
.footer-links {
  display: flex;
  gap: 20px;
}
.footer-links a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.footer-links a:hover { color: var(--text-primary); }

/* ── Responsive Queries ──────────────────── */
@media (max-width: 1024px) {
  .landing-hero { grid-template-columns: 1fr; gap: 36px; }
  .branding-grid { grid-template-columns: 1fr; }
  .capabilities-grid { grid-template-columns: repeat(2, 1fr); }
  .security-layout { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .landing-menu { display: none; }
  .hero-title { font-size: 34px; }
  .section-title { font-size: 26px; }
  .capabilities-grid { grid-template-columns: 1fr; }
  .landing-nav-container { padding: 0 16px; }
  .landing-main { padding: 20px 16px 60px; }
  .dark-accent-box { padding: 20px 16px; }
  .frame-body { padding: 18px; gap: 14px; }
  .preview-header { flex-wrap: wrap; gap: 8px; }
  .preview-name { font-size: 20px; }
}

@media (max-width: 480px) {
  .hero-card-frame { border-radius: 18px; }
  .frame-header { padding: 10px 14px; }
  .frame-title { font-size: 11px; max-width: 160px; }
  .frame-tabs { padding: 8px 10px; gap: 4px; }
  .frame-tab { padding: 6px 10px; font-size: 11px; }
  .frame-body { padding: 14px; gap: 12px; }
  .preview-name { font-size: 17px; }
  .preview-desc { font-size: 13px; }
  .preview-badge { font-size: 10px; padding: 3px 8px; }
  .mock-row { grid-template-columns: 1fr 1fr; gap: 8px; }
  .mock-stat-card { padding: 10px; }
  .mock-value { font-size: 15px; }
  .mock-item-row { padding: 8px 10px; gap: 8px; }
  .mock-item-info strong { font-size: 12px; }
}

@media (max-width: 360px) {
  .mock-row { grid-template-columns: 1fr; }
  .frame-title { max-width: 120px; }
}
</style>
