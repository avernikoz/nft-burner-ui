import { useEffect, useState } from "react";
import { GReactGLBridgeFunctions } from "../../webl/reactglBridge";

export const ProgressBar = () => {
    const [loadingPercentage, setLoadingPercentage] = useState(0);
    const [loadingFinished, setLoadingFinished] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line prefer-const
        let intervalId: string | number | NodeJS.Timeout | undefined;

        const updateProgressBar = () => {
            // Calculate the loading percentage based on your requirements
            const loadProgressRes = GReactGLBridgeFunctions.GetLoadingProgressParameterNormalised();
            if (loadProgressRes !== null) {
                const percentage = loadProgressRes * 50;
                setLoadingPercentage(percentage);
            } else {
                setLoadingFinished(true);
                clearInterval(intervalId);
            }
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
