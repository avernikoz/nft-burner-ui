import React, { useEffect } from "react";
import styled from "styled-components";

export const Circle = styled.circle<{ $circumference?: number }>`
    stroke-dasharray: 0 ${(props) => props.$circumference} 0;
    transition: stroke-dasharray 0.5s ease-out;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
`;

export const Number = styled.text`
    font-size: 2.5rem;
    fill: #ff8401;
    text-anchor: middle;
    dominant-baseline: central;
    text-shadow:
        0 0 10px orange,
        0 0 20px orange,
        0 0 30px orange,
        0 0 40px orange;
`;

export const OuterContainer = styled.div`
    position: absolute;
    top: 19%;
    right: 7%;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 250px;
    background: transparent;
`;

export const Level = ({ percentage }: { percentage: number }) => {
    const radius = 75;
    const circumference = 2 * Math.PI * radius;
    const offset = (percentage / 100) * circumference;

    useEffect(() => {
        console.log(percentage);
        // console.log(offset);
        // console.log(circumference);
    }, [percentage]);

    return (
        <OuterContainer>
            <svg width={200} height={200}>
                <circle stroke="#ffffff" fill="transparent" strokeWidth="4" r={radius - 6} cx={100} cy={100} />
                <Circle
                    stroke="#ff8401"
                    fill="transparent"
                    strokeWidth="8"
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{ strokeDashoffset: offset }}
                    r={radius}
                    cx={100}
                    cy={100}
                    $circumference={circumference}
                />
                <Number x={100} y={98}>
                    {percentage}
                </Number>
            </svg>
        </OuterContainer>
    );
};
