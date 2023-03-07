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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createUserWithEmailAndPassword,
	updateCurrentUser,
	updateProfile,
} from "firebase/auth";
import { useState } from "react";
import { useHistory } from "react-router";
import { saveUserData } from "../../../fetches/FetchFirestore";
import { authentication } from "../../../firebase-config.config";
import "./Rejestracja.css";

const Rejestracja: React.FC = (props) => {
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [name, setName] = useState<string>("");
	const [surname, setSurname] = useState<string>("");
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [repeatPassword, setRepeatPassword] = useState<string>("");

	const [emailError, setEmailError] = useState<any>(null);
	const [passwordError, setPasswordError] = useState<any>(null);
	const [repeatPasswordError, setRepeatPasswordError] = useState<any>(null);

	const [errorMsg, setErrorMsg] = useState<any>(null);

	const queryClient = useQueryClient();

	const history = useHistory();

	const mutation = useMutation((data: any) => {
		return saveUserData(data.uid, data.user);
	});

	const handleRegister = async (e: any) => {
		e.preventDefault();
		setEmailError(null);
		setPasswordError(null);
		setRepeatPasswordError(null);
		if (email === "") {
			setEmailError("Pole e-mail jest wymagane");
		} else if (password === "") {
			setPasswordError("Pole hasło jest wymagane");
		} else if (repeatPassword === "") {
			setRepeatPasswordError("Pole powtórz hasło jest wymagane");
		} else if (password !== repeatPassword) {
			setRepeatPasswordError("Hasła nie są takie same");
		} else {
			setIsLoading(true);
			createUserWithEmailAndPassword(authentication, email, password)
				.then(async (userCredential) => {
					if (userCredential) {
						await updateProfile(userCredential.user, {
							displayName: `${name} ${surname}`,
						});
						await mutation
							.mutateAsync({
								uid: userCredential.user.uid,
								user: {
									name,
									surname,
								},
							})
							.then(async () => {
								await queryClient.refetchQueries({
									queryKey: ["users"],
									exact: true,
								});
								await queryClient.refetchQueries({
									queryKey: ["userData"],
									exact: true,
								});
								console.log("Zarejestrowano");
								setIsLoading(false);
								history.push("/Konto");
							});
					}
				})
				.catch((error) => {
					setErrorMsg(error.message);
					setIsLoading(false);
				});
		}
	};

	const handleLogin = (e: any) => {
		e.preventDefault();
		history.push("/Logowanie");
	};

	return (
		<IonPage>
			<IonContent fullscreen>
				<IonText className="header">
					<IonText>Rejestracja</IonText>
				</IonText>

				<IonText className="info" color="primary">
					{errorMsg}
				</IonText>

				<IonLoading
					isOpen={isLoading}
					message="Rejestrowanie..."
					onDidDismiss={() => setIsLoading(false)}
				/>

				<form className="formRegister">
					<div>
						<IonItem className="formItem">
							<IonLabel position="stacked">Imię</IonLabel>
							<IonInput
								type="text"
								name="name"
								onIonChange={(e: any) => setName(e.target.value)}
							/>
						</IonItem>
					</div>
					<div>
						<IonItem className="formItem">
							<IonLabel position="stacked">Nazwisko</IonLabel>
							<IonInput
								type="text"
								name="surname"
								onIonChange={(e: any) => setSurname(e.target.value)}
							/>
						</IonItem>
					</div>
					<div>
						{emailError && <IonText color="danger">{emailError}</IonText>}
						<IonItem className="formItem">
							<IonLabel position="stacked">E-mail</IonLabel>
							<IonInput
								type="email"
								name="email"
								onIonChange={(e: any) => setEmail(e.target.value)}
							/>
						</IonItem>
					</div>

					<div>
						{passwordError && <IonText color="danger">{passwordError}</IonText>}
						<IonItem className="formItem">
							<IonLabel position="stacked">Hasło</IonLabel>
							<IonInput
								type="password"
								name="password"
								onIonChange={(e: any) => setPassword(e.target.value)}
							/>
						</IonItem>
					</div>

					<div>
						{repeatPasswordError && (
							<IonText color="danger">{repeatPasswordError}</IonText>
						)}
						<IonItem className="formItem">
							<IonLabel position="stacked">Powtórz hasło</IonLabel>
							<IonInput
								type="password"
								name="repeatPassword"
								onIonChange={(e: any) => setRepeatPassword(e.target.value)}
							/>
						</IonItem>
					</div>

					<IonButton
						className="formButton"
						expand="block"
						onClick={handleRegister}
					>
						Zarejestruj się
					</IonButton>
					<IonText style={{
						textDecoration: "underline",
					}} className="formButton" onClick={handleLogin}>
						Masz już konto? Zaloguj się!
					</IonText>
				</form>
			</IonContent>
		</IonPage>
	);
};

export default Rejestracja;
