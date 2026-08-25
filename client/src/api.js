import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function unwrap(promise) {
  return promise
    .then((res) => res.data.data)
    .catch((err) => {
      const message = err.response?.data?.error || err.message || 'Something went wrong'
      throw new Error(message)
    })
}

export const authApi = {
  agencySignup: (payload) => unwrap(api.post('/auth/agency/signup', payload)),
  agencyLogin: (payload) => unwrap(api.post('/auth/agency/login', payload)),
  getInvite: (token) => unwrap(api.get(`/auth/invite/${token}`)),
  acceptInvite: (payload) => unwrap(api.post('/auth/influencer/accept-invite', payload)),
  influencerLogin: (payload) => unwrap(api.post('/auth/influencer/login', payload)),
}

export const campaignsApi = {
  list: () => unwrap(api.get('/campaigns')),
  create: (payload) => unwrap(api.post('/campaigns', payload)),
  get: (id) => unwrap(api.get(`/campaigns/${id}`)),
  remove: (id) => unwrap(api.delete(`/campaigns/${id}`)),
}

export const influencersApi = {
  invite: (payload) => unwrap(api.post('/influencers/invite', payload)),
  sdkToken: () => unwrap(api.post('/influencers/sdk-token')),
  me: () => unwrap(api.get('/influencers/me')),
}

export const analyticsApi = {
  overview: () => unwrap(api.get('/analytics/overview')),
  influencer: (id) => unwrap(api.get(`/analytics/influencer/${id}`)),
  campaign: (id) => unwrap(api.get(`/analytics/campaign/${id}`)),
}

export const discoveryApi = {
  search: (params) => unwrap(api.get('/discovery/search', { params })),
}

export const devApi = {
  simulateConnect: (influencerId) => unwrap(api.post(`/dev/simulate-connect/${influencerId}`)),
}

export default api
