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
    width: 240px;
    height: 100vh;
    background: rgba(5, 6, 10, 0.92);
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
}
.theme-light .side-nav {
    background: rgba(238, 242, 255, 0.94);
    border-right-color: rgba(79, 70, 229, 0.1);
}

.nav-header {
    padding: 20px 18px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.theme-light .nav-header { border-bottom-color: rgba(79, 70, 229, 0.08); }

.nav-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-muted);
    margin: 0;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.nav-items {
    flex: 1;
    padding: 10px 10px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 12px;
    cursor: pointer;
    border-radius: 10px;
    transition: background 0.15s, color 0.15s;
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 500;
}

.nav-item:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-primary);
}
.theme-light .nav-item:hover { background: rgba(79, 70, 229, 0.08); }

.nav-item.active {
    background: rgba(79, 70, 229, 0.14);
    color: #818cf8;
    font-weight: 700;
}
.theme-light .nav-item.active { background: rgba(79, 70, 229, 0.12); color: #4f46e5; }

.nav-label { font-size: 14px; }

.nav-footer {
    padding: 12px 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.theme-light .nav-footer { border-top-color: rgba(79, 70, 229, 0.08); }

.back-button {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 12px;
    cursor: pointer;
    border-radius: 10px;
    transition: background 0.15s, color 0.15s;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 600;
}

.back-button:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-primary);
}
.theme-light .back-button:hover { background: rgba(79, 70, 229, 0.08); }
</style>
