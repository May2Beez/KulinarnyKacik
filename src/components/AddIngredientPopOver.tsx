import {
	IonButton,
	IonButtons,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonModal,
	IonSearchbar,
	IonText,
} from "@ionic/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import _ from "lodash";
import {
	forwardRef,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { addIngredientMut, fetchIngredients } from "../fetches/FetchFirestore";
import "./AddIngredientPopOver.css";
import AddNewIngredientModal from "./AddNewIngredientModal";
import SearchIngredientList from "./SearchIngredientList";

interface props {
	addIngredient: (ingredient: any) => void;
}

const AddIngredientPopOver = forwardRef(({ addIngredient }: props, ref) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [ingredient, setIngredient] = useState<string>("");
	const [amount, setAmount] = useState<number | null>(null);
	const [index, setIndex] = useState<number | null>(null);
	const [searchText, setSearchText] = useState("");
	const [error, setError] = useState("");
	const [info, setInfo] = useState("");

	const {
		isError: isErrorIngredients,
		isSuccess: isSuccessIngredients,
		isLoading: isLoadingIngredients,
		data: ingredients,
		error: errorIngredients,
		refetch: refetchIngredients,
	} = useQuery(["ingredients"], fetchIngredients, {
		staleTime: 3_600_000,
		retry: 2,
	});

	

	const SearchIngredientsListRef = useRef<any>(null);
	const AddNewIngredientRef = useRef<any>(null);

	const addNewIngredientMut = useMutation({
		mutationFn: (data: any) => addIngredientMut(data),
		onSuccess: () => {
			setInfo("Dodano składnik");
			AddNewIngredientRef.current?.closeModal();
			refetchIngredients();
		},
		onError: (error: any) => {
			setError(error.message);
		},
});

	const handleAddNewIngredient = () => {
		AddNewIngredientRef.current.openModal();
	};

	const addNewIngredient = (ingredient: any) => {
		if (!ingredients || ingredients.length == 0 || ingredients.filter((ing: any) => {
			return ing[1].name.toLowerCase() === ingredient.name.toLowerCase();
		}).length === 0) {
			addNewIngredientMut.mutate(ingredient);
		} else {
			AddNewIngredientRef.current.setError("Składnik o podanej nazwie już istnieje!");
		}

	};

	const selectIngredient = (newIng: any) => {
		setSearchText("");
		setError("");
		setIngredient(newIng);
	};

	const handleAddIngredient = () => {
		addIngredient({ uid: ingredient, amount: amount, isEditing: isEditing, index });
	};

	const handleAnuluj = () => {
		setIsOpen(false);
	};

	const isDisabled = (): boolean => {
		return !(ingredient && amount);
	};

	useImperativeHandle(ref, () => ({
		present: () => {
			setIsOpen(true);
		},
		dismiss: () => {
			setIsOpen(false);
		},
		info: (info: string) => {
			setError(info);
		},
		editIng: (ingredient: any) => {
			setIngredient(ingredient);
			setIndex(ingredient.index);
			setAmount(ingredient.amount);
			setIsEditing(true);
			setIsOpen(true);
		},
	}));

	return (
		<IonModal
			className="small-modal"
			isOpen={isOpen}
			onDidDismiss={() => {
				setSearchText("");
				setError("");
				setInfo("");
				setIngredient("");
				setAmount(null);
				setIsEditing(false);
				setIsOpen(false);
			}}
			backdropDismiss={true}
		>
			<IonList>
				<IonListHeader className="listHeader">
					{isEditing ? "Edytowanie składnika" : "Dodawanie składnika"}
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
					<IonText
						color="success"
						style={{
							fontWeight: "bold",
						}}
					>
						{info}
					</IonText>
				</div>
				<IonSearchbar
					value={searchText}
					onIonChange={(e) => {
						if (e.detail.value != "") {
							SearchIngredientsListRef.current.setPopover({
								state: true,
								event: e,
							});
						}
						setSearchText(e.detail.value!);
					}}
					id="ingredientSearch"
				/>
				<SearchIngredientList
					searchText={searchText}
					ref={SearchIngredientsListRef}
					selectIngredient={selectIngredient}
				/>
				<IonItem>
					<IonLabel>Składnik</IonLabel>
					<IonInput
						className="ion-text-right"
						readonly
						value={_.capitalize(ingredients?.find((ing) => ing[0] == ingredient)?.[1].name) || ""}
					></IonInput>
				</IonItem>
				<IonItem>
					<IonLabel>Ilość</IonLabel>
					<IonInput
						className="ion-text-right time-input"
						type="number"
						inputmode="numeric"
						min="0"
						step={undefined}
						value={amount}
						onIonChange={(e: any) => {
							setAmount(e.detail.value);
						}}
					/>
					<IonLabel
						style={{
							marginLeft: "10px",
						}}
					>
						{ingredients?.find((ing) => ing[0] == ingredient)?.[1].unitShort}
					</IonLabel>
				</IonItem>
				<IonItem>
					<IonLabel>Brak składnika?</IonLabel>
					<IonButton
						size="default"
						fill="clear"
						style={{
							fontSize: "1rem",
						}}
						onClick={handleAddNewIngredient}
					>
						Dodaj go!
					</IonButton>
				</IonItem>
				<IonItem>
					<IonButtons slot="start">
						<IonButton
							disabled={isDisabled()}
							onClick={handleAddIngredient}
							style={{
								fontSize: "1.2rem",
							}}
						>
							{isEditing ? "Edytuj" : "Dodaj"}
						</IonButton>
					</IonButtons>
					<IonButtons slot="end">
						<IonButton
							onClick={handleAnuluj}
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
			<AddNewIngredientModal
				addIngredient={addNewIngredient}
				ref={AddNewIngredientRef}
			/>
		</IonModal>
	);
});

export default AddIngredientPopOver;
