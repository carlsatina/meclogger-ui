<template>
<div class="logbook-shell">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <LogbookTopNav
        variant="mobile"
        title="More"
        subtitle="Renters, savings, and borrowed tools."
        icon="dots-horizontal"
    />

    <section class="logbook-section">
        <article class="glass-card action-card" @click="goToAddRenter">
            <div class="info-icon">
                <mdicon name="account-plus-outline" size="20"/>
            </div>
            <div>
                <h3>Add renter</h3>
                <p>Create a new renter profile for your logbook.</p>
            </div>
            <mdicon name="chevron-right" size="20"/>
        </article>
    </section>

    <section class="logbook-section">
        <article class="glass-card action-card" @click="goToSavings">
            <div class="info-icon">
                <mdicon name="piggy-bank-outline" size="20"/>
            </div>
            <div>
                <h3>Add savings</h3>
                <p>Record a new savings entry.</p>
            </div>
            <mdicon name="chevron-right" size="20"/>
        </article>
        <article class="glass-card action-card" @click="goToSavingsHistory">
            <div class="info-icon">
                <mdicon name="history" size="20"/>
            </div>
            <div>
                <h3>Savings history</h3>
                <p>Review your saved entries.</p>
            </div>
            <mdicon name="chevron-right" size="20"/>
        </article>
        <article class="glass-card action-card" @click="goToBorrowed">
            <div class="info-icon">
                <mdicon name="hand-coin-outline" size="20"/>
            </div>
            <div>
                <h3>Add borrowed</h3>
                <p>Log borrowed money and repayments.</p>
            </div>
            <mdicon name="chevron-right" size="20"/>
        </article>
        <article class="glass-card action-card" @click="goToBorrowedHistory">
            <div class="info-icon">
                <mdicon name="history" size="20"/>
            </div>
            <div>
                <h3>Borrowed history</h3>
                <p>Review all borrowed records.</p>
            </div>
            <mdicon name="chevron-right" size="20"/>
        </article>
        <article class="glass-card action-card" @click="goToImport">
            <div class="info-icon">
                <mdicon name="cloud-upload-outline" size="20"/>
            </div>
            <div>
                <h3>Import</h3>
                <p>Upload a CSV file and preview your data.</p>
            </div>
            <mdicon name="chevron-right" size="20"/>
        </article>
    </section>

    <section class="logbook-section">
        <article class="glass-card info-card">
            <div class="info-icon">
                <mdicon name="cog-outline" size="20"/>
            </div>
            <div>
                <h3>More tools coming soon</h3>
                <p>We will add exports and automation here.</p>
            </div>
        </article>
    </section>

    <LogbookBottomNav variant="mobile" />
</div>
</template>

<script>
import { useRouter } from 'vue-router'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

export default {
    name: "LogbookMoreMobile",
    components: {
        LogbookBottomNav,
        LogbookTopNav
    },
    setup() {
        const router = useRouter()
        const goToAddRenter = () => router.push('/logbook/renter')
        const goToSavings = () => router.push('/logbook/savings')
        const goToSavingsHistory = () => router.push('/logbook/savings-history')
        const goToBorrowed = () => router.push('/logbook/borrowed')
        const goToBorrowedHistory = () => router.push('/logbook/borrowed-history')
        const goToImport = () => router.push('/logbook/import')

        return {
            goToAddRenter,
            goToSavings,
            goToSavingsHistory,
            goToBorrowed,
            goToBorrowedHistory,
            goToImport
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-mobile.css"></style>
