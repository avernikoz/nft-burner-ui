import { styled } from "styled-components";

export const DialogWalletListContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
    border-radius: 8px;
    border: 1px solid #2d2d31;

    padding: 16px;

    background: var(--Liner-bg-popup, linear-gradient(180deg, rgba(24, 24, 26, 0.8) 0%, rgba(11, 11, 12, 0.8) 100%));
    backdrop-filter: blur(12px);
`;
