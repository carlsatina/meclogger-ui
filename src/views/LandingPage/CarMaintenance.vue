<template>
    <CarMaintenanceWeb v-if="!platformIsMobile"/>
    <CarMaintenanceMobile v-else/>
</template>

<script>
import { ref, provide, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import CarMaintenanceWeb from '@/views/web/CarMaintenance/Index.vue'
import CarMaintenanceMobile from '@/views/mobile/CarMaintenance/Index.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "CarMaintenance",
    components: {
        CarMaintenanceWeb,
        CarMaintenanceMobile
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
