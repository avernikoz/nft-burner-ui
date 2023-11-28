import React, { useRef } from "react";

import { Card, CardImage, CardTitle } from "./NftItem.styled";
import { IMAGE_STORE_SINGLETON_INSTANCE } from "../../config/config";

export interface INft {
    id?: number;
    name: string;
    logoURI: string;
}

function NftItem(props: { item: INft; isActive: boolean; id: number; onClick: (id: number) => void }) {
    const { item } = props;
    const imgRef = useRef<HTMLImageElement>(null);

    const handleCardClick = () => {
        if (imgRef.current) {
            IMAGE_STORE_SINGLETON_INSTANCE.setImageUrl(item.logoURI);
            IMAGE_STORE_SINGLETON_INSTANCE.setImage(imgRef?.current);
            props.onClick(props.id);
        }
    };
    return (
        <Card className={props.isActive ? "active" : ""} onClick={handleCardClick}>
            {/* {props.isActive ? <FireParticles /> : null} */}
            <CardImage ref={imgRef} src={item.logoURI} alt={item.name} crossOrigin="anonymous" />
            <CardTitle>{item.name}</CardTitle>
        </Card>
    );
}

export default NftItem;
