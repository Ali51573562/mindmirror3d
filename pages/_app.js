import '@/styles/globals.css'; // or './styles/globals.css' if the alias fails

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
