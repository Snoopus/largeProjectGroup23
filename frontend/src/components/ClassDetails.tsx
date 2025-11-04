import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ClassDetailsStyles from '../css/ClassDetails.module.css';
import generalStyles from '../css/General.module.css';
import { buildPath } from '../services/buildPath';

const styles = { ...generalStyles, ...ClassDetailsStyles };

interface PingsCollected {
    [studentId: string]: number;
}

interface AttendanceRecord {
    _id: string;
    classId: string;
    instructorId: string;
    startTime: string;
    active: boolean;
    totalPings: number;
    pingsCollected: PingsCollected;
}

function ClassDetails() {
    const { classId } = useParams<{ classId: string }>();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>('');
    const [userId, setUserId] = useState<string>('');
    const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

    useEffect(() => {
        async function fetchRecords(userId: string, role: string) {
            try {
                let endpoint = '';
                let requestBody = {};

                if (role === 'teacher') {
                    endpoint = buildPath('api/fetchteacherrecords');
                    requestBody = { objectId: classId };
                } else {
                    endpoint = buildPath('api/fetchstudentrecords');
                    requestBody = { userId: userId, objectId: classId };
                }

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();

                if (data.error) {
                    setMessage(data.error);
                    setRecords([]);
                } else {
                    if (role === 'teacher') {
                        // Teacher gets full records with all student data
                        setRecords(data.records || []);
                    } else {
                        // Student gets filtered records, need to convert to full record format
                        interface StudentRecord {
                            studentPings: number;
                            totalPings: number;
                            startTime: string;
                        }
                        const studentRecords = (data.records || []).map((record: StudentRecord, index: number) => ({
                            _id: `student-record-${index}`,
                            classId: classId || '',
                            instructorId: '',
                            startTime: record.startTime,
                            active: false,
                            totalPings: record.totalPings,
                            pingsCollected: {
                                [userId]: record.studentPings
                            }
                        }));
                        setRecords(studentRecords);
                    }
                }
            } catch (error) {
                setMessage('Failed to load attendance records');
                console.error('Fetch records error:', error);
            } finally {
                setLoading(false);
            }
        }

        const userData = localStorage.getItem('user_data');
        if (!userData) {
            setMessage('Please log in to view class details');
            setLoading(false);
            return;
        }

        const user = JSON.parse(userData);
        setUserRole(user.role);
        setUserId(user.id);

        // Fetch records from API
        fetchRecords(user.id, user.role);
    }, [classId]);

    const toggleExpanded = (recordId: string) => {
        setExpandedRecords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(recordId)) {
                newSet.delete(recordId);
            } else {
                newSet.add(recordId);
            }
            return newSet;
        });
    };

    const renderTeacherView = (record: AttendanceRecord) => {
        const isExpanded = expandedRecords.has(record._id);
        const date = new Date(record.startTime);
        const dateStr = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return (
            <div key={record._id} className={styles.recordCard}>
                <table className={styles.recordTable}>
                    <thead>
                        <tr className={styles.headerRow}>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Total Pings</th>
                            <th>
                                <button 
                                    onClick={() => toggleExpanded(record._id)}
                                    className={styles.expandButton}
                                >
                                    {isExpanded ? '▼ Hide Students' : '▶ Show Students'}
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className={styles.dataRow}>
                            <td>{dateStr}</td>
                            <td>{timeStr}</td>
                            <td>{record.totalPings}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
                {isExpanded && (
                    <div className={styles.studentList}>
                        <table className={styles.studentTable}>
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Pings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(record.pingsCollected).map(([studentId, pings]) => (
                                    <tr key={studentId}>
                                        <td>{studentId}</td>
                                        <td>{pings}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    const renderStudentView = (record: AttendanceRecord) => {
        const studentPings = record.pingsCollected[userId] ?? 0;
        const date = new Date(record.startTime);
        const dateStr = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return (
            <div key={record._id} className={styles.recordCard}>
                <table className={styles.recordTable}>
                    <thead>
                        <tr className={styles.headerRow}>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Your Student ID</th>
                            <th>Your Pings</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className={styles.dataRow}>
                            <td>{dateStr}</td>
                            <td>{timeStr}</td>
                            <td>{userId}</td>
                            <td>{studentPings}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    if (loading) {
        return <div className={styles.container}><p>Loading...</p></div>;
    }

    if (message) {
        return <div className={styles.container}><p>{message}</p></div>;
    }

    return (
        <div className={styles.container}>
            <h1>Class Attendance Records</h1>

            {records.length === 0 ? (
                <p>No attendance records found.</p>
            ) : (
                <div className={styles.recordsContainer}>
                    {records.map(record => 
                        userRole === 'teacher' 
                            ? renderTeacherView(record)
                            : renderStudentView(record)
                    )}
                </div>
            )}
        </div>
    );
}

export default ClassDetails;