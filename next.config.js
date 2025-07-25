/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com', 
      'via.placeholder.com',
      'sihrwhrnswbodpxkrinz.supabase.co', // Supabase Storage
      'lh3.googleusercontent.com', // Google avatars
      'avatars.githubusercontent.com', // GitHub avatars
      'graph.facebook.com', // Facebook avatars
      'pbs.twimg.com', // Twitter avatars
      'cdn.discordapp.com', // Discord avatars
    ],
  },
}

module.exports = nextConfig