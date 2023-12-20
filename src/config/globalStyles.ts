// globalStyles.js
import { createGlobalStyle } from "styled-components";
import { STYLES_CONFIG } from "./styles.config";

export const GlobalStyles = createGlobalStyle`
    * {
        letter-spacing: 0.01em;
        box-sizing: border-box;
    }
    
    #pr_id_2_content .p-panelmenu-content {
        border-radius: 0px 0px 4px 4px;
        background: var(--Liner-bg-popup, linear-gradient(180deg, rgba(24, 24, 26, 0.80) 0%, rgba(11, 11, 12, 0.80) 100%));
        backdrop-filter: blur(12px);
        border: none;
    }

    #pr_id_2_header {
        color: #fff;

        &:hover {
            color: #fff;
        }
    }

    .p-toast button {
        color: ${STYLES_CONFIG.button.active.color};
    }
`;
