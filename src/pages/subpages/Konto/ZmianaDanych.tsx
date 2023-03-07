import {
	IonAvatar,
	IonButton,
	IonCard,
	IonContent,
	IonImg,
	IonInput,
	IonItem,
	IonLabel,
	IonLoading,
	IonNote,
	IonPage,
	IonSpinner,
	IonText,
	useIonAlert,
} from "@ionic/react";
import {
	deleteObject,
	getDownloadURL,
	ref as ref_storage,
	uploadBytes,
} from "firebase/storage";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { authentication, storage } from "../../../firebase-config.config";
import "./ZmianaDanych.css";

import _ from "lodash";
import { updateEmail, updatePassword, updateProfile } from "firebase/auth";
import { Camera } from "@capacitor/camera";
import { useAuthState } from "react-firebase-hooks/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchUserData, saveUserData } from "../../../fetches/FetchFirestore";

const ZmianaDanych: React.FC = () => {
	const [loggedUser, isLoadingAuth, error] = useAuthState(authentication);

	const [presentAlert] = useIonAlert();

	const [isLoading, setIsLoading] = useState<boolean>(false);

	const history = useHistory();

	const mutation = useMutation((data: any) => {
		return saveUserData(data.uid, data.user);
	});

	const {
		isLoading: isLoadingUserData,
		data: userData,
		refetch: refetchUserData,
	} = useQuery(
		["userData"],
		() => loggedUser && fetchUserData(loggedUser.uid),
		{ staleTime: 3_600_000, retry: 2 }
	);

	const [preUploadAvatar, setPreUploadAvatar] = useState<any>(null);
	const [name, setName] = useState<string>("");
	const [surname, setSurname] = useState<string>("");
	const [email, setEmail] = useState<string>(loggedUser?.email || "");
	const [password, setPassword] = useState<string>("");

	const [editingEmail, setEditingEmail] = useState<boolean>(false);
	const [editingPassowrd, setEditingPassword] = useState<boolean>(false);

	const getInfo = () => {
		if (loggedUser) {
			refetchUserData();
			setName(userData?.data.name || "");
			setSurname(userData?.data.surname || "");
			setEmail(loggedUser?.email || "");
		}
	};

	const goBackAndSave = async () => {
		if (!loggedUser) return;
		setIsLoading(true);
		Promise.all([
			new Promise((resolve: any, reject: any) => {
				updateProfile(loggedUser, {
					displayName: `${name} ${surname}`,
				})
					.then(() => {
						resolve();
					})
					.catch((error) => {
						reject(error);
					});
			}),
			new Promise((resolve: any, reject: any) => {
				mutation
					.mutateAsync({
						uid: loggedUser.uid,
						user: {
							name,
							surname,
						},
					})
					.then(() => {
						resolve();
					});
			}),
			new Promise((resolve: any, reject: any) => {
				if (email !== loggedUser.email) {
					updateEmail(loggedUser, email)
						.then(() => {
							resolve();
						})
						.catch((error: any) => {
							reject(error);
						});
				} else {
					resolve();
				}
			}),
			new Promise((resolve: any, reject: any) => {
				if (password !== "") {
					updatePassword(loggedUser, password)
						.then(() => {
							resolve();
						})
						.catch((error: any) => {
							reject(error);
						});
				} else {
					resolve();
				}
			}),
			new Promise((resolve: any, reject: any) => {
				handlePhotoUpload(resolve, reject);
			}),
		]).then(() => {
			refetchUserData();
			setIsLoading(false);
			history.push("/Konto");
		});
	};

	const goBackWithoutSave = () => {
		history.goBack();
	};

	const handlePhotoUpload = async (resolve: any, reject: any) => {
		if (preUploadAvatar) {
			const imageRef = ref_storage(
				storage,
				`/usersAvatars/${loggedUser!.uid}/avatar.jpeg`
			);
			const metaData = {
				contentType: `image/${preUploadAvatar.format}`,
			};

			let del = false;

			await getDownloadURL(imageRef)
				.then(async (url) => {
					if (url) {
						del = true;
					}
				})
				.catch((error) => {
					if (error.code === "storage/object-not-found") {
						del = false;
					}
				});

			if (del) {
				await deleteObject(imageRef).catch((error: any) => {
					reject(error);
				});
			}

			const response = await fetch(preUploadAvatar.webPath);
			const blob = await response.blob();

			uploadBytes(
				ref_storage(storage, `usersAvatars/${loggedUser!.uid}/avatar.jpeg`),
				blob,
				metaData
			)
				.then((snapshot) => {
					getDownloadURL(snapshot.ref).then((url) => {
						updateProfile(authentication.currentUser!, {
							photoURL: url,
						})
							.then(() => {
								mutation
									.mutateAsync({
										uid: loggedUser!.uid,
										user: {
											photoURL: url,
										},
									})
									.then(() => {
										resolve();
									});
							})
							.catch((error: any) => {
								reject(error);
							});
					});
				})
				.catch((error: any) => {
					reject(error);
				});
		} else {
			resolve();
		}
	};

	const dodajZdjecie = async () => {
		const photo = await Camera.pickImages({
			quality: 60,
			limit: 1,
		});
		setPreUploadAvatar(photo.photos?.[0] || "");
	};

	const handleAddAvatar = async () => {
		await Camera.checkPermissions().then((res) => {
			if (res.photos === "denied") {
				Camera.requestPermissions()
					.then((res) => {
						if (res.photos === "denied") {
							presentAlert({
								header: "Brak uprawnień",
								message:
									"Nie masz uprawnień do korzystania z aparatu. Aby móc dodawać zdjęcia, zmień ustawienia w ustawieniach aplikacji.",
								buttons: ["OK"],
							});
						} else {
							dodajZdjecie();
						}
					})
					.catch((err) => {
						console.log(err);
						presentAlert({
							header: "Błąd",
							message: "Wystąpił błąd podczas próby uzyskania uprawnień.",
							buttons: ["OK"],
						});
					});
			} else if (res.photos === "granted") {
				dodajZdjecie();
			}
		});
	};

	useEffect(() => {
		if (password !== "") setEditingEmail(true);
		else setEditingEmail(false);
		if (email !== loggedUser?.email) setEditingPassword(true);
		else setEditingPassword(false);
		if (!loggedUser) {
			history.push("/Konto");
		} else {
			getInfo();
		}
	}, [isLoadingUserData]);

	return (
		<IonPage>
			<IonContent fullscreen>
				<IonLoading
					isOpen={isLoading}
					message={"Zapisuję dane..."}
					onDidDismiss={() => setIsLoading(false)}
				/>
				<div className="centerContent" style={{ marginTop: "0.5rem" }}>
					<IonCard className="cardStyle centerContent">
						<div className="hstack">
							{preUploadAvatar?.webPath || loggedUser?.photoURL ? (
								<IonAvatar className="avatarStyle">
									<IonImg
										src={preUploadAvatar?.webPath || loggedUser?.photoURL}
									/>
								</IonAvatar>
							) : userData?.data.name ? (
								<IonAvatar className="avatarStyle centerNoAvatar">
									<IonText>
										{userData?.data.name?.charAt(0) +
											" " +
											userData?.data.surname?.charAt(0)}
									</IonText>
								</IonAvatar>
							) : (
								<IonAvatar className="avatarStyle centerNoAvatar">
									<IonText>B Z</IonText>
								</IonAvatar>
							)}
							<div className="buttonsPhoto">
								<IonButton onClick={handleAddAvatar}>Wybierz zdjęcie</IonButton>
							</div>
						</div>

						<div className="inputsContainer">
							<IonItem className="cardInput">
								<IonLabel position="floating">Imię</IonLabel>
								<IonInput
									type="text"
									autocomplete="given-name"
									value={name}
									onIonChange={(e) => setName(e.detail.value!)}
								></IonInput>
							</IonItem>

							<IonItem className="cardInput">
								<IonLabel position="floating">Nazwisko</IonLabel>
								<IonInput
									type="text"
									autocomplete="family-name"
									value={surname}
									onIonChange={(e) => setSurname(e.detail.value!)}
								></IonInput>
							</IonItem>

							<IonNote slot="helper">
								Tylko jedno z poniższych na raz może być edytowane
							</IonNote>

							<IonItem className="cardInput">
								<IonLabel position="floating">E-mail</IonLabel>
								<IonInput
									type="email"
									disabled={editingEmail}
									value={email}
									autocomplete="off"
									onIonChange={(e) => {
										setEmail(e.detail.value!);
									}}
								></IonInput>
							</IonItem>

							<IonItem className="cardInput">
								<IonLabel position="floating">Nowe hasło</IonLabel>
								<IonInput
									type="password"
									autocomplete="new-password"
									disabled={editingPassowrd}
									value={password}
									onIonChange={(e) => {
										setPassword(e.detail.value!);
									}}
								></IonInput>
							</IonItem>
						</div>
					</IonCard>
					<div className="buttons">
						<IonButton color="success" expand="block" onClick={goBackAndSave}>
							Zapisz i wróć
						</IonButton>
						<IonButton expand="block" onClick={goBackWithoutSave}>
							Anuluj i wróć
						</IonButton>
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
};

export default ZmianaDanych;
