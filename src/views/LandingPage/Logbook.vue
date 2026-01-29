<template>
    <LogbookWeb v-if="!platformIsMobile"/>
    <LogbookMobile v-else/>
</template>

<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import LogbookWeb from '@/views/web/Logbook/Index.vue'
import LogbookMobile from '@/views/mobile/Logbook/Index.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "Logbook",
    components: {
        LogbookWeb,
        LogbookMobile
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
