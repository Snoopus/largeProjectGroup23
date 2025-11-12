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
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [showManageBox, setShowManageBox] = useState(false);

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
                        // Sort by startTime descending (most recent first)
                        const sortedRecords = (data.records || []).sort((a: AttendanceRecord, b: AttendanceRecord) => 
                            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                        );
                        setRecords(sortedRecords);
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
                        // Sort by startTime descending (most recent first)
                        const sortedStudentRecords = studentRecords.sort((a: AttendanceRecord, b: AttendanceRecord) => 
                            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                        );
                        setRecords(sortedStudentRecords);
                    }
                }
            } catch (error) {
                setMessage('Failed to load attendance records');
                console.error('Fetch records error:', error);
            } finally {
                setLoading(false);
            }
        }

        async function initializeUser() {
            // Get JWT token from localStorage
            const jwt = localStorage.getItem('jwt_token');
            if (!jwt) {
                setMessage('Please log in to view class details');
                setLoading(false);
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
                setUserRole(user.role);
                setUserId(user.id);

                // Fetch records from API
                fetchRecords(user.id, user.role);
            } catch (error) {
                setMessage('Failed to verify authentication');
                setLoading(false);
                console.error('JWT check error:', error);
            }
        }

        initializeUser();
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

    const handleLeaveOrDeleteClass = async () => {
        setActionLoading(true);
        try {
            let endpoint = '';
            let requestBody = {};

            if (userRole === 'teacher') {
                endpoint = buildPath('api/deleteClass');
                requestBody = { userId: userId, classId: classId };
            } else {
                endpoint = buildPath('api/leaveClass');
                requestBody = { userId: userId, classId: classId };
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (data.error) {
                setMessage(data.error);
                setShowModal(false);
            } else {
                // Success - redirect to classes page
                window.location.href = '/classes';
            }
        } catch (error) {
            setMessage('Failed to perform action');
            console.error('Leave/Delete class error:', error);
            setShowModal(false);
        } finally {
            setActionLoading(false);
        }
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
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(record.pingsCollected).map(([studentId, pings]) => {
                                    const percentage = record.totalPings > 0 
                                        ? Math.round((pings / record.totalPings) * 100)
                                        : 0;
                                    return (
                                        <tr key={studentId}>
                                            <td>{studentId}</td>
                                            <td>{pings}</td>
                                            <td>{percentage}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    const renderStudentView = (record: AttendanceRecord) => {
        const studentPings = record.pingsCollected[userId] ?? 0;
        const percentage = record.totalPings > 0 
            ? Math.round((studentPings / record.totalPings) * 100)
            : 0;
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
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className={styles.dataRow}>
                            <td>{dateStr}</td>
                            <td>{timeStr}</td>
                            <td>{userId}</td>
                            <td>{studentPings}</td>
                            <td>{percentage}%</td>
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

            <div className={styles.manageClassBox}>
                <div className={styles.manageClassHeader}>
                    <h3>Manage Class</h3>
                    <button 
                        className={styles.toggleManageButton}
                        onClick={() => setShowManageBox(!showManageBox)}
                    >
                        {showManageBox ? '▼' : '▶'}
                    </button>
                </div>
                {showManageBox && (
                    <div className={styles.manageClassContent}>
                        <button 
                            className={userRole === 'teacher' ? styles.deleteButton : styles.leaveButton}
                            onClick={() => setShowModal(true)}
                        >
                            {userRole === 'teacher' ? 'Delete Class' : 'Leave Class'}
                        </button>
                    </div>
                )}
            </div>

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

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Confirm {userRole === 'teacher' ? 'Delete' : 'Leave'}</h2>
                        <p>
                            {userRole === 'teacher' 
                                ? 'Are you sure you want to delete this class? This action cannot be undone and will remove all attendance records.'
                                : 'Are you sure you want to leave this class? You will need to rejoin with a class code to access it again.'
                            }
                        </p>
                        <div className={styles.modalButtons}>
                            <button 
                                className={styles.cancelButton}
                                onClick={() => setShowModal(false)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                className={userRole === 'teacher' ? styles.confirmDeleteButton : styles.confirmLeaveButton}
                                onClick={handleLeaveOrDeleteClass}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Processing...' : (userRole === 'teacher' ? 'Delete Class' : 'Leave Class')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClassDetails;