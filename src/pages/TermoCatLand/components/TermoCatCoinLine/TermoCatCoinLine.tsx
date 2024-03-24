import {useEffect, useState} from "react";
import {styled} from "styled-components";

const CyclingText = styled.div`
 font-size: 2rem;
 font-weight: bold;
 color: #007bff;
 white-space: nowrap;
 overflow: hidden;
 border-right: 2px solid #000;
 animation: typing 3.5s steps(40, end), blink-caret .75s step-end infinite;

 @keyframes typing {
    from { width: 0 }
    to { width: 100% }
 }

 @keyframes blink-caret {
    from, to { border-color: transparent }
    50% { border-color: #000; }
 }
`;

export const TermoCatCoinLine = () => {
    const [text, setText] = useState('TERMOCAT');
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Adjust the number of cycles based on screen width
    const cycles = screenWidth > 1200 ? 10 : 5;

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setText(text.slice(1) + text[0]);
            i++;
            if (i >= cycles) {
                clearInterval(interval);
            }
        }, 350);
        return () => clearInterval(interval);
    }, [text, cycles]);

    return <CyclingText>{text}</CyclingText>;
};

export default TermoCatCoinLine;
