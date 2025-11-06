import registerStyles from '../css/Register.module.css';
import generalStyles from '../css/General.module.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';
import { buildPath } from '../services/buildPath';

// Merge both style objects - registerStyles will override generalStyles if there are conflicts
const styles = { ...generalStyles, ...registerStyles };
const STUDENT = 'student';
const TEACHER = 'teacher';

function Register() {
    // Registration component code here
    const [message,setMessage] = useState(''); //this is a setter, message is the variable and setMessage is the function to set it
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [confirmPassword,setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [id,setId] = useState('');
    const [role, setRole] = useState(STUDENT);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    async function doRegister(event: React.FormEvent) : Promise<void>
    {
        event.preventDefault();

        // Validate passwords match
        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            // Register the user (creates unverified account)
            //await registerUser(email, password, firstName, lastName, id, role);
            
            const registrationInfo = { 
                email: email,
                password: password,
                firstName: firstName, 
                lastName: lastName, 
                id: id,
                role: role || "student"
            };
            localStorage.setItem('registration_data', JSON.stringify(registrationInfo));

            // Navigate to verification page with email
            navigate('/verification?type=registration', { 
                state: { email: email } 
            });
        }
        catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Registration failed';
            setMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    return (
    <div id="registerWrapper" className={styles.cardWrapper}>
            <div id="loginDiv">
                <span id="inner-title" className={styles.cardTitle}>PLEASE REGISTER</span><br />
                <div id="emailInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerName">Email:</label>
                    <input type="text" id="registerName" placeholder="johnDoe@example.com" className={styles.textInput} onChange={handleSetEmail} />
                </div>
                <div id="idInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerId">ID:</label>
                    <input type="text" id="registerId" placeholder="ID" className={styles.textInput} onChange={handleSetId} />
                </div>
                <div id="firstNameInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerFirstName">First Name:</label>
                    <input type="text" id="registerFirstName" placeholder="First Name" className={styles.textInput} onChange={handleSetFirstName} />
                </div>
                <div id="lastNameInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerLastName">Last Name:</label>
                    <input type="text" id="registerLastName" placeholder="Last Name" className={styles.textInput} onChange={handleSetLastName} />
                </div>
                <div id="passwordInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerPassword">Password:</label>
                    <input type="password" id="registerPassword" placeholder="Password" className={styles.textInput} onChange={handleSetPassword} />
                </div>
                <div id="passwordInput" className={styles.inputRow}>
                    <label className={styles.inputLabel} htmlFor="registerConfirmPassword">Confirm Password:</label>
                    <input type="password" id="registerConfirmPassword" placeholder="Confirm Password" className={styles.textInput} onChange={handleSetConfirmPassword} />
                </div>
                <div id="roleButton" className={styles.inputRow}>
                    <label className={styles.inputLabel}>Are you an instructor?</label>
                    <button 
                        type="button"
                        className={`${styles.toggleButton} ${role === TEACHER ? styles.toggleActive : ''}`}
                        onClick={() => setRole(role === TEACHER ? STUDENT : TEACHER)}
                    >
                        {role === TEACHER ? 'Yes - Instructor' : 'No - Student'}
                    </button>
                </div>
                
                <input 
                    type="submit" 
                    id="registerButton" 
                    className={styles.buttons} 
                    value={isLoading ? "Registering..." : "Register"}
                    onClick={doRegister}
                    disabled={isLoading}
                />
                <div id="registerResult">{message}</div>
                <br />
                <br />
                <div id="registerText" >
                    Already have an account? <a className={styles.buttons} href="/">Log in</a>
                </div>
            </div>
        </div>
    );

    function handleSetEmail( e: any ) : void
        {
            setEmail( e.target.value );
        }
    function handleSetPassword( e: any ) : void
        {
            setPassword( e.target.value );
        }
    function handleSetFirstName( e: any ) : void
        {
            setFirstName( e.target.value );
        }
    function handleSetLastName( e: any ) : void
        {
            setLastName( e.target.value );
        }
    function handleSetId( e: any ) : void
        {
            setId( e.target.value );
        }
    function handleSetConfirmPassword( e: any ) : void
        {
            setConfirmPassword( e.target.value );
        }
}
export default Register;