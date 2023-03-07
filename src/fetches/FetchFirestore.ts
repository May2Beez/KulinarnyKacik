import { useQuery } from "@tanstack/react-query";
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	QueryConstraint,
	setDoc,
	where,
} from "firebase/firestore";
import _ from "lodash";
import { db } from "../firebase-config.config";

export const fetchUsers = async () => {
	const q = collection(db, "users");
	const snapshot = await getDocs(q);
	let data: Map<string, any> = new Map();
	snapshot.forEach((doc) => {
		data.set(doc.id, doc.data());
	});
	console.log("Users: ", data);
	console.log("Users Array: ", Array.from(data));
	return Array.from(data);
};

export const fetchRecipes = async () => {
	const q = query(collection(db, "recipes"), orderBy("createdAt", "desc"));
	const snapshot = await getDocs(q);
	let data: Map<string, any> = new Map();
	snapshot.forEach((doc) => {
		const tmpData = doc.data();
		tmpData.comments = [];
		const docRef = collection(db, "recipes", doc.id, "comments");
		getDocs(docRef).then((comments) => {
			comments.forEach((comment) => {
				tmpData.comments.push(comment.data());
			});
		});
		data.set(doc.id, tmpData);
	});
	console.log("Recipes: ", data);
	console.log("Recipes Array: ", Array.from(data));
	return Array.from(data);
};

export const fetchMessages = async () => {
	const q = collection(db, "messages");
	const snapshot = await getDocs(q);
	let data: Map<string, any> = new Map();
	snapshot.forEach((doc) => {
		data.set(doc.id, doc.data());
	});
	console.log("Messages: ", data);
	console.log("Messages Array: ", Array.from(data));
	return Array.from(data);
};

export const addMessageToConversation = async (
	conversationId: string,
	message: any
) => {
	const docRef = doc(db, "messages", conversationId);
	const docSnap = await getDoc(docRef);
	if (docSnap.exists()) {
		const data = docSnap.data();
		if (data?.conversation) {
			data.conversation.push(message);
			await setDoc(docRef, data);
		} else {
			await setDoc(docRef, {...data, conversation: [message] });
		}
	} else {
		await setDoc(docRef, { conversation: [message] });
	}
};

export const fetchPublicRecipes = async () => {
	const q = query(
		collection(db, "recipes"),
		orderBy("createdAt", "desc"),
		where("public", "==", true)
	);
	const snapshot = await getDocs(q);
	let data: Map<string, any> = new Map();
	snapshot.forEach((doc) => {
		data.set(doc.id, doc.data());
	});
	console.log("Public Recipes: ", data);
	console.log("Public Recipes Array: ", Array.from(data));
	return Array.from(data);
};

export const fetchIngredients = async () => {
	const q = query(collection(db, "ingredients"), orderBy("name", "asc"));
	const snapshot = await getDocs(q);
	let data: Map<string, any> = new Map();
	snapshot.forEach((doc) => {
		data.set(doc.id, doc.data());
	});
	console.log("Ingredients: ", data);
	console.log("Ingredients Array: ", Array.from(data));
	return Array.from(data);
};

export const fetchUserData = async (uid: string) => {
	const q = doc(db, "users", uid);
	const snapshot = await getDoc(q);
	const data: any = {};
	data["data"] = snapshot.data();
	const coll = collection(db, "users", uid, "recipesList");
	const recipes = await getDocs(coll);
	let recipesData: string[] = [];
	recipes.forEach((doc) => {
		recipesData.push(doc.id);
	});
	data["data"]["recipesList"] = Array.from(recipesData);
	console.log("User data: ", data);
	return data;
};

export const saveUserData = async (uid: string, data: any) => {
	const q = doc(db, "users", uid);
	const snapshot = await getDoc(q);
	const userData = snapshot.data();
	const newData = { ...userData, ...data };
	await setDoc(q, newData);
	console.log("User data saved: ", newData);
	return newData;
};

export const addRecipeToUserList = async (uid: string, recipeId: string) => {
	const q = doc(db, "users", uid, "recipesList", recipeId);
	await setDoc(q, { null: null });
	console.log("Recipe added to user list: ", recipeId);
};

export const deleteRecipeFromUserList = async (
	uid: string,
	recipeId: string
) => {
	const q = doc(db, "users", uid, "recipesList", recipeId);
	await deleteDoc(q);
	console.log("Recipe deleted from user list: ", recipeId);
};

export const changeRecipeData = async (id: string, data: any) => {
	console.log(data);
	const q = doc(db, "recipes", id);
	const snapshot = await getDoc(q);
	const recipeData = snapshot.data();
	const newData = { ...recipeData, ...data };
	await setDoc(q, newData);
	console.log("Recipe data changed: ", newData);
	return newData;
};

export const addIngredientMut = async (data: any) => {
	const q = collection(db, "ingredients");
	const docRef = await addDoc(q, data);
	console.log("New ingredient added: ", docRef.id);
	return docRef.id;
};

export const deleteRecipe = async (id: string) => {
	const q = doc(db, "recipes", id);
	await deleteDoc(q);
	console.log("Recipe deleted: ", id);
	return id;
};

