import {
	IonActionSheet,
	IonButton,
	IonCard,
	IonIcon,
	IonImg,
	IonList,
	IonListHeader,
	IonPopover,
	IonSpinner,
	IonText,
	useIonAlert,
} from "@ionic/react";
import { listAll, ref } from "firebase/storage";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { Diety } from "../Diety";
import { authentication, storage } from "../firebase-config.config";
import "./Przepis.css";
import { isPlatform } from "@ionic/core";
import { Share } from "@capacitor/share";
import {
	EmailIcon,
	EmailShareButton,
	FacebookIcon,
	FacebookShareButton,
	LivejournalIcon,
	PinterestIcon,
	PinterestShareButton,
	RedditIcon,
	RedditShareButton,
	TwitterIcon,
	TwitterShareButton,
} from "react-share";
import { deleteObject } from "firebase/storage";
import { ellipsisVertical } from "ionicons/icons";
import Moment from "react-moment";
import PrzepisPW from "./PrzepisPW";
import "moment/locale/pl";
import {
	addRecipeToUserList,
	changeRecipeData,
	deleteRecipe,
	deleteRecipeFromUserList,
	fetchUserData,
	fetchUsers,
} from "../fetches/FetchFirestore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";

interface props {
	recipe: recipeObject;
	recipeId: string;
	mojePrzepisy?: boolean;
}

interface recipeObject {
	category: string;
	comments: [];
	cookTime: number;
	createdAt: number;
	creator: string;
	description: string;
	diet: string;
	ingredients: [];
	likes: [];
	okazja: string;
	recipe: [];
	recipeName: string;
	recipeUri: string;
	public: boolean;
}

