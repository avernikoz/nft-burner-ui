import React, { ButtonHTMLAttributes } from "react";
import "./ShareButton.css";

interface ShareButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ children, ...props }) => (
    <button {...props}>{children}</button>
);
