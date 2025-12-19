import { ref } from 'vue'
import { API_BASE_URL } from '@/constants/config'

const getProfile = async(token) => {
    const response = ref(null)
    const error = ref(null)

    const bearer = "Bearer " + token
    try {
        const reqOptions = {
            method: "GET",
            headers: {"Content-Type":"application/json", "Authorization":bearer}
        }
        // const data = await fetch("http://localhost:5000/services", reqOptions)
        const data = await fetch(API_BASE_URL + '/api/v1/auth/profile', reqOptions)
        response.value = await data.json()

    } catch (err) {
        error.value = err
    }
    return { response, error }
}

export default getProfile
