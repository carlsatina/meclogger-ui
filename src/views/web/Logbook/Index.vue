<template>
<div class="logbook-page">
    <LogbookTopNav
        variant="web"
        title="Daily notes in one place"
        subtitle="Capture highlights across health, vehicles, and finances with a single timeline."
        icon="book-open-page-variant"
    />

    <section class="logbook-section">
        <div class="section-head">
            <h3>Quick prompts</h3>
            <p>Start a new entry with a focused template.</p>
        </div>
        <div class="prompt-grid">
            <article v-for="prompt in prompts" :key="prompt.title" class="glass-card prompt-card">
                <div class="prompt-icon">
                    <mdicon :name="prompt.icon" size="22"/>
                </div>
                <div>
                    <h4>{{ prompt.title }}</h4>
                    <p>{{ prompt.description }}</p>
                </div>
            </article>
        </div>
    </section>

    <section class="logbook-section">
        <div class="section-head">
            <h3>Latest entries</h3>
            <p>Entries will appear here once you start writing.</p>
        </div>
        <div class="glass-card empty-state">
            <mdicon name="note-text-outline" size="26"/>
            <div>
                <p class="empty-title">No logbook entries yet</p>
                <p class="empty-sub">Use a quick prompt to capture your first note.</p>
            </div>
        </div>
    </section>

    <LogbookBottomNav variant="web" />
</div>
</template>

<script>
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

export default {
    name: "LogbookWeb",
    components: {
        LogbookBottomNav,
        LogbookTopNav
    },
    setup() {
        const prompts = [
            { title: 'Daily Snapshot', description: 'Sum up health, mood, and wins for today.', icon: 'calendar-check-outline' },
            { title: 'Vehicle Notes', description: 'Log mileage, fuel, and service reminders.', icon: 'car-outline' },
            { title: 'Money Log', description: 'Track budget highlights and unexpected costs.', icon: 'cash-multiple' },
            { title: 'Family Notes', description: 'Capture appointments and shared updates.', icon: 'account-group-outline' }
        ]

        return {
            prompts
        }
    }
}
</script>

<style scoped>
.logbook-page {
    min-height: 100vh;
    padding: 26px 24px 120px;
    background: var(--home-bg-web);
    color: var(--text-primary);
}

.logbook-section {
    margin-top: 28px;
}

.section-head {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 14px;
}

.section-head h3 {
    margin: 0;
    font-size: 20px;
}

.section-head p {
    margin: 0;
    color: var(--text-secondary);
}

.prompt-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
}

.prompt-card {
    padding: 16px;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    align-items: start;
}

.prompt-card h4 {
    margin: 0;
    font-size: 16px;
    color: var(--text-primary);
}

.prompt-card p {
    margin: 6px 0 0;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.4;
}

.prompt-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #22c55e, #38bdf8);
    color: #0b1020;
    display: grid;
    place-items: center;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
}

.empty-state {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px;
}

.empty-title {
    margin: 0;
    font-weight: 600;
    color: var(--text-primary);
}

.empty-sub {
    margin: 4px 0 0;
    color: var(--text-secondary);
    font-size: 14px;
}

@media (max-width: 640px) {
    .logbook-page {
        padding: 20px 16px 40px;
    }
}
</style>
