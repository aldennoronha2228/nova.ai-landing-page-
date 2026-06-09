import { useState, useRef, useCallback, useEffect, type DragEvent, type FormEvent, type ChangeEvent } from 'react'
import Head from 'next/head'
import Link from 'next/link'

type FormStatus = {
  type: 'success' | 'error'
  message: string
} | null

type MediaType = 'image' | 'video'

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

type MediaFile = {
  id: string
  file: File
  mediaType: MediaType
  /** Preview object URL for local display before/during upload */
  previewUrl: string
  /** 0–100 */
  progress: number
  uploadState: UploadState
  /** URL from Cloudinary after successful upload */
  remoteUrl?: string
  errorMessage?: string
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime'])
const MAX_IMAGES = 5
const MAX_IMAGE_BYTES = 10 * 1024 * 1024  // 10MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024 // 100MB

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function uploadWithProgress(
  payload: { name: string; type: string; base64: string; applicationId: string },
  onProgress: (pct: number) => void
): Promise<{ url: string; type: MediaType }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload')
    xhr.setRequestHeader('Content-Type', 'application/json')

    xhr.upload.addEventListener('progress', (evt) => {
      if (evt.lengthComputable) {
        onProgress(Math.round((evt.loaded / evt.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      let data: any = {}
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        // Fallback for non-JSON responses
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ url: data.url, type: data.type as MediaType })
      } else {
        const errorMsg = data.message || `Upload failed with status ${xhr.status}`
        reject(new Error(errorMsg))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error during upload.')))
    xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled.')))

    xhr.send(JSON.stringify(payload))
  })
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (err) => reject(err)
  })
}

