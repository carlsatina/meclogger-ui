<template>
    <div class="root">
            <teleport to="body">
                <transition name="fade" appear>
                <div class="modal" @keyup.esc="close" tabindex="0">
                    <div class="modal-container d-flex flex-column shadow-sm" ref="modal" >
                        <div class="d-flex flex-row justify-content-between align-items-center">
                            <div class="d-flex flex-row justify-content-start align-items-center">
                                <mdicon name="chevron-left" @click="close" size="30"/>
                            </div>
                            <div> <mdicon name="heart-outline" /></div>
                        </div>
                        
                        <img src="@/assets/lamp.jpg" class="w-100" height="200"/>
                        <div class="d-flex flex-row justify-content-between align-items-center" v-if="serviceDetails">
                            <div class="d-flex flex-row justify-content-start align-items-center mt-2">
                                <div><img src="@/assets/female-avatar.png" width="40" style="border-radius: 50%;"/></div>
                                <div class="ms-3 lh-1">
                                    <span class="fw-bold text-success">{{ serviceDetails.store_name }}</span><br>
                                    <span style="font-size: 15px; color: lightslategray">{{ serviceDetails.address.address }} {{ serviceDetails.address.barangay }}</span>
                                </div>
                            </div>
                            <div>
                                <mdicon name="chevron-down" size="30"/>
                            </div>
                        </div>

                        <div class="mt-4 lh-1">
                            <span class="fw-bold fs-3">Do you a Massage? I'm available for you and I can do for free....</span>
                        </div>

                        <div class="mt-3">
                            <p>{{ displayedText }}</p>
                            <p v-if="!isCollapsed">{{ secondSentence }}</p>
                            <p class="text-btn text-success fw-bold text-end" @click="expandText" v-if="isCollapsed" style="font-size: 13px;">Show more</p>
                            <p class="text-btn text-success fw-bold text-end" @click="collapseText(50)" v-else style="font-size: 13px;">Show less</p>
                        </div>

                        <div class="mt-3" v-if="serviceDetails">
                            <div class="fw-bold fs-5">Services Offered</div>
                            <div class="d-flex flex-row justify-content-between align-items-center mt-2" v-for="(service, index) in serviceDetails.services">
                                <div>{{ service.description }}</div>
                                <div>
                                    <span class="fw-bold text-warning">
                                        <mdicon name="check" size="20"/>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="mt-3" v-if="serviceDetails">
                            <div class="fw-bold fs-5">Contact Numbers</div>
                            <div class="d-flex flex-row justify-content-between mt-1" v-for="(service, index) in serviceDetails.contact_number">
                                <div><mdicon name="phone-classic" size="16" class="me-3 align-items-center"/>{{ service.contact_no }}</div>
                                <div>
                                    <span class="fw-bold text-info">
                                        {{ service.label }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </transition>
            </teleport>
    </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import getServiceDetail from '@/composables/services/getServiceDetail'

export default {
    name: 'ServiceDetailsModal',
    props: {
        id: {
            type: Number
        }
    },
    setup(props, { emit }) {
        const modal = ref(null)
        const router = useRouter()
        const isExpanded = ref(true)
        const displayedText = ref('')
        const firstSentence = "Are you looking for a massage therapist? I can do it for free! I can make my time always available to you!"
        const secondSentence = "I've been doing this for around 10 years or more now and most of my customers were very very satisfied to my performance."
        const isCollapsed = ref(false)
        const serviceDetails = ref(null)


        getServiceDetail(props.id)
        .then((data) => {
            if (data.error.value === null) {
                serviceDetails.value = data.response.value
            }
        })
        const toggleCtaLabel = computed(() => {
            isExpanded.value ? "Collapse" : "Expand"
        })
        
        const close = () => {
            emit("close")
        }
        onMounted(() => {
            collapseText(50)
        })

        const expandText = () => {
            displayedText.value = firstSentence
            isCollapsed.value = !isCollapsed.value
        }

        const collapseText = (textSize) => {
            displayedText.value = firstSentence.slice(0, textSize)
            isCollapsed.value = !isCollapsed.value
        }

        return {
            modal,
            close,
            router,
            isExpanded,
            toggleCtaLabel,
            firstSentence,
            secondSentence,
            expandText,
            collapseText,
            isCollapsed,
            displayedText,
            serviceDetails
        }


    },
};
</script>

<style lang="scss" scoped>
.modal {
    top: 0;
    left: 0;
    background-color: rgba(0,0,0,0.2);
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-container {
    font-family: "rat";
    background-color: #fff;
    padding: 15px 20px 20px;
    border-radius: 2px;
    width: 550px;
    height: 100%;
    overflow: scroll;
}
.modal-container::-webkit-scrollbar {
    display: none;
}

.fade-enter-active,
.fade-leave-active {
    transition: all 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

</style>