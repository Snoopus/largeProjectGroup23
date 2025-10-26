import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ClassDetailsStyles from '../css/ClassDetails.module.css';
import generalStyles from '../css/General.module.css';

const styles = { ...generalStyles, ...ClassDetailsStyles };

function ClassDetails() {
    // Get the classId from the URL
    const { classId } = useParams<{ classId: string }>();
    
    // Optional: Store in state if needed
    const [classData, setClassData] = useState(null);

    useEffect(() => {
        // This runs when component mounts or classId changes
        console.log('Class ID from URL:', classId);
        
        // You can use the classId to fetch class details
        // fetchClassDetails(classId);
    }, [classId]);

    return (
        <div >
            <h1 >Class Details</h1>
            <p>Class ID: {classId}</p>
        </div>
    );
}
export default ClassDetails;