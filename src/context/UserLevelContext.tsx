// UserLevelContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { getPoints, setPoints } from "../utils/gamification/level";

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
    const [level, setLocalLevel] = useState(Math.floor(points / 100));

    useEffect(() => {
        setLocalPoints((prevPoints) => {
            const newPoints = prevPoints % 100; // Ensure points are within the range [0, 99]
            setLocalLevel(Math.floor(newPoints / 100));
            setPoints(newPoints);
            return newPoints;
        });
    }, [points]);

    const handleSetPoints = (newPoints: number) => {
        setLocalPoints((prevPoints) => prevPoints + newPoints);
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
