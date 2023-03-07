import { Share } from "@capacitor/share";
import {
	getPlatforms,
	IonAvatar,
	IonBackButton,
	IonButton,
	IonButtons,
	IonContent,
	IonIcon,
	IonImg,
	IonList,
	IonListHeader,
	IonLoading,
	IonPage,
	IonPopover,
	IonSpinner,
	IonText,
	IonTitle,
	IonToolbar,
	isPlatform,
} from "@ionic/react";
import { timer } from "ionicons/icons";
import _ from "lodash";
import { useRef, useState } from "react";
import { RouteComponentProps, useParams } from "react-router";
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
import Komentarze from "../../../components/Komentarze";
import Polubienia from "../../../components/Polubienia";
import Skladniki from "../../../components/Skladniki";
import { Diety } from "../../../Diety";
import { Kategorie } from "../../../Kategorie";
import { Okazje } from "../../../Okazje";
import "./PrzepisInside.css";
import Moment from "react-moment";
import { authentication } from "../../../firebase-config.config";
import PrzepisPW from "../../../components/PrzepisPW";
import { useQuery } from "@tanstack/react-query";
import { fetchRecipes, fetchUsers } from "../../../fetches/FetchFirestore";

export interface recipeObject {
	category: string;
	comments: [];
	cookTime: number;
	createdAt: number;
	creator: string;
	description: string;
	diet: string;
	ingredients: [];
	ingredientsList: [];
	likes: [];
	okazja: string;
	steps: [];
	recipeName: string;
	recipeUri: string;
	public: boolean;
	id: string;
}

