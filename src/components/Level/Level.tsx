import React, { useEffect } from "react";
import styled from "styled-components";

export const MainLevelContainer = styled.div`
    position: absolute;
    top: 120%;
    right: 7%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    gap: 16px;
    //align-items: center;
    background: transparent;
`;

export const LevelText = styled.span`
    font-size: 1.5rem;
    font-family: Rubik;
    font-weight: 500;
    color: #ffffff;
    text-shadow: 0 0 45px #25fe9578;
`;

export const Number = styled.span`
    font-size: 7.5rem;
    font-family: Khand;
    color: #ff6a2d;
    font-weight: 400;
    /* position: absolute;
    left: 50%;
    top: 50%; */
    text-shadow:
        0 0 45px #25fe96,
        0 0 15px #ff682d97;
`;

export const CircleContainer = styled.div`
    /* position: absolute;
    top: 19%;
    right: 7%; */
    display: flex;
    justify-content: center;
    align-items: center;
    /* height: 250px;
    width: 250px; */
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

export const Level = ({ level, points }: { level: number; points: number }) => {
    const radius = 75;
    const circumference = 2 * Math.PI * radius;
    const offset = (points / 100) * circumference;

    useEffect(() => {
        console.log(points);
        // console.log(offset);
        // console.log(circumference);
    }, [points]);

    return (
        <MainLevelContainer>
            <LevelText>LEVEL</LevelText>
            <CircleContainer>
                <StyledSvgLevel width={200} height={200}>
                    <Circle
                        stroke="#3f3f3f96"
                        fill="transparent"
                        strokeWidth="8"
                        strokeDasharray={`${circumference} ${circumference}`}
                        style={{ strokeDashoffset: circumference }}
                        r={radius}
                        cx={100}
                        cy={100}
                        $circumference={circumference}
                    />
                </StyledSvgLevel>
                <StyledSvgLevel width={200} height={200}>
                    <Circle
                        stroke="#ffffff"
                        fill="transparent"
                        strokeWidth="8"
                        strokeDasharray={`${circumference} ${circumference}`}
                        style={{ strokeDashoffset: -offset, transform: "rotate(-90 0 0)" }}
                        r={radius}
                        cx={100}
                        cy={100}
                        $circumference={circumference}
                        filter="drop-shadow(0px 0px 12px #25FE96)"
                    />
                </StyledSvgLevel>

                <Number>{level}</Number>
            </CircleContainer>
        </MainLevelContainer>
    );
};
