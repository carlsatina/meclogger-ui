import { reactive } from 'vue'

const state = reactive ({
    isUserLoggedIn: false,
    isUserAdmin: false,
    showSearchIcon: false,
    userProfile: null
})

const methods = {
    loginUser(token) {
        localStorage.setItem('token', token)
        state.isUserLoggedIn = true
    },
    logoutUser() {
        localStorage.removeItem('token')
        state.isUserLoggedIn = false
        state.isUserAdmin = false
        state.userProfile = null
    },
    isStrongPassword(password) {
        return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,20}$/.test(password)
    },
    isValidEmailFormat(email) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)
    },
    hasMinimumChar(text) {
        return /^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]{8,20}$/.test(text)
    },
    setUserAdmin(val) {
        state.isUserAdmin = val
    },
    setSearchIcon(val) {
        state.showSearchIcon = val
    },
    setUserProfile(profile) {
        state.userProfile = profile
    }
}

export default {
    state,
    methods
}
