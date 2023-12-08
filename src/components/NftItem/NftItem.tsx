import React, { useRef } from "react";

import { Card, CardImage, CardTitle } from "./NftItem.styled";
import { IMAGE_STORE_SINGLETON_INSTANCE } from "../../config/config";
import { INft } from "../../utils/types";

function NftItem(props: { item: INft; isActive: boolean; id: number; onClick: () => void }) {
    const { item } = props;
    const imgRef = useRef<HTMLImageElement>(null);

    const handleCardClick = () => {
        if (imgRef.current) {
            IMAGE_STORE_SINGLETON_INSTANCE.setImageUrl(item.logoURI);
            IMAGE_STORE_SINGLETON_INSTANCE.setImage(imgRef?.current);
            props.onClick();
        }
    };

    return (
        <Card className={props.isActive ? "active" : ""} onClick={handleCardClick}>
            {/* {props.isActive ? <BurnEffect /> : null} */}
            {/* {props.isActive ? <FireParticles /> : null} */}
            <CardImage ref={imgRef} src={item.logoURI} alt={item.name} crossOrigin="anonymous" />
            <CardTitle>{item.name}</CardTitle>
        </Card>
    );
}

export default NftItem;
