<template>

<div class="col-md-8 view-container ripple" @click="displayServiceDetails(serviceId)">
    <div class="w-100 border rounded-start shadow-">
        <img :src="baseUrl + logo" class="w-100 border rounded-start" height="150" v-if="logo"/>
        <img src="@/assets/imgPlaceholder.png" class="w-100 border rounded-start" height="150" v-else/>
    </div>
    <div class="p-2 border rounded-end shadow" style="font-size: 13px; height: 150px; width: 100%;">
        <div class="d-flex flex-row justify-content-between mt-2">
            <div>
                <span class="alorder-warningign-items-middle">
                    <mdicon name="star" size="18" style="color: goldenrod" />
                    <span class="fw-bold ms-1">5.0</span>
                    <span class="text-secondary ms-1">(4)</span>
                </span>
            </div>
            <div>
                <mdicon name="heart-outline" size="18"/>
            </div>
        </div>
        <div class="mt-2">
            <span class="fw-bold text-success">{{ storeName }}</span><br>
            <span style="font-size: 13px;">{{ address }}</span>
        </div>
        <div class="price d-flex justify-content-end me-4 mb-2">
            <span>from <span class="fw-bold">P50</span></span>
        </div>
    </div>
</div>
</template>

<script>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '@/constants/config'

export default {
    name: "ServiceDisplay",
    props: ['storeName', 'address', 'serviceId', 'logo'],
    setup() {
        const route = useRoute()
        const router = useRouter()
        const baseUrl = API_BASE_URL + '/logo/'

        const displayServiceDetails = (id) => {
            setTimeout(() => {
                router.push("/serviceDetails/" + id)
            }, 400);
        }

        return {
            route,
            router,
            displayServiceDetails,
            baseUrl
        }
    }
}
</script>

<style scoped>

.view-container {
    display: grid;
    grid-template-columns: 50% 50%;
    justify-content:start;
}

.price {
    position: absolute;
    bottom: 0;
    right: 0;
}
</style>
