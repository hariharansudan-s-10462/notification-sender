import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAuthUrls } from '../services/auth';
import styles from './auth.module.css';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  const handleSignIn = async () => {
    try {
      const { loginUrl } = await getAuthUrls();
      window.location.href = loginUrl;
    } catch {
      alert('Could not get sign-in URL. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Notification Sender</h1>
        <p className={styles.subtitle}>Sign in to send push notifications</p>
        <button className={styles.primaryBtn} onClick={handleSignIn}>
          Sign in with Catalyst
        </button>
        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className={styles.link}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
