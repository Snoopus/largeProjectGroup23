import { redirect, type href } from 'react-router-dom';
import styles from '../css/ClassDetailsHeader.module.css';
import { useState, useEffect } from 'react';
import { buildPath } from '../services/buildPath';

function ClassDetailsHeader() {
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
        setUserRole(user.role || 'student');
      } catch (error) {
        setIsLoggedIn(false);
        console.error('JWT check error:', error);
      }
    }

    initializeUser();
  }, []);

  let redir = '/classes';
  if(userRole === "teacher"){
    redir = '/classes';
  }
  else if(userRole === "student"){
    redir = '/classes';
  }
  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <img 
            src="/backarrow.png" 
            alt="Back Arrow" 
            className={styles.logo}
            onClick={() => { window.location.href = redir; }}
        />
        <h1 className={styles.title}>
          Go Back to Class List
        </h1>
        
        {/* <nav className={styles.nav}>
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
              <a href="/cards" className={styles.navButton}>Add a Class</a>
              <button onClick={handleLogout} className={styles.navButton}>Logout</button>
            </>
          )}
        </nav> */}
      </div>
    </header>
  );
}

export default ClassDetailsHeader;