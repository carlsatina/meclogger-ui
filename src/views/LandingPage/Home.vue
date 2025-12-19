<template>
    <HomeWeb v-if="!platformIsMobile"/>
    <HomeMobile v-else/>
</template>


<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import HomeWeb from '@/views/web/Home.vue'
import HomeMobile from '@/views/mobile/Home.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "Login",
    components: {
        HomeWeb,
        HomeMobile
    },
    setup () {
        const route = useRoute()
        const router = useRouter()
        provide('store', store)
        const platformIsMobile = ref(false);

        isPlatformMobile()
        .then((data) => {
            platformIsMobile.value = data
        })

        const token = localStorage.getItem('token')
        if (!token) {
            router.replace('/login')
        } else {
            store.methods.loginUser(token)
        }

        return {
            store,
            route,
            router,
            platformIsMobile
        }
    }
}
</script>

<style scoped>
</style>
