import LoginStyles from '../css/Login.module.css';
import generalStyles from '../css/General.module.css';
import { useState } from 'react';
import { loginUser } from '../services/authService';
import { buildPath } from "../services/buildPath";

// Merge both style objects - loginStyles will override generalStyles if there are conflicts
const styles = { ...generalStyles, ...LoginStyles };


function Login()
{
    const [message,setMessage] = useState(''); //this is a setter, message is the variable and setMessage is the function to set it
    const [loginName,setLoginName] = useState('');
    const [loginPassword,setPassword] = useState('');
    async function doLogin(event:any) : Promise<void>
    {
        event.preventDefault();
  
        try
        {    
            await loginUser(loginName, loginPassword);
            setMessage('');
            // JWT Validation
            const jwt = localStorage.getItem('jwt_token');
            if (jwt) {
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
                    setMessage(decodedjwt.error);
                    return;
                } else {
                    user = decodedjwt.contents;
                }
            // End JWT Validation

                if(user.role === "teacher") {
                    window.location.href = '/classes';
                    return;
                }
                else {
                    window.location.href = '/classes';
                    return;
                }
                //window.location.href = '/classes';
            }
            window.location.href = '/';
        }
        catch(error:any)
        {
            setMessage(error.message);
        }    
      };

    return( //what gets put in the page when added. DO NOT USE FORM TAGS
        <div id="loginWrapper" className={styles.cardWrapper}>
            <div id="loginDiv">
                <span id="inner-title" className={styles.cardTitle}>PLEASE LOG IN</span><br />
                <input type="text" id="loginName" placeholder="Username" className={styles.textInput} onChange={handleSetLoginName} /><br />
                <input type="password" id="loginPassword" placeholder="Password" className={styles.textInput} onChange={handleSetPassword} /><br />
                <input type="submit" id="loginButton" className={styles.buttons} value = "Do It"
                onClick={doLogin} />
                <div id="loginResult">{message}</div>
                <br />
                <br />
                <div id="registerText" className={styles.registerText}>
                    Not registered? <a  href="/register">Register</a>
                </div>
                <br />
                <div id="forgotPassword" className={styles.registerText}>
                    Forgot your password? <a  href="/forgotpassword">Reset Password</a>
                </div>
            </div>
        </div>
    );
    function handleSetLoginName( e: any ) : void
    {
        setLoginName( e.target.value );
    }
    function handleSetPassword( e: any ) : void
    {
        setPassword( e.target.value );
    }
    
};

export default Login;

