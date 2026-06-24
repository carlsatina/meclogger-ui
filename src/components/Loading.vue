<template>
    <teleport to="body">
        <transition name="lm-fade" appear>
            <div class="lm-overlay" role="status" aria-live="polite" aria-label="Loading">
                <div class="lm-card">
                    <div class="lm-spinner"></div>
                    <p v-if="label" class="lm-label">{{ label }}</p>
                </div>
            </div>
        </transition>
    </teleport>
</template>

<script>
export default {
    name: 'Loading',
    props: {
        label: { type: String, default: '' }
    }
}
</script>

<style scoped>
.lm-overlay {
    position: fixed;
    inset: 0;
    z-index: 5000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(3, 4, 8, 0.6);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
}
.lm-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 26px 32px;
    border-radius: 18px;
    background: var(--glass-card-bg, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--glass-card-border, rgba(148, 163, 184, 0.2));
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}
/* Gradient ring spinner: a conic gradient masked into a ring. */
.lm-spinner {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, transparent 6%, var(--accent-3, #06b6d4), var(--accent-1, #6366f1));
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 5px));
    mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 5px));
    animation: lm-spin 0.85s linear infinite;
}
.lm-label {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--text-secondary, #94a3b8);
}
@keyframes lm-spin {
    to { transform: rotate(360deg); }
}
.lm-fade-enter-active,
.lm-fade-leave-active {
    transition: opacity 0.25s ease;
}
.lm-fade-enter-from,
.lm-fade-leave-to {
    opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
    .lm-spinner { animation-duration: 1.6s; }
}
</style>
