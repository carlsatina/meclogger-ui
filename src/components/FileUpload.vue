<template>

    <div class="form-group mt-1 d-flex flex-row align-items-center">
        <div>
            <img :src="filePreview" height="100" width="100">
        </div>
        <div class="d-flex flex-column">
            <input type="file" @change="fileSelected" ref="fileInput" style="display: none;"
                @input="pickFile">
            <div v-if="fileSize > 0">
                <span class="ms-4 text-danger fw-bold" style="font-size: 13px;" v-if="fileSize > 1">{{ filename }} {{ fileSize }}MB</span>
                <span class="ms-4" style="font-size: 13px;" v-else="fileSize > 1">{{ filename }} {{ fileSize }}MB</span>
            </div>
            <button type="button" class="btn ms-4 btn-success" @click="$refs.fileInput.click()">{{ buttonLabel }}</button>
            <div v-if="hasError" class="error-message small text-danger ms-4"><strong>{{ errorMsg}}</strong></div>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue'

export default {
    name: "FileUpload",
    props: {
        imagePreview: {
            type: String,
            required: false
        },
        errorMsg: {
            type: String,
            required: false
        },
        hasError: {
            type: Boolean,
            required: false
        }
    },
    setup(props, {emit}) {
        const filePreview = ref(require('@/assets/wallpaper.png'))
        const fileInput = ref(null)
        const editFlag = ref(false)
        const buttonLabel = ref ('Select Photo')
        const filename = ref ('filename')
        const fileSize = ref(0)

        const pickFile = () => {
            let input = fileInput.value
            let file = input.files
            if (file && file[0]) {
                let reader = new FileReader
                reader.onload = e => {
                    filePreview.value = e.target.result
                }
                reader.readAsDataURL(file[0])
            }
        }

        const fileSelected = (event) => {
            if (event.target.files.length > 0) {
                filename.value = event.target.files[0].name
                fileSize.value = (event.target.files[0].size / 1024 / 1024).toFixed(1)
                emit("file-updated", event.target.files[0])
            }
        }

        if (props.imagePreview) {
            editFlag.value = true
            filePreview.value = props.imagePreview
            buttonLabel.value = 'Change Photo'
        }

        return {
            filePreview,
            fileInput,
            pickFile,
            fileSelected,
            editFlag,
            buttonLabel,
            filename,
            fileSize
        }
    }
}
</script>

<style>
</style>