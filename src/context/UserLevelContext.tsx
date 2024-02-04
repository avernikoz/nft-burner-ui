// UserLevelContext.tsx
import React, { createContext, useContext, useState } from "react";
import { getLevel, getPoints, setPoints } from "../utils/gamification/level";

interface UserLevelProviderProps {
    children: React.ReactNode;
}

interface UserLevelContextProps {
    level: number;
    points: number;
    setPoints: (points: number) => void;
}

const UserLevelContext = createContext<UserLevelContextProps | undefined>(undefined);

export const UserLevelProvider: React.FC<UserLevelProviderProps> = ({ children }) => {
    const [points, setLocalPoints] = useState(getPoints());
    const [level, setLocalLevel] = useState(getLevel());

    const handleSetPoints = (newPoints: number) => {
        const { updatedLevel, updatedPoints } = setPoints(newPoints);

        setLocalPoints(updatedPoints);
        setLocalLevel(updatedLevel);
    };

    return (
        <UserLevelContext.Provider value={{ level, points, setPoints: handleSetPoints }}>
            {children}
        </UserLevelContext.Provider>
    );
};

export const useUserLevel = () => {
    const context = useContext(UserLevelContext);
    if (!context) {
        throw new Error("useUserLevel must be used within a UserLevelProvider");
    }
    return context;
};
