import {
	getPlatforms,
	IonAvatar,
	IonBackButton,
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonContent,
	IonImg,
	IonItem,
	IonSpinner,
	IonText,
	IonTextarea,
} from "@ionic/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import moment from "moment";
import { createRef, useEffect, useRef, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import Moment from "react-moment";
import {
	addMessageToConversation,
	fetchMessages,
	fetchRecipes,
	fetchUsers,
} from "../../../fetches/FetchFirestore";
import { authentication } from "../../../firebase-config.config";
import "moment/locale/pl";
import ChatHeads from "./ChatHeads";
import { useHistory } from "react-router";
import axios from "axios";
import { DEFAULT_ICON } from "../../../App";

interface props {
	receiver: string;
}

const Konwersacja: React.FC<props> = ({ receiver }) => {
	const [loggedUser, isLoadingAuth, error] = useAuthState(authentication);
	const [messagesWithUser, setMessagesWithUser] = useState<any[]>([]);
	const messageRef = useRef<HTMLIonTextareaElement>(null);
	const [conversationId, setConversationId] = useState<string>("");
	const contentRef = createRef<HTMLIonContentElement>();

	const history = useHistory();

	const { data: users } = useQuery(["users"], fetchUsers, {
		staleTime: 3_600_000,
		retry: 2,
	});

	const {
		isError: isErrorRecipes,
		isSuccess: isSuccessRecipes,
		isLoading: isLoadingRecipes,
		data: recipes,
		error: errorRecipes,
		refetch: refetchRecipes,
	} = useQuery(["recipes"], fetchRecipes, { staleTime: 3_600_000, retry: 2 });

	const { data: messages, refetch: refetchMessages } = useQuery(
		["messages"],
		fetchMessages,
		{ staleTime: 3_600_000, retry: 2 }
	);

	const addMessage = useMutation({
		mutationFn: (message: any) =>
			addMessageToConversation(conversationId, message),
		onSuccess: () => {
			refetchMessages();
			messageRef.current?.setFocus();
			messageRef.current!.value = "";
		},
	});

	const sendMessage = (e: any = null) => {
		if (e) e.preventDefault();
		if (messageRef.current?.value?.trim()) {
			const message = {
				creator: loggedUser?.uid,
				message: messageRef.current.value,
				createdAt: new Date().getTime(),
			};

			addMessage.mutateAsync(message).then(async () => {
				// send fcm notification
				const userTokens = users?.find((user) => user[0] === receiver)?.[1]
					?.tokens;

				if (!userTokens || userTokens?.length == 0) return;

				const userMe = users?.find((user) => user[0] === loggedUser?.uid)?.[1];

				Object.values(userTokens).forEach(async (token: any) => {
					await axios.post(
						"https://KulinarnyKacik.may2beez.repl.co/sendNotif",
						{
							message: {
								token: token,
								notification: {
									title: `${userMe?.name} ${userMe?.surname}`,
									body: message.message,
									image:
										userMe?.photoURL ||
										DEFAULT_ICON,
									badge: "1",
									color: "#f9a825",
									icon: DEFAULT_ICON,
								},
								android: {
									notification: {
										color: "#f9a825",
										icon: DEFAULT_ICON,
										imageUrl: userMe?.photoURL || DEFAULT_ICON,
									},
								},
								apns: {
									payloud: {
										aps: {
											"mutable-content": 1,
										}
									},
									fcm_options: {
										image: userMe?.photoURL || DEFAULT_ICON,
									}
								},
								webpush: {
									headers: {
										image: userMe?.photoURL || DEFAULT_ICON,
									}
								}
							},
						},
						{
							headers: {
								"Content-Type": "application/json",
							},
						}
					);
				});
			});
		}
	};

	useEffect(() => {
		if (messages && receiver && loggedUser) {
			const messagesWithUser = messages.find(
				(message) =>
					message[0].includes(receiver) && message[0].includes(loggedUser.uid)
			);
			if (messagesWithUser?.[1]?.conversation?.length > 0) {
				setMessagesWithUser(messagesWithUser?.[1]?.conversation);
				setConversationId(messagesWithUser?.[0] || "");
			} else {
				setConversationId([receiver, loggedUser.uid].sort().join("") || "");
			}
		}
	}, [messages, receiver, loggedUser]);

	useEffect(() => {
		if (messagesWithUser.length > 0) {
			contentRef.current?.scrollToBottom(250);
		}
	}, [messagesWithUser]);

	useEffect(() => {
		if (messagesWithUser.length > 0) {
			contentRef.current?.scrollToBottom(250);
		}
	}, []);

	if (receiver == "") {
		if (getPlatforms().includes("desktop")) {
			return (
				<IonContent>
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
						}}
					>
						<IonText
							style={{
								fontSize: "1.5rem",
								fontWeight: "bold",
							}}
						>
							Wybierz konwersację do rozmowy
						</IonText>
					</div>
				</IonContent>
			);
		} else {
			return (
				<div className="chat-heads mobile-full-screen">
					<ChatHeads receiver={receiver} />
				</div>
			);
		}
	}

	const user = users?.find((user) => user[0] == receiver);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
			}}
		>
			<div className="user-info">
				{!getPlatforms().includes("desktop") && (
					<IonBackButton
						defaultHref="/Wiadomosci"
						color="primary"
						style={{ marginLeft: "0.5rem", alignSelf: "center" }}
					/>
				)}
				{user?.[1]?.photoURL ? (
					<IonAvatar className="avatar">
						<IonImg
							src={user[1].photoURL}
						/>
					</IonAvatar>
				) : user?.[1]?.name ? (
					<IonAvatar className="avatar centerNoPhoto">
						<IonText>
							{user?.[1]?.name.charAt(0) + " " + user?.[1]?.surname.charAt(0)}
						</IonText>
					</IonAvatar>
				) : (
					<IonAvatar className="avatar centerNoPhoto">
						<IonText>BI</IonText>
					</IonAvatar>
				)}
				{user?.[1]?.name ? (
					<IonText className="name">
						{user?.[1]?.name} {user?.[1]?.surname}
					</IonText>
				) : (
					<IonText className="name">Brak nazwy</IonText>
				)}
			</div>
			<IonContent ref={contentRef}>
				<div className="messagesContainer">
					{messagesWithUser &&
						loggedUser &&
						messagesWithUser.map((message) => {
							return (
								<IonItem
									color={
										message.creator === loggedUser.uid ? "primary" : "light"
									}
									key={message.createdAt}
									className={
										"messageBox" +
										(message.creator === loggedUser.uid ? " creator" : "")
									}
								>
									<div className="flex">
										<div className="flex-row">
											{message.creator === loggedUser.uid ? (
												<>
													<IonText className="messageTime">
														<Moment
															local
															locale="pl"
															format={
																moment(message.createdAt).isSame(
																	new Date(),
																	"day"
																)
																	? "HH:mm"
																	: "DD.MM.YYYY HH:mm"
															}
														>
															{message.createdAt}
														</Moment>
													</IonText>
													<IonText className="messageUserName">
														{
															users?.find(
																(user) => user[0] === message.creator
															)?.[1]?.name
														}
													</IonText>
												</>
											) : (
												<>
													<IonText className="messageUserName">
														{
															users?.find(
																(user) => user[0] === message.creator
															)?.[1]?.name
														}
													</IonText>
													<IonText className="messageTime">
														<Moment format="HH:mm">{message.createdAt}</Moment>
													</IonText>
												</>
											)}
										</div>
										{message?.type === "recipe" ? (
											<div>
												<IonText>Hej, spójrz na ten przepis!</IonText>
												<IonCard className="clickablePrzepis">
													<div
														className="cardContent"
														onClick={() =>
															history.push(`/Przepis/${message.message}`)
														}
													>
														<IonImg
															src={
																recipes?.find(
																	(recipe) => recipe[0] === message.message
																)?.[1]?.recipeUri ||
																"https://www.aesthetica.elblag.pl/wp-content/uploads/2019/10/placeholder.png"
															}
															alt="recipe"
															className="smallerImage"
														/>
														<IonText className="PWPrzepisName" color="dark">
															{
																recipes?.find(
																	(recipe) => recipe[0] === message.message
																)?.[1].recipeName
															}
														</IonText>
													</div>
												</IonCard>
											</div>
										) : (
											<IonText>{message.message}</IonText>
										)}
									</div>
								</IonItem>
							);
						})}
				</div>
			</IonContent>
			<div className="sendMessageContainer">
				<IonTextarea
					onKeyPress={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							sendMessage();
						}
					}}
					autofocus={true}
					inputMode={"text"}
					placeholder={"Aa..."}
					spellCheck={true}
					wrap={"soft"}
					ref={messageRef}
				></IonTextarea>
				<IonButton onClick={sendMessage}>Wyślij</IonButton>
			</div>
		</div>
	);
};

export default Konwersacja;
