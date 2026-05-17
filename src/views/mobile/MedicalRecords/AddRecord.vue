<template>
<div class="add-record-shell">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <header class="add-record-nav glass-nav">
        <button class="back-btn" @click="goBack">
            <mdicon name="arrow-left" :size="22"/>
        </button>
        <div class="nav-title-block">
            <h2 class="nav-title">{{ isEditing ? 'Edit Record' : 'Add Record' }}</h2>
            <p class="nav-sub">Medical records</p>
        </div>
    </header>

    <div class="add-record-content">
        <!-- ── SECTION 1: Setup ─────────────────────────────────── -->
        <div class="form-section">
            <div class="section-label">
                <mdicon name="account-outline" :size="13"/>
                Record setup
            </div>
            <div class="fields-card">
                <!-- Profile -->
                <div class="field-group">
                    <label class="field-label">Record for</label>
                    <div class="select-wrapper">
                        <select v-model="recordFor" class="field-input field-select">
                            <option value="">Select profile</option>
                            <option v-for="member in profileMembers" :key="member.id" :value="member.id">
                                {{ member.name }}
                            </option>
                        </select>
                        <mdicon name="chevron-down" :size="18" class="select-icon"/>
                    </div>
                </div>

                <!-- Record type -->
                <div class="field-group">
                    <label class="field-label">Type of record</label>
                    <div class="type-row">
                        <button
                            type="button"
                            class="type-chip"
                            v-for="option in recordTypeOptions"
                            :key="option.id"
                            :class="{ active: recordType === option.id }"
                            @click="recordType = option.id"
                        >
                            <mdicon :name="option.icon" :size="15"/>
                            {{ option.label }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── SECTION 2: Documents ───────────────────────────────── -->
        <div class="form-section">
            <div class="section-label">
                <mdicon name="paperclip" :size="13"/>
                Documents
            </div>

            <!-- File preview strip -->
            <div class="file-strip" v-if="existingFiles.length || selectedFiles.length">
                <div class="file-thumb" v-for="file in existingFiles" :key="`existing-${file.id}`">
                    <img :src="resolveFileUrl(file.url)" :alt="file.originalName || 'Attachment'"/>
                    <button type="button" class="remove-btn" @click="removeExistingFile(file.id)">
                        <mdicon name="close" :size="14"/>
                    </button>
                </div>
                <div class="file-thumb" v-for="(file, index) in selectedFiles" :key="file.id">
                    <img v-if="isImageFile(file.file?.type)" :src="file.preview" alt="Uploaded record"/>
                    <div v-else class="pdf-thumb">
                        <mdicon name="file-pdf-box" :size="32" class="pdf-icon"/>
                        <p class="pdf-name">{{ file.file?.name || 'PDF' }}</p>
                    </div>
                    <button type="button" class="remove-btn" @click="removeSelectedFile(index)">
                        <mdicon name="close" :size="14"/>
                    </button>
                </div>
            </div>

            <!-- Upload action buttons -->
            <div class="upload-actions">
                <button
                    type="button"
                    class="upload-btn"
                    @click="triggerFileUpload('device')"
                    :disabled="selectedFiles.length >= maxAttachments"
                >
                    <mdicon name="image-plus" :size="20" class="upload-icon"/>
                    <span>From device</span>
                </button>
                <button
                    type="button"
                    class="upload-btn"
                    @click="triggerFileUpload('camera')"
                    :disabled="selectedFiles.length >= maxAttachments"
                >
                    <mdicon name="camera-plus" :size="20" class="upload-icon"/>
                    <span>Camera</span>
                </button>
            </div>

            <input type="file" ref="deviceInput" class="sr-only" accept="image/*,application/pdf" multiple @change="handleFileUpload"/>
            <input type="file" ref="cameraInput" class="sr-only" accept="image/*" capture="environment" @change="handleFileUpload"/>

            <!-- AI Extract button — only for relevant types with files -->
            <button
                v-if="canExtract"
                type="button"
                class="ai-extract-btn"
                @click="recordType === 'PRESCRIPTION' ? runExtraction() : runLabExtraction()"
                :disabled="extracting"
            >
                <mdicon v-if="extracting" name="loading" :size="16" class="spin"/>
                <mdicon v-else name="creation" :size="16"/>
                {{ extracting ? 'Extracting with AI…' : 'Extract with AI' }}
            </button>
            <p v-if="extractError" class="hint-error">{{ extractError }}</p>

            <!-- Extracted medications -->
            <div v-if="extractedMeds.length > 0" class="extracted-card extracted-rx">
                <div class="extracted-header">
                    <mdicon name="pill" :size="16"/>
                    <span>Extracted medications</span>
                    <span class="extracted-badge">{{ extractedMeds.filter(m => m.selected).length }} selected</span>
                </div>
                <p class="extracted-hint">These will be saved to the Medications module when you save the record.</p>
                <div class="extracted-item" v-for="(med, i) in extractedMeds" :key="i">
                    <label class="extracted-row">
                        <input type="checkbox" v-model="med.selected" class="ex-check"/>
                        <div class="ex-info">
                            <span class="ex-name">{{ med.name }}</span>
                            <span v-if="med.dosage" class="ex-detail">{{ med.dosage }}</span>
                            <span v-if="med.instructions" class="ex-note">{{ med.instructions }}</span>
                        </div>
                    </label>
                </div>
            </div>

            <!-- Extracted lab results -->
            <div v-if="extractedLabResults.length > 0" class="extracted-card extracted-lab">
                <div class="extracted-header">
                    <mdicon name="test-tube" :size="16"/>
                    <span>Extracted lab results</span>
                    <span class="extracted-badge">{{ extractedLabResults.filter(r => r.selected).length }} selected</span>
                </div>
                <p class="extracted-hint">These will be saved to the Lab Results module when you save the record.</p>
                <div class="extracted-item" v-for="(result, i) in extractedLabResults" :key="i">
                    <label class="extracted-row">
                        <input type="checkbox" v-model="result.selected" class="ex-check"/>
                        <div class="ex-info">
                            <div class="lab-name-row">
                                <span class="ex-name">{{ result.testName }}</span>
                                <span class="lab-badge" :class="`lab-${result.status?.toLowerCase()}`">{{ result.status }}</span>
                            </div>
                            <span class="ex-detail">{{ result.value }}{{ result.unit ? ' ' + result.unit : '' }}</span>
                            <span v-if="result.referenceRange" class="ex-note">Ref: {{ result.referenceRange }}</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>

        <!-- ── SECTION 3: Details ─────────────────────────────────── -->
        <div class="form-section">
            <div class="section-label">
                <mdicon name="text-box-outline" :size="13"/>
                Details
            </div>
            <div class="fields-card">
                <div class="field-group">
                    <label class="field-label">File name</label>
                    <input type="text" v-model="fileName" placeholder="e.g. CBC Results – May 2025" class="field-input"/>
                </div>
                <div class="field-group">
                    <label class="field-label">Provider / Facility</label>
                    <input type="text" v-model="providerName" placeholder="Hospital or clinic name" class="field-input"/>
                </div>
                <div class="field-group">
                    <label class="field-label">Record date</label>
                    <input type="date" v-model="recordDate" class="field-input"/>
                </div>
                <div class="field-group">
                    <label class="field-label">Tags</label>
                    <input type="text" v-model="tagsInput" placeholder="scan, follow-up, annual (comma separated)" class="field-input"/>
                </div>
                <div class="field-group">
                    <label class="field-label">Notes</label>
                    <textarea v-model="notes" rows="3" class="field-input field-textarea" placeholder="Any helpful context about this record"></textarea>
                </div>
            </div>
        </div>

        <!-- ── FOOTER ─────────────────────────────────────────────── -->
        <p v-if="formError" class="hint-error footer-error">{{ formError }}</p>

        <button class="save-btn" :disabled="saving" @click="saveRecord">
            <mdicon v-if="saving" name="loading" :size="18" class="spin"/>
            <mdicon v-else name="content-save-outline" :size="18"/>
            <span>{{ saving ? 'Saving…' : (isEditing ? 'Update record' : 'Save record') }}</span>
        </button>
    </div>

    <!-- Upload progress overlay -->
    <div v-if="uploading" class="upload-overlay">
        <div class="upload-modal">
            <mdicon name="loading" :size="26" class="spin"/>
            <p>Processing image…</p>
        </div>
    </div>
</div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProfiles } from '@/composables/profiles'
import { useMedicalRecords } from '@/composables/medicalRecords'
import { API_BASE_URL } from '@/constants/config'

