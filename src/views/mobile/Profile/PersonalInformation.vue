<template>
<div class="personal-info-page">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>
    <TopBar
        title="Personal Information"
        :show-back="true"
        back-route="/medical-records?tab=profile"
    />

    <div class="content">
        <section class="info-card primary glass-card" v-if="userInfo">
            <div class="card-header">
                <div class="avatar-circle">
                    <mdicon name="account-circle" :size="48"/>
                </div>
                <div>
                    <p class="section-label">Logged in user</p>
                    <p class="section-title">{{ userInfo.fullName || 'User' }}</p>
                </div>
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Email</span>
                    <span class="info-value">{{ userInfo.email || '—' }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Role</span>
                    <span class="info-value">{{ userInfo.role || 'User' }}</span>
                </div>
            </div>
        </section>

        <section class="info-card glass-card" v-if="activeProfile">
            <p class="section-label">Selected profile</p>
            <p class="section-title">{{ activeProfile.name }}</p>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Relationship</span>
                    <span class="info-value">{{ activeProfile.relation || '—' }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Birth date</span>
                    <span class="info-value">{{ formatDate(activeProfile.dateOfBirth) }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Gender</span>
                    <span class="info-value">{{ activeProfile.gender || '—' }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Blood type</span>
                    <span class="info-value">{{ activeProfile.bloodGroup || '—' }}</span>
                </div>
                <div class="info-item wide">
                    <span class="info-label">Allergies</span>
                    <span class="info-value">{{ activeProfile.allergies || 'None reported' }}</span>
                </div>
                <div class="info-item wide">
                    <span class="info-label">Chronic conditions</span>
                    <span class="info-value">{{ activeProfile.chronicConditions || 'None reported' }}</span>
                </div>
            </div>
        </section>

        <div v-if="loading" class="state-card glass-card">Loading info...</div>
        <div v-else-if="!activeProfile" class="state-card glass-card">
            Please select or add a profile to view details.
        </div>
    </div>
</div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TopBar from '@/components/MedicalRecords/TopBar.vue'
import { useProfiles } from '@/composables/profiles'
import { API_BASE_URL } from '@/constants/config'

export default {
    name: 'PersonalInformation',
    components: {
        TopBar
    },
    setup() {
        const router = useRouter()
        const route = useRoute()
        const { fetchProfiles } = useProfiles()
        const userInfo = ref(null)
        const profiles = ref([])
        const loading = ref(true)
        const activeProfileId = ref(
            Array.isArray(route.query.profileId) ? route.query.profileId[0] : route.query.profileId || localStorage.getItem('selectedProfileId')
        )

        const formatDate = (date) => {
            if (!date) return '—'
            const parsed = new Date(date)
            if (Number.isNaN(parsed.getTime())) return '—'
            return parsed.toLocaleDateString()
        }

        const activeProfile = computed(() => {
            return profiles.value.find((profile) => profile.id === activeProfileId.value) || null
        })

        const loadUserInfo = async () => {
            const token = localStorage.getItem('token')
            if (!token) {
                router.push('/login')
                return
            }
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                const data = await res.json()
                if (res.ok) {
                    userInfo.value = data.userInfo
                }
            } catch (err) {
                console.error(err)
            }
        }

        const loadProfiles = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            const { response, error } = await fetchProfiles(token)
            if (error.value === null && response.value?.profiles) {
                profiles.value = response.value.profiles.map((profile) => ({
                    id: profile.id,
                    name: profile.displayName || 'Profile',
                    relation: profile.relationToUser,
                    dateOfBirth: profile.dateOfBirth,
                    gender: profile.gender,
                    bloodGroup: profile.bloodGroup,
                    allergies: profile.allergies,
                    chronicConditions: profile.chronicConditions
                }))
            }
        }

        onMounted(async () => {
            await Promise.all([loadUserInfo(), loadProfiles()])
            loading.value = false
        })

        return {
            userInfo,
            activeProfile,
            loading,
            formatDate
        }
    }
}
</script>

<style scoped>
.personal-info-page { min-height: 100vh; background: var(--bg-main); position: relative; overflow: hidden; padding-bottom: 60px; }
.bg-orb { position: absolute; filter: blur(60px); opacity: 0.28; z-index: 0; }
.orb-1 { width: 320px; height: 320px; border-radius: 50%; background: linear-gradient(135deg, #22d3ee, #a855f7); top: -140px; left: -110px; }
.orb-2 { width: 260px; height: 260px; border-radius: 50%; background: linear-gradient(135deg, #22c55e, #06b6d4); bottom: -120px; right: -90px; }
.content { padding: 18px 16px 36px; display: flex; flex-direction: column; gap: 16px; position: relative; z-index: 1; }
.info-card { background: rgba(255,255,255,0.05); border-radius: 16px; padding: 18px; box-shadow: 0 12px 26px rgba(0,0,0,0.32); border: 1px solid rgba(255,255,255,0.08); color: var(--text-primary); }
.info-card.primary { background: linear-gradient(135deg, rgba(34,211,238,0.18), rgba(168,85,247,0.22)); border-color: rgba(103,232,249,0.25); }
.info-card.primary .info-item { background: rgba(255,255,255,0.08); border: none; }
.card-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.avatar-circle { width: 60px; height: 60px; border-radius: 18px; background: linear-gradient(135deg, #22d3ee, #a855f7); display: flex; align-items: center; justify-content: center; color: #0b1020; box-shadow: 0 10px 24px rgba(0,0,0,0.35); }
.section-label { margin: 0; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
.section-title { margin: 2px 0 0; font-size: 18px; font-weight: 800; color: var(--text-primary); }
.info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-top: 10px; }
.info-item { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: 12px; color: var(--text-muted); font-weight: 700; }
.info-value { font-size: 14px; font-weight: 700; color: var(--text-primary); word-break: break-word; }
.info-item.wide { grid-column: span 2; }
.state-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: var(--text-secondary); padding: 16px; border-radius: 14px; text-align: center; box-shadow: 0 10px 24px rgba(0,0,0,0.28); }
</style>
