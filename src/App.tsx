import {
	IonApp,
	IonLoading,
	setupIonicReact,
	useIonToast,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";
import "./App.css";
import "./pages/subpages/Przepisy/EdytorPrzepisu.css";

import { useEffect } from "react";
import { authentication } from "./firebase-config.config";
import { useAuthState } from "react-firebase-hooks/auth";
import _ from "lodash";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { getPlatforms } from "@ionic/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchUsers, saveUserData } from "./fetches/FetchFirestore";
import MobileNavBar from "./components/Routes/MobileNavBar";
import DesktopNavBar from "./components/Routes/DesktopNavBar";

setupIonicReact();

export const DEFAULT_ICON =
	"https://firebasestorage.googleapis.com/v0/b/kulinarnykacik-83505.appspot.com/o/icon.png?alt=media&token=0bdd47c8-87b3-451a-8eb9-e5544e94f2d5";

const App: React.FC = () => {
	const { data: users } = useQuery(["users"], fetchUsers, {
		staleTime: 3_600_000,
		retry: 2,
	});

	const userMutation = useMutation((data: any) => {
		return saveUserData(data.uid, data.user);
	});

	const [presentToast] = useIonToast();

	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

	const [loggedUser, isLoadingAuth,] = useAuthState(authentication);

	const toggleDarkTheme = (shouldAdd: any) => {
		document.body.classList.toggle("dark", shouldAdd);
	};

	const checkIfPlatform = (platf: string) => {
		return !_.isEmpty(getPlatforms().filter((platform) => platform === platf));
	};

	const saveToken = async (obj: any) => {
		// Store in database
		const tokens: any = {};
		const token = obj.token;
		if (checkIfPlatform("desktop")) {
			tokens.web = token;
		} else if (checkIfPlatform("mobileweb")) {
			tokens.mobileWeb = token;
		} else if (checkIfPlatform("ios")) {
			tokens.ios = token;
		} else if (checkIfPlatform("android")) {
			tokens.android = token;
		} else {
			tokens.else = token;
		}

		// add token to firestore
		if (loggedUser) {
			await userMutation.mutateAsync({
				uid: loggedUser.uid,
				user: {
					tokens,
				},
			});
			console.log("Token saved");
			await registerListeners();
		}
	};

	const registerListeners = async () => {
		await FirebaseMessaging.removeAllListeners();

		await FirebaseMessaging.addListener("notificationReceived", (obj: any) => {
			const notification = obj.notification;
			console.log(users);
			console.log("Push received: ", notification);

			if (!window.location.href.includes(`/Wiadomosci`)) {
				presentToast({
					header: "Wiadomość od " + notification.title,
					message: notification.body,
					duration: 3000,
					animated: true,
					position: "top",
					color: "primary",
					icon: notification.image,
				});
			}
		});

		await FirebaseMessaging.addListener(
			"notificationActionPerformed",
			(notification: any) => {
				console.log("Push action performed: " + JSON.stringify(notification));
			}
		);
	};

	useEffect(() => {
		if (!loggedUser || !users) return;

		FirebaseMessaging.requestPermissions().then(async (result: any) => {
			if (result.receive === "granted") {
				// Register with Apple / Google to receive push via APNS/FCM
				FirebaseMessaging.getToken({
					vapidKey:
						"BFVUcWLNQ-_0JGTY1wzI2XJoAWCiTcMl3r8FeIPbe8ESNxjJ1EtjVxNWG5sWzWvLa5_f2NLqoBiV9uSwUxgDq2Y",
				})
					.then((token: any) => {
						saveToken(token);
					})
					.catch((err: any) => {
						console.log("Error getting token", err);
					});
			} else {
				// Show some error
			}
		});
	}, [loggedUser, users]);

	useEffect(() => {
		toggleDarkTheme(prefersDark.matches);
		prefersDark.addEventListener("change", (e) => {
			toggleDarkTheme(e.matches);
		});
		document.addEventListener("contextmenu", (event) => {
			event.preventDefault();
		});
	}, []);

	if (isLoadingAuth) {
		return (
			<IonApp>
				<IonLoading
					isOpen={true}
					message={"Ładowanie..."}
					duration={5000}
					spinner={"circles"}
				/>
			</IonApp>
		);
	}

	return (
		<IonApp>
			<IonReactRouter>
				{getPlatforms().includes("desktop") ? <DesktopNavBar /> : <MobileNavBar />}
			</IonReactRouter>
		</IonApp>
	);
};

export default App;
