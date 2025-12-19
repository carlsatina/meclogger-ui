<template>
<div class="record-detail-container medical-shell">
    <div class="medical-orb orb-1"></div>
    <div class="medical-orb orb-2"></div>
    <div class="record-detail-wrapper glass-card">
        <div class="detail-header">
            <button class="back-btn" @click="goBack">
                <mdicon name="arrow-left" :size="22"/>
            </button>
            <div class="header-text">
                <p class="record-type-label">{{ recordTypeLabel }}</p>
                <h2 class="record-title">{{ record?.title || 'Record Detail' }}</h2>
                <p class="record-date" v-if="record">{{ formattedDate }}</p>
            </div>
            <div class="header-actions" v-if="record">
                <button 
                    class="edit-btn"
                    @click="goToEdit"
                >
                    <mdicon name="pencil" :size="18"/>
                    <span>Edit</span>
                </button>
                <button 
                    class="delete-btn"
                    @click="showDeleteConfirm = true"
                >
                    <mdicon name="trash-can-outline" :size="18"/>
                    <span>Delete</span>
                </button>
            </div>
        </div>

        <div v-if="loading" class="state-card">Loading record...</div>
        <div v-else-if="errorMessage" class="state-card error">{{ errorMessage }}</div>

        <div v-else-if="record" class="detail-body">
            <section class="attachments-panel">
                <div class="section-heading">
                    <h3>Attachments</h3>
                    <span class="section-hint">Browse the uploaded files</span>
                </div>
                <div v-if="imageFiles.length" class="image-viewer">
                    <button class="viewer-nav left" @click="previousImage" :disabled="!canGoPrevious">
                        <mdicon name="chevron-left" :size="22"/>
                    </button>
                    <div 
                        class="viewer-frame" 
                        role="button" 
                        tabindex="0"
                        @click="openFullSizeViewer(viewerIndex)"
                        @keydown.enter.prevent="openFullSizeViewer(viewerIndex)"
                        @keydown.space.prevent="openFullSizeViewer(viewerIndex)"
                    >
                        <img 
                            :src="resolveFileUrl(currentImage?.url)" 
                            :alt="currentImage?.originalName || 'Attachment image'"
                        />
                        <div class="viewer-frame-hint">Click to view full size</div>
                    </div>
                    <button class="viewer-nav right" @click="nextImage" :disabled="!canGoNext">
                        <mdicon name="chevron-right" :size="22"/>
                    </button>
                </div>
                <p v-else class="empty-hint">No image attachments uploaded.</p>
                <div v-if="imageFiles.length" class="viewer-meta">
                    <p class="viewer-title">{{ currentImage?.originalName || 'Image attachment' }}</p>
                    <p class="viewer-count">Image {{ viewerIndex + 1 }} of {{ imageFiles.length }}</p>
                </div>

                <div v-if="otherFiles.length" class="file-list">
                    <a 
                        class="file-row"
                        v-for="file in otherFiles" 
                        :key="file.id"
                        :href="resolveFileUrl(file.url)"
                        target="_blank"
                        rel="noopener"
                    >
                        <div class="file-icon">
                            <mdicon name="file-document-outline" :size="24"/>
                        </div>
                        <div class="file-meta">
                            <p class="file-name">{{ file.originalName || 'Document' }}</p>
                            <p class="file-size">{{ formatFileSize(file.sizeBytes) }}</p>
                        </div>
                        <mdicon name="open-in-new" :size="18"/>
                    </a>
                </div>
            </section>

            <div class="info-panel">
                <section class="summary-card">
                    <div class="summary-grid">
                        <div class="summary-item">
                            <p class="summary-label">Profile</p>
                            <p class="summary-value">{{ record.profile?.displayName || 'Unknown profile' }}</p>
                        </div>
                        <div class="summary-item">
                            <p class="summary-label">Provider</p>
                            <p class="summary-value">{{ record.providerName || 'Not specified' }}</p>
                        </div>
                        <div class="summary-item">
                            <p class="summary-label">Record Date</p>
                            <p class="summary-value">{{ formattedDate }}</p>
                        </div>
                    </div>
                </section>

                <section class="notes-card">
                    <div class="section-heading">
                        <h3>Notes</h3>
                        <span class="section-hint">Additional context or doctor instructions</span>
                    </div>
                    <p v-if="record.notes" class="notes-text">{{ record.notes }}</p>
                    <p v-else class="empty-hint">No notes added for this record.</p>
                </section>

                <section class="tags-card">
                    <div class="section-heading">
                        <h3>Tags</h3>
                    </div>
                    <div v-if="record.tags?.length" class="tag-list">
                        <span class="tag-chip" v-for="tag in record.tags" :key="tag">{{ tag }}</span>
                    </div>
                    <p v-else class="empty-hint">No tags added.</p>
                </section>
            </div>
        </div>
    </div>

    <div 
        v-if="viewerState.open" 
        class="lightbox-overlay"
        @click.self="closeFullSizeViewer"
    >
        <div class="lightbox-content">
            <button class="lightbox-close" @click="closeFullSizeViewer">
                <mdicon name="close" :size="22"/>
            </button>
            <div class="lightbox-main">
                <button class="lightbox-nav" @click="previousImage" :disabled="!canGoPrevious">
                    <mdicon name="chevron-left" :size="26"/>
                </button>
                <div class="lightbox-frame">
                    <img 
                        v-if="currentImage"
                        :src="resolveFileUrl(currentImage?.url)"
                        :alt="currentImage?.originalName || 'Attachment image'"
                        :style="expandedImageStyle"
                        :class="{ dragging: viewerState.dragging }"
                        @wheel.prevent="onWheelZoom"
                        @mousedown.prevent="onImageMouseDown"
                        @mousemove.prevent="onImageMouseMove"
                        @mouseup="onImageMouseUp"
                        @mouseleave="onImageMouseUp"
                        @touchstart.prevent="onImageTouchStart"
                        @touchmove.prevent="onImageTouchMove"
                        @touchend="onImageTouchEnd"
                        @touchcancel="onImageTouchEnd"
                    />
                </div>
                <button class="lightbox-nav" @click="nextImage" :disabled="!canGoNext">
                    <mdicon name="chevron-right" :size="26"/>
                </button>
            </div>
            <div class="lightbox-controls" v-if="currentImage">
                <label>Zoom</label>
                <input 
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    v-model.number="viewerZoom"
                />
                <button class="reset-btn" type="button" @click="resetViewerTransform">Reset</button>
            </div>
            <div class="lightbox-caption" v-if="currentImage">
                <p class="viewer-title">{{ currentImage?.originalName || 'Image attachment' }}</p>
                <p class="viewer-count">Image {{ viewerIndex + 1 }} of {{ imageFiles.length }}</p>
            </div>
        </div>
    </div>

    <div v-if="showDeleteConfirm" class="confirm-overlay">
        <div class="confirm-modal glass-card">
            <h3>Delete this record?</h3>
            <p>This will remove the record and its attachments.</p>
            <div class="confirm-actions">
                <button class="glass-btn-ghost" type="button" @click="showDeleteConfirm = false">Cancel</button>
                <button class="delete-btn" type="button" :disabled="deleting" @click="deleteRecordAction">
                    <mdicon :name="deleting ? 'loading' : 'trash-can-outline'" :size="18" :class="{ spin: deleting }"/>
                    <span>{{ deleting ? 'Deleting...' : 'Delete' }}</span>
                </button>
            </div>
            <p v-if="deleteError" class="error-text">{{ deleteError }}</p>
        </div>
    </div>
