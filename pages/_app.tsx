import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../src/index.css'
import '../src/admin/admin.css'

const siteUrlBase =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://novaboard-ai.vercel.app'
const siteUrl = siteUrlBase.replace(/\/$/, '')
const shareImage = `${siteUrl}/og-image-small.png`
const appIconUrl = '/nova-app-icon.png?v=1'
const pageUrl = siteUrl
const shareTitle = 'NovaBoard AI — Cursor for Hardware'
const shareDescription = 'NovaBoard AI is an AI-powered hardware development workspace for electronics engineers, makers, students, and embedded developers. Design circuits, generate firmware, and build complete hardware projects faster.'
const ogDescription = 'Build electronics projects with AI.'
const twitterDescription = 'Generate circuits, firmware, documentation, and hardware systems using AI.'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>{shareTitle}</title>
        <meta name="description" content={shareDescription} />
        {pageUrl ? <link rel="canonical" href={pageUrl} /> : null}
        {pageUrl ? <meta property="og:url" content={pageUrl} /> : null}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="NovaBoard AI" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:secure_url" content={shareImage} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:image:alt" content="NovaBoard AI logo on a dark preview background" />
        <link rel="image_src" href={shareImage} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={twitterDescription} />
        <meta name="twitter:image" content={shareImage} />
        <meta name="twitter:image:alt" content="NovaBoard AI logo" />
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
