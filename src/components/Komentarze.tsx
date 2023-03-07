import {
	IonButton,
	IonCard,
	IonIcon,
	IonText,
	IonTextarea,
	useIonAlert,
} from "@ionic/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trashBin } from "ionicons/icons";
import _ from "lodash";
import { useEffect, useState } from "react";
import {
	addCommentToRecipe,
	fetchCommentsOfRecipe,
	fetchUsers,
	removeCommentFromRecipe,
} from "../fetches/FetchFirestore";
import { authentication } from "../firebase-config.config";
import { recipeObject } from "../pages/subpages/Przepisy/PrzepisInside";
import "./Komentarze.css";

interface props {
	recipe: recipeObject;
}

const Komentarze: React.FC<props> = ({ recipe }) => {
	const [komentarz, setKomentarz] = useState<string>("");
	const [sortedKomentarze, setSortedKomentarze] = useState<any[]>([]);
	const [present] = useIonAlert();

	const { data: users } = useQuery(["users"], fetchUsers, {
		staleTime: 3_600_000,
		retry: 2,
	});

	const { data: comments, refetch: refetchComments } = useQuery(
		[`comments-${recipe.id}`],
		() => fetchCommentsOfRecipe(recipe.id),
		{ staleTime: 3_600_000, retry: 2 }
	);

	const currentUser = users?.find((user: any) => user[0] === authentication?.currentUser?.uid)?.[1] || null;

	const addComment = useMutation({
		mutationFn: (newComment: any) => addCommentToRecipe(recipe.id, newComment),
		onSuccess: () => {
			refetchComments();
			present({
				header: "Komentarz dodany",
				message: "Twój komentarz został dodany",
				buttons: ["OK"],
			});
		},
	});

	const deleteComment = useMutation({
		mutationFn: (commentId: string) =>
			removeCommentFromRecipe(recipe.id, commentId),
		onSuccess: () => {
			refetchComments();
			present({
				header: "Usunięto komentarz",
				message: "Komentarz został usunięty",
				buttons: ["OK"],
			});
		},
		onError: () => {
			present({
				header: "Błąd",
				message: "Nie udało się usunąć komentarza",
				buttons: ["OK"],
			});
		},
	});

	const handleAddComment = () => {
		if (komentarz.trim().length == 0) return;

		const newComment = {
			createdAt: Date.now(),
			creator: authentication.currentUser?.uid,
			comment: komentarz,
		};

		addComment.mutate(newComment);
	};

	const handleDeleteComment = (comment: any) => {
		present({
			header: "Usuwanie komentarza",
			message: "Czy na pewno chcesz usunąć komentarz?",
			buttons: [
				{
					text: "Anuluj",
					role: "cancel",
					cssClass: "secondary",
				},
				{
					text: "Usuń",
					handler: () => {
						deleteComment.mutate(comment);
					},
				},
			],
		});
	};

	useEffect(() => {
		const sortedComs = _.sortBy(
			comments,
			(comment: any) => comment.createdAt
		).reverse();
		setSortedKomentarze(sortedComs);
	}, [comments]);

	return (
		<div className="centerComments">
			{currentUser && (
				<div>
					<IonTextarea
						disabled={!currentUser?.name || !currentUser?.surname}
						value={komentarz}
						onIonChange={(e: any) => {
							setKomentarz(e.target.value);
						}}
						className="commentInput"
						placeholder={
							!currentUser?.name || !currentUser?.surname
								? "Uzupełnij swoje dane przed dodaniem komentarza"
								: "Wpisz komentarz..."
						}
					></IonTextarea>
					<IonButton
						onClick={handleAddComment}
						color="success"
						expand="block"
						className="addComment"
					>
						Dodaj komentarz
					</IonButton>
				</div>
			)}
			{_.isEmpty(sortedKomentarze) ? (
				<IonText className="noComments">Brak komentarzy... 😞</IonText>
			) : (
				sortedKomentarze.map((obj: any) => {
					const index = obj[0];
					const comment = obj[1];
					const author = users?.find((user: any) => user[0] == comment.creator);
					return (
						<IonCard className="commentCard" key={index}>
							<div className="stack">
								<div className="authorAndDate">
									{author ? (
										<IonText className="commentAuthor">
											{author[1].name + " " + author[1].surname}
										</IonText>
									) : (
										<IonText className="commentAuthor">{"Nieznany"}</IonText>
									)}
									<IonText className="dateText">
										{new Intl.DateTimeFormat("pl-PL", {
											day: "numeric",
											month: "long",
											year: "numeric",
											hour: "numeric",
											minute: "numeric",
											second: "numeric",
										}).format(new Date(comment.createdAt))}
									</IonText>
								</div>
								<div className="tresc hstack between">
									<IonText className="biggerText">{comment.comment}</IonText>
									{comment.creator === authentication.currentUser?.uid && (
										<IonButton
											onClick={() => handleDeleteComment(index)}
											size={"small"}
											slot="icon-only"
											style={{
												width: "2.5rem",
												height: "2.5rem",
											}}
											color="danger"
										>
											<IonIcon
												style={{
													fontSize: "5rem",
												}}
												icon={trashBin}
											/>
										</IonButton>
									)}
								</div>
							</div>
						</IonCard>
					);
				})
			)}
		</div>
	);
};

export default Komentarze;
