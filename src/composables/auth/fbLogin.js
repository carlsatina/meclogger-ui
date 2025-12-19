import { ref } from 'vue'
import { API_BASE_URL } from '@/constants/config'

const fbLogin = async(facebookId, name) => {
    const response = ref(null)
    const error = ref(null)

    try {
        const reqOptions = {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({
                facebookId: facebookId,
                name: name
            })
        }
        // const data = await fetch("http://localhost:5000/services", reqOptions)
        const data = await fetch(API_BASE_URL + '/api/v1/auth/fbLogin', reqOptions)
        response.value = await data.json()

    } catch (err) {
        error.value = err
    }
    return { response, error }
}

export default fbLogin
