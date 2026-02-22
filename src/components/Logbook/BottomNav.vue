<template>
  <nav class="logbook-bottom-nav glass-nav-orb" :class="{ 'full-width': isMobile }" :style="navStyle">
    <button
      v-for="item in items"
      :key="item.path"
      class="nav-item"
      :class="{ active: route.path === item.path }"
      type="button"
      @click="router.push(item.path)"
    >
      <mdicon :name="item.icon" size="18"/>
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>

<script>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: "LogbookBottomNav",
  props: {
    variant: {
      type: String,
      default: 'web'
    }
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const items = [
      { label: 'Payment', icon: 'credit-card-outline', path: '/logbook/payment' },
      { label: 'Reports', icon: 'chart-line', path: '/logbook/reports' },
      { label: 'Renters', icon: 'account-group-outline', path: '/logbook/renters-list' },
      { label: 'History', icon: 'history', path: '/logbook/history' },
      { label: 'More', icon: 'dots-horizontal', path: '/logbook/more' }
    ]

    const isMobile = computed(() => props.variant === 'mobile')

    const navStyle = computed(() => {
      return {
        '--nav-side': isMobile.value ? '0px' : '24px',
        '--nav-bottom': isMobile.value ? '0px' : '18px',
        '--nav-pad': isMobile.value ? '10px 12px' : '10px 12px',
        '--nav-font': isMobile.value ? '11px' : '12px'
      }
    })

    return {
      route,
      router,
      items,
      navStyle,
      isMobile
    }
  }
}
</script>

<style scoped>
.logbook-bottom-nav {
  position: fixed;
  left: var(--nav-side);
  right: var(--nav-side);
  bottom: calc(var(--nav-bottom) + var(--safe-bottom));
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  padding: var(--nav-pad);
  padding-bottom: calc(10px + var(--safe-bottom));
  border-radius: 18px;
  border: 1px solid var(--glass-card-border);
  background: var(--glass-ghost-bg);
  backdrop-filter: blur(12px);
  z-index: 10;
}

.logbook-bottom-nav.full-width {
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-bottom: none;
}

.nav-item {
  border: none;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: var(--nav-font);
  font-weight: 600;
  cursor: pointer;
}

.nav-item span {
  letter-spacing: 0.2px;
}

.nav-item.active {
  color: var(--accent-2);
}
</style>
