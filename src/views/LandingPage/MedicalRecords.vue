<template>
    <MedicalRecordsWeb v-if="!platformIsMobile"/>
    <MedicalRecordsMobile v-else/>
</template>

<script>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'
import MedicalRecordsWeb from '@/views/web/MedicalRecords/Index.vue'
import MedicalRecordsMobile from '@/views/mobile/MedicalRecords/Index.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "MedicalRecords",
    components: {
        MedicalRecordsWeb,
        MedicalRecordsMobile
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
