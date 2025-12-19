<template>
    <ExpenseTrackingWeb v-if="!platformIsMobile"/>
    <ExpenseTrackingMobile v-else/>
</template>

<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import ExpenseTrackingWeb from '@/views/web/ExpenseTracking/Index.vue'
import ExpenseTrackingMobile from '@/views/mobile/ExpenseTracking/Index.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "ExpenseTracking",
    components: {
        ExpenseTrackingWeb,
        ExpenseTrackingMobile
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
