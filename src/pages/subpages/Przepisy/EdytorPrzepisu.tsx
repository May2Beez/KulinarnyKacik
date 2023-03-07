import { Camera, CameraResultType } from "@capacitor/camera";
import {
	getPlatforms,
	IonBackButton,
	IonButton,
	IonButtons,
	IonContent,
	IonIcon,
	IonImg,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonLoading,
	IonPage,
	IonPopover,
	IonSelect,
	IonSelectOption,
	IonSpinner,
	IonText,
	IonTextarea,
	IonTitle,
	IonToolbar,
	isPlatform,
	useIonAlert,
	useIonLoading,
	useIonToast,
} from "@ionic/react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { create, ellipse, ellipsisVertical, trash } from "ionicons/icons";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import { Redirect, useHistory, useParams } from "react-router";
import AddIngredientPopOver from "../../../components/AddIngredientPopOver";
import AddStepModal from "../../../components/AddStepModal";
import { Diety } from "../../../Diety";
import { authentication, storage } from "../../../firebase-config.config";
import { Kategorie } from "../../../Kategorie";
import { Okazje } from "../../../Okazje";
import "./EdytorPrzepisu.css";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	addRecipeToUserList,
	changeRecipeData,
	deleteRecipeFromUserList,
	fetchIngredients,
	fetchRecipes,
	fetchRecipesAddedByUser,
	fetchUserData,
	generateRecipeId,
} from "../../../fetches/FetchFirestore";
import { useAuthState } from "react-firebase-hooks/auth";

interface recipeObject {
	id?: string;
	category?: string;
	comments?: [];
	cookTime?: number;
	createTime?: object;
	creator?: string;
	description?: string;
	diet?: string;
	ingredientsTmp?: any[] | null;
	ingredients?: {};
	likes?: any[];
	okazja?: string;
	recipe?: any[];
	recipeName?: string;
	recipeUri?: string;
	public?: boolean;
}

