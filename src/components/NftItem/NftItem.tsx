import React, { useRef } from "react";

import { Card, CardImage, CardTitle } from "./NftItem.styled";
import { IMAGE_STORE_SINGLETON_INSTANCE } from "../../config/config";
import { INft } from "../../utils/types";

export const NftItem = ({ item, isActive, onClick }: { item: INft; isActive: boolean; onClick: () => void }) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const isEmptyImage = !item.name;

    const handleCardClick = () => {
        if (isEmptyImage) {
            return;
        }

        if (imgRef.current) {
            IMAGE_STORE_SINGLETON_INSTANCE.setImageUrl(item.logoURI);
            IMAGE_STORE_SINGLETON_INSTANCE.setImage(imgRef?.current);
            onClick();
        }
    };

    return (
        <Card
            className={isActive ? "active" : ""}
            style={isEmptyImage ? {} : { cursor: "pointer" }}
            onClick={handleCardClick}
        >
            <CardImage
                ref={imgRef}
                src={item.logoURI}
                alt={isEmptyImage ? undefined : item.name}
                crossOrigin="anonymous"
            />
            {!isEmptyImage && (
                <CardTitle>{item.name.length > 12 ? item.name.substring(0, 12) + "..." : item.name}</CardTitle>
            )}
        </Card>
    );
};
