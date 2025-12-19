<template>

<div class="cold-md-12 d-flex flex-row justify-content-between p-2 border-light" style="cursor: pointer;">
    <div>
        <mdicon :name="iconName" size="30" style="color: lightgray"/>
        <span class="ms-3">{{ menu }}</span>
    </div>
    <div><mdicon name="chevron-right" size="30"/></div>
</div>
</template>

<script>

export default {
    name: "AccountMenu",
    props: {
        menu: {
            type: String,
            default: ''
        },
        iconName: {
            type: String,
            default: ''
        }
    }
}
</script>

<style></style>