export default {
    name: 'AddRecordMobile',
    setup() {
        const router = useRouter()
        const route = useRoute()
        const getDefaultProfileId = () => localStorage.getItem('selectedProfileId') || ''

        const deviceInput = ref(null)
        const cameraInput = ref(null)
        const selectedFiles = ref([])
        const existingFiles = ref([])
        const recordFor = ref(getDefaultProfileId())
        const fileName = ref('')
        const recordDate = ref(new Date().toISOString().split('T')[0])
        const recordType = ref('LAB_RESULT')
        const providerName = ref('')
        const tagsInput = ref('')
        const notes = ref('')
        const profileMembers = ref([])
        const filesToRemove = ref([])
        const recordId = ref(typeof route.query.recordId === 'string' ? route.query.recordId : null)

        const { fetchProfiles } = useProfiles()
        const { createRecord, fetchRecordById, updateRecord, extractPrescription, saveMedication, extractLabReport, saveLabResult } = useMedicalRecords()

        const extracting = ref(false)
        const extractError = ref('')
        const extractedMeds = ref([])
        const savingMeds = ref(false)
        const medsSaved = ref(false)
        const extractedLabResults = ref([])
        const savingLab = ref(false)
        const labSaved = ref(false)
        const maxAttachments = 5
        const saving = ref(false)
        const uploading = ref(false)
        const formError = ref('')

        const recordTypeOptions = [
            { id: 'LAB_RESULT',   label: 'Lab Report',   icon: 'file-document' },
            { id: 'PRESCRIPTION', label: 'Prescription',  icon: 'file-document-edit' },
            { id: 'OTHER',        label: 'Invoice',       icon: 'receipt' },
        ]

        const isEditing = computed(() => !!recordId.value)
        const isImageFile = (mime = '') => (mime || '').startsWith('image/')

        const canExtract = computed(() => {
            if (recordType.value !== 'PRESCRIPTION' && recordType.value !== 'LAB_RESULT') return false
            return selectedFiles.value.some(f => isImageFile(f.file?.type) || f.file?.type === 'application/pdf')
        })

        const goBack = () => router.back()

        const triggerFileUpload = (mode = 'device') => {
            if (selectedFiles.value.length >= maxAttachments) {
                formError.value = `Maximum ${maxAttachments} files allowed.`
                return
            }
            formError.value = ''
            const target = mode === 'camera' ? cameraInput.value : deviceInput.value
            target?.click()
        }

        const readAsDataURL = (file) => new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(typeof e.target?.result === 'string' ? e.target.result : '')
            reader.readAsDataURL(file)
        })

        const compressImageIfNeeded = async (file) => {
            if (!isImageFile(file.type) || file.size <= 2 * 1024 * 1024) return file
            return new Promise((resolve) => {
                const img = new Image()
                img.onload = () => {
                    const scale = Math.sqrt(1_000_000 / file.size)
                    const ratio = Math.min(scale, 1)
                    const canvas = document.createElement('canvas')
                    canvas.width = Math.max(1, Math.floor(img.width * ratio))
                    canvas.height = Math.max(1, Math.floor(img.height * ratio))
                    const ctx = canvas.getContext('2d')
                    if (!ctx) { resolve(file); return }
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                    canvas.toBlob((blob) => {
                        if (!blob) { resolve(file); return }
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
            const preview = await readAsDataURL(processed)
            return {
                id: `${processed.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                file: processed,
                preview
            }
        }

        const handleFileUpload = async (event) => {
            const files = Array.from(event.target.files || [])
            if (!files.length) return
            const availableSlots = maxAttachments - selectedFiles.value.length
            if (availableSlots <= 0) {
                formError.value = `Maximum ${maxAttachments} files allowed.`
                event.target.value = ''
                return
            }
            uploading.value = true
            const supported = files.filter(f => isImageFile(f.type) || f.type === 'application/pdf')
            if (supported.length < files.length) formError.value = 'Only images (PNG/JPG) and PDFs are supported.'
            try {
                const previews = await Promise.all(supported.slice(0, availableSlots).map(toPreviewEntry))
                selectedFiles.value = [...selectedFiles.value, ...previews]
                if (supported.length === files.length) formError.value = ''
            } finally {
                uploading.value = false
            }
            event.target.value = ''
        }

        const removeSelectedFile = (index) => selectedFiles.value.splice(index, 1)

        const resolveFileUrl = (url) => {
            if (!url) return ''
            return url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`
        }

        const removeExistingFile = (fileId) => {
            existingFiles.value = existingFiles.value.filter(f => f.id !== fileId)
            if (!filesToRemove.value.includes(fileId)) filesToRemove.value.push(fileId)
        }

        const loadRecordDetails = async () => {
            if (!recordId.value) return
            const token = localStorage.getItem('token')
            if (!token) return
            try {
                const record = await fetchRecordById(token, recordId.value)
                recordFor.value     = record.profileId
                fileName.value      = record.title
                providerName.value  = record.providerName || ''
                recordDate.value    = new Date(record.recordDate).toISOString().split('T')[0]
                recordType.value    = record.recordType || 'OTHER'
                notes.value         = record.notes || ''
                tagsInput.value     = Array.isArray(record.tags) ? record.tags.join(', ') : ''
                existingFiles.value = (record.files || [])
                    .filter(f => (f.mimeType || '').startsWith('image/'))
                    .map(f => ({ id: f.id, url: f.url, mimeType: f.mimeType, originalName: f.originalName }))
                filesToRemove.value = []
                selectedFiles.value = []
            } catch (err) {
                formError.value = err.message || 'Unable to load record.'
            }
        }

        const resetForm = () => {
            recordFor.value     = getDefaultProfileId()
            fileName.value      = ''
            providerName.value  = ''
            recordDate.value    = new Date().toISOString().split('T')[0]
            recordType.value    = 'LAB_RESULT'
            tagsInput.value     = ''
            notes.value         = ''
            selectedFiles.value = []
            existingFiles.value = []
            filesToRemove.value = []
            formError.value     = ''
            uploading.value     = false
            extractedMeds.value = []
            extractedLabResults.value = []
        }

        const runExtraction = async () => {
            if (!selectedFiles.value.length) return
            const token = localStorage.getItem('token')
            if (!token) return
            extractError.value = ''
            extractedMeds.value = []
            medsSaved.value = false
            extracting.value = true
            try {
                const dataUrl = selectedFiles.value[0].preview
                const [header, base64] = dataUrl.split(',')
                const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
                const result = await extractPrescription(token, base64, mimeType)
                if (result.providerName) providerName.value = result.providerName
                if (result.recordDate)   recordDate.value   = result.recordDate
                if (result.notes)        notes.value        = result.notes
                if (!fileName.value && result.providerName) fileName.value = `Prescription - ${result.providerName}`
                extractedMeds.value = (result.medications || []).map(m => ({ ...m, selected: true }))
            } catch (err) {
                extractError.value = err.message || 'Extraction failed. Make sure your AI provider is configured in Settings.'
            } finally {
                extracting.value = false
            }
        }

        const runLabExtraction = async () => {
            if (!selectedFiles.value.length) return
            const token = localStorage.getItem('token')
            if (!token) return
            extractError.value = ''
            extractedLabResults.value = []
            labSaved.value = false
            extracting.value = true
            try {
                const dataUrl = selectedFiles.value[0].preview
                const [header, base64] = dataUrl.split(',')
                const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
                const result = await extractLabReport(token, base64, mimeType)
                if (result.labName)     providerName.value = result.labName
                if (result.collectedAt) recordDate.value   = result.collectedAt
                if (result.notes)       notes.value        = result.notes
                if (!fileName.value && result.labName) fileName.value = `Lab Report - ${result.labName}`
                extractedLabResults.value = (result.results || []).map(r => ({ ...r, selected: true }))
            } catch (err) {
                extractError.value = err.message || 'Extraction failed. Make sure your AI provider is configured in Settings.'
            } finally {
                extracting.value = false
            }
        }

        const saveRecord = async () => {
            formError.value = ''
            if (!recordFor.value)        { formError.value = 'Please select a profile.'; return }
            if (!fileName.value.trim())  { formError.value = 'Please enter a file name.'; return }
            if (!recordDate.value)       { formError.value = 'Please select a record date.'; return }
            const token = localStorage.getItem('token')
            if (!token) { formError.value = 'Please log in again.'; router.push('/login'); return }

            const formData = new FormData()
            formData.append('profileId',   recordFor.value)
            formData.append('title',       fileName.value.trim())
            formData.append('recordType',  recordType.value)
            formData.append('recordDate',  recordDate.value)
            selectedFiles.value.forEach(fe => formData.append('files', fe.file))
            if (providerName.value.trim()) formData.append('providerName', providerName.value.trim())
            if (notes.value.trim())        formData.append('notes', notes.value.trim())
            const tagsArray = tagsInput.value
                ? tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
                : []
            formData.append('tags', JSON.stringify(tagsArray))
            if (isEditing.value) formData.append('filesToRemove', JSON.stringify(filesToRemove.value))

            saving.value = true
            try {
                if (isEditing.value && recordId.value) {
                    await updateRecord(token, recordId.value, formData)
                } else {
                    await createRecord(token, formData)
                }

                // Save any selected extracted items alongside the record
                const medsToSave = extractedMeds.value.filter(m => m.selected)
                if (medsToSave.length && !medsSaved.value) {
                    await Promise.all(medsToSave.map(m => saveMedication(token, {
                        profileId:    recordFor.value,
                        name:         m.name,
                        dosage:       m.dosage || '',
                        instructions: m.instructions || '',
                        startDate:    recordDate.value || null,
                    })))
                    medsSaved.value = true
                }

                const labsToSave = extractedLabResults.value.filter(r => r.selected)
                if (labsToSave.length && !labSaved.value) {
                    await Promise.all(labsToSave.map(r => saveLabResult(token, {
                        profileId:      recordFor.value,
                        testName:       r.testName,
                        value:          r.value,
                        unit:           r.unit || null,
                        referenceRange: r.referenceRange || null,
                        status:         r.status || 'UNKNOWN',
                        collectedAt:    recordDate.value || null,
                        labName:        providerName.value || null,
                    })))
                    labSaved.value = true
                }

                if (isEditing.value && recordId.value) {
                    router.replace({ path: `/medical-records/records/${recordId.value}` })
                } else {
                    router.replace({ path: '/medical-records', query: { tab: 'records' } })
                }
            } catch (err) {
                formError.value = err.message || 'Unable to save record. Please try again.'
            } finally {
                saving.value = false
            }
        }

        const loadProfiles = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            const { response, error } = await fetchProfiles(token)
            if (error.value === null && response.value?.profiles) {
                profileMembers.value = response.value.profiles.map(p => ({ id: p.id, name: p.displayName || 'Profile' }))
                const savedId = localStorage.getItem('selectedProfileId')
                const hasSaved = profileMembers.value.find(m => m.id === savedId)
                if (hasSaved) recordFor.value = hasSaved.id
                else if (profileMembers.value.length) recordFor.value = profileMembers.value[0].id
            }
        }

        onMounted(() => loadProfiles().then(() => loadRecordDetails()))

        watch(
            () => route.query.recordId,
            (val) => {
                recordId.value = typeof val === 'string' ? val : null
                if (recordId.value) loadRecordDetails()
                else resetForm()
            }
        )

        return {
            deviceInput, cameraInput, selectedFiles, existingFiles, maxAttachments,
            recordFor, fileName, recordDate, recordType, providerName, tagsInput, notes,
            recordTypeOptions, isEditing, canExtract, goBack, triggerFileUpload,
            handleFileUpload, removeSelectedFile, removeExistingFile, resolveFileUrl, isImageFile,
            extracting, extractError, extractedMeds, runExtraction,
            extractedLabResults, runLabExtraction,
            saving, uploading, formError, saveRecord, profileMembers,
            medsSaved, labSaved,
        }
    }
}
</script>

<style scoped>
.add-record-shell {
    min-height: 100vh;
    background: var(--bg-main);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}

.bg-orb { position: absolute; filter: blur(60px); opacity: 0.18; z-index: 0; border-radius: 50%; pointer-events: none; }
.orb-1 { width: 300px; height: 300px; background: linear-gradient(135deg, #a78bfa, #38bdf8); top: -120px; left: -80px; }
.orb-2 { width: 240px; height: 240px; background: linear-gradient(135deg, #22c55e, #06b6d4); bottom: -80px; right: -60px; }

/* Nav */
.add-record-nav {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--glass-ghost-bg);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--glass-card-border);
}
.back-btn {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 12px;
    padding: 8px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    cursor: pointer;
    flex-shrink: 0;
}
.nav-title-block { flex: 1; }
.nav-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }
.nav-sub   { font-size: 12px; color: var(--text-muted); margin: 0; }

/* Content */
.add-record-content {
    flex: 1;
    padding: 16px 16px 48px;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

/* Section */
.form-section { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.section-label {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 4px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
}

/* Fields card */
.fields-card {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.field-group { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.field-input {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--glass-card-border);
    background: rgba(255,255,255,0.05);
    color: var(--text-primary);
    font-size: 14px;
    width: 100%;
    outline: none;
}
.field-input:focus { border-color: rgba(167,139,250,0.45); }
.field-textarea { resize: none; font-family: inherit; line-height: 1.5; }

/* Select */
.select-wrapper { position: relative; }
.field-select { appearance: none; padding-right: 36px; cursor: pointer; }
.select-icon { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }

/* Record type chips */
.type-row { display: flex; gap: 8px; flex-wrap: wrap; }
.type-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 14px;
    border-radius: 999px;
    border: 1px solid var(--glass-card-border);
    background: transparent;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
}
.type-chip.active {
    background: rgba(167,139,250,0.2);
    border-color: rgba(167,139,250,0.5);
    color: #a78bfa;
}

/* File preview strip */
.file-strip {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
}
.file-strip::-webkit-scrollbar { display: none; }
.file-thumb {
    position: relative;
    flex-shrink: 0;
    width: 88px;
    height: 88px;
    border-radius: 12px;
    border: 1px solid var(--glass-card-border);
    background: var(--glass-ghost-bg);
    overflow: hidden;
}
.file-thumb img { width: 100%; height: 100%; object-fit: cover; }
.remove-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(11,16,32,0.78);
    border: 1px solid rgba(255,255,255,0.14);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

/* PDF thumb inside file-thumb */
.pdf-thumb {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px;
}
.pdf-icon { color: #f87171; }
.pdf-name {
    font-size: 10px;
    color: var(--text-secondary);
    margin: 0;
    text-align: center;
    word-break: break-all;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Upload action buttons */
.upload-actions {
    display: flex;
    gap: 10px;
}
.upload-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px 12px;
    border-radius: 12px;
    border: 1px dashed rgba(167,139,250,0.35);
    background: rgba(167,139,250,0.05);
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
}
.upload-btn:active { border-color: rgba(167,139,250,0.7); background: rgba(167,139,250,0.1); }
.upload-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.upload-icon { color: var(--text-muted); }

/* AI extract */
.ai-extract-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    padding: 11px 16px;
    border-radius: 12px;
    border: 1px solid rgba(167,139,250,0.4);
    background: rgba(167,139,250,0.1);
    color: #a78bfa;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
}
.ai-extract-btn:active { background: rgba(167,139,250,0.18); }
.ai-extract-btn:disabled { opacity: 0.55; cursor: not-allowed; }

/* Extracted cards */
.extracted-card {
    border-radius: 14px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.extracted-rx  { background: rgba(167,139,250,0.07); border: 1px solid rgba(167,139,250,0.22); }
.extracted-lab { background: rgba(34,211,238,0.06);  border: 1px solid rgba(34,211,238,0.22); }

.extracted-header {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
}
.extracted-badge {
    margin-left: auto;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(167,139,250,0.15);
    color: #a78bfa;
}
.extracted-hint { font-size: 12px; color: var(--text-muted); margin: 0; line-height: 1.4; }

.extracted-item { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; }
.extracted-row { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; }
.ex-check { width: 17px; height: 17px; margin-top: 2px; accent-color: #a78bfa; flex-shrink: 0; }
.ex-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.ex-name   { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.ex-detail { font-size: 13px; color: var(--text-secondary); }
.ex-note   { font-size: 12px; color: var(--text-muted); font-style: italic; }

.lab-name-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.lab-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}
.lab-normal   { background: rgba(34,197,94,0.18);  color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
.lab-high     { background: rgba(251,146,60,0.18); color: #fb923c; border: 1px solid rgba(251,146,60,0.3); }
.lab-low      { background: rgba(96,165,250,0.18); color: #60a5fa; border: 1px solid rgba(96,165,250,0.3); }
.lab-critical { background: rgba(248,113,113,0.18);color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
.lab-unknown  { background: rgba(148,163,184,0.12);color: var(--text-muted); border: 1px solid rgba(148,163,184,0.2); }

/* Footer */
.hint-error  { font-size: 13px; color: #fca5a5; margin: 0; }
.footer-error { margin-top: 6px; text-align: center; }

.save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px;
    margin-top: 10px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #a78bfa, #38bdf8);
    color: #0b1020;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s;
}
.save-btn:disabled { opacity: 0.55; cursor: not-allowed; }

/* Upload overlay */
.upload-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
}
.upload-modal {
    background: var(--glass-card-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 16px;
    padding: 20px 28px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
}

.sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border: 0;
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
