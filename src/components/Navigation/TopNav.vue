<template>
    <nav class="navbar sticky-top navbar-expand-lg themed-nav glass-nav-orb">
        <div class="container-fluid">
            <!-- add brand/actions here if needed -->
        </div>
    </nav>
</template>

<script>
import { ref, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import store from '@/store'
import getProfile from '@/composables/getProfile'
import { Role } from '@/constants/enums'

export default {
    name: "TopNav",
    setup () {
        const router = useRouter()
        const route = useRoute()
        const userToken = localStorage.getItem('token')
        const full_name = ref()

        if (userToken) {
            store.methods.loginUser(userToken)
            getProfile(userToken)
            .then((data) => {
                if (data.error.value === null) {
                    store.methods.setUserAdmin(data.response.value.userInfo.role === Role.ADMIN)
                    store.methods.setUserProfile(data.response.value.userInfo)
                    full_name.value = data.response.value.userInfo.fullName
                }
            })
        }
        provide('store', store)
        const logout = () => {
            store.methods.logoutUser()
            router.push('/login')
        }
        return {
            route,
            router,
            store,
            logout,
            full_name
        }
    }
}

</script>

<style scoped>
.signout:hover {
    background-color: #c8dbbe;
    border-radius: 5px;
}

.signout {
    color: white;
    font-weight: bold;
}

.themed-nav {
    background: var(--glass-ghost-bg) !important;
    border-bottom: 1px solid var(--glass-card-border);
    color: var(--text-primary);
    backdrop-filter: blur(8px);
}
</style>
