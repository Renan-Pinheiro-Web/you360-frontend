// pages/_app.js
// YOU360 — sem Supabase, sem providers externos
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
