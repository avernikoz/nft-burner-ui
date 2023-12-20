import { Toast } from "primereact/toast";
import { styled } from "styled-components";

export const StyledToast = styled(Toast)`
    .p-toast-summary {
        color: #fff;

        font-family: Khand;
        font-size: 16px;
        font-style: normal;
        font-weight: 600;
        line-height: 24px; /* 150% */
        letter-spacing: 1.92px;
        text-transform: uppercase;
    }

    .p-toast-detail {
        color: #b5b5c2;

        font-family: Rubik;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 20px; /* 142.857% */
    }

    .p-icon {
        display: none;
    }

    .p-toast-icon-close .p-link {
        color: #b5b5c2;
    }

    .p-toast-message {
        border-radius: 0px 8px 8px 0px;

        border-left: 4px solid;

        background: var(
            --Liner-bg-popup,
            linear-gradient(180deg, rgba(24, 24, 26, 0.8) 0%, rgba(11, 11, 12, 0.8) 100%)
        );
    }
`;
