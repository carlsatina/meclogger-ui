<template>
<div class="logbook-page">
    <div v-if="showToast" class="logbook-toast">
        <div class="toast-icon">
            <mdicon name="check-circle" size="22"/>
        </div>
        <div>
            <p class="toast-title">Renter added</p>
            <p class="toast-message">{{ toastMessage }}</p>
        </div>
    </div>
    <div v-if="showErrorPopup" class="error-popup-backdrop" @click.self="closeErrorPopup">
        <div class="error-popup glass-card">
            <h4>Something went wrong</h4>
            <p>{{ errorPopupMessage }}</p>
            <button class="glass-btn-primary" type="button" @click="closeErrorPopup">Okay</button>
        </div>
    </div>
    <LogbookTopNav
        variant="web"
        title="Renter"
        subtitle="Manage renter profiles and their payment timelines."
        icon="account-group-outline"
    />

    <section class="logbook-section">
        <div class="section-head">
            <div class="section-title-row">
                <h3>New renter</h3>
                <button class="glass-btn-ghost back-btn" type="button" @click="goBack">
                    <mdicon name="arrow-left" size="16" />
                    <span>Back</span>
                </button>
            </div>
            <p>Add renter details and assign an apartment.</p>
        </div>
        <form class="glass-card logbook-form" @submit.prevent>
            <div class="form-grid">
                <label class="form-field">
                    <span>First name</span>
                    <input type="text" v-model="form.firstName" placeholder="Enter first name" />
                </label>

                <label class="form-field">
                    <span>Last name</span>
                    <input type="text" v-model="form.lastName" placeholder="Enter last name" />
                </label>

                <label class="form-field">
                    <span>Contact No.</span>
                    <input type="text" v-model="form.contactNo" placeholder="Enter contact number" />
                </label>

                <label class="form-field">
                    <span>Email</span>
                    <input type="email" v-model="form.email" placeholder="Enter email address" />
                </label>

                <label class="form-field">
                    <span>Apartment</span>
                    <select v-model="form.apartment">
                        <option value="" disabled>Select apartment</option>
                        <option v-for="unit in apartments" :key="unit" :value="unit">{{ unit }}</option>
                    </select>
                </label>

                <label class="form-field">
                    <span>Rental Amount</span>
                    <input type="number" step="0.01" v-model="form.rentalAmount" placeholder="0.00" />
                </label>

                <label class="form-field">
                    <span>Date of Transfer</span>
                    <input type="date" v-model="form.transferDate" />
                </label>

                <label class="form-field">
                    <span>Status</span>
                    <select v-model="form.status">
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                </label>

                <label class="form-field span-two">
                    <span>Remarks</span>
                    <textarea rows="3" v-model="form.remarks" placeholder="Add remarks"></textarea>
                </label>
            </div>
            <div class="form-actions">
                <button class="glass-btn-primary" type="button" :disabled="saving" @click="saveRenter">
                    {{ saving ? 'Saving…' : 'Save renter' }}
                </button>
            </div>
        </form>
    </section>

    <LogbookBottomNav variant="web" />
</div>
</template>

<script>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '@/constants/config'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

export default {
    name: "LogbookRenterWeb",
    components: {
        LogbookBottomNav,
        LogbookTopNav
    },
    setup() {
        const route = useRoute()
        const router = useRouter()
        const renterId = ref(route.params.id ? String(route.params.id) : '')
        const now = new Date()
        const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 10)

        const defaultForm = () => ({
            firstName: '',
            lastName: '',
            contactNo: '',
            email: '',
            apartment: '',
            rentalAmount: '',
            transferDate: today,
            remarks: '',
            status: 'ACTIVE'
        })

        const form = ref(defaultForm())
        const saving = ref(false)
        const saveError = ref('')
        const showToast = ref(false)
        const toastMessage = ref('')
        const showErrorPopup = ref(false)
        const errorPopupMessage = ref('')
        let toastTimer = null

        const apartments = [
            'Yellow Fantasy Door 1',
            'Yellow Fantasy Door 2',
            'Yellow Fantasy Door 3',
            'Fuji View Door 1',
            'Fuji View Door 2',
            'Fuji View Door 3',
            'Fuji View Door 4',
            'Fuji View Door 5',
            'Parking'
        ]

        const loadRenter = async () => {
            if (!renterId.value) return
            const token = localStorage.getItem('token')
            if (!token) return
            saveError.value = ''
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/logbook/renters/${renterId.value}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to load renter')
                const renter = data.renter || {}
                form.value = {
                    firstName: renter.firstName || '',
                    lastName: renter.lastName || '',
                    contactNo: renter.contactNo || '',
                    email: renter.email || '',
                    apartment: renter.apartment || '',
                    rentalAmount: renter.rentalAmount ?? '',
                    transferDate: renter.transferDate
                        ? new Date(new Date(renter.transferDate).getTime() - new Date(renter.transferDate).getTimezoneOffset() * 60000)
                            .toISOString()
                            .slice(0, 10)
                        : today,
                    remarks: renter.remarks || '',
                    status: (renter.status || 'ACTIVE').toUpperCase()
                }
            } catch (err) {
                saveError.value = err?.message || 'Unable to load renter'
                errorPopupMessage.value = saveError.value
                showErrorPopup.value = true
            }
        }

        const saveRenter = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            saving.value = true
            saveError.value = ''
            try {
                const endpoint = renterId.value
                    ? `${API_BASE_URL}/api/v1/logbook/renters/${renterId.value}`
                    : `${API_BASE_URL}/api/v1/logbook/renters`
                const res = await fetch(endpoint, {
                    method: renterId.value ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        firstName: form.value.firstName || null,
                        lastName: form.value.lastName || null,
                        contactNo: form.value.contactNo || null,
                        email: form.value.email || null,
                        apartment: form.value.apartment || null,
                        rentalAmount: form.value.rentalAmount === '' ? null : Number(form.value.rentalAmount),
                        transferDate: form.value.transferDate || null,
                        remarks: form.value.remarks || null,
                        status: form.value.status || 'ACTIVE'
                    })
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to save renter')
                const wasEditing = Boolean(renterId.value)
                if (!wasEditing) {
                    form.value = defaultForm()
                    renterId.value = ''
                }
                toastMessage.value = wasEditing ? 'Renter updated.' : 'The renter has been added.'
                showToast.value = true
                if (toastTimer) clearTimeout(toastTimer)
                toastTimer = setTimeout(() => {
                    showToast.value = false
                }, 3000)
            } catch (err) {
                saveError.value = err?.message || 'Unable to save renter'
                errorPopupMessage.value = saveError.value
                showErrorPopup.value = true
            } finally {
                saving.value = false
            }
        }

        const closeErrorPopup = () => {
            showErrorPopup.value = false
        }

        const goBack = () => {
            if (window.history.length > 1) {
                router.back()
                return
            }
            router.push('/logbook/renters-list')
        }

        onMounted(loadRenter)

        return {
            form,
            apartments,
            saving,
            saveError,
            saveRenter,
            showToast,
            toastMessage,
            showErrorPopup,
            errorPopupMessage,
            closeErrorPopup,
            goBack
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-web.css"></style>
