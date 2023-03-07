import { IonCard, IonSkeletonText } from "@ionic/react";
import _ from "lodash";

export function SkeletonNoRecipes() {
	return (
		<div className="lista-przepisow">
			{_.times(10, (index) => {
				return (
					<IonCard
						key={index}
						style={{
							margin: "1.25rem",
							borderRadius: "0.7rem",
						}}
					>
						<div className="cardContent">
							<IonSkeletonText
								animated
								style={{
									width: "100%",
									height: "200px",
									alignSelf: "flex-start",
									margin: "0",
								}}
							/>
							<IonSkeletonText
								animated
								style={{
									width: Math.random() * 40 + 20 + "%",
									height: "20px",
									alignSelf: "flex-start",
									marginTop: "10px",
									marginLeft: "10px",
								}}
							/>
							<IonSkeletonText
								animated
								style={{
									width: "90%",
									height: Math.random() * 50 + 70 + "px",
									alignSelf: "flex-start",
									marginTop: "10px",
									marginLeft: "10px",
								}}
							/>
							<IonSkeletonText
								animated
								style={{
									width: "45%",
									height: "20px",
									alignSelf: "flex-start",
									marginTop: "10px",
									marginLeft: "10px",
								}}
							/>
							<IonSkeletonText
								animated
								style={{
									width: "40%",
									height: "20px",
									alignSelf: "flex-start",
									marginLeft: "10px",
									marginBottom: "10px",
								}}
							/>
						</div>
					</IonCard>
				);
			})}
		</div>
	);
}