const PrzepisInside: React.FC<RouteComponentProps> = (props) => {
	const { id } = useParams<{ id: string }>();
	const przepisPw = useRef<any>(null);
	const [sharePopOver, setSharePopOver] = useState<boolean>(false);

	const {
		isError: isErrorUsers,
		isSuccess: isSuccessUsers,
		isLoading: isLoadingUsers,
		data: users,
		error: errorUsers,
	} = useQuery(["users"], fetchUsers, { staleTime: 3_600_000, retry: 2 });

	const {
		isError: isErrorRecipes,
		isSuccess: isSuccessRecipes,
		isLoading: isLoadingRecipes,
		data: recipes,
		error: errorRecipes,
		refetch: refetchRecipes,
	} = useQuery(["recipes"], fetchRecipes, { staleTime: 3_600_000, retry: 2 });

	if (_.isEmpty(id)) {
		window.location.reload();
	}

	const recipe: recipeObject = recipes?.filter(
		(recipe: any) => recipe[0] === id
	)?.[0]?.[1];
	const author = users?.filter(
		(user: any) => user[0] === recipe?.creator
	)?.[0]?.[1];

	const textToShare = `Hej! Spójrz na ten przepis na ${
		recipe?.recipeName
	}!\nPowinien Ci się spodobać!\n${_.truncate(recipe?.description, {
		length: 130,
	})}`;

	const urlToShare = `https://kulinarnykacik-83505.web.app${props.location.pathname}`;

	const getCategory = (category: string) => {
		return Object.entries(Kategorie).filter((cat) => cat[0] == category)[0][1];
	};

	const getOkazja = (okazja: string) => {
		return Object.entries(Okazje).filter((oka) => oka[0] == okazja)[0][1];
	};

	const getDiet = (diet: string) => {
		return Object.entries(Diety).filter((diet1) => diet1[0] == diet)[0][1];
	};

	const handleUdostepnij = () => {
		if (isPlatform("desktop")) {
			setSharePopOver(true);
			return;
		}
		Share.share({
			title: `${recipe?.recipeName} - Kulinarny Kącik`,
			text: textToShare,
			url: urlToShare,
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

	const defaultPhoto =
		"https://www.aesthetica.elblag.pl/wp-content/uploads/2019/10/placeholder.png";
	return (
		<IonPage>
			<IonContent fullscreen>
				<IonLoading isOpen={isLoadingRecipes} message="Ładuję przepis..." />
				{!getPlatforms().includes("desktop") && BackButton(handleUdostepnij)}
				{recipe && (
					<div className="content">
						<IonText className="title">{recipe.recipeName}</IonText>
						<div>
							<IonText className="addDate">Przepis dodany dnia: </IonText>
							<Moment className="addDate bold" date={recipe.createdAt} format="DD MMMM YYYY" />
						</div>

						<Polubienia recipeId={id} />

						<div className="recipeImageContainer">
							<IonImg src={recipe?.recipeUri ? recipe.recipeUri : defaultPhoto} alt="recipe" />
							<IonText className="diet">
								{_.upperCase(getDiet(recipe.diet))}
							</IonText>
						</div>
						<div className="stack inne">
							<IonText>Kategoria: {getCategory(recipe.category)}</IonText>
							<IonText>Okazja: {getOkazja(recipe.okazja)}</IonText>
						</div>
						<div className="hstack">
							<div className="hstack" style={{
														filter: "opacity(0.5)",
														gap: "0.5rem",
								}}>
								<IonIcon icon={timer} style={{
										fontSize: "2.25rem",
									}}
								/>
								<IonText>{recipe.cookTime} min</IonText>
							</div>
							{author && AuthorsAvatar(author)}
						</div>
						<div className="stack">
							<IonText className="title">Opis potrawy</IonText>
							<IonText>{recipe.description}</IonText>
						</div>
						<div className="stack">
							<IonText className="title">Składniki</IonText>
							<Skladniki recipe={recipe} />
						</div>
						<div className="stack">
							<IonText className="title">Przepis</IonText>
							{RecipeSteps(recipe)}
						</div>
						<div className="stack comments">
							<IonText className="title">Komentarze</IonText>
							<Komentarze recipe={recipe} />
						</div>
					</div>
				)}
			</IonContent>
			{ShareOptions()}
			{authentication.currentUser && (
				<PrzepisPW recipeId={id} ref={przepisPw} />
			)}
		</IonPage>
	);

	function ShareOptions() {
		return (
			<IonPopover
				isOpen={sharePopOver}
				onDidDismiss={() => setSharePopOver(false)}
				className="sharePopOver"
			>
				<IonList>
					<IonListHeader className="listHeader">Udostępnianie</IonListHeader>
					<div className="center">
						<div className="centerV">
							<FacebookShareButton url={urlToShare} quote={textToShare}>
								<FacebookIcon size={48} round />
							</FacebookShareButton>
							<IonText>Facebook</IonText>
						</div>

						<div className="centerV">
							<TwitterShareButton url={urlToShare} title={textToShare}>
								<TwitterIcon size={48} round />
							</TwitterShareButton>
							<IonText>Twitter</IonText>
						</div>
						<div className="centerV">
							<RedditShareButton url={urlToShare} title={textToShare}>
								<RedditIcon size={48} round />
							</RedditShareButton>
							<IonText>Reddit</IonText>
						</div>
					</div>
					<div className="center">
						<div className="centerV">
							<EmailShareButton
								url={urlToShare}
								subject={`${recipe?.recipeName} - Kulinarny Kącik`}
								body={textToShare}
							>
								<EmailIcon size={48} round />
							</EmailShareButton>
							<IonText>E-mail</IonText>
						</div>
						<div className="centerV">
							<PinterestShareButton
								media={
									recipe?.recipeUri ||
									"https://www.aesthetica.elblag.pl/wp-content/uploads/2019/10/placeholder.png"
								}
								url={urlToShare}
								title={textToShare}
							>
								<PinterestIcon size={48} round />
							</PinterestShareButton>
							<IonText>Pinterest</IonText>
						</div>
						<div
							className="centerV"
							onClick={() => shareVia("prywatnaWiadomosc")}
						>
							<LivejournalIcon size={48} round />
							<IonText>PW</IonText>
						</div>
					</div>
				</IonList>
			</IonPopover>
		);
	}
};

export default PrzepisInside;
function RecipeSteps(recipe: recipeObject) {
	return (
		<div className="kroki">
			{recipe.steps.map((step: any, index) => {
				return (
					<div key={index} className="recipeStep">
						<div className="recipeStepText">
							<IonText>{index + 1}.</IonText>
							<IonText>{step.opis}</IonText>
						</div>
						{step?.stepUri && (
							<div className="recipeImageContainer">
								<IonImg src={step.stepUri} alt="step" />
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

function BackButton(handleUdostepnij: () => void) {
	return (
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
			<IonTitle>Przepis</IonTitle>
			<IonButtons slot="end">
				<IonButton onClick={handleUdostepnij}>Udostępnij</IonButton>
			</IonButtons>
		</IonToolbar>
	);
}

function AuthorsAvatar(author: any) {
	return (
		<div className="autorHStack">
			<div className="stack">
				<IonText>{author.name}</IonText>
				<IonText>{author.surname}</IonText>
			</div>
			{author.photoURL ? (
				<IonAvatar className="avatarInPrzepis">
					<IonImg src={author.photoURL} />
				</IonAvatar>
			) : (
				<IonAvatar className="avatarInPrzepis centerNoAvatarInPrzepis">
					<IonText>
						{(author?.name?.charAt(0) || "N") +
							" " +
							(author?.surname?.charAt(0) || "N")}
					</IonText>
				</IonAvatar>
			)}
		</div>
	);
}
