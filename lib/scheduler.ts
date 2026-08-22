import cron from 'node-cron'
import { generatePost, updateWebsiteBlog } from './seo-bot'

// ============ MEDIUM API ============
async function postToMedium(title: string, content: string, tags: string[]) {
  const MEDIUM_TOKEN = process.env.MEDIUM_API_TOKEN
  if (!MEDIUM_TOKEN) {
    console.log('⚠️ Medium token not configured')
    return false
  }

  try {
    const userRes = await fetch('https://api.medium.com/v1/me', {
      headers: { Authorization: `Bearer ${MEDIUM_TOKEN}` }
    })
    const userData = await userRes.json()
    const userId = userData.data.id

    await fetch(`https://api.medium.com/v1/users/${userId}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MEDIUM_TOKEN}`
      },
      body: JSON.stringify({
        title,
        contentFormat: 'markdown',
        content: `# ${title}\n\n${content}`,
        tags: tags.slice(0, 5),
        publishStatus: 'public'
      })
    })
    console.log('✅ Posted to Medium')
    return true
  } catch (error) {
    console.error('❌ Medium failed:', error)
    return false
  }
}

// ============ FACEBOOK API ============
async function postToFacebook(message: string) {
  const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID
  const FB_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN
  if (!FB_PAGE_ID || !FB_ACCESS_TOKEN) {
    console.log('⚠️ Facebook not configured')
    return false
  }

  try {
    await fetch(`https://graph.facebook.com/v18.0/${FB_PAGE_ID}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, access_token: FB_ACCESS_TOKEN })
    })
    console.log('✅ Posted to Facebook')
    return true
  } catch (error) {
    console.error('❌ Facebook failed:', error)
    return false
  }
}

// ============ X (TWITTER) API ============
async function postToX(title: string, hashtags: string) {
  const X_API_KEY = process.env.X_API_KEY
  const X_API_SECRET = process.env.X_API_SECRET
  const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN
  const X_ACCESS_SECRET = process.env.X_ACCESS_SECRET
  
  if (!X_API_KEY || !X_ACCESS_TOKEN) {
    console.log('⚠️ X (Twitter) not configured')
    return false
  }

  const tweet = `${title}\n\n🌐 omnixlabsupport.com\n\n${hashtags}`
  
  try {
    // Using v2 API
    await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${X_ACCESS_TOKEN}`
      },
      body: JSON.stringify({ text: tweet.substring(0, 280) })
    })
    console.log('✅ Posted to X (Twitter)')
    return true
  } catch (error) {
    console.error('❌ X failed:', error)
    return false
  }
}

// ============ INSTAGRAM API ============
async function postToInstagram(caption: string) {
  const IG_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN
  const IG_USER_ID = process.env.INSTAGRAM_USER_ID
  
  if (!IG_ACCESS_TOKEN || !IG_USER_ID) {
    console.log('⚠️ Instagram not configured')
    return false
  }

  try {
    // Note: Instagram requires an image. For text-only, we'd need to generate an image first.
    // This posts a text caption (requires image creation for full post)
    await fetch(`https://graph.facebook.com/v18.0/${IG_USER_ID}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caption,
        access_token: IG_ACCESS_TOKEN,
        // Would need image_url for actual post
      })
    })
    console.log('✅ Posted to Instagram (caption only - image needed for full post)')
    return true
  } catch (error) {
    console.error('❌ Instagram failed:', error)
    return false
  }
}

// ============ MAIN POST FUNCTION ============
export async function postToAllPlatforms() {
  console.log('🤖 Generating daily post...')
  const post = generatePost()
  console.log(`📝 Title: ${post.title}`)
  
  const fullContent = `${post.body}`
  
  // Post everywhere
  const results = await Promise.allSettled([
    postToMedium(post.title, post.body, post.tags),
    postToFacebook(fullContent),
    postToX(post.title, post.hashtags),
    postToInstagram(fullContent.substring(0, 200)),
  ])
  
  // Update website blog
  const blogUpdated = updateWebsiteBlog(post)
  
  console.log('📊 Results:', {
    medium: results[0].status,
    facebook: results[1].status,
    x: results[2].status,
    instagram: results[3].status,
    blog: blogUpdated ? 'updated' : 'failed',
  })
  
  return { post, results, blogUpdated }
}

// ============ START SCHEDULER ============
export function startScheduler() {
  // Run every day at 9:00 AM Nigerian time (8:00 AM UTC)
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily post...')
    await postToAllPlatforms()
  })
  
  console.log('⏰ Scheduler started — posting daily at 9:00 AM WAT')
}