const Przepis: React.FC<props> = ({
	recipe,
	recipeId,
	mojePrzepisy,
}) => {
	const queryClient = useQueryClient();
	const [presentAlert] = useIonAlert();
	const [openPopOver, setOpenPopOver] = useState<{
		state: boolean;
		event: any;
	}>({ state: false, event: null });
	const [sharePopOver, setSharePopOver] = useState<boolean>(false);
	const history = useHistory();
	const mutation = useMutation({
		mutationFn: (data: any) => {
			return changeRecipeData(data.id, data.newData);
		},
		onSuccess: () => {
			refetchUserData();
			queryClient.refetchQueries({
				queryKey: ["recipes"],
				exact: true,
			});
			queryClient.refetchQueries({
				queryKey: ["mojePrzepisy"],
				exact: true,
			});
			queryClient.refetchQueries({
				queryKey: ["searchedRecipes"],
				exact: true,
			});
		},
	});

	const [loggedUser,] = useAuthState(authentication);

	const addRecipeToUserListMut = useMutation({
		mutationFn: (data: string) => {
			return addRecipeToUserList(authentication.currentUser!.uid, data);
		},
		onSuccess: () => {
			refetchUserData();
			queryClient.refetchQueries({
				queryKey: ["recipes"],
				exact: true,
			});
			queryClient.refetchQueries({
				queryKey: ["mojePrzepisy"],
				exact: true,
			});
			queryClient.refetchQueries({
				queryKey: ["searchedRecipes"],
				exact: true,
			});
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
			queryClient.refetchQueries({
				queryKey: ["recipes"],
				exact: true,
			});
			queryClient.refetchQueries({
				queryKey: ["mojePrzepisy"],
				exact: true,
			});
			queryClient.refetchQueries({
				queryKey: ["searchedRecipes"],
				exact: true,
			});
			presentAlert({
				header: "Sukces",
				message: "Usunięto przepis z ulubionych",
				buttons: ["OK"],
			});
		},
	});

	const deleteRecipeMut = useMutation({
		mutationFn: (data: string) => {
			return deleteRecipe(data);
		},
		onSuccess: () => {
			queryClient.refetchQueries({
				queryKey: ["recipes"],
				exact: true,
			});
			queryClient.refetchQueries({
				queryKey: ["mojePrzepisy"],
				exact: true,
			});
			queryClient.refetchQueries({
				queryKey: ["searchedRecipes"],
				exact: true,
			});
			refetchUserData();
		},
	});

	const {
		data: userData,
		refetch: refetchUserData,
	} = useQuery(
		["userData"],
		() => loggedUser && fetchUserData(loggedUser.uid),
		{ staleTime: 3_600_000, retry: 2 }
	);

	const { data: users } = useQuery(["users"], fetchUsers, {
		staleTime: 3_600_000,
		retry: 2,
	});

	const przepisPw = useRef<any>(null);

	const editButtonsArray: {
		text: string;
		icon?: string;
		handler: () => void;
		role?: string;
		data?: any;
		cssClass?: string;
	}[] = [
		{
			text: "Udostępnij",
			handler: () => handleUdostepnij(),
		},
	];

	if (isPlatform("mobile") && loggedUser) {
		editButtonsArray.push({
			text: "Udostępnij na PW",
			handler: () => shareVia("prywatnaWiadomosc"),
		});
	}

	if (mojePrzepisy && recipe.creator === authentication.currentUser?.uid) {
		editButtonsArray.push({
			text: "Edytuj",
			handler: () => handleEdytuj(),
		});
		editButtonsArray.push({
			text: "Zmień widoczność",
			handler: () => handleZmienWidocznosc(),
		});
	}

	if (!mojePrzepisy && authentication.currentUser) {
		editButtonsArray.push({
			text: "Dodaj do moich przepisów",
			handler: () => handleDodajDoMoichPrzepisow(),
		});
	}

	if (mojePrzepisy) {
		editButtonsArray.push({
			text:
				recipe.creator == authentication.currentUser?.uid
					? "Usuń z bazy danych"
					: "Usuń z moich przepisów",
			role: "destructive",
			handler: () => handleUsunPrzepis(),
			cssClass: "red",
		});
	}

	editButtonsArray.push({
		text: "Anuluj",
		role: "cancel",
		cssClass: "bold",
		handler: () => setOpenPopOver({ state: false, event: null }),
	});

	const textToShare = `Hej! Spójrz na ten przepis na ${
		recipe.recipeName
	}!\nPowinien Ci się spodoba!\n${_.truncate(recipe.description, {
		length: 130,
	})}`;

	const handleEdytuj = () => {
		setOpenPopOver({ state: false, event: null });
		history.push(`/EdytorPrzepisu/${recipeId}`);
	};

	const handleOpenRecipe = () => {
		if (!openPopOver.state) {
			history.push(`/Przepis/${recipeId}`, {
				id: recipeId,
				prev: history.location.pathname,
			});
		}
	};

	const handleZmienWidocznosc = async () => {
		await mutation.mutateAsync({
			id: recipeId,
			newData: {
				public: !recipe.public,
			},
		});
		queryClient.refetchQueries({
			queryKey: ["recipes"],
			exact: true,
		});
		queryClient.refetchQueries({
			queryKey: ["mojePrzepisy"],
			exact: true,
		});
		queryClient.refetchQueries({
			queryKey: ["searchedRecipes"],
			exact: true,
		});
	};

	const handleUdostepnij = () => {
		if (isPlatform("desktop")) {
			setSharePopOver(true);
			return;
		}
		Share.share({
			title: `${recipe.recipeName} - Kulinarny Kącik`,
			text: textToShare,
			url: `https://kulinarnykacik-83505.web.app/Przepis/${recipeId}`,
			dialogTitle: "Udostępnij przepis",
		});
	};

	const shareVia = (socialMedia: string) => {
		switch (socialMedia) {
			case "prywatnaWiadomosc": {
				if (!przepisPw) return;

				przepisPw.current.openPopover();
			}
		}
	};

	const handleDodajDoMoichPrzepisow = async () => {
		if (!userData || !loggedUser) return;

		if (userData.data.recipesList.includes(recipeId)) {
			presentAlert({
				header: "Błąd!",
				message: "Przepis już znajduje się w Twoich przepisach!",
				buttons: [{ text: "OK" }],
			});
			return;
		}

		await addRecipeToUserListMut.mutateAsync(recipeId);

		setOpenPopOver({ state: false, event: null });
	};

	const handleUsunPrzepis = () => {
		presentAlert({
			header: "Usuwanie przepisu",
			message: "Czy na pewno chcesz usunąć ten przepis?",
			buttons: [
				{
					text: "Nie",
					role: "cancel",
					cssClass: "secondary",
				},
				{
					text: "Tak",
					handler: async () => {
						await removeRecipeFromUserListMut.mutateAsync(recipeId);

						setOpenPopOver({ state: false, event: null });

						if (recipe.creator === authentication.currentUser!.uid) {
							await deleteRecipeMut.mutateAsync(recipeId);
							listAll(ref(storage, `/recipes/${recipeId}`))
								.then((res) => {
									res.prefixes.forEach((folderRef) => {
										listAll(folderRef).then((res) => {
											res.prefixes.forEach((fileRef) => {
												deleteObject(fileRef);
											});
											res.items.forEach((itemRef) => {
												deleteObject(itemRef);
											});
										});
									});
									res.items.forEach((itemRef) => {
										deleteObject(itemRef);
									});
								})
								.catch((error) => {
									console.log(error);
								});
						}
					},
					cssClass: "primary",
				},
			],
		});
	};

	const handleOpenOptions = (event?: any) => {
		setOpenPopOver({ state: true, event: event.nativeEvent });
	};

	const getDiet = (diet: string) => {
		return Object.entries(Diety).filter((diet1) => diet1[0] === diet)?.[0]?.[1];
	};

	return (
		<IonCard className="roundedCard clickablePrzepis">
			{(isPlatform("hybrid") || isPlatform("mobile")) && (
				<div className="options">
					<IonIcon
						onClick={handleOpenOptions}
						icon={ellipsisVertical}
						size="large"
					/>
				</div>
			)}
			<div
				id="przepis"
				className="cardContent"
				onAuxClick={(e) => isPlatform("desktop") && handleOpenOptions(e)}
				onClick={handleOpenRecipe}
			>
				<div className="imageContainer">
					<IonImg
						src={
							recipe?.recipeUri ||
							"https://www.aesthetica.elblag.pl/wp-content/uploads/2019/10/placeholder.png"
						}
						alt="recipe"
						// placeholder={<IonSpinner className="loading-image" name="dots" />}
					/>

					<IonText className="diet">
						{_.upperCase(getDiet(recipe.diet))}
					</IonText>
					{mojePrzepisy &&
					recipe.creator === authentication.currentUser?.uid ? (
						<IonText className="isPublic">
							{recipe.public ? "PUBLICZNY" : "PRYWATNY"}
						</IonText>
					) : (
						mojePrzepisy && <IonText className="isPublic">DODANY</IonText>
					)}
				</div>
				<IonText className="recipeName" color="dark">
					{recipe.recipeName}
				</IonText>
				<IonText className="description">
					{_.truncate(recipe.description, { length: 150 })}
				</IonText>
				<div>
					<IonText className="addDate">Dodano dnia:</IonText>
					<Moment
						local
						className="bold smaller-text"
						format="DD MMMM YYYY @ HH:mm"
					>
						{recipe.createdAt}
					</Moment>
				</div>
				{users && (
					<IonText className="author">
						<IonText className="smaller-text">Autor: </IonText>
						<IonText className="bold smaller-text">
							{(users.find((user) => {
								return user[0] === recipe.creator;
							})?.[1]?.name || "Nieznajomy") +
								" " +
								(users.find((user) => {
									return user[0] === recipe.creator;
								})?.[1]?.surname || "")}
						</IonText>
					</IonText>
				)}
			</div>
			{isPlatform("desktop") ? (
				<IonPopover
					reference="event"
					size="auto"
					onDidDismiss={() => {
						setOpenPopOver({ state: false, event: null });
					}}
					event={openPopOver.event}
					isOpen={openPopOver.state}
					dismissOnSelect={true}
					className="options-popover"
				>
					<IonList>
						<IonListHeader className="listHeader">Opcje</IonListHeader>
						<IonButton
							expand="block"
							style={{
								margin: "1rem",
							}}
							onClick={handleUdostepnij}
						>
							Udostępnij
						</IonButton>
						{mojePrzepisy &&
							recipe.creator === authentication.currentUser?.uid && (
								<IonButton
									expand="block"
									style={{
										margin: "1rem",
									}}
									onClick={handleEdytuj}
								>
									Edytuj
								</IonButton>
							)}
						{mojePrzepisy &&
							recipe.creator === authentication.currentUser?.uid && (
								<IonButton
									expand="block"
									style={{
										margin: "1rem",
									}}
									onClick={handleZmienWidocznosc}
								>
									Zmień widoczność
								</IonButton>
							)}

						{!mojePrzepisy && authentication.currentUser && (
							<IonButton
								expand="block"
								style={{
									margin: "1rem",
								}}
								onClick={handleDodajDoMoichPrzepisow}
							>
								Dodaj do moich przepisów
							</IonButton>
						)}
						{mojePrzepisy && (
							<IonButton
								color="danger"
								expand="block"
								style={{
									margin: "3rem 1rem 1rem 1rem",
								}}
								onClick={handleUsunPrzepis}
							>
								{recipe.creator == authentication.currentUser?.uid
									? "Usuń z bazy danych"
									: "Usuń z moich przepisów"}
							</IonButton>
						)}
					</IonList>
				</IonPopover>
			) : (
				<IonActionSheet
					isOpen={openPopOver.state}
					onDidDismiss={() => {
						setOpenPopOver({ state: false, event: null });
					}}
					buttons={editButtonsArray}
					header="Opcje"
				></IonActionSheet>
			)}
			<IonPopover
				isOpen={sharePopOver}
				onDidDismiss={() => setSharePopOver(false)}
				className="sharePopOver"
			>
				<IonList>
					<IonListHeader className="listHeader">Udostępnianie</IonListHeader>
					<div className="center">
						<div className="centerV">
							<FacebookShareButton
								url={`https://kulinarnykacik-83505.web.app/Przepis/${recipeId}`}
								quote={textToShare}
							>
								<FacebookIcon size={48} round />
							</FacebookShareButton>
							<IonText>Facebook</IonText>
						</div>

						<div className="centerV">
							<TwitterShareButton
								url={`https://kulinarnykacik-83505.web.app/Przepis/${recipeId}`}
								title={textToShare}
							>
								<TwitterIcon size={48} round />
							</TwitterShareButton>
							<IonText>Twitter</IonText>
						</div>
						<div className="centerV">
							<RedditShareButton url={`https://kulinarnykacik-83505.web.app/Przepis/${recipeId}`} title={textToShare}>
								<RedditIcon size={48} round />
							</RedditShareButton>
							<IonText>Reddit</IonText>
						</div>
					</div>
					<div className="center">
						<div className="centerV">
							<EmailShareButton
								url={`https://kulinarnykacik-83505.web.app/Przepis/${recipeId}`}
								subject={`${recipe.recipeName} - Kulinarny Kącik`}
								body={textToShare + `\n${`https://kulinarnykacik-83505.web.app/Przepis/${recipeId}`}`}
							>
								<EmailIcon size={48} round />
							</EmailShareButton>
							<IonText>E-mail</IonText>
						</div>
						<div className="centerV">
							<PinterestShareButton
								media={
									recipe.recipeUri ||
									"https://www.aesthetica.elblag.pl/wp-content/uploads/2019/10/placeholder.png"
								}
								url={`https://kulinarnykacik-83505.web.app/Przepis/${recipeId}`}
								title={textToShare}
							>
								<PinterestIcon size={48} round />
							</PinterestShareButton>
							<IonText>Pinterest</IonText>
						</div>
						{authentication.currentUser && (
							<div
								className="centerV"
								onClick={() => shareVia("prywatnaWiadomosc")}
							>
								<LivejournalIcon size={48} round />
								<IonText>PW</IonText>
							</div>
						)}
					</div>
				</IonList>
			</IonPopover>
			{authentication.currentUser && (
				<PrzepisPW recipeId={recipeId} ref={przepisPw} />
			)}
		</IonCard>
	);
};

export default Przepis;
