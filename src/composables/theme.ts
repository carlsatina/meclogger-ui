import { computed, ref } from 'vue'

type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'app-theme'
const theme = ref<ThemeMode>('dark')
let initialized = false

const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement
    root.classList.remove('theme-dark', 'theme-light')
    root.classList.add(`theme-${mode}`)
    root.setAttribute('data-theme', mode)
}

const detectPreferred = (): ThemeMode => {
    if (typeof window === 'undefined') return 'dark'
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches
    return prefersLight ? 'light' : 'dark'
}

export const initTheme = (): ThemeMode => {
    if (initialized) return theme.value
    const preferred = detectPreferred()
    theme.value = preferred
    if (typeof document !== 'undefined') {
        applyTheme(preferred)
    }
    initialized = true
    return preferred
}

export const useTheme = () => {
    if (!initialized && typeof window !== 'undefined') {
        initTheme()
    }

    const setTheme = (mode: ThemeMode) => {
        const next = mode === 'light' ? 'light' : 'dark'
        theme.value = next
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, next)
            applyTheme(next)
        }
    }

    const toggleTheme = () => {
        setTheme(theme.value === 'dark' ? 'light' : 'dark')
    }

    return {
        theme,
        isDark: computed(() => theme.value === 'dark'),
        setTheme,
        toggleTheme
    }
}
