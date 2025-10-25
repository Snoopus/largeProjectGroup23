import styles from '../css/PageHeader.module.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PageHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  // Check if user is logged in on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    
    if (userData) {
      const user = JSON.parse(userData);
      setIsLoggedIn(true);
      setUserName(user.firstName || 'User');
      setUserRole(user.role || '');
    }
  }, []);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user_data');
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
                <button onClick={() => navigate('/joinclass')} className={styles.navButton}>Join a class</button>
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