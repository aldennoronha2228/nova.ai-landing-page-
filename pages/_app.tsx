import type { AppProps } from 'next/app'
import Head from 'next/head'
import { Inter, Instrument_Serif, Playfair_Display } from 'next/font/google'
import '../src/index.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  weight: ['400'],
  style: ['normal', 'italic'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400','600','700'],
})

const siteUrlBase =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
  'https://novaai-eight.vercel.app'
const siteUrl = siteUrlBase.replace(/\/$/, '')
const shareImage = `${siteUrl}/og-image.png`
const faviconUrl = `${siteUrl}/favicon.ico`
const faviconPngUrl = `${siteUrl}/favicon.png`
const appleTouchIconUrl = `${siteUrl}/apple-touch-icon.png`
const pageUrl = siteUrl
const shareTitle = 'Nova AI — AI-Powered Hardware Development'
const shareDescription = 'Join the Nova AI Alpha Waitlist and help shape the future of AI-powered hardware engineering.'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>{shareTitle}</title>
        <meta name="description" content={shareDescription} />
        {pageUrl ? <link rel="canonical" href={pageUrl} /> : null}
        {pageUrl ? <meta property="og:url" content={pageUrl} /> : null}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Nova AI" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:secure_url" content={shareImage} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Nova AI branding image" />
        <link rel="image_src" href={shareImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareDescription} />
        <meta name="twitter:image" content={shareImage} />
        <meta name="twitter:image:alt" content="Nova AI branding image" />
        <link rel="icon" type="image/x-icon" href={faviconUrl} />
        <link rel="icon" type="image/png" href={faviconPngUrl} />
        <link rel="apple-touch-icon" href={appleTouchIconUrl} />
      </Head>
      <div className={`${inter.variable} ${instrumentSerif.variable} ${playfair.variable}`}>
        <Component {...pageProps} />
      </div>
    </>
  )
}
