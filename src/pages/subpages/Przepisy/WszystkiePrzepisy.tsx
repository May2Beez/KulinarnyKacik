import {
	IonCard,
	IonContent,
	IonPage,
	IonSkeletonText,
	IonText,
} from "@ionic/react";
import { useQuery } from "@tanstack/react-query";
import _ from "lodash";
import { useEffect, useState } from "react";
import Przepis from "../../../components/Przepis";
import Wyszukiwarka from "../../../components/Wyszukiwarka";
import { fetchRecipesWithOptions } from "../../../fetches/FetchFirestore";
import { SkeletonNoRecipes } from "./SkeletonNoRecipes";
import "./WszystkiePrzepisy.css";

const WszystkiePrzepisy = () => {
	const [searchedRecipes, setSearchedPrzepisy] = useState<any[] | undefined>();
	const [findRecipeName, setFindRecipeName] = useState<string>("");

	const [queryOptions, setQueryOptions] = useState<{ [key: string]: any }>({
		public: true,
		newest: true,
	});

	const {
		isError: isErrorRecipes,
		data: recipes,
		refetch: refetchRecipes,
		isFetching: isFetchingRecipes,
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
			public: true,
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

	const searchByName = (recipeName: string) => {
		if (recipeName) {
			setSearchedPrzepisy(
				searchedRecipes?.filter((recipe: any) =>
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
		setQueryOptions({ public: true, newest: true });
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
	}, [queryOptions]);

	return (
		<IonPage>
			<IonContent>
				<Wyszukiwarka
					handleSearch={handleSearch}
					refetchRecipes={resetSearch}
					searchByName={searchByName}
				/>
				{isFetchingRecipes ? (
					SkeletonNoRecipes()
				) : isErrorRecipes ? (
					<div className="center-info">
						<IonText>
							Istnieje problem z pobraniem przepisów bazy danych. Odczekaj kilka
							minut i spróbuj ponownie.
						</IonText>
					</div>
				) : searchedRecipes && _.isEmpty(searchedRecipes) ? (
					<div className="center-info">
						<IonText>Brak znalezionych przepisów.</IonText>
					</div>
				) : (
					<div className="lista-przepisow">
						{searchedRecipes?.map((obj: any) => {
							const recipe = obj[1];
							const index = obj[0];
							return (
								<Przepis
									recipeId={recipe.id}
									key={index}
									recipe={recipe}
								/>
							);
						})}
					</div>
				)}
			</IonContent>
		</IonPage>
	);
};

export default WszystkiePrzepisy;


