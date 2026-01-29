<template>
    <LogbookBorrowedHistoryWeb v-if="!platformIsMobile"/>
    <LogbookBorrowedHistoryMobile v-else/>
</template>

<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import LogbookBorrowedHistoryWeb from '@/views/web/Logbook/BorrowedHistory.vue'
import LogbookBorrowedHistoryMobile from '@/views/mobile/Logbook/BorrowedHistory.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "LogbookBorrowedHistory",
    components: {
        LogbookBorrowedHistoryWeb,
        LogbookBorrowedHistoryMobile
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
