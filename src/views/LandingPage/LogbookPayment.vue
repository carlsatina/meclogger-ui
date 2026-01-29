<template>
    <LogbookPaymentWeb v-if="!platformIsMobile"/>
    <LogbookPaymentMobile v-else/>
</template>

<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import LogbookPaymentWeb from '@/views/web/Logbook/Payment.vue'
import LogbookPaymentMobile from '@/views/mobile/Logbook/Payment.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "LogbookPayment",
    components: {
        LogbookPaymentWeb,
        LogbookPaymentMobile
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
