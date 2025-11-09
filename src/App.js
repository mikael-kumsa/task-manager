import React from 'react';
import {auth} from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth'; //to get the realtime user auth status
import './App.css';
import Login from './components/Login';
import TaskManager from './components/TaskManager';
import Footer from './components/Footer';

function App(){
  //track if user is logged in or not
  const [user, loading] = useAuthState(auth);

  // loader while checking auth sttus
  if (loading){
    return (
      <div className='app-loading'>
        <h2>Loading...</h2>
      </div>
    );
  }

  //we'll show login screen if the usert isnot logged in
  if (!user){
    return <Login/>;
  }

  //show the dashboard if user is logged in
  return (
  <>
  <TaskManager user={user}/>
  <Footer/></>
  )
}

export default App;
