import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePushSubscription } from '../hooks/usePushSubscription';
import { apiFetch } from '../services/api';
import styles from './home.module.css';

interface SendResult {
  sent: number;
  failed: number;
}

export default function Home() {
  const { user } = useAuth();
  const { isSubscribed, loading: subLoading, subscribe, unsubscribe } = usePushSubscription(user!.email_id);

  const [recipientEmail, setRecipientEmail] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState('');

  const handleLogout = () => {
    window.location.href = '/__catalyst/auth/logout';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    setError('');
    try {
      const res = await apiFetch<SendResult>('/send-notification', {
        method: 'POST',
        body: JSON.stringify({ recipientEmail, title, body }),
      });
      setResult(res);
      setRecipientEmail('');
      setTitle('');
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <span className={styles.brand}>Notification Sender</span>
        <div className={styles.headerRight}>
          <span className={styles.userEmail}>{user!.email_id}</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Push Subscription</h2>
          <p className={styles.sectionDesc}>
            {isSubscribed
              ? 'This device is subscribed and will receive push notifications.'
              : 'Subscribe this device to receive push notifications sent to your email.'}
          </p>
          <button
            className={isSubscribed ? styles.dangerBtn : styles.primaryBtn}
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={subLoading}
          >
            {subLoading ? 'Loading…' : isSubscribed ? 'Unsubscribe this device' : 'Subscribe this device'}
          </button>
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Send Notification</h2>
          <form onSubmit={handleSend} className={styles.form}>
            <label className={styles.label}>
              Recipient Email
              <input
                className={styles.input}
                type="email"
                required
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Title
              <input
                className={styles.input}
                type="text"
                required
                maxLength={100}
                placeholder="Notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Message
              <textarea
                className={styles.textarea}
                required
                maxLength={500}
                placeholder="Notification body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
              />
            </label>
            <button className={styles.primaryBtn} type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send Notification'}
            </button>
          </form>

          {result && (
            <div className={styles.resultSuccess}>
              Sent to {result.sent} device(s)
              {result.failed > 0 ? `, ${result.failed} failed` : ''}.
            </div>
          )}
          {error && <div className={styles.resultError}>{error}</div>}
        </section>
      </main>
    </div>
  );
}
