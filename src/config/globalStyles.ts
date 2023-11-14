// globalStyles.js
import { createGlobalStyle } from "styled-components";
import { STYLES_CONFIG } from "./styles.config";

export const GlobalStyles = createGlobalStyle`
    #popup_menu_right {
        background-color: ${STYLES_CONFIG.button.backgroundColor};
        margin-top: 0.25rem;
    }
    #popup_menu_right li {
        border: ${STYLES_CONFIG.button.border};
        border-radius: ${STYLES_CONFIG.button.borderRadius};
        margin-bottom: 0.5rem;
    }

    #pr_id_2_content .p-panelmenu-content {
        background-color: ${STYLES_CONFIG.button.backgroundColor};
    }

    #pr_id_2_header {
        color: ${STYLES_CONFIG.button.color};

        &:hover {
            color: ${STYLES_CONFIG.button.active.color};
        }
    }
`;
