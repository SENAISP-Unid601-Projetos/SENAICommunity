import React, { useEffect } from 'react';

const Background = () => {
    // useEffect garante que o código só será executado uma vez,
    // depois que o componente for montado na tela.
    useEffect(() => {
        const background = document.querySelector('.tech-background');

        // Impede que as partículas sejam criadas mais de uma vez
        if (!background || background.children.length > 0) {
            return;
        }

        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            const size = Math.random() * 7 + 3;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const delay = Math.random() * 15;
            const duration = 15 + Math.random() * 10;

            particle.classList.add('particle');

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;

            particle.style.animationDelay = `${delay}s`;
            particle.style.animationDuration = `${duration}s`;

            if (i % 5 === 0) {
                particle.classList.add('highlight-particle');
                particle.style.animationDuration = `${12 + Math.random() * 6}s`;
            }

            if (size < 4) particle.classList.add('small-particle');
            else if (size < 6) particle.classList.add('medium-particle');
            else particle.classList.add('large-particle');

            background.appendChild(particle);
        }
    }, []); // O array vazio [] no final garante que o efeito rode apenas uma vez.

    return <div className="tech-background"></div>;
};

export default Background;
//s