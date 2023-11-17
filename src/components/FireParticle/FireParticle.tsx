import { styled, keyframes } from "styled-components";
import React from "react";

// Define the rise animation
const rise = keyframes`
  0% {
    opacity: 0;
    transform: translateY(0) scale(1);
  }
  25% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-10em) scale(0);
  }
`;

// Define the Fire and Particle components
const Fire = styled.div`
    font-size: 24px;
    filter: blur(0.02em);
    margin: 3em auto 0 auto;
    position: relative;
    width: 10em;
    height: 12em;
`;

const Particle = styled.div<{ index: number }>`
    animation: ${rise} 1s ease-in infinite;
    background-image: radial-gradient(rgb(255, 80, 0) 20%, rgba(255, 80, 0, 0) 70%);
    border-radius: 50%;
    mix-blend-mode: screen;
    opacity: 0;
    position: absolute;
    bottom: 0;
    width: 5em;
    height: 5em;
    left: ${(props) => `calc((100% - 5em) * ${props.index / 50})`};
    animation-delay: ${() => `${Math.random()}s`};
`;

const FireParticles = () => {
    const particles = Array.from({ length: 50 }, (_, i) => i);
    return (
        <Fire>
            {particles.map((index) => (
                <Particle key={index} index={index} />
            ))}
        </Fire>
    );
};

export default FireParticles;
