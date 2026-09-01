// Fallback mock data generator used by the dev simulate-connect route,
// and as a safety net if Phyllo sandbox calls fail during a demo.
function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}

function generateMockAnalytics(handle) {
  const followerCount = Math.floor(randomBetween(8000, 500000))
  const engagementRate = randomBetween(0.015, 0.065)
  const avgLikes = Math.floor(followerCount * engagementRate * randomBetween(0.7, 0.95))
  const avgComments = Math.floor(avgLikes * randomBetween(0.03, 0.08))

  const female = randomBetween(35, 70)
  const male = 100 - female

  const a1 = randomBetween(5, 20)
  const a2 = randomBetween(25, 45)
  const a3 = randomBetween(15, 30)
  const a4 = randomBetween(8, 18)
  const a5 = Math.max(0, 100 - a1 - a2 - a3 - a4)

  return {
    follower_count: followerCount,
    following_count: Math.floor(randomBetween(200, 2000)),
    post_count: Math.floor(randomBetween(80, 900)),
    profile_url: `https://instagram.com/${handle || 'creator'}`,
    bio: 'Content creator | Lifestyle & Travel',
    is_verified: Math.random() > 0.7,

    avg_likes: avgLikes,
    avg_comments: avgComments,
    avg_views: Math.floor(avgLikes * randomBetween(2, 5)),
    engagement_rate: Number(engagementRate.toFixed(4)),

    audience_quality_score: Number(randomBetween(65, 95).toFixed(2)),
    fake_follower_pct: Number(randomBetween(1, 12).toFixed(2)),
    top_country: ['India', 'United States', 'United Kingdom', 'Brazil'][Math.floor(randomBetween(0, 4))],
    gender_female_pct: Number(female.toFixed(2)),
    gender_male_pct: Number(male.toFixed(2)),
    age_13_17_pct: Number(a1.toFixed(2)),
    age_18_24_pct: Number(a2.toFixed(2)),
    age_25_34_pct: Number(a3.toFixed(2)),
    age_35_44_pct: Number(a4.toFixed(2)),
    age_45_plus_pct: Number(a5.toFixed(2)),

    raw_profile: { mock: true },
    raw_audience: { mock: true },
    raw_content: { mock: true },
  }
}

function generateMockSearchResults(query, platform, limit = 20, filters = {}) {
  const minFollowers = Number(filters.minFollowers) || 5000
  const maxFollowers = Number(filters.maxFollowers) || 1200000
  const minEngagement = Number(filters.minEngagement) / 100 || 0.01

  const results = []
  for (let i = 0; i < limit; i++) {
    const handle = `${(query || 'creator').replace(/\s+/g, '').toLowerCase()}${i + 1}`
    results.push({
      id: `mock-${platform}-${handle}`,
      username: handle,
      platform,
      full_name: `${query || 'Creator'} ${i + 1}`,
      follower_count: Math.floor(randomBetween(minFollowers, Math.max(minFollowers + 1, maxFollowers))),
      engagement_rate: Number(randomBetween(minEngagement, Math.max(minEngagement + 0.001, 0.07)).toFixed(4)),
      image_url: null,
      profile_url: `https://instagram.com/${handle}`,
    })
  }
  return results
}

module.exports = { generateMockAnalytics, generateMockSearchResults }
