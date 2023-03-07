import {
	IonAvatar,
	IonButton,
	IonCard,
	IonContent,
	IonImg,
	IonLoading,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	IonSpinner,
	IonText,
} from "@ionic/react";
import _ from "lodash";
import { useEffect, useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useHistory } from "react-router";
import { authentication } from "../firebase-config.config";
import "./Konto.css";
import { fetchRecipes, fetchUserData } from "../fetches/FetchFirestore";
import { useQuery } from "@tanstack/react-query";

const Konto: React.FC = () => {
	const [loggedUser, isLoadingAuth, error] = useAuthState(authentication);

	const { data: recipes } = useQuery(["recipes"], fetchRecipes, {
		staleTime: 3_600_000,
		retry: 2,
	});

	const [userStatistics, setUserStatistics] = useState<any>({
		iloscPrzepisow: 0,
		iloscPolubien: 0,
		iloscKomentarzy: 0,
	});

	const {
		isLoading: isLoadingUserData,
		data: userData,
		refetch: refetchUserData,
	} = useQuery(
		["userData"],
		() => loggedUser && fetchUserData(loggedUser.uid),
		{ staleTime: 3_600_000, retry: 2 }
	);

	const history = useHistory();

	const handleLogout = async () => {
		authentication
			.signOut()
			.then(() => {
				history.push("/");
				window.location.reload();
			})
			.catch((err) => {
				console.log(err);
			});
	};

	const handleChangeData = () => {
		history.push("/ZmianaDanych");
	};

	const getInfo = (resolve: any) => {
		if (loggedUser) {
			refetchUserData();
		}
		if (loggedUser && userData) {
			setUserStatistics(countUserStats);
		}
		resolve();
	};

	const countUserStats = useMemo(() => {
		if (loggedUser) {
			const stats = {
				iloscPrzepisow: 0,
				iloscPolubien: 0,
				iloscKomentarzy: 0,
			};
			let iloscPrzepisow = 0;
			let iloscPolubien = 0;
			let iloscKomentarzy = 0;
			if (recipes) {
				recipes.map((obj: any) => {
					const recipe = obj[1];
					if (recipe.creator === loggedUser.uid) {
						iloscPrzepisow++;
						iloscPolubien += recipe.likes?.length || 0;
						iloscKomentarzy += recipe.comments?.length || 0;
					}
				});
				stats["iloscPrzepisow"] = iloscPrzepisow;
				stats["iloscPolubien"] = iloscPolubien;
				stats["iloscKomentarzy"] = iloscKomentarzy;
			}
			return stats;
		}
	}, [userData, recipes, loggedUser]);

	useEffect(() => {
		if (loggedUser && userData) {
			setUserStatistics(countUserStats);
		}
	}, [userData, recipes]);

	return (
		<IonPage>
			<IonContent fullscreen>
			<IonRefresher
				slot="fixed"
				pullFactor={0.5}
				pullMin={50}
				pullMax={200}
				onIonRefresh={(e) => getInfo(e.detail.complete)}
			>
				<IonRefresherContent
					pullingIcon="arrow-dropdown"
					pullingText="Puść by odświeżyć"
					refreshingSpinner="bubbles"
					refreshingText="Odświeżanie..."
				></IonRefresherContent>
			</IonRefresher>
				<IonLoading
					isOpen={isLoadingAuth}
					message="Proszę czekać..."
				/>
				{!isLoadingAuth && (
					<div className="centerContent" style={{ marginTop: "0.5rem" }}>
						<IonCard className="cardStyle centerContent">
							{loggedUser?.photoURL ? (
								<IonAvatar className="avatarStyle">
									<IonImg
										src={loggedUser.photoURL}
									/>
								</IonAvatar>
							) : userData?.data.name ? (
								<IonAvatar className="avatarStyle centerNoAvatar">
									<IonText>
										{userData?.data.name?.charAt(0) +
											" " +
											userData?.data.surname?.charAt(0)}
									</IonText>
								</IonAvatar>
							) : (
								<IonAvatar className="avatarStyle centerNoAvatar">
									<IonText>BI</IonText>
								</IonAvatar>
							)}
							<IonText className="textStyle">
								Witaj {userData?.data.name || "Bezimienny"}!
							</IonText>

							<IonText className="textStyle smallerText">
								Twoje statystyki:
							</IonText>

							<div className="statsContainer">
								<IonCard className="cardItem">
									<IonText className="textStyle smallestText">
										Utworzone przepisy kulinarne
									</IonText>
									<IonText className="textStyle smallerText">
										{userStatistics.iloscPrzepisow}
									</IonText>
								</IonCard>

								<IonCard className="cardItem">
									<IonText className="textStyle smallestText">
										Polubienia pod przepisami
									</IonText>
									<IonText className="textStyle smallerText">
										{userStatistics.iloscPolubien}
									</IonText>
								</IonCard>

								<IonCard className="cardItem">
									<IonText className="textStyle smallestText">
										Komentarze pod przepisami
									</IonText>
									<IonText className="textStyle smallerText">
										{userStatistics.iloscKomentarzy}
									</IonText>
								</IonCard>
							</div>
						</IonCard>
						<div className="buttons">
							<IonButton
								color="success"
								expand="block"
								onClick={handleChangeData}
							>
								Zmień dane
							</IonButton>
							<IonButton expand="block" onClick={handleLogout}>
								Wyloguj
							</IonButton>
						</div>
					</div>
				)}
			</IonContent>
		</IonPage>
	);
};

export default Konto;
