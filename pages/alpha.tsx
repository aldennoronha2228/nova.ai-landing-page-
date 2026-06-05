import { useState, useRef, type DragEvent, type FormEvent, type ChangeEvent } from 'react'
import Head from 'next/head'
import Link from 'next/link'

type FormStatus = {
  type: 'success' | 'error'
  message: string
} | null

export default function AlphaApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<FormStatus>(null)
  
  // Form values
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
  
  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (isUploading) return
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await uploadFiles(files)
    }
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length > 0) {
      await uploadFiles(files)
    }
  }

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true)
    setStatus(null)

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setStatus({ type: 'error', message: 'Only image files are allowed.' })
        continue
      }

      // Max size: 3MB
      if (file.size > 3 * 1024 * 1024) {
        setStatus({ type: 'error', message: 'Images must be under 3MB.' })
        continue
      }

      try {
        const base64 = await toBase64(file)
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: file.name,
            type: file.type,
            base64,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || 'Image upload failed.')
        }

        setUploadedImages((prev) => [...prev, data.url])
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('File upload failed:', err)
        setStatus({
          type: 'error',
          message: err instanceof Error ? err.message : 'An error occurred during file upload.',
        })
      }
    }

    setIsUploading(false)
  }

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })

  const removeImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    // Client-side validations
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

    setIsSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch('/api/alpha-apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          country,
          student: isStudent,
          experienceLevel,
          projectsCompleted,
          bestProject,
          useCase,
          projectLinks,
          projectImages: uploadedImages,
          willingFeedback: willingFeedback === 'yes',
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit application.')
      }

      setStatus({
        type: 'success',
        message: data.message || 'Application Received',
      })
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
                  <div className="benefit-icon">🔒</div>
                  <div>
                    <h4>Private Alpha Access</h4>
                    <p>Get early access before public release.</p>
                  </div>
                </div>

                <div className="benefit-card">
                  <div className="benefit-icon">🛠️</div>
                  <div>
                    <h4>Influence Product Development</h4>
                    <p>Your feedback directly shapes the roadmap.</p>
                  </div>
                </div>

                <div className="benefit-card">
                  <div className="benefit-icon">💬</div>
                  <div>
                    <h4>Direct Feedback Channel</h4>
                    <p>Work closely with the NovaBoard AI team.</p>
                  </div>
                </div>

                <div className="benefit-card">
                  <div className="benefit-icon">🚀</div>
                  <div>
                    <h4>Priority Launch Access</h4>
                    <p>Receive priority access at launch.</p>
                  </div>
                </div>

                <div className="benefit-card">
                  <div className="benefit-icon">💡</div>
                  <div>
                    <h4>Feature Requests</h4>
                    <p>Suggest features and workflows.</p>
                  </div>
                </div>

                <div className="benefit-card">
                  <div className="benefit-icon">👥</div>
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
                    <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                      <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                      <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                    </svg>
                  </div>
                  <h2>Application Received</h2>
                  <p>
                    Thank you for applying to the NovaBoard AI Alpha Program. Our team will review your application and contact selected testers via email.
                  </p>
                  <div className="success-actions">
                    <Link href="/" className="success-btn-primary">
                      Return to Home
                    </Link>
                    <a
                      href="https://twitter.com/novaboardai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="success-btn-secondary"
                    >
                      Follow NovaBoard AI
                    </a>
                  </div>
                </div>
              ) : (
                /* Form Card */
                <div className="alpha-form-card">
                  <div className="form-card-header">
                    <h2>Apply for Alpha Access</h2>
                    <p>
                      We're selecting highly engaged builders and developers who can actively test NovaBoard AI and provide feedback.
                    </p>
                  </div>

                  <form className="alpha-apply-form" onSubmit={handleSubmit}>
                    
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
                        What do you plan to use NovaBoard AI for? *
                      </label>
                      <textarea
                        id="useCase"
                        required
                        value={useCase}
                        onChange={(e) => setUseCase(e.target.value)}
                        placeholder="Describe the hardware layouts, simulations, or edge pipelines you want to build."
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

                    {/* Upload Project Images Drag and Drop */}
                    <div className="beta-field-group">
                      <label className="beta-field-label">
                        Upload Project Images (Optional)
                      </label>
                      <div
                        className={`drag-drop-zone ${isUploading ? 'uploading' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                          disabled={isUploading || isSubmitting}
                        />
                        {isUploading ? (
                          <div className="upload-loader">
                            <span className="spinner" />
                            <p>Uploading images...</p>
                          </div>
                        ) : (
                          <div className="upload-placeholder">
                            <div className="upload-icon">📷</div>
                            <p className="upload-title">Drag & drop files or click to browse</p>
                            <p className="upload-subtitle">Supports JPG, PNG up to 3MB</p>
                          </div>
                        )}
                      </div>

                      {/* Uploaded Previews */}
                      {uploadedImages.length > 0 && (
                        <div className="upload-previews">
                          {uploadedImages.map((url, idx) => (
                            <div key={idx} className="preview-thumbnail">
                              <img src={url} alt={`Upload ${idx + 1}`} />
                              <button
                                type="button"
                                className="remove-preview-btn"
                                onClick={() => removeImage(idx)}
                                aria-label="Remove image"
                              >
                                &times;
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
                      disabled={isSubmitting || isUploading}
                    >
                      {isSubmitting ? 'Submitting...' : 'Apply for Alpha Access'}
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
