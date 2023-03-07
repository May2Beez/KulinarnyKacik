import {
	IonContent,
	IonFab,
	IonFabButton,
	IonIcon,
	IonPage,
	IonText,
} from "@ionic/react";
import { add } from "ionicons/icons";
import _ from "lodash";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import Przepis from "../../../components/Przepis";
import Wyszukiwarka from "../../../components/Wyszukiwarka";
import "./MojePrzepisy.css";
import { useQuery } from "@tanstack/react-query";
import { fetchRecipesAddedByUser, fetchRecipesWithOptions } from "../../../fetches/FetchFirestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { authentication } from "../../../firebase-config.config";
import { SkeletonNoRecipes } from "./SkeletonNoRecipes";

const MojePrzepisy = () => {
	const history = useHistory();
	const [searchedRecipes, setSearchedPrzepisy] = useState<any[]>([]);

	const [findRecipeName, setFindRecipeName] = useState<string>("");
	const [queryOptions, setQueryOptions] = useState<{ [key: string]: any }>({
		newest: true
	});

	const [loggedUser, isLoadingAuth, error] = useAuthState(authentication);

	const {
		isError: isErrorRecipes,
		isSuccess: isSuccessRecipes,
		isLoading: isLoadingRecipes,
		data: recipes,
		error: errorRecipes,
		refetch: refetchRecipes,
	} = useQuery(
		["mojePrzepisy"],
		() => fetchRecipesAddedByUser(loggedUser?.uid || "", queryOptions),
		{ staleTime: 3_600_000, retry: 2 }
	);

	const {
		refetch: refetchAllRecipes,
	} = useQuery(
		["searchedRecipes"],
		() => fetchRecipesWithOptions(queryOptions),
		{ staleTime: 3_600_000, retry: 2 }
	);

	const handleSearch = (options: {
		recipeName?: string;
		category?: string;
		moreThanCookTime?: boolean;
		cookTime?: string;
		newest?: boolean;
		diet?: string;
		ingredients?: string[];
		okazja?: string;
	}) => {
		const {
			recipeName,
			category,
			moreThanCookTime,
			cookTime,
			newest,
			diet,
			ingredients,
			okazja,
		} = options;
		const queryOptions: { [key: string]: any } = {
			newest: true,
		};
		if (recipeName) {
			setFindRecipeName(recipeName);
		}
		if (category) {
			queryOptions.category = category;
		}
		if (cookTime) {
			if (moreThanCookTime) {
				queryOptions.cookTime = { cookTimeMoreThan: Number(cookTime) };
			} else {
				queryOptions.cookTime = { cookTimeLessThan: Number(cookTime) };
			}
		}
		if (diet) {
			queryOptions.diet = diet;
		}
		if (ingredients) {
			queryOptions.ingredients = ingredients;
		}
		if (okazja) {
			queryOptions.okazja = okazja;
		}
		if (newest) {
			queryOptions.newest = true;
			queryOptions.oldest = undefined;
		} else {
			queryOptions.oldest = true;
			queryOptions.newest = undefined;
		}
		setQueryOptions(queryOptions);
	};

	const handleAddNewRecipe = () => {
		history.push("/EdytorPrzepisu");
	};

	const searchByName = (recipeName: string) => {
		if (recipeName) {
			setSearchedPrzepisy(
				searchedRecipes.filter((recipe: any) =>
					recipe[1].recipeName.toLowerCase().includes(recipeName.toLowerCase())
				)
			);
		} else {
			if (recipes) {
				setSearchedPrzepisy(recipes);
			} else {
				setSearchedPrzepisy([]);
			}
		}
	};

	const resetSearch = () => {
		setFindRecipeName("");
		setQueryOptions({ newest: true });
	};

	useEffect(() => {
		if (recipes) {
			if (findRecipeName && findRecipeName.trim().length > 0) {
				setSearchedPrzepisy(
					recipes.filter((obj: any) => {
						const przepis = obj[1];
						return przepis.recipeName
							.toLowerCase()
							.includes(findRecipeName.toLowerCase());
					})
				);
			} else {
				setSearchedPrzepisy(recipes);
			}
		}
	}, [recipes]);

	useEffect(() => {
		refetchRecipes();
		refetchAllRecipes();
	}, [queryOptions]);

	return (
		<IonPage>
			<IonContent>
				<Wyszukiwarka
					refetchRecipes={resetSearch}
					handleSearch={handleSearch}
					searchByName={searchByName}
				/>
				{isLoadingRecipes ? (
					SkeletonNoRecipes()
				) : isErrorRecipes ? (
					<div className="center-info">
						<IonText>
							Istnieje problem z pobraniem przepisów bazy danych. Odczekaj kilka
							minut i spróbuj ponownie.
						</IonText>
					</div>
				) : !searchedRecipes ||
				  _.isNull(searchedRecipes) ||
				  _.isEmpty(searchedRecipes) ? (
					<div className="center-info">
						<IonText>
							Nie posiadasz żadnych przepisów. Dodaj własny lub wybierz z bazy
							przepisów dodanych przez innych użytkowników.
						</IonText>
					</div>
				) : (
					<div className="lista-przepisow">
						{searchedRecipes.map((obj) => {
							const recipe = obj[1];
							const id = obj[0];
							return (
								<Przepis
									recipeId={recipe.id}
									key={id}
									recipe={recipe}
									mojePrzepisy={true}
								></Przepis>
							);
						})}
					</div>
				)}
				{!isLoadingRecipes && (
					<IonFab
						style={{
							margin: "1rem",
						}}
						vertical="bottom"
						horizontal="end"
						slot="fixed"
						onClick={handleAddNewRecipe}
					>
						<IonFabButton>
							<IonIcon style={{ fontSize: "2.5rem" }} icon={add} />
						</IonFabButton>
					</IonFab>
				)}
			</IonContent>
		</IonPage>
	);
};

export default MojePrzepisy;
