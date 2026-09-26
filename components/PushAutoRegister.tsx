'use client';

import { useEffect } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushAutoRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const subscribeDevice = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error('VAPID public key not found');
          return;
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            deviceLabel: navigator.userAgent
          })
        });
      } catch (error) {
        console.error('Push subscription failed:', error);
      }
    };

    if (Notification.permission === 'granted') {
      subscribeDevice();
    } else if (Notification.permission === 'default') {
      const requestAndSubscribe = async () => {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          subscribeDevice();
        }
      };
      
      window.addEventListener('click', requestAndSubscribe, { once: true });
      window.addEventListener('touchstart', requestAndSubscribe, { once: true });
    }
  }, []);

  return null;
}
