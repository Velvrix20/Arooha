import { createClient } from '@supabase/supabase-js'
import { Account, ApiError, CollectionForm, ExtendedAccountInfo, 
    FeedPicture, Picture, PictureForm } from './types'

// Configuration
const SUPABASE_URL = 'https://hlhrzatfcqrjlsrpnaly.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsaHJ6YXRmY3FyamxzcnBuYWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NTE0NDEsImV4cCI6MjA2MzQyNzQ0MX0.zhIZuzStJdHdZ7LFh-FIpQRsEfgsSUFVAQii_YRAtAQ'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Keep your existing API base URL as fallback
export const API_BASE_URL = 'https://netscapes-rest-api.onrender.com'

// Helper function remains the same
async function throwIfError(response: Response) {
    if(!response.ok) {
        throw new ApiError(response.status, await response.text())
    }
}

// Updated functions using Supabase
export async function logInForJwt(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) throw new ApiError(401, error.message)
    
    return data.session.access_token
}

export async function signUpForJwt(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    })

    if (error) throw new ApiError(400, error.message)
    
    return data.session?.access_token || await logInForJwt(email, password)
}

export async function getPictures(accessToken?: string): Promise<Picture[]> {
    if (accessToken) {
        // Authenticated request
        const { data, error } = await supabase
            .from('pictures')
            .select('*')
            
        if (error) throw new ApiError(500, error.message)
        return data
    } else {
        // Fallback to original API for public access
        const response = await fetch(API_BASE_URL + '/pictures')
        await throwIfError(response)
        return await response.json()
    }
}

export async function getCurrentAccount(accessToken: string): Promise<ExtendedAccountInfo> {
    // Set the access token for this request
    supabase.auth.setAuth(accessToken)
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw new ApiError(401, error.message)
    
    // Get additional account info from your profiles table
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
    if (profileError) throw new ApiError(404, 'Profile not found')
    
    return {
        ...user,
        ...profile
    }
}

// Example of updating a Supabase table
export async function addComment(accessToken: string, text: string, targetPictureId: number) {
    supabase.auth.setAuth(accessToken)
    
    const { data: user } = await supabase.auth.getUser()
    
    const { error } = await supabase
        .from('comments')
        .insert({
            text,
            picture_id: targetPictureId,
            user_id: user.user.id,
            created_at: new Date().toISOString()
        })
        
    if (error) throw new ApiError(500, error.message)
}

// Keep other functions as is or modify similarly

// Add this to your existing api.ts
export async function isTokenValid(accessToken: string): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    return !error && user !== null
  } catch (error) {
    return false
  }
}
