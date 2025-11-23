// Small, dependency-free JS for tilt and confetti micro-interactions
(() => {
    const img = document.querySelector('.meme-preview img');
    if(img){
        const container = img.closest('.meme-preview');
        container.classList.add('tilt');
        let rect = null;
        function updateRect(){ rect = container.getBoundingClientRect(); }
        window.addEventListener('resize', updateRect);
        updateRect();

        container.addEventListener('pointermove', (e) => {
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            const rx = (-y) * 8; // tilt along X
            const ry = x * 10;   // tilt along Y
            container.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
        });
        container.addEventListener('pointerleave', () => {
            container.style.transform = '';
        });
    }

    // Tiny confetti burst when primary CTA clicked
    const btn = document.querySelector('.btn-primary');
    if(btn){
        btn.addEventListener('click', (ev) => {
            // create a small set of confetti pieces
            const confettiCount = 18;
            const root = document.createElement('div');
            root.style.position = 'fixed'; root.style.left = 0; root.style.top = 0; root.style.pointerEvents = 'none'; root.style.zIndex = 9999;
            document.body.appendChild(root);

            const rect = btn.getBoundingClientRect();
            for(let i=0;i<confettiCount;i++){
                const el = document.createElement('div');
                el.className = 'mini-confetti';
                const size = 6 + Math.random()*10;
                el.style.width = size+'px'; el.style.height = (size*0.6)+'px';
                el.style.background = ['#fb7185','#60a5fa','#34d399','#f59e0b'][Math.floor(Math.random()*4)];
                el.style.position = 'absolute'; el.style.left = (rect.left + rect.width/2)+'px'; el.style.top = (rect.top + rect.height/2)+'px';
                el.style.opacity = '0.95'; el.style.borderRadius = '2px'; el.style.transform = `translate(-50%,-50%) rotate(${Math.random()*360}deg)`;
                root.appendChild(el);

                const dx = (Math.random()-0.5) * 600;
                const dy = -120 - Math.random()*420;
                const rot = (Math.random()-0.5)*720;
                el.animate([
                    { transform: el.style.transform, opacity: 1 },
                    { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 0 }
                ], { duration: 800 + Math.random()*600, easing: 'cubic-bezier(.2,.8,.2,1)' });
            }

            // remove after animation
            setTimeout(()=>{ document.body.removeChild(root); }, 1800);
        });
    }

})();

/* small confetti styles appended via JS to avoid global CSS changes (used by inline-created elements) */
(() => {
    const s = document.createElement('style');
    s.textContent = `
    .mini-confetti{ will-change: transform, opacity; }
    `;
    document.head.appendChild(s);
})();
