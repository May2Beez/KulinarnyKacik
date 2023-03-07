import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage";
import { getMessaging } from "@firebase/messaging";

const firebaseConfig = {
	apiKey: "AIzaSyBWpEVN2CoFg16r7nAytIhBAVGNgLKaR1c",
	authDomain: "kulinarnykacik-83505.firebaseapp.com",
	databaseURL:
		"https://kulinarnykacik-83505-default-rtdb.europe-west1.firebasedatabase.app",
	projectId: "kulinarnykacik-83505",
	storageBucket: "kulinarnykacik-83505.appspot.com",
	messagingSenderId: "566913645425",
	appId: "1:566913645425:web:aa08361bf791cafe8ed4d0",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const authentication = getAuth(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);