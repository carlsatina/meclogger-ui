<template>
    <LogbookImportWeb v-if="!platformIsMobile"/>
    <LogbookImportMobile v-else/>
</template>

<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import LogbookImportWeb from '@/views/web/Logbook/Import.vue'
import LogbookImportMobile from '@/views/mobile/Logbook/Import.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "LogbookImport",
    components: {
        LogbookImportWeb,
        LogbookImportMobile
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
