<template>
<div class="add-record-container medical-shell">
    <div class="medical-orb orb-1"></div>
    <div class="medical-orb orb-2"></div>
    <div class="add-record-wrapper glass-card">
        <div v-if="uploading" class="upload-overlay">
            <div class="upload-modal glass-card">
                <mdicon name="loading" :size="32" class="spin"/>
                <p>Optimizing your images...</p>
            </div>
        </div>
        <!-- Header -->
        <div class="header">
            <button class="close-btn" @click="goBack">
                <mdicon name="close" :size="24"/>
            </button>
            <h2 class="page-title">{{ headerTitle }}</h2>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="form-layout">
                <!-- Attachments -->
                <section class="card-section attachments-card">
                    <div class="section-header">
                        <div>
                            <p class="section-label">Attachments</p>
                            <h3 class="section-title">Upload supporting files</h3>
                        </div>
                        <span class="section-hint">PNG, JPG up to 5MB (images >2MB auto-resized)</span>
                    </div>
                    <div class="image-upload-section">
                        <div 
                            class="image-preview" 
                            v-for="(fileEntry, index) in selectedFiles" 
                            :key="fileEntry.id"
                        >
                            <img 
                                v-if="isImageFile(fileEntry.mimeType)" 
                                :src="fileEntry.preview" 
                                :alt="fileEntry.file?.name || 'Uploaded record'" 
                            />
                            <div v-else class="doc-preview">
                                <mdicon :name="fileEntry.mimeType?.includes('pdf') ? 'file-pdf-box' : 'file-document-outline'" :size="44"/>
                                <p class="doc-name">{{ fileEntry.file?.name || 'Document' }}</p>
                            </div>
                            <button 
                                type="button" 
                                class="remove-image-btn" 
                                @click="removeSelectedFile(index)"
                            >
                                <mdicon name="close" :size="18"/>
                            </button>
                        </div>
                        <div 
                            class="add-image-card" 
                            :class="{ dragging: isDragging }"
                            @click="triggerFileUpload"
                            @dragover.prevent="onDragOver"
                            @dragleave.prevent="onDragLeave"
                            @drop.prevent="onDrop"
                        >
                            <mdicon name="cloud-upload" :size="56" class="plus-icon"/>
                            <p>Upload files</p>
                            <span>Drag & drop or browse (max {{ maxAttachments }})</span>
                            <input 
                                type="file" 
                                ref="fileInput" 
                                @change="handleFileUpload" 
                                accept="image/*"
                                multiple
                                style="display: none"
                            />
                        </div>
                    </div>
                </section>

                <!-- Details -->
                <section class="card-section details-card">
                    <div class="section-header">
                        <div>
                            <p class="section-label">Record details</p>
                            <h3 class="section-title">Describe this medical record</h3>
                        </div>
                        <span class="section-hint">All fields are editable later</span>
                    </div>

                    <div class="form-grid two-column">
                        <div class="form-group">
                            <label class="form-label">Record for</label>
                            <div class="select-wrapper">
                                <select 
                                    v-model="recordFor" 
                                    class="form-select"
                                    :disabled="profilesLoading || !profiles.length"
                                >
                                    <option value="" disabled>Select family member</option>
                                    <option 
                                        v-for="profile in profiles" 
                                        :key="profile.id" 
                                        :value="profile.id"
                                    >
                                        {{ profile.name }}
                                    </option>
                                </select>
                                <mdicon name="chevron-down" :size="20" class="select-icon"/>
                            </div>
                            <p v-if="profilesLoading" class="input-hint">Loading profiles...</p>
                            <p v-else-if="!profiles.length" class="input-hint error">
                                Create a profile to start adding records.
                            </p>
                        </div>
                        <div class="form-group">
                            <label class="form-label">File name</label>
                            <input 
                                type="text" 
                                v-model="fileName" 
                                placeholder="MRI results - June" 
                                class="form-input"
                            />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Record created on</label>
                            <div class="date-input-wrapper">
                                <input 
                                    type="date" 
                                    v-model="recordDate" 
                                    class="form-input date-input"
                                />
                                <mdicon name="calendar" :size="20" class="date-icon"/>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Provider / Facility</label>
                            <input 
                                type="text" 
                                v-model="providerName" 
                                placeholder="e.g., St. Luke's Medical Center"
                                class="form-input"
                            />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Type of record</label>
                        <div class="record-types">
                            <div 
                                class="record-type-card"
                                v-for="option in recordTypeOptions"
                                :key="option.id"
                                :class="{ active: recordType === option.id }"
                                @click="recordType = option.id"
                            >
                                <mdicon :name="option.icon" :size="34"/>
                                <span>{{ option.label }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Tags</label>
                        <div class="tag-editor">
                            <span 
                                v-for="(tag, index) in tags" 
                                :key="`${tag}-${index}`" 
                                class="tag-pill"
                            >
                                {{ tag }}
                                <button type="button" @click="removeTag(index)">
                                    <mdicon name="close" :size="14"/>
                                </button>
                            </span>
                            <input 
                                type="text"
                                v-model="tagInput"
                                class="tag-input"
                                placeholder="Add tag and press Enter"
                                @keyup.enter.prevent="addTagFromInput"
                                @blur="addTagFromInput"
                            />
                        </div>
                        <p class="input-hint">Use tags like “Follow-up”, “Diagnostic”, “Dental”.</p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea 
                            v-model="notes"
                            rows="4"
                            class="form-input textarea"
                            placeholder="Add additional instructions, doctor’s notes, or follow-up reminders."
                        ></textarea>
                    </div>
                </section>
            </div>

            <!-- Save Button -->
            <div class="actions-bar">
                <p v-if="formError" class="form-error">{{ formError }}</p>
                <button class="save-btn" @click="saveRecord" :disabled="saving || !profiles.length">
                    {{ saving ? 'Saving...' : (isEditing ? 'Update record' : 'Save record') }}
                </button>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProfiles } from '@/composables/profiles'