export const fetchRecipesWithOptions = async (options: {
	[key: string]: any;
}) => {
	const col = collection(db, "recipes");
	const snapshot = await getDocs(col);
	let data: Map<string, any> = new Map();
	snapshot.forEach((doc) => {
		data.set(doc.id, doc.data());
	});

	let filteredData: Map<string, any> = new Map(data);

	if (options?.public) {
		filteredData = new Map(
			Array.from(filteredData).filter((item) => item[1].public)
		);
	}

	if (options?.category) {
		filteredData = new Map(
			Array.from(filteredData).filter(
				(item) => item[1].category === options.category
			)
		);
	}

	if (options?.cookTime) {
		if (options?.cookTime.cookTimeMoreThan) {
			filteredData = new Map(
				Array.from(filteredData).filter(
					(item) => item[1].cookTime >= options.cookTime.cookTimeMoreThan
				)
			);
		}

		if (options?.cookTime.cookTimeLessThan) {
			filteredData = new Map(
				Array.from(filteredData).filter(
					(item) => item[1].cookTime <= options.cookTime.cookTimeLessThan
				)
			);
		}
	}

	if (options?.diet) {
		filteredData = new Map(
			Array.from(filteredData).filter((item) => item[1].diet === options.diet)
		);
	}

	if (options?.okazja) {
		filteredData = new Map(
			Array.from(filteredData).filter(
				(item) => item[1].okazja === options.okazja
			)
		);
	}

	if (options?.ingredients) {
		filteredData = new Map(
			Array.from(filteredData).filter((item) => {
				let ingredients = item[1].ingredients;
				return options.ingredients.every((ingredient: string) => {
					return ingredients.includes(ingredient);
				});
			})
		);
	}

	let sortedData = Array.from(filteredData);

	if (options?.newest) {
		sortedData = _.sortBy(Array.from(filteredData), (o) => {
			return o[1]["createdAt"];
		}).reverse();
	}
	if (options?.oldest) {
		sortedData = _.sortBy(Array.from(filteredData), (o) => {
			return o[1]["createdAt"];
		});
	}
	return Array.from(sortedData);
};

export const fetchRecipesAddedByUser = async (
	uid: string,
	options: { [key: string]: any }
) => {
	const recipesListColl = collection(db, "users", uid, "recipesList");
	const recipesListSnapshot = await getDocs(recipesListColl);
	let recipesList: string[] = [];
	recipesListSnapshot.forEach((doc) => {
		recipesList.push(doc.id);
	});
	const userRecipes = recipesList;
	const col = collection(db, "recipes");
	const snapshot = await getDocs(col);
	let data: Map<string, any> = new Map();
	snapshot.forEach((doc) => {
		data.set(doc.id, doc.data());
	});

	let filteredData: Map<string, any> = new Map(data);

	filteredData = new Map(
		Array.from(filteredData).filter((item) => {
			return userRecipes.includes(item[0]);
		})
	);

	console.log(filteredData);

	if (options?.category) {
		filteredData = new Map(
			Array.from(filteredData).filter(
				(item) => item[1].category === options.category
			)
		);
	}

	if (options?.cookTime) {
		if (options?.cookTime.cookTimeMoreThan) {
			filteredData = new Map(
				Array.from(filteredData).filter(
					(item) => item[1].cookTime >= options.cookTime.cookTimeMoreThan
				)
			);
		}

		if (options?.cookTime.cookTimeLessThan) {
			filteredData = new Map(
				Array.from(filteredData).filter(
					(item) => item[1].cookTime <= options.cookTime.cookTimeLessThan
				)
			);
		}
	}

	if (options?.diet) {
		filteredData = new Map(
			Array.from(filteredData).filter((item) => item[1].diet === options.diet)
		);
	}

	if (options?.okazja) {
		filteredData = new Map(
			Array.from(filteredData).filter(
				(item) => item[1].okazja === options.okazja
			)
		);
	}

	if (options?.ingredients) {
		filteredData = new Map(
			Array.from(filteredData).filter((item) => {
				let ingredients = item[1].ingredients;
				return options.ingredients.every((ingredient: string) => {
					return ingredients.includes(ingredient);
				});
			})
		);
	}
	let sortedData = Array.from(filteredData);

	if (options?.newest) {
		sortedData = _.sortBy(Array.from(filteredData), (o) => {
			return o[1]["createdAt"];
		}).reverse();
	}
	if (options?.oldest) {
		sortedData = _.sortBy(Array.from(filteredData), (o) => {
			return o[1]["createdAt"];
		});
	}
	return Array.from(sortedData);
};

export const fetchCommentsOfRecipe = async (id: string) => {
	const col = collection(db, `recipes/${id}/comments`);
	const snapshot = await getDocs(col);
	let data: Map<string, any> = new Map();
	snapshot.forEach((doc) => {
		data.set(doc.id, doc.data());
	});
	console.log("Comments of recipe: ", data);
	console.log("Comments of recipe Array: ", Array.from(data));
	return Array.from(data);
};

export const addCommentToRecipe = async (id: string, data: any) => {
	const col = collection(db, `recipes/${id}/comments`);
	const docRef = await addDoc(col, data);
	console.log("Comment added to recipe: ", docRef.id);
	return docRef.id;
};

export const removeCommentFromRecipe = async (
	id: string,
	commentId: string
) => {
	const docRef = doc(db, `recipes/${id}/comments`, commentId);
	await deleteDoc(docRef);
	console.log("Comment removed from recipe: ", commentId);
	return commentId;
};

export const generateRecipeId = async () => {
	const col = collection(db, "recipes");
	const docRef = await addDoc(col, {});
	console.log("Generated recipe id: ", docRef.id);
	return docRef.id;
};
