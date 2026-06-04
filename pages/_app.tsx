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
const shareImage = `${siteUrl}/nova-logo-n.png`
const pageUrl = siteUrl

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>NOVA AI — Private Alpha Waitlist</title>
        <meta name="description" content="NOVA AI is currently in private Alpha. Apply to join the Alpha waitlist for early tester consideration before public launch." />
        {pageUrl ? <meta property="og:url" content={pageUrl} /> : null}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="NOVA AI — Private Alpha Waitlist" />
        <meta property="og:description" content="NOVA AI is currently in private Alpha. Apply to join the Alpha waitlist for early tester consideration before public launch." />
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:secure_url" content={shareImage} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="368" />
        <meta property="og:image:alt" content="Nova AI logo" />
        <link rel="image_src" href={shareImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={shareImage} />
        <meta name="twitter:image:src" content={shareImage} />
        <meta name="twitter:image:alt" content="Nova AI logo" />
        <meta name="twitter:title" content="NOVA AI — Private Alpha Waitlist" />
        <meta name="twitter:description" content="NOVA AI is currently in private Alpha. Apply to join the Alpha waitlist for early tester consideration before public launch." />
        <meta name="twitter:image" content={shareImage} />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>
      <div className={`${inter.variable} ${instrumentSerif.variable} ${playfair.variable}`}>
        <Component {...pageProps} />
      </div>
    </>
  )
}
