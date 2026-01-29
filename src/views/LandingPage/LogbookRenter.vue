<template>
    <LogbookRenterWeb v-if="!platformIsMobile"/>
    <LogbookRenterMobile v-else/>
</template>

<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import LogbookRenterWeb from '@/views/web/Logbook/Renter.vue'
import LogbookRenterMobile from '@/views/mobile/Logbook/Renter.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "LogbookRenter",
    components: {
        LogbookRenterWeb,
        LogbookRenterMobile
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
