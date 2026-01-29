<template>
    <LogbookBorrowedWeb v-if="!platformIsMobile"/>
    <LogbookBorrowedMobile v-else/>
</template>

<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import LogbookBorrowedWeb from '@/views/web/Logbook/Borrowed.vue'
import LogbookBorrowedMobile from '@/views/mobile/Logbook/Borrowed.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "LogbookBorrowed",
    components: {
        LogbookBorrowedWeb,
        LogbookBorrowedMobile
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
