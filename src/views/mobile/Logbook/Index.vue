<template>
<div class="logbook-shell">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <LogbookTopNav
        variant="mobile"
        title="Capture the day"
        subtitle="A single place for daily notes and highlights."
        icon="book-open-page-variant"
    />

    <section class="logbook-list">
        <article v-for="prompt in prompts" :key="prompt.title" class="glass-card logbook-item">
            <div class="item-icon">
                <mdicon :name="prompt.icon" size="20"/>
            </div>
            <div>
                <h3>{{ prompt.title }}</h3>
                <p>{{ prompt.description }}</p>
            </div>
        </article>
    </section>

    <section class="glass-card empty-state">
        <mdicon name="note-text-outline" size="26"/>
        <div>
            <p class="empty-title">No entries yet</p>
            <p class="empty-sub">Start with a quick prompt to log your first note.</p>
        </div>
    </section>

    <LogbookBottomNav variant="mobile" />
</div>
</template>

<script>
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

export default {
    name: "LogbookMobile",
    components: {
        LogbookBottomNav,
        LogbookTopNav
    },
    setup() {
        const prompts = [
            { title: 'Daily Snapshot', description: 'Sum up health, mood, and wins for today.', icon: 'calendar-check-outline' },
            { title: 'Vehicle Notes', description: 'Track mileage, fuel, and service reminders.', icon: 'car-outline' },
            { title: 'Money Log', description: 'Capture budget highlights and extra costs.', icon: 'cash-multiple' },
            { title: 'Family Notes', description: 'Keep appointments and shared updates.', icon: 'account-group-outline' }
        ]

        return {
            prompts
        }
    }
}
</script>

<style scoped>
.logbook-shell {
    position: relative;
    min-height: 100vh;
    padding: 18px 16px 120px;
    background: var(--home-bg-mobile);
    color: var(--text-primary);
    overflow: hidden;
}

.bg-orb {
    position: absolute;
    filter: blur(50px);
    opacity: 0.35;
    z-index: 0;
}

.orb-1 {
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: linear-gradient(135deg, #22c55e, #38bdf8);
    top: -100px;
    left: -80px;
}

.orb-2 {
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: linear-gradient(135deg, #14b8a6, #a855f7);
    bottom: -80px;
    right: -60px;
}

.logbook-list {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 12px;
    margin-top: 16px;
}

.logbook-item {
    padding: 14px;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    align-items: start;
}

.item-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, #22c55e, #38bdf8);
    color: #0b1020;
    display: grid;
    place-items: center;
}

.logbook-item h3 {
    margin: 0;
    font-size: 15px;
    color: var(--text-primary);
}

.logbook-item p {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.4;
}

.empty-state {
    position: relative;
    z-index: 1;
    margin-top: 18px;
    padding: 16px;
    display: flex;
    gap: 10px;
    align-items: center;
}

.empty-title {
    margin: 0;
    font-weight: 600;
}

.empty-sub {
    margin: 4px 0 0;
    color: var(--text-secondary);
    font-size: 13px;
}

</style>
