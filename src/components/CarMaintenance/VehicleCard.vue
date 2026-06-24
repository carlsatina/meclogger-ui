<template>
<div class="vehicle-card-wrap">
    <div class="vehicle-pill car-card" @click="togglePicker">
        <div class="vp-photo">
            <img v-if="imageSrc" :src="imageSrc" alt="Vehicle" />
            <mdicon v-else name="car-sports" :size="56"/>
        </div>
        <div class="vp-info">
            <div class="vp-name-row">
                <p class="vp-name">{{ vehicle ? vehicleName(vehicle) : 'Select a vehicle' }}</p>
                <mdicon name="chevron-down" :size="20" class="vp-switch"/>
            </div>
            <div class="vp-odo-row">
                <div class="vp-odo">
                    <span class="vp-odo-label">Odometer</span>
                    <span class="vp-odo-value">{{ vehicle ? odometer : '—' }}</span>
                </div>
                <button class="vp-update" @click.stop="$emit('update')" :disabled="!vehicle" aria-label="Update odometer" title="Update odometer">
                    <mdicon name="pencil" :size="16"/>
                </button>
            </div>
            <p class="vp-updated">Last update: {{ lastUpdate || '—' }}</p>
        </div>
    </div>
    <div v-if="showPicker" class="vehicle-picker car-card">
        <button
            v-for="v in vehicles"
            :key="v.id"
            class="picker-item"
            type="button"
            @click.stop="onSelect(v.id)"
        >
            <span class="picker-name">{{ vehicleName(v) }}</span>
            <span class="picker-odo">Odometer: {{ formatMileage(v.currentMileage) }}</span>
        </button>
        <p v-if="!vehicles.length" class="picker-empty">No vehicles yet.</p>
    </div>
</div>
</template>

<script>
import { ref, computed } from 'vue'
import { API_BASE_URL } from '@/constants/config'

export default {
    name: "VehicleCard",
    props: {
        vehicle: { type: Object, default: null },
        vehicles: { type: Array, default: () => [] },
        odometer: { type: String, default: '—' },
        lastUpdate: { type: String, default: '' },
        formatMileage: { type: Function, default: (v) => (v ?? '—') }
    },
    emits: ['update', 'select'],
    setup(props, { emit }) {
        const showPicker = ref(false)
        const togglePicker = () => { showPicker.value = !showPicker.value }
        const onSelect = (id) => {
            emit('select', id)
            showPicker.value = false
        }
        const vehicleName = (v) => {
            if (!v) return 'Vehicle'
            const parts = [v.make, v.model, v.year].filter(Boolean)
            return parts.join(' ').trim() || 'Vehicle'
        }
        const imageSrc = computed(() => {
            const url = props.vehicle?.imageUrl
            if (!url) return ''
            return url.startsWith('http') ? url : `${API_BASE_URL}${url}`
        })
        return { showPicker, togglePicker, onSelect, vehicleName, imageSrc }
    }
}
</script>

<style scoped>
.vehicle-pill {
    background: var(--glass-card-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 18px !important;
    padding: 0 !important;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: var(--glass-card-shadow) !important;
}
.vp-photo {
    width: 100%;
    height: 150px;
    background: rgba(249, 115, 22, 0.12);
    border-bottom: 1px solid rgba(249, 115, 22, 0.18);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    color: #fb923c;
}
.vp-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }

.vp-info { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 7px; }
.vp-name-row { display: flex; align-items: center; gap: 8px; }
.vp-name {
    margin: 0; flex: 1; min-width: 0;
    font-size: 17px; font-weight: 800; color: var(--text-primary);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.vp-switch { color: var(--text-muted); flex-shrink: 0; }

.vp-odo-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.vp-odo { display: flex; flex-direction: column; min-width: 0; }
.vp-odo-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.vp-odo-value { font-size: 16px; font-weight: 800; color: var(--text-primary); line-height: 1.2; }

.vp-update {
    display: inline-flex; align-items: center; justify-content: center;
    width: 34px; height: 34px;
    background: rgba(249, 115, 22, 0.12);
    border: 1px solid rgba(249, 115, 22, 0.28) !important;
    color: #fb923c;
    border-radius: 10px;
    cursor: pointer; flex-shrink: 0;
    box-shadow: none !important;
    transition: transform 0.12s, background 0.12s;
}
.vp-update:active { transform: scale(0.94); }
.vp-update:disabled { opacity: 0.5; cursor: default; }

.vp-updated { margin: 0; font-size: 11px; color: var(--text-muted); }

/* Vehicle picker dropdown */
.vehicle-picker {
    background: var(--glass-card-bg) !important;
    border: 1px solid var(--glass-card-border) !important;
    border-radius: 12px !important;
    margin-top: 8px;
    overflow: hidden;
    box-shadow: var(--glass-card-shadow);
}
.picker-item { width: 100%; border: none; background: transparent; padding: 12px 16px; text-align: left; display: flex; flex-direction: column; gap: 2px; cursor: pointer; transition: background 0.15s; }
.picker-item:hover { background: rgba(249, 115, 22, 0.06); }
.picker-item + .picker-item { border-top: 1px solid var(--glass-card-border); }
.picker-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.picker-odo { font-size: 12px; color: var(--text-muted); }
.picker-empty { margin: 0; padding: 12px 16px; color: var(--text-muted); font-size: 13px; }
</style>
