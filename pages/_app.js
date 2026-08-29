import '@/styles/globals.css';
import MetaPixel from '../components/MetaPixel';

export default function App({ Component, pageProps }) {
  return (
    <>
      <MetaPixel />
      <Component {...pageProps} />
    </>
  );
}