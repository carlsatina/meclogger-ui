<template>
    <AddRecordWeb v-if="!platformIsMobile"/>
    <AddRecordMobile v-else/>
</template>

<script>
import { ref } from 'vue'
import AddRecordWeb from '@/views/web/MedicalRecords/AddRecord.vue'
import AddRecordMobile from '@/views/mobile/MedicalRecords/AddRecord.vue'
import isPlatformMobile from '@/composables/platform'

export default {
    name: "AddRecordLandingPage",
    components: {
        AddRecordWeb,
        AddRecordMobile
    },
    setup () {
        const platformIsMobile = ref(false);

        isPlatformMobile()
        .then((data) => {
            platformIsMobile.value = data
        })

        return {
            platformIsMobile
        }
    }
}
</script>

<style scoped>
</style>