</div>
</template>

<script>
import { ref, computed, onMounted, watch, onBeforeUnmount, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMedicalRecords } from '@/composables/medicalRecords'
import { API_BASE_URL } from '@/constants/config'

const recordTypeMeta = {
    LAB_RESULT: 'Lab Report',
    PRESCRIPTION: 'Prescription',
    INVOICE: 'Invoice',
    VACCINATION: 'Vaccination',
    DIAGNOSIS: 'Diagnosis',
    IMAGING: 'Imaging',
    DISCHARGE_SUMMARY: 'Discharge Summary',
    OTHER: 'Other'
}

export default {
    name: 'WebMedicalRecordDetail',
    setup() {
        const router = useRouter()
        const route = useRoute()
        const { fetchRecordById, deleteRecord } = useMedicalRecords()
        const record = ref(null)
        const loading = ref(true)
        const errorMessage = ref('')
        const viewerIndex = ref(0)
        const deleting = ref(false)
        const deleteError = ref('')
        const showDeleteConfirm = ref(false)
        const viewerState = reactive({
            open: false,
            zoom: 1,
            offsetX: 0,
            offsetY: 0,
            dragging: false
        })
        const pinchState = reactive({
            active: false,
            initialDistance: 0,
            initialZoom: 1
        })
        const dragState = reactive({
            active: false,
            startX: 0,
            startY: 0,
            initialX: 0,
            initialY: 0
        })

        const recordId = computed(() => typeof route.params.id === 'string' ? route.params.id : '')

        const recordTypeLabel = computed(() => {
            if (!record.value) return ''
            return recordTypeMeta[record.value.recordType] || recordTypeMeta.OTHER
        })

        const formattedDate = computed(() => {
            if (!record.value?.recordDate) return 'Unknown date'
            return new Date(record.value.recordDate).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            })
        })

        const imageFiles = computed(() => {
            if (!record.value?.files) return []
            return record.value.files.filter(file => file.mimeType?.startsWith('image/'))
        })

        const otherFiles = computed(() => {
            if (!record.value?.files) return []
            return record.value.files.filter(file => !file.mimeType?.startsWith('image/'))
        })

        const currentImage = computed(() => {
            return imageFiles.value[viewerIndex.value] || null
        })

        const canGoPrevious = computed(() => viewerIndex.value > 0)
        const canGoNext = computed(() => viewerIndex.value < imageFiles.value.length - 1)

        const viewerZoom = computed({
            get: () => viewerState.zoom,
            set: (value) => {
                viewerState.zoom = clampZoom(Number(value) || 1)
                if (viewerState.zoom === 1) {
                    viewerState.offsetX = 0
                    viewerState.offsetY = 0
                }
            }
        })

        const expandedImageStyle = computed(() => ({
            transform: `translate(${viewerState.offsetX}px, ${viewerState.offsetY}px) scale(${viewerState.zoom})`
        }))

        const previousImage = () => {
            if (!canGoPrevious.value) return
            viewerIndex.value -= 1
        }

        const nextImage = () => {
            if (!canGoNext.value) return
            viewerIndex.value += 1
        }

        const clampZoom = (value) => Math.min(3, Math.max(1, value))

        const resetViewerTransform = () => {
            viewerState.zoom = 1
            viewerState.offsetX = 0
            viewerState.offsetY = 0
            viewerState.dragging = false
            dragState.active = false
            pinchState.active = false
        }

        const openFullSizeViewer = (index = 0) => {
            if (!imageFiles.value.length) return
            viewerIndex.value = index
            resetViewerTransform()
            viewerState.open = true
        }

        const closeFullSizeViewer = () => {
            viewerState.open = false
            resetViewerTransform()
        }

        const distanceBetweenTouches = (touches) => {
            if (touches.length < 2) return 0
            const [touch1, touch2] = [touches[0], touches[1]]
            const dx = touch2.clientX - touch1.clientX
            const dy = touch2.clientY - touch1.clientY
            return Math.hypot(dx, dy)
        }

        const startDrag = (x, y) => {
            dragState.active = true
            dragState.startX = x
            dragState.startY = y
            dragState.initialX = viewerState.offsetX
            dragState.initialY = viewerState.offsetY
            viewerState.dragging = true
        }

        const updateDrag = (x, y) => {
            if (!dragState.active) return
            const deltaX = (x - dragState.startX) / viewerState.zoom
            const deltaY = (y - dragState.startY) / viewerState.zoom
            viewerState.offsetX = dragState.initialX + deltaX
            viewerState.offsetY = dragState.initialY + deltaY
        }

        const endDrag = () => {
            dragState.active = false
            viewerState.dragging = false
        }

        const onWheelZoom = (event) => {
            if (!viewerState.open) return
            const delta = event.deltaY < 0 ? 0.1 : -0.1
            viewerZoom.value = clampZoom(viewerState.zoom + delta)
        }

        const onImageMouseDown = (event) => {
            if (!viewerState.open) return
            startDrag(event.clientX, event.clientY)
        }

        const onImageMouseMove = (event) => {
            if (!viewerState.open || !dragState.active) return
            updateDrag(event.clientX, event.clientY)
        }

        const onImageMouseUp = () => {
            if (!viewerState.open) return
            endDrag()
        }

        const onImageTouchStart = (event) => {
            if (!viewerState.open) return
            if (event.touches.length === 2) {
                pinchState.active = true
                pinchState.initialDistance = distanceBetweenTouches(event.touches)
                pinchState.initialZoom = viewerState.zoom
                endDrag()
            } else if (event.touches.length === 1) {
                const touch = event.touches[0]
                startDrag(touch.clientX, touch.clientY)
            }
        }

        const onImageTouchMove = (event) => {
            if (!viewerState.open) return
            if (pinchState.active && event.touches.length >= 2) {
                const newDistance = distanceBetweenTouches(event.touches)
                if (!pinchState.initialDistance) return
                const scale = newDistance / pinchState.initialDistance
                viewerZoom.value = clampZoom(pinchState.initialZoom * scale)
                return
            }
            if (event.touches.length === 1 && dragState.active) {
                const touch = event.touches[0]
                updateDrag(touch.clientX, touch.clientY)
            }
        }

        const onImageTouchEnd = () => {
            if (pinchState.active) {
                pinchState.active = false
            }
            if (dragState.active) {
                endDrag()
            }
        }

        const handleKeydown = (event) => {
            if (event.key === 'Escape' && viewerState.open) {
                closeFullSizeViewer()
            }
        }

        watch(imageFiles, (files) => {
            if (!files.length) {
                viewerIndex.value = 0
                closeFullSizeViewer()
                return
            }
            if (viewerIndex.value >= files.length) {
                viewerIndex.value = files.length - 1
            }
        })

        watch(viewerIndex, () => {
            if (viewerState.open) {
                resetViewerTransform()
            }
        })

        const resolveFileUrl = (url = '') => {
            if (!url) return ''
            if (url.startsWith('http')) {
                return url
            }
            return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`
        }

        const formatFileSize = (bytes = 0) => {
            if (!bytes) return 'Unknown size'
            if (bytes < 1024) return `${bytes} B`
            if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        }

        const loadRecord = async () => {
            const token = localStorage.getItem('token')
            if (!token || !recordId.value) {
                errorMessage.value = 'Record not found.'
                loading.value = false
                return
            }
            loading.value = true
            try {
                const data = await fetchRecordById(token, recordId.value)
                record.value = data
                viewerIndex.value = 0
            } catch (err) {
                errorMessage.value = err.message || 'Unable to load record.'
            } finally {
                loading.value = false
            }
        }

        const goBack = () => {
            router.back()
        }

        const goToEdit = () => {
            router.push({
                path: '/medical-records/add-record',
                query: { recordId: recordId.value }
            })
        }

        const deleteRecordAction = async () => {
            if (!recordId.value) return
            const token = localStorage.getItem('token')
            if (!token) {
                deleteError.value = 'Please log in again.'
                return
            }
            deleting.value = true
            deleteError.value = ''
            try {
                await deleteRecord(token, recordId.value)
                router.push('/medical-records?tab=records')
            } catch (err) {
                deleteError.value = err?.message || 'Unable to delete record.'
            } finally {
                deleting.value = false
                showDeleteConfirm.value = false
            }
        }

        onMounted(() => {
            loadRecord()
            document.addEventListener('keydown', handleKeydown)
        })

        onBeforeUnmount(() => {
            document.removeEventListener('keydown', handleKeydown)
        })

        return {
            record,
            loading,
            errorMessage,
            recordTypeLabel,
            formattedDate,
            imageFiles,
            otherFiles,
            currentImage,
            viewerIndex,
            canGoPrevious,
            canGoNext,
            viewerState,
            viewerZoom,
            expandedImageStyle,
            resolveFileUrl,
            formatFileSize,
            goBack,
            goToEdit,
            deleteRecordAction,
            deleting,
            deleteError,
            showDeleteConfirm,
            previousImage,
            nextImage,
            openFullSizeViewer,
            closeFullSizeViewer,
            resetViewerTransform,
            onWheelZoom,
            onImageMouseDown,
            onImageMouseMove,
            onImageMouseUp,
            onImageTouchStart,
            onImageTouchMove,
            onImageTouchEnd,
            deleteRecordAction
        }
    }
}
</script>

<style scoped>
.medical-shell {
    min-height: 100vh;
    background: var(--bg-main);
    position: relative;
    overflow: hidden;
    padding: 32px 16px;
    display: flex;
    align-items: flex-start;
    justify-content: center;
}

.medical-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.35;
    z-index: 0;
}

.medical-orb.orb-1 {
    width: 360px;
    height: 360px;
    top: -140px;
    left: -100px;
    background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
}

.medical-orb.orb-2 {
    width: 320px;
    height: 320px;
    bottom: -160px;
    right: -120px;
    background: linear-gradient(135deg, var(--accent-3), var(--accent-4));
}

.record-detail-wrapper {
    width: 100%;
    max-width: 1100px;
    background: var(--glass-card-bg);
    border-radius: 24px;
    box-shadow: var(--glass-card-shadow);
    padding: 32px;
    border: 1px solid var(--glass-card-border);
    position: relative;
    z-index: 1;
}

.detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 1px solid var(--glass-card-border);
    padding-bottom: 20px;
    margin-bottom: 24px;
}
.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.back-btn {
    border: 1px solid var(--glass-card-border);
    background: var(--glass-ghost-bg);
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-primary);
}

.header-text { flex: 1; }

.record-type-label {
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 1px;
    color: var(--text-secondary);
    margin: 0 0 6px;
}

.record-title { margin: 0; font-size: 28px; color: var(--text-primary); }

.record-date { margin: 6px 0 0; color: var(--text-muted); }

.edit-btn {
    border: none;
    background: linear-gradient(135deg, var(--accent-1), var(--accent-3));
    color: #0b1020;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 12px;
    padding: 10px 18px;
    cursor: pointer;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
}
.delete-btn {
    border: 1px solid rgba(248, 113, 113, 0.35);
    background: linear-gradient(135deg, #f97316, #ef4444);
    color: #0b1020;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 12px;
    padding: 10px 14px;
    cursor: pointer;
    box-shadow: 0 10px 20px rgba(239, 68, 68, 0.25);
}

.state-card {
    padding: 16px;
    border-radius: 12px;
    background: var(--glass-ghost-bg);
    color: var(--text-primary);
    border: 1px solid var(--glass-card-border);
    box-shadow: var(--glass-card-shadow);
}

.state-card.error { border-color: rgba(248, 113, 113, 0.35); color: #fecdd3; }

.detail-body { display: grid; grid-template-columns: 1fr 1.2fr; gap: 18px; }

.attachments-panel, .info-panel {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 16px;
    padding: 16px;
    box-shadow: var(--glass-card-shadow);
}

.section-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; color: var(--text-primary); }
.section-heading h3 { margin: 0; color: var(--text-primary); }
.section-hint { color: var(--text-muted); font-size: 13px; }

.image-viewer {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 8px;
    background: rgba(0,0,0,0.3);
    border-radius: 14px;
    overflow: hidden;
    color: white;
}

.viewer-nav { background: rgba(255,255,255,0.08); border: none; color: white; height: 100%; padding: 12px; cursor: pointer; }
.viewer-nav:disabled { opacity: 0.4; cursor: not-allowed; }
.viewer-frame { width: 100%; height: 260px; display: grid; place-items: center; background: #0b1324; position: relative; }
.viewer-frame img { max-width: 100%; max-height: 100%; object-fit: contain; }
.viewer-frame-hint {
    position: absolute;
    bottom: 10px;
    right: 14px;
    background: rgba(11, 19, 36, 0.75);
    color: #e2e8f0;
    padding: 6px 10px;
    border-radius: 10px;
    font-size: 12px;
}
.viewer-meta { display: flex; align-items: center; justify-content: space-between; color: var(--text-primary); margin-top: 8px; }
.viewer-title { margin: 0; font-weight: 700; }
.viewer-count { margin: 0; color: var(--text-muted); }

.file-list { margin-top: 12px; display: grid; gap: 8px; }
.file-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 10px;
    border: 1px solid var(--glass-card-border);
    border-radius: 12px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
    background: var(--glass-card-bg);
}
.file-row:hover { transform: translateY(-1px); border-color: rgba(103, 232, 249, 0.4); }
.file-icon { width: 42px; height: 42px; background: var(--glass-ghost-bg); border-radius: 12px; display: grid; place-items: center; color: var(--text-primary); border: 1px solid var(--glass-card-border); }
.file-name { margin: 0; font-weight: 700; color: var(--text-primary); }
.file-size { margin: 2px 0 0; color: var(--text-muted); font-size: 13px; }

.summary-card { background: var(--glass-card-bg); color: var(--text-primary); border-radius: 12px; padding: 14px; border: 1px solid var(--glass-card-border); box-shadow: var(--glass-card-shadow); }
.summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.summary-item { background: var(--glass-ghost-bg); border-radius: 10px; padding: 10px; border: 1px solid var(--glass-card-border); }
.summary-label { margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
.summary-value { margin: 2px 0 0; font-size: 15px; font-weight: 700; color: var(--text-primary); }

.notes-card { margin-top: 12px; background: var(--glass-ghost-bg); border-radius: 12px; padding: 12px; border: 1px solid var(--glass-card-border); color: var(--text-primary); }
.notes-card h4 { margin: 0 0 6px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
.notes-card p { margin: 0; line-height: 1.5; }

.cta-row { margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap; }
.cta-row .glass-pill { border-radius: 999px; padding: 8px 12px; display: inline-flex; align-items: center; gap: 8px; }
.delete-btn { background: linear-gradient(135deg, #f97316, #ef4444); color: #0b1020; }
.empty-hint { color: var(--text-muted); margin: 8px 0 0; }

.action-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; }
.action-buttons { display: flex; gap: 10px; }
.action-buttons .glass-btn-primary { padding: 10px 14px; }
.action-buttons .danger { background: linear-gradient(135deg, #f97316, #ef4444); color: #0b1020; }

@media (max-width: 1024px) { .detail-body { grid-template-columns: 1fr; } .record-detail-wrapper { padding: 20px; } }

.lightbox-overlay {
    position: fixed;
    inset: 0;
    background: rgba(5, 8, 20, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
    padding: 20px;
    backdrop-filter: blur(4px);
}

.lightbox-content {
    width: min(1100px, 100%);
    color: #e2e8f0;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.lightbox-close {
    position: absolute;
    top: -14px;
    right: -14px;
    border: none;
    background: rgba(255,255,255,0.14);
    color: #0b1020;
    border-radius: 50%;
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
}

.lightbox-main {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 10px;
    align-items: center;
}

.lightbox-frame {
    background: #0b1324;
    border-radius: 16px;
    height: 70vh;
    max-height: 760px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
}

.lightbox-frame img {
    max-width: 100%;
    max-height: 100%;
    transform-origin: center center;
    transition: transform 0.15s ease;
    cursor: grab;
}

.lightbox-frame img.dragging {
    cursor: grabbing;
}

.lightbox-nav {
    border: none;
    background: rgba(255,255,255,0.14);
    color: #0b1020;
    border-radius: 12px;
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(0,0,0,0.25);
}

.lightbox-nav:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.lightbox-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,255,255,0.04);
    border-radius: 12px;
    padding: 10px 12px;
}

.lightbox-controls input[type="range"] {
    flex: 1;
}

.reset-btn {
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.1);
    color: #e2e8f0;
    border-radius: 10px;
    padding: 8px 12px;
    cursor: pointer;
}

.lightbox-caption {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: #e2e8f0;
}

.confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    display: grid;
    place-items: center;
    z-index: 3500;
    padding: 20px;
}

.confirm-modal {
    max-width: 420px;
    width: 100%;
    padding: 18px;
    color: var(--text-primary);
}

.confirm-modal h3 {
    margin: 0 0 6px;
}

.confirm-modal p {
    margin: 0 0 14px;
    color: var(--text-secondary);
}

.confirm-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.confirm-actions .delete-btn {
    min-width: 120px;
    justify-content: center;
}

.error-text {
    margin: 8px 0 0;
    color: #f87171;
}
</style>
