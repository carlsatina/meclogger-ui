<template>
  <div class="mobile-nav shadow glass-nav-orb">
    <div class="bloc-icon w-100">
      <router-link to="/"  class="icon w-100 p-3 text-center">
        <mdicon name="home-outline" size="30"/><br>
        <!-- <span>Qfind</span> -->
      </router-link>
    </div>

    <div class="bloc-icon w-100" v-if="store.state.isUserAdmin">
      <router-link to="/" class="icon w-100 p-3 text-center">
        <mdicon name="folder-plus"  size="30"/><br>
        <!-- <span>Service Requests</span> -->
      </router-link>
    </div>
    <div class="bloc-icon w-100" v-else>
      <router-link to="/" class="icon w-100 p-3 text-center">
        <mdicon name="playlist-check" size="30" /><br>
        <!-- <span>Services</span> -->
      </router-link>
    </div>

    <div class="bloc-icon w-100">
      <router-link to="/" class="icon w-100 p-3 text-center" :class="route.name === 'subCategories' || route.name === 'categoryResults' ? 'router-link-active':''">
        <mdicon name="magnify" size="30" /><br>
        <!-- <span>Services</span> -->
      </router-link>
    </div>
    
  </div>
</template>

<script>
import { ref, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import store from '@/store'

export default {
  name: 'BottomNav',
  setup() {
    provide('store', store)
    const route = useRoute()

    return {
        store,
        route
    }
  }
}
</script>

<style scoped>
.mobile-nav {
  background: var(--glass-ghost-bg);
  position: fixed;
  bottom: 0;
  height: 65px;
  width: 100%;
  display: flex;
  justify-content: space-around;
  border-top: 1px solid var(--glass-card-border);
  backdrop-filter: blur(10px);
  z-index: 900;
}

.bloc-icon {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--text-primary);
  font-size: 12px;
}

a.router-link-active {
  border-top: 2px;
  color: var(--accent-1);
  border-top-style: solid;
  width: 100%;
}

/* @media screen and (min-width: 600px) {
  .mobile-nav {
    display: none;
  }
} */

.icon{
  color: var(--text-primary);
  text-decoration: none;
}
</style>
