<template>
<div class="profile-overview">
    <section class="family-card">
        <div class="family-card-header">
            <h3>Family Members</h3>
            <button class="add-member-btn" @click="goToAddMember">
                <mdicon name="account-plus" :size="18"/>
                Add Member
            </button>
        </div>
        <div v-if="loading" class="family-empty">Loading profiles...</div>
        <div v-else-if="!profileMembers.length" class="family-empty">
            No family members yet. Add one to get started.
        </div>
        <div v-else class="family-list">
            <button 
                v-for="member in profileMembers" 
                :key="member.id"
                class="family-item"
                :class="{ active: member.id === activeMemberId }"
                @click="selectMember(member)"
            >
                <div class="avatar">{{ member.initials }}</div>
                <div class="family-info">
                    <p class="family-name">{{ member.name }}</p>
                    <p class="family-relation">{{ member.relation || 'Family Member' }}</p>
                </div>
                <mdicon name="chevron-right" :size="18" class="family-arrow"/>
            </button>
        </div>
    </section>

    <section class="details-column" v-if="activeProfile">
        <div class="summary-card">
            <div class="summary-header">
                <div class="summary-avatar">{{ activeProfile.initials }}</div>
                <div>
                    <h2>{{ activeProfile.name }}</h2>
                    <p>{{ activeProfile.relation || 'Family Member' }}</p>
                </div>
                <button class="edit-btn" @click="goToEditProfile">
                    <mdicon name="pencil" :size="18"/>
                    Edit Profile
                </button>
            </div>
            <div class="summary-grid">
                <div>
                    <span class="label">Birth Date</span>
                    <p class="value">{{ activeProfile.dateOfBirth || '—' }}</p>
                </div>
                <div>
                    <span class="label">Blood Type</span>
                    <p class="value">{{ activeProfile.bloodGroup || '—' }}</p>
                </div>
                <div>
                    <span class="label">Contact</span>
                    <p class="value">{{ activeProfile.contact || '—' }}</p>
                </div>
                <div>
                    <span class="label">Last Visit</span>
                    <p class="value">{{ activeProfile.lastVisit || 'No data' }}</p>
                </div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <h3>Personal Information</h3>
                <template v-if="personalInfo">
                    <ul>
                        <li><span>Full Name:</span> {{ personalInfo.name }}</li>
                        <li><span>Email:</span> {{ personalInfo.email }}</li>
                        <li><span>Phone:</span> {{ personalInfo.phone }}</li>
                        <li><span>Address:</span> {{ personalInfo.address }}</li>
                    </ul>
                </template>
                <p v-else class="muted">Loading your information...</p>
            </div>
            <div class="info-card">
                <h3>Medical Conditions</h3>
                <div class="chip-group">
                    <span 
                        v-for="condition in activeProfile.conditions" 
                        :key="condition"
                        class="chip"
                    >
                        {{ condition }}
                    </span>
                    <p v-if="!activeProfile.conditions.length" class="muted">No conditions listed.</p>
                </div>
            </div>
            <div class="info-card">
                <h3>Allergies</h3>
                <div class="chip-group">
                    <span 
                        v-for="allergy in activeProfile.allergies" 
                        :key="allergy"
                        class="chip danger"
                    >
                        {{ allergy }}
                    </span>
                    <p v-if="!activeProfile.allergies.length" class="muted">No allergies reported.</p>
                </div>
            </div>
            <div class="info-card">
                <h3>Support & Settings</h3>
                <div class="support-links">
                    <button class="support-link">
                        <mdicon name="bell-ring-outline" :size="18"/>
                        Notifications
                    </button>
                    <button class="support-link">
                        <mdicon name="shield-check" :size="18"/>
                        Privacy
                    </button>
                    <button class="support-link">
                        <mdicon name="help-circle-outline" :size="18"/>
                        Help Center
                    </button>
                </div>
            </div>
        </div>
    </section>

    <div v-if="showToast" class="profile-toast">
        <div class="toast-icon">
            <mdicon name="account-check" :size="20"/>
        </div>
        <div class="toast-text">
            <p class="toast-title">Profile Selected</p>
            <p class="toast-message">{{ toastMessage }}</p>
        </div>
    </div>
</div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfiles } from '@/composables/profiles'
import { API_BASE_URL } from '@/constants/config'

