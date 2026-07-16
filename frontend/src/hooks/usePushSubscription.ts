import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const array = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i);
  return array;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function usePushSubscription(userEmail: string) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setLoading(false);
      return;
    }
    navigator.serviceWorker.register('/sw-push.js')
      .then((reg) => {
        setRegistration(reg);
        return reg.pushManager.getSubscription();
      })
      .then((sub) => setIsSubscribed(sub !== null))
      .catch(() => setIsSubscribed(false))
      .finally(() => setLoading(false));
  }, []);

  const subscribe = async () => {
    if (!registration) return;
    setLoading(true);
    try {
      const { publicKey } = await apiFetch<{ publicKey: string }>('/vapid-public-key');
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await apiFetch('/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          email: userEmail,
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey('p256dh')!),
            auth: arrayBufferToBase64(sub.getKey('auth')!),
          },
        }),
      });
      setIsSubscribed(true);
    } catch (err) {
      console.error('Subscribe failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!registration) return;
    setLoading(true);
    try {
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await apiFetch('/subscriptions', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('Unsubscribe failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return { isSubscribed, loading, subscribe, unsubscribe };
}
