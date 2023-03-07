import { getPlatforms, IonContent, IonPage, IonSplitPane, IonTitle } from "@ionic/react";
import { useQuery } from "@tanstack/react-query";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { matchPath, useHistory, useParams } from "react-router";
import { fetchMessages, fetchUsers } from "../../../fetches/FetchFirestore";
import { authentication, db } from "../../../firebase-config.config";
import ChatHeads from "./ChatHeads";
import Konwersacja from "./Konwersacja";
import "./Messages.css";

const Messages: React.FC = () => {
	const history = useHistory();

	const [receiver, setReceiver] = useState("");
	const [loggedUser, isLoadingAuth, error] = useAuthState(authentication);

	const match = matchPath<{ receiver?: string }>(history.location.pathname, {
		path: "/Wiadomosci/:receiver",
	});

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
		if (!loggedUser) {
			history.push("/Logowanie");
		}
	}, [loggedUser]);

	useEffect(() => {
		refetchMessages();
	}, [loggedUser]);

	useEffect(() => {
		if (match?.params.receiver) {
			setReceiver(match.params.receiver);
		} else {
			setReceiver("");
		}
	}, [match?.params.receiver]);

	useEffect(() => {
		if (!loggedUser) return;

		const unsub = onSnapshot(collection(db, "messages"), (col) => {
			if (
				col
					.docChanges()
					.filter((change) => change.doc.id.includes(loggedUser.uid)).length > 0
			) {
				refetchMessages();
			}
		});
	}, []);

	if (getPlatforms().includes("desktop")) {
		return (
			<IonPage>
				<div className="chat-screen">
					<div className="half-screen chat-heads">
						<ChatHeads receiver={receiver} />
					</div>
					<div className="half-screen">
						<Konwersacja receiver={receiver} />
					</div>
				</div>
			</IonPage>
		);
	} else {
		return (
			<IonPage>
				<div className="chat-screen chat-screen-mobile">
					<Konwersacja receiver={receiver} />
				</div>
			</IonPage>
		);
	}
};

export default Messages;
