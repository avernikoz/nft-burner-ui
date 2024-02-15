import { Ref, useRef } from "react";
import { Circle, CircleContainer, LevelContainer, LevelNumber, LevelText, StyledSvgLevel } from "./Level.styled";
import { Tooltip } from "primereact/tooltip";

export const Level = ({
    level,
    points,
    levelSize = 200,
    showLevelText = false,
    showTooltip = false,
}: {
    level: number;
    points: number;
    levelSize?: number;
    showLevelText: boolean;
    showTooltip: boolean;
}) => {
    const fontSizePercentage = 0.6; // 60%
    const fontSize = levelSize * fontSizePercentage;
    const paddingPercentage = 0.05; // 5%
    const padding = levelSize * paddingPercentage;
    const strokeWidthPercentage = 0.04; // 4%
    const strokeWidth = levelSize * strokeWidthPercentage;
    const radiusPercentage = 0.375; // 37.5%
    const radius = levelSize * radiusPercentage;

    const circumference = 2 * Math.PI * radius;
    const offset = (points / 100) * circumference;

    const levelRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <LevelContainer>
                {showLevelText && <LevelText>LEVEL</LevelText>}
                <CircleContainer $levelSize={levelSize} ref={levelRef}>
                    <StyledSvgLevel width={levelSize} height={levelSize}>
                        <Circle
                            stroke="#3f3f3f96"
                            fill="transparent"
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${circumference} ${circumference}`}
                            style={{ strokeDashoffset: circumference }}
                            r={radius}
                            cx={levelSize / 2}
                            cy={levelSize / 2}
                            $circumference={circumference}
                        />
                    </StyledSvgLevel>
                    <StyledSvgLevel width={levelSize} height={levelSize}>
                        <Circle
                            stroke="#ffffff"
                            fill="transparent"
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${circumference} ${circumference}`}
                            style={{ strokeDashoffset: -offset, transform: "rotate(-90 0 0)" }}
                            r={radius}
                            cx={levelSize / 2}
                            cy={levelSize / 2}
                            $circumference={circumference}
                            filter="drop-shadow(0px 0px 12px #25FE96)"
                        />
                    </StyledSvgLevel>

                    <LevelNumber $fontSize={fontSize} $paddingTop={padding}>
                        {level}
                    </LevelNumber>
                </CircleContainer>
            </LevelContainer>
            <Tooltip
                disabled={!showTooltip}
                className="tooltip-burner-fee"
                content="Level: The measure of your NFT burning prowess. Increase your level by burning NFTs and unlocking new achievements. The higher your level, the greater your status in the NFT Burner community. "
                target={levelRef}
                position="top"
            />
        </>
    );
};
