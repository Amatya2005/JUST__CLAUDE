import { formatEngagement, formatNumber } from '../format'
import './InfluencerCard.css'

export default function InfluencerCard({ creator, onInvite }) {
  const initials = (creator.full_name || creator.username || '?').slice(0, 2).toUpperCase()

  return (
    <div className="creator-card card card-shadow">
      <div className="creator-card-head">
        {creator.image_url ? (
          <img className="creator-avatar" src={creator.image_url} alt={creator.username} />
        ) : (
          <div className="creator-avatar creator-avatar-placeholder">{initials}</div>
        )}
        <div className="creator-identity">
          <strong>@{creator.username}</strong>
          <span className="badge badge-purple creator-platform">{creator.platform || 'instagram'}</span>
        </div>
      </div>

      <div className="creator-stats">
        <div>
          <span>Followers</span>
          <strong>{formatNumber(creator.follower_count)}</strong>
        </div>
        <div>
          <span>Engagement</span>
          <strong>{formatEngagement(creator.engagement_rate)}</strong>
        </div>
      </div>

      <div className="creator-actions">
        <button className="btn btn-primary btn-sm" onClick={() => onInvite(creator)}>
          Invite
        </button>
        {creator.profile_url && (
          <a className="creator-profile-link" href={creator.profile_url} target="_blank" rel="noreferrer">
            View profile
          </a>
        )}
      </div>
    </div>
  )
}
