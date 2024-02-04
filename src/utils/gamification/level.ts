// utils/levelUtils.ts

const USER_LEVEL_KEY = "userLevel";
const USER_POINTS_KEY = "userPoints";
const POINTS_PER_LEVEL = 100;
export const POINTS_PER_BURN = 101;

// Get the user's level from local storage, default to 0 if not set
export const getLevel = (): number => {
    const storedLevel = localStorage.getItem(USER_LEVEL_KEY);
    return storedLevel ? parseInt(storedLevel, 10) : 0;
};

// Set the user's level in local storage
export const setLevel = (level: number): void => {
    localStorage.setItem(USER_LEVEL_KEY, String(level));
};

// Get the user's points from local storage, default to 0 if not set
export const getPoints = (): number => {
    const storedPoints = localStorage.getItem(USER_POINTS_KEY);
    return storedPoints ? parseInt(storedPoints, 10) : 0;
};

// Set the user's points in local storage, automatically update level if needed
export const setPoints = (points: number): { updatedLevel: number } => {
    const currentPoints = getPoints();
    const newPoints = currentPoints + points;

    // Calculate the new level based on the accumulated points
    const newLevel = Math.floor(newPoints / POINTS_PER_LEVEL);

    // Update the level and set the remaining points
    setLevel(newLevel);
    localStorage.setItem(USER_POINTS_KEY, String(newPoints % POINTS_PER_LEVEL));

    return { updatedLevel: newLevel };
};