import { useMedicalRecords } from '@/composables/medicalRecords'

const today = () => new Date().toISOString().split('T')[0]

export default {
    name: 'AddRecordWeb',
    setup() {
        const router = useRouter()
        const route = useRoute()
        const fileInput = ref(null)
        const selectedFiles = ref([])
        const isDragging = ref(false)
        const maxAttachments = 5
        const recordFor = ref(localStorage.getItem('selectedProfileId') || '')
        const fileName = ref('')
        const recordDate = ref(today())
        const providerName = ref('')
        const recordType = ref('LAB_RESULT')
        const tags = ref([])
        const tagInput = ref('')
        const notes = ref('')
        const profiles = ref([])
        const profilesLoading = ref(false)
        const saving = ref(false)
        const uploading = ref(false)
        const formError = ref('')
        const { fetchProfiles } = useProfiles()
        const { createRecord, fetchRecordById, updateRecord } = useMedicalRecords()
        const recordTypeOptions = [
            { id: 'LAB_RESULT', label: 'Lab Report', icon: 'file-document' },
            { id: 'PRESCRIPTION', label: 'Prescription', icon: 'file-document-edit' },
            { id: 'INVOICE', label: 'Invoice', icon: 'receipt' },
            { id: 'OTHER', label: 'Other', icon: 'file-question' }
        ]
        const recordId = computed(() => typeof route.query.recordId === 'string' ? route.query.recordId : null)
        const isEditing = computed(() => Boolean(recordId.value))
        const headerTitle = computed(() => (isEditing.value ? 'Edit Record' : 'Add Record'))

        const goBack = () => {
            router.back()
        }

        const triggerFileUpload = () => {
            fileInput.value?.click()
        }

        const isImageFile = (mime = '') => (mime || '').startsWith('image/')

        const readAsDataURL = (file) => new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(typeof e.target?.result === 'string' ? e.target.result : '')
            reader.readAsDataURL(file)
        })

        const compressImageIfNeeded = async (file) => {
            if (!isImageFile(file.type) || file.size <= 2 * 1024 * 1024) {
                return file
            }
            return new Promise((resolve) => {
                const img = new Image()
                img.onload = () => {
                    const scale = Math.sqrt(1_000_000 / file.size)
                    const ratio = Math.min(scale, 1)
                    const canvas = document.createElement('canvas')
                    canvas.width = Math.max(1, Math.floor(img.width * ratio))
                    canvas.height = Math.max(1, Math.floor(img.height * ratio))
                    const ctx = canvas.getContext('2d')
                    if (!ctx) {
                        resolve(file)
                        return
                    }
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            resolve(file)
                            return
                        }
                        // Prefer original MIME when possible
                        const compressed = new File([blob], file.name, { type: file.type || blob.type })
                        resolve(compressed.size < file.size ? compressed : file)
                    }, file.type || 'image/jpeg', 0.8)
                }
                img.onerror = () => resolve(file)
                img.src = URL.createObjectURL(file)
            })
        }

        const toPreviewEntry = async (file) => {
            const processed = await compressImageIfNeeded(file)
            const preview = isImageFile(processed.type) ? await readAsDataURL(processed) : ''
            return {
                id: `${processed.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                file: processed,
                preview,
                mimeType: processed.type
            }
        }

        const handleFiles = async (files = []) => {
            const availableSlots = maxAttachments - selectedFiles.value.length
            if (availableSlots <= 0) {
                formError.value = `You can upload up to ${maxAttachments} files.`
                return
            }
            uploading.value = true
            const imageFiles = files.filter(file => isImageFile(file.type))
            const rejected = files.length - imageFiles.length
            if (rejected > 0) {
                formError.value = 'Only image files (PNG/JPG) are allowed.'
            }
            const filesToUse = imageFiles.slice(0, availableSlots)
            try {
                const previews = await Promise.all(filesToUse.map(toPreviewEntry))
                selectedFiles.value = [...selectedFiles.value, ...previews]
                if (rejected === 0) {
                    formError.value = ''
                }
            } finally {
                uploading.value = false
            }
        }

        const handleFileUpload = async (event) => {
            const files = Array.from(event.target.files || [])
            if (!files.length) return
            await handleFiles(files)
            event.target.value = ''
        }

        const onDragOver = () => { isDragging.value = true }
        const onDragLeave = () => { isDragging.value = false }
        const onDrop = async (event) => {
            isDragging.value = false
            const files = Array.from(event.dataTransfer?.files || [])
            if (!files.length) return
            await handleFiles(files)
        }

        const removeSelectedFile = (index) => {
            selectedFiles.value.splice(index, 1)
        }

        const addTagFromInput = () => {
            const value = tagInput.value.trim()
            if (value && !tags.value.includes(value)) {
                tags.value.push(value)
            }
            tagInput.value = ''
        }

        const removeTag = (index) => {
            tags.value.splice(index, 1)
        }

        const resetForm = () => {
            recordFor.value = localStorage.getItem('selectedProfileId') || ''
            fileName.value = ''
            recordDate.value = today()
            providerName.value = ''
            recordType.value = 'LAB_RESULT'
            tags.value = []
            tagInput.value = ''
            notes.value = ''
            selectedFiles.value = []
            isDragging.value = false
        }

        const loadProfiles = async () => {
            const token = localStorage.getItem('token')
            if (!token) {
                profiles.value = []
                recordFor.value = ''
                return
            }
            profilesLoading.value = true
            const { response, error } = await fetchProfiles(token)
            if (error.value === null && response.value?.profiles) {
                profiles.value = response.value.profiles.map(profile => ({
                    id: profile.id,
                    name: profile.displayName || 'Profile'
                }))
                const savedId = localStorage.getItem('selectedProfileId')
                if (savedId && profiles.value.some(profile => profile.id === savedId)) {
                    recordFor.value = savedId
                } else if (!recordFor.value && profiles.value.length) {
                    recordFor.value = profiles.value[0].id
                }
            } else if (error.value) {
                formError.value = 'Unable to load profiles. Please try again.'
            }
            profilesLoading.value = false
        }

        const loadRecordDetails = async () => {
            if (!recordId.value) {
                resetForm()
                return
            }
            const token = localStorage.getItem('token')
            if (!token) {
                router.push('/login')
                return
            }
            try {
                const data = await fetchRecordById(token, recordId.value)
                recordFor.value = data.profileId
                fileName.value = data.title || ''
                recordDate.value = data.recordDate ? new Date(data.recordDate).toISOString().split('T')[0] : today()
                providerName.value = data.providerName || ''
                recordType.value = data.recordType || 'LAB_RESULT'
                notes.value = data.notes || ''
                tags.value = Array.isArray(data.tags) ? data.tags : []
                selectedFiles.value = []
            } catch (err) {
                formError.value = err.message || 'Unable to load record details.'
            }
        }

        const saveRecord = async () => {
            formError.value = ''
            if (!recordFor.value) {
                formError.value = 'Please select a profile for this record.'
                return
            }
            if (!fileName.value.trim()) {
                formError.value = 'Please enter a file name.'
                return
            }
            if (!recordDate.value) {
                formError.value = 'Please select the record date.'
                return
            }
            if (!selectedFiles.value.length) {
                formError.value = 'Please attach at least one file.'
                return
            }
            const token = localStorage.getItem('token')
            if (!token) {
                router.push('/login')
                return
            }

            const formData = new FormData()
            formData.append('profileId', recordFor.value)
            formData.append('title', fileName.value.trim())
            formData.append('recordType', recordType.value)
            formData.append('recordDate', recordDate.value)
            selectedFiles.value.forEach(entry => {
                formData.append('files', entry.file)
            })
            if (providerName.value.trim()) {
                formData.append('providerName', providerName.value.trim())
            }
            if (notes.value.trim()) {
                formData.append('notes', notes.value.trim())
            }
            formData.append('tags', JSON.stringify(tags.value))

            try {
                saving.value = true
                if (isEditing.value && recordId.value) {
                    await updateRecord(token, recordId.value, formData)
                } else {
                    await createRecord(token, formData)
                }
                router.replace({ path: '/medical-records', query: { tab: 'records' } })
            } catch (err) {
                formError.value = err.message || 'Unable to save record. Please try again.'
            } finally {
                saving.value = false
            }
        }

        onMounted(() => {
            loadProfiles().then(() => {
                if (recordId.value) {
                    loadRecordDetails()
                }
            })
        })

        watch(
            () => recordId.value,
            (val) => {
                if (val) {
                    loadRecordDetails()
                } else {
                    resetForm()
                }
            }
        )

        return {
            fileInput,
            selectedFiles,
            isDragging,
            maxAttachments,
            recordFor,
            fileName,
            recordDate,
            providerName,
            recordType,
            tags,
            tagInput,
            notes,
            profiles,
            profilesLoading,
            saving,
            uploading,
            formError,
            isEditing,
            headerTitle,
            recordTypeOptions,
            goBack,
            triggerFileUpload,
            handleFileUpload,
            onDragOver,
            onDragLeave,
            onDrop,
            removeSelectedFile,
            addTagFromInput,
            removeTag,
            saveRecord,
            isImageFile
        }
    }
}
</script>

<style scoped>
.image-upload-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
}

.image-preview {
    position: relative;
    border: 1px dashed var(--glass-card-border);
    border-radius: 14px;
    min-height: 180px;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--glass-ghost-bg);
}

.image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.add-image-card {
    border: 1px dashed rgba(103, 232, 249, 0.35);
    background: rgba(255,255,255,0.04);
    border-radius: 16px;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: var(--text-primary);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
}

.add-image-card.dragging {
    border-color: rgba(103,232,249,0.65);
    background: rgba(103,232,249,0.08);
}

.remove-image-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    border: none;
    border-radius: 999px;
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    background: rgba(11,16,32,0.8);
    color: var(--text-primary);
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.08);
}

.doc-preview {
    height: 100%;
    width: 100%;
    display: grid;
    place-items: center;
    gap: 8px;
    text-align: center;
    color: var(--text-primary);
    padding: 12px;
}

.doc-name {
    margin: 0;
    font-size: 13px;
    color: var(--text-primary);
}

.upload-overlay {
    position: absolute;
    inset: 0;
    background: rgba(5, 8, 20, 0.65);
    display: grid;
    place-items: center;
    z-index: 10;
    border-radius: 16px;
}

.upload-modal {
    padding: 16px 18px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
}
</style>
