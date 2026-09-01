const pool = require('../db')
const phyllo = require('./phyllo')
const { generateMockAnalytics } = require('./mockData')

// Fetches profile/audience/content from Phyllo for a connected influencer and
// upserts a snapshot into influencer_analytics. Falls back to mock data if
// the sandbox call fails, so the demo never breaks on missing credentials.
async function syncInfluencerAnalytics(influencerId, phylloAccountId, handle) {
  const [profile, audience, content] = await Promise.all([
    phyllo.fetchProfile(phylloAccountId),
    phyllo.fetchAudience(phylloAccountId),
    phyllo.fetchContent(phylloAccountId),
  ])

  const mock = !profile ? generateMockAnalytics(handle) : null
  const p = profile || {}
  const aud = audience || {}

  const genderFemale = aud.gender_distribution?.find?.((g) => g.gender === 'FEMALE')?.percentage
  const genderMale = aud.gender_distribution?.find?.((g) => g.gender === 'MALE')?.percentage
  const topCountry = aud.country_distribution?.[0]?.name

  const values = mock || {
    follower_count: p.follower_count ?? p.reputation?.follower_count,
    following_count: p.following_count,
    post_count: p.content_count ?? p.reputation?.content_count,
    profile_url: p.url ?? p.profile_url,
    bio: p.introduction ?? p.bio,
    is_verified: p.is_verified ?? false,
    avg_likes: p.average_likes ?? p.engagement?.average_likes,
    avg_comments: p.average_comments ?? p.engagement?.average_comments,
    avg_views: p.average_views ?? p.engagement?.average_views,
    engagement_rate: p.engagement_rate ?? p.engagement?.engagement_rate,
    audience_quality_score: aud.credibility_score ? aud.credibility_score * 100 : null,
    fake_follower_pct: aud.significant_followers_percentage
      ? 100 - aud.significant_followers_percentage
      : null,
    top_country: topCountry || null,
    gender_female_pct: genderFemale ?? null,
    gender_male_pct: genderMale ?? null,
    age_13_17_pct: aud.age_distribution?.find?.((a) => a.age_range === '13-17')?.percentage ?? null,
    age_18_24_pct: aud.age_distribution?.find?.((a) => a.age_range === '18-24')?.percentage ?? null,
    age_25_34_pct: aud.age_distribution?.find?.((a) => a.age_range === '25-34')?.percentage ?? null,
    age_35_44_pct: aud.age_distribution?.find?.((a) => a.age_range === '35-44')?.percentage ?? null,
    age_45_plus_pct: aud.age_distribution?.find?.((a) => a.age_range === '45-64')?.percentage ?? null,
  }

  await pool.query(
    `INSERT INTO influencer_analytics (
       influencer_id, follower_count, following_count, post_count, profile_url, bio, is_verified,
       avg_likes, avg_comments, avg_views, engagement_rate,
       audience_quality_score, fake_follower_pct, top_country,
       gender_female_pct, gender_male_pct,
       age_13_17_pct, age_18_24_pct, age_25_34_pct, age_35_44_pct, age_45_plus_pct,
       raw_profile, raw_audience, raw_content
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
     )`,
    [
      influencerId,
      values.follower_count,
      values.following_count,
      values.post_count,
      values.profile_url,
      values.bio,
      values.is_verified,
      values.avg_likes,
      values.avg_comments,
      values.avg_views,
      values.engagement_rate,
      values.audience_quality_score,
      values.fake_follower_pct,
      values.top_country,
      values.gender_female_pct,
      values.gender_male_pct,
      values.age_13_17_pct,
      values.age_18_24_pct,
      values.age_25_34_pct,
      values.age_35_44_pct,
      values.age_45_plus_pct,
      mock ? mock.raw_profile : profile,
      mock ? mock.raw_audience : audience,
      mock ? mock.raw_content : content,
    ]
  )
}

module.exports = { syncInfluencerAnalytics }
