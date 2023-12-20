import React, { createContext, useRef } from "react";
import { Toast } from "primereact/toast";
import { StyledToast } from "./ToastProvider.styled";

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

    const toastController = {
        showInfo: (summary: string, message: string) => {
            toastRef.current?.show({
                severity: "info",
                summary: summary,
                detail: message,
                style: { borderColor: "#fff" },
            });
        },
        showError: (message: string) => {
            toastRef.current?.show({
                severity: "error",
                summary: "Error",
                detail: message,
                style: { borderColor: "#A92323" },
            });
        },
        showSuccess: (message: string) => {
            toastRef.current?.show({
                severity: "success",
                summary: "Success",
                detail: message,
                style: { borderColor: "#00B272" },
            });
        },
    };

    return (
        <ToastContext.Provider value={toastController}>
            <StyledToast ref={toastRef} position="top-left" />
            {children}
        </ToastContext.Provider>
    );
};
export default ToastProvider;
