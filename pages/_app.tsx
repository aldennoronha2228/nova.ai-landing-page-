import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../src/index.css'
import '../src/admin/admin.css'

const siteUrlBase =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://novaai-eight.vercel.app'
const siteUrl = siteUrlBase.replace(/\/$/, '')
const shareImage = `${siteUrl}/nova-app-icon.png?v=7`
const appIconUrl = '/nova-app-icon.png?v=1'
const pageUrl = siteUrl
const shareTitle = 'WireUp | AI Copilot for Hardware'
const shareDescription = 'WireUp by NovaBoard AI helps makers, students, hobbyists, and engineers build electronics projects faster using AI-powered circuit generation, component recommendations, code generation, and debugging assistance.'
const ogDescription = 'The AI Copilot for Hardware Development.'
const twitterDescription = 'Generate circuits, firmware, documentation, and hardware systems using AI.'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Absolute Top Priority for WhatsApp/Social */}
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:secure_url" content={shareImage} />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        
        {/* WhatsApp / Schema.org Fallbacks */}
        <meta itemProp="name" content={shareTitle} />
        <meta itemProp="description" content={ogDescription} />
        <meta itemProp="image" content={shareImage} />

        <title>{shareTitle}</title>
        <meta name="description" content={shareDescription} />
        <meta property="og:site_name" content="WireUp" />
        <meta property="og:locale" content="en_US" />
        
        {pageUrl ? <link rel="canonical" href={pageUrl} /> : null}
        <link rel="image_src" href={shareImage} />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={twitterDescription} />
        <meta name="twitter:image" content={shareImage} />
        
        <link rel="icon" type="image/png" href={appIconUrl} />
        <link rel="shortcut icon" href={appIconUrl} />
        <link rel="apple-touch-icon" href={appIconUrl} />
      </Head>
      <div className="app-shell">
        <Component {...pageProps} />
      </div>
    </>
  )
}
