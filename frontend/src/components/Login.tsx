import React, { useState } from 'react';
import styles from './Login.module.css';


function Login()
{
    const [message,setMessage] = useState(''); //this is a setter, message is the variable and setMessage is the function to set it
    const [loginName,setLoginName] = React.useState('');
    const [loginPassword,setPassword] = React.useState('');
    async function doLogin(event:any) : Promise<void>
    {
        event.preventDefault();

        const obj = {login:loginName,password:loginPassword};
        const js = JSON.stringify(obj);
  
        try
        {    
            const response = await fetch('http://localhost:5000/api/login',
                {method:'POST',body:js,headers:{'Content-Type': 'application/json'}});
  
            const res = JSON.parse(await response.text());
  
            if( res.id <= 0 )
            {
                setMessage('User/Password combination incorrect');
            }
            else
            {
                const user = {firstName:res.firstName,lastName:res.lastName,id:res.id}
                localStorage.setItem('user_data', JSON.stringify(user));
  
                setMessage('');
                window.location.href = '/cards';
            }
        }
        catch(error:any)
        {
            alert(error.toString());
            return;
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
                    Not registered? <a className={styles.buttons} href="/register">Register here</a>
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

