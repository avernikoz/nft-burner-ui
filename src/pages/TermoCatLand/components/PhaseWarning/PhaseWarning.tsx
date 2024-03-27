import { styled } from "styled-components";
import { ReactComponent as WarningSVG } from "../../../../assets/termo-cat-land/warningIcon.svg";

export const PhaseWarningWrapper = styled.div`
    width: 80vw;
    margin: auto;
    color: #fff;
    display: flex;
    align-items: center;
    padding-bottom: 2rem;
    justify-content: center;

    .text {
        margin: 1rem;
    }

    @media screen and (max-width: 1000px) {
        width: 90vw;
    }
`;

export const PhaseWarning = ({ textWarning }: { textWarning: string }) => {
    return (
        <PhaseWarningWrapper>
            <div style={{ width: "30px" }}>
                <WarningSVG></WarningSVG>
            </div>
            <div className="text">{textWarning}</div>
        </PhaseWarningWrapper>
    );
};
