<template>
    <transition name="lb-fade">
        <div v-if="visible" class="lb-overlay" @click.self="close">
            <button class="lb-close" type="button" aria-label="Close" @click="close">×</button>
            <div v-if="images.length > 1" class="lb-counter">{{ current + 1 }} / {{ images.length }}</div>

            <button
                v-if="images.length > 1"
                class="lb-nav lb-prev"
                type="button"
                aria-label="Previous"
                @click.stop="prev"
            >‹</button>

            <div
                class="lb-stage"
                @click.self="close"
                @wheel.prevent="onWheel"
                @dblclick="onDblClick"
                @touchstart="onTouchStart"
                @touchmove.prevent="onTouchMove"
                @touchend="onTouchEnd"
            >
                <img
                    :src="images[current]"
                    class="lb-img"
                    :class="{ zoomed: scale > 1 }"
                    :style="imgStyle"
                    draggable="false"
                    alt="Photo"
                    @click.stop
                    @mousedown="onMouseDown"
                />
            </div>

            <button
                v-if="images.length > 1"
                class="lb-nav lb-next"
                type="button"
                aria-label="Next"
                @click.stop="next"
            >›</button>

            <p v-if="hint" class="lb-hint">Double-tap or pinch to zoom</p>
        </div>
    </transition>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

export default {
    name: 'PhotoLightbox',
    props: {
        visible: { type: Boolean, default: false },
        images: { type: Array, default: () => [] },
        startIndex: { type: Number, default: 0 }
    },
    emits: ['close'],
    setup(props, { emit }) {
        const current = ref(props.startIndex)
        const scale = ref(1)
        const tx = ref(0)
        const ty = ref(0)
        const hint = ref(false)

        const resetZoom = () => { scale.value = 1; tx.value = 0; ty.value = 0 }
        const close = () => emit('close')
        const next = () => { current.value = (current.value + 1) % props.images.length; resetZoom() }
        const prev = () => { current.value = (current.value - 1 + props.images.length) % props.images.length; resetZoom() }

        watch(() => props.visible, (v) => {
            if (v) {
                current.value = props.startIndex
                resetZoom()
                hint.value = true
                setTimeout(() => { hint.value = false }, 1800)
            }
        })
        watch(() => props.startIndex, (i) => { current.value = i })

        const imgStyle = computed(() => ({
            transform: `translate(${tx.value}px, ${ty.value}px) scale(${scale.value})`
        }))

        const clampScale = (s) => Math.min(4, Math.max(1, s))

        const onWheel = (e) => {
            scale.value = clampScale(scale.value - e.deltaY * 0.0015)
            if (scale.value === 1) { tx.value = 0; ty.value = 0 }
        }
        const onDblClick = () => {
            if (scale.value > 1) resetZoom()
            else scale.value = 2.5
        }

        // ── touch: pinch-zoom, pan (when zoomed), swipe (when not zoomed) ──
        let mode = null
        let startDist = 0
        let startScale = 1
        let startX = 0
        let startY = 0
        let startTx = 0
        let startTy = 0
        const distance = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

        const onTouchStart = (e) => {
            if (e.touches.length === 2) {
                mode = 'pinch'
                startDist = distance(e.touches)
                startScale = scale.value
            } else if (e.touches.length === 1) {
                if (scale.value > 1) {
                    mode = 'pan'
                    startX = e.touches[0].clientX; startY = e.touches[0].clientY
                    startTx = tx.value; startTy = ty.value
                } else {
                    mode = 'swipe'
                    startX = e.touches[0].clientX
                }
            }
        }
        const onTouchMove = (e) => {
            if (mode === 'pinch' && e.touches.length === 2) {
                scale.value = clampScale(startScale * (distance(e.touches) / startDist))
            } else if (mode === 'pan' && e.touches.length === 1) {
                tx.value = startTx + (e.touches[0].clientX - startX)
                ty.value = startTy + (e.touches[0].clientY - startY)
            }
        }
        const onTouchEnd = (e) => {
            if (mode === 'swipe' && props.images.length > 1) {
                const dx = (e.changedTouches[0]?.clientX || 0) - startX
                if (dx <= -50) next()
                else if (dx >= 50) prev()
            }
            if (mode === 'pinch' && scale.value <= 1.05) resetZoom()
            mode = null
        }

        // ── desktop drag-pan when zoomed ──
        const onMouseDown = (e) => {
            if (scale.value <= 1) return
            e.preventDefault()
            const sx = e.clientX, sy = e.clientY, otx = tx.value, oty = ty.value
            const move = (ev) => { tx.value = otx + (ev.clientX - sx); ty.value = oty + (ev.clientY - sy) }
            const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
            window.addEventListener('mousemove', move)
            window.addEventListener('mouseup', up)
        }

        const onKey = (e) => {
            if (!props.visible) return
            if (e.key === 'Escape') close()
            else if (e.key === 'ArrowRight' && props.images.length > 1) next()
            else if (e.key === 'ArrowLeft' && props.images.length > 1) prev()
        }
        onMounted(() => window.addEventListener('keydown', onKey))
        onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

        return {
            current, scale, hint, imgStyle,
            close, next, prev,
            onWheel, onDblClick, onTouchStart, onTouchMove, onTouchEnd, onMouseDown
        }
    }
}
</script>

<style scoped>
.lb-overlay {
    position: fixed;
    inset: 0;
    z-index: 4000;
    background: rgba(0, 0, 0, 0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    overscroll-behavior: contain;
}
.lb-stage {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    touch-action: none;
}
.lb-img {
    max-width: 92vw;
    max-height: 86vh;
    object-fit: contain;
    user-select: none;
    -webkit-user-drag: none;
    transition: transform 0.08s ease-out;
    cursor: zoom-in;
}
.lb-img.zoomed { cursor: grab; }
.lb-close {
    position: absolute;
    top: calc(12px + env(safe-area-inset-top, 0px));
    right: 14px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    font-size: 26px;
    line-height: 1;
    cursor: pointer;
    z-index: 2;
}
.lb-counter {
    position: absolute;
    top: calc(18px + env(safe-area-inset-top, 0px));
    left: 0;
    right: 0;
    text-align: center;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    pointer-events: none;
}
.lb-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    font-size: 30px;
    line-height: 1;
    cursor: pointer;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
}
.lb-prev { left: 12px; }
.lb-next { right: 12px; }
.lb-hint {
    position: absolute;
    bottom: calc(22px + env(safe-area-inset-bottom, 0px));
    left: 0;
    right: 0;
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    pointer-events: none;
}
.lb-fade-enter-active, .lb-fade-leave-active { transition: opacity 0.2s ease; }
.lb-fade-enter-from, .lb-fade-leave-to { opacity: 0; }
</style>
