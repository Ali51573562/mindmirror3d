import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

const META_PIXEL_ID = '1425217956175973';

/*
  Meta Pixel is permitted ONLY on these routes.

  IMPORTANT:
  Any route not listed here is treated as Meta-disabled.
*/
const ALLOWED_META_ROUTES = [
  '/',
  '/contact',
];

function normalizePath(url) {
  return url.split('?')[0].split('#')[0];
}

function isMetaAllowed(url) {
  const pathname = normalizePath(url);
  return ALLOWED_META_ROUTES.includes(pathname);
}

export default function MetaPixel() {
  const router = useRouter();

  const initialized = useRef(false);
  const lastTrackedPath = useRef(null);

  useEffect(() => {
    function initializePixel() {
      if (initialized.current) return;

      if (!window.fbq) {
        !(function (f, b, e, v, n, t, s) {
          if (f.fbq) return;

          n = f.fbq = function () {
            n.callMethod
              ? n.callMethod.apply(n, arguments)
              : n.queue.push(arguments);
          };

          if (!f._fbq) {
            f._fbq = n;
          }

          n.push = n;
          n.loaded = true;
          n.version = '2.0';
          n.queue = [];

          t = b.createElement(e);
          t.async = true;
          t.src = v;
          t.id = 'meta-pixel-script';

          s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        })(
          window,
          document,
          'script',
          'https://connect.facebook.net/en_US/fbevents.js'
        );
      }

      /*
        Initialize our Pixel.
      */
      window.fbq('init', META_PIXEL_ID);

      /*
        Disable Meta automatic configuration/events.

        We explicitly do NOT want Meta automatically creating events
        such as SubscribedButtonClick from button interactions.
      */
      window.fbq('set', 'autoConfig', false, META_PIXEL_ID);

      initialized.current = true;
    }

    function trackPageView(url) {
      const pathname = normalizePath(url);

      // Never initialize or track Meta on a non-approved route.
      if (!isMetaAllowed(pathname)) {
        return;
      }

      initializePixel();

      if (!window.fbq) {
        return;
      }

      // Prevent duplicate PageView events for the same route.
      if (lastTrackedPath.current === pathname) {
        return;
      }

      window.fbq('track', 'PageView');

      lastTrackedPath.current = pathname;
    }

    /*
      PRIVACY BOUNDARY

      If Meta is already loaded on an approved marketing page and
      the user navigates to ANY route that is not Meta-approved,
      force a full browser navigation.

      Example:

          /  ->  /auth

      Instead of keeping the same Next.js browser document alive,
      the browser loads /auth as a completely new document.

      On that new document this component sees that /auth is not
      approved and therefore does NOT initialize Meta.

      This applies automatically to:

          /auth
          /profile
          /test-bigfive
          /test-basicneeds
          /admin
          /results
          /booklet

      as well as any future route that we have not explicitly
      approved.
    */
    function handleRouteChangeStart(url) {
      if (
        initialized.current &&
        !isMetaAllowed(url)
      ) {
        window.location.assign(url);
      }
    }

    function handleRouteChangeComplete(url) {
      trackPageView(url);
    }

    // Handle initial page load.
    trackPageView(router.asPath);

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);

  return null;
}