export default function AlphaApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<FormStatus>(null)
  const [isCloudinaryConfigured, setIsCloudinaryConfigured] = useState<boolean | null>(null)

  // Application window state
  const [windowLoading, setWindowLoading] = useState(true)
  const [windowClosed, setWindowClosed] = useState(false)
  const [windowDeadline, setWindowDeadline] = useState<string | null>(null)
  const [windowClosedMessage, setWindowClosedMessage] = useState('Applications are currently closed. Check back soon!')

  // Live countdown state
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)

  // Check application window on mount
  useEffect(() => {
    fetch('/api/application-window')
      .then((res) => res.json())
      .then((data) => {
        const now = new Date()
        const notYetOpen = data.startTime ? now < new Date(data.startTime) : false
        const pastDeadline = data.deadline ? now > new Date(data.deadline) : false
        setWindowClosed(!data.isOpen || notYetOpen || pastDeadline)
        setWindowDeadline(data.deadline ?? null)
        setWindowClosedMessage(data.closedMessage || 'Applications are currently closed. Check back soon!')
      })
      .catch(() => {
        // Fail open
        setWindowClosed(false)
      })
      .finally(() => setWindowLoading(false))
  }, [])

  // Live countdown ticker
  useEffect(() => {
    if (!windowDeadline) {
      setCountdown(null)
      return
    }

    const tick = () => {
      const diff = new Date(windowDeadline).getTime() - Date.now()
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        setWindowClosed(true)
        return
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setCountdown({ days, hours, minutes, seconds })
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [windowDeadline])

  // Stable application ID generated once on mount
  const applicationId = useRef<string>(generateId())

  // Check Cloudinary config on mount
  useEffect(() => {
    fetch('/api/upload')
      .then((res) => res.json())
      .then((data) => setIsCloudinaryConfigured(data.configured))
      .catch(() => setIsCloudinaryConfigured(false))
  }, [])

  // Form fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')
  const [isStudent, setIsStudent] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [projectsCompleted, setProjectsCompleted] = useState('')
  const [bestProject, setBestProject] = useState('')
  const [useCase, setUseCase] = useState('')
  const [projectLinks, setProjectLinks] = useState('')
  const [willingFeedback, setWillingFeedback] = useState('')

  // Media upload state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      mediaFiles.forEach((m) => URL.revokeObjectURL(m.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasVideo = mediaFiles.some((m) => m.mediaType === 'video')
  const imageCount = mediaFiles.filter((m) => m.mediaType === 'image').length
  const anyUploading = mediaFiles.some((m) => m.uploadState === 'uploading')

  const addAndUpload = useCallback(
    async (files: File[]) => {
      const newEntries: MediaFile[] = []
      const errors: string[] = []

      for (const file of files) {
        const isImg = ALLOWED_IMAGE_TYPES.has(file.type)
        const isVid = ALLOWED_VIDEO_TYPES.has(file.type)

        if (!isImg && !isVid) {
          errors.push(`"${file.name}" is not a supported type. Use JPG, PNG, WEBP, MP4, or MOV.`)
          continue
        }

        if (isVid) {
          if (hasVideo || newEntries.some((e) => e.mediaType === 'video')) {
            errors.push('You can only upload 1 video.')
            continue
          }
          if (file.size > MAX_VIDEO_BYTES) {
            errors.push(`"${file.name}" exceeds the 100MB video limit.`)
            continue
          }
        }

        if (isImg) {
          const currentTotal = imageCount + newEntries.filter((e) => e.mediaType === 'image').length
          if (currentTotal >= MAX_IMAGES) {
            errors.push(`Maximum ${MAX_IMAGES} images allowed.`)
            continue
          }
          if (file.size > MAX_IMAGE_BYTES) {
            errors.push(`"${file.name}" exceeds the 10MB image limit.`)
            continue
          }
        }

        newEntries.push({
          id: generateId(),
          file,
          mediaType: isVid ? 'video' : 'image',
          previewUrl: URL.createObjectURL(file),
          progress: 0,
          uploadState: 'idle',
        })
      }

      if (errors.length) {
        setStatus({ type: 'error', message: errors.join(' ') })
      }

      if (newEntries.length === 0) return

      setMediaFiles((prev) => [...prev, ...newEntries])

      // Upload each file
      for (const entry of newEntries) {
        setMediaFiles((prev) =>
          prev.map((m) => (m.id === entry.id ? { ...m, uploadState: 'uploading' } : m))
        )

        try {
          const base64 = await toBase64(entry.file)
          const result = await uploadWithProgress(
            {
              name: entry.file.name,
              type: entry.file.type,
              base64,
              applicationId: applicationId.current,
            },
            (pct) => {
              setMediaFiles((prev) =>
                prev.map((m) => (m.id === entry.id ? { ...m, progress: pct } : m))
              )
            }
          )

          setMediaFiles((prev) =>
            prev.map((m) =>
              m.id === entry.id
                ? { ...m, uploadState: 'done', progress: 100, remoteUrl: result.url }
                : m
            )
          )
        } catch (err) {
          console.error('Upload error for file:', entry.file.name, err)
          setMediaFiles((prev) =>
            prev.map((m) =>
              m.id === entry.id
                ? {
                    ...m,
                    uploadState: 'error',
                    errorMessage: err instanceof Error ? err.message : 'Upload failed.',
                  }
                : m
            )
          )
        }
      }
    },
    [hasVideo, imageCount]
  )

  const removeMedia = (id: string) => {
    setMediaFiles((prev) => {
      const target = prev.find((m) => m.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((m) => m.id !== id)
    })
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }
  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) void addAndUpload(files)
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length > 0) void addAndUpload(files)
    e.target.value = ''
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    if (
      !fullName.trim() ||
      !email.trim() ||
      !country.trim() ||
      !isStudent ||
      !experienceLevel ||
      !projectsCompleted ||
      !bestProject.trim() ||
      !useCase.trim() ||
      !willingFeedback
    ) {
      setStatus({ type: 'error', message: 'Please fill out all required fields.' })
      return
    }

    if (anyUploading) {
      setStatus({ type: 'error', message: 'Please wait for all uploads to finish.' })
      return
    }

    const failedUploads = mediaFiles.filter((m) => m.uploadState === 'error')
    if (failedUploads.length > 0) {
      setStatus({ type: 'error', message: 'Some files failed to upload. Remove them or retry.' })
      return
    }

    setIsSubmitting(true)
    setStatus(null)

    const projectMedia = mediaFiles
      .filter((m) => m.uploadState === 'done' && m.remoteUrl)
      .map((m) => ({ url: m.remoteUrl!, type: m.mediaType }))

    try {
      const response = await fetch('/api/alpha-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: applicationId.current,
          fullName,
          email,
          country,
          student: isStudent,
          experienceLevel,
          projectsCompleted,
          bestProject,
          useCase,
          projectLinks,
          projectMedia,
          willingFeedback: willingFeedback === 'yes',
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to submit application.')

      const successMessage = !data.emailed && data.emailError
        ? `${data.message || 'Application Received'} We could not send the confirmation email yet: ${data.emailError}`
        : (data.message || 'Application Received')

      setStatus({ type: 'success', message: successMessage })
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>Apply for Alpha Access — NovaBoard AI</title>
        <meta name="description" content="Join the private NovaBoard AI Alpha Program and shape the future of hardware engineering." />
        <style>{`
          html {
            overflow-x: hidden !important;
            overflow-y: auto !important;
            height: auto !important;
          }
          body {
            overflow: visible !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .alpha-page-viewport {
            overflow: visible !important;
            height: auto !important;
            min-height: 100vh !important;
            padding: var(--page-gutter) !important;
          }
        `}</style>
      </Head>

      <div className="alpha-page-viewport">
        {/* Glow Effects */}
        <div className="scroll-glow alpha-glow-bg" aria-hidden="true" />
        <div className="hero-grid alpha-grid-bg" aria-hidden="true" />

        {/* Header Branding */}
        <header className="alpha-header">
          <Link href="/" className="nav-brand">
            <img className="nav-logo" src="/nova-logo-n.png" alt="" />
            <span>NovaBoard AI</span>
          </Link>
        </header>

        <main className="alpha-main-content">
          <div className="alpha-columns">

            {/* Left Column: Info & Benefits */}
            <section className="alpha-info-column">
              <span className="alpha-program-badge">ALPHA PROGRAM</span>

              <h1 className="alpha-main-headline">
                Join the NovaBoard AI <br />
                <span className="accent-serif">Alpha Program</span>
              </h1>

              <p className="alpha-subheadline">
                Help shape the future of AI-powered hardware development.
              </p>

              <p className="alpha-body-text">
                We're selecting a small group of electronics enthusiasts, makers, students, Arduino developers, ESP32 builders, and embedded engineers to test NovaBoard AI before public launch.
              </p>

              {/* Benefits Grid */}
              <div className="alpha-benefits-grid">
                <div className="benefit-card">
                  <div className="benefit-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="benefit-svg">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <path d="m9 11 2 2 4-4"/>
                    </svg>
                  </div>
                  <div>
                    <h4>Private Alpha Access</h4>
                    <p>Get early access before public release.</p>
                  </div>
                </div>

                <div className="benefit-card">
                  <div className="benefit-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="benefit-svg">
                      <line x1="6" x2="6" y1="3" y2="15"/>
                      <circle cx="18" cy="6" r="3"/>
                      <circle cx="6" cy="18" r="3"/>
                      <path d="M18 9a9 9 0 0 1-9 9"/>
                    </svg>
                  </div>
                  <div>
                    <h4>Influence Product Development</h4>
                    <p>Your feedback directly shapes the roadmap.</p>
                  </div>
                </div>

                <div className="benefit-card">
                  <div className="benefit-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="benefit-svg">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div>
                    <h4>Direct Feedback Channel</h4>
                    <p>Work closely with the NovaBoard AI team.</p>
                  </div>
                </div>

                <div className="benefit-card">
                  <div className="benefit-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="benefit-svg">
                      <line x1="7" x2="17" y1="17" y2="7"/>
                      <polyline points="7 7 17 7 17 17"/>
                    </svg>
                  </div>
                  <div>
                    <h4>Priority Launch Access</h4>
                    <p>Receive priority access at launch.</p>
                  </div>
                </div>

                <div className="benefit-card">
                  <div className="benefit-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="benefit-svg">
                      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
                    </svg>
                  </div>
                  <div>
                    <h4>Feature Requests</h4>
                    <p>Suggest features and workflows.</p>
                  </div>
                </div>

                <div className="benefit-card">
                  <div className="benefit-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="benefit-svg">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div>
                    <h4>Community Access</h4>
                    <p>Join our early builder community.</p>
                  </div>
                </div>
              </div>

              {/* Who Should Apply */}
              <div className="who-apply-section">
                <h3>Who Should Apply?</h3>
                <ul className="who-apply-list">
                  <li>Arduino developers</li>
                  <li>ESP32 developers</li>
                  <li>Robotics builders</li>
                  <li>Embedded engineers</li>
                  <li>Electronics students</li>
                  <li>IoT developers</li>
                  <li>Makers and hobbyists</li>
                  <li>Hardware startup founders</li>
                </ul>
              </div>
            </section>

            {/* Right Column: Application Form or Success Card */}
            <section className="alpha-form-column">
              {status?.type === 'success' ? (
                /* Success State Card */
                <div className="alpha-success-card">
                  <div className="checkmark-wrapper">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2 className="success-title">Application Received</h2>
                  <p className="success-desc">
                    Thank you for joining the WireUp Alpha Program. Your application has been received. The NovaBoard AI team will review your submission and contact selected testers via email.
                  </p>
                  <div className="success-actions">
                    <Link href="/" className="btn-success-primary">
                      Return to Home
                    </Link>
                    <a
                      href="https://www.instagram.com/wireups.dev"
                      target="_blank"
                      rel="noopener"
                      className="btn-success-secondary"
                    >
                      Follow @wireups.dev
                    </a>
                  </div>
                </div>
              ) : windowLoading ? (
                /* Loading window state */
                <div className="alpha-form-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Loading…</p>
                </div>
              ) : windowClosed ? (
                /* Applications Closed Card */
                <div className="alpha-success-card alpha-closed-card">
                  <div className="sad-face-wrapper">
                    <svg className="sad-face-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <defs>
                        <radialGradient id="faceGrad" cx="45%" cy="38%" r="65%">
                          <stop offset="0%" stopColor="#2d2550"/>
                          <stop offset="100%" stopColor="#0f0d1a"/>
                        </radialGradient>
                        <radialGradient id="eyeGrad" cx="40%" cy="35%" r="60%">
                          <stop offset="0%" stopColor="#ffffff"/>
                          <stop offset="100%" stopColor="#ddd6fe"/>
                        </radialGradient>
                        <radialGradient id="pupilGrad" cx="38%" cy="35%" r="55%">
                          <stop offset="0%" stopColor="#6d28d9"/>
                          <stop offset="100%" stopColor="#1e1b4b"/>
                        </radialGradient>
                        <filter id="faceShadow">
                          <feDropShadow dx="0" dy="4" stdDeviation="12" floodColor="#7c3aed" floodOpacity="0.3"/>
                        </filter>
                        {/* Clip paths to keep lids inside each eye shape */}
                        <clipPath id="leftEyeClip">
                          <ellipse cx="70" cy="90" rx="18" ry="20"/>
                        </clipPath>
                        <clipPath id="rightEyeClip">
                          <ellipse cx="130" cy="90" rx="18" ry="20"/>
                        </clipPath>
                      </defs>

                      {/* Ground shadow */}
                      <ellipse className="sad-shadow" cx="100" cy="188" rx="38" ry="6" fill="rgba(124,58,237,0.15)"/>

                      {/* Face */}
                      <circle cx="100" cy="96" r="72" fill="url(#faceGrad)" stroke="#7c3aed" strokeWidth="2.5" filter="url(#faceShadow)"/>

                      {/* Face shine */}
                      <ellipse cx="76" cy="68" rx="22" ry="14" fill="white" opacity="0.04"/>

                      {/* ── LEFT EYE ── */}
                      <ellipse cx="70" cy="90" rx="18" ry="20" fill="url(#eyeGrad)"/>
                      <ellipse className="sad-pupil-left" cx="70" cy="95" rx="11" ry="12" fill="url(#pupilGrad)"/>
                      <ellipse className="sad-pupil-left" cx="70" cy="96" rx="6" ry="6.5" fill="#0a0820"/>
                      <ellipse cx="76" cy="89" rx="3.5" ry="3" fill="white" opacity="0.85"/>
                      <ellipse cx="66" cy="94" rx="1.8" ry="1.5" fill="white" opacity="0.4"/>
                      {/* Eyelid: rect anchored to top of eye, scaleY from 0→1 covers eyeball */}
                      <rect x="52" y="70" width="36" height="22" fill="#231f3a">
                        <animateTransform
                          attributeName="transform"
                          type="scale"
                          additive="sum"
                          values="1,0;1,0;1,0;1,1;1,1;1,1;1,0;1,0"
                          keyTimes="0;0.46;0.58;0.68;0.72;0.82;0.94;1"
                          dur="6s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0 0 1 1;0.4 0 0.6 1;0.4 0 0.6 1;0 0 1 1;0 0 1 1;0.4 0 0.6 1;0 0 1 1"
                        />
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          additive="sum"
                          values="-70,-70;-70,-70;-70,-70;-70,-70;-70,-70;-70,-70;-70,-70;-70,-70"
                          dur="6s"
                          repeatCount="indefinite"
                        />
                      </rect>
                      {/* Crease line at bottom of lid */}
                      <path d="M52 92 Q70 85 88 92" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7">
                        <animateTransform
                          attributeName="transform"
                          type="scale"
                          additive="sum"
                          values="1,0;1,0;1,0;1,1;1,1;1,1;1,0;1,0"
                          keyTimes="0;0.46;0.58;0.68;0.72;0.82;0.94;1"
                          dur="6s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0 0 1 1;0.4 0 0.6 1;0.4 0 0.6 1;0 0 1 1;0 0 1 1;0.4 0 0.6 1;0 0 1 1"
                        />
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          additive="sum"
                          values="-70,-70;-70,-70;-70,-70;-70,-70;-70,-70;-70,-70;-70,-70;-70,-70"
                          dur="6s"
                          repeatCount="indefinite"
                        />
                      </path>
                      <path d="M54 108 Q70 116 86 108" stroke="rgba(167,139,250,0.2)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>

                      {/* ── RIGHT EYE ── (delayed 0.35s = begin="0.35s") */}
                      <ellipse cx="130" cy="90" rx="18" ry="20" fill="url(#eyeGrad)"/>
                      <ellipse className="sad-pupil-right" cx="130" cy="95" rx="11" ry="12" fill="url(#pupilGrad)"/>
                      <ellipse className="sad-pupil-right" cx="130" cy="96" rx="6" ry="6.5" fill="#0a0820"/>
                      <ellipse cx="136" cy="89" rx="3.5" ry="3" fill="white" opacity="0.85"/>
                      <ellipse cx="126" cy="94" rx="1.8" ry="1.5" fill="white" opacity="0.4"/>
                      <rect x="112" y="70" width="36" height="22" fill="#231f3a">
                        <animateTransform
                          attributeName="transform"
                          type="scale"
                          additive="sum"
                          values="1,0;1,0;1,0;1,1;1,1;1,1;1,0;1,0"
                          keyTimes="0;0.46;0.58;0.68;0.72;0.82;0.94;1"
                          dur="6s"
                          begin="0.35s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0 0 1 1;0.4 0 0.6 1;0.4 0 0.6 1;0 0 1 1;0 0 1 1;0.4 0 0.6 1;0 0 1 1"
                        />
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          additive="sum"
                          values="-130,-70;-130,-70;-130,-70;-130,-70;-130,-70;-130,-70;-130,-70;-130,-70"
                          dur="6s"
                          begin="0.35s"
                          repeatCount="indefinite"
                        />
                      </rect>
                      <path d="M112 92 Q130 85 148 92" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7">
                        <animateTransform
                          attributeName="transform"
                          type="scale"
                          additive="sum"
                          values="1,0;1,0;1,0;1,1;1,1;1,1;1,0;1,0"
                          keyTimes="0;0.46;0.58;0.68;0.72;0.82;0.94;1"
                          dur="6s"
                          begin="0.35s"
                          repeatCount="indefinite"
                          calcMode="spline"
                          keySplines="0 0 1 1;0.4 0 0.6 1;0.4 0 0.6 1;0 0 1 1;0 0 1 1;0.4 0 0.6 1;0 0 1 1"
                        />
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          additive="sum"
                          values="-130,-70;-130,-70;-130,-70;-130,-70;-130,-70;-130,-70;-130,-70;-130,-70"
                          dur="6s"
                          begin="0.35s"
                          repeatCount="indefinite"
                        />
                      </path>
                      <path d="M114 108 Q130 116 146 108" stroke="rgba(167,139,250,0.2)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>

                      {/* ── EYEBROWS — thick, clearly arched inward ── */}
                      {/* Left brow: right end dips DOWN toward nose */}
                      <path className="sad-brow-left"
                        d="M48 62 Q62 54 78 60"
                        stroke="#a78bfa" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
                      {/* Right brow: left end dips DOWN toward nose */}
                      <path className="sad-brow-right"
                        d="M122 60 Q138 54 152 62"
                        stroke="#a78bfa" strokeWidth="4.5" strokeLinecap="round" fill="none"/>

                      {/* ── MOUTH — wide, deep frown ── */}
                      <path className="sad-mouth"
                        d="M72 148 Q100 132 128 148"
                        stroke="#a78bfa" strokeWidth="4" strokeLinecap="round" fill="none"/>

                      {/* ── TEARS ── */}
                      {/* Left tear — drops from bottom of left eye */}
                      <path className="sad-tear-left"
                        d="M67 110 C65 118 62 124 65 130 C68 136 74 130 71 124 C68 118 67 110 67 110Z"
                        fill="#c4b5fd" opacity="0"/>
                      {/* Right tear */}
                      <path className="sad-tear-right"
                        d="M127 110 C125 118 122 124 125 130 C128 136 134 130 131 124 C128 118 127 110 127 110Z"
                        fill="#c4b5fd" opacity="0"/>

                    </svg>
                  </div>
                  <h2 className="success-title">Applications Closed</h2>
                  <p className="success-desc">{windowClosedMessage}</p>
                  {windowDeadline && new Date() > new Date(windowDeadline) && (
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', marginTop: '8px' }}>
                      The application window closed on {new Date(windowDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
                    </p>
                  )}
                  <div className="success-actions">
                    <Link href="/" className="btn-success-primary">
                      Return to Home
                    </Link>
                    <a
                      href="https://www.instagram.com/wireups.dev"
                      target="_blank"
                      rel="noopener"
                      className="btn-success-secondary"
                    >
                      Follow @wireups.dev for updates
                    </a>
                  </div>
                </div>
              ) : (
                /* Form Card */
                <div className="alpha-form-card" id="waitlist">
                  <div className="alpha-form-header">
                    <h1>Join the WireUp Alpha Program</h1>
                    <p>Be among the first users helping shape the future of AI-powered hardware development.</p>

                    {/* Countdown timer — only shown when a deadline is set */}
                    {countdown && (
                      <div className="alpha-countdown">
                        <span className="alpha-countdown-label">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                          Applications close in
                        </span>
                        <div className="alpha-countdown-tiles">
                          <div className="countdown-tile">
                            <span className="countdown-num">{String(countdown.days).padStart(2, '0')}</span>
                            <span className="countdown-unit">days</span>
                          </div>
                          <span className="countdown-sep">:</span>
                          <div className="countdown-tile">
                            <span className="countdown-num">{String(countdown.hours).padStart(2, '0')}</span>
                            <span className="countdown-unit">hrs</span>
                          </div>
                          <span className="countdown-sep">:</span>
                          <div className="countdown-tile">
                            <span className="countdown-num">{String(countdown.minutes).padStart(2, '0')}</span>
                            <span className="countdown-unit">min</span>
                          </div>
                          <span className="countdown-sep">:</span>
                          <div className="countdown-tile">
                            <span className="countdown-num">{String(countdown.seconds).padStart(2, '0')}</span>
                            <span className="countdown-unit">sec</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <form className="alpha-form" onSubmit={handleSubmit}>

                    {/* Full Name */}
                    <div className="beta-field-group">
                      <label className="beta-field-label" htmlFor="fullName">
                        Full Name *
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="form-control"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Email Address */}
                    <div className="beta-field-group">
                      <label className="beta-field-label" htmlFor="email">
                        Email Address *
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="form-control"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Country */}
                    <div className="beta-field-group">
                      <label className="beta-field-label" htmlFor="country">
                        Country *
                      </label>
                      <input
                        id="country"
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="United States"
                        className="form-control"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Student Dropdown */}
                    <div className="beta-field-group">
                      <label className="beta-field-label" htmlFor="student">
                        Are you a student? *
                      </label>
                      <select
                        id="student"
                        required
                        value={isStudent}
                        onChange={(e) => setIsStudent(e.target.value)}
                        className="form-control"
                        disabled={isSubmitting}
                      >
                        <option value="" disabled>Select option</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    {/* Experience Level Dropdown */}
                    <div className="beta-field-group">
                      <label className="beta-field-label" htmlFor="experience">
                        Experience Level *
                      </label>
                      <select
                        id="experience"
                        required
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                        className="form-control"
                        disabled={isSubmitting}
                      >
                        <option value="" disabled>Select option</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="professional">Professional</option>
                      </select>
                    </div>

                    {/* Projects Completed Dropdown */}
                    <div className="beta-field-group">
                      <label className="beta-field-label" htmlFor="projectsCompleted">
                        How many hardware projects have you completed? *
                      </label>
                      <select
                        id="projectsCompleted"
                        required
                        value={projectsCompleted}
                        onChange={(e) => setProjectsCompleted(e.target.value)}
                        className="form-control"
                        disabled={isSubmitting}
                      >
                        <option value="" disabled>Select option</option>
                        <option value="0-2">0-2</option>
                        <option value="3-5">3-5</option>
                        <option value="6-10">6-10</option>
                        <option value="10+">10+</option>
                      </select>
                    </div>

                    {/* Best Project Textarea */}
                    <div className="beta-field-group">
                      <label className="beta-field-label" htmlFor="bestProject">
                        Tell us about your best project *
                      </label>
                      <textarea
                        id="bestProject"
                        required
                        value={bestProject}
                        onChange={(e) => setBestProject(e.target.value)}
                        placeholder="Describe your favorite project, the microcontrollers used, and the problems you solved."
                        className="form-control"
                        rows={4}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Use Case Textarea */}
                    <div className="beta-field-group">
                      <label className="beta-field-label" htmlFor="useCase">
                        How do you plan to use WireUp? *
                      </label>
                      <textarea
                        id="useCase"
                        required
                        value={useCase}
                        onChange={(e) => setUseCase(e.target.value)}
                        placeholder="Tell us about the projects you want to build..."
                        className="form-control"
                        rows={4}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Project Links */}
                    <div className="beta-field-group">
                      <label className="beta-field-label" htmlFor="projectLinks">
                        Project Links (Optional)
                      </label>
                      <input
                        id="projectLinks"
                        type="text"
                        value={projectLinks}
                        onChange={(e) => setProjectLinks(e.target.value)}
                        placeholder="GitHub, LinkedIn, Hackster, YouTube, Instructables, Portfolio, etc."
                        className="form-control"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* ── Project Media Upload ─────────────────── */}
                    <div className="beta-field-group">
                      <label className="beta-field-label">
                        Project Images &amp; Videos (Optional)
                      </label>
                      <p className="upload-description">
                        Upload images or videos of projects you have built. This helps us better evaluate applicants for the NovaBoard AI Alpha Program.
                      </p>

                      {isCloudinaryConfigured === false && (
                        <div className="beta-message beta-message-error" style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255, 158, 177, 0.1)', borderRadius: '8px', fontSize: '0.8rem' }}>
                          <strong>Note:</strong> Cloudinary is not configured. Uploads will fail. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.
                        </div>
                      )}

                      {/* Drag-and-drop zone */}
                      <div
                        id="media-drop-zone"
                        className={`drag-drop-zone${isDragOver ? ' drag-active' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        aria-label="Upload project images and videos"
                        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                          disabled={isSubmitting}
                        />
                        <div className="upload-placeholder">
                          <div className="upload-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="17 8 12 3 7 8"/>
                              <line x1="12" x2="12" y1="3" y2="15"/>
                            </svg>
                          </div>
                          <p className="upload-title">Drag &amp; drop files or click to browse</p>
                          <p className="upload-subtitle">
                            Images: JPG, PNG, WEBP · up to 10MB each · max 5
                            <br />
                            Video: MP4, MOV · up to 100MB · max 1
                          </p>
                        </div>
                      </div>

                      {/* Per-file upload list */}
                      {mediaFiles.length > 0 && (
                        <div className="upload-file-list">
                          {mediaFiles.map((item) => (
                            <div key={item.id} className={`upload-file-item upload-state-${item.uploadState}`}>
                              {/* Preview */}
                              <div className="upload-preview-cell">
                                {item.mediaType === 'image' ? (
                                  <img
                                    src={item.previewUrl}
                                    alt="preview"
                                    className="upload-thumb"
                                  />
                                ) : (
                                  <video
                                    src={item.previewUrl}
                                    className="upload-thumb upload-thumb-video"
                                    muted
                                    preload="metadata"
                                  />
                                )}
                                {item.mediaType === 'video' && (
                                  <span className="upload-video-badge">VIDEO</span>
                                )}
                              </div>

                              {/* Info + progress */}
                              <div className="upload-file-info">
                                <span className="upload-file-name">{item.file.name}</span>
                                <span className="upload-file-size">
                                  {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                                </span>

                                {/* Progress bar */}
                                <div className="upload-progress-track">
                                  <div
                                    className={`upload-progress-fill upload-progress-${item.uploadState}`}
                                    style={{ width: `${item.progress}%` }}
                                  />
                                </div>

                                {/* Status label */}
                                <span className={`upload-status-label upload-status-${item.uploadState}`}>
                                  {item.uploadState === 'idle' && 'Queued'}
                                  {item.uploadState === 'uploading' && `Uploading… ${item.progress}%`}
                                  {item.uploadState === 'done' && '✓ Uploaded'}
                                  {item.uploadState === 'error' && `✗ ${item.errorMessage ?? 'Failed'}`}
                                </span>
                              </div>

                              {/* Remove button */}
                              <button
                                type="button"
                                className="upload-remove-btn"
                                onClick={() => removeMedia(item.id)}
                                aria-label={`Remove ${item.file.name}`}
                                disabled={item.uploadState === 'uploading'}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" x2="6" y1="6" y2="18"/>
                                  <line x1="6" x2="18" y1="6" y2="18"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Willing to Provide Feedback Radio Group */}
                    <div className="beta-field-group">
                      <label className="beta-field-label">
                        Are you willing to provide feedback during alpha testing? *
                      </label>
                      <div className="radio-options-group">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="willingFeedback"
                            value="yes"
                            checked={willingFeedback === 'yes'}
                            onChange={(e) => setWillingFeedback(e.target.value)}
                            required
                            disabled={isSubmitting}
                          />
                          <span>Yes</span>
                        </label>
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="willingFeedback"
                            value="no"
                            checked={willingFeedback === 'no'}
                            onChange={(e) => setWillingFeedback(e.target.value)}
                            required
                            disabled={isSubmitting}
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="beta-submit"
                      disabled={isSubmitting || anyUploading}
                    >
                      {isSubmitting ? 'Joining…' : anyUploading ? 'Waiting for uploads…' : 'Join WireUp Alpha'}
                    </button>

                    {/* Status Message */}
                    {status && (
                      <p className={`beta-message beta-message-${status.type}`}>
                        {status.message}
                      </p>
                    )}
                  </form>
                </div>
              )}
            </section>

          </div>
        </main>
      </div>
    </>
  )
}
