import {
	IonButton,
	IonButtons,
	IonIcon,
	IonInput,
	IonItem,
	IonLabel,
	IonModal,
	IonSearchbar,
	IonSelect,
	IonSelectOption,
	IonText,
	IonTitle,
	IonToggle,
	IonToolbar,
	isPlatform,
	useIonPicker,
} from "@ionic/react";
import { useQuery } from "@tanstack/react-query";
import { chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import _ from "lodash";
import { useEffect, useState } from "react";
import { Diety } from "../Diety";
import { fetchIngredients } from "../fetches/FetchFirestore";
import { Kategorie } from "../Kategorie";
import { Okazje } from "../Okazje";
import "./Wyszukiwarka.css";

Object.defineProperty(String.prototype, "capitalize", {
	value: function () {
		return this.charAt(0).toUpperCase() + this.slice(1);
	},
	enumerable: false,
});

interface props {
	handleSearch: (options: {}) => void;
	refetchRecipes: () => void;
	searchByName: (name: string) => void;
}

const Wyszukiwarka: React.FC<props> = ({ handleSearch, refetchRecipes, searchByName }) => {
	const [options, setOptions] = useState<{
		extRecipeName?: string;
		recipeName?: string;
		category?: string;
		moreThanCookTime?: boolean;
		cookTime?: string;
		newest?: boolean;
		diet?: string;
		ingredients?: string[];
		okazja?: string;
	}>({ moreThanCookTime: true, newest: true });
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

	const {
		data: ingredients,
	} = useQuery(["ingredients"], fetchIngredients, {
		staleTime: 3_600_000,
		retry: 2,
	});

	const [present] = useIonPicker();

	const [recipeNameSearch, setRecipeNameSearch] = useState<string>("");

	const sendSearchOptions = () => {
		if (options.extRecipeName) {
			handleSearch({ ...options, recipeName: options.extRecipeName });
		} else {
			handleSearch(options);
		}
	};

	useEffect(() => {
		searchByName(recipeNameSearch);
	}, [recipeNameSearch]);

	return (
		<>
			<div className="wyszukiwarkaContainer">
				<IonSearchbar
					placeholder="Wyszukaj przepis..."
					animated={true}
					value={recipeNameSearch}
					onIonChange={(e) => {
						setRecipeNameSearch(e.detail.value || "");
					}}
				/>
				<div className="wyszukiwarkaHStack">
					<IonButton
						color="danger"
						fill="clear"
						onClick={() => {
							setRecipeNameSearch("");
							refetchRecipes();
							setOptions({ newest: true, moreThanCookTime: true });
						}}
					>
						Reset
					</IonButton>
					<IonButton
						color="secondary"
						fill="clear"
						onClick={() => {
							setIsModalOpen(true);
						}}
					>
						Więcej opcji
					</IonButton>
				</div>
			</div>
			<IonModal
				className="wyszukiwarkaModal"
				isOpen={isModalOpen}
				backdropDismiss={true}
				onDidDismiss={() => {
					setIsModalOpen(false);
				}}
			>
				<IonToolbar>
					<IonTitle>Rozszerzona wyszukiwarka</IonTitle>
				</IonToolbar>
				<IonItem>
					<IonSearchbar
						placeholder="Nazwa przepisu..."
						animated={true}
						value={options.extRecipeName}
						onIonChange={(e) => {
							setOptions({ ...options, extRecipeName: e.detail.value });
						}}
					/>
				</IonItem>
				<IonItem>
					<IonLabel>Dieta</IonLabel>
					{isPlatform("desktop") ? (
						<IonSelect
							placeholder="Wybierz dietę..."
							className="ion-float-right selector"
							value={options?.diet}
							onIonChange={(e) => {
								setOptions({ ...options, diet: e.detail.value! });
							}}
						>
							{Object.entries(Diety).map(([key, value]) => (
								<IonSelectOption key={key} value={key}>
									{value}
								</IonSelectOption>
							))}
						</IonSelect>
					) : (
						<IonButton
							expand="block"
							color="secondary"
							fill="default"
							className="chooserBtn"
							onClick={() => {
								present({
									buttons: [
										{
											text: "Wybierz",
											handler: (value) => {
												setOptions({ ...options, diet: value.Dieta.value });
											},
										},
										{
											text: "Anuluj",
											handler: () => {
												return;
											},
										},
									],
									columns: [
										{
											name: "Dieta",
											options: Object.entries(Diety).map(([key, value]) => ({
												text: value,
												value: key,
											})),
										},
									],
								});
							}}
						>
							{options?.diet
								? Object.entries(Diety).find(
										(entry) => entry[0] === options.diet
								  )?.[1]
								: "Wybierz dietę..."}
						</IonButton>
					)}
				</IonItem>
				<IonItem>
					<IonLabel>Kategoria</IonLabel>
					{isPlatform("desktop") ? (
						<IonSelect
							placeholder="Wybierz kategorię..."
							className="ion-float-right selector"
							value={options?.category}
							onIonChange={(e) => {
								setOptions({ ...options, category: e.detail.value! });
							}}
						>
							{Object.entries(Kategorie).map(([key, value]) => {
								return (
								<IonSelectOption key={key} value={key}>
									{value}
								</IonSelectOption>
							)})}
						</IonSelect>
					) : (
						<IonButton
							expand="block"
							color="secondary"
							fill="default"
							className="chooserBtn"
							onClick={() => {
								present({
									buttons: [
										{
											text: "Wybierz",
											handler: (value) => {
												setOptions({
													...options,
													category: value.Kategorie.value,
												});
											},
										},
										{
											text: "Anuluj",
											handler: () => {
												return;
											},
										},
									],
									columns: [
										{
											name: "Kategorie",
											options: Object.entries(Kategorie).map(
												([key, value]) => ({
													text: value,
													value: key,
												})
											),
										},
									],
								});
							}}
						>
							{options?.category
								? Object.entries(Kategorie).find(
										(entry) => entry[0] === options.category
								  )?.[1]
								: "Wybierz kategorię..."}
						</IonButton>
					)}
				</IonItem>
				<IonItem>
					<IonLabel>Okazja</IonLabel>
					{isPlatform("desktop") ? (
						<IonSelect
							placeholder="Wybierz okazję..."
							className="ion-float-right selector"
							value={options?.okazja}
							onIonChange={(e: any) => {
								setOptions({ ...options, okazja: e.detail.value! });
							}}
						>
							{Object.entries(Okazje).map(([key, value]) => (
								<IonSelectOption key={key} value={key}>
									{value}
								</IonSelectOption>
							))}
						</IonSelect>
					) : (
						<IonButton
							expand="block"
							color="secondary"
							fill="default"
							className="chooserBtn"
							onClick={() => {
								present({
									buttons: [
										{
											text: "Wybierz",
											handler: (value) => {
												setOptions({ ...options, okazja: value.Okazje.value });
											},
										},
										{
											text: "Anuluj",
											handler: () => {
												return;
											},
										},
									],
									columns: [
										{
											name: "Okazje",
											options: Object.entries(Okazje).map(([key, value]) => ({
												text: value,
												value: key,
											})),
										},
									],
								});
							}}
						>
							{options?.okazja
								? Object.entries(Okazje).find(
										(entry) => entry[0] === options.okazja
								  )?.[1]
								: "Wybierz okazję..."}
						</IonButton>
					)}
				</IonItem>
				<IonItem>
					<IonLabel>Czas przygotowania</IonLabel>
					<IonIcon
						onClick={() => {
							setOptions({
								...options,
								moreThanCookTime: !options.moreThanCookTime,
							});
						}}
						icon={
							options.moreThanCookTime
								? chevronForwardOutline
								: chevronBackOutline
						}
					/>
					<IonInput
						className="ion-text-right time-input"
						type="number"
						inputmode="numeric"
						min="0"
						step={undefined}
						value={options?.cookTime}
						onIonChange={(value: any) => {
							setOptions({ ...options, cookTime: value.detail.value });
						}}
					/>
					<IonText
						style={{
							marginLeft: "10px",
						}}
					>
						min
					</IonText>
				</IonItem>
				<IonItem>
					<IonLabel>Składniki</IonLabel>
					<IonSelect
						multiple={true}
						value={options?.ingredients}
						cancelText="Anuluj"
						okText="Zatwierdź"
						onIonChange={(e) => {
							setOptions({ ...options, ingredients: e.detail.value });
						}}
					>
						{ingredients
							?.sort((a: any, b: any) => {
								const nameA = a[1].name.toUpperCase();
								const nameB = b[1].name.toUpperCase();
								return nameA.localeCompare(nameB);
							})
							.map(([key, value]) => {
								return (
									<IonSelectOption key={key} value={key}>
										{value.name.capitalize()}
									</IonSelectOption>
								);
							})}
					</IonSelect>
				</IonItem>
				<IonItem>
					<IonLabel>
						Sortuj od {options?.newest ? "najnowszych" : "najstarszych"}
					</IonLabel>
					<IonToggle
						checked={options.newest}
						onIonChange={(e) => {
							setOptions({ ...options, newest: e.detail.checked });
						}}
					></IonToggle>
				</IonItem>
				<IonItem>
					<IonButtons className="modalButtons" slot="start">
						<IonButton
							color="success"
							fill="clear"
							onClick={() => {
								setIsModalOpen(false);
								sendSearchOptions();
							}}
						>
							Szukaj
						</IonButton>
					</IonButtons>
					<IonButtons className="modalButtons" slot="end">
						<IonButton
							color="danger"
							onClick={() => {
								setIsModalOpen(false);
							}}
						>
							Zamknij
						</IonButton>
					</IonButtons>
				</IonItem>
			</IonModal>
		</>
	);
};

export default Wyszukiwarka;
