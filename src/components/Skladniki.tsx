import {
	IonIcon,
	IonText,
} from "@ionic/react";
import { useQuery } from "@tanstack/react-query";
import { addCircle, removeCircle } from "ionicons/icons";
import { useState } from "react";
import { fetchIngredients } from "../fetches/FetchFirestore";
import { recipeObject } from "../pages/subpages/Przepisy/PrzepisInside";
import Skladnik from "./Skladnik";
import "./Skladniki.css";

interface props {
	recipe: recipeObject;
}

const Skladniki: React.FC<props> = ({ recipe }) => {
	const [porcje, setPorcje] = useState<number>(1);

	const {
		isError: isErrorIngredients,
		isSuccess: isSuccessIngredients,
		isLoading: isLoadingIngredients,
		data: ingredients,
		error: errorIngredients,
	} = useQuery(["ingredients"], fetchIngredients, {
		staleTime: 3_600_000,
		retry: 2,
	});

	const handlePorcje = (e: number) => {
		if (porcje + e >= 1) {
			setPorcje(porcje + e);
		}
	};

	return (
		<div className="iloscPorcjiStack">
			<div className="hstack iloscPorcjiContainer mBottom">
				<IonText className="iloscPorcji">Ilość porcji:</IonText>
				<div className="centerIcons porcje">
					<IonIcon
						onClick={() => {
							handlePorcje(-1);
						}}
						icon={removeCircle}
					/>
					<IonText>{porcje}</IonText>
					<IonIcon
						onClick={() => {
							handlePorcje(1);
						}}
						icon={addCircle}
					/>
				</div>
			</div>
			<div className="stack mBottom skladniki">
				{recipe &&
					ingredients &&
					recipe.ingredients.map((skladnik: any) => {
						const fullIng = ingredients.find(
							(ing: any) => {
								return ing[0] === skladnik}
						);
						if (!fullIng) return <></>;

						return (
							<Skladnik
								key={skladnik}
								porcje={porcje}
								skladnikName={fullIng[1].name}
								skladnikUnit={fullIng[1].unit}
								skladnikQuantity={recipe.ingredientsList[skladnik]}
							/>
						);
					})}
			</div>
		</div>
	);
};

export default Skladniki;
