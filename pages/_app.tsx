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

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Nova AI - AI Hardware Development Platform | Alpha Access</title>
        <meta name="description" content="Join the Nova AI Alpha and help shape the future of AI-powered hardware engineering." />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>
      <div className={`${inter.variable} ${instrumentSerif.variable} ${playfair.variable}`}>
        <Component {...pageProps} />
      </div>
    </>
  )
}
