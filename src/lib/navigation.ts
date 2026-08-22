export function goBackOrHome(router: { canGoBack: () => boolean; back: () => void; replace: (href: '/') => void }) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/');
}
