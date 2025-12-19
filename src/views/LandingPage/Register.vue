<template>
    <RegisterWeb v-if="!platformIsMobile"/>
    <RegisterMobile v-else/>
</template>


<script>
import { ref, provide } from 'vue'
import store from '@/store'
import RegisterWeb from '@/views/web/Auth/Register.vue'
import RegisterMobile from '@/views/mobile/Auth/Register.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "Register",
    components: {
        RegisterWeb,
        RegisterMobile
    },
    setup () {
        const platformIsMobile = ref(false)
        provide('store', store)

        isPlatformMobile().then((data) => {
            platformIsMobile.value = data
        })

        return {
            store,
            platformIsMobile
        }
    }
}
</script>

<style scoped>
</style>
