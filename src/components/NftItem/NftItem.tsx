import React, { useRef, useState } from "react";

import { BurnEffect, Card, CardImage, CardTitle } from "./NftItem.styled";
import { IMAGE_STORE_SINGLETON_INSTANCE } from "../../config/config";

export interface INft {
    name: string;
    logoURI: string;
}

function NftItem(props: { item: INft }) {
    const { item } = props;
    const [isActive, setIsActive] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    const handleCardClick = () => {
        if (imgRef.current) {
            console.log(isActive);
            IMAGE_STORE_SINGLETON_INSTANCE.setImageUrl(item.logoURI);
            IMAGE_STORE_SINGLETON_INSTANCE.setImage(imgRef?.current);
            setIsActive(!isActive);
        }
    };
    return (
        <Card className={isActive ? "active" : ""} onClick={handleCardClick}>
            {isActive ? <BurnEffect /> : null}
            <CardImage ref={imgRef} src={item.logoURI} alt={item.name} crossOrigin="anonymous" />
            <CardTitle>{item.name}</CardTitle>
        </Card>
    );
}

export default NftItem;
