import {
	IonButton,
	IonContent,
	IonInput,
	IonItem,
	IonLabel,
	IonLoading,
	IonPage,
	IonText,
} from "@ionic/react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { useHistory } from "react-router";
import { authentication } from "../../../firebase-config.config";
import "./Logowanie.css";

interface props {
	info?: string;
}

export const ErrorCodes: { [key: string]: string; } = {
	"auth/invalid-email": "Nieprawidłowy adres email",
	"auth/user-disabled": "Konto zostało zablokowane",
	"auth/user-not-found": "Nie znaleziono użytkownika",
	"auth/wrong-password": "Nieprawidłowe hasło",
	"auth/too-many-requests": "Zbyt wiele prób logowania. Spróbuj ponownie później",
}

const Logowanie: React.FC<props> = (props) => {
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");

	const [emailError, setEmailError] = useState<any>(null);
	const [passwordError, setPasswordError] = useState<any>(null);

	const [info, setInfo] = useState(props.info ? props.info : null);

	const history = useHistory();

	const [error, setError] = useState<string>();

	const handleLogin = async (e: any) => {
		e.preventDefault();
		setEmailError(null);
		setPasswordError(null);
		if (email === "") {
			setEmailError("Pole e-mail jest wymagane");
		} else if (password === "") {
			setPasswordError("Pole hasło jest wymagane");
		} else {
			signInWithEmailAndPassword(authentication, email, password)
				.then((userCredential) => {
					if (userCredential) {
						console.log("Zalogowano");
						history.push("/");
						window.location.reload();
					}
				})
				.catch((error) => {
					console.log("error", error);
					console.log("error.code", error.code);
					setError(error.code);
				});
		}
	};

	const handleRegister = (e: any) => {
		e.preventDefault();
		history.push("/Rejestracja");
	};

	return (
		<IonPage>
			<IonContent fullscreen>
				<IonText className="header">
					<IonText>Logowanie</IonText>
				</IonText>

				{info && <IonText className="info" color="primary">
					{info}
				</IonText>}

				{error && <IonText className="info" color="danger">
					{ErrorCodes[error]}
				</IonText>}

				<IonLoading
					isOpen={isLoading}
					onDidDismiss={() => setIsLoading(false)}
					message={"Logowanie..."}
				/>

				<form className="form">
					<div>
						{emailError && <IonText color="danger">{emailError}</IonText>}
						<IonItem className="formItem">
							<IonLabel position="stacked">E-mail</IonLabel>
							<IonInput
								autocomplete="email"
								required
								value={email}
								onIonChange={(e: any) => setEmail(e.target.value)}
								type="email"
								name="email"
							/>
						</IonItem>
					</div>

					<div>
						{passwordError && <IonText color="danger">{passwordError}</IonText>}
						<IonItem className="formItem">
							<IonLabel position="stacked">Hasło</IonLabel>
							<IonInput
								required
								type="password"
								name="password"
								onIonChange={(e: any) => setPassword(e.target.value)}
							/>
						</IonItem>
					</div>

					<IonButton
						className="formButton"
						expand="block"
						onClick={handleLogin}
					>
						Zaloguj się
					</IonButton>
					<IonText style={{
						textDecoration: "underline",
					}} className="formButton" onClick={handleRegister}>
						Nie masz jeszcze konta? Zarejestruj się!
					</IonText>
				</form>
			</IonContent>
		</IonPage>
	);
};

export default Logowanie;
