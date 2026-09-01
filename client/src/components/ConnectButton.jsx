import { useEffect, useState } from 'react'
import { influencersApi } from '../api'
import { useToast } from './Toast'

const SDK_SRC = 'https://cdn.getphyllo.com/connect/v2/phyllo-connect.js'
const INSTAGRAM_WORK_PLATFORM_ID = '9bb8913b-ddd9-430b-a66a-d74d846e6c66'

// The SDK is a global singleton, so it is loaded once per page rather than per
// component mount — removing a still-loading script would fire a spurious error.
let sdkPromise = null

function loadPhylloSdk() {
  if (window.PhylloConnect) return Promise.resolve()
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SDK_SRC
    script.async = true
    script.onload = resolve
    script.onerror = () => {
      sdkPromise = null
      reject(new Error('Failed to load Phyllo SDK'))
    }
    document.body.appendChild(script)
  })

  return sdkPromise
}

export default function ConnectButton({ phylloUserId, onConnected, label = 'Connect Instagram' }) {
  const showToast = useToast()
  const [sdkReady, setSdkReady] = useState(Boolean(window.PhylloConnect))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadPhylloSdk().then(
      () => !cancelled && setSdkReady(true),
      () => !cancelled && showToast('Could not load the Instagram connect SDK', 'error')
    )
    return () => {
      cancelled = true
    }
  }, [showToast])

  async function handleConnect() {
    setLoading(true)
    try {
      const { sdk_token } = await influencersApi.sdkToken()

      const phylloConnect = window.PhylloConnect.initialize({
        clientDisplayName: 'JustInfluence',
        environment: import.meta.env.VITE_PHYLLO_ENV || 'sandbox',
        userId: phylloUserId,
        token: sdk_token,
        redirect: false,
        workPlatformId: INSTAGRAM_WORK_PLATFORM_ID,
      })

      phylloConnect.on('accountConnected', (accountId, workPlatformId, userId) => {
        showToast('Instagram connected')
        onConnected?.({ accountId, workPlatformId, userId })
      })

      phylloConnect.on('accountDisconnected', () => {
        showToast('Instagram disconnected', 'info')
      })

      phylloConnect.on('tokenExpired', () => {
        showToast('Connect session expired — please try again', 'error')
      })

      phylloConnect.on('exit', () => {
        setLoading(false)
      })

      phylloConnect.open()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button className="btn btn-primary" onClick={handleConnect} disabled={!sdkReady || loading}>
      {loading ? <span className="spinner" /> : label}
    </button>
  )
}
