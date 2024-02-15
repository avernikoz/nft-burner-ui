import { styled } from "styled-components";

export const LevelContainer = styled.div`
    @media (max-width: 600px) {
        display: none;
    }
`;

export const MainLevelContainer = styled.div<{ $isVisible: boolean }>`
    position: absolute;
    top: 120%;
    right: 7%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    gap: 16px;
    background: transparent;
    z-index: -1;
    transition: top 0.5s ease;
    opacity: ${({ $isVisible }) => ($isVisible ? "1" : "0")};
    visibility: ${({ $isVisible }) => ($isVisible ? "visible" : "hidden")};

    @media (max-width: 600px) {
        display: none;
    }
`;

export const LevelText = styled.span`
    font-size: 1.5rem;
    font-family: Rubik;
    font-weight: 500;
    color: #ffffff;
    text-shadow: 0 0 45px #25fe9578;
`;

export const LevelNumber = styled.span<{ $fontSize: number; $paddingTop: number }>`
    font-size: ${({ $fontSize }) => $fontSize}px;
    padding-top: ${({ $paddingTop }) => $paddingTop}px;
    font-family: Khand;
    color: #ff6a2d;
    font-weight: 400;
    text-shadow:
        0 0 45px #25fe9592,
        0 0 15px #ff682d97;
`;

export const CircleContainer = styled.div<{ $levelSize: number }>`
    display: flex;
    justify-content: center;
    align-items: center;
    height: ${({ $levelSize }) => $levelSize}px;
    width: ${({ $levelSize }) => $levelSize}px;
    background: transparent;
`;

export const Circle = styled.circle<{ $circumference?: number }>`
    stroke-dasharray: 0 ${(props) => props.$circumference} 0;
    transition: stroke-dasharray 0.5s ease-out;
    transform: rotate(-180deg);
    transform-origin: 50% 50%;
`;

export const StyledSvgLevel = styled.svg`
    position: absolute;
`;
