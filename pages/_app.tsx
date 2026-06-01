import type { AppProps } from 'next/app'
import Head from 'next/head'
import { Inter, Instrument_Serif } from 'next/font/google'
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

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Nova AI</title>
        <meta name="description" content="The AI workspace for hardware engineers." />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>
      <div className={`${inter.variable} ${instrumentSerif.variable}`}>
        <Component {...pageProps} />
      </div>
    </>
  )
}
