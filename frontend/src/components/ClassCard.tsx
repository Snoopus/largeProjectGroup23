import styles from '../css/ClassCard.module.css';

interface ClassCardProps {
  className: string;
  classCode: string;
  instructor: string;
  schedule: string;
  location: string;
//   id: string;
}

function ClassCard({ className, classCode, instructor, schedule, location }: ClassCardProps) {
  return (
    <div className={styles.classCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.className}>{className}</h3>
        <span className={styles.classCode}>{classCode}</span>
      </div>
      <div className={styles.cardBody}>
        <p className={styles.info}>
          <strong>Instructor:</strong> {instructor}
        </p>
        <p className={styles.info}>
          <strong>Schedule:</strong> {schedule}
        </p>
        <p className={styles.info}>
          <strong>Location:</strong> {location}
        </p>
      </div>
      <div className={styles.cardFooter}>
        <button className={styles.detailsButton}>View Details</button>
        <button className={styles.attendanceButton}>Take Attendance</button>
      </div>
    </div>
  );
}

export default ClassCard;
