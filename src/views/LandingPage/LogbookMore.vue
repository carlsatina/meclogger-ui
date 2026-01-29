<template>
    <LogbookMoreWeb v-if="!platformIsMobile"/>
    <LogbookMoreMobile v-else/>
</template>

<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import LogbookMoreWeb from '@/views/web/Logbook/More.vue'
import LogbookMoreMobile from '@/views/mobile/Logbook/More.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "LogbookMore",
    components: {
        LogbookMoreWeb,
        LogbookMoreMobile
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
