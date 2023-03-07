import { Camera, CameraResultType } from "@capacitor/camera";
import {
	getPlatforms,
	IonButton,
	IonButtons,
	IonImg,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonModal,
	IonSpinner,
	IonText,
	IonTextarea,
	useIonAlert,
} from "@ionic/react";
import { forwardRef, useImperativeHandle, useState } from "react";

interface props {
	addStep: (step: any) => void;
}

const AddStepModal = forwardRef((props: props, ref) => {
	const [presentAlert] = useIonAlert();
	const [isOpen, setIsOpen] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [photo, setPhoto] = useState<any>(null);
	const [opis, setOpis] = useState<string>("");
	const [index, setIndex] = useState<number>(0);

	useImperativeHandle(ref, () => ({
		openModal: () => {
			setIsOpen(true);
		},
		closeModal: () => {
			setIsOpen(false);
		},
		editStep: (step: any, index: number) => {
			setIsEditing(true);
			setOpis(step.opis);
			setPhoto(step.photo || step.stepUri);
			setIndex(index);
			setIsOpen(true);
		},
	}));

	const dodajZdjecie = async () => {
		const photo = await Camera.pickImages({
			quality: 60,
			limit: 1,
		});
		setPhoto(photo.photos?.[0] || "");
	};

	const handleAddPhoto = async () => {
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
					});
			} else if (res.photos === "granted") {
				dodajZdjecie();
			}
		});
	};

	const handleUsunZdjecie = () => {
		presentAlert({
			header: "Usuwanie zdjęcia",
			message: "Czy na pewno chcesz usunąć zdjęcie?",
			buttons: [
				{
					text: "Nie",
					role: "cancel",
					cssClass: "secondary",
				},
				{
					text: "Tak",
					handler: () => {
						setPhoto(null);
					},
				},
			],
		});
	};

	const handleZapisz = () => {
		if (isEditing) {
			props.addStep({ opis, photo, isEditing: true, index: index });
		} else {
			props.addStep({ opis, photo });
		}
	};

	const handleZamknij = () => {
		setIsOpen(false);
	};

	const isDisabled = (): boolean => {
		return !opis;
	};

	return (
		<IonModal
			isOpen={isOpen}
			className="small-modal addStepModal"
			onDidDismiss={() => {
				setOpis("");
				setPhoto(null);
				setIsEditing(false);
				setIsOpen(false);
			}}
		>
			<IonList>
				<IonListHeader className="listHeader">
					{isEditing ? "Edytuj" : "Dodaj"} krok
				</IonListHeader>
				<IonItem>
					<IonLabel>Zdjęcie kroku</IonLabel>
					<IonButton size="default" onClick={handleAddPhoto}>
						Dodaj zdjęcie
					</IonButton>
				</IonItem>
				<div className="center-div mBottom w90">
					{photo ? (
						<IonImg
							className="recipeStepImg"
							src={photo.webPath || photo}
							alt="recipe"
						/>
					) : (
						<IonText>Brak zdjęcia...</IonText>
					)}
				</div>
				{photo && (
					<IonButton
						style={{
							margin: "0 1rem",
						}}
						expand="block"
						size="default"
						color="danger"
						onClick={handleUsunZdjecie}
					>
						Usuń zdjęcie
					</IonButton>
				)}
				<IonItem>
					<IonLabel position="stacked">Opis kroku</IonLabel>
					<IonTextarea
						placeholder="Opisz krok..."
						value={opis}
						onIonChange={(e) => setOpis(e.detail.value!)}
					/>
				</IonItem>
				<IonItem>
					<IonButtons slot="start">
						<IonButton
							onClick={handleZapisz}
							disabled={isDisabled()}
							style={{
								fontSize: "1.2rem",
							}}
						>
							{isEditing ? "Zapisz" : "Dodaj"}
						</IonButton>
					</IonButtons>
					<IonButtons slot="end">
						<IonButton
							onClick={handleZamknij}
							color="danger"
							style={{
								fontSize: "1.2rem",
							}}
						>
							Anuluj
						</IonButton>
					</IonButtons>
				</IonItem>
			</IonList>
		</IonModal>
	);
});

export default AddStepModal;
