import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.1/+esm'

// Initialize Supabase client
const supabaseUrl = 'https://zhqqvtjvzgwqikipbbjm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocXF2dGp2emd3cWlraXBiYmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0MjgyNjEsImV4cCI6MjA0NTAwNDI2MX0.vPfPi3s_ht9xK0S901jkdmJBWTqtGoIU9aKeAUx7eZI'
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth functions
export const auth = {
    signIn: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw error
        return { user: data.user }
    },

    signUp: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        })
        if (error) throw error
        return { user: data.user }
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },

    getSession: async () => {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        return { data: { session } }
    },

    user: () => {
        return supabase.auth.getUser().then(({ data: { user } }) => user)
    }
}

// Token functions
export const tokens = {
    getTokenBalance: async (userId) => {
        const { data, error } = await supabase
            .from('user_tokens')
            .select('balance')
            .eq('user_id', userId)
            .single()
        
        if (error) {
            if (error.code === 'PGRST116') {
                // If no record exists, create one with default balance
                const { data: newData, error: insertError } = await supabase
                    .from('user_tokens')
                    .insert([{ user_id: userId, balance: 3 }])
                    .select()
                    .single()
                
                if (insertError) throw insertError
                return { data: { balance: 3 } }
            }
            throw error
        }
        
        return { data: { balance: data.balance } }
    },

    useToken: async (userId) => {
        const { data, error } = await supabase.rpc('use_token', { user_id: userId })
        if (error) throw error
        return { data }
    }
}

// User profile functions
export const profiles = {
    // Get user profile
    async getProfile(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()
        if (error) throw error
        return data
    },

    // Update user profile
    async updateProfile(userId, updates) {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
        if (error) throw error
        return data
    },

    // Upload avatar
    async uploadAvatar(userId, file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/avatar.${fileExt}`
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true })
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)

        await this.updateProfile(userId, { avatar_url: publicUrl })
        return publicUrl
    }
}

// Songs functions
export const songs = {
    // Get user's songs
    async getUserSongs(userId) {
        const { data, error } = await supabase
            .from('songs')
            .select(`
                *,
                likes_count,
                users!inner (
                    username
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        if (error) throw error
        return data
    },

    // Create song
    async createSong(userId, songData) {
        const { data, error } = await supabase
            .from('songs')
            .insert([{ ...songData, user_id: userId }])
        if (error) throw error
        return data
    },

    // Like song
    async likeSong(userId, songId) {
        const { error } = await supabase
            .from('likes')
            .insert([{ user_id: userId, song_id: songId }])
        if (error) throw error

        // Increment likes count
        await supabase.rpc('increment_likes', { song_id: songId })
    }
}

// Awards functions
export const awards = {
    // Get user's awards
    async getUserAwards(userId) {
        const { data, error } = await supabase
            .from('user_awards')
            .select(`
                *,
                awards (
                    name,
                    description,
                    icon
                )
            `)
            .eq('user_id', userId)
        if (error) throw error
        return data
    }
}
