<template>
    <LogbookRentersListWeb v-if="!platformIsMobile"/>
    <LogbookRentersListMobile v-else/>
</template>

<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import LogbookRentersListWeb from '@/views/web/Logbook/RentersList.vue'
import LogbookRentersListMobile from '@/views/mobile/Logbook/RentersList.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "LogbookRentersList",
    components: {
        LogbookRentersListWeb,
        LogbookRentersListMobile
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
