import styles from '../css/ClassCard.module.css';
import { useNavigate } from 'react-router-dom';

interface ClassCardProps {
  className: string;
  classCode: string;
  section: string;
  instructorName: string;
  duration: string;
  daysOffered: string;
  startTime: string;
  endTime: string;
  id: string;
}

function ClassCard({ className, classCode, section, instructorName, duration, daysOffered, startTime, endTime, id }: ClassCardProps) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/classes/${id}`);
  };
  
  // daysOffered is already a string like "MWF" or "TTh"
  const daysString = daysOffered && daysOffered.length > 0 
    ? daysOffered 
    : 'Not specified';
  
  return (
    <div className={styles.classCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.className}>
          {className}
          <br />
          {classCode} (Section {section})
        </h3>
      </div>
      <div className={styles.cardBody}>
        <p className={styles.info}>
          <strong>Instructor:</strong> {instructorName}
        </p>
        <p className={styles.info}>
          <strong>Days:</strong> {daysString}
        </p>
        <p className={styles.info}>
          <strong>Time:</strong> {startTime} - {endTime}
        </p>
      </div>
      <div className={styles.cardFooter}>
        <button className={styles.detailsButton} onClick={handleViewDetails}>View Details</button>
      </div>
    </div>
  );
}

export default ClassCard;
