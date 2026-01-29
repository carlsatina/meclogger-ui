<template>
    <LogbookReportsWeb v-if="!platformIsMobile"/>
    <LogbookReportsMobile v-else/>
</template>

<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import LogbookReportsWeb from '@/views/web/Logbook/Reports.vue'
import LogbookReportsMobile from '@/views/mobile/Logbook/Reports.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "LogbookReports",
    components: {
        LogbookReportsWeb,
        LogbookReportsMobile
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
