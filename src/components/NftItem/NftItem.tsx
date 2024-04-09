import React, { useCallback, useRef, useState, memo } from "react";

import { Card, CardImage, CardTitle, ImageLoaderPlaceholder } from "./NftItem.styled";
import { IMAGE_STORE_SINGLETON_INSTANCE } from "../../config/config";
import { INft } from "../../utils/types";
import ErrorSVG from "../../assets/svg/errorLoadNFT.svg";
import { NFT_IMAGES_CORS_PROXY_URL } from "../../config/proxy.config";

export const NftItem = memo(({ item, isActive, onClick }: { item: INft; isActive: boolean; onClick: () => void }) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const isPlaceholderImage = !item.name;
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const handleCardClick = useCallback(() => {
        if (isPlaceholderImage || !imgRef.current || error || !loaded) {
            return;
        }

        IMAGE_STORE_SINGLETON_INSTANCE.setImageUrl(item.logoURI);
        IMAGE_STORE_SINGLETON_INSTANCE.setImage(imgRef.current);
        onClick();
    }, [error, isPlaceholderImage, item.logoURI, loaded, onClick]);

    // TODO: Record all images that can't be loaded to don't load them twice
    const onImageError = useCallback(({ currentTarget }: { currentTarget: HTMLImageElement }) => {
        // Try to get nft image without cors proxy
        if (currentTarget.src.includes(NFT_IMAGES_CORS_PROXY_URL)) {
            currentTarget.onerror = null;
            currentTarget.src = currentTarget.src.replace(NFT_IMAGES_CORS_PROXY_URL, "");
        } else {
            // In case image failed to load even without cors proxy
            currentTarget.onerror = null;
            currentTarget.src = ErrorSVG;
            setError(true);
        }
    }, []);

    // TODO: Update animations for image loading in regards with design
    const onImageLoad = useCallback(() => {
        setLoaded(true);
    }, []);

    return (
        <Card
            $isActive={isActive}
            $loaded={loaded}
            $isImageClickable={!isPlaceholderImage && !error && loaded}
            onClick={handleCardClick}
        >
            <ImageLoaderPlaceholder $loaded={loaded} />
            <CardImage
                ref={imgRef}
                src={item.logoURI}
                alt={isPlaceholderImage ? undefined : item.name}
                crossOrigin="anonymous"
                onLoad={onImageLoad}
                onError={onImageError}
            />
            {!isPlaceholderImage && (
                <CardTitle>{item.name.length > 12 ? item.name.substring(0, 12) + "..." : item.name}</CardTitle>
            )}
        </Card>
    );
});
