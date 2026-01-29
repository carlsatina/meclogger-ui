<template>
<div class="logbook-shell">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <LogbookTopNav
        variant="mobile"
        title="Import"
        subtitle="Upload a CSV file to preview your data."
        icon="cloud-upload-outline"
    />

    <section class="logbook-section">
        <div class="section-head">
            <div class="section-title-row">
                <h3>CSV upload</h3>
                <button class="glass-btn-ghost back-btn" type="button" @click="goBack">
                    <mdicon name="arrow-left" size="16" />
                    <span>Back</span>
                </button>
            </div>
            <p>Select a CSV file to preview its contents.</p>
        </div>
        <article class="glass-card logbook-form">
            <label class="form-field">
                <span>File</span>
                <input type="file" accept=".csv" @change="handleFile" />
            </label>
            <p v-if="fileName" class="file-name">Selected: {{ fileName }}</p>
            <p v-if="error" class="error-text">{{ error }}</p>
            <div class="form-actions">
                <button class="glass-btn-primary" type="button" :disabled="processing || !rows.length" @click="processData">
                    {{ processing ? 'Processing…' : 'Process data' }}
                </button>
                <span v-if="successMessage" class="success-text">{{ successMessage }}</span>
            </div>
        </article>
    </section>

    <section class="logbook-section">
        <div class="section-head">
            <h3>Field mapping</h3>
            <p>Match your CSV headers to the payment fields below.</p>
        </div>
        <article class="glass-card mapping-card">
            <ul class="mapping-list">
                <li v-for="row in mappingRows" :key="row.field">
                    <strong>{{ row.field }}</strong>
                    <span>→ {{ row.target }}</span>
                    <em>{{ row.accepted }}</em>
                </li>
            </ul>
        </article>
    </section>

    <section class="logbook-section">
        <div class="section-head">
            <h3>Preview</h3>
            <p v-if="rowCount">Showing {{ previewRows.length }} of {{ rowCount }} rows.</p>
            <p v-else>Upload a CSV file to see a preview.</p>
        </div>
        <article class="glass-card table-card">
            <div v-if="loading" class="empty-state">Loading preview…</div>
            <div v-else-if="error" class="empty-state error-text">{{ error }}</div>
            <div v-else-if="!headers.length" class="empty-state">No data to display.</div>
            <div v-else class="table-wrap">
                <table class="logbook-table import-table">
                    <thead>
                        <tr>
                            <th
                                v-for="(header, index) in headers"
                                :key="`header-${index}`"
                                :class="{ 'id-col': isIdHeader(header) }"
                            >{{ header }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, rowIndex) in previewRows" :key="`row-${rowIndex}`">
                            <td
                                v-for="(cell, cellIndex) in row"
                                :key="`cell-${rowIndex}-${cellIndex}`"
                                class="import-cell"
                                :class="{ 'id-col': isIdColumn(cellIndex) }"
                            >
                                {{ cell || '—' }}
                            </td>
                        </tr>
                        <tr v-if="!previewRows.length">
                            <td :colspan="headers.length" class="empty-row">No rows to preview.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </article>
    </section>

    <LogbookBottomNav variant="mobile" />
</div>
</template>

<script>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'
import { API_BASE_URL } from '@/constants/config'

