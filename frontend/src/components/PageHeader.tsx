import styles from './PageHeader.module.css';

function PageHeader() {
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
      </div>
    </header>
  );
}

export default PageHeader;