import { defineStore } from 'pinia'
import { getCurrentAccount } from '~~/api'
import { ExtendedAccountInfo } from '~~/types'
import { useSupabaseClient } from '#imports' // Nuxt 3 Supabase integration

export const useSessionStore = defineStore('session', () => {
    const sessionInitialized = ref(false)
    const accessToken = ref('')
    const account = ref<ExtendedAccountInfo | null>(null)
    const supabase = useSupabaseClient()

    // Supabase-compatible token validation
    async function isTokenValid(token: string): Promise<boolean> {
        try {
            const { data: { user }, error } = await supabase.auth.getUser(token)
            return !error && user !== null
        } catch (error) {
            return false
        }
    }

    async function initializeSession() {
        const accessTokenFromLocalStorage = localStorage.getItem('access_token')
        if (accessTokenFromLocalStorage) {
            if (await isTokenValid(accessTokenFromLocalStorage)) {
                await updateSession(accessTokenFromLocalStorage)
            } else {
                clearSession()
            }
        }
        sessionInitialized.value = true
    }

    async function updateSession(newAccessToken?: string) {
        if (newAccessToken) {
            accessToken.value = newAccessToken
            localStorage.setItem('access_token', newAccessToken)
        }

        try {
            account.value = await getCurrentAccount(accessToken.value)
        } catch (error) {
            console.error('Session update failed:', error)
            clearSession()
        }
    }

    function clearSession() {
        accessToken.value = ''
        account.value = null
        localStorage.removeItem('access_token')
    }

    // Initialize session when store is created
    initializeSession()

    // Watch for token changes
    watch(accessToken, (newToken) => {
        if (newToken) {
            updateSession(newToken)
        } else {
            clearSession()
        }
    })

    return { 
        accessToken, 
        account, 
        sessionInitialized, 
        updateSession,
        clearSession,
        isTokenValid
    }
})
