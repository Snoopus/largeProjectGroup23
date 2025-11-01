import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ClassDetailsStyles from '../css/ClassDetails.module.css';
import generalStyles from '../css/General.module.css';

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
        const userData = localStorage.getItem('user_data');
        if (!userData) {
            setMessage('Please log in to view class details');
            setLoading(false);
            return;
        }

        const user = JSON.parse(userData);
        setUserRole(user.role);
        setUserId(user.id);

        // Static sample data for now
        const sampleRecords: AttendanceRecord[] = [
            {
                _id: "6903def7dfe0107f232a9483",
                classId: classId || "",
                instructorId: "68fe8150529fd9e4bb5d9731",
                startTime: "2025-09-01T16:00:00.000Z",
                active: false,
                totalPings: 4,
                pingsCollected: {
                    "su000111": 4,
                    "ar000222": 0,
                    "ma000333": 3,
                    "awdddd22": 3,
                    "gagwag22": 3,
                    "gawe23ba": 3,
                    "baw44ada": 3,
                    "23332bba": 3,
                    "42abddad": 3,
                    "23dbawdd": 3,
                    "244nmmaa": 3,
                    "123dawdn": 3,
                    "662awdda": 3,
                    "no000444": 3
                }
            },
            {
                _id: "6903def7dfe0107f232a9484",
                classId: classId || "",
                instructorId: "68fe8150529fd9e4bb5d9731",
                startTime: "2025-09-08T17:00:00.000Z",
                active: false,
                totalPings: 5,
                pingsCollected: {
                    "su000111": 5,
                    "ar000222": 2,
                    "ma000333": 4,
                    "no000444": 5
                }
            },
            {
                _id: "6903def7dfe0107f232a9485",
                classId: classId || "",
                instructorId: "68fe8150529fd9e4bb5d9731",
                startTime: "2025-09-15T16:00:00.000Z",
                active: false,
                totalPings: 3,
                pingsCollected: {
                    "su000111": 3,
                    "ar000222": 1,
                    "ma000333": 3,
                    "no000444": 2
                }
            }
        ];

        setRecords(sampleRecords);
        setLoading(false);
    }, [classId]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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