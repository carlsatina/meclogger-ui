<template>
<div class="expense-tracking-container">
    <div class="header">
        <div class="d-flex align-items-center mb-4">
            <mdicon name="chevron-left" size="30" @click="router.push('/')" style="cursor: pointer;"/>
            <h2 class="ms-3 mb-0">Expense Tracking</h2>
        </div>
    </div>

    <div class="content">
        <p class="text-center text-muted">Expense Tracking feature coming soon...</p>
        <p class="text-center">Monitor spending, manage budgets, and track financial goals.</p>
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
</style>