export default {
    name: "LogbookImportMobile",
    components: {
        LogbookBottomNav,
        LogbookTopNav
    },
    setup() {
        const router = useRouter()
        const fileName = ref('')
        const headers = ref([])
        const rows = ref([])
        const loading = ref(false)
        const error = ref('')
        const processing = ref(false)
        const successMessage = ref('')

        const previewRows = computed(() => rows.value.slice(0, 20))
        const rowCount = computed(() => rows.value.length)

        const parseCSV = (text) => {
            const rows = []
            let current = ''
            let row = []
            let inQuotes = false

            for (let i = 0; i < text.length; i += 1) {
                const char = text[i]
                if (char === '"') {
                    if (inQuotes && text[i + 1] === '"') {
                        current += '"'
                        i += 1
                    } else {
                        inQuotes = !inQuotes
                    }
                    continue
                }
                if (!inQuotes && (char === '\n' || char === '\r')) {
                    if (char === '\r' && text[i + 1] === '\n') {
                        i += 1
                    }
                    row.push(current)
                    rows.push(row)
                    row = []
                    current = ''
                    continue
                }
                if (!inQuotes && char === ',') {
                    row.push(current)
                    current = ''
                    continue
                }
                current += char
            }

            if (current.length || row.length) {
                row.push(current)
                rows.push(row)
            }

            return rows
                .map((cells) => cells.map((cell) => cell.trim()))
                .filter((cells) => cells.some((cell) => cell.length))
        }

        const normalizeHeaders = (headerRow, fallbackCount) => {
            if (!headerRow || !headerRow.length) {
                return Array.from({ length: fallbackCount }, (_, idx) => `Column ${idx + 1}`)
            }
            return headerRow.map((label, idx) => (label ? label : `Column ${idx + 1}`))
        }

        const normalizeHeader = (value) => String(value || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ')

        const isIdHeader = (value) => {
            const normalized = normalizeHeader(value)
            if (!normalized) return false
            return normalized === 'id'
                || normalized === 'id#'
                || normalized === 'id #'
                || normalized.endsWith(' id')
                || normalized.endsWith('_id')
        }

        const isIdColumn = (index) => isIdHeader(headers.value[index])

        const headerAliases = {
            date: ['transaction_date', 'transaction date', 'date', 'payment date', 'payment_date'],
            mainCategory: ['main_category', 'main category', 'category', 'main'],
            subCategory: ['sub_category', 'sub category', 'subcategory', 'sub'],
            description: ['remarks', 'description', 'desc', 'details', 'note'],
            amount: ['amount', 'amt', 'value', 'payment amount']
        }

        const mappingRows = computed(() => ([
            { field: 'transaction_date', target: 'paymentDate', accepted: 'transaction_date, date, payment_date' },
            { field: 'main_category', target: 'mainCategory', accepted: 'main_category, main category' },
            { field: 'sub_category', target: 'subCategory', accepted: 'sub_category, sub category' },
            { field: 'remarks', target: 'description', accepted: 'remarks, description, note' },
            { field: 'amount', target: 'amount (required)', accepted: 'amount, amt, payment amount' }
        ]))

        const findHeaderIndex = (field) => {
            const aliases = headerAliases[field] || []
            return headers.value.findIndex((header) => {
                const normalized = normalizeHeader(header)
                return aliases.includes(normalized)
            })
        }

        const parseAmount = (value) => {
            if (typeof value === 'number') return Number.isFinite(value) ? value : null
            const cleaned = String(value || '').replace(/[^0-9.-]/g, '')
            if (!cleaned.length) return null
            const parsed = Number(cleaned)
            return Number.isFinite(parsed) ? parsed : null
        }

        const handleFile = (event) => {
            const file = event.target.files && event.target.files[0]
            if (!file) return
            fileName.value = file.name
            loading.value = true
            error.value = ''
            const reader = new FileReader()
            reader.onload = () => {
                try {
                    const text = String(reader.result || '')
                    const parsed = parseCSV(text)
                    if (!parsed.length) {
                        headers.value = []
                        rows.value = []
                        error.value = 'No rows found in this file.'
                    } else {
                        const headerRow = parsed[0]
                        const bodyRows = parsed.slice(1)
                        const longestRow = Math.max(headerRow.length, ...bodyRows.map((row) => row.length))
                        const headerCells = [...headerRow]
                        while (headerCells.length < longestRow) {
                            headerCells.push('')
                        }
                        headers.value = normalizeHeaders(headerCells, longestRow)
                        rows.value = bodyRows.map((row) => {
                            const filled = [...row]
                            while (filled.length < headers.value.length) {
                                filled.push('')
                            }
                            return filled
                        })
                    }
                } catch (err) {
                    error.value = err?.message || 'Unable to parse CSV.'
                    headers.value = []
                    rows.value = []
                } finally {
                    loading.value = false
                }
            }
            reader.onerror = () => {
                error.value = 'Unable to read file.'
                loading.value = false
            }
            reader.readAsText(file)
        }

        const processData = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            successMessage.value = ''
            error.value = ''

            const amountIndex = findHeaderIndex('amount')
            if (amountIndex < 0) {
                error.value = 'Amount column is required to import payments.'
                return
            }

            const dateIndex = findHeaderIndex('date')
            const mainIndex = findHeaderIndex('mainCategory')
            const subIndex = findHeaderIndex('subCategory')
            const descIndex = findHeaderIndex('description')

            const payments = rows.value.map((row) => {
                const amountValue = parseAmount(row[amountIndex])
                return {
                    date: dateIndex >= 0 ? row[dateIndex] : null,
                    mainCategory: mainIndex >= 0 ? row[mainIndex] : null,
                    subCategory: subIndex >= 0 ? row[subIndex] : null,
                    description: descIndex >= 0 ? row[descIndex] : null,
                    amount: amountValue
                }
            }).filter((row) => row.amount !== null)

            if (!payments.length) {
                error.value = 'No valid rows to import.'
                return
            }

            processing.value = true
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/logbook/import/payments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ payments })
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to import payments')
                const importedCount = Number.isFinite(data?.created) ? data.created : payments.length
                successMessage.value = `Imported ${importedCount} rows.${data?.skipped ? ` Skipped ${data.skipped}.` : ''}`
            } catch (err) {
                error.value = err?.message || 'Unable to import payments'
            } finally {
                processing.value = false
            }
        }

        const goBack = () => {
            if (window.history.length > 1) {
                router.back()
                return
            }
            router.push('/logbook/more')
        }

        return {
            fileName,
            headers,
            rows,
            loading,
            error,
            previewRows,
            rowCount,
            handleFile,
            goBack,
            isIdHeader,
            isIdColumn,
            processData,
            mappingRows,
            processing,
            successMessage
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-mobile.css"></style>
