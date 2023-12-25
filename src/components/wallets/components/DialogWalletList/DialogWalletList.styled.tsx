import { TabMenu } from "primereact/tabmenu";
import { styled } from "styled-components";

export const StyledTabMenu = styled(TabMenu)`
    .p-menuitem-text {
        font-family: Rubik;
        font-size: 16px;
        font-style: normal;
        font-weight: 500;
        line-height: 16px; /* 100% */
        letter-spacing: 1px;
    }

    .p-menuitem-link {
        border-radius: 0%;
        background: transparent;

        @media (max-width: 600px) {
            padding: 0.25rem;
        }
    }
    .p-tabmenu-nav {
        background: transparent;
    }

    .p-tabmenu-nav .p-tabmenuitem.p-highlight .p-menuitem-link {
        /* border-color: var(--Orange--01, #ff4a00); */
        border-color: var(--Orange--01, #ff4a00);
        color: #fff;
    }

    .p-tabmenu-nav .p-tabmenuitem .p-menuitem-link {
        /* border-color: var(--Orange--01, #ff4a00); */
        border-color: #2d2d31;
        color: #fff;
    }
`;
