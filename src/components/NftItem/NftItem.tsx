import React, { useCallback, useRef } from "react";

import { Card, CardImage, CardTitle } from "./NftItem.styled";
import { IMAGE_STORE_SINGLETON_INSTANCE } from "../../config/config";
import { INft } from "../../utils/types";

export const NftItem = ({ item, isActive, onClick }: { item: INft; isActive: boolean; onClick: () => void }) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const isPlaceholderImage = !item.name;

    const handleCardClick = useCallback(() => {
        if (isPlaceholderImage || !imgRef.current) {
            return;
        }

        IMAGE_STORE_SINGLETON_INSTANCE.setImageUrl(item.logoURI);
        IMAGE_STORE_SINGLETON_INSTANCE.setImage(imgRef.current);
        onClick();
    }, [isPlaceholderImage, item.logoURI, onClick]);

    return (
        <Card isActive={isActive} isPlaceholderImage={isPlaceholderImage} onClick={handleCardClick}>
            <CardImage
                ref={imgRef}
                src={item.logoURI}
                alt={isPlaceholderImage ? undefined : item.name}
                crossOrigin="anonymous"
                // TODO: Think about it more
                loading="lazy"
            />
            {!isPlaceholderImage && (
                <CardTitle>{item.name.length > 12 ? item.name.substring(0, 12) + "..." : item.name}</CardTitle>
            )}
        </Card>
    );
};
