import {
	IonAvatar,
	IonContent,
	IonImg,
	IonSearchbar,
	IonText,
	useIonPopover,
} from "@ionic/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { fetchUsers } from "../fetches/FetchFirestore";
import { authentication } from "../firebase-config.config";

interface props {
	callback: (uid: string) => void;
}

const FindUser: React.FC<props> = ({ callback }) => {
	const [loggedUser, isLoadingAuth, error] = useAuthState(authentication);
	const [present, dismiss] = useIonPopover(() => (
		<IonContent
			style={{
				"--width": "0",
			}}
		>
			{users
				?.filter(
					(user) =>
						user[0] !== loggedUser?.uid &&
						(user?.[1]?.name + " " + user?.[1]?.surname)
							.toLowerCase()
							.includes(searchForUser?.toLowerCase() || "")
				)
				.map((user) => (
					<div
						key={user[0]}
						onClick={() => {
							callback(user[0]);
							setSearchForUser("");
							dismiss();
						}}
						style={{
							display: "flex",
							alignItems: "center",
							margin: "0.5rem",
							gap: "0.5rem",
							width: "max-content",
						}}
						className="chat-head"
					>
						{user?.[1]?.photoURL ? (
							<IonAvatar className="avatar">
								<IonImg src={user[1].photoURL} />
							</IonAvatar>
						) : user?.[1]?.name ? (
							<IonAvatar className="avatar centerNoPhoto">
								<IonText>
									{user?.[1]?.name.charAt(0) +
										" " +
										user?.[1]?.surname.charAt(0)}
								</IonText>
							</IonAvatar>
						) : (
							<IonAvatar className="avatar centerNoPhoto">
								<IonText>BI</IonText>
							</IonAvatar>
						)}
						<IonText>{user[1].name + " " + user[1].surname}</IonText>
					</div>
				))}
		</IonContent>
	));

	const { data: users } = useQuery(["users"], fetchUsers, {
		staleTime: 3_600_000,
		retry: 2,
	});

	const [searchForUser, setSearchForUser] = useState<string>();

	return (
		<>
			<IonSearchbar
				id="search-for-user"
				debounce={500}
				placeholder="Znajdź osobę do popisania"
				value={searchForUser}
				onIonChange={(e) => {
					setSearchForUser(e.detail.value!);
					if (e.detail.value?.trim() !== "")
						present({
							event: e,
							alignment: "center",
							showBackdrop: false,
							keyboardClose: false,
						});
				}}
			></IonSearchbar>
		</>
	);
};

export default FindUser;
