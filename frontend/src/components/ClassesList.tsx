import styles from '../css/ClassesList.module.css';
import { useState, useEffect } from 'react';
import ClassCard from './ClassCard';
import { buildPath } from "../services/buildPath";

// Define the type for a class
interface Class {
    _id: string;
    name: string;
    classCode: string;
    section: string;
    instructorName: string;
    duration: string;
    daysOffered: string;
    startTime: string;
    endTime: string;
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
        try {
            /*
            // Get user data from localStorage
            const userData = localStorage.getItem('user_data');
            if (!userData) {
                setMessage('Please log in to view your classes');
                setLoading(false);
                return;
            }

            const user = JSON.parse(userData);
            */
            
            // Get user data from localStorage
            const jwt = localStorage.getItem('jwt_token');
            if (!jwt) {
                setMessage('Please log in to view your classes');
                setLoading(false);
                return;
            }

            // Fetch decoded data from API
            const jwtresponse = await fetch(buildPath('api/checkjwt'), {
                method: 'POST',
                body: JSON.stringify({
                    possibleJWT: jwt
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            const decodedjwt = await jwtresponse.json();

            let user;
            if (decodedjwt.error) {
                localStorage.removeItem('jwt_token');
                window.location.href = '/';
                return;
            } else {
                user = decodedjwt.contents;
            }
            
            // Fetch classes from API
            const response = await fetch(buildPath('api/fetchclasses'), {
                method: 'POST',
                body: JSON.stringify({
                    userId: user.id
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.error) {
                setMessage(data.error);
            } else {
                setClasses(data.classes || []);
            }
        } catch (error: any) {
            setMessage('Failed to load classes');
            console.error(error);
        } finally {
            setLoading(false);
        }
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
                            key={classItem._id}
                            id={classItem._id}
                            className={classItem.name}
                            classCode={classItem.classCode}
                            section={classItem.section}
                            instructorName={classItem.instructorName}
                            duration={classItem.duration}
                            daysOffered={classItem.daysOffered}
                            startTime={classItem.startTime}
                            endTime={classItem.endTime}
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

