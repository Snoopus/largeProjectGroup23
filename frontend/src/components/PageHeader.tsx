import styles from '../css/PageHeader.module.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildPath } from '../services/buildPath';

function PageHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  // Check if user is logged in on component mount
  useEffect(() => {
    async function initializeUser() {
      // Get JWT token from localStorage
      const jwt = localStorage.getItem('jwt_token');
      
      if (!jwt) {
        setIsLoggedIn(false);
        return;
      }

      try {
        // Fetch decoded data from API
        const jwtresponse = await fetch(buildPath('api/checkjwt'), {
          method: 'POST',
          body: JSON.stringify({
            possibleJWT: jwt
          }),
          headers: { 'Content-Type': 'application/json' }
        });
        const decodedjwt = await jwtresponse.json();

        if (decodedjwt.error) {
          localStorage.removeItem('jwt_token');
          window.location.href = '/';
          return;
        }

        const user = decodedjwt.contents;
        setIsLoggedIn(true);
        setUserName(user.firstName || 'User');
        setUserRole(user.role || '');
      } catch (error) {
        setIsLoggedIn(false);
        console.error('JWT check error:', error);
      }
    }

    initializeUser();
  }, []);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <img 
          src="/logo.png" 
          alt="Logo" 
          className={styles.logo}
        />
        <h1 className={styles.title}>
          bHere@UCF
        </h1>
        
        <nav className={styles.nav}>
          {!isLoggedIn ? (
            // Show when NOT logged in
            <>
              <a href="/" className={styles.navButton}>Login</a>
              <a href="/register" className={styles.navButton}>Register</a>
            </>
          ) : (
            // Show when logged in
            <>
              <span className={styles.welcomeText}>Welcome, {userName}!</span>
              {userRole === 'student' ? (
                <button onClick={() => navigate('/joinClass')} className={styles.navButton}>Join a Class</button>
              ) : (
                <button onClick={() => navigate('/addClass')} className={styles.navButton}>Add a Class</button>
              )}
              <button onClick={handleLogout} className={styles.navButton}>Logout</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default PageHeader;