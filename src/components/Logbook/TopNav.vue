<template>
  <header class="logbook-top-nav glass-nav-orb" :class="variant">
    <button class="icon-btn" type="button" @click="router.push('/')">
      <mdicon name="home-outline" size="20"/>
    </button>
    <div class="title-group">
      <p class="eyebrow">Logbook</p>
      <h3 class="title">{{ title }}</h3>
      <p v-if="subtitle" class="sub">{{ subtitle }}</p>
    </div>
    <div class="nav-action">
      <button
        v-if="actionIcon"
        class="nav-action-btn"
        type="button"
        :aria-label="actionLabel || 'Action'"
        :title="actionLabel || ''"
        @click="$emit('action')"
      >
        <mdicon :name="actionIcon" size="20"/>
      </button>
      <div v-else-if="icon" class="nav-icon">
        <mdicon :name="icon" size="20"/>
      </div>
    </div>
  </header>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: "LogbookTopNav",
  emits: ['action'],
  props: {
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    actionIcon: {
      type: String,
      default: ''
    },
    actionLabel: {
      type: String,
      default: ''
    },
    variant: {
      type: String,
      default: 'web'
    }
  },
  setup() {
    const router = useRouter()
    return { router }
  }
}
</script>

<style scoped>
.logbook-top-nav {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--glass-card-border);
  background: var(--glass-ghost-bg);
  color: var(--text-primary);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 2;
}

.logbook-top-nav.mobile {
  padding: 10px 14px;
  gap: 10px;
}

.icon-btn {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  border: 1px solid var(--glass-card-border);
  background: var(--glass-ghost-bg);
  color: var(--text-primary);
  cursor: pointer;
}

.logbook-top-nav.mobile .icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
}

.title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.logbook-top-nav.mobile .title-group {
  gap: 1px;
}

.eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.logbook-top-nav.mobile .eyebrow {
  display: none;
}

.title {
  margin: 0;
  font-size: 22px;
  letter-spacing: -0.3px;
}

.logbook-top-nav.mobile .title {
  font-size: 16px;
  letter-spacing: -0.2px;
}

.sub {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.logbook-top-nav.mobile .sub {
  font-size: 11px;
}

.nav-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #22c55e, #38bdf8);
  display: grid;
  place-items: center;
  color: #0b1020;
  box-shadow: 0 10px 18px rgba(34, 197, 94, 0.25);
}

.logbook-top-nav.mobile .nav-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  box-shadow: 0 6px 12px rgba(34, 197, 94, 0.2);
}

.nav-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.nav-action-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid var(--glass-card-border);
  background: var(--glass-ghost-bg);
  color: var(--text-primary);
  display: grid;
  place-items: center;
  cursor: pointer;
}

.logbook-top-nav.mobile .nav-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
}
</style>
