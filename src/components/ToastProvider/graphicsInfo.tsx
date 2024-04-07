import React, { useRef, useEffect } from "react";
import { Toast } from "primereact/toast";
import { StyledToast } from "./ToastProvider.styled";

export const GraphicsWarning = () => {
    const toastRef = useRef<Toast>(null);

    useEffect(() => {
        toastRef.current?.show({
            severity: "info",
            summary: "Info",
            detail: "The app uses advanced graphics, please ensure your device is charged and Hardware Acceleration is enabled in browser settings.",
            life: 20000,
            closable: true,
            style: { borderColor: "#A92323" },
        });
    }, []);

    return (
        <div className="gfx-toast">
            <StyledToast ref={toastRef} position="bottom-left" />
        </div>
    );
};
