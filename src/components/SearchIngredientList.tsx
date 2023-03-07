import {
	IonContent,
	IonItem,
	IonLabel,
	IonList,
	IonPopover,
	IonTitle,
} from "@ionic/react";
import { useQuery } from "@tanstack/react-query";
import _ from "lodash";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { fetchIngredients } from "../fetches/FetchFirestore";

interface props {
	searchText: string;
    selectIngredient: (ingredient: any) => void;
}

const SearchIngredientList = forwardRef(
	({ searchText, selectIngredient }: props, ref) => {
		const [filteredIngredients, setFilteredIngredients] = useState<any[]>([]);

		const [popoverState, setPopoverState] = useState<any>({
			showPopover: false,
			event: undefined,
		});

		const {
			isError: isErrorIngredients,
			isSuccess: isSuccessIngredients,
			isLoading: isLoadingIngredients,
			data: ingredients,
			error: errorIngredients,
			refetch: refetchIngredients,
		} = useQuery(["ingredients"], fetchIngredients, {
			staleTime: 3_600_000,
			retry: 2,
		});

		useImperativeHandle(ref, () => ({
			setPopover: (popover: any) => {
				setPopoverState({
					showPopover: popover.state,
					event: popover.event,
				});
			},
		}));

		useEffect(() => {
			if (!ingredients) return;

			if (searchText.length > 0) {
				setFilteredIngredients(
					ingredients.filter((ingredient) => {
						return ingredient[1].name
							.toLowerCase()
							.includes(searchText.toLowerCase());
					})
				);
			} else {
				setFilteredIngredients(ingredients);
			}
		}, [searchText, ingredients]);

		return (
			<IonPopover
				keyboardClose={false}
				alignment="center"
				side="bottom"
				className="popover-list"
				event={popoverState.event}
				isOpen={popoverState.showPopover}
				showBackdrop={false}
				onDidDismiss={() => {
					setPopoverState({
						showPopover: false,
						event: undefined,
					});
				}}
			>
				<IonList>
					{_.isEmpty(filteredIngredients) ? (
						<IonItem>
                            <IonLabel>Brak wyników...</IonLabel>
                        </IonItem>
					) : (
						filteredIngredients.map((ingredient) => {
							return (
							<IonItem
								key={ingredient[0]}
								onClick={(e) => {
									e.persist();
                                    selectIngredient(ingredient[0]);
									setPopoverState({
										showPopover: false,
										event: undefined,
									});
								}}
							>
								<IonLabel>{_.capitalize(ingredient[1].name)}</IonLabel>
							</IonItem>
						)})
					)}
				</IonList>
			</IonPopover>
		);
	}
);

export default SearchIngredientList;
