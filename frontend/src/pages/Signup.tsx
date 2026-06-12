import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAuthUrls } from '../services/auth';
import styles from './auth.module.css';

export default function Signup() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  const handleSignUp = async () => {
    try {
      const { signupUrl } = await getAuthUrls();
      window.location.href = signupUrl;
    } catch {
      alert('Could not get sign-up URL. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Register to use Notification Sender</p>
        <button className={styles.primaryBtn} onClick={handleSignUp}>
          Sign up with Catalyst
        </button>
        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
