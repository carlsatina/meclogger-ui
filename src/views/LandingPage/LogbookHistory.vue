<template>
    <LogbookHistoryWeb v-if="!platformIsMobile"/>
    <LogbookHistoryMobile v-else/>
</template>

<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import LogbookHistoryWeb from '@/views/web/Logbook/History.vue'
import LogbookHistoryMobile from '@/views/mobile/Logbook/History.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "LogbookHistory",
    components: {
        LogbookHistoryWeb,
        LogbookHistoryMobile
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
