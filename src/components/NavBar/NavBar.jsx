import { AccountCircle, DarkModeOutlined, LanguageOutlined, Mail, MailOutline, Notifications, NotificationsOutlined, Password, SearchOutlined } from '@mui/icons-material'
import './NavBar.scss'
import { Accordion, Avatar, Badge, Icon, Snackbar, Tooltip } from '@mui/material';
import Paper from '@mui/material/Paper';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../contex/UserContext';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';



export const NavBar = ({handleOpen}) => {

  
    const [open, setOpen] = useState(false);
    const [success, setSuccess] = useState(false);
    const [failed, setFailed] = useState(false);
  
    const handleClick = () => {
      setOpen(!open);
    };

    const [userData, setUserData] = useState();
    const { currentUser } = useContext(UserContext);
    useEffect(() => {
      // Set up the real-time listener for user data
      const userDocRef = doc(db, 'users', currentUser.uid);
      const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
        const data = userDoc.data();
        setUserData(data);
      });
  
      // Clean up the listener when the component unmounts
      return () => {
        unsubscribe();
      };
    }, [currentUser.uid]);
  
    const handlePasswordReset = async (email) => {
      try {
        
        await sendPasswordResetEmail(auth, email);
       
        setSuccess(true);
        console.log('Password reset email sent successfully.');
        // Display a message to the user indicating that the password reset email has been sent.
      } catch (error) {
       
        setFailed(true);
        console.error('Error sending password reset email:', error.message);
        alert(error);
        // Display an error message to the user.
      }
    };
  

  return (
    <div className='navBar'>
      <div className="wrapper">
        <div className="search">
          <input type="text" placeholder='search...' />
          <SearchOutlined/>
        </div>
        <div className="items">
          <div className="item">
            <LanguageOutlined className='icon'/>
            English
          </div>
          

          <Tooltip title="Light/Dark mode" arrow>
          <div className="item">
            <DarkModeOutlined className='icon'/>
          </div>
          </Tooltip>
          {userData?.role === "Director"?
            <Tooltip title="send password reset" arrow>
            <div className="item" onClick={()=> handlePasswordReset("blessedwinvicschools@gmail.com")}>
              <Password className='icon'/>
            </div>
            </Tooltip>
            :
            ''
          }

          <Tooltip title="Profile" arrow>
          <div className="item" onClick={()=>handleOpen()}>
            
            <Avatar src={userData?.profilePictureURL} alt={userData?.fullname} className='avatar'> {userData?.fullname.charAt(0)} </Avatar>
            
          </div>
          </Tooltip>
        </div>
      </div>

      {open && (
        <Paper elevation={3} className="notification-container">
          {/* Your notification logs here */}
          <div className="notificationItem"><p>Jane Doe created an account</p></div>
          <div className="notificationItem"><p>Eniola Davis just took your exam</p></div>
          <div className="notificationItem"><p>Notification 2</p></div>
        </Paper>
      )}


    <Snackbar
      open={success}
      autoHideDuration={6000}
      onClose={()=> setSuccess(false)}
      message="Email sent"
      
    />

    <Snackbar
      open={failed}
      autoHideDuration={6000}
      onClose={()=> setFailed(false)}
      message="Email was not sent try again"
      
    />
    </div>
  )
}
