import React, { ButtonHTMLAttributes } from "react";
import "./BurnButton.css";

interface BurnButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export const BurnButton: React.FC<BurnButtonProps> = ({ children, ...props }) => <button {...props}>{children}</button>;
