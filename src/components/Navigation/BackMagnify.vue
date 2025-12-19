<template>
    <div class="row">
        <div class="col-md-2"></div>
        <div class="col-md-8  d-flex flex-row justify-content-between align-items-center">
            <div class="d-flex flex-row justify-content-start align-items-center">
                <mdicon name="chevron-left" @click="router.go(-1)" size="30"/>
            </div>
            <div> <mdicon name="magnify" @click="router.push('/')" size="30"/></div>
        </div>
        <div class="col-md-2"></div>
    </div>
    </template>
    
    <script>
    import { useRouter } from 'vue-router'
    
    export default {
        name: "BackMagnify",
        setup() {
            const router = useRouter()
    
            return {
                router
            }
        }
    }
    </script>