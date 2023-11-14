import React from "react";

import { Card, CardImage, CardTitle } from "./NftItem.styled";

export interface INft {
    name: string;
    logoURI: string;
}

function NftItem(props: { item: INft }) {
    const { item } = props;

    return (
        <Card>
            <CardImage src={item.logoURI} alt={item.name} />
            <CardTitle>{item.name}</CardTitle>
        </Card>
    );
}

export default NftItem;
