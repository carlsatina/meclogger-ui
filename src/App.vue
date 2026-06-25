<template>
    <router-view/>
</template>


<script>
import { provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import store from '@/store'

export default {
    name: "App",
    setup () {
        const route = useRoute()
        const router = useRouter()
        provide('store', store)

        return {
            store,
            route,
            router
        }
    }
}
</script>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    width: 100%;
    min-height: 100dvh;
    /* clip (not hidden) avoids turning body into a vertical scroll container,
       which was creating nested scrollers and the "scroll stops midway" bug */
    overflow-x: clip;
}

#app {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
    min-height: 100dvh;
    width: 100%;
}
</style>