export default {
    name: 'ProfileOverview',
    setup() {
        const router = useRouter()
        const { fetchProfiles } = useProfiles()
        const profileMembers = ref([])
        const userInfo = ref(null)
        const activeMemberId = ref(localStorage.getItem('selectedProfileId') || '')
        const loading = ref(false)
        const showToast = ref(false)
        const toastMessage = ref('')
        let toastTimer = null

        const mapProfile = (profile) => ({
            id: profile.id,
            name: profile.displayName || 'Profile',
            initials: (profile.displayName || 'P').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(),
            relation: profile.relationToUser || 'Family Member',
            dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '—',
            bloodGroup: profile.bloodGroup || '—',
            contact: profile.contactNumber || '—',
            address: profile.address || '—',
            email: profile.email || '—',
            phone: profile.contactNumber || '—',
            lastVisit: profile.lastVisit ? new Date(profile.lastVisit).toLocaleDateString() : '—',
            conditions: Array.isArray(profile.chronicConditions) ? profile.chronicConditions : [],
            allergies: Array.isArray(profile.allergies) ? profile.allergies : []
        })

        const loadProfiles = async() => {
            const token = localStorage.getItem('token')
            if (!token) return
            loading.value = true
            const { response } = await fetchProfiles(token)
            if (response.value?.profiles) {
                profileMembers.value = response.value.profiles.map(mapProfile)
                if (!activeMemberId.value && profileMembers.value.length) {
                    activeMemberId.value = profileMembers.value[0].id
                    localStorage.setItem('selectedProfileId', activeMemberId.value)
                }
            } else {
                profileMembers.value = []
            }
            loading.value = false
        }

        const activeProfile = computed(() => {
            return profileMembers.value.find(member => member.id === activeMemberId.value) || profileMembers.value[0] || null
        })

        const personalInfo = computed(() => {
            if (!userInfo.value) return null
            return {
                name: userInfo.value.fullName || 'User',
                email: userInfo.value.email || '—',
                phone: userInfo.value.phone || '—',
                address: userInfo.value.address || '—'
            }
        })

        const loadUserInfo = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                const data = await res.json()
                if (res.ok) {
                    userInfo.value = data.userInfo || null
                }
            } catch (err) {
                console.error(err)
            }
        }

        const selectMember = (member) => {
            activeMemberId.value = member.id
            localStorage.setItem('selectedProfileId', member.id)
            localStorage.setItem('selectedProfileName', member.name)
            showProfileToast(`${member.name}'s information is ready`)
        }

        const showProfileToast = (message) => {
            toastMessage.value = message
            showToast.value = true
            if (toastTimer) clearTimeout(toastTimer)
            toastTimer = setTimeout(() => {
                showToast.value = false
                router.replace({ path: '/medical-records', query: { tab: 'home' } })
            }, 1200)
        }

        const goToAddMember = () => {
            router.push('/medical-records/profile/add')
        }

        const goToEditProfile = () => {
            router.push('/medical-records/profile/personal-information')
        }

        onMounted(() => {
            loadProfiles()
            loadUserInfo()
        })

        return {
            profileMembers,
            activeMemberId,
            activeProfile,
            selectMember,
            goToAddMember,
            goToEditProfile,
            loading,
            showToast,
            toastMessage,
            personalInfo
        }
    }
}
</script>

<style scoped>
.profile-overview {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 24px;
    color: var(--text-primary);
}

.family-card {
    background: var(--glass-card-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 24px;
    padding: 24px;
    box-shadow: var(--glass-card-shadow);
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.family-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.family-card-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
}

.add-member-btn {
    border: 1px solid var(--glass-card-border);
    background: var(--glass-ghost-bg);
    color: var(--text-primary);
    padding: 8px 14px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
}

.family-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.family-item {
    border: 1px solid var(--glass-card-border);
    background: var(--glass-ghost-bg);
    border-radius: 18px;
    padding: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.family-item.active {
    background: linear-gradient(135deg, var(--accent-1), var(--accent-4));
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
    color: #0b1020;
    border-color: transparent;
}

.family-item:hover {
    transform: translateY(-2px);
}

.avatar {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
    color: #0b1020;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
}

.family-info {
    flex: 1;
    text-align: left;
}

.family-name {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: inherit;
}

.family-relation {
    margin: 2px 0 0;
    color: var(--text-muted);
    font-size: 13px;
}

.family-arrow {
    color: var(--text-primary);
}

.family-empty {
    text-align: center;
    color: var(--text-muted);
    font-size: 14px;
}

.details-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.summary-card {
    background: var(--glass-card-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 24px;
    padding: 24px;
    box-shadow: var(--glass-card-shadow);
    color: var(--text-primary);
}

.summary-header {
    display: flex;
    align-items: center;
    gap: 16px;
}

.summary-avatar {
    width: 60px;
    height: 60px;
    border-radius: 18px;
    background: linear-gradient(135deg, var(--accent-4), var(--accent-1));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 700;
}

.summary-header h2 {
    margin: 0;
    font-size: 22px;
    color: var(--text-primary);
}

.summary-header p {
    margin: 4px 0 0;
    color: var(--text-muted);
}

.edit-btn {
    margin-left: auto;
    border: 1px solid var(--glass-card-border);
    background: var(--glass-ghost-bg);
    color: var(--text-primary);
    padding: 8px 16px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
}

.summary-grid {
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
}

.label {
    font-size: 12px;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 1px;
}

.value {
    margin: 4px 0 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 20px;
}

.info-card {
    background: var(--glass-card-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 24px;
    padding: 20px;
    box-shadow: var(--glass-card-shadow);
    color: var(--text-primary);
}

.info-card h3 {
    margin: 0 0 12px;
    font-size: 18px;
    color: var(--text-primary);
}

.info-card ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.info-card ul span {
    color: var(--text-muted);
    margin-right: 6px;
}

.chip-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.chip {
    padding: 6px 12px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent-1) 16%, transparent);
    color: var(--accent-1);
    font-size: 12px;
    font-weight: 600;
}

.chip.danger {
    background: color-mix(in srgb, #ef4444 16%, transparent);
    color: #ef4444;
}

.muted {
    color: var(--text-muted);
    margin: 0;
}

.support-links {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.support-link {
    border: 1px solid var(--glass-card-border);
    background: var(--glass-ghost-bg);
    border-radius: 14px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--text-primary);
    text-align: left;
}

.profile-toast {
    position: fixed;
    bottom: 40px;
    right: 40px;
    background: linear-gradient(135deg, var(--accent-4), var(--accent-1));
    color: white;
    padding: 16px 20px;
    border-radius: 24px;
    box-shadow: 0 20px 35px rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 2000;
}

.toast-icon {
    width: 40px;
    height: 40px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
}

.toast-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
}

.toast-message {
    margin: 2px 0 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.9);
}

@media (max-width: 1024px) {
    .profile-overview {
        grid-template-columns: 1fr;
    }
}
</style>
