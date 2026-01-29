<template>
    <LogbookSavingsWeb v-if="!platformIsMobile"/>
    <LogbookSavingsMobile v-else/>
</template>

<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import LogbookSavingsWeb from '@/views/web/Logbook/Savings.vue'
import LogbookSavingsMobile from '@/views/mobile/Logbook/Savings.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "LogbookSavings",
    components: {
        LogbookSavingsWeb,
        LogbookSavingsMobile
    },
    setup () {
        const route = useRoute()
        const router = useRouter()
        provide('store', store)
        const platformIsMobile = ref(false)

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
