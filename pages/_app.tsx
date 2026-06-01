import type { AppProps } from 'next/app'
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
    <div className={`${inter.variable} ${instrumentSerif.variable}`}>
      <Component {...pageProps} />
    </div>
  )
}
