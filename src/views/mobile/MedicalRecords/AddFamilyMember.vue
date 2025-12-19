<template>
<div class="add-profile-container">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>
    <header class="app-bar glass-nav">
        <button class="icon-btn" @click="router.back()">
            <mdicon name="close" :size="22" />
        </button>
        <h2 class="screen-title">Add Profile</h2>
        <span class="spacer"></span>
    </header>

    <form class="form-card glass-card" @submit.prevent="submitProfile">
        <div class="input-block">
            <label>Full Name</label>
            <input type="text" v-model="form.displayName" required placeholder="Enter full name" />
        </div>

        <div class="input-block">
            <label>Relation</label>
            <input type="text" v-model="form.relationToUser" placeholder="e.g., Spouse, Child" />
        </div>

        <div class="double-grid">
            <div class="input-block">
                <label>Date of Birth</label>
                <input type="date" v-model="form.dateOfBirth" />
            </div>
            <div class="input-block">
                <label>Gender</label>
                <select v-model="form.gender">
                    <option value="">Select</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                </select>
            </div>
        </div>

        <div class="input-block">
            <label>Blood Group</label>
            <input type="text" v-model="form.bloodGroup" placeholder="e.g., O+" />
        </div>

        <div class="input-block">
            <label>Allergies</label>
            <textarea v-model="form.allergies" rows="2" placeholder="Known allergies"></textarea>
        </div>

        <div class="input-block">
            <label>Chronic Conditions</label>
            <textarea v-model="form.chronicConditions" rows="2" placeholder="List chronic conditions"></textarea>
        </div>

        <button class="save-btn glass-btn-primary" type="submit" :disabled="saving">
            <span v-if="!saving">Save Profile</span>
            <span v-else>Saving...</span>
        </button>
    </form>
</div>
</template>

<script>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createProfile } from '@/composables/profiles'

export default {
    name: 'AddFamilyMember',
    setup() {
        const router = useRouter()
        const saving = ref(false)
        const form = reactive({
            displayName: '',
            relationToUser: '',
            dateOfBirth: '',
            gender: '',
            bloodGroup: '',
            allergies: '',
            chronicConditions: ''
        })

        const submitProfile = async () => {
            if (!form.displayName) return
            saving.value = true
            const token = localStorage.getItem('token')
            const payload = {
                ...form,
                dateOfBirth: form.dateOfBirth || null
            }
            const { response, error } = await createProfile(token, payload)
            saving.value = false
            if (error.value === null && response.value?.status === 201) {
                router.back()
            }
        }

        return {
            router,
            form,
            submitProfile,
            saving
        }
    }
}
</script>

.add-profile-container { min-height: 100vh; background: var(--bg-main); padding: 16px; display: flex; flex-direction: column; gap: 16px; position: relative; overflow: hidden; }
<style scoped>
.add-profile-container { min-height: 100vh; background: var(--bg-main); padding: 16px; display: flex; flex-direction: column; gap: 16px; position: relative; overflow: hidden; }
.bg-orb { position: absolute; filter: blur(60px); opacity: 0.28; z-index: 0; }
.orb-1 { width: 320px; height: 320px; border-radius: 50%; background: linear-gradient(135deg, #22d3ee, #a855f7); top: -140px; left: -110px; }
.orb-2 { width: 260px; height: 260px; border-radius: 50%; background: linear-gradient(135deg, #22c55e, #06b6d4); bottom: -120px; right: -90px; }
.app-bar { display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 1; }
.screen-title { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.icon-btn { border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); border-radius: 12px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: var(--text-primary); }
.spacer { width: 40px; }
.form-card { background: rgba(255,255,255,0.05); border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.35); padding: 20px; display: flex; flex-direction: column; gap: 16px; border: 1px solid rgba(255,255,255,0.08); position: relative; z-index: 1; }
.input-block { display: flex; flex-direction: column; gap: 6px; }
.input-block label { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.input-block input, .input-block select, .input-block textarea { border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 12px; font-size: 15px; background: rgba(255,255,255,0.05); color: var(--text-primary); }
.input-block input:focus, .input-block select:focus, .input-block textarea:focus { outline: none; border-color: rgba(103,232,249,0.6); box-shadow: 0 0 0 2px rgba(103,232,249,0.25); }
.double-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
.save-btn { margin-top: 12px; }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
