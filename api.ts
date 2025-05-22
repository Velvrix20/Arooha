import { createClient } from '@supabase/supabase-js'
import { Account, ApiError, CollectionForm, ExtendedAccountInfo, FeedPicture, Picture, PictureForm } from './types'

// Initialize Supabase (uses environment variables)
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://hlhrzatfcqrjlsrpnaly.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsaHJ6YXRmY3FyamxzcnBuYWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NTE0NDEsImV4cCI6MjA2MzQyNzQ0MX0.zhIZuzStJdHdZ7LFh-FIpQRsEfgsSUFVAQii_YRAtAQ'
)

// Helper function remains the same
async function throwIfError(response: Response) {
  if (!response.ok) {
    throw new ApiError(response.status, await response.text())
  }
}

// Authentication
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
    password,
    options: {
      data: {
        username: email.split('@')[0] // Default username
      }
    }
  })

  if (error) throw new ApiError(400, error.message)
  return data.session?.access_token || await logInForJwt(email, password)
}

// File Uploads
export async function uploadFile(accessToken: string, file: File): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError) throw new ApiError(401, 'Invalid token')

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${Date.now()}.${fileExt}`
  
  const { error } = await supabase.storage
    .from('images')
    .upload(fileName, file)

  if (error) throw new ApiError(500, error.message)

  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(fileName)

  return publicUrl
}

// Picture Management
export async function addPicture(accessToken: string, picture: PictureForm): Promise<number> {
  supabase.auth.setAuth(accessToken)
  
  const { data, error } = await supabase
    .from('pictures')
    .insert(picture)
    .select('id')
    .single()

  if (error) throw new ApiError(500, error.message)
  return data.id
}

export async function getPictures(accessToken?: string): Promise<Picture[]> {
  const query = supabase.from('pictures').select('*')
  
  if (accessToken) {
    supabase.auth.setAuth(accessToken)
    // Add authenticated-only filters if needed
  }

  const { data, error } = await query
  if (error) throw new ApiError(500, error.message)
  return data || []
}

// Keep other existing functions as needed...

// Fallback to original API if required
export const API_BASE_URL = 'https://netscapes-rest-api.onrender.com'
