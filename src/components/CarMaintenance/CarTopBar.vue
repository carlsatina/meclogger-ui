<template>
<header class="car-topbar">
    <button
        v-if="leading !== 'none'"
        type="button"
        class="car-topbar-btn"
        :aria-label="leading === 'back' ? 'Go back' : 'Home'"
        @click="onLeading"
    >
        <mdicon :name="leading === 'back' ? 'arrow-left' : 'home'" :size="20"/>
    </button>
    <div class="car-topbar-text">
        <h1 class="car-topbar-title">{{ title }}</h1>
        <p v-if="subtitle" class="car-topbar-sub">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="car-topbar-actions">
        <slot name="actions"/>
    </div>
</header>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
    name: "CarTopBar",
    props: {
        title: { type: String, default: '' },
        subtitle: { type: String, default: '' },
        // 'home' | 'back' | 'none'
        leading: { type: String, default: 'home' },
        // where the home button navigates
        homeTo: { type: String, default: '/' }
    },
    emits: ['leading'],
    setup(props, { emit }) {
        const router = useRouter()
        const onLeading = () => {
            emit('leading')
            if (props.leading === 'back') {
                if (window.history.length > 1) router.back()
                else router.push('/car-maintenance')
            } else if (props.leading === 'home') {
                router.push(props.homeTo)
            }
        }
        return { onLeading }
    }
}
</script>

<style scoped>
.car-topbar {
    background: linear-gradient(135deg, #c2410c, #f97316);
    color: #0b1020;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    position: sticky;
    top: 0;
    z-index: 5;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}
.car-topbar-text { flex: 1; min-width: 0; }
.car-topbar-title {
    margin: 0; font-size: 17px; font-weight: 800; line-height: 1.2;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.car-topbar-sub {
    margin: 0; font-size: 12px; color: rgba(11, 16, 32, 0.8); line-height: 1.3;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.car-topbar-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.car-topbar-btn {
    border: 1px solid rgba(11, 16, 32, 0.18);
    background: rgba(255, 255, 255, 0.18);
    color: #0b1020;
    padding: 7px;
    border-radius: 10px;
    display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0; cursor: pointer;
    transition: transform 0.12s, background 0.12s;
}
.car-topbar-btn:active { transform: scale(0.92); }

/* Style buttons passed into the actions slot consistently */
.car-topbar-actions :slotted(button) {
    border: 1px solid rgba(11, 16, 32, 0.18);
    background: rgba(255, 255, 255, 0.18);
    color: #0b1020;
    padding: 7px;
    border-radius: 10px;
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: transform 0.12s, background 0.12s;
}
.car-topbar-actions :slotted(button:active) { transform: scale(0.92); }
</style>
