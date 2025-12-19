<template>
<div class="side-nav">
    <div class="nav-header">
        <h3 class="nav-title">Medical Records</h3>
    </div>
    
    <div class="nav-items">
        <div 
            class="nav-item" 
            :class="{ active: activeTab === 'home' }"
            @click="$emit('change-tab', 'home')"
        >
            <mdicon name="home" :size="22"/>
            <span class="nav-label">Home</span>
        </div>
        
        <div 
            class="nav-item" 
            :class="{ active: activeTab === 'records' }"
            @click="$emit('change-tab', 'records')"
        >
            <mdicon name="file-document-multiple" :size="22"/>
            <span class="nav-label">Records</span>
        </div>
        
        <div 
            class="nav-item" 
            :class="{ active: activeTab === 'health' }"
            @click="$emit('change-tab', 'health')"
        >
            <mdicon name="heart-pulse" :size="22"/>
            <span class="nav-label">My Health</span>
        </div>
        
        <div 
            class="nav-item" 
            :class="{ active: activeTab === 'profile' }"
            @click="$emit('change-tab', 'profile')"
        >
            <mdicon name="account-circle" :size="22"/>
            <span class="nav-label">Profile</span>
        </div>
    </div>

    <div class="nav-footer">
        <div class="back-button" @click="$emit('go-back')">
            <mdicon name="arrow-left" :size="20"/>
            <span>Back to Home</span>
        </div>
    </div>
</div>
</template>

<script>
export default {
    name: "MedicalRecordsSideNav",
    props: {
        activeTab: {
            type: String,
            default: 'home'
        }
    },
    emits: ['change-tab', 'go-back']
}
</script>

<style scoped>
.side-nav {
    width: 260px;
    height: 100vh;
    background: var(--glass-card-bg);
    border-right: 1px solid var(--glass-card-border);
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
}

.nav-header {
    padding: 24px 20px;
    border-bottom: 1px solid var(--glass-card-border);
}

.nav-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -0.3px;
}

.nav-items {
    flex: 1;
    padding: 16px 12px;
    overflow-y: auto;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    margin-bottom: 4px;
    cursor: pointer;
    border-radius: 12px;
    transition: all 0.2s ease;
    color: var(--text-muted);
}

.nav-item:hover {
    background: var(--glass-ghost-bg);
    color: var(--text-primary);
}

.nav-item.active {
    background: linear-gradient(135deg, var(--accent-1) 0%, var(--accent-4) 100%);
    color: #0b1020;
}

.nav-item.active:hover {
    background: linear-gradient(135deg, var(--accent-1) 0%, var(--accent-4) 100%);
}

.nav-label {
    font-size: 15px;
    font-weight: 500;
}

.nav-footer {
    padding: 16px;
    border-top: 1px solid var(--glass-card-border);
}

.back-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    cursor: pointer;
    border-radius: 10px;
    transition: all 0.2s ease;
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 500;
}

.back-button:hover {
    background: var(--glass-ghost-bg);
    color: var(--text-primary);
}

.back-button:active {
    transform: scale(0.98);
}
</style>
