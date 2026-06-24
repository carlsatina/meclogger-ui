<template>
<div class="page expense-theme stagger-page" :class="{ 'stagger-ready': pageReady }">
    <header class="top-nav">
        <button class="icon-btn" @click="router.push('/')">
            <mdicon name="home-outline" size="24" />
        </button>
        <div class="title-group">
            <p class="eyebrow">My wallet</p>
            <h3>Expense Tracking</h3>
        </div>
        <button class="icon-btn" @click="openSearch" aria-label="Search">
            <mdicon name="magnify" size="24" />
        </button>
    </header>

    <!-- Quick-add prompt bar -->
    <div class="quick-add-bar" :class="{ 'qa-loading': quickAdding, 'qa-done': quickAddDone, 'qa-error': !!quickAddError }">
        <mdicon v-if="quickAdding" name="loading" :size="18" class="spin qa-spinner"/>
        <mdicon v-else-if="quickAddDone" name="check-circle-outline" :size="18" class="qa-ok-icon"/>
        <mdicon v-else name="creation" :size="18" class="qa-spark"/>
        <input
            ref="qaInput"
            v-model="quickAddText"
            class="qa-input"
            :placeholder="quickAddDone ? quickAddFeedback : quickAddError || 'e.g. myjoy 650'"
            :disabled="quickAdding"
            @keydown.enter="submitQuickAdd"
            @focus="quickAddError = ''; quickAddDone = false"
            maxlength="120"
        />
        <button v-if="quickAddText.trim() && !quickAdding" class="qa-send-btn" @click="submitQuickAdd">
            <mdicon name="send" :size="16"/>
        </button>
    </div>

    <!-- HOME TAB -->
    <main class="content dash-home" v-if="activeTab === 'home'">
        <div class="dash-orb orb-1"></div>
        <div class="dash-orb orb-2"></div>

        <!-- Hero: month total + category breakdown -->
        <div class="dash-hero glass-card stagger-seq">
            <div class="dash-hero-top">
                <div>
                    <p class="dash-period">{{ currentMonthName }}</p>
                    <h2 class="dash-total">{{ formatMoney(defaultCurrency, currentMonthTotal) }}</h2>
                    <p class="dash-change" :class="monthChangeCls">{{ monthChangeLabel }}</p>
                </div>
                <button class="dash-add-btn slide-up" @click="openExpenseSheet">
                    <mdicon name="plus" :size="20"/>
                </button>
            </div>
            <template v-if="categoryBreakdown.length">
                <div class="cat-seg-bar">
                    <div
                        v-for="cat in categoryBreakdown.slice(0, 5)"
                        :key="cat.id || cat.name"
                        class="cat-seg"
                        :style="{ width: cat.percentLabel, background: cat.color || '#6366f1' }"
                    ></div>
                </div>
                <div class="cat-legend">
                    <div class="cat-legend-item" v-for="cat in categoryBreakdown.slice(0, 4)" :key="cat.id || cat.name">
                        <span class="cat-leg-dot" :style="{ background: cat.color || '#6366f1' }"></span>
                        <span class="cat-leg-name">{{ cat.name }}</span>
                        <span class="cat-leg-pct">{{ cat.percentLabel }}</span>
                    </div>
                </div>
            </template>
            <p class="dash-no-data" v-else>No expenses logged this month yet.</p>
        </div>

        <!-- Stats row: budgets + subscriptions -->
        <div class="dash-stats-row slide-up">
            <div class="dash-stat-card glass-card">
                <div class="dsc-top">
                    <div class="dsc-icon dsc-purple"><mdicon name="wallet-outline" :size="16"/></div>
                    <span class="dsc-label">Budgets</span>
                </div>
                <p class="dsc-value" v-if="budgets.length">{{ activeBudgetAmount }}</p>
                <p class="dsc-value dsc-empty" v-else>—</p>
                <p class="dsc-sub" v-if="budgets.length">{{ budgets.length }} active</p>
                <button class="dsc-cta" v-else @click="openBudgetSheet">+ Set up budget</button>
            </div>
            <div class="dash-stat-card glass-card" @click="setTab('schedules')">
                <div class="dsc-top">
                    <div class="dsc-icon dsc-teal"><mdicon name="reload" :size="16"/></div>
                    <span class="dsc-label">Subscriptions</span>
                </div>
                <p class="dsc-value">{{ formatMoney(defaultCurrency, subscriptionTotal) }}</p>
                <p class="dsc-sub" v-if="schedules.length">{{ schedules.length }} active</p>
                <p class="dsc-sub dsc-hint" v-else>Tap to manage</p>
            </div>
        </div>

        <!-- Budget usage (only if budgets exist) -->
        <div class="dash-budget-card glass-card slide-up" v-if="budgets.length">
            <div class="dbc-head">
                <span class="dbc-title">Budget usage</span>
                <button class="dbc-new-btn" @click="openBudgetSheet">
                    <mdicon name="plus-circle" :size="14"/> New
                </button>
            </div>
            <div class="dbc-item" v-for="b in budgets.slice(0, 3)" :key="b.id">
                <div class="dbc-row">
                    <span class="dbc-name">{{ b.name }}</span>
                    <span class="dbc-pct" :class="budgetPctClass(b)">{{ budgetProgress(b) }}</span>
                </div>
                <div class="progress slim" style="margin: 5px 0 2px">
                    <div class="bar" :class="budgetPctClass(b)" :style="{ width: budgetProgress(b) }"></div>
                </div>
                <div class="dbc-amounts">
                    <span class="dbc-amt">{{ formatMoney(b.currency || defaultCurrency, b.spent || 0) }} spent</span>
                    <span class="dbc-amt">of {{ formatMoney(b.currency || defaultCurrency, b.amount) }}</span>
                </div>
            </div>
        </div>

        <!-- Recent activity -->
        <div class="dash-section-head">
            <h4 class="dash-section-title">Recent activity</h4>
            <button class="dash-see-all" @click="setTab('transactions')">See all →</button>
        </div>

        <div class="dash-activity-card glass-card slide-up" v-if="expenses.length">
            <div class="dai-item" v-for="exp in expenses.slice(0, 5)" :key="exp.id">
                <div class="icon-circle dai-icon"
                    :style="{ '--cat-color': exp.categoryColor || '#6366f1' }"
                >
                    <mdicon :name="exp.categoryIcon || 'cash-multiple'" size="18" />
                </div>
                <div class="dai-body">
                    <p class="dai-title">{{ exp.title }}</p>
                    <p class="dai-date">{{ formatDate(exp.expenseDate) }}</p>
                </div>
                <span class="dai-amount">{{ formatMoney(defaultCurrency, exp.amount) }}</span>
            </div>
        </div>
        <div class="dash-activity-card glass-card dash-no-data-card slide-up" v-else>
            <p>No expenses yet — use the quick-add bar or tap + to log one.</p>
        </div>

        <!-- Quick actions -->
        <div class="dash-quick-row slide-up">
            <button class="dash-quick-btn" @click="setTab('insights')">
                <div class="dqb-icon dqb-indigo"><mdicon name="chart-bar" :size="20"/></div>
                <span class="dqb-label">Insights</span>
            </button>
            <button class="dash-quick-btn" @click="router.push('/expense-tracking/insights')">
                <div class="dqb-icon dqb-green"><mdicon name="robot-outline" :size="20"/></div>
                <span class="dqb-label">AI Analysis</span>
            </button>
        </div>
    </main>


    <!-- SCHEDULES TAB -->
    <main class="content sched-page" v-else-if="activeTab === 'schedules'">
        <!-- Hero -->
        <div class="sched-hero glass-card slide-up">
            <div>
                <p class="sched-hero-label">Upcoming</p>
                <h2 class="sched-hero-total">{{ formatMoney(defaultCurrency, scheduleTotal) }}</h2>
                <p class="sched-hero-sub">{{ filteredSchedules.length }} scheduled items</p>
            </div>
            <button class="dash-add-btn" @click="openScheduleSheet">
                <mdicon name="plus" :size="20"/>
            </button>
        </div>

        <!-- Toggle -->
        <div class="sched-toggle slide-up">
            <button class="sched-tab" :class="{ active: scheduleFilter === 'subscriptions' }" @click="scheduleFilter = 'subscriptions'">
                <mdicon name="reload" :size="15"/>
                Subscriptions
            </button>
            <button class="sched-tab" :class="{ active: scheduleFilter === 'expenses' }" @click="scheduleFilter = 'expenses'">
                <mdicon name="calendar-clock" :size="15"/>
                Expenses
            </button>
        </div>

        <!-- List -->
        <div class="sched-list stagger-seq" v-if="filteredSchedules.length">
            <div class="sched-card glass-card slide-up" v-for="item in filteredSchedules" :key="item.id">
                <div class="sched-card-main">
                    <div class="icon-circle sched-icon" :style="{ '--cat-color': item.iconBg || 'var(--text-primary)' }">
                        <mdicon :name="item.icon" size="20" />
                    </div>
                    <div class="sched-info">
                        <p class="sched-name">{{ item.title }}</p>
                        <p class="sched-meta">{{ item.subtitle }}</p>
                    </div>
                    <div class="sched-right">
                        <p class="sched-amount">{{ item.amount }}</p>
                        <p class="sched-due" :class="{ 'sched-due-overdue': item.when === 'Overdue', 'sched-due-today': item.when === 'Due today' }">{{ item.when }}</p>
                    </div>
                </div>
                <div class="sched-card-footer">
                    <button class="sched-act-btn" @click="startEditSchedule(item)">
                        <mdicon name="pencil-outline" :size="14"/>
                        Edit
                    </button>
                    <button class="sched-act-btn danger" @click="removeSchedule(item)">
                        <mdicon name="trash-can-outline" :size="14"/>
                        Delete
                    </button>
                    <button
                        v-if="scheduleFilter === 'subscriptions'"
                        class="sched-pay-btn"
                        :class="{ paid: item.paid }"
                        @click="startPaySubscription(item)"
                    >
                        <mdicon :name="item.paid ? 'check-circle' : 'cash-check'" :size="14"/>
                        {{ item.paid ? 'Paid' : 'Pay now' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Empty state -->
        <div class="sched-empty slide-up" v-else>
            <mdicon name="calendar-blank-outline" :size="40" class="sched-empty-icon"/>
            <p class="sched-empty-title">No {{ scheduleFilter }} yet</p>
            <p class="sched-empty-sub">Tap + to set up your first schedule</p>
        </div>
    </main>

    <!-- TRANSACTIONS TAB -->
    <main class="content" v-else-if="activeTab === 'transactions'">
        <section class="transactions-header slide-up">
            <transition name="month-slide-nav" mode="out-in">
                <div class="months" :key="viewMonthKey" @touchstart="onMonthTouchStart" @touchend="onMonthTouchEnd">
                    <span class="month muted" @click="changeMonth(-1)">{{ monthLabel(-1) }}</span>
                    <span class="month current">{{ monthLabel(0) }}</span>
                    <span class="month muted" @click="changeMonth(1)">{{ monthLabel(1) }}</span>
                </div>
            </transition>
            <div class="filter-row pill-row slide-up">
                <button
                    type="button"
                    class="pill-option compact"
                    :class="{ active: !budgetFilterId }"
                    @click="budgetFilterId = ''"
                >
                    <mdicon name="filter-outline" size="16" />
                    <span>All budgets</span>
                </button>
                <button
                    v-for="b in budgets"
                    :key="b.id"
                    type="button"
                    class="pill-option compact"
                    :class="{ active: budgetFilterId === b.id }"
                    @click="budgetFilterId = b.id"
                >
                    <mdicon name="wallet-outline" size="16" />
                    <span>{{ b.name }}</span>
                </button>
            </div>
        </section>
        <transition :name="monthSlideName" mode="out-in">
            <div
                class="transactions-pane slide-up"
                :key="viewMonthKey"
                @touchstart="onMonthTouchStart"
                @touchend="onMonthTouchEnd"
            >
                <div v-if="budgetSummaryPill" class="budget-pill slide-up" @click="setTab('home')">
                    <div>
                        <p class="micro muted">Budget status</p>
                        <p class="item-title">
                            {{ budgetSummaryPill.label }}
                        </p>
                    </div>
                    <div class="budget-pill-progress">
                        <div class="bar" :style="{ width: budgetSummaryPill.percent }"></div>
                    </div>
                </div>

                <section class="transactions-list section stagger-seq" v-if="transactionsForMonth.length > 0">
                    <div v-for="group in groupedTransactions" :key="group.label" class="tx-group">
                        <div class="tx-group-header">
                            <span class="tx-group-label">{{ group.label }}</span>
                            <span class="tx-group-count">{{ group.items.length }}</span>
                        </div>
                        <transition-group name="list-fade" tag="div">
                            <div class="tx-entry" v-for="exp in group.items" :key="exp.id">
                                <div
                                    class="item compact-item mt-1 slide-up tx-row"
                                    :class="{ clickable: !exp.planned, expanded: expandedTxnId === exp.id }"
                                    @click="toggleTxnDetail(exp)"
                                >
                                    <div class="icon-circle"
                                        :style="{ '--cat-color': exp.categoryColor || 'var(--text-primary)' }"
                                    >
                                        <mdicon :name="exp.categoryIcon || 'cash-multiple'" size="20" />
                                    </div>
                                    <div class="item-main">
                                        <p class="item-title">{{ exp.title }}</p>
                                    </div>
                                    <div class="tx-amount-wrap">
                                        <div class="item-amount" :class="{ planned: exp.planned }">
                                            {{ formatMoney(defaultCurrency, exp.amount) }}
                                        </div>
                                        <button
                                            v-if="exp.planned"
                                            class="pill tiny-pill success"
                                            @click.stop="handlePayPlanned(exp)"
                                        >
                                            <mdicon name="cash-check" size="16" />
                                            <span>Pay</span>
                                        </button>
                                        <mdicon
                                            v-if="!exp.planned"
                                            class="tx-chevron"
                                            :class="{ open: expandedTxnId === exp.id }"
                                            name="chevron-down"
                                            size="20"
                                        />
                                    </div>
                                </div>
                                <transition name="tx-expand">
                                    <div
                                        v-if="!exp.planned && expandedTxnId === exp.id"
                                        class="tx-detail"
                                        @click.stop
                                    >
                                        <label class="field">
                                            <span>Title</span>
                                            <input type="text" v-model="inlineForm.title" placeholder="e.g. Groceries" />
                                        </label>
                                        <div class="tx-detail-grid">
                                            <label class="field">
                                                <span>Amount</span>
                                                <input type="number" step="0.01" v-model.number="inlineForm.amount" placeholder="0.00" />
                                            </label>
                                            <label class="field">
                                                <span>Date</span>
                                                <input type="date" v-model="inlineForm.expenseDate" />
                                            </label>
                                        </div>
                                        <label class="field">
                                            <span>Budget</span>
                                            <select v-model="inlineForm.budgetId">
                                                <option value="">Auto-apply to matching budgets</option>
                                                <option v-for="b in budgets" :key="b.id" :value="b.id">
                                                    {{ b.name }} • {{ formatMoney(b.currency || defaultCurrency, b.amount) }}
                                                </option>
                                            </select>
                                        </label>
                                        <label class="field">
                                            <span>Category</span>
                                            <div class="pill-row inline-cats">
                                                <button
                                                    v-for="cat in categories"
                                                    :key="cat.id"
                                                    type="button"
                                                    class="pill-option compact"
                                                    :class="{ active: inlineForm.categoryId === cat.id }"
                                                    @click="inlineForm.categoryId = cat.id"
                                                    :style="{ borderColor: cat.color || 'var(--text-primary)', color: '#0f172a' }"
                                                >
                                                    <mdicon :name="cat.icon || 'label-outline'" size="18" :style="{ color: cat.color || '#4f46e5' }" />
                                                    <span>{{ cat.name }}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    class="pill-option compact"
                                                    :class="{ active: !inlineForm.categoryId }"
                                                    @click="inlineForm.categoryId = ''"
                                                >
                                                    <mdicon name="shape-outline" size="18" />
                                                    <span>Uncategorized</span>
                                                </button>
                                            </div>
                                        </label>
                                        <p v-if="inlineError" class="error-text">{{ inlineError }}</p>
                                        <div class="tx-detail-actions">
                                            <button
                                                type="button"
                                                class="pill tiny-pill danger"
                                                @click="startDeleteExpense(exp)"
                                            >
                                                <mdicon name="trash-can-outline" size="16" />
                                                <span>Delete</span>
                                            </button>
                                            <div class="tx-detail-spacer"></div>
                                            <button type="button" class="text-btn" @click="closeTxnDetail">Cancel</button>
                                            <button
                                                type="button"
                                                class="primary-btn solid"
                                                :disabled="inlineSaving"
                                                @click="handleSaveInline(exp)"
                                            >
                                                {{ inlineSaving ? 'Saving...' : 'Save' }}
                                            </button>
                                        </div>
                                    </div>
                                </transition>
                            </div>
                        </transition-group>
                    </div>
                </section>
                <div v-else class="empty-state slide-up">
                    <div class="icon-circle purple">
                        <mdicon name="file-document-outline" size="20" />
                    </div>
                    <p class="item-title">No transactions yet</p>
                    <p class="sub">Log an expense to see it here.</p>
                </div>
           </div>
        </transition>
    </main>

    <!-- CALENDAR TAB -->
    <main class="content cal-page" v-else-if="activeTab === 'calendar'">
        <section class="transactions-header slide-up">
            <transition name="month-slide-nav" mode="out-in">
                <div class="months" :key="viewMonthKey" @touchstart="onMonthTouchStart" @touchend="onMonthTouchEnd">
                    <span class="month muted" @click="changeMonth(-1)">{{ monthLabel(-1) }}</span>
                    <span class="month current">{{ monthLabel(0) }}</span>
                    <span class="month muted" @click="changeMonth(1)">{{ monthLabel(1) }}</span>
                </div>
            </transition>
        </section>

        <transition :name="monthSlideName" mode="out-in">
            <div
                class="cal-pane slide-up"
                :key="viewMonthKey"
                @touchstart="onMonthTouchStart"
                @touchend="onMonthTouchEnd"
            >
                <div class="cal-grid">
                    <span v-for="d in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" :key="d" class="cal-dow">{{ d }}</span>
                    <template v-for="(cell, idx) in calendarCells">
                        <span v-if="!cell" :key="'blank-' + idx" class="cal-cell blank"></span>
                        <button
                            v-else
                            :key="'day-' + cell.day"
                            type="button"
                            class="cal-cell"
                            :class="{ selected: selectedDay === cell.day, today: cell.isToday }"
                            @click="selectCalendarDay(cell.day)"
                        >
                            <span class="cal-day-num">{{ cell.day }}</span>
                            <span class="cal-day-dot" v-if="cell.total > 0"></span>
                            <span class="cal-day-amt" :class="{ zero: cell.total === 0 }">
                                {{ formatCompact(defaultCurrency, cell.total) }}
                            </span>
                        </button>
                    </template>
                </div>

                <div class="cal-day-head">
                    <span class="cal-day-label">{{ selectedDayLabel }}</span>
                    <span class="cal-day-total">- {{ formatMoney(defaultCurrency, selectedDayTotal) }}</span>
                </div>

                <section class="transactions-list section" v-if="selectedDayEntries.length > 0">
                    <transition-group name="list-fade" tag="div">
                        <div class="tx-entry" v-for="exp in selectedDayEntries" :key="exp.id">
                            <div
                                class="item compact-item mt-1 slide-up tx-row"
                                :class="{ clickable: !exp.planned, expanded: expandedTxnId === exp.id }"
                                @click="toggleTxnDetail(exp)"
                            >
                                <div class="icon-circle"
                                    :style="{ '--cat-color': exp.categoryColor || 'var(--text-primary)' }"
                                >
                                    <mdicon :name="exp.categoryIcon || 'cash-multiple'" size="20" />
                                </div>
                                <div class="item-main">
                                    <p class="item-title">{{ exp.title }}</p>
                                </div>
                                <div class="tx-amount-wrap">
                                    <div class="item-amount" :class="{ planned: exp.planned }">
                                        {{ formatMoney(defaultCurrency, exp.amount) }}
                                    </div>
                                    <button
                                        v-if="exp.planned"
                                        class="pill tiny-pill success"
                                        @click.stop="handlePayPlanned(exp)"
                                    >
                                        <mdicon name="cash-check" size="16" />
                                        <span>Pay</span>
                                    </button>
                                    <mdicon
                                        v-if="!exp.planned"
                                        class="tx-chevron"
                                        :class="{ open: expandedTxnId === exp.id }"
                                        name="chevron-down"
                                        size="20"
                                    />
                                </div>
                            </div>
                            <transition name="tx-expand">
                                <div
                                    v-if="!exp.planned && expandedTxnId === exp.id"
                                    class="tx-detail"
                                    @click.stop
                                >
                                    <label class="field">
                                        <span>Title</span>
                                        <input type="text" v-model="inlineForm.title" placeholder="e.g. Groceries" />
                                    </label>
                                    <div class="tx-detail-grid">
                                        <label class="field">
                                            <span>Amount</span>
                                            <input type="number" step="0.01" v-model.number="inlineForm.amount" placeholder="0.00" />
                                        </label>
                                        <label class="field">
                                            <span>Date</span>
                                            <input type="date" v-model="inlineForm.expenseDate" />
                                        </label>
                                    </div>
                                    <label class="field">
                                        <span>Budget</span>
                                        <select v-model="inlineForm.budgetId">
                                            <option value="">Auto-apply to matching budgets</option>
                                            <option v-for="b in budgets" :key="b.id" :value="b.id">
                                                {{ b.name }} • {{ formatMoney(b.currency || defaultCurrency, b.amount) }}
                                            </option>
                                        </select>
                                    </label>
                                    <label class="field">
                                        <span>Category</span>
                                        <div class="pill-row inline-cats">
                                            <button
                                                v-for="cat in categories"
                                                :key="cat.id"
                                                type="button"
                                                class="pill-option compact"
                                                :class="{ active: inlineForm.categoryId === cat.id }"
                                                @click="inlineForm.categoryId = cat.id"
                                                :style="{ borderColor: cat.color || 'var(--text-primary)', color: '#0f172a' }"
                                            >
                                                <mdicon :name="cat.icon || 'label-outline'" size="18" :style="{ color: cat.color || '#4f46e5' }" />
                                                <span>{{ cat.name }}</span>
                                            </button>
                                            <button
                                                type="button"
                                                class="pill-option compact"
                                                :class="{ active: !inlineForm.categoryId }"
                                                @click="inlineForm.categoryId = ''"
                                            >
                                                <mdicon name="shape-outline" size="18" />
                                                <span>Uncategorized</span>
                                            </button>
                                        </div>
                                    </label>
                                    <p v-if="inlineError" class="error-text">{{ inlineError }}</p>
                                    <div class="tx-detail-actions">
                                        <button
                                            type="button"
                                            class="pill tiny-pill danger"
                                            @click="startDeleteExpense(exp)"
                                        >
                                            <mdicon name="trash-can-outline" size="16" />
                                            <span>Delete</span>
                                        </button>
                                        <div class="tx-detail-spacer"></div>
                                        <button type="button" class="text-btn" @click="closeTxnDetail">Cancel</button>
                                        <button
                                            type="button"
                                            class="primary-btn solid"
                                            :disabled="inlineSaving"
                                            @click="handleSaveInline(exp)"
                                        >
                                            {{ inlineSaving ? 'Saving...' : 'Save' }}
                                        </button>
                                    </div>
                                </div>
                            </transition>
                        </div>
                    </transition-group>
                </section>
                <div v-else class="empty-state slide-up">
                    <div class="icon-circle purple">
                        <mdicon name="calendar-blank-outline" size="20" />
                    </div>
                    <p class="item-title">No entries</p>
                    <p class="sub">Nothing logged for this day.</p>
                </div>
            </div>
        </transition>
    </main>

    <main class="content insights-page mt-3" v-else-if="activeTab === 'insights'">

        <section class="insights-grid stagger-seq">
            <div class="insight-card glow slide-up">
                <p class="label">Total spent</p>
                <h3>{{ formatMoney(defaultCurrency, insightsTotal) }}</h3>
                <p class="sub">{{ insightsCount }} transactions</p>
            </div>
            <div class="insight-card glow purple slide-up">
                <p class="label">Avg per day</p>
                <h3>{{ formatMoney(defaultCurrency, insightsAvgPerDay) }}</h3>
                <p class="sub">So far this month</p>
            </div>
        </section>

        <section class="section insight-block top-category-block slide-up" v-if="topCategory">
            <div class="section-head">
                <h4>Top category</h4>
                <span class="micro muted">Highest spend</span>
            </div>
            <div class="cat-row">
                <div class="icon-circle" :style="{ '--cat-color': topCategory.color || 'var(--text-primary)' }">
                    <mdicon :name="topCategory.icon || 'star'" size="20" />
                </div>
                <div class="cat-main">
                    <p class="item-title">{{ topCategory.name }}</p>
                    <p class="item-sub">{{ formatMoney(defaultCurrency, topCategory.total) }}</p>
                    <div class="progress slim">
                        <div class="bar" :style="{ width: topCategory.percentLabel, background: topCategory.color || '#4f46e5' }"></div>
                    </div>
                </div>
                <div class="cat-percent">{{ topCategory.percentLabel }}</div>
            </div>
        </section>

        <section class="section insight-block slide-up" v-if="categoryBreakdown.length">
            <div class="section-head">
                <h4>By category</h4>
                <span class="micro muted">{{ categoryBreakdown.length }} categories</span>
            </div>
            <transition-group name="list-fade" tag="div" class="category-list stagger-seq">
                <div class="cat-row slide-up" v-for="cat in categoryBreakdown" :key="cat.id || cat.name">
                    <div class="icon-circle" :style="{ '--cat-color': cat.color || 'var(--text-primary)' }">
                        <mdicon :name="cat.icon || 'label-outline'" size="18" />
                    </div>
                    <div class="cat-main">
                        <p class="item-title">{{ cat.name }}</p>
                        <p class="item-sub">{{ formatMoney(defaultCurrency, cat.total) }}</p>
                        <div class="progress slim">
                            <div class="bar" :style="{ width: cat.percentLabel, background: cat.color || '#4f46e5' }"></div>
                        </div>
                    </div>
                    <div class="cat-percent">{{ cat.percentLabel }}</div>
                </div>
            </transition-group>
        </section>

        <section class="section insight-block slide-up">
            <div class="section-head">
                <h4>Weekly spend</h4>
                <span class="micro muted">Last 7 days</span>
            </div>
            <div class="week-bars stagger-seq">
                <div
                    v-for="(day, idx) in weeklySeries"
                    :key="idx"
                    class="week-bar slide-up"
                >
                    <div class="bar-track">
                        <div class="bar-fill" :style="{ height: day.percent, background: '#4f46e5' }"></div>
                    </div>
                    <p class="micro muted">{{ day.label }}</p>
                    <p class="micro">{{ formatMoney(defaultCurrency, day.total) }}</p>
                </div>
            </div>
        </section>

        <div class="ai-insights-cta slide-up" @click="router.push('/expense-tracking/insights')">
            <div class="ai-insights-icon">
                <mdicon name="robot-outline" :size="22" />
            </div>
            <div class="ai-insights-text">
                <p class="ai-insights-title">AI Spending Insights</p>
                <p class="ai-insights-sub">Deep analysis · Budget alerts · Recommendations</p>
            </div>
            <mdicon name="chevron-right" :size="20" class="ai-insights-arrow" />
        </div>
    </main>

    <!-- MORE / PROFILE TAB -->
    <main class="content more-page" v-else-if="activeTab === 'profile'">
        <section class="more-hero slide-up">
            <div class="avatar pill pop-in">
                <span>{{ userInitials }}</span>
            </div>
            <div class="profile-meta">
                <h3 class="profile-name">{{ userName || 'User' }}</h3>
                <p class="sub">{{ userEmail || 'Welcome back' }}</p>
            </div>
            <button class="icon-btn ghost" aria-label="Edit profile">
                <mdicon name="pencil-outline" size="20" />
            </button>
        </section>

        <section class="menu-group slide-up">
            <p class="menu-group-label">General</p>
            <div class="menu-list">
                <button type="button" class="menu-row" @click="router.push('/settings')">
                    <span class="menu-icon" :style="{ '--cat-color': '#94a3b8' }">
                        <mdicon name="cog-outline" size="20" />
                    </span>
                    <span class="menu-row-main">
                        <span class="menu-row-title">Settings</span>
                        <span class="menu-row-sub">AI provider, currency, theme</span>
                    </span>
                    <mdicon class="menu-chevron" name="chevron-right" size="20" />
                </button>
            </div>
        </section>

        <section class="menu-group slide-up">
            <p class="menu-group-label">Preferences</p>
            <div class="menu-list">
                <!-- Expense categories -->
                <button type="button" class="menu-row" @click="catListOpen = !catListOpen">
                    <span class="menu-icon" :style="{ '--cat-color': '#fb923c' }">
                        <mdicon name="shape-outline" size="20" />
                    </span>
                    <span class="menu-row-main">
                        <span class="menu-row-title">Expense categories</span>
                        <span class="menu-row-sub">{{ categories.length }} {{ categories.length === 1 ? 'category' : 'categories' }}</span>
                    </span>
                    <mdicon class="menu-chevron" :class="{ open: catListOpen }" name="chevron-down" size="20" />
                </button>
                <transition name="tx-expand">
                    <div v-if="catListOpen" class="menu-expand">
                        <div class="menu-expand-actions">
                            <button
                                v-if="!categories.length"
                                class="primary-chip ghost-chip"
                                :disabled="seedingCategories"
                                @click="seedDefaultCategories"
                            >
                                <mdicon name="star-shooting-outline" size="18" />
                                <span>{{ seedingCategories ? 'Loading...' : 'Load defaults' }}</span>
                            </button>
                            <button class="primary-chip ghost-chip" @click="openAddCategory">
                                <mdicon name="plus-circle-outline" size="18" />
                                <span>Add category</span>
                            </button>
                        </div>
                        <div class="cat-list" v-if="categories.length">
                            <div
                                class="cat-row-item"
                                v-for="cat in categories"
                                :key="cat.id || cat.name"
                            >
                                <div
                                    class="icon-circle cat-icon"
                                    :style="{ '--cat-color': cat.color || '#475569' }"
                                >
                                    <mdicon :name="cat.icon || 'label-outline'" size="18" />
                                </div>
                                <span class="cat-row-name">{{ cat.name }}</span>
                                <div class="cat-row-actions">
                                    <button
                                        class="icon-btn ghost small"
                                        @click="startEditCategory(cat)"
                                        aria-label="Edit"
                                    >
                                        <mdicon name="pencil-outline" size="17" />
                                    </button>
                                    <button
                                        class="icon-btn ghost small danger"
                                        :disabled="deletingCategoryId === cat.id"
                                        @click="handleDeleteCategory(cat)"
                                        aria-label="Delete"
                                    >
                                        <mdicon
                                            :name="deletingCategoryId === cat.id ? 'loading' : 'trash-can-outline'"
                                            size="17"
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p v-else class="sub" style="margin-top: 8px">No categories yet. Load defaults or add your own.</p>
                    </div>
                </transition>

                <!-- Currency & accounts -->
                <button type="button" class="menu-row" @click="router.push('/expense-tracking/accounts')">
                    <span class="menu-icon" :style="{ '--cat-color': '#818cf8' }">
                        <mdicon name="credit-card-outline" size="20" />
                    </span>
                    <span class="menu-row-main">
                        <span class="menu-row-title">Currency &amp; accounts</span>
                        <span class="menu-row-sub">{{ defaultCurrency }} • {{ accounts.length }} {{ accounts.length === 1 ? 'account' : 'accounts' }} • Default: {{ defaultAccountName || 'None' }}</span>
                    </span>
                    <mdicon class="menu-chevron" name="chevron-right" size="20" />
                </button>

                <!-- Budgets -->
                <button type="button" class="menu-row" @click="budgetListOpen = !budgetListOpen">
                    <span class="menu-icon" :style="{ '--cat-color': '#4ade80' }">
                        <mdicon name="target" size="20" />
                    </span>
                    <span class="menu-row-main">
                        <span class="menu-row-title">Budgets</span>
                        <span class="menu-row-sub">{{ budgets.length ? `${budgets.length} active` : 'No budgets yet' }}</span>
                    </span>
                    <mdicon class="menu-chevron" :class="{ open: budgetListOpen }" name="chevron-down" size="20" />
                </button>
                <transition name="tx-expand">
                    <div v-if="budgetListOpen" class="menu-expand">
                        <div class="menu-expand-actions">
                            <button class="primary-chip ghost-chip" @click="openBudgetSheet">
                                <mdicon name="plus-circle-outline" size="18" />
                                <span>New budget</span>
                            </button>
                        </div>
                        <div v-if="budgets.length" class="budget-manage-list">
                            <div class="budget-manage-card" v-for="b in budgets" :key="b.id">
                                <div class="bmc-head">
                                    <div class="bmc-titles">
                                        <p class="bmc-name">
                                            {{ b.name }}
                                            <span class="bmc-period">{{ budgetPeriodLabel(b) }}</span>
                                        </p>
                                        <p class="bmc-dates">{{ budgetWindowLabel(b) }}</p>
                                    </div>
                                    <div class="bmc-actions">
                                        <button class="icon-btn ghost" aria-label="Edit budget" @click="startEditBudget(b)">
                                            <mdicon name="pencil-outline" size="18" />
                                        </button>
                                        <button class="icon-btn ghost danger" aria-label="Delete budget" @click="handleDeleteBudget(b)">
                                            <mdicon name="trash-can-outline" size="18" />
                                        </button>
                                    </div>
                                </div>
                                <div class="progress slim" style="margin: 12px 0 6px">
                                    <div class="bar" :class="budgetPctClass(b)" :style="{ width: budgetProgress(b) }"></div>
                                </div>
                                <div class="bmc-foot">
                                    <span class="bmc-amt">{{ formatMoney(b.currency || defaultCurrency, b.spent || 0) }} <span class="bmc-amt-sep">of</span> {{ formatMoney(b.currency || defaultCurrency, b.amount || 0) }}</span>
                                    <span class="dbc-pct" :class="budgetPctClass(b)">{{ budgetProgress(b) }}</span>
                                </div>
                            </div>
                        </div>
                        <p v-else class="sub">Create a budget to get started.</p>
                    </div>
                </transition>

                <!-- Alerts & reminders -->
                <button type="button" class="menu-row" @click="alertsOpen = !alertsOpen">
                    <span class="menu-icon" :style="{ '--cat-color': '#f472b6' }">
                        <mdicon name="bell-outline" size="20" />
                    </span>
                    <span class="menu-row-main">
                        <span class="menu-row-title">Alerts &amp; reminders</span>
                        <span class="menu-row-sub">Spikes, due bills, weekly digest</span>
                    </span>
                    <mdicon class="menu-chevron" :class="{ open: alertsOpen }" name="chevron-down" size="20" />
                </button>
                <transition name="tx-expand">
                    <div v-if="alertsOpen" class="menu-expand">
                        <div class="toggles">
                            <div class="toggle-row">
                                <div>
                                    <p class="item-title">Push notifications</p>
                                    <p class="item-sub">Spikes, due bills, budgets</p>
                                </div>
                                <span class="switch on"></span>
                            </div>
                            <div class="toggle-row">
                                <div>
                                    <p class="item-title">Email summaries</p>
                                    <p class="item-sub">Weekly digest every Monday</p>
                                </div>
                                <span class="switch"></span>
                            </div>
                        </div>
                    </div>
                </transition>
            </div>
        </section>

        <section class="menu-group slide-up">
            <p class="menu-group-label">Data</p>
            <div class="menu-list">
                <button type="button" class="menu-row">
                    <span class="menu-icon" :style="{ '--cat-color': '#38bdf8' }">
                        <mdicon name="tray-arrow-down" size="20" />
                    </span>
                    <span class="menu-row-main">
                        <span class="menu-row-title">Export &amp; backup</span>
                        <span class="menu-row-sub">Export CSV/JSON • Restore from backup</span>
                    </span>
                    <mdicon class="menu-chevron" name="chevron-right" size="20" />
                </button>
                <button type="button" class="menu-row danger-row" @click="logout">
                    <span class="menu-icon" :style="{ '--cat-color': '#f87171' }">
                        <mdicon name="logout" size="20" />
                    </span>
                    <span class="menu-row-main">
                        <span class="menu-row-title">Sign out</span>
                    </span>
                    <mdicon class="menu-chevron" name="chevron-right" size="20" />
                </button>
            </div>
        </section>
    </main>

    <div v-if="showExpenseSheet" class="overlay">
        <div class="sheet" ref="expenseSheetRef">
            <div class="sheet-head">
                <div class="pill ghost">Add expense</div>
                <button class="icon-btn ghost" @click="closeExpenseSheet">
                    <mdicon name="close" size="22" />
                </button>
            </div>
            <h3 class="sheet-title">New expense</h3>
            <form class="form" @submit.prevent>
                <label class="field">
                    <span>Type</span>
                    <div class="pill-row">
                        <button
                            type="button"
                            class="pill-option"
                            :class="{ active: expenseForm.type === 'DEFAULT' }"
                            @click="selectExpenseType('DEFAULT')"
                        >
                            <mdicon name="checkbox-blank-circle-outline" size="18" />
                            <span>Default</span>
                        </button>
                        <button
                            type="button"
                            class="pill-option"
                            :class="{ active: expenseForm.type === 'SUBSCRIPTION' }"
                            @click="selectExpenseType('SUBSCRIPTION')"
                        >
                            <mdicon name="reload" size="18" />
                            <span>Subscription</span>
                        </button>
                        <button
                            type="button"
                            class="pill-option"
                            :class="{ active: expenseForm.type === 'UPCOMING' }"
                            @click="selectExpenseType('UPCOMING')"
                        >
                            <mdicon name="calendar-clock" size="18" />
                            <span>Upcoming</span>
                        </button>
                    </div>
                </label>
                <label class="field">
                    <span>Title</span>
                    <input type="text" v-model="expenseForm.title" placeholder="e.g. Groceries" />
                </label>
                <label class="field inline">
                    <span>Amount</span>
                    <input type="number" step="0.01" v-model.number="expenseForm.amount" placeholder="0.00" />
                </label>
                <label class="field inline">
                    <span>Currency</span>
                    <input type="text" v-model="expenseForm.currency" />
                </label>
                <label class="field">
                    <span>Budget (optional)</span>
                    <select v-model="expenseForm.budgetId">
                        <option value="">Auto-apply to matching budgets</option>
                        <option
                            v-for="b in activeBudgetsForExpense"
                            :key="b.id"
                            :value="b.id"
                        >
                            {{ b.name }} • {{ formatMoney(b.currency || defaultCurrency, b.amount) }}
                        </option>
                    </select>
                    <p class="micro">Showing active budgets that overlap the expense date.</p>
                </label>
                <label class="field">
                    <span>Category</span>
                    <div class="pill-row inline-cats" ref="expenseCategoryRow">
                        <button
                            v-for="cat in categories"
                            :key="cat.id"
                            type="button"
                            class="pill-option compact"
                            :class="{ active: expenseForm.categoryId === cat.id }"
                            @click="expenseForm.categoryId = cat.id"
                            :style="{ borderColor: cat.color || 'var(--text-primary)', color: '#0f172a' }"
                        >
                            <mdicon :name="cat.icon || 'label-outline'" size="18" :style="{ color: cat.color || '#4f46e5' }" />
                            <span>{{ cat.name }}</span>
                        </button>
                        <button
                            type="button"
                            class="pill-option compact"
                            :class="{ active: !expenseForm.categoryId }"
                            @click="expenseForm.categoryId = ''"
                        >
                            <mdicon name="shape-outline" size="18" />
                            <span>Uncategorized</span>
                        </button>
                        <button
                            type="button"
                            class="pill-option add-pill compact"
                            @click="goToAddCategory"
                        >
                            <mdicon name="plus" size="20" />
                        </button>
                    </div>
                </label>
                <label class="field inline">
                    <span>Date</span>
                    <input type="date" v-model="expenseForm.expenseDate" />
                </label>
                <p v-if="expenseError" class="error-text">{{ expenseError }}</p>
                <div ref="expenseActionsSentinel" class="actions-sentinel"></div>
                <div class="actions gated" :class="{ visible: expenseActionsVisible }">
                    <button type="button" class="text-btn" @click="closeExpenseSheet">Cancel</button>
                    <button type="button" class="primary-btn solid" :disabled="expenseSaving" @click="handleSaveExpense">
                        {{ expenseSaving ? 'Saving...' : 'Save expense' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
        <div v-if="showAddCategory" class="overlay">
            <div class="sheet" ref="categorySheetRef">
            <div class="sheet-head">
                <div class="pill ghost">{{ editingCategoryId ? "Edit category" : "New category" }}</div>
                <button class="icon-btn ghost" @click="closeAddCategory">
                    <mdicon name="close" size="22" />
                </button>
            </div>
            <h3 class="sheet-title">{{ editingCategoryId ? "Edit category" : "Create category" }}</h3>
            <p class="sub">Give it a name, color, and icon so it’s easy to spot in insights.</p>
            <form class="form" @submit.prevent>
                <label class="field">
                    <span>Name</span>
                    <input type="text" placeholder="e.g. Dining" v-model="categoryName" />
                </label>
                <label class="field inline">
                    <span>Color</span>
                    <div class="color-row">
                        <button
                            v-for="color in colorPalette"
                            :key="color"
                            class="color-chip"
                            :style="{ background: color }"
                            :class="{ active: selectedColor === color }"
                            type="button"
                            @click="selectColor(color)"
                        ></button>
                        <label class="color-chip picker">
                            <input type="color" v-model="selectedColor" />
                        </label>
                    </div>
                    <p class="micro">Selected: {{ selectedColor }}</p>
                </label>
                <label class="field">
                    <span>Icon</span>
                    <div class="icon-grid">
                        <button
                            v-for="icon in iconOptions"
                            :key="icon"
                            class="icon-bubble"
                            :class="{ active: selectedIcon === icon }"
                            type="button"
                            @click="selectIcon(icon)"
                        >
                            <mdicon :name="icon" size="20" />
                        </button>
                    </div>
                </label>
                <label class="checkbox">
                    <input type="checkbox" v-model="makeDefault" />
                    <span>Make this the default category</span>
                </label>
                <p v-if="saveError" class="error-text">{{ saveError }}</p>
                <p v-if="saveMessage" class="success-text">{{ saveMessage }}</p>
                <div ref="categoryActionsSentinel" class="actions-sentinel"></div>
                <div class="actions gated" :class="{ visible: categoryActionsVisible }">
                    <button type="button" class="text-btn" @click="closeAddCategory">Cancel</button>
                    <button type="button" class="primary-btn solid" :disabled="saving" @click="handleSaveCategory">
                        {{ saving ? 'Saving...' : 'Save category' }}
                    </button>
                </div>
            </form>
        </div>

            </div>

    <div v-if="showQuickActions" class="overlay quick-overlay">
        <div class="sheet">
            <div class="sheet-head">
                <div class="pill ghost">Quick actions</div>
                <button class="icon-btn ghost" @click="closeQuickActions">
                    <mdicon name="close" size="22" />
                </button>
            </div>
            <div class="action-list">
                <button class="action-row" @click="openExpenseSheet">
                    <div class="icon-circle teal">
                        <mdicon name="cash-plus" size="20" />
                    </div>
                    <div>
                        <p class="item-title">Add expense</p>
                        <p class="item-sub">Log a one-time or recurring expense</p>
                    </div>
                </button>
            </div>
        </div>
    </div>
    <div v-if="showBudgetSheet" class="overlay">
        <div class="sheet">
            <div class="sheet-head">
                <div class="pill ghost">New budget</div>
                    <button class="icon-btn ghost" @click="closeBudgetSheet">
                        <mdicon name="close" size="22" />
                    </button>
                </div>
            <h3 class="sheet-title">{{ editingBudgetId ? 'Edit budget' : 'Create budget' }}</h3>
            <form class="form" @submit.prevent>
                <label class="field">
                    <span>Name</span>
                    <input type="text" placeholder="e.g. August Groceries" v-model="budgetForm.name" />
                </label>
                <label class="field inline">
                    <span>Amount</span>
                    <input type="number" step="0.01" v-model.number="budgetForm.amount" placeholder="0.00" />
                </label>
                <label class="field inline">
                    <span>Repeats</span>
                    <select v-model="budgetForm.period">
                        <option value="MONTHLY">Every month</option>
                        <option value="WEEKLY">Every week</option>
                        <option value="YEARLY">Every year</option>
                        <option value="ONE_TIME">One-time</option>
                    </select>
                </label>
                <label class="field inline">
                    <span>{{ budgetForm.period === 'ONE_TIME' ? 'Start date' : 'Starts' }}</span>
                    <input type="date" v-model="budgetForm.startDate" />
                </label>
                <label class="field inline" v-if="budgetForm.period === 'ONE_TIME'">
                    <span>End date</span>
                    <input type="date" v-model="budgetForm.endDate" />
                </label>
                <p class="micro muted" v-else>
                    Renews automatically each {{ budgetForm.period === 'WEEKLY' ? 'week' : budgetForm.period === 'YEARLY' ? 'year' : 'month' }} — spending resets at the start of each period.
                </p>
                <label class="checkbox">
                    <input type="checkbox" v-model="budgetForm.alertEnabled" />
                    <span>Enable alerts</span>
                </label>
                <label class="field inline">
                    <span>Alert threshold</span>
                    <input type="number" step="0.01" v-model.number="budgetForm.alertThreshold" placeholder="e.g. 1500" />
                </label>
                <p v-if="budgetError" class="error-text">{{ budgetError }}</p>
                <div class="actions">
                    <button type="button" class="text-btn" @click="closeBudgetSheet">Cancel</button>
                    <button type="button" class="primary-btn solid" :disabled="budgetSaving" @click="handleSaveBudget">
                        {{ budgetSaving ? 'Saving...' : (editingBudgetId ? 'Update budget' : 'Save budget') }}
                    </button>
                </div>
            </form>
        </div>
    </div>

        <div v-if="showScheduleSheet" class="overlay">
            <div class="sheet">
            <div class="sheet-head">
                <div class="pill ghost">New schedule</div>
                <button class="icon-btn ghost" @click="closeScheduleSheet">
                    <mdicon name="close" size="22" />
                </button>
            </div>
            <h3 class="sheet-title">Add upcoming bill</h3>
            <p class="sub">Track subscriptions or planned expenses with reminders.</p>
            <form class="form" @submit.prevent>
                <label class="field">
                    <span>Name</span>
                    <input type="text" placeholder="e.g. Spotify Family" v-model="scheduleForm.title" />
                </label>
                <label class="field inline">
                    <span>Amount</span>
                    <input type="number" step="0.01" v-model.number="scheduleForm.amount" placeholder="0.00" />
                </label>
                <label class="field inline">
                    <span>Type</span>
                    <div class="pill-row">
                        <button
                            type="button"
                            class="pill-option"
                            :class="{ active: scheduleForm.type === 'subscription' }"
                            @click="scheduleForm.type = 'subscription'"
                        >
                            <mdicon name="reload" size="18" />
                            <span>Subscription</span>
                        </button>
                        <button
                            type="button"
                            class="pill-option"
                            :class="{ active: scheduleForm.type === 'expense' }"
                            @click="scheduleForm.type = 'expense'"
                        >
                            <mdicon name="calendar-clock" size="18" />
                            <span>Expense</span>
                        </button>
                    </div>
                </label>
                <label class="field inline">
                    <span>Frequency</span>
                    <select v-model="scheduleForm.frequency">
                        <option value="MONTHLY">Monthly</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="YEARLY">Yearly</option>
                        <option value="ONE_TIME">One time</option>
                    </select>
                </label>
                <label class="field">
                    <span>Category</span>
                    <div class="pill-row inline-cats" ref="scheduleCategoryRow">
                        <button
                            v-for="cat in categories"
                            :key="cat.id"
                            type="button"
                            class="pill-option compact"
                            :class="{ active: scheduleForm.categoryId === cat.id }"
                            @click="scheduleForm.categoryId = cat.id"
                            :style="{ borderColor: cat.color || 'var(--text-primary)', color: '#0f172a' }"
                        >
                            <mdicon :name="cat.icon || 'label-outline'" size="18" :style="{ color: cat.color || '#4f46e5' }" />
                            <span>{{ cat.name }}</span>
                        </button>
                        <button
                            type="button"
                            class="pill-option compact"
                            :class="{ active: !scheduleForm.categoryId }"
                            @click="scheduleForm.categoryId = ''"
                        >
                            <mdicon name="shape-outline" size="18" />
                            <span>Uncategorized</span>
                        </button>
                        <button
                            type="button"
                            class="pill-option add-pill compact"
                            @click="goToAddCategory"
                        >
                            <mdicon name="plus" size="18" />
                        </button>
                    </div>
                </label>
                <label class="field inline">
                    <span>Next charge date</span>
                    <input type="date" v-model="scheduleForm.nextDate" />
                </label>
                <label class="checkbox" v-if="scheduleForm.type === 'subscription'">
                    <input type="checkbox" v-model="scheduleForm.autoPay" />
                    <span>Auto-pay enabled</span>
                </label>
                <p v-if="scheduleError" class="error-text">{{ scheduleError }}</p>
                <div class="actions">
                    <button type="button" class="text-btn" @click="closeScheduleSheet">Cancel</button>
                    <button type="button" class="primary-btn solid" :disabled="scheduleSaving" @click="handleSaveSchedule">
                        {{ scheduleSaving ? 'Saving...' : 'Save schedule' }}
                    </button>
                </div>
            </form>
        </div>
    </div>

    <div v-if="showPayConfirm" class="overlay">
        <div class="sheet confirm-sheet">
            <div class="sheet-head">
                <div class="pill ghost">Confirm payment</div>
                <button class="icon-btn ghost" @click="closePayConfirm">
                    <mdicon name="close" size="22" />
                </button>
            </div>
            <h3 class="sheet-title">Pay this subscription?</h3>
            <div class="confirm-card">
                <div class="icon-circle green">
                    <mdicon name="cash-check" size="20" />
                </div>
                <div>
                    <p class="item-title">{{ payTarget?.title || 'Subscription' }}</p>
                    <p class="item-sub">{{ payTarget?.when }}</p>
                </div>
                <div class="item-amount">- {{ formatMoney(defaultCurrency, payTarget?.rawAmount || payTarget?.amount || 0) }}</div>
            </div>
            <p class="sub">This will log the payment as an expense and schedule the next billing date.</p>
            <p v-if="payError" class="error-text">{{ payError }}</p>
            <div class="actions">
                <button type="button" class="text-btn" @click="closePayConfirm">Cancel</button>
                <button type="button" class="primary-btn solid" :disabled="paying" @click="paySubscription">
                    {{ paying ? 'Processing...' : 'Confirm & pay' }}
                </button>
            </div>
        </div>
    </div>

    <div v-if="showBudgetDeleteConfirm" class="overlay">
        <div class="sheet confirm-sheet">
            <div class="sheet-head">
                <div class="pill ghost">Confirm delete</div>
                <button class="icon-btn ghost" @click="closeBudgetDeleteConfirm">
                    <mdicon name="close" size="22" />
                </button>
            </div>
            <h3 class="sheet-title">Delete this budget?</h3>
            <div class="confirm-card">
                <div class="icon-circle red-bg">
                    <mdicon name="trash-can-outline" size="20" />
                </div>
                <div>
                    <p class="item-title">{{ deleteTarget?.name || 'Budget' }}</p>
                    <p class="item-sub">{{ deleteTarget ? budgetWindowLabel(deleteTarget) : '' }}</p>
                </div>
                <div class="item-amount">{{ formatMoney(deleteTarget?.currency || defaultCurrency, deleteTarget?.amount || 0) }}</div>
            </div>
            <p class="sub">This cannot be undone.</p>
            <p v-if="deleteError" class="error-text">{{ deleteError }}</p>
            <div class="actions">
                <button type="button" class="text-btn" @click="closeBudgetDeleteConfirm">Cancel</button>
                <button type="button" class="primary-btn solid danger" :disabled="deleting" @click="confirmDeleteBudget">
                    {{ deleting ? 'Deleting...' : 'Delete' }}
                </button>
            </div>
        </div>
    </div>

    <div v-if="showDeleteConfirm" class="overlay">
        <div class="sheet confirm-sheet">
            <div class="sheet-head">
                <div class="pill ghost">Confirm delete</div>
                <button class="icon-btn ghost" @click="closeDeleteConfirm">
                    <mdicon name="close" size="22" />
                </button>
            </div>
            <h3 class="sheet-title">Delete this expense?</h3>
            <div class="confirm-card">
                <div class="icon-circle red-bg">
                    <mdicon name="trash-can-outline" size="20" />
                </div>
                <div>
                    <p class="item-title">{{ deleteTarget?.title || 'Expense' }}</p>
                    <p class="item-sub">{{ deleteTarget ? formatDate(deleteTarget.expenseDate) : '' }}</p>
                </div>
                <div class="item-amount">- {{ formatMoney(deleteTarget?.currency || defaultCurrency, deleteTarget?.amount || 0) }}</div>
            </div>
            <p class="sub">This will remove the entry from your ledger and budgets.</p>
            <p v-if="deleteError" class="error-text">{{ deleteError }}</p>
            <div class="actions">
                <button type="button" class="text-btn" @click="closeDeleteConfirm">Cancel</button>
                <button type="button" class="primary-btn solid danger" :disabled="deleting" @click="confirmDeleteExpense">
                    {{ deleting ? 'Deleting...' : 'Delete' }}
                </button>
            </div>
        </div>
    </div>

    <!-- SEARCH SCREEN -->
    <transition name="search-slide">
        <div v-if="showSearch" class="search-screen">
            <header class="search-nav">
                <button class="icon-btn ghost" @click="closeSearch" aria-label="Back">
                    <mdicon name="arrow-left" size="24" />
                </button>
                <h2 class="search-title">Search</h2>
            </header>

            <div class="search-controls">
                <div class="search-input-wrap">
                    <input
                        ref="searchInputRef"
                        v-model="searchQuery"
                        class="search-input"
                        type="text"
                        placeholder="Search..."
                    />
                    <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''" aria-label="Clear">
                        <mdicon name="close" size="18" />
                    </button>
                    <mdicon v-else class="search-input-icon" name="magnify" size="20" />
                </div>
                <button class="search-tool-btn" @click="closeSearch(); setTab('calendar')" aria-label="Calendar">
                    <mdicon name="calendar-month-outline" size="20" />
                </button>
                <button
                    class="search-tool-btn"
                    :class="{ 'has-active': hasActiveFilters }"
                    @click="openFilters"
                    aria-label="Filters"
                >
                    <mdicon name="filter-variant" size="20" />
                    <span v-if="hasActiveFilters" class="filter-dot"></span>
                </button>
            </div>

            <div class="search-body">
                <div v-if="expensesLoading && !searchGroups.length" class="search-loading">
                    <mdicon name="loading" size="32" class="spin" />
                    <p class="sub">Loading transactions…</p>
                </div>
                <div v-else-if="searchGroups.length" class="search-list">
                    <div v-for="group in searchGroups" :key="group.label" class="tx-group">
                        <div class="tx-group-header">
                            <span class="tx-group-label">{{ group.label }}</span>
                            <span class="tx-group-total">- {{ formatMoney(defaultCurrency, group.total) }}</span>
                        </div>
                        <div class="tx-entry" v-for="exp in group.items" :key="exp.id">
                            <div
                                class="item compact-item mt-1 tx-row"
                                :class="{ clickable: !exp.planned, expanded: expandedTxnId === exp.id }"
                                @click="toggleTxnDetail(exp)"
                            >
                                <div class="icon-circle"
                                    :style="{ '--cat-color': exp.categoryColor || 'var(--text-primary)' }"
                                >
                                    <mdicon :name="exp.categoryIcon || 'cash-multiple'" size="20" />
                                </div>
                                <div class="item-main">
                                    <p class="item-title">{{ exp.title }}</p>
                                    <p class="item-sub light" v-if="exp.categoryName">{{ exp.categoryName }}</p>
                                </div>
                                <div class="tx-amount-wrap">
                                    <div class="item-amount" :class="{ planned: exp.planned }">
                                        {{ formatMoney(defaultCurrency, exp.amount) }}
                                    </div>
                                    <button
                                        v-if="exp.planned"
                                        class="pill tiny-pill success"
                                        @click.stop="handlePayPlanned(exp)"
                                    >
                                        <mdicon name="cash-check" size="16" />
                                        <span>Pay</span>
                                    </button>
                                    <mdicon
                                        v-if="!exp.planned"
                                        class="tx-chevron"
                                        :class="{ open: expandedTxnId === exp.id }"
                                        name="chevron-down"
                                        size="20"
                                    />
                                </div>
                            </div>
                            <transition name="tx-expand">
                                <div
                                    v-if="!exp.planned && expandedTxnId === exp.id"
                                    class="tx-detail"
                                    @click.stop
                                >
                                    <label class="field">
                                        <span>Title</span>
                                        <input type="text" v-model="inlineForm.title" placeholder="e.g. Groceries" />
                                    </label>
                                    <div class="tx-detail-grid">
                                        <label class="field">
                                            <span>Amount</span>
                                            <input type="number" step="0.01" v-model.number="inlineForm.amount" placeholder="0.00" />
                                        </label>
                                        <label class="field">
                                            <span>Date</span>
                                            <input type="date" v-model="inlineForm.expenseDate" />
                                        </label>
                                    </div>
                                    <label class="field">
                                        <span>Budget</span>
                                        <select v-model="inlineForm.budgetId">
                                            <option value="">Auto-apply to matching budgets</option>
                                            <option v-for="b in budgets" :key="b.id" :value="b.id">
                                                {{ b.name }} • {{ formatMoney(b.currency || defaultCurrency, b.amount) }}
                                            </option>
                                        </select>
                                    </label>
                                    <label class="field">
                                        <span>Category</span>
                                        <div class="pill-row inline-cats">
                                            <button
                                                v-for="cat in categories"
                                                :key="cat.id"
                                                type="button"
                                                class="pill-option compact"
                                                :class="{ active: inlineForm.categoryId === cat.id }"
                                                @click="inlineForm.categoryId = cat.id"
                                                :style="{ borderColor: cat.color || 'var(--text-primary)', color: '#0f172a' }"
                                            >
                                                <mdicon :name="cat.icon || 'label-outline'" size="18" :style="{ color: cat.color || '#4f46e5' }" />
                                                <span>{{ cat.name }}</span>
                                            </button>
                                            <button
                                                type="button"
                                                class="pill-option compact"
                                                :class="{ active: !inlineForm.categoryId }"
                                                @click="inlineForm.categoryId = ''"
                                            >
                                                <mdicon name="shape-outline" size="18" />
                                                <span>Uncategorized</span>
                                            </button>
                                        </div>
                                    </label>
                                    <p v-if="inlineError" class="error-text">{{ inlineError }}</p>
                                    <div class="tx-detail-actions">
                                        <button
                                            type="button"
                                            class="pill tiny-pill danger"
                                            @click="startDeleteExpense(exp)"
                                        >
                                            <mdicon name="trash-can-outline" size="16" />
                                            <span>Delete</span>
                                        </button>
                                        <div class="tx-detail-spacer"></div>
                                        <button type="button" class="text-btn" @click="closeTxnDetail">Cancel</button>
                                        <button
                                            type="button"
                                            class="primary-btn solid"
                                            :disabled="inlineSaving"
                                            @click="handleSaveInline(exp)"
                                        >
                                            {{ inlineSaving ? 'Saving...' : 'Save' }}
                                        </button>
                                    </div>
                                </div>
                            </transition>
                        </div>
                    </div>
                </div>
                <div v-else class="empty-state slide-up">
                    <div class="icon-circle purple">
                        <mdicon name="magnify" size="20" />
                    </div>
                    <p class="item-title">{{ searchQuery ? 'No matches' : 'No transactions' }}</p>
                    <p class="sub">{{ searchQuery ? 'Try a different search term.' : 'Log an expense to see it here.' }}</p>
                </div>
            </div>

            <!-- FILTER SHEET -->
            <transition name="filter-sheet">
                <div v-if="showFilters" class="filter-overlay" @click.self="closeFilters">
                    <div class="filter-sheet">
                        <div class="filter-sheet-head">
                            <h2 class="filter-title">Filters</h2>
                            <button class="icon-btn ghost" @click="closeFilters" aria-label="Close">
                                <mdicon name="close" size="22" />
                            </button>
                        </div>

                        <div class="filter-sheet-body">
                            <!-- Categories -->
                            <p class="filter-label">Category</p>
                            <div class="filter-cat-row">
                                <button
                                    type="button"
                                    class="filter-cat"
                                    :class="{ active: !draftFilters.categoryId }"
                                    @click="draftFilters.categoryId = ''"
                                >
                                    <span class="filter-cat-icon" :style="{ '--cat-color': 'var(--text-muted)' }">
                                        <mdicon name="shape-outline" size="22" />
                                    </span>
                                    <span class="filter-cat-name">All</span>
                                </button>
                                <button
                                    v-for="cat in categories"
                                    :key="cat.id"
                                    type="button"
                                    class="filter-cat"
                                    :class="{ active: draftFilters.categoryId === cat.id }"
                                    @click="draftFilters.categoryId = cat.id"
                                >
                                    <span class="filter-cat-icon" :style="{ '--cat-color': cat.color || '#475569' }">
                                        <mdicon :name="cat.icon || 'label-outline'" size="22" />
                                    </span>
                                    <span class="filter-cat-name">{{ cat.name }}</span>
                                </button>
                            </div>

                            <!-- Amount range -->
                            <p class="filter-label">Amount range</p>
                            <div class="range-slider">
                                <div class="range-track"></div>
                                <div class="range-fill" :style="rangeFillStyle"></div>
                                <input
                                    type="range"
                                    class="range-input"
                                    :min="amountBounds.lo"
                                    :max="amountBounds.hi"
                                    v-model.number="draftFilters.amountMin"
                                    @input="onRangeMinInput"
                                />
                                <input
                                    type="range"
                                    class="range-input"
                                    :min="amountBounds.lo"
                                    :max="amountBounds.hi"
                                    v-model.number="draftFilters.amountMax"
                                    @input="onRangeMaxInput"
                                />
                            </div>
                            <div class="range-values">
                                <span class="range-pill">{{ formatMoney(defaultCurrency, draftFilters.amountMin) }}</span>
                                <span class="range-pill">{{ formatMoney(defaultCurrency, draftFilters.amountMax) }}</span>
                            </div>

                            <!-- Type -->
                            <p class="filter-label">Type</p>
                            <div class="filter-chip-row">
                                <button
                                    v-for="opt in [{ k: 'all', l: 'All' }, { k: 'once', l: 'One-time' }, { k: 'recurring', l: 'Recurring' }]"
                                    :key="opt.k"
                                    type="button"
                                    class="filter-chip"
                                    :class="{ active: draftFilters.type === opt.k }"
                                    @click="draftFilters.type = opt.k"
                                >
                                    {{ opt.l }}
                                </button>
                            </div>

                            <!-- Notes -->
                            <p class="filter-label">Notes</p>
                            <div class="filter-text-wrap">
                                <input
                                    type="text"
                                    class="filter-text-input"
                                    v-model="draftFilters.notes"
                                    placeholder="Notes contain..."
                                />
                                <mdicon class="filter-text-icon" name="note-text-outline" size="18" />
                            </div>
                        </div>

                        <div class="filter-sheet-actions">
                            <button type="button" class="filter-btn clear" @click="clearFilters">Clear</button>
                            <button type="button" class="filter-btn apply" @click="applyFilters">Apply</button>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </transition>

    <div
        class="tx-summary tx-summary-floating"
        v-if="activeTab === 'transactions' && transactionsForMonth.length > 0"
    >
        <div class="tx-summary-head">
            <span class="tx-summary-month">{{ monthLabel(0) }}</span>
            <span class="tx-summary-count">
                {{ transactionsForMonth.length }}
                {{ transactionsForMonth.length === 1 ? 'transaction' : 'transactions' }}
            </span>
        </div>
        <div class="tx-summary-stats" :class="{ split: transactionPlannedOut > 0 }">
            <div class="tx-summary-stat">
                <span class="tss-label">Spent</span>
                <span class="tss-val spent">{{ formatMoney(defaultCurrency, transactionOut) }}</span>
            </div>
            <template v-if="transactionPlannedOut > 0">
                <div class="tx-summary-stat">
                    <span class="tss-label">Upcoming</span>
                    <span class="tss-val upcoming">{{ formatMoney(defaultCurrency, transactionPlannedOut) }}</span>
                </div>
                <div class="tx-summary-stat">
                    <span class="tss-label">Total</span>
                    <span class="tss-val total">{{ formatMoney(defaultCurrency, transactionAllTotal) }}</span>
                </div>
            </template>
        </div>
    </div>

    <nav class="bottom-nav">
        <button class="nav-btn" :class="{ active: activeTab === 'home' }" @click="setTab('home')">
            <mdicon name="view-dashboard-outline" size="22" />
            <span>Dashboard</span>
        </button>
        <button class="nav-btn" :class="{ active: activeTab === 'transactions' }" @click="setTab('transactions')">
            <mdicon name="swap-horizontal" size="22" />
            <span>Transactions</span>
        </button>
        <button class="nav-btn" :class="{ active: activeTab === 'calendar' }" @click="setTab('calendar')">
            <mdicon name="calendar-month-outline" size="22" />
            <span>Calendar</span>
        </button>
        <button class="nav-btn" :class="{ active: activeTab === 'schedules' }" @click="setTab('schedules')">
            <mdicon name="calendar-refresh" size="22" />
            <span>Schedules</span>
        </button>
        <button class="nav-btn" :class="{ active: activeTab === 'profile' }" @click="setTab('profile')">
            <mdicon name="dots-horizontal-circle-outline" size="22" />
            <span>More</span>
        </button>
    </nav>
</div>
</template>

<script>
import { ref, watch, onMounted, computed, nextTick, onBeforeUnmount } from 'vue'
import store from '@/store'
import { useRouter, useRoute } from 'vue-router'
import { useExpenses } from '@/composables/expenses'
import { useAccounts } from '@/composables/accounts'
import { useCurrencies } from '@/composables/currencies'
import { useBudgets } from '@/composables/budgets'
import { useSubscriptions } from '@/composables/subscriptions'
import { useExpenseSchedules } from '@/composables/expenseSchedules'
import getProfile from '@/composables/getProfile'
import { Role } from '@/constants/enums'

export default {
    name: "ExpenseTrackingMobile",
    setup() {
        const router = useRouter()
        const route = useRoute()
        const { listExpenses, createExpense, deleteExpense, createCategory, updateCategory, deleteCategory, listCategories, updateExpense, quickAddExpense } = useExpenses()
        const { listAccounts } = useAccounts()
        const { listCurrencies } = useCurrencies()
        const { listBudgetSummary, listBudgets, createBudget, updateBudget, deleteBudget } = useBudgets()
        const { listSubscriptions, createSubscription, updateSubscription, deleteSubscription, markSubscriptionPaid } = useSubscriptions()
        const {
            listExpenseSchedules,
            createExpenseSchedule,
            updateExpenseSchedule,
            deleteExpenseSchedule,
            markExpenseSchedulePaid
        } = useExpenseSchedules()
        const initialTab = route.query?.tab ? String(route.query.tab) : 'home'
        const activeTab = ref(['home', 'transactions', 'calendar', 'schedules', 'profile', 'insights'].includes(initialTab) ? initialTab : 'home')
        const setTab = (tab) => { activeTab.value = tab }
        const barLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
        const showAddCategory = ref(false)
        const categorySheetRef = ref(null)
        const categoryActionsSentinel = ref(null)
        const categoryActionsVisible = ref(false)
        const pageReady = ref(false)
        const openAddCategory = () => { showAddCategory.value = true }
        const closeAddCategory = () => {
            showAddCategory.value = false
            resetCategoryForm()
        }

        const goToAddCategory = () => {
            showQuickActions.value = false
            showExpenseSheet.value = false
            showScheduleSheet.value = false
            showBudgetSheet.value = false
            showAddCategory.value = true
        }
        const editingCategoryId = ref(null)
        const catListOpen = ref(false)
        const budgetListOpen = ref(false)
        const alertsOpen = ref(false)
        const categories = ref([])
        const categoriesLoaded = ref(false)
        const accounts = ref([])
        const accountsLoaded = ref(false)
        const currencies = ref([])
        const currenciesLoaded = ref(false)
        const defaultCurrency = ref('PHP')
        const defaultAccountName = ref('')
        const userEmail = ref('')
        const userInitials = computed(() => {
            if (userName.value) {
                return userName.value.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            }
            return 'U'
        })
        const logout = () => {
            store.methods.logoutUser()
            router.push('/login')
        }
        const budgets = ref([])
        const budgetsLoaded = ref(false)
        const showBudgetSheet = ref(false)
        const todayStr = () => new Date().toISOString().slice(0, 10)
        const expenses = ref([])
        const expensesLoading = ref(false)
        const budgetForm = ref({
            name: '',
            amount: '',
            period: 'MONTHLY',
            startDate: todayStr(),
            endDate: todayStr(),
            alertEnabled: true,
            alertThreshold: ''
        })
        const budgetError = ref('')
        const budgetSaving = ref(false)
        const showScheduleSheet = ref(false)
        const showPayConfirm = ref(false)
        const payTarget = ref(null)
        const payError = ref('')
        const paying = ref(false)
        const scheduleSaving = ref(false)
        const scheduleError = ref('')
        // Quick-add prompt
        const quickAddText = ref('')
        const quickAdding = ref(false)
        const quickAddDone = ref(false)
        const quickAddError = ref('')
        const quickAddFeedback = ref('')
        const qaInput = ref(null)

        const submitQuickAdd = async () => {
            const text = quickAddText.value.trim()
            if (!text || quickAdding.value) return
            quickAdding.value = true
            quickAddError.value = ''
            quickAddDone.value = false
            quickAddFeedback.value = ''
            const token = localStorage.getItem('token')
            try {
                const expense = await quickAddExpense(token, text)
                expenses.value.unshift(expense)
                quickAddText.value = ''
                quickAddFeedback.value = `Added: ${expense.title} · ${expense.amount}`
                quickAddDone.value = true
                setTimeout(() => { quickAddDone.value = false; quickAddFeedback.value = '' }, 3000)
                await loadExpenses()
            } catch (e) {
                quickAddError.value = e.message || 'Could not add expense'
                setTimeout(() => { quickAddError.value = '' }, 4000)
            } finally {
                quickAdding.value = false
            }
        }

        const showQuickActions = ref(false)
        const showExpenseSheet = ref(false)
        const expenseSheetRef = ref(null)
        const expenseActionsSentinel = ref(null)
        const expenseActionsVisible = ref(false)
        const expenseSaving = ref(false)
        const expenseError = ref('')
        const expenseForm = ref({
            title: '',
            amount: '',
            currency: 'PHP',
            categoryId: '',
            expenseDate: todayStr(),
            type: 'DEFAULT',
            budgetId: ''
        })
        const editingExpenseId = ref(null)

        // Inline transaction detail / edit panel (Transactions tab)
        const expandedTxnId = ref(null)
        const inlineSaving = ref(false)
        const inlineError = ref('')
        const inlineForm = ref({
            title: '',
            amount: '',
            currency: 'PHP',
            categoryId: '',
            expenseDate: todayStr(),
            type: 'DEFAULT',
            budgetId: ''
        })
        const schedules = ref([])
        const scheduleForm = ref({
            title: '',
            amount: '',
            type: 'subscription',
            frequency: 'MONTHLY',
            nextDate: todayStr(),
            autoPay: true,
            categoryId: ''
        })
        const expenseSchedules = ref([])
        const scheduleFilter = ref('subscriptions')
        const editingBudgetId = ref(null)
        const filteredSchedules = computed(() => {
            return scheduleFilter.value === 'subscriptions' ? schedules.value : expenseSchedules.value
        })
        const scheduleTotal = computed(() => {
            return filteredSchedules.value.reduce((sum, s) => sum + Number(s.rawAmount || 0), 0)
        })
        const subscriptionTotal = computed(() => {
            return schedules.value.reduce((sum, s) => sum + Number(s.rawAmount || 0), 0)
        })

        const observerMap = new Map()
        const setupGatedActions = (openRef, sheetRef, sentinelRef, visibleRef) => {
            watch(openRef, async (open) => {
                const existing = observerMap.get(visibleRef)
                if (existing) {
                    existing.disconnect()
                    observerMap.delete(visibleRef)
                }
                visibleRef.value = false
                if (!open) return
                await nextTick()
                const root = sheetRef.value
                const target = sentinelRef.value
                if (!root || !target) return
                const observer = new IntersectionObserver(
                    (entries) => {
                        visibleRef.value = entries.some(entry => entry.isIntersecting)
                    },
                    { root, threshold: 1.0 }
                )
                observer.observe(target)
                observerMap.set(visibleRef, observer)
            })
        }

        setupGatedActions(showExpenseSheet, expenseSheetRef, expenseActionsSentinel, expenseActionsVisible)
        setupGatedActions(showAddCategory, categorySheetRef, categoryActionsSentinel, categoryActionsVisible)

        onBeforeUnmount(() => {
            observerMap.forEach((obs) => obs.disconnect())
            observerMap.clear()
        })
        const monthOffset = ref(0)
        const viewMonthStart = computed(() => {
            const base = new Date()
            return new Date(base.getFullYear(), base.getMonth() + monthOffset.value, 1)
        })
        const insightsMonthStart = computed(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
        const insightsMonthEnd = computed(() => new Date(insightsMonthStart.value.getFullYear(), insightsMonthStart.value.getMonth() + 1, 0))
        const insightsExpenses = computed(() => {
            return expenses.value.filter(exp => {
                if (!exp.expenseDate) return false
                const d = new Date(exp.expenseDate)
                return d >= insightsMonthStart.value && d <= insightsMonthEnd.value
            })
        })
        const insightsTotal = computed(() => insightsExpenses.value.reduce((sum, e) => sum + Number(e.amount || 0), 0))
        const insightsCount = computed(() => insightsExpenses.value.length)
        const insightsAvgPerDay = computed(() => {
            const todayDay = Math.min(new Date().getDate(), insightsMonthEnd.value.getDate())
            if (!todayDay) return 0
            return insightsTotal.value / todayDay
        })
        const weeklySeries = computed(() => {
            const today = new Date()
            const series = []
            for (let i = 6; i >= 0; i--) {
                const day = new Date(today)
                day.setDate(today.getDate() - i)
                const total = insightsExpenses.value
                    .filter(exp => {
                        const d = new Date(exp.expenseDate)
                        return d.toDateString() === day.toDateString()
                    })
                    .reduce((sum, e) => sum + Number(e.amount || 0), 0)
                series.push({ label: day.toLocaleDateString(undefined, { weekday: 'short' }), total })
            }
            const max = Math.max(...series.map(s => s.total), 1)
            return series.map(s => ({
                ...s,
                percent: `${Math.round((s.total / max) * 100)}%`
            }))
        })
        const categoryBreakdown = computed(() => {
            const total = insightsTotal.value || 1
            const map = new Map()
            insightsExpenses.value.forEach(exp => {
                const key = exp.categoryId || 'uncategorized'
                const existing = map.get(key) || { total: 0, name: 'Uncategorized', icon: 'shape-outline', color: 'var(--text-primary)', id: key }
                existing.total += Number(exp.amount || 0)
                const cat = categories.value.find(c => c.id === exp.categoryId)
                existing.name = cat?.name || existing.name
                existing.icon = cat?.icon || existing.icon
                existing.color = cat?.color || existing.color
                map.set(key, existing)
            })
            return Array.from(map.values())
                .map(c => ({ ...c, percent: (c.total / total) * 100, percentLabel: `${Math.round((c.total / total) * 100)}%` }))
                .sort((a, b) => b.total - a.total)
        })
        const topCategory = computed(() => categoryBreakdown.value[0] || null)
        const insightsRangeLabel = computed(() => {
            const start = insightsMonthStart.value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            const end = insightsMonthEnd.value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            return `${start} - ${end}`
        })
        const viewMonthKey = computed(() => `${viewMonthStart.value.getFullYear()}-${viewMonthStart.value.getMonth()}`)
        const monthLabel = (offset = 0) => {
            const d = new Date(viewMonthStart.value.getFullYear(), viewMonthStart.value.getMonth() + offset, 1)
            return d.toLocaleString('default', { month: 'long' })
        }
        const displayedExpenses = computed(() => {
            const target = viewMonthStart.value
            return expenses.value.filter(exp => {
                if (!exp.expenseDate) return false
                const d = new Date(exp.expenseDate)
                const inMonth = d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth()
                if (!inMonth) return false
                const b = selectedBudget.value
                if (b) {
                    const start = new Date(b.startDate)
                    const end = new Date(b.endDate)
                    if (d < start || d > end) return false
                    if (exp.budgetId && exp.budgetId !== b.id) return false
                    if (b.categoryId && exp.categoryId !== b.categoryId) return false
                }
                return true
            })
        })
        const plannedTransactions = computed(() => {
            const target = viewMonthStart.value
            const items = []
            const pushItem = (src, type) => {
                const when = src.rawNextDate || src.nextBillingDate || src.nextRunAt || src.startDate
                if (!when) return
                const d = new Date(when)
                if (d.getFullYear() !== target.getFullYear() || d.getMonth() !== target.getMonth()) return
                const b = selectedBudget.value
                if (b) {
                    const start = new Date(b.startDate)
                    const end = new Date(b.endDate)
                    if (d < start || d > end) return
                    if (b.categoryId && src.categoryId !== b.categoryId) return
                }
                const cat = categories.value.find(c => c.id === src.categoryId)
                items.push({
                    id: `${type}-${src.id}`,
                    title: src.title,
                    amount: src.rawAmount || src.amount,
                    currency: src.currency || defaultCurrency.value,
                    expenseDate: when,
                    planned: true,
                    type,
                    categoryIcon: src.categoryIcon || src.icon || cat?.icon || 'calendar-clock',
                    categoryColor: src.categoryColor || src.iconBg || cat?.color || 'var(--text-primary)',
                    categoryId: src.categoryId || ''
                })
            }
            schedules.value.forEach(sub => pushItem(sub, 'subscription'))
            expenseSchedules.value.forEach(exp => pushItem(exp, 'planned'))
            return items
        })
        const transactionsForMonth = computed(() => {
            const all = [
                ...displayedExpenses.value.map(exp => ({ ...exp, planned: false })),
                ...plannedTransactions.value
            ]
            return all.sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate))
        })
        const groupedTransactions = computed(() => {
            const today = new Date(); today.setHours(0, 0, 0, 0)
            const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
            const groups = []; const map = new Map()
            transactionsForMonth.value.forEach(exp => {
                const d = exp.expenseDate ? new Date(exp.expenseDate) : null
                let key
                if (d && !isNaN(d.getTime())) {
                    const day = new Date(d); day.setHours(0, 0, 0, 0)
                    if (day.getTime() === today.getTime()) key = 'Today'
                    else if (day.getTime() === yesterday.getTime()) key = 'Yesterday'
                    else key = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                } else { key = 'Unknown date' }
                if (!map.has(key)) { const arr = []; map.set(key, arr); groups.push({ label: key, items: arr }) }
                map.get(key).push(exp)
            })
            return groups
        })
        const currencySymbol = (cur) => {
            const map = { PHP: '₱', USD: '$', EUR: '€', GBP: '£', JPY: '¥' }
            return map[cur] || map[defaultCurrency.value] || ''
        }
        const formatMoney = (cur, amt) => {
            const value = Number(amt ?? 0)
            const sym = currencySymbol(cur)
            const formatted = Number.isFinite(value)
                ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0.00'
            return `${sym} ${formatted}`
        }
        const transactionOut = computed(() => {
            return displayedExpenses.value.reduce((sum, e) => sum + Number(e.amount || 0), 0)
        })
        const transactionPlannedOut = computed(() => {
            return plannedTransactions.value.reduce((sum, e) => sum + Number(e.amount || 0), 0)
        })
        const transactionAllTotal = computed(() => transactionOut.value + transactionPlannedOut.value)

        /* ── Calendar tab ── */
        const formatCompact = (cur, amt) => {
            const sym = currencySymbol(cur)
            const value = Number(amt ?? 0)
            if (!Number.isFinite(value) || value === 0) return `${sym}0`
            const abs = Math.abs(value)
            let out
            if (abs >= 1_000_000) {
                out = `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
            } else if (abs >= 1_000) {
                out = `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`
            } else {
                out = `${Math.round(value)}`
            }
            return `${sym}${out}`
        }
        const calendarDailyTotals = computed(() => {
            const map = {}
            transactionsForMonth.value.forEach(exp => {
                if (!exp.expenseDate) return
                const d = new Date(exp.expenseDate)
                if (isNaN(d.getTime())) return
                const key = d.getDate()
                map[key] = (map[key] || 0) + Number(exp.amount || 0)
            })
            return map
        })
        const calendarCells = computed(() => {
            const start = viewMonthStart.value
            const year = start.getFullYear()
            const month = start.getMonth()
            const firstWeekday = new Date(year, month, 1).getDay()
            const daysInMonth = new Date(year, month + 1, 0).getDate()
            const now = new Date()
            const isThisMonth = now.getFullYear() === year && now.getMonth() === month
            const cells = []
            for (let i = 0; i < firstWeekday; i++) cells.push(null)
            for (let day = 1; day <= daysInMonth; day++) {
                cells.push({
                    day,
                    total: calendarDailyTotals.value[day] || 0,
                    isToday: isThisMonth && now.getDate() === day
                })
            }
            return cells
        })
        const selectedDay = ref(new Date().getDate())
        watch(viewMonthKey, () => {
            const now = new Date()
            if (now.getFullYear() === viewMonthStart.value.getFullYear() && now.getMonth() === viewMonthStart.value.getMonth()) {
                selectedDay.value = now.getDate()
            } else {
                selectedDay.value = 1
            }
        })
        const selectCalendarDay = (day) => {
            selectedDay.value = day
        }
        const selectedDayEntries = computed(() => {
            return transactionsForMonth.value.filter(exp => {
                if (!exp.expenseDate) return false
                const d = new Date(exp.expenseDate)
                return !isNaN(d.getTime()) && d.getDate() === selectedDay.value
            })
        })
        const selectedDayTotal = computed(() =>
            selectedDayEntries.value.reduce((sum, e) => sum + Number(e.amount || 0), 0)
        )
        const selectedDayLabel = computed(() => {
            const d = new Date(viewMonthStart.value.getFullYear(), viewMonthStart.value.getMonth(), selectedDay.value)
            const now = new Date()
            const isToday = now.getFullYear() === d.getFullYear() && now.getMonth() === d.getMonth() && now.getDate() === d.getDate()
            const label = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
            return isToday ? `Today, ${label}` : label
        })

        /* ── Search screen ── */
        const showSearch = ref(false)
        const searchQuery = ref('')
        const searchInputRef = ref(null)
        const openSearch = async () => {
            showSearch.value = true
            await nextTick()
            searchInputRef.value?.focus()
        }
        const closeSearch = () => {
            showSearch.value = false
        }
        const fullDateLabel = (dateStr) => {
            const d = new Date(dateStr)
            if (isNaN(d.getTime())) return 'Unknown date'
            const today = new Date(); today.setHours(0, 0, 0, 0)
            const day = new Date(d); day.setHours(0, 0, 0, 0)
            const monthDay = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
            if (day.getTime() === today.getTime()) return `Today, ${monthDay}`
            const opts = { weekday: 'long', month: 'long', day: 'numeric' }
            if (day.getFullYear() !== today.getFullYear()) opts.year = 'numeric'
            return d.toLocaleDateString(undefined, opts)
        }
        /* Filters */
        const defaultFilters = () => ({ categoryId: '', type: 'all', notes: '', amountMin: null, amountMax: null })
        const showFilters = ref(false)
        const draftFilters = ref(defaultFilters())
        const appliedFilters = ref(defaultFilters())
        const amountBounds = computed(() => {
            const amts = expenses.value
                .map(e => Number(e.amount || 0))
                .filter(n => Number.isFinite(n))
            if (!amts.length) return { lo: 0, hi: 0 }
            return { lo: Math.floor(Math.min(...amts)), hi: Math.ceil(Math.max(...amts)) }
        })
        const rangeFillStyle = computed(() => {
            const { lo, hi } = amountBounds.value
            const span = hi - lo
            if (span <= 0) return { left: '0%', right: '0%' }
            const min = draftFilters.value.amountMin ?? lo
            const max = draftFilters.value.amountMax ?? hi
            return {
                left: `${((min - lo) / span) * 100}%`,
                right: `${((hi - max) / span) * 100}%`
            }
        })
        const onRangeMinInput = () => {
            if (draftFilters.value.amountMin > draftFilters.value.amountMax) {
                draftFilters.value.amountMin = draftFilters.value.amountMax
            }
        }
        const onRangeMaxInput = () => {
            if (draftFilters.value.amountMax < draftFilters.value.amountMin) {
                draftFilters.value.amountMax = draftFilters.value.amountMin
            }
        }
        const openFilters = () => {
            if (!categoriesLoaded.value) loadCategories()
            const { lo, hi } = amountBounds.value
            draftFilters.value = {
                ...appliedFilters.value,
                amountMin: appliedFilters.value.amountMin ?? lo,
                amountMax: appliedFilters.value.amountMax ?? hi
            }
            showFilters.value = true
        }
        const closeFilters = () => {
            showFilters.value = false
        }
        const clearFilters = () => {
            const { lo, hi } = amountBounds.value
            draftFilters.value = { ...defaultFilters(), amountMin: lo, amountMax: hi }
        }
        const applyFilters = () => {
            const { lo, hi } = amountBounds.value
            const d = draftFilters.value
            appliedFilters.value = {
                categoryId: d.categoryId,
                type: d.type,
                notes: d.notes.trim(),
                amountMin: d.amountMin > lo ? d.amountMin : null,
                amountMax: d.amountMax < hi ? d.amountMax : null
            }
            showFilters.value = false
        }
        const hasActiveFilters = computed(() => {
            const f = appliedFilters.value
            return !!(f.categoryId || f.type !== 'all' || f.notes || f.amountMin != null || f.amountMax != null)
        })

        const searchResults = computed(() => {
            const q = searchQuery.value.trim().toLowerCase()
            const f = appliedFilters.value
            const notes = f.notes.toLowerCase()
            let list = expenses.value.map(exp => ({ ...exp, planned: false }))
            if (q) {
                list = list.filter(e =>
                    (e.title || '').toLowerCase().includes(q) ||
                    (e.categoryName || '').toLowerCase().includes(q)
                )
            }
            if (f.categoryId) list = list.filter(e => e.categoryId === f.categoryId)
            if (f.type === 'once') list = list.filter(e => !e.isRecurring)
            else if (f.type === 'recurring') list = list.filter(e => e.isRecurring)
            if (notes) list = list.filter(e => (e.notes || '').toLowerCase().includes(notes))
            if (f.amountMin != null) list = list.filter(e => Number(e.amount || 0) >= f.amountMin)
            if (f.amountMax != null) list = list.filter(e => Number(e.amount || 0) <= f.amountMax)
            return list.slice().sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate))
        })
        const searchGroups = computed(() => {
            const groups = []
            const map = new Map()
            searchResults.value.forEach(exp => {
                const label = fullDateLabel(exp.expenseDate)
                if (!map.has(label)) {
                    const g = { label, items: [], total: 0 }
                    map.set(label, g)
                    groups.push(g)
                }
                const g = map.get(label)
                g.items.push(exp)
                g.total += Number(exp.amount || 0)
            })
            return groups
        })

        const transactionIn = computed(() => 0)
        const transactionNet = computed(() => transactionIn.value - transactionOut.value)
        const todayLabel = computed(() => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }))
        const monthSlideName = ref('month-slide')
        const changeMonth = (step) => {
            monthSlideName.value = step >= 0 ? 'month-slide' : 'month-slide-back'
            monthOffset.value += step
        }
        const budgetProgress = (budget) => {
            const total = Number(budget?.amount || 0)
            const spent = Number(budget?.spent || 0)
            if (!total) return '0%'
            const pct = Math.min(Math.max((spent / total) * 100, 0), 100)
            return `${pct}%`
        }
        const budgetSummaryPill = computed(() => {
            if (selectedBudget.value) {
                const b = selectedBudget.value
                const remaining = Math.max(0, Number(b.amount || 0) - Number(b.spent || 0))
                return {
                    label: `${formatMoney(b.currency || defaultCurrency.value, remaining)} left · ${b.name}`,
                    percent: budgetProgress(b)
                }
            }
            if (!budgets.value.length) return null
            const now = viewMonthStart.value
            const active = budgets.value.find(b => {
                const start = new Date(b.startDate)
                const end = new Date(b.endDate)
                return start <= now && end >= now
            }) || budgets.value[0]
            const total = Number(active.amount || 0)
            const spent = Number(active.spent || 0)
            const remaining = Math.max(0, total - spent)
            const percent = `${Math.min(Math.max((spent / total) * 100, 0), 100)}%`
            return {
                label: `${formatMoney(active.currency || defaultCurrency.value, remaining)} left · ${active.name}`,
                percent
            }
        })
        const activeBudgetsForExpense = computed(() => {
            if (!budgets.value.length) return []
            const dateStr = expenseForm.value.expenseDate || todayStr()
            const dateObj = new Date(dateStr)
            const list = budgets.value.filter(b => {
                const start = new Date(b.startDate)
                const end = new Date(b.endDate)
                return start <= dateObj && end >= dateObj
            })
            return list
        })
        const startEditBudget = (budget) => {
            editingBudgetId.value = budget.id
            budgetForm.value = {
                name: budget.name || '',
                amount: budget.amount || '',
                currency: budget.currency || defaultCurrency.value || 'PHP',
                period: budget.period || 'ONE_TIME',
                startDate: budget.startDate ? budget.startDate.slice(0, 10) : todayStr(),
                endDate: budget.endDate ? budget.endDate.slice(0, 10) : todayStr(),
                categoryId: '',
                alertEnabled: budget.alertEnabled ?? true,
                alertThreshold: budget.alertThreshold ?? ''
            }
            showBudgetSheet.value = true
        }

        const handleDeleteBudget = async(budget) => {
            const token = localStorage.getItem('token')
            if (!token || !budget?.id) return
            deleteTarget.value = budget
            deleteError.value = ''
            showBudgetDeleteConfirm.value = true
        }
        const touchStartX = ref(0)
        const touchStartY = ref(0)
        const onMonthTouchStart = (e) => {
            const t = e.changedTouches?.[0]
            touchStartX.value = t?.clientX || 0
            touchStartY.value = t?.clientY || 0
        }
        const onMonthTouchEnd = (e) => {
            const t = e.changedTouches?.[0]
            const dx = (t?.clientX || 0) - touchStartX.value
            const dy = (t?.clientY || 0) - touchStartY.value
            // Only treat as a month swipe when the gesture is clearly horizontal,
            // so vertical scrolling through the list never changes the month.
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                changeMonth(dx < 0 ? 1 : -1)
            }
        }
        const openQuickActions = () => {
            showQuickActions.value = true
        }
        const closeQuickActions = () => {
            showQuickActions.value = false
        }
        const resetExpenseForm = () => {
            expenseForm.value = {
                title: '',
                amount: '',
                currency: defaultCurrency.value || 'PHP',
                categoryId: '',
                expenseDate: todayStr(),
                type: 'DEFAULT'
            }
            expenseError.value = ''
            editingExpenseId.value = null
        }

        const openExpenseSheet = () => {
            if (!categoriesLoaded.value) loadCategories()
            if (!budgetsLoaded.value) loadBudgets()
            resetExpenseForm()
            showQuickActions.value = false
            showExpenseSheet.value = true
            // Precompute budgets for default date
            activeBudgetsForExpense.value
        }

        const closeExpenseSheet = () => {
            showExpenseSheet.value = false
        }

        const selectExpenseType = (type) => {
            expenseForm.value.type = type
            console.log('Selected expense type:', type)
            if (type === 'SUBSCRIPTION' || type === 'UPCOMING') {
                const scheduleType = type === 'SUBSCRIPTION' ? 'subscription' : 'expense'
                closeExpenseSheet()
                showQuickActions.value = false
                setTab('schedules')
                scheduleFilter.value = type === 'SUBSCRIPTION' ? 'subscriptions' : 'expenses'
                openScheduleSheet(scheduleType)
            }
        }

        const handleSaveExpense = async() => {
            expenseError.value = ''
            if (!expenseForm.value.title.trim() || !expenseForm.value.amount) {
                expenseError.value = 'Title and amount are required.'
                return
            }
            const token = localStorage.getItem('token')
            if (!token) {
                expenseError.value = 'You are not logged in.'
                return
            }
            expenseSaving.value = true
            try {
                if (editingExpenseId.value) {
                    await updateExpense(token, editingExpenseId.value, {
                        title: expenseForm.value.title.trim(),
                        amount: Number(expenseForm.value.amount),
                        currency: expenseForm.value.currency || defaultCurrency.value || 'PHP',
                        categoryId: expenseForm.value.categoryId || null,
                        expenseDate: expenseForm.value.expenseDate || new Date().toISOString(),
                        paymentMethod: 'CASH',
                        isRecurring: expenseForm.value.type === 'SUBSCRIPTION',
                        frequency: expenseForm.value.type === 'SUBSCRIPTION' ? 'MONTHLY' : 'ONE_TIME',
                        budgetId: expenseForm.value.budgetId || null
                    })
                } else {
                    await createExpense(token, {
                        title: expenseForm.value.title.trim(),
                        amount: Number(expenseForm.value.amount),
                        currency: expenseForm.value.currency || defaultCurrency.value || 'PHP',
                        categoryId: expenseForm.value.categoryId || null,
                        expenseDate: expenseForm.value.expenseDate || new Date().toISOString(),
                        paymentMethod: 'CASH',
                        isRecurring: expenseForm.value.type === 'SUBSCRIPTION',
                        frequency: expenseForm.value.type === 'SUBSCRIPTION' ? 'MONTHLY' : 'ONE_TIME',
                        budgetId: expenseForm.value.budgetId || null
                    })
                }
                await loadExpenses()
                await loadBudgets()
                closeExpenseSheet()
            } catch (err) {
                expenseError.value = err?.message || 'Unable to save expense.'
            } finally {
                expenseSaving.value = false
            }
        }
        const editingSubscriptionId = ref(null)
        const budgetCarousel = ref(null)
        const budgetActiveIndex = ref(0)
        const activeBudgetAmount = computed(() => {
            if (!budgets.value.length) return `${currencySymbol(defaultCurrency.value)} 0`
            const active = budgets.value[budgetActiveIndex.value] || budgets.value[0]
            const currency = active?.currency || defaultCurrency.value || 'PHP'
            return `${currencySymbol(currency)} ${active?.amount ?? 0}`
        })
        const budgetFilterId = ref('')
        const selectedBudget = computed(() => budgets.value.find(b => b.id === budgetFilterId.value) || null)
        const showDeleteConfirm = ref(false)
        const deleteTarget = ref(null)
        const deleteError = ref('')
        const deleting = ref(false)
        const showBudgetDeleteConfirm = ref(false)
        const DEFAULT_CATEGORIES = [
            { name: 'Food & Dining',    icon: 'food-fork-drink',       color: '#f97316' },
            { name: 'Groceries',        icon: 'cart-outline',           color: '#22c55e' },
            { name: 'Transportation',   icon: 'car-wash',               color: '#3b82f6' },
            { name: 'Housing',          icon: 'home-outline',           color: '#06b6d4' },
            { name: 'Utilities',        icon: 'lightbulb-on-outline',   color: '#f59e0b' },
            { name: 'Health & Medical', icon: 'medical-bag',            color: '#ef4444' },
            { name: 'Entertainment',    icon: 'video-outline',          color: '#8b5cf6' },
            { name: 'Shopping',         icon: 'bag-personal-outline',   color: '#ec4899' },
            { name: 'Travel',           icon: 'airplane',               color: '#6366f1' },
            { name: 'Education',        icon: 'laptop',                 color: '#0ea5e9' },
            { name: 'Personal Care',    icon: 'dumbbell',               color: '#84cc16' },
            { name: 'Savings',          icon: 'piggy-bank',             color: '#14b8a6' },
        ]

        const colorPalette = ref([
            '#ef4444', '#f97316', '#f59e0b', '#84cc16',
            '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
            '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
            '#ec4899', '#f472b6', 'var(--text-muted)', '#475569',
            '#000000', '#ffffff'
        ])
        const selectedColor = ref(colorPalette.value[9])
        const iconOptions = ref([
            'food-fork-drink',
            'silverware-fork-knife',
            'cupcake',
            'cart-outline',
            'basket-outline',
            'bag-personal-outline',
            'bus',
            'train',
            'car-wash',
            'gas-station',
            'home-outline',
            'lightbulb-on-outline',
            'water',
            'phone-outline',
            'wifi',
            'cellphone-nfc',
            'netflix',
            'spotify',
            'video-outline',
            'cash-multiple',
            'credit-card-outline',
            'bank',
            'piggy-bank',
            'wallet-outline',
            'dumbbell',
            'heart-pulse',
            'hospital-building',
            'medical-bag',
            'laptop',
            'headphones',
            'gamepad-variant-outline',
            'briefcase',
            'airplane',
            'pine-tree',
            'party-popper',
            'gift-outline',
            'tshirt-crew-outline'
        ])
        const selectedIcon = ref(iconOptions.value[0])
        const selectColor = (color) => { selectedColor.value = color }
        const selectIcon = (icon) => { selectedIcon.value = icon }
        const categoryName = ref('')
        const makeDefault = ref(false)
        const saving = ref(false)
        const saveError = ref('')
        const saveMessage = ref('')

        const resetCategoryForm = () => {
            categoryName.value = ''
            makeDefault.value = false
            saving.value = false
            saveError.value = ''
            saveMessage.value = ''
            selectedColor.value = colorPalette.value[9]
            selectedIcon.value = iconOptions.value[0]
            editingCategoryId.value = null
        }

        const startEditCategory = (cat) => {
            editingCategoryId.value = cat.id
            categoryName.value = cat.name || ''
            selectedColor.value = cat.color || colorPalette.value[9]
            selectedIcon.value = cat.icon || iconOptions.value[0]
            makeDefault.value = cat.isDefault || false
            saveError.value = ''
            saveMessage.value = ''
            showAddCategory.value = true
        }

        const deletingCategoryId = ref(null)
        const handleDeleteCategory = async(cat) => {
            const token = localStorage.getItem('token')
            if (!token || deletingCategoryId.value) return
            deletingCategoryId.value = cat.id
            try {
                await deleteCategory(token, cat.id)
                categories.value = categories.value.filter(c => c.id !== cat.id)
            } catch (err) {
                console.error(err)
            } finally {
                deletingCategoryId.value = null
            }
        }

        const loadCategories = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                const list = await listCategories(token)
                categories.value = Array.isArray(list) ? list : []
                categoriesLoaded.value = true
            } catch (err) {
                // keep silent to avoid blocking UI; could surface a message if needed
            }
        }

        const loadAccounts = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                const list = await listAccounts(token)
                accounts.value = Array.isArray(list) ? list : []
                const def = accounts.value.find(a => a.isDefault)
                defaultAccountName.value = def?.name || accounts.value[0]?.name || ''
                accountsLoaded.value = true
            } catch (err) {
                console.error(err)
            }
        }

        const loadCurrencies = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                const list = await listCurrencies(token)
                currencies.value = Array.isArray(list) ? list : []
                const def = currencies.value.find(c => c.isDefault)
                defaultCurrency.value = def?.code || defaultCurrency.value
                currenciesLoaded.value = true
            } catch (err) {
                console.error(err)
            }
        }

        const loadBudgets = async() => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                let list = []
                try {
                    list = await listBudgetSummary(token)
                } catch {
                    list = await listBudgets(token)
                }
                budgets.value = Array.isArray(list)
                    ? list.map(b => ({
                        ...b,
                        spent: Number(b.spent || 0),
                        amount: Number(b.amount || 0),
                        currency: b.currency || defaultCurrency.value || 'PHP'
                    }))
                    : []
                budgetsLoaded.value = true
            } catch (err) {
                console.error(err)
            }
        }

        const decorateExpense = (exp) => {
            const cat = categories.value.find(c => c.id === exp.categoryId)
            return {
                ...exp,
                categoryName: cat?.name || exp.categoryName || null,
                categoryIcon: cat?.icon || exp.categoryIcon || null,
                categoryColor: cat?.color || exp.categoryColor || null
            }
        }

        const loadExpenses = async() => {
            expensesLoading.value = true
            try {
                const token = localStorage.getItem('token')
                if (!token) return
                const list = await listExpenses(token)
                expenses.value = Array.isArray(list) ? list.map(decorateExpense) : []
            } catch (err) {
                console.error(err)
            } finally {
                expensesLoading.value = false
            }
        }

        const handleSaveCategory = async() => {
            saveError.value = ''
            saveMessage.value = ''
            if (!categoryName.value.trim()) {
                saveError.value = 'Category name is required.'
                return
            }
            const token = localStorage.getItem('token')
            if (!token) {
                saveError.value = 'You are not logged in.'
                return
            }
            saving.value = true
            try {
                const payload = {
                    name: categoryName.value.trim(),
                    color: selectedColor.value,
                    icon: selectedIcon.value,
                    isDefault: makeDefault.value
                }
                if (editingCategoryId.value) {
                    const updated = await updateCategory(token, editingCategoryId.value, payload)
                    const idx = categories.value.findIndex(c => c.id === editingCategoryId.value)
                    if (idx !== -1) categories.value.splice(idx, 1, updated)
                    saveMessage.value = 'Category updated.'
                } else {
                    const category = await createCategory(token, payload)
                    categories.value = [category, ...categories.value]
                    saveMessage.value = 'Category saved.'
                }
                setTimeout(() => {
                    closeAddCategory()
                }, 700)
            } catch (err) {
                saveError.value = err?.message || 'Unable to save category.'
            } finally {
                saving.value = false
            }
        }

        const seedingCategories = ref(false)
        const seedDefaultCategories = async() => {
            const token = localStorage.getItem('token')
            if (!token || seedingCategories.value) return
            seedingCategories.value = true
            try {
                const created = []
                for (const cat of DEFAULT_CATEGORIES) {
                    try {
                        const result = await createCategory(token, { ...cat, isDefault: false })
                        created.push(result)
                    } catch {
                        // skip duplicates or errors silently
                    }
                }
                if (created.length) {
                    categories.value = [...created, ...categories.value]
                }
            } finally {
                seedingCategories.value = false
            }
        }

        const totalBudget = computed(() => {
            return budgets.value.reduce((sum, b) => sum + Number(b.amount || 0), 0)
        })

        const currentMonthName = computed(() =>
            new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        )
        const monthChangeCls = computed(() => {
            if (!prevMonthTotal.value) return ''
            return currentMonthTotal.value > prevMonthTotal.value ? 'change-up' : 'change-down'
        })
        const budgetPctClass = (budget) => {
            const pct = parseFloat(budgetProgress(budget))
            if (pct >= 90) return 'bar-danger'
            if (pct >= 70) return 'bar-warn'
            return 'bar-ok'
        }

        const budgetPeriodLabel = (budget) => {
            switch (budget?.period) {
                case 'WEEKLY': return 'Weekly'
                case 'MONTHLY': return 'Monthly'
                case 'YEARLY': return 'Yearly'
                default: return 'One-time'
            }
        }

        // For recurring budgets show the current period window (endDate is a far-future sentinel);
        // one-time budgets show their fixed range.
        const budgetWindowLabel = (budget) => {
            if (budget?.period && budget.period !== 'ONE_TIME') {
                const start = budget.windowStart || budget.startDate
                const end = budget.windowEnd
                return end ? `${formatDate(start)} – ${formatDate(end)}` : formatDate(start)
            }
            return `${formatDate(budget.startDate)} – ${formatDate(budget.endDate)}`
        }

        const currentMonthStart = computed(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
        const currentMonthEnd = computed(() => new Date(currentMonthStart.value.getFullYear(), currentMonthStart.value.getMonth() + 1, 0))
        const previousMonthStart = computed(() => new Date(currentMonthStart.value.getFullYear(), currentMonthStart.value.getMonth() - 1, 1))
        const previousMonthEnd = computed(() => new Date(currentMonthStart.value.getFullYear(), currentMonthStart.value.getMonth(), 0))
        const currentMonthTotal = computed(() => {
            return expenses.value.reduce((sum, exp) => {
                if (!exp.expenseDate) return sum
                const d = new Date(exp.expenseDate)
                if (d >= currentMonthStart.value && d <= currentMonthEnd.value) {
                    return sum + Number(exp.amount || 0)
                }
                return sum
            }, 0)
        })
        const prevMonthTotal = computed(() => {
            return expenses.value.reduce((sum, exp) => {
                if (!exp.expenseDate) return sum
                const d = new Date(exp.expenseDate)
                if (d >= previousMonthStart.value && d <= previousMonthEnd.value) {
                    return sum + Number(exp.amount || 0)
                }
                return sum
            }, 0)
        })
        const monthChangeLabel = computed(() => {
            const prev = prevMonthTotal.value
            if (!prev) return 'vs last month: —'
            const diff = ((currentMonthTotal.value - prev) / prev) * 100
            const sign = diff > 0 ? '+' : ''
            return `${sign}${diff.toFixed(1)}% vs last month`
        })

        const openBudgetSheet = () => {
            resetBudgetForm()
            showBudgetSheet.value = true
        }

        const closeBudgetSheet = () => {
            showBudgetSheet.value = false
        }

        const resetBudgetForm = () => {
            budgetForm.value = {
                name: '',
                amount: '',
                currency: defaultCurrency.value || 'PHP',
                period: 'MONTHLY',
                startDate: todayStr(),
                endDate: todayStr(),
                categoryId: '',
                alertEnabled: true,
                alertThreshold: ''
            }
            budgetError.value = ''
            editingBudgetId.value = null
        }

        const handleSaveBudget = async() => {
            budgetError.value = ''
            if (!budgetForm.value.name.trim() || !budgetForm.value.amount) {
                budgetError.value = 'Name and amount are required.'
                return
            }
            const isRecurring = budgetForm.value.period && budgetForm.value.period !== 'ONE_TIME'
            if (!budgetForm.value.startDate || (!isRecurring && !budgetForm.value.endDate)) {
                budgetError.value = isRecurring ? 'Start date is required.' : 'Start and end dates are required.'
                return
            }
            const token = localStorage.getItem('token')
            if (!token) {
                budgetError.value = 'You are not logged in.'
                return
            }
            budgetSaving.value = true
            try {
                const payload = {
                    name: budgetForm.value.name.trim(),
                    amount: Number(budgetForm.value.amount),
                    currency: defaultCurrency.value || 'PHP',
                    period: budgetForm.value.period || 'ONE_TIME',
                    startDate: budgetForm.value.startDate,
                    endDate: isRecurring ? null : budgetForm.value.endDate,
                    categoryId: null,
                    alertThreshold: budgetForm.value.alertThreshold ? Number(budgetForm.value.alertThreshold) : null,
                    alertEnabled: budgetForm.value.alertEnabled
                }
                if (editingBudgetId.value) {
                    await updateBudget(token, editingBudgetId.value, payload)
                } else {
                    await createBudget(token, payload)
                }
                await loadBudgets()
                closeBudgetSheet()
            } catch (err) {
                budgetError.value = err?.message || 'Unable to save budget.'
            } finally {
                budgetSaving.value = false
            }
        }

        const openScheduleSheet = (typeOverride) => {
            if (!categoriesLoaded.value) loadCategories()
            resetScheduleForm(typeOverride)
            showScheduleSheet.value = true
            showQuickActions.value = false
        }

        const closeScheduleSheet = () => {
            showScheduleSheet.value = false
        }

        const resetScheduleForm = (typeOverride) => {
            scheduleForm.value = {
                title: '',
                amount: '',
                type: typeOverride || 'subscription',
                frequency: 'MONTHLY',
                nextDate: todayStr(),
                autoPay: true,
                categoryId: ''
            }
            scheduleError.value = ''
            editingSubscriptionId.value = null
        }

        const friendlyDueDate = (dateStr) => {
            if (!dateStr) return 'Upcoming'
            const d = new Date(dateStr)
            if (isNaN(d.getTime())) return 'Upcoming'
            const today = new Date(); today.setHours(0, 0, 0, 0)
            const target = new Date(d); target.setHours(0, 0, 0, 0)
            const diff = Math.round((target - today) / 86400000)
            if (diff < 0) return 'Overdue'
            if (diff === 0) return 'Due today'
            if (diff === 1) return 'Due tomorrow'
            if (diff <= 7) return `In ${diff} days`
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        }
        const mapSubscriptionToCard = (sub) => {
            const next = sub.nextBillingDate || sub.nextBilling || sub.nextDate
            const autoPay = Boolean(sub.autoPay)
            const cat = categories.value.find(c => c.id === sub.categoryId)
            const iconBg = cat?.color || (autoPay ? '#d1fae5' : '#e0f2fe')
            const iconColor = cat?.color ? '#fff' : (autoPay ? '#15803d' : '#0f172a')
            return {
                id: sub.id,
                when: friendlyDueDate(next),
                tag: autoPay ? 'Auto-pay' : 'Reminder',
                icon: cat?.icon || 'calendar-refresh',
                iconBg,
                iconColor,
                badgeClass: autoPay ? 'green' : 'blue',
                title: sub.title,
                subtitle: sub.billingCycle || 'MONTHLY',
                amount: formatMoney(sub.currency || defaultCurrency.value, sub.amount),
                rawAmount: sub.amount,
                rawNextDate: sub.nextBillingDate || null,
                frequency: sub.billingCycle || 'MONTHLY',
                autoPay,
                categoryId: sub.categoryId || '',
                categoryIcon: cat?.icon,
                categoryColor: cat?.color,
                dotClass: null
            }
        }

        const loadSubscriptions = async() => {
            const token = localStorage.getItem('token')
            if (!token) return
            try {
                if (!categoriesLoaded.value) {
                    await loadCategories()
                }
                const list = await listSubscriptions(token)
                schedules.value = Array.isArray(list) ? list.map(mapSubscriptionToCard) : []
            } catch (err) {
                console.error(err)
            }
        }

        const mapExpenseScheduleToCard = (sch) => {
            const when = sch.nextRunAt || sch.startDate
            const cat = categories.value.find(c => c.id === sch.categoryId)
            const iconBg = cat?.color || '#e0f2fe'
            const iconColor = cat?.color ? '#fff' : '#0f172a'
            return {
                id: sch.id,
                when: friendlyDueDate(when),
                tag: 'Reminder',
                icon: cat?.icon || 'cash-multiple',
                badgeClass: 'blue',
                title: sch.title,
                subtitle: sch.frequency || 'ONE_TIME',
                amount: formatMoney(sch.currency || defaultCurrency.value, sch.amount),
                rawAmount: sch.amount,
                rawNextDate: sch.nextRunAt || sch.startDate,
                frequency: sch.frequency || 'ONE_TIME',
                autoPay: false,
                categoryId: sch.categoryId || '',
                categoryIcon: cat?.icon,
                categoryColor: cat?.color,
                iconBg,
                iconColor
            }
        }

        const loadExpenseSchedules = async() => {
            const token = localStorage.getItem('token')
            if (!token) return
            try {
                if (!categoriesLoaded.value) {
                    await loadCategories()
                }
                const list = await listExpenseSchedules(token)
                expenseSchedules.value = Array.isArray(list) ? list.map(mapExpenseScheduleToCard) : []
            } catch (err) {
                console.error(err)
            }
        }

        const handleSaveSchedule = async() => {
            scheduleError.value = ''
            if (!scheduleForm.value.title.trim() || !scheduleForm.value.amount || !scheduleForm.value.nextDate) {
                scheduleError.value = 'Title, amount, and next date are required.'
                return
            }
            const token = localStorage.getItem('token')
            if (!token) {
                scheduleError.value = 'You are not logged in.'
                return
            }
            scheduleSaving.value = true
            try {
                const isSubscription = scheduleForm.value.type === 'subscription'
                if (isSubscription) {
                    const payload = {
                        title: scheduleForm.value.title.trim(),
                        amount: Number(scheduleForm.value.amount),
                        currency: defaultCurrency.value || 'PHP',
                        billingCycle: scheduleForm.value.frequency,
                        nextBillingDate: scheduleForm.value.nextDate,
                        active: true,
                        autoPay: scheduleForm.value.autoPay,
                        categoryId: scheduleForm.value.categoryId || null,
                        notes: null
                    }
                    if (editingSubscriptionId.value) {
                        const subscription = await updateSubscription(token, editingSubscriptionId.value, payload)
                        schedules.value = schedules.value.map(s => s.id === subscription.id ? mapSubscriptionToCard(subscription) : s)
                    } else {
                        const subscription = await createSubscription(token, payload)
                        schedules.value = [mapSubscriptionToCard(subscription), ...schedules.value]
                    }
                } else {
                    const payload = {
                        title: scheduleForm.value.title.trim(),
                        amount: Number(scheduleForm.value.amount),
                        currency: defaultCurrency.value || 'PHP',
                        startDate: scheduleForm.value.nextDate,
                        frequency: scheduleForm.value.frequency || 'ONE_TIME',
                        nextRunAt: scheduleForm.value.nextDate,
                        active: true,
                        categoryId: scheduleForm.value.categoryId || null
                    }
                    if (editingSubscriptionId.value) {
                        const updated = await updateExpenseSchedule(token, editingSubscriptionId.value, payload)
                        expenseSchedules.value = expenseSchedules.value.map(e => e.id === updated.id ? mapExpenseScheduleToCard(updated) : e)
                    } else {
                        const schedule = await createExpenseSchedule(token, payload)
                        expenseSchedules.value = [mapExpenseScheduleToCard(schedule), ...expenseSchedules.value]
                    }
                }
                closeScheduleSheet()
            } catch (err) {
                scheduleError.value = err?.message || 'Unable to save schedule.'
            } finally {
                scheduleSaving.value = false
            }
        }

        const startEditSchedule = (item) => {
            editingSubscriptionId.value = item.id
            scheduleForm.value = {
                title: item.title,
                amount: item.rawAmount || item.amount,
                type: scheduleFilter.value === 'subscriptions' ? 'subscription' : 'expense',
                frequency: item.frequency || (scheduleFilter.value === 'subscriptions' ? 'MONTHLY' : 'ONE_TIME'),
                nextDate: item.rawNextDate || '',
                autoPay: item.autoPay,
                categoryId: item.categoryId || ''
            }
            showScheduleSheet.value = true
        }

        const startEditExpense = (exp) => {
            editingExpenseId.value = exp.id
            expenseForm.value = {
                title: exp.title || '',
                amount: exp.amount || '',
                currency: exp.currency || defaultCurrency.value || 'PHP',
                categoryId: exp.categoryId || '',
                expenseDate: exp.expenseDate ? exp.expenseDate.slice(0, 10) : todayStr(),
                type: exp.isRecurring ? 'SUBSCRIPTION' : 'DEFAULT',
                budgetId: exp.budgetId || ''
            }
            expenseError.value = ''
            showExpenseSheet.value = true
        }

        const closeTxnDetail = () => {
            expandedTxnId.value = null
            inlineError.value = ''
            inlineSaving.value = false
        }

        const toggleTxnDetail = (exp) => {
            if (exp.planned) return
            if (expandedTxnId.value === exp.id) {
                closeTxnDetail()
                return
            }
            if (!categoriesLoaded.value) loadCategories()
            if (!budgetsLoaded.value) loadBudgets()
            inlineForm.value = {
                title: exp.title || '',
                amount: exp.amount ?? '',
                currency: exp.currency || defaultCurrency.value || 'PHP',
                categoryId: exp.categoryId || '',
                expenseDate: exp.expenseDate ? exp.expenseDate.slice(0, 10) : todayStr(),
                type: exp.isRecurring ? 'SUBSCRIPTION' : 'DEFAULT',
                budgetId: exp.budgetId || ''
            }
            inlineError.value = ''
            expandedTxnId.value = exp.id
        }

        const handleSaveInline = async(exp) => {
            inlineError.value = ''
            if (!inlineForm.value.title.trim() || !inlineForm.value.amount) {
                inlineError.value = 'Title and amount are required.'
                return
            }
            const token = localStorage.getItem('token')
            if (!token) {
                inlineError.value = 'You are not logged in.'
                return
            }
            inlineSaving.value = true
            try {
                await updateExpense(token, exp.id, {
                    title: inlineForm.value.title.trim(),
                    amount: Number(inlineForm.value.amount),
                    currency: inlineForm.value.currency || defaultCurrency.value || 'PHP',
                    categoryId: inlineForm.value.categoryId || null,
                    expenseDate: inlineForm.value.expenseDate || new Date().toISOString(),
                    paymentMethod: 'CASH',
                    isRecurring: inlineForm.value.type === 'SUBSCRIPTION',
                    frequency: inlineForm.value.type === 'SUBSCRIPTION' ? 'MONTHLY' : 'ONE_TIME',
                    budgetId: inlineForm.value.budgetId || null
                })
                await loadExpenses()
                await loadBudgets()
                closeTxnDetail()
            } catch (err) {
                console.error(err)
                inlineError.value = err?.message || 'Unable to save expense.'
            } finally {
                inlineSaving.value = false
            }
        }

        const removeSchedule = async(item) => {
            const token = localStorage.getItem('token')
            if (!token || !item.id) return
            try {
                if (scheduleFilter.value === 'subscriptions') {
                    await deleteSubscription(token, item.id)
                    schedules.value = schedules.value.filter(s => s.id !== item.id)
                } else {
                    await deleteExpenseSchedule(token, item.id)
                    expenseSchedules.value = expenseSchedules.value.filter(s => s.id !== item.id)
                }
            } catch (err) {
                console.error(err)
            }
        }

        const startPaySubscription = (item) => {
            payTarget.value = item
            payError.value = ''
            showPayConfirm.value = true
        }

        const closePayConfirm = () => {
            showPayConfirm.value = false
            payTarget.value = null
            paying.value = false
            payError.value = ''
        }

        const paySubscription = async() => {
            const item = payTarget.value
            const token = localStorage.getItem('token')
            if (!token || !item?.id) return
            payError.value = ''
            paying.value = true
            try {
                if (!categoriesLoaded.value) {
                    await loadCategories()
                }
                const { expense, subscription } = await markSubscriptionPaid(token, item.id)
                if (expense) expenses.value = [decorateExpense(expense), ...expenses.value]
                schedules.value = schedules.value.filter(s => s.id !== item.id)
                if (subscription) schedules.value = [mapSubscriptionToCard(subscription), ...schedules.value]
                await loadExpenses()
                await loadBudgets()
                closePayConfirm()
            } catch (err) {
                console.error(err)
                payError.value = err?.message || 'Unable to mark as paid.'
            } finally {
                paying.value = false
            }
        }

        const handleDeleteExpense = async(exp) => {
            const token = localStorage.getItem('token')
            if (!token || !exp.id || exp.planned) return
            try {
                await deleteExpense(token, exp.id)
                expenses.value = expenses.value.filter(e => e.id !== exp.id)
                await loadBudgets()
            } catch (err) {
                console.error(err)
            }
        }

        const startDeleteExpense = (exp) => {
            deleteTarget.value = exp
            deleteError.value = ''
            showDeleteConfirm.value = true
        }

        const closeDeleteConfirm = () => {
            showDeleteConfirm.value = false
            deleteTarget.value = null
            deleteError.value = ''
            deleting.value = false
        }

        const confirmDeleteExpense = async() => {
            const exp = deleteTarget.value
            const token = localStorage.getItem('token')
            if (!token || !exp?.id) return
            deleteError.value = ''
            deleting.value = true
            try {
                await deleteExpense(token, exp.id)
                expenses.value = expenses.value.filter(e => e.id !== exp.id)
                if (expandedTxnId.value === exp.id) closeTxnDetail()
                await loadBudgets()
                closeDeleteConfirm()
            } catch (err) {
                console.error(err)
                deleteError.value = err?.message || 'Unable to delete expense.'
            } finally {
                deleting.value = false
            }
        }

        const handlePayPlanned = async(item) => {
            if (item.type === 'subscription') {
                const match = schedules.value.find(s => s.id === item.id.replace('subscription-', ''))
                if (match) {
                    startPaySubscription(match)
                }
                return
            }
            if (item.type === 'planned') {
                const schedule = expenseSchedules.value.find(s => s.id === item.id.replace('planned-', ''))
                if (!schedule) return
                const token = localStorage.getItem('token')
                if (!token) return
                try {
                    const result = await markExpenseSchedulePaid(token, schedule.id)
                    if (result?.expense) expenses.value = [decorateExpense(result.expense), ...expenses.value]
                    expenseSchedules.value = expenseSchedules.value.filter(s => s.id !== schedule.id)
                    if (result?.schedule) expenseSchedules.value = [mapExpenseScheduleToCard(result.schedule), ...expenseSchedules.value]
                    await loadBudgets()
                } catch (err) {
                    console.error(err)
                }
            }
        }

        const openAddExpense = () => {
            // For now, route to schedules tab with expense filter and sheet
            setTab('schedules')
            scheduleFilter.value = 'expenses'
            resetScheduleForm()
            showScheduleSheet.value = true
            showQuickActions.value = false
        }

        const toggleAutoPay = async(item) => {
            const token = localStorage.getItem('token')
            if (!token || !item.id) return
            try {
                const updated = await updateSubscription(token, item.id, { autoPay: !item.autoPay })
                const mapped = mapSubscriptionToCard(updated)
                schedules.value = schedules.value.map(s => s.id === item.id ? mapped : s)
            } catch (err) {
                console.error(err)
            }
        }

        const onBudgetScroll = () => {
            const el = budgetCarousel.value
            if (!el) return
            const slideWidth = el.clientWidth
            const idx = Math.round(el.scrollLeft / slideWidth)
            budgetActiveIndex.value = Math.min(Math.max(idx, 0), budgets.value.length - 1)
        }

        const scrollBudget = (direction) => {
            const el = budgetCarousel.value
            if (!el) return
            const slideWidth = el.clientWidth
            const nextIndex = Math.min(
                Math.max(budgetActiveIndex.value + direction, 0),
                budgets.value.length - 1
            )
            el.scrollTo({ left: nextIndex * slideWidth, behavior: 'smooth' })
            budgetActiveIndex.value = nextIndex
        }

        const formatDate = (value) => value ? new Date(value).toLocaleDateString() : ''

        const subscriptionPalette = ['blue', 'amber', 'teal', 'purple', 'pink', 'green']
        const subscriptionDot = (idx) => subscriptionPalette[idx % subscriptionPalette.length]

        watch(activeTab, (tab) => {
            if (tab === 'profile' && !categoriesLoaded.value) {
                loadCategories()
            }
            if (tab === 'profile' && !accountsLoaded.value) {
                loadAccounts()
            }
            if (tab === 'profile' && !currenciesLoaded.value) {
                loadCurrencies()
            }
            if (tab === 'home' && !budgetsLoaded.value) {
                loadBudgets()
                if (!categoriesLoaded.value) loadCategories()
                if (schedules.value.length === 0) loadSubscriptions()
            }
            if (tab === 'schedules' && schedules.value.length === 0) {
                loadSubscriptions()
                loadExpenseSchedules()
            }
            if (tab === 'profile' && !budgetsLoaded.value) {
                loadBudgets()
            }
            if (tab === 'insights' && expenses.value.length === 0) {
                loadExpenses()
            }
            if (tab === 'transactions' && !budgetsLoaded.value) {
                loadBudgets()
            }
        }, { immediate: true })

        watch(categories, (newCats) => {
            if (!Array.isArray(expenses.value)) return
            expenses.value = expenses.value.map(exp => {
                const cat = newCats.find(c => c.id === exp.categoryId)
                return {
                    ...exp,
                    categoryIcon: cat?.icon || exp.categoryIcon || null,
                    categoryColor: cat?.color || exp.categoryColor || null
                }
            })
        })

        const ensureProfile = async () => {
            const token = localStorage.getItem('token')
            if (!token) {
                logout()
                return
            }
            store.methods.loginUser(token)
            if (!store.state.userProfile) {
                const { response, error } = await getProfile(token)
                if (error.value === null && response.value?.userInfo) {
                    const profile = response.value.userInfo
                    store.methods.setUserAdmin(profile.role === Role.ADMIN)
                    store.methods.setUserProfile(profile)
                    if (profile.role === Role.GUEST) {
                        router.push('/pending-approval')
                    }
                } else {
                    logout()
                }
            }
        }


        const userName = computed(() => store.state.userProfile?.fullName || 'User')

        onMounted(() => {
            requestAnimationFrame(() => { pageReady.value = true })
            ensureProfile()
            if (activeTab.value === 'profile') {
                loadCategories()
                loadAccounts()
                loadCurrencies()
                loadBudgets()
            }
            if (activeTab.value === 'home') {
                loadBudgets()
                loadCategories()
                loadExpenses()
                loadSubscriptions()
            }
            if (activeTab.value === 'schedules') {
                loadSubscriptions()
                loadExpenseSchedules()
            }
            if (activeTab.value === 'transactions') {
                loadExpenses()
                loadBudgets()
            }
        })

        const confirmDeleteBudget = async() => {
            const budget = deleteTarget.value
            const token = localStorage.getItem('token')
            if (!token || !budget?.id) return
            deleteError.value = ''
            deleting.value = true
            try {
                await deleteBudget(token, budget.id)
                budgets.value = budgets.value.filter(b => b.id !== budget.id)
                showBudgetDeleteConfirm.value = false
                deleteTarget.value = null
            } catch (err) {
                console.error(err)
                deleteError.value = err?.message || 'Unable to delete budget.'
            } finally {
                deleting.value = false
            }
        }

        const closeBudgetDeleteConfirm = () => {
            showBudgetDeleteConfirm.value = false
            deleteTarget.value = null
            deleteError.value = ''
            deleting.value = false
        }

        return {
            router,
            activeTab,
            setTab,
            barLabels,
            showAddCategory,
            openAddCategory,
            closeAddCategory,
            pageReady,
            categories,
            accounts,
            currencies,
            defaultCurrency,
            defaultAccountName,
            colorPalette,
            selectedColor,
            selectColor,
            iconOptions,
            selectedIcon,
            selectIcon,
            categoryName,
            makeDefault,
            saving,
            saveError,
            saveMessage,
            handleSaveCategory,
            editingCategoryId,
            catListOpen,
            budgetListOpen,
            alertsOpen,
            logout,
            startEditCategory,
            deletingCategoryId,
            handleDeleteCategory,
            seedDefaultCategories,
            seedingCategories,
            budgets,
            totalBudget,
            currentMonthTotal,
            monthChangeLabel,
            budgetFilterId,
            activeBudgetAmount,
            startEditBudget,
            handleDeleteBudget,
            budgetCarousel,
            budgetActiveIndex,
            showBudgetSheet,
            editingBudgetId,
            budgetForm,
            budgetError,
            budgetSaving,
            openBudgetSheet,
            closeBudgetSheet,
            handleSaveBudget,
            onBudgetScroll,
            scrollBudget,
            formatDate,
            budgetProgress,
            showScheduleSheet,
            scheduleForm,
            scheduleError,
            scheduleSaving,
            schedules,
            expenseSchedules,
            scheduleFilter,
            filteredSchedules,
            openScheduleSheet,
            closeScheduleSheet,
            handleSaveSchedule,
            toggleAutoPay,
            scheduleTotal,
            subscriptionTotal,
            transactionOut,
            transactionPlannedOut,
            transactionAllTotal,
            transactionIn,
            transactionNet,
            transactionsForMonth,
            groupedTransactions,
            showSearch,
            searchQuery,
            searchInputRef,
            openSearch,
            closeSearch,
            searchGroups,
            expensesLoading,
            monthSlideName,
            showFilters,
            draftFilters,
            amountBounds,
            rangeFillStyle,
            onRangeMinInput,
            onRangeMaxInput,
            openFilters,
            closeFilters,
            clearFilters,
            applyFilters,
            hasActiveFilters,
            formatCompact,
            calendarCells,
            selectedDay,
            selectCalendarDay,
            selectedDayEntries,
            selectedDayTotal,
            selectedDayLabel,
            insightsTotal,
            insightsCount,
            insightsAvgPerDay,
            insightsRangeLabel,
            categoryBreakdown,
            topCategory,
            weeklySeries,
            showDeleteConfirm,
            deleteTarget,
            deleteError,
            deleting,
            startDeleteExpense,
            closeDeleteConfirm,
            confirmDeleteExpense,
            monthLabel,
            todayLabel,
            startEditSchedule,
            removeSchedule,
            subscriptionDot,
            showQuickActions,
            openQuickActions,
            closeQuickActions,
            expenses,
            loadExpenses,
            activeBudgetsForExpense,
            showExpenseSheet,
            expenseSheetRef,
            expenseActionsSentinel,
            expenseActionsVisible,
            expenseForm,
            expenseSaving,
            expenseError,
            openExpenseSheet,
            closeExpenseSheet,
            selectExpenseType,
            handleSaveExpense,
            goToAddCategory,
            changeMonth,
            onMonthTouchStart,
            onMonthTouchEnd,
            displayedExpenses,
            monthOffset,
            viewMonthKey,
            budgetSummaryPill,
            showPayConfirm,
            payTarget,
            payError,
            paying,
            startPaySubscription,
            closePayConfirm,
            paySubscription,
            handleDeleteExpense,
            startEditExpense,
            handlePayPlanned,
            expandedTxnId,
            inlineForm,
            inlineError,
            inlineSaving,
            toggleTxnDetail,
            closeTxnDetail,
            handleSaveInline,
            showBudgetDeleteConfirm,
            confirmDeleteBudget,
            closeBudgetDeleteConfirm,
            currentMonthName,
            monthChangeCls,
            budgetPctClass,
            budgetPeriodLabel,
            budgetWindowLabel,
            formatMoney,
            currencySymbol,
            userName,
            userEmail,
            userInitials,
            categorySheetRef,
            categoryActionsSentinel,
            categoryActionsVisible,
            quickAddText,
            quickAdding,
            quickAddDone,
            quickAddError,
            quickAddFeedback,
            qaInput,
            submitQuickAdd
        }
    }
}
</script>
