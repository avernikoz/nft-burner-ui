import React, { useRef } from "react";

import { Card, CardImage, CardTitle } from "./NftItem.styled";
import { IMAGE_STORE_SINGLETON_INSTANCE } from "../../config/config";
import { INft } from "../../utils/types";

function NftItem(props: { item: INft; isActive: boolean; id: number; onClick: () => void }) {
    const { item, onClick, isActive } = props;
    const imgRef = useRef<HTMLImageElement>(null);

    const handleCardClick = () => {
        if (!item.name) {
            return;
        }

        if (imgRef.current) {
            IMAGE_STORE_SINGLETON_INSTANCE.setImageUrl(item.logoURI);
            IMAGE_STORE_SINGLETON_INSTANCE.setImage(imgRef?.current);
            onClick();
        }
    };

    return (
        <Card className={isActive ? "active" : ""} onClick={handleCardClick}>
            {/* {props.isActive ? <BurnEffect /> : null} */}
            {/* {props.isActive ? <FireParticles /> : null} */}
            <CardImage ref={imgRef} src={item.logoURI} alt={item.name ?? undefined} crossOrigin="anonymous" />
            {item.name && <CardTitle>{item.name}</CardTitle>}
        </Card>
    );
}

export default NftItem;
