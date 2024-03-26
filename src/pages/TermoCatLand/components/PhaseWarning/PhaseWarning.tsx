import { styled } from "styled-components";
import { ReactComponent as WarningSVG } from "../../../../assets/termo-cat-land/warningIcon.svg";

export const PhaseWarningWrapper = styled.div`
    width: 80vw;
    margin: auto;
    color: #fff;
    display: flex;
    align-items: center;
    padding-top: 1rem;
    padding-bottom: 2rem;
    justify-content: center;

    @media screen and (max-width: 1000px) {
        width: 100%;
    }

    .text {
        margin: 1rem;
    }
`;

export const PhaseWarning = ({ textWarning }: { textWarning: string }) => {
    return (
        <PhaseWarningWrapper>
            <WarningSVG></WarningSVG>
            <div className="text">{textWarning}</div>
        </PhaseWarningWrapper>
    );
};
