import { IonIcon, IonText } from "@ionic/react";
import { ellipse } from "ionicons/icons";
import _ from "lodash";
import { useState } from "react";

interface props {
	skladnikName: string;
	skladnikUnit: string;
	skladnikQuantity: number;
	porcje: number;
}

const Skladnik: React.FC<props> = ({
	skladnikName,
	skladnikUnit,
	skladnikQuantity,
	porcje,
}) => {
	const [selected, setSelected] = useState<boolean>(false);

	const handleSelect = () => {
		setSelected(!selected);
	};

	return (
		<div
			className="hstack skladnik"
			onClick={handleSelect}
			style={{
				color: selected ? "var(--ion-color-medium)" : "var(--ion-color-dark)",
			}}
		>
			<IonIcon
				style={{
					fontSize: "0.5rem",
				}}
				icon={ellipse}
			/>
			<IonText className="skladnik-name">{_.capitalize(skladnikName)} - </IonText>
			<IonText className="ilosc">{porcje * skladnikQuantity}</IonText>
			<IonText className="jednostka">{skladnikUnit}</IonText>
		</div>
	);
};

export default Skladnik;
