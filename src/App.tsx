import { Redirect, Route } from "react-router-dom";
import {
	IonApp,
	IonIcon,
	IonLabel,
	IonLoading,
	IonRouterOutlet,
	IonTabBar,
	IonTabButton,
	IonTabs,
	setupIonicReact,
	useIonToast,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { chatbox, fastFood, person } from "ionicons/icons";

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

import Konto from "./pages/Konto";
import Rejestracja from "./pages/subpages/Konto/Rejestracja";
import { useEffect } from "react";
import { authentication, db } from "./firebase-config.config";
import ZmianaDanych from "./pages/subpages/Konto/ZmianaDanych";
import { useAuthState } from "react-firebase-hooks/auth";
import Logowanie from "./pages/subpages/Konto/Logowanie";
import NotFound from "./pages/NotFound";
import _ from "lodash";
import WszystkiePrzepisy from "./pages/subpages/Przepisy/WszystkiePrzepisy";
import MojePrzepisy from "./pages/subpages/Przepisy/MojePrzepisy";
import PrzepisInside from "./pages/subpages/Przepisy/PrzepisInside";
import EdytorPrzepisu from "./pages/subpages/Przepisy/EdytorPrzepisu";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { getPlatforms } from "@ionic/core";
import { Capacitor } from "@capacitor/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	fetchIngredients,
	fetchMessages,
	fetchRecipes,
	fetchUsers,
	saveUserData,
} from "./fetches/FetchFirestore";
import Messages from "./pages/subpages/Wiadomosci/Messages";

setupIonicReact();

export const DEFAULT_ICON =
	"https://firebasestorage.googleapis.com/v0/b/kulinarnykacik-83505.appspot.com/o/icon.png?alt=media&token=0bdd47c8-87b3-451a-8eb9-e5544e94f2d5";

const App: React.FC = () => {
	const {
		data: users,
	} = useQuery(["users"], fetchUsers, { staleTime: 3_600_000, retry: 2 });

	const userMutation = useMutation((data: any) => {
		return saveUserData(data.uid, data.user);
	});

	const [presentToast] = useIonToast();

	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

	const [loggedUser, isLoadingAuth, error] = useAuthState(authentication);

	const toggleDarkTheme = (shouldAdd: any) => {
		document.body.classList.toggle("dark", shouldAdd);
	};

	const checkIfPlatform = (platf: string) => {
		return !_.isEmpty(getPlatforms().filter((platform) => platform == platf));
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
			const receiverJson = JSON.parse(notification.title);
			const receiver = users?.find((user: any) => user[0] == receiverJson.uid);
			const username =
				receiver != undefined
					? `${receiver?.[1]?.name} ${receiver?.[1]?.surname}`
					: receiverJson?.name + " " + receiverJson?.surname;

			if (!window.location.href.includes(`/Wiadomosci/${receiverJson.uid}`)) {
				presentToast({
					header: "Wiadomość od " + username,
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
			if (result.receive == "granted") {
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

	return (
		<IonApp>
			<IonReactRouter>
				<IonTabs>
					<IonRouterOutlet animated={false}>
						<Route
							exact
							path="/"
							render={() => {
								if (loggedUser) {
									return <Redirect to="/MojePrzepisy" />;
								} else {
									return <Redirect to="/WszystkiePrzepisy" />;
								}
							}}
						/>

						<Route
							exact
							path="/Wiadomosci"
							render={() => {
								if (loggedUser) {
									return <Messages />;
								} else {
									return <Redirect to="/Logowanie" />;
								}
							}}
						/>

						<Route
							exact
							path="/Wiadomosci/:receiver"
							render={() => {
								if (loggedUser) {
									return <Messages />;
								} else {
									return <Redirect to="/Logowanie" />;
								}
							}}
						/>

						<Route
							exact
							path="/EdytorPrzepisu/:id"
							component={EdytorPrzepisu}
						/>

						<Route exact path="/EdytorPrzepisu" component={EdytorPrzepisu} />

						<Route
							exact
							path="/Przepis/:id"
							render={(props) => <PrzepisInside {...props} />}
						/>

						<Route
							exact
							path="/WszystkiePrzepisy"
							render={() => <WszystkiePrzepisy />}
						/>

						<Route
							exact
							path="/MojePrzepisy"
							render={() => {
								if (loggedUser) {
									return <MojePrzepisy />;
								} else {
									return <Redirect to="/WszystkiePrzepisy" />;
								}
							}}
						/>

						<Route
							exact
							path="/Konto"
							render={() => {
								if (loggedUser) {
									return <Konto />;
								} else {
									return <Redirect to="/Logowanie" />;
								}
							}}
						/>

						<Route
							exact
							path="/Logowanie"
							render={() => {
								if (loggedUser) {
									return <Redirect to="/Konto" />;
								} else {
									return <Logowanie />;
								}
							}}
						/>

						<Route
							exact
							path="/ZmianaDanych"
							render={() => {
								if (loggedUser) {
									return <ZmianaDanych />;
								} else {
									return <Redirect to="/Logowanie" />;
								}
							}}
						/>

						<Route
							exact
							path="/Rejestracja"
							render={() => {
								if (loggedUser) {
									return <Redirect to="/Konto" />;
								} else {
									return <Rejestracja />;
								}
							}}
						/>

						<Route component={NotFound} />
					</IonRouterOutlet>

					<IonTabBar slot="bottom" className="bottom-nav-bar">
						{loggedUser && (
							<IonTabButton tab="MojePrzepisy" href="/MojePrzepisy">
								<IonIcon icon={fastFood} />
								<IonLabel>Moje Przepisy</IonLabel>
							</IonTabButton>
						)}
						<IonTabButton tab="WszystkiePrzepisy" href="/WszystkiePrzepisy">
							<IonIcon icon={fastFood} />
							<IonLabel>Wszystkie Przepisy</IonLabel>
						</IonTabButton>
						{loggedUser && (
							<IonTabButton
								routerOptions={{
									unmount: true,
								}}
								tab="Wiadomosci"
								href="/Wiadomosci"
							>
								<IonIcon icon={chatbox} />
								<IonLabel>Wiadomości</IonLabel>
							</IonTabButton>
						)}
						<IonTabButton
							tab="Konto"
							href={loggedUser ? "/Konto" : "/Logowanie"}
						>
							<IonIcon icon={person} />
							<IonLabel>{loggedUser ? "Konto" : "Logowanie"}</IonLabel>
						</IonTabButton>
					</IonTabBar>
				</IonTabs>
			</IonReactRouter>
		</IonApp>
	);
};

export default App;
