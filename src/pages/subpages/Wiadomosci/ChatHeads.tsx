import {
	getPlatforms,
	IonAvatar,
	IonContent,
	IonHeader,
	IonImg,
	IonSpinner,
	IonText,
} from "@ionic/react";
import { useQuery } from "@tanstack/react-query";
import { User } from "firebase/auth";
import _ from "lodash";
import moment from "moment";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useHistory } from "react-router";
import FindUser from "../../../components/FindUser";
import { fetchMessages, fetchUsers } from "../../../fetches/FetchFirestore";
import { authentication } from "../../../firebase-config.config";

interface props {
	receiver: string;
}

const ChatHeads: React.FC<props> = ({ receiver }) => {
	const [chatUsers, setChatUsers] = useState<[string, any][]>();

	const history = useHistory();
	const [loggedUser, isLoadingAuth, error] = useAuthState(authentication);

	const { data: users } = useQuery(["users"], fetchUsers, {
		staleTime: 3_600_000,
		retry: 2,
	});

	const { data: messages, refetch: refetchMessages } = useQuery(
		["messages"],
		fetchMessages,
		{ staleTime: 3_600_000, retry: 2 }
	);

	useEffect(() => {
		if (!users || !loggedUser || !messages) return;
		setChatUsers(
			_.sortBy(
				users.filter(
					(user) =>
						user[0] !== loggedUser.uid &&
						messages.find(
							(message) =>
								message[0].includes(user[0]) &&
								message[0].includes(loggedUser.uid)
						)
				),
				(user) => {
					const message = messages.find(
						(message) =>
							message[0].includes(user[0]) &&
							message[0].includes(loggedUser.uid)
					);
					return message?.[1]?.conversation?.[
						message[1].conversation.length - 1
					]?.createdAt;
				}
			).reverse()
		);
	}, [users, loggedUser, messages]);

	useEffect(() => {
		refetchMessages();
	}, [loggedUser]);

	return (
		<>
			<IonHeader
				style={{
					margin: "20px",
					fontSize: "1.5rem",
					fontWeight: "bold",
				}}
			>
				Czaty
			</IonHeader>
			<FindUser
				callback={(user) => {
					history.push(`/Wiadomosci/${user}`);
				}}
			/>
			<IonContent>
				{chatUsers?.length == 0 && (
					<IonText
						style={{ textAlign: "center", padding: "20px", marginTop: "15px" }}
					>
						Nie masz żadnych czatów
					</IonText>
				)}

				{loggedUser &&
					chatUsers?.map((user: any) => {
						const lastMessage = messages?.find(
							(message) =>
								message[0].includes(user[0]) &&
								message[0].includes(loggedUser.uid)
						)?.[1];

						return (
							ChatHead(user, history, receiver, lastMessage, loggedUser, users)
						);
					})}
			</IonContent>
		</>
	);
};

export default ChatHeads;
function ChatHead(user: any, history: any, receiver: string, lastMessage: any, loggedUser: User, users: [string, any][] | undefined): JSX.Element {
	return <div
		key={user?.[0]}
		onClick={() => history.push(`/Wiadomosci/${user?.[0]}`)}
		className={"chat-head" + (user?.[0] === receiver ? " receiver" : "")}
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
		<div className="name-and-last-message">
			{user?.[1]?.name ? (
				<IonText className="chat-head-name">
					{user?.[1]?.name + " " + user?.[1]?.surname}
				</IonText>
			) : (
				<IonText className="chat-head-name">
					{user?.[1]?.email}
				</IonText>
			)}
			{lastMessage && (
				<IonText className="last-message">
					{lastMessage?.conversation?.[lastMessage?.conversation?.length - 1]?.creator === loggedUser.uid
						? "Ty"
						: users?.find(
							(user) => user?.[0] ===
								lastMessage?.conversation?.[lastMessage?.conversation?.length - 1]?.creator
						)?.[1]?.name}
					:{" "}
					{lastMessage?.conversation?.[lastMessage?.conversation?.length - 1]?.type === "recipe"
						? "Wysłano przepis"
						: _.truncate(
							lastMessage?.conversation?.[lastMessage?.conversation?.length - 1]?.message,
							{ length: 10 }
						)}{" "}
					{" · "}{" "}
					{moment(
						lastMessage?.conversation?.[lastMessage?.conversation?.length - 1]?.createdAt
					).fromNow()}
				</IonText>
			)}
		</div>
	</div>;
}

