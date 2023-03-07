import {
	IonContent,
	IonHeader,
	IonPage,
	IonText,
	IonTitle,
} from "@ionic/react";
import "./NotFound.css";

const NotFound: React.FC = () => {
	return (
		<IonPage>
			<IonContent fullscreen>
				<div className="error">
					<IonText className="error-header">BŁĄD 404</IonText>
					<IonText className="error-text">
						Chyba się zgubiłeś szukając przepisu. Wróć na prawidłową ścieżkę!
					</IonText>
				</div>
			</IonContent>
		</IonPage>
	);
};

export default NotFound;
