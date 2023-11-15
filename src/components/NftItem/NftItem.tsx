import React, { useState } from "react";

import { Card, CardImage, CardTitle } from "./NftItem.styled";

export interface INft {
    name: string;
    logoURI: string;
}

function NftItem(props: { item: INft }) {
    const { item } = props;
    const [isActive, setIsActive] = useState(false);

    const handleCardClick = () => {
        setIsActive(!isActive);
    };
    return (
        <Card className={isActive ? "active" : ""} onClick={handleCardClick}>
            <CardImage src={item.logoURI} alt={item.name} />
            <CardTitle>{item.name}</CardTitle>
        </Card>
    );
}

export default NftItem;
