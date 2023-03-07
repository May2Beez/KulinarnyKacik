import {
	getPlatforms,
	IonButton,
	IonCard,
	IonCardContent,
	IonContent,
	IonHeader,
	IonIcon,
	IonModal,
	IonText,
	useIonAlert,
} from "@ionic/react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { checkmark, closeSharp } from "ionicons/icons";
import { authentication } from "../firebase-config.config";
import _ from "lodash";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	addMessageToConversation,
	fetchMessages,
	fetchUsers,
} from "../fetches/FetchFirestore";
import FindUser from "./FindUser";

interface Props {
	recipeId: string;
}

const PrzepisPW = forwardRef(({ recipeId, ...props }: Props, ref) => {
	const [showModal, setShowModal] = useState(false);
	const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

	const [presentAlert] = useIonAlert();

	const { data: messages, refetch: refetchMessages } = useQuery(
		["messages"],
		fetchMessages,
		{ staleTime: 3_600_000, retry: 2 }
	);

	const {
		data: users,
	} = useQuery(["users"], fetchUsers, { staleTime: 3_600_000, retry: 2 });

	useImperativeHandle(ref, () => ({
		openPopover: () => {
			setShowModal(true);
		},
		closePopover: () => {
			setShowModal(false);
		},
	}));

	const addMessage = useMutation({
		mutationFn: (data: any) =>
			addMessageToConversation(data.conversationId, data.message),
		onSuccess: () => {
			refetchMessages();
			presentAlert({
				header: "Sukces",
				message: "Przepis został wysłany!",
				buttons: [
					{
						text: "OK",
						handler: () => {
							setSelectedUsers([]);
						},
					},
				],
			});
		},
		onError: (error: any) => {
			presentAlert({
				header: "Błąd",
				message: error.message,
				buttons: [
					{
						text: "OK",
						handler: () => {
							setSelectedUsers([]);
						},
					},
				],
			});
		},
	});

	return (
		<>
			<IonModal
				isOpen={showModal}
				onDidDismiss={() => {
					setShowModal(false);
					setSelectedUsers([]);
				}}
				keyboardClose={false}
				className="przepisPwModal"
			>
				{!getPlatforms().includes("desktop") && (
					<IonButton
						fill="clear"
						onClick={() => {
							setShowModal(false);
							setSelectedUsers([]);
						}}
						style={{
							position: "absolute",
							top: "0",
							left: "0",
							zIndex: 100,
							fontSize: "1.25rem",
							margin: "1rem 0",
						}}
					>
						<IonIcon icon={closeSharp} />
					</IonButton>
				)}
				<IonHeader
					style={{
						fontSize: "1.5rem",
						fontWeight: "bold",
						textAlign: "center",
						padding: "1rem",
					}}
				>
					Wyślij do
				</IonHeader>

				<FindUser
					callback={(user) => {
						if (!selectedUsers.includes(user)) {
							setSelectedUsers([...selectedUsers, user]);
						}
					}}
				/>
				<IonButton
					style={{
						margin: "1rem",
						width: "fit-content",
						alignSelf: "center",
					}}
					disabled={selectedUsers.length === 0}
					onClick={() => {
						selectedUsers.forEach((element) => {
							const messageObj = {
								type: "recipe",
								message: recipeId,
								creator: authentication.currentUser!.uid,
								createdAt: Date.now(),
							};

							const conversationId = messages?.find(
								(message) =>
									message?.[0].includes(element) &&
									message?.[0].includes(authentication.currentUser!.uid)
							)?.[0];

							if (conversationId) {
								addMessage.mutate({
									conversationId,
									message: messageObj,
								});
							} else {
								addMessage.mutate({
									conversationId: [element, authentication.currentUser!.uid]
										.sort()
										.join("")
										.toString(),
									message: messageObj,
								});
							}
						});
					}}
				>
					<IonText>
						Wyślij{" "}
						{selectedUsers?.length
							? " do " + selectedUsers.length + " osób"
							: ""}
					</IonText>
				</IonButton>
				<IonContent className="wyslijPWContent">
					{selectedUsers &&
						users &&
						selectedUsers.map((obj) => {
							const user = users.find((u) => u[0] === obj);

							return (
								<IonCard
									key={obj}
									button
									style={{
										margin: "10px 30px",
									}}
									className={"selected"}
									onClick={() => {
										setSelectedUsers(selectedUsers.filter((u) => u !== obj));
									}}
								>
									<IonCardContent className="wyslijPWCard">
										<IonText>
											{user?.[1]?.name} {user?.[1]?.surname}
										</IonText>
										<IonIcon
											style={{
												fontSize: "1.25rem",
											}}
											icon={checkmark}
										/>
									</IonCardContent>
								</IonCard>
							);
						})}
				</IonContent>
			</IonModal>
		</>
	);
});

export default PrzepisPW;
