import styles from '../css/ClassesList.module.css';
import { useState, useEffect } from 'react';
import ClassCard from './ClassCard';

// Define the type for a class
interface Class {
    id: string;
    className: string;
    classCode: string;
    instructor: string;
    schedule: string;
    location: string;
}

function ClassesList()
{
    const [classes, setClasses] = useState<Class[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch classes when component mounts
    useEffect(() => {
        fetchClasses();
    }, []);

    async function fetchClasses() {
        const class1: Class = {
            id: '1',
            className: 'Introduction to Programming',
            classCode: 'CS101',
            instructor: 'Dr. Smith',
            schedule: 'Mon/Wed/Fri 10:00-11:00 AM',
            location: 'Room 101'
        };
        const class2: Class = {
            id: '2',
            className: 'Data Structures and Algorithms',
            classCode: 'CS201',
            instructor: 'Prof. Johnson',
            schedule: 'Tue/Thu 1:00-2:30 PM',
            location: 'Room 202'
        };

        setClasses([class1, class2]);
        // try {
        //     // Get user data from localStorage
        //     const userData = localStorage.getItem('user_data');
        //     if (!userData) {
        //         setMessage('Please log in to view your classes');
        //         setLoading(false);
        //         return;
        //     }

        //     const user = JSON.parse(userData);
            
        //     // Fetch classes from API
        //     const response = await fetch(`http://localhost:5000/api/classes/${user.id}`, {
        //         method: 'GET',
        //         headers: { 'Content-Type': 'application/json' }
        //     });

        //     const data = await response.json();

        //     if (data.error) {
        //         setMessage(data.error);
        //     } else {
        //         setClasses(data.classes || []);
        //     }
        // } catch (error: any) {
        //     setMessage('Failed to load classes');
        //     console.error(error);
        // } finally {
        //     setLoading(false);
        // }
    }

    return (
        <div id="classesWrapper" className={styles.classesWrapper}>
            <h2 className={styles.pageTitle}>My Classes</h2>
            
            {loading && <p className={styles.message}>Loading classes...</p>}
            {message && <p className={styles.message}>{message}</p>}
            
            <div className={styles.classesGrid}>
                {classes.length > 0 ? (
                    classes.map((classItem) => (
                        <ClassCard
                            key={classItem.id}
                            id={classItem.id}
                            className={classItem.className}
                            classCode={classItem.classCode}
                            instructor={classItem.instructor}
                            schedule={classItem.schedule}
                            location={classItem.location}
                        />
                    ))
                ) : (
                    !loading && !message && (
                        <p className={styles.noClasses}>No classes found. Add a class to get started!</p>
                    )
                )}
            </div>
        </div>
    );
}

export default ClassesList;

