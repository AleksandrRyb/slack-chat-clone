import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/storage';


var config = {
    apiKey: "AIzaSyC8CoCtTrgzdxiTMX-dkTjgEqpJl0a9auw",
    authDomain: "slack-chat-7e72b.firebaseapp.com",
    databaseURL: "https://slack-chat-7e72b.firebaseio.com",
    projectId: "slack-chat-7e72b",
    storageBucket: "slack-chat-7e72b.appspot.com",
    messagingSenderId: "892212427683"
  };

  firebase.initializeApp(config);

  export default firebase;