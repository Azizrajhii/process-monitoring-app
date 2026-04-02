const waitFor = async (check: () => boolean, timeoutMs = 8000, stepMs = 100) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, stepMs));
  }
  throw new Error('SDK loading timeout');
};

const loadScriptOnce = (id: string, src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;

    if (existing) {
      if (existing.getAttribute('data-loaded') === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${id}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.setAttribute('data-loaded', 'true');
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${id}`));
    document.head.appendChild(script);
  });

export const ensureGoogleSdk = async () => {
  if ((window as any).google?.accounts?.id) return;

  await loadScriptOnce('google-gsi-sdk', 'https://accounts.google.com/gsi/client');
  await waitFor(() => Boolean((window as any).google?.accounts?.id));
};
