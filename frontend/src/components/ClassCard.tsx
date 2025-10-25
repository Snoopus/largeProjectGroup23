import styles from '../css/ClassCard.module.css';
import { useNavigate } from 'react-router-dom';

interface ClassCardProps {
  className: string;
  instructorName: string;
  duration: string;
  id: string;
}

function ClassCard({ className, instructorName, duration, id }: ClassCardProps) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/classes/${id}`);
  };
  
  return (
    <div className={styles.classCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.className}>{className}</h3>
      </div>
      <div className={styles.cardBody}>
        <p className={styles.info}>
          <strong>Instructor:</strong> {instructorName}
        </p>
        <p className={styles.info}>
          <strong>Duration:</strong> {duration}
        </p>
      </div>
      <div className={styles.cardFooter}>
        <button className={styles.detailsButton} onClick={handleViewDetails}>View Details</button>
      </div>
    </div>
  );
}

export default ClassCard;
