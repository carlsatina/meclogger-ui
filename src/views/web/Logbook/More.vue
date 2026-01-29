<template>
<div class="logbook-page">
    <LogbookTopNav
        variant="web"
        title="More"
        subtitle="Quick access to renters, savings, and borrowed tools."
        icon="dots-horizontal"
    />

    <section class="logbook-section">
        <div class="section-head">
            <h3>Renters</h3>
            <p>Manage renter profiles and statuses.</p>
        </div>
        <div class="glass-card action-card" @click="goToAddRenter">
            <div class="info-icon">
                <mdicon name="account-plus-outline" size="20"/>
            </div>
            <div>
                <h4>Add renter</h4>
                <p>Create a new renter profile for your logbook.</p>
            </div>
            <mdicon name="chevron-right" size="20"/>
        </div>
    </section>

    <section class="logbook-section">
        <div class="section-head">
            <h3>Savings &amp; Borrowed</h3>
            <p>Track savings and borrowed records without affecting balances.</p>
        </div>
        <div class="glass-card action-card" @click="goToSavings">
            <div class="info-icon">
                <mdicon name="piggy-bank-outline" size="20"/>
            </div>
            <div>
                <h4>Add savings</h4>
                <p>Record a new savings entry.</p>
            </div>
            <mdicon name="chevron-right" size="20"/>
        </div>
        <div class="glass-card action-card" @click="goToSavingsHistory">
            <div class="info-icon">
                <mdicon name="history" size="20"/>
            </div>
            <div>
                <h4>Savings history</h4>
                <p>Review your saved entries.</p>
            </div>
            <mdicon name="chevron-right" size="20"/>
        </div>
        <div class="glass-card action-card" @click="goToBorrowed">
            <div class="info-icon">
                <mdicon name="hand-coin-outline" size="20"/>
            </div>
            <div>
                <h4>Add borrowed</h4>
                <p>Log borrowed money and repayments.</p>
            </div>
            <mdicon name="chevron-right" size="20"/>
        </div>
        <div class="glass-card action-card" @click="goToBorrowedHistory">
            <div class="info-icon">
                <mdicon name="history" size="20"/>
            </div>
            <div>
                <h4>Borrowed history</h4>
                <p>Review all borrowed records.</p>
            </div>
            <mdicon name="chevron-right" size="20"/>
        </div>
        <div class="glass-card action-card" @click="goToImport">
            <div class="info-icon">
                <mdicon name="cloud-upload-outline" size="20"/>
            </div>
            <div>
                <h4>Import</h4>
                <p>Upload a CSV file and preview your data.</p>
            </div>
            <mdicon name="chevron-right" size="20"/>
        </div>
    </section>

    <section class="logbook-section">
        <div class="section-head">
            <h3>More tools</h3>
            <p>Exports and automation are coming soon.</p>
        </div>
        <div class="glass-card info-card">
            <div class="info-icon">
                <mdicon name="cog-outline" size="20"/>
            </div>
            <div>
                <h4>More tools coming soon</h4>
                <p>We will add export, reminders, and custom templates here.</p>
            </div>
        </div>
    </section>

    <LogbookBottomNav variant="web" />
</div>
</template>

<script>
import { useRouter } from 'vue-router'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

export default {
    name: "LogbookMoreWeb",
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

<style scoped src="@/assets/styles/logbook/subpage-web.css"></style>
