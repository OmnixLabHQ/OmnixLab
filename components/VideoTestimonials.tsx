'use client'

export default function VideoTestimonials() {
  // When you have videos, add them like this:
  // const videos = [
  //   { id: 'YOUTUBE_VIDEO_ID', title: 'Client Name', quote: 'What they said' },
  // ]
  const videos: { id: string; title: string; quote: string }[] = []

  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-3">
          Client Stories
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
          See What Our Clients Say
        </h2>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12">
          Real feedback from businesses we've helped worldwide.
        </p>

        {videos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="aspect-w-16 aspect-h-9">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={video.title}
                    allowFullScreen
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-900">{video.title}</p>
                  <p className="text-sm text-gray-500 italic">"{video.quote}"</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <div className="text-4xl mb-4">🎥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Video Testimonials Coming Soon</h3>
            <p className="text-gray-500 mb-6">
              We're collecting video stories from our amazing clients. If you'd like to share your experience, we'd love to feature you!
            </p>
            <a
              href="https://wa.me/2347033702874?text=I'd%20like%20to%20record%20a%20video%20testimonial"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              💬 Record a Video via WhatsApp
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
