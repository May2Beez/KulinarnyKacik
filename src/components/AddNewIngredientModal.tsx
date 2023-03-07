import {
	IonButton,
	IonButtons,
	IonContent,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonModal,
	IonText,
	IonTitle,
} from "@ionic/react";
import { forwardRef, useImperativeHandle, useState } from "react";
import "./AddNewIngredientModal.css";

interface props {
	addIngredient: (ingredient: any) => void;
}

const AddNewIngredientModal = forwardRef(({ addIngredient }: props, ref) => {
	const [isOpen, setIsOpen] = useState(false);
	const [error, setError] = useState("");
	const [newIngredient, setNewIngredient] = useState<{
		name?: string;
		unit?: string;
		unitShort?: string;
	}>();

	useImperativeHandle(ref, () => ({
		openModal: () => {
			setIsOpen(true);
		},
		closeModal: () => {
			setIsOpen(false);
		},
		setError: (error: string) => {
			setError(error);
		},
	}));

	const isDisabled = () => {
		return (
			!newIngredient?.name || !newIngredient?.unit || !newIngredient?.unitShort
		);
	};

	return (
		<IonModal
			className="small-modal"
			isOpen={isOpen}
			onDidDismiss={() => {
				setIsOpen(false);
                setError("");
				setNewIngredient({});
			}}
		>
			<IonList>
				<IonListHeader className="listHeader">
					Dodawanie nowego składnika
				</IonListHeader>
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						textAlign: "center",
					}}
				>
					<IonText
						color="danger"
						style={{
							fontWeight: "bold",
						}}
					>
						{error}
					</IonText>
				</div>
				<IonItem>
					<IonLabel position="floating">Nazwa</IonLabel>
					<IonInput
						placeholder="Np. Ser"
						value={newIngredient?.name}
						onIonChange={(e) => {
							setNewIngredient({
								...newIngredient,
								name: e.detail.value!,
							});
						}}
					></IonInput>
				</IonItem>
				<IonItem>
					<IonLabel position="floating">Jednostka</IonLabel>
					<IonInput
						placeholder="Np. Sztuk"
						value={newIngredient?.unit}
						onIonChange={(e) => {
							setNewIngredient({
								...newIngredient,
								unit: e.detail.value!,
							});
						}}
					></IonInput>
				</IonItem>
				<IonItem>
					<IonLabel position="floating">Skrócona jednostka</IonLabel>
					<IonInput
						placeholder="Np. szt."
						value={newIngredient?.unitShort}
						onIonChange={(e) => {
							setNewIngredient({
								...newIngredient,
								unitShort: e.detail.value!,
							});
						}}
					></IonInput>
				</IonItem>
				<IonItem>
					<IonButtons slot="start">
						<IonButton
							disabled={isDisabled()}
							color="success"
							style={{
								fontSize: "1.2rem",
							}}
							onClick={() => {
								addIngredient(newIngredient);
							}}
						>
							Zapisz
						</IonButton>
					</IonButtons>
					<IonButtons slot="end">
						<IonButton
							color="danger"
							style={{
								fontSize: "1.2rem",
							}}
							onClick={() => {
								setIsOpen(false);
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

export default AddNewIngredientModal;
