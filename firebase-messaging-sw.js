importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
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

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Optional:
// If you want to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you
// should implement this optional method.
messaging.onBackgroundMessage((payload) => {
	console.log(
		'[firebase-messaging-sw.js] Received background message ',
		payload
	);
	// Customize notification here
	const notificationTitle = `${payload.notification.title}`;
	const notificationOptions = {
		body: payload.notification.body,
		icon: payload.notification.image,
		image: payload.notification.image,
	};

	self.registration.showNotification(
		notificationTitle,
		notificationOptions
	);
});