<template>
    <LogbookSavingsHistoryWeb v-if="!platformIsMobile"/>
    <LogbookSavingsHistoryMobile v-else/>
</template>

<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import LogbookSavingsHistoryWeb from '@/views/web/Logbook/SavingsHistory.vue'
import LogbookSavingsHistoryMobile from '@/views/mobile/Logbook/SavingsHistory.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "LogbookSavingsHistory",
    components: {
        LogbookSavingsHistoryWeb,
        LogbookSavingsHistoryMobile
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
