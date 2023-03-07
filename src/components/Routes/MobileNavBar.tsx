import {
	IonIcon,
	IonLabel,
	IonRouterOutlet,
	IonTabBar,
	IonTabButton,
	IonTabs,
} from "@ionic/react";
import { chatbox, fastFood, person } from "ionicons/icons";
import { useAuthState } from "react-firebase-hooks/auth";
import { authentication } from "../../firebase-config.config";
import { Redirect, Route } from "react-router";
import Messages from "../../pages/subpages/Wiadomosci/Messages";
import Konto from "../../pages/Konto";
import NotFound from "../../pages/NotFound";
import Logowanie from "../../pages/subpages/Konto/Logowanie";
import Rejestracja from "../../pages/subpages/Konto/Rejestracja";
import ZmianaDanych from "../../pages/subpages/Konto/ZmianaDanych";
import EdytorPrzepisu from "../../pages/subpages/Przepisy/EdytorPrzepisu";
import MojePrzepisy from "../../pages/subpages/Przepisy/MojePrzepisy";
import PrzepisInside from "../../pages/subpages/Przepisy/PrzepisInside";
import WszystkiePrzepisy from "../../pages/subpages/Przepisy/WszystkiePrzepisy";
import { Keyboard } from "@awesome-cordova-plugins/keyboard";


const MobileNavBar: React.FC = () => {
	const [loggedUser] = useAuthState(authentication);

	return (
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

				<Route exact path="/EdytorPrzepisu/:id" component={EdytorPrzepisu} />

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

			<IonTabBar slot="bottom" className="bottom-nav-bar" hidden={Keyboard.isVisible}>
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
				<IonTabButton tab="Konto" href={loggedUser ? "/Konto" : "/Logowanie"}>
					<IonIcon icon={person} />
					<IonLabel>{loggedUser ? "Konto" : "Logowanie"}</IonLabel>
				</IonTabButton>
			</IonTabBar>
		</IonTabs>
	);
};

export default MobileNavBar;
