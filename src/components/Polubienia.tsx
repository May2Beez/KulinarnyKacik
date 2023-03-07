import { IonIcon, IonText } from "@ionic/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { heart } from "ionicons/icons";
import { useEffect, useState } from "react";
import { changeRecipeData, fetchRecipes } from "../fetches/FetchFirestore";
import { authentication } from "../firebase-config.config";
import "./Polubienia.css";

interface props {
	recipeId: string;
}

const Polubienia: React.FC<props> = ({ recipeId }) => {
	const [liked, setLiked] = useState<boolean>(false);
	const [likes, setLikes] = useState<number>(0);

	const {
		isError: isErrorRecipes,
		isSuccess: isSuccessRecipes,
		isLoading: isLoadingRecipes,
		data: recipes,
		error: errorRecipes,
		refetch: refetchRecipes,
	} = useQuery(["recipes"], fetchRecipes, { staleTime: 3_600_000, retry: 2 });

	const setNewRecipeData = useMutation({
		mutationFn: (data: any) => {
			return changeRecipeData(data.recipeId, data.recipeData);
		},
		onSuccess: (data: any) => {
			refetchRecipes();
			const likes = data?.likes;
			if (!likes) return;

			setLikes(likes.length);
			setLiked(likes.includes(authentication.currentUser?.uid));
		},
	});

	const handleLike = () => {
		if (!authentication.currentUser) return;

		const likes = recipes?.filter((recipe: any) => recipe[0] === recipeId)[0][1]
			.likes;
		if (likes?.includes(authentication.currentUser.uid)) {
			const newLikes = likes.filter(
				(like: string) => like !== authentication.currentUser!.uid
			);
			console.log("newLikes", newLikes);
			setNewRecipeData.mutate({ recipeId, recipeData: { likes: newLikes } });
		} else {
			if (likes) {
				setNewRecipeData.mutate({
					recipeId,
					recipeData: { likes: [...likes, authentication.currentUser!.uid] },
				});
			} else {
				setNewRecipeData.mutate({
					recipeId,
					recipeData: { likes: [authentication.currentUser!.uid] },
				});
			}
		}
	};

	useEffect(() => {
		const likes = recipes?.filter((recipe: any) => recipe[0] === recipeId)[0][1]
			.likes;
		if (likes?.length > 0) {
			setLikes(likes.length);
			if (authentication.currentUser) {
				if (likes.includes(authentication.currentUser.uid)) {
					setLiked(true);
				}
			}
		}
	}, []);

	return (
		<div className="flex-column">
			<IonText>Polubienia</IonText>
			<div className="centerPolubienia">
				<IonText className="bigger-text">{likes}x</IonText>
				<IonIcon
					onClick={handleLike}
					style={{
						color: liked ? "red" : "var(--ion-color-dark)",
					}}
					className="bigger-text heartIcon"
					icon={heart}
				/>
			</div>
		</div>
	);
};

export default Polubienia;
