import { useEffect, useState } from "react";
import { GTexturePool } from "../../webl/texturePool";

export const ProgressBar = () => {
    const [loadingPercentage, setLoadingPercentage] = useState(0);
    const [loadingFinished, setLoadingFinished] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line prefer-const
        let intervalId: string | number | NodeJS.Timeout | undefined;

        const updateProgressBar = () => {
            // Check if loading is finished
            if (GTexturePool.NumPendingTextures === 0) {
                setLoadingFinished(true);
                clearInterval(intervalId);
            }

            // Calculate the loading percentage based on your requirements
            const percentage = (1 - GTexturePool.NumPendingTextures / GTexturePool.NumTexturesInPool) * 50;
            setLoadingPercentage(percentage);
        };

        intervalId = setInterval(updateProgressBar, 250);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div
            className="progress-bar"
            id="myProgressBar"
            style={
                loadingFinished ? { width: "50%", opacity: 0, background: "#fff" } : { width: `${loadingPercentage}%` }
            }
        ></div>
    );
};
