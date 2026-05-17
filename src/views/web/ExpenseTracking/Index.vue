<template>
<div class="expense-tracking-container">
    <div class="header">
        <div class="d-flex align-items-center mb-4">
            <mdicon name="chevron-left" size="30" @click="router.push('/')" style="cursor: pointer;"/>
            <h2 class="ms-3 mb-0">Expense Tracking</h2>
        </div>
    </div>

    <div class="content">
        <p class="text-center text-muted mb-4">Expense Tracking feature coming soon...</p>
        <p class="text-center mb-5">Monitor spending, manage budgets, and track financial goals.</p>
        <div class="d-flex justify-content-center">
            <div class="ai-link-card" @click="router.push('/expense-tracking/web/insights')">
                <div class="ai-link-icon">
                    <mdicon name="robot-outline" :size="28" />
                </div>
                <div>
                    <p class="ai-link-title">AI Spending Insights</p>
                    <p class="ai-link-sub">Budget alerts · Category trends · Recommendations</p>
                </div>
                <mdicon name="chevron-right" :size="20" style="color: #94a3b8; flex-shrink: 0;" />
            </div>
        </div>
    </div>
</div>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
    name: "ExpenseTrackingWeb",
    setup() {
        const router = useRouter()

        return {
            router
        }
    }
}
</script>

<style scoped>
.expense-tracking-container {
    padding: 30px;
    min-height: 80vh;
}

.header h2 {
    color: #2c3e50;
    font-weight: 600;
}

.content {
    margin-top: 50px;
}

.ai-link-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 24px;
    background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(34,197,94,0.05));
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 16px;
    cursor: pointer;
    max-width: 480px;
    width: 100%;
    transition: background 0.15s;
}
.ai-link-card:hover { background: linear-gradient(135deg, rgba(99,102,241,0.14), rgba(34,197,94,0.09)); }
.ai-link-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: rgba(99,102,241,0.15);
    color: #818cf8;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.ai-link-title { font-size: 16px; font-weight: 700; color: #2c3e50; margin: 0; }
.ai-link-sub   { font-size: 13px; color: #64748b; margin: 3px 0 0; }
</style>
