import React, { createContext, useRef } from "react";
import { Toast } from "primereact/toast";
import { STYLES_CONFIG } from "../../config/styles.config";

export const ToastContext = createContext<IToastController | null>(null);

interface ToastProviderProps {
    children: React.ReactNode;
}

interface IToastController {
    showInfo: (summary: string, message: string) => void;
    showError: (message: string) => void;
    showSuccess: (message: string) => void;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const toastRef = useRef<Toast>(null);
    const {
        toast: { color, backgroundColor, borderColor },
    } = STYLES_CONFIG;
    const toastStyle = { color, backgroundColor, borderColor };

    const toastController = {
        showInfo: (summary: string, message: string) => {
            toastRef.current?.show({
                severity: "info",
                summary: summary,
                detail: message,
                icon: <i className="pi pi-spin pi-cog"></i>,
                style: toastStyle,
            });
        },
        showError: (message: string) => {
            toastRef.current?.show({
                severity: "error",
                summary: "Error",
                detail: message,
                style: toastStyle,
            });
        },
        showSuccess: (message: string) => {
            toastRef.current?.show({
                severity: "success",
                summary: "Success",
                detail: message,
                style: toastStyle,
            });
        },
    };

    return (
        <ToastContext.Provider value={toastController}>
            <Toast ref={toastRef} position="top-left" />
            {children}
        </ToastContext.Provider>
    );
};
export default ToastProvider;
