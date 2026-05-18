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

let initializedClientId: string | null = null;
let pendingCredentialResolver: ((credential: string) => void) | null = null;
let pendingCredentialRejecter: ((error: Error) => void) | null = null;

const initializeGoogleOnce = (clientId: string) => {
  const google = (window as any).google;

  if (initializedClientId === clientId) return;

  google.accounts.id.initialize({
    client_id: clientId,
    use_fedcm_for_prompt: false,
    callback: (response: any) => {
      const credential = response?.credential;

      if (credential && pendingCredentialResolver) {
        pendingCredentialResolver(credential);
      } else if (pendingCredentialRejecter) {
        pendingCredentialRejecter(new Error('Aucun ID token Google recu.'));
      }

      pendingCredentialResolver = null;
      pendingCredentialRejecter = null;
    },
  });

  initializedClientId = clientId;
};

const getOrCreateHiddenGoogleButtonHost = () => {
  let host = document.getElementById('google-signin-hidden-host');

  if (!host) {
    host = document.createElement('div');
    host.id = 'google-signin-hidden-host';
    host.style.cssText =
      'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none;';
    document.body.appendChild(host);
  }

  host.innerHTML = '';
  return host;
};

const clickRenderedGoogleButton = (host: HTMLElement) => {
  const button =
    host.querySelector<HTMLElement>('[role="button"]') ??
    host.querySelector<HTMLElement>('div[tabindex="0"]');

  if (!button) {
    throw new Error('Bouton Google introuvable. Rechargez la page.');
  }

  button.click();
};

/** Opens Google's account picker (popup). Works when FedCM / One Tap is blocked. */
export const requestGoogleCredential = async (clientId: string, timeoutMs = 60000) => {
  await ensureGoogleSdk();
  initializeGoogleOnce(clientId);

  const google = (window as any).google;

  return new Promise<string>((resolve, reject) => {
    pendingCredentialResolver = resolve;
    pendingCredentialRejecter = reject;

    const host = getOrCreateHiddenGoogleButtonHost();

    google.accounts.id.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
    });

    window.setTimeout(() => {
      try {
        clickRenderedGoogleButton(host);
      } catch (error) {
        if (pendingCredentialResolver === resolve) {
          pendingCredentialResolver = null;
          pendingCredentialRejecter = null;
          reject(error instanceof Error ? error : new Error('Google Sign-In indisponible.'));
        }
      }
    }, 0);

    window.setTimeout(() => {
      if (pendingCredentialResolver === resolve) {
        pendingCredentialResolver = null;
        pendingCredentialRejecter = null;
        reject(new Error('Google Sign-In annule ou expire (timeout).'));
      }
    }, timeoutMs);
  });
};
