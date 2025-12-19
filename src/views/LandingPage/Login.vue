<template>
    <LoginWeb v-if="!platformIsMobile"/>
    <LoginMobile v-else/>
</template>


<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import LoginWeb from '@/views/web/Auth/Login.vue'
import LoginMobile from '@/views/mobile/Auth/Login.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "Login",
    components: {
        LoginWeb,
        LoginMobile
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

        const redirect = () => {
            const redirectPath = route.query.redirect
            if (redirectPath && typeof redirectPath === 'string') {
                router.replace(redirectPath)
            } else {
                router.replace('/')
            }
        }

        return {
            store,
            route,
            router,
            platformIsMobile,
            redirect
        }
    }
}
</script>

<style scoped>
</style>
