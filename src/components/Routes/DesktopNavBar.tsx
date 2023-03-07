import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonImg,
	IonItem,
	IonList,
	IonMenu,
	IonMenuButton,
	IonPage,
	IonRouterOutlet,
	IonText,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import { chatbox, fastFood, person } from "ionicons/icons";
import { useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Redirect, Route, useHistory } from "react-router";
import { authentication } from "../../firebase-config.config";
import Konto from "../../pages/Konto";
import NotFound from "../../pages/NotFound";
import Logowanie from "../../pages/subpages/Konto/Logowanie";
import Rejestracja from "../../pages/subpages/Konto/Rejestracja";
import ZmianaDanych from "../../pages/subpages/Konto/ZmianaDanych";
import EdytorPrzepisu from "../../pages/subpages/Przepisy/EdytorPrzepisu";
import MojePrzepisy from "../../pages/subpages/Przepisy/MojePrzepisy";
import PrzepisInside from "../../pages/subpages/Przepisy/PrzepisInside";
import WszystkiePrzepisy from "../../pages/subpages/Przepisy/WszystkiePrzepisy";
import Messages from "../../pages/subpages/Wiadomosci/Messages";
import "./DesktopNavBar.css";

const DesktopNavBar: React.FC = () => {
	const history = useHistory();
	const [loggedUser] = useAuthState(authentication);
	const menuRef = useRef<HTMLIonMenuElement>(null);

	return (
		<>
			<IonMenu
				ref={menuRef}
				side="start"
				contentId="main-content"
				className="semi-transparent-blur"
			>
				<IonHeader>
					<IonToolbar>
						<IonButtons slot="start">
							<IonMenuButton />
						</IonButtons>
						<IonTitle>Panel nawigacyjny</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="full-visible">
					<IonList className="nav-bar-desktop">
						{loggedUser &&
							NavBarButton(menuRef, "/MojePrzepisy", "Moje przepisy", fastFood)}

						{NavBarButton(
							menuRef,
							"/WszystkiePrzepisy",
							"Wszystkie przepisy",
							fastFood
						)}

						{loggedUser &&
							NavBarButton(menuRef, "/Wiadomosci", "Wiadomości", chatbox)}

						{NavBarButton(
							menuRef,
							loggedUser ? "/Konto" : "/Logowanie",
							loggedUser ? "Konto" : "Logowanie",
							person
						)}
					</IonList>
				</IonContent>
			</IonMenu>
			<IonPage id="main-content">
				<IonHeader>
					<IonToolbar>
						<IonButtons slot="start">
							<IonMenuButton />
							<div className="logo" onClick={() => history.push("/")}>
								<div
									style={{
										width: "40px",
										height: "40px",
										borderRadius: "30%",
										overflow: "hidden",
										margin: "auto",
									}}
								>
									<IonImg src="assets/icon/icon.png" />
								</div>
								<div className="logo-text">
									<IonText>Kulinarny</IonText>
									<IonText>Kącik</IonText>
								</div>
							</div>
						</IonButtons>
					</IonToolbar>
				</IonHeader>
				<IonContent>
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
				</IonContent>
			</IonPage>
		</>
	);
};

export default DesktopNavBar;
function NavBarButton(
	menuRef: any,
	routerLink: string,
	text: string,
	icon: string
) {
	return (
		<IonItem>
			<IonIcon icon={icon} />
			<IonButton
				onClick={() => {
					menuRef.current?.close();
				}}
				size="default"
				routerLink={routerLink}
				routerDirection="none"
				expand="full"
				fill="clear"
				color="primary"
				style={{
					width: "100%",
				}}
			>
				<span
					style={{
						marginRight: "auto",
					}}
				>
					{text}
				</span>
			</IonButton>
		</IonItem>
	);
}
