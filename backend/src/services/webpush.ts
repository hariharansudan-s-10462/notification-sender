import webpush from 'web-push';

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com';

if (!publicKey || !privateKey) {
  throw new Error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set as environment variables');
}

webpush.setVapidDetails(subject, publicKey, privateKey);

export default webpush;
