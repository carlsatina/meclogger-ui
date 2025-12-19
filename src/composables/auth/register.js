import { ref } from 'vue'
import { API_BASE_URL } from '@/constants/config'

const register = async(userInfo) => {
    const response = ref(null)
    const error = ref(null)

    try {
        const reqOptions = {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({
                ...userInfo
            })
        }
        const data = await fetch(API_BASE_URL + '/api/v1/auth/register', reqOptions)
        response.value = await data.json()

    } catch (err) {
        error.value = err
    }
    return { response, error }
}

export default register
