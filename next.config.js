/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com', 
      'via.placeholder.com',
      'sihrwhrnswbodpxkrinz.supabase.co', // Supabase Storage
      'images.sympla.com.br', // Sympla
      'discovery-next.svc.sympla.com.br', // Sympla Discovery
      'assets.bileto.sympla.com.br', // Sympla Assets
      'img.evbuc.com', // Eventbrite
      'eventbrite.com',
      'sympla.com.br',
      'cdn.eventbrite.com'
    ],
  },
}

module.exports = nextConfig