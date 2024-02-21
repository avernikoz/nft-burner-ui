if (!process.env.REACT_APP_GOOGLE_TAG_MANAGER_ID?.length) {
    //throw new Error("Empty REACT_APP_GOOGLE_TAG_MANAGER_ID");
}

export const REACT_APP_GOOGLE_TAG_MANAGER_ID = process.env.REACT_APP_GOOGLE_TAG_MANAGER_ID;