const EdytorPrzepisu: React.FC = () => {
	const [authenticated, setAuthenticated] = useState<boolean>(true);
	const [present, dismiss] = useIonLoading();
	const [presentAlert] = useIonAlert();
	const [presentToast] = useIonToast();
	const addIngredientPopOverRef = useRef<any>(null);
	const addStepModalRef = useRef<any>(null);
	const [isLoading, setIsLoading] = useState(false);
	const params: { id?: string } = useParams();
	const przepisId = params?.id;
	const history = useHistory();

	const categoryRef = useRef<HTMLIonSelectElement>(null);
	const cookTimeRef = useRef<HTMLIonInputElement>(null);
	const descriptionRef = useRef<HTMLIonTextareaElement>(null);
	const dietRef = useRef<HTMLIonSelectElement>(null);
	const occasionRef = useRef<HTMLIonSelectElement>(null);
	const recipeNameRef = useRef<HTMLIonInputElement>(null);
	const [steps, setSteps] = useState<any[]>([]);
	const [ingredientsArray, setIngredientsArray] = useState<any[]>([]);
	const [recipeUri, setRecipeUri] = useState<string>("");

	const [loggedUser, isLoadingAuth, error] = useAuthState(authentication);

	const generateId = useMutation(generateRecipeId);

	const { data: recipes, refetch: refetchRecipes } = useQuery(
		["recipes"],
		fetchRecipes,
		{
			staleTime: 3_600_000,
			retry: 2,
		}
	);

	const { data: ingredients } = useQuery(["ingredients"], fetchIngredients, {
		staleTime: 3_600_000,
		retry: 2,
	});

	const { refetch: refetchUserRecipes } = useQuery(
		["mojePrzepisy"],
		() => fetchRecipesAddedByUser(loggedUser?.uid || "", []),
		{ staleTime: 3_600_000, retry: 2 }
	);

	const changeRecipe = useMutation({
		mutationFn: (data: any) => {
			return changeRecipeData(data.uid, data.recipe);
		},
		onSuccess: () => {
			dismiss();
			history.goBack();
			presentToast({
				message: Boolean(przepisId)
					? "Edytowano przepis"
					: "Dodano nowy przepis",
				color: "success",
				position: "top",
				duration: 2000,
			});
			refetchRecipes();
			refetchUserRecipes();
		},
	});

	const addRecipeToUserListMut = useMutation({
		mutationFn: (data: string) => {
			return addRecipeToUserList(authentication.currentUser!.uid, data);
		},
		onSuccess: () => {
			refetchUserData();
			refetchRecipes();
			refetchUserRecipes();
			presentAlert({
				header: "Sukces",
				message: "Dodano przepis do ulubionych",
				buttons: ["OK"],
			});
		},
	});

	const removeRecipeFromUserListMut = useMutation({
		mutationFn: (data: string) => {
			return deleteRecipeFromUserList(authentication.currentUser!.uid, data);
		},
		onSuccess: () => {
			refetchUserData();
			refetchRecipes();
			refetchUserRecipes();
			presentAlert({
				header: "Sukces",
				message: "Usunięto przepis z ulubionych",
				buttons: ["OK"],
			});
		},
	});

	const { refetch: refetchUserData } = useQuery(
		["userData"],
		() => loggedUser && fetchUserData(loggedUser.uid),
		{ staleTime: 3_600_000, retry: 2 }
	);

	const [optionsPopover, setOptionsPopover] = useState<{
		state: boolean;
		event: any;
		index: any;
	}>({ state: false, event: null, index: null });

	const [stepOptionsPopover, setStepOptionsPopover] = useState<{
		state: boolean;
		event: any;
		index: any;
	}>({ state: false, event: null, index: null });

	const handleOpenOptions = (index: any, e: any) => {
		setOptionsPopover({ state: true, event: e, index: index });
	};

	const handleOpenStepOptions = (index: any, e: any) => {
		setStepOptionsPopover({ state: true, event: e, index: index });
	};

	const handleEdytujStep = (index: any) => {
		const step = steps![index];
		setStepOptionsPopover({ state: false, event: null, index: null });
		addStepModalRef.current?.editStep(step, index);
	};

	const handleUsunStep = (index: any) => {
		setStepOptionsPopover({ state: false, event: null, index: null });
		const newSteps = _.cloneDeep(steps);
		newSteps.splice(index, 1);
		setSteps(newSteps);
	};

	const handleEdytujSkladnik = (index: any) => {
		const ing = ingredientsArray[index];
		setOptionsPopover({ state: false, event: null, index: null });
		addIngredientPopOverRef.current.editIng({ ...ing, index: index });
	};

	const handleUsunSkladnik = (index: any) => {
		const ing = ingredientsArray[index];
		setOptionsPopover({ state: false, event: null, index: null });
		presentAlert({
			header: "Usuwanie składnika",
			message: `Czy na pewno chcesz usunąć składnik: ${_.capitalize(
				ing.name
			)}?`,
			buttons: [
				{
					text: "Nie",
					role: "cancel",
					cssClass: "secondary",
				},
				{
					text: "Tak",
					handler: () => {
						const newIngredients = ingredientsArray.filter(
							(ingredient: any, ind) => ind !== index
						);
						setIngredientsArray(newIngredients);
					},
				},
			],
		});
	};

	const dodajZdjecie = async () => {
		const photo = await Camera.pickImages({
			quality: 60,
			limit: 1,
		});
		setRecipeUri(photo.photos?.[0]?.webPath || "");
	};

	const handleAddZdjecie = async () => {
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

	const handleAddIngredient = () => {
		addIngredientPopOverRef.current.present();
	};

	const handleAddStep = () => {
		addStepModalRef.current.openModal();
	};

	const addIngredient = (ingredient: any) => {
		if (ingredient.isEditing) {
			if (
				ingredientsArray.filter((ing: any) => {
					return ing.uid == ingredient.uid;
				}).length > 0
			) {
				addIngredientPopOverRef.current.info(
					"Ten składnik już znajduje się na liście"
				);
				return;
			} else {
				setIngredientsArray((prev) => {
					const newIngredients = _.cloneDeep(prev);
					newIngredients[ingredient.index] = ingredient;
					return newIngredients;
				});
				addIngredientPopOverRef.current.dismiss();
				return;
			}
		}
		if (!ingredientsArray.filter((i) => i.uid === ingredient.uid).length) {
			if (ingredientsArray) {
				setIngredientsArray((prev) => [...prev, ingredient]);
			} else {
				setIngredientsArray([ingredient]);
			}
			addIngredientPopOverRef.current.dismiss();
		} else {
			addIngredientPopOverRef.current.info(
				"Ten składnik już znajduje się na liście"
			);
		}
	};

	const addStep = (step: any) => {
		if (step.isEditing) {
			setSteps((prev) => {
				const newSteps = _.cloneDeep(prev);
				newSteps[step.index] = step;
				return newSteps;
			});
			addStepModalRef.current.closeModal();
			return;
		}
		if (steps) {
			setSteps((prev) => [...prev, step]);
		} else {
			setSteps([step]);
		}
		addStepModalRef.current.closeModal();
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
						setRecipeUri("");
					},
				},
			],
		});
	};

	const AddFullRecipe = async () => {
		const fullRecipe = {
			id: przepisId || "",
			recipeName: recipeNameRef.current!.value,
			description: descriptionRef.current!.value,
			recipeUri: recipeUri,
			ingredients: ingredientsArray.map((ing) => ing.uid),
			ingredientsList: Object.fromEntries(
				ingredientsArray.map((ing) => [ing.uid, ing.amount])
			),
			steps: steps,
			category: categoryRef.current!.value,
			cookTime: cookTimeRef.current!.value,
			diet: dietRef.current!.value,
			okazja: occasionRef.current!.value,
			creator: authentication.currentUser?.uid,
			createdAt: new Date().getTime(),
			public: false,
		};

		await presentAlert({
			header: "Dodawanie przepisu",
			message: "Udostępnić przepis publicznie?",
			buttons: [
				{
					text: "Nie",
					cssClass: "secondary",
					handler: () => {
						fullRecipe.public = false;
					},
				},
				{
					text: "Tak",
					handler: () => {
						fullRecipe.public = true;
					},
				},
			],
			onDidDismiss: async () => {
				const isEditing = Boolean(przepisId);
				let key = "";
				if (przepisId) {
					key = przepisId;
				} else {
					key = await generateId.mutateAsync();
				}
				fullRecipe.id = key;
				present({
					cssClass: "loading",
					message: isEditing ? "Edytuję przepis" : "Dodaję przepis",
					spinner: "dots",
				});
				const promises: any[] = [];
				if (!recipeUri.startsWith("http")) {
					promises.push(
						new Promise<void>(async (resolve, reject) => {
							const response = await fetch(recipeUri);
							const blob = await response.blob();
							uploadBytes(
								ref(storage, `recipes/${fullRecipe.id}/${fullRecipe.id}`),
								blob
							)
								.then((snapshot) => {
									getDownloadURL(snapshot.ref)
										.then((url) => {
											fullRecipe.recipeUri = url;
											resolve();
										})
										.catch((err) => {
											reject(err);
										});
								})
								.catch((err) => {
									reject(err);
								});
						})
					);
				}

				let stepsTemp: any[] = [];

				steps.forEach((step, index) => {
					promises.push(
						new Promise<void>(async (resolve, reject) => {
							if (step?.photo) {
								if (step.photo.webPath) {
									const response = await fetch(step.photo.webPath);
									const blob = await response.blob();
									await uploadBytes(
										ref(storage, `recipes/${fullRecipe.id}/steps/${index}`),
										blob
									)
										.then(async (snapshot) => {
											await getDownloadURL(snapshot.ref)
												.then((url) => {
													step = {
														opis: step.opis,
														stepUri: url,
													};
													stepsTemp[index] = step;
													resolve();
												})
												.catch((err) => {
													reject(err);
												});
										})
										.catch((err) => {
											reject(err);
										});
								}
							} else {
								stepsTemp[index] = step;
								resolve();
							}
						})
					);
				});

				Promise.all(promises)
					.then(async () => {
						fullRecipe.steps = stepsTemp;
						await addRecipeToUserListMut.mutateAsync(fullRecipe.id);
						await changeRecipe.mutateAsync({
							uid: fullRecipe.id,
							recipe: fullRecipe,
						});
					})
					.catch((err) => {
						console.log(err);
					});
			},
		});
	};

	const isDisabled = (): boolean => {
		return (
			!recipeNameRef.current?.value ||
			ingredientsArray.length == 0 ||
			steps.length == 0 ||
			!categoryRef.current?.value ||
			!descriptionRef.current?.value ||
			!occasionRef.current?.value ||
			!cookTimeRef.current?.value ||
			!dietRef.current?.value
		);
	};

	useEffect(() => {
		if (przepisId) {
			if (recipes) {
				const recipe: any = recipes.find(
					(recipe: any) => recipe[0] === przepisId
				)![1];
				if (recipe) {
					if (recipe.creator !== authentication.currentUser?.uid) {
						console.log("You are not an author!");
						setAuthenticated(false);
						return;
					}

					recipeNameRef.current!.value = recipe.recipeName;
					descriptionRef.current!.value = recipe.description;
					occasionRef.current!.value = recipe.okazja;
					cookTimeRef.current!.value = recipe.cookTime;
					dietRef.current!.value = recipe.diet;
					categoryRef.current!.value = recipe.category;
					setRecipeUri(recipe.recipeUri);
					if (recipe.steps) {
						const stepsTemp = recipe.steps.map((step: any) => {
							console.log(step);
							if (step?.stepUri) {
								return { opis: step.opis, stepUri: step?.stepUri };
							}
							return { opis: step.opis };
						});
						setSteps(stepsTemp);
					}
					if (recipe.ingredients) {
						const ingredientsTemp = recipe.ingredients.map(
							(ingredient: any) => {
								const ing = ingredients?.find((ing: any) => {
									return ing[0] === ingredient;
								});
								if (ing) {
									return {
										uid: ing[0],
										amount: recipe.ingredientsList[ingredient],
										name: ing[1].name,
										unit: ing[1].unit,
										unitShort: ing[1].unitShort,
									};
								} else {
									return {};
								}
							}
						);
						setIngredientsArray(ingredientsTemp);
					}
				}
			}
		} else {
			setIsLoading(false);
		}

		return () => {
			setIsLoading(false);
		};
	}, [przepisId, recipes]);

	return (
		<IonPage>
			{!authenticated && <Redirect to="/WszystkiePrzepisy" />}
			<IonContent className="recipe-creator-content">
				<IonLoading
					isOpen={isLoading}
					message="Ładuję przepis..."
					onDidDismiss={() => setIsLoading(false)}
				></IonLoading>
				<IonToolbar
					style={{
						position: "fixed",
					}}
				>
					<IonButtons slot="start">
						<IonBackButton
							defaultHref={"/WszystkiePrzepisy"}
							text={isPlatform("ios") ? "Wróć" : ""}
						/>
					</IonButtons>
					<IonTitle>{przepisId ? `Edycja przepisu` : `Nowy przepis`}</IonTitle>
					<IonButtons slot="end">
						<IonButton disabled={isDisabled()} onClick={AddFullRecipe}>
							{przepisId ? `Zapisz` : `Dodaj`}
						</IonButton>
					</IonButtons>
				</IonToolbar>
				{!isLoading && (
					<div className="edytor-przepisu">
						<IonItem>
							<IonLabel position="stacked">Nazwa przepisu</IonLabel>
							<IonInput type="text" ref={recipeNameRef}></IonInput>
						</IonItem>
						<IonItem className="photo">
							<IonLabel>Zdjęcie przepisu</IonLabel>
							<IonButton
								onClick={handleAddZdjecie}
								size="default"
								className="ion-float-right"
							>
								Dodaj zdjęcie
							</IonButton>
						</IonItem>
						<div className="recipeImageContainer">
							{recipeUri && recipeUri.length != 0 ? (
								<IonImg
									src={recipeUri}
									alt="recipe"
								/>
							) : (
								<IonText>Brak zdjęcia...</IonText>
							)}
						</div>
						{recipeUri && recipeUri.length != 0 && (
							<IonButton
								color="danger"
								className="delete-photo-btn"
								onClick={handleUsunZdjecie}
							>
								Usuń zdjęcie
							</IonButton>
						)}
						<IonItem>
							<IonLabel position="stacked">Opis przepisu</IonLabel>
							<IonTextarea
								placeholder="Opisz swój przepis..."
								className="edit-description"
								ref={descriptionRef}
							></IonTextarea>
						</IonItem>
						<IonItem>
							<IonLabel>Dieta</IonLabel>
							{
								<IonSelect
									placeholder="Wybierz dietę..."
									className="ion-float-right selector"
									ref={dietRef}
								>
									{Object.entries(Diety).map(([key, value]) => (
										<IonSelectOption key={key} value={key}>
											{value}
										</IonSelectOption>
									))}
								</IonSelect>
							}
						</IonItem>
						<IonItem>
							<IonLabel>Kategoria</IonLabel>
							{
								<IonSelect
									placeholder="Wybierz kategorię..."
									className="ion-float-right selector"
									ref={categoryRef}
								>
									{Object.entries(Kategorie).map(([key, value]) => (
										<IonSelectOption key={key} value={key}>
											{value}
										</IonSelectOption>
									))}
								</IonSelect>
							}
						</IonItem>
						<IonItem>
							<IonLabel>Okazja</IonLabel>
							{
								<IonSelect
									placeholder="Wybierz okazję..."
									className="ion-float-right selector"
									ref={occasionRef}
								>
									{Object.entries(Okazje).map(([key, value]) => (
										<IonSelectOption key={key} value={key}>
											{value}
										</IonSelectOption>
									))}
								</IonSelect>
							}
						</IonItem>
						<IonItem>
							<IonLabel>Czas przygotowania</IonLabel>
							<IonInput
								className="ion-text-right time-input"
								type="number"
								inputmode="numeric"
								min="0"
								step={undefined}
								ref={cookTimeRef}
							/>
							<IonText
								style={{
									marginLeft: "10px",
								}}
							>
								min
							</IonText>
						</IonItem>
						<div>
							<IonItem
								style={{
									marginBottom: "0.3rem",
								}}
							>
								<IonLabel>Składniki</IonLabel>
								<IonButton
									className="ion-float-right"
									expand="block"
									size="default"
									onClick={handleAddIngredient}
								>
									Dodaj składnik
								</IonButton>
							</IonItem>
							<IonItem>
								{ingredientsArray.length != 0 ? (
									<IonList
										style={{
											display: "flex",
											gap: "0.5rem",
											flexDirection: "column",
											width: "100%",
											margin: "5px 0"
										}}
									>
										{ingredients &&
											ingredientsArray.map((ingredient, index) => {
												return (
													<IonLabel
														key={Math.random() * 1000}
														style={{
															fontSize: "1rem",
															display: "flex",
															flexDirection: "row",
															alignItems: "center",
															justifyContent: "space-between",
															width: "inherit",
														}}
													>
														<div>
															<IonIcon
																style={{
																	fontSize: "0.5rem",
																	marginRight: "0.5rem",
																}}
																icon={ellipse}
															/>
															<IonText>
																{_.capitalize(
																	ingredients!.find(
																		(ing) => ing[0] == ingredient.uid
																	)?.[1]?.name
																)}{" "}
																- {ingredient.amount}{" "}
																{
																	ingredients!.find(
																		(ing) => ing[0] == ingredient.uid
																	)?.[1].unitShort
																}
															</IonText>
														</div>
														<IonIcon
															onClick={(e) => handleOpenOptions(index, e)}
															style={{
																fontSize: "1.5rem",
																cursor: "pointer",
															}}
															icon={ellipsisVertical}
														/>
													</IonLabel>
												);
											})}
									</IonList>
								) : (
									<IonText>Brak składników...</IonText>
								)}
							</IonItem>
						</div>
						<div>
							<IonItem
								style={{
									marginBottom: "0.3rem",
								}}
							>
								<IonLabel>Kroki przepisu</IonLabel>
								<IonButton
									className="ion-float-right"
									expand="block"
									size="default"
									onClick={handleAddStep}
								>
									Dodaj krok
								</IonButton>
							</IonItem>
							<IonItem>
								{steps.length != 0 ? (
									<div className="stepList">
										{steps.map((step, index) => {
											return (
												<div key={index} className="stepStack">
													<div className="stepHStack">
														<div className="stepTitle">
															<IonText>{index + 1}.</IonText>
														</div>
														<div className="stepOpis">
															<IonText>{step.opis}</IonText>
														</div>
														<div className="stepOptions">
															<IonIcon
																onClick={(e) => handleOpenStepOptions(index, e)}
																style={{
																	fontSize: "1.5rem",
																	cursor: "pointer",
																}}
																icon={ellipsisVertical}
															/>
														</div>
													</div>
													{step?.photo && (
														<IonImg
															className="recipeStepImg"
															src={step.photo.webPath}
															alt="photo"
														/>
													)}
													{step?.stepUri && (
														<IonImg
															className="recipeStepImg"
															src={step.stepUri}
															alt="photo"
														/>
													)}
												</div>
											);
										})}
									</div>
								) : (
									<IonText>Brak kroków...</IonText>
								)}
							</IonItem>
						</div>
					</div>
				)}
			</IonContent>
			<IonPopover
				className="skladnikOptionsPopover"
				isOpen={optionsPopover.state}
				event={optionsPopover.event}
				reference="event"
				alignment="start"
				onDidDismiss={() => {
					setOptionsPopover({
						state: false,
						event: undefined,
						index: undefined,
					});
				}}
				style={{
					"--offset-x": "-140px",
				}}
			>
				<IonList>
					<IonItem
						button
						onClick={() => handleEdytujSkladnik(optionsPopover.index)}
					>
						<IonIcon slot="start" icon={create} />
						<IonLabel>Edytuj</IonLabel>
					</IonItem>
					<IonItem
						button
						onClick={() => {
							handleUsunSkladnik(optionsPopover.index);
						}}
					>
						<IonIcon slot="start" icon={trash} />
						<IonLabel>Usuń</IonLabel>
					</IonItem>
				</IonList>
			</IonPopover>
			<IonPopover
				className="stepOptionsPopover"
				isOpen={stepOptionsPopover.state}
				event={stepOptionsPopover.event}
				reference="event"
				alignment="start"
				onDidDismiss={() => {
					setStepOptionsPopover({
						state: false,
						event: undefined,
						index: undefined,
					});
				}}
				style={{
					"--offset-x": "-140px",
				}}
			>
				<IonList>
					<IonItem
						button
						onClick={() => handleEdytujStep(stepOptionsPopover.index)}
					>
						<IonIcon slot="start" icon={create} />
						<IonLabel>Edytuj</IonLabel>
					</IonItem>
					<IonItem
						button
						onClick={() => {
							handleUsunStep(stepOptionsPopover.index);
						}}
					>
						<IonIcon slot="start" icon={trash} />
						<IonLabel>Usuń</IonLabel>
					</IonItem>
				</IonList>
			</IonPopover>
			<AddIngredientPopOver
				addIngredient={addIngredient}
				ref={addIngredientPopOverRef}
			/>
			<AddStepModal addStep={addStep} ref={addStepModalRef} />
		</IonPage>
	);
};

export default EdytorPrzepisu;
