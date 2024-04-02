import { styled } from "styled-components";
import { ReactComponent as WarningSVG } from "../../../../assets/termo-cat-land/warningIcon.svg";

export const PhaseWarningWrapper = styled.div`
    width: 30vw;
    margin: auto;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;

    .text {
        text-align: center;
    }

    @media screen and (max-width: 1600px) {
        width: 40vw;
    }

    @media screen and (max-width: 1400px) {
        width: 60vw;
    }

    @media screen and (max-width: 1000px) {
        width: 90vw;
    }
`;

export const PhaseWarning = ({ textWarning }: { textWarning: string }) => {
    return (
        <PhaseWarningWrapper>
            <div style={{ width: "40px", marginRight: "0.2rem" }}>
                <WarningSVG></WarningSVG>
            </div>
            <div className="text">{textWarning}</div>
        </PhaseWarningWrapper>
    );
};
