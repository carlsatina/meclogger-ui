<template>
    <transition name="glass-fade">
        <div v-if="show" class="glass-confirm-overlay" @click.self="cancel">
            <div class="glass-confirm-card odometer-card">
                <h3 class="glass-confirm-title">Update Odometer</h3>
                <p class="glass-confirm-text">Current: {{ current }}</p>
                <input
                    :value="modelValue"
                    type="number"
                    min="0"
                    class="modal-input"
                    @input="$emit('update:modelValue', $event.target.value)"
                />
                <div class="glass-confirm-actions">
                    <button type="button" @click="cancel">Cancel</button>
                    <button type="button" class="confirm" :disabled="saving" @click="$emit('save')">
                        {{ saving ? 'Saving...' : 'Save' }}
                    </button>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    name: 'UpdateOdometerModal',
    props: {
        show: { type: Boolean, default: false },
        current: { type: String, default: '—' },
        modelValue: { type: [String, Number], default: '' },
        saving: { type: Boolean, default: false }
    },
    emits: ['update:show', 'update:modelValue', 'save'],
    setup(props, { emit }) {
        const cancel = () => emit('update:show', false)
        return { cancel }
    }
}
</script>

<style scoped>
.odometer-card { position: relative; overflow: hidden; }
.odometer-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #f97316, #fb923c);
}

.modal-input {
    width: 100%;
    border: 1px solid var(--glass-card-border);
    border-radius: 12px;
    padding: 11px 14px;
    font-size: 16px;
    margin: 8px 0 16px;
    background: var(--glass-ghost-bg);
    color: var(--text-primary);
    box-sizing: border-box;
}
.modal-input:focus { outline: none; border-color: rgba(249, 115, 22, 0.5); }

.glass-confirm-actions .confirm {
    background: linear-gradient(135deg, #f97316, #fb923c) !important;
    color: #fff !important;
    border: none !important;
}
.glass-confirm-actions .confirm:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
