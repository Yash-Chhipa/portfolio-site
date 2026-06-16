/* CURSOR */
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove', e => {
  mx=e.clientX; my=e.clientY;
  dot.style.opacity='1'; ring.style.opacity='1';
  dot.style.left=mx+'px'; dot.style.top=my+'px';
});
(function animateRing(){
  rx+=(mx-rx)*0.12; ry+=(my-ry)*0.12;
  ring.style.left=rx+'px'; ring.style.top=ry+'px';
  requestAnimationFrame(animateRing);
})();
document.querySelectorAll('a,button,.project-card').forEach(el => {
  el.addEventListener('mouseenter', () => { ring.style.width='52px'; ring.style.height='52px'; ring.style.background='rgba(43,186,165,0.07)'; });
  el.addEventListener('mouseleave', () => { ring.style.width='36px'; ring.style.height='36px'; ring.style.background='transparent'; });
});

/* SCROLL REVEAL */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* PROJECT ACCORDION — grid-template-rows approach, no layout shift */
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', function(e) {
    if(e.target.closest('a')) return; // don't close on link click
    const wasOpen = this.classList.contains('open');
    // Close all
    document.querySelectorAll('.project-card.open').forEach(c => {
      c.classList.remove('open');
      c.querySelector('.project-toggle-icon').textContent = '+';
    });
    // Open clicked if it was closed
    if(!wasOpen) {
      this.classList.add('open');
      this.querySelector('.project-toggle-icon').textContent = '+';
    }
  });
});

/* NAV SCROLL */
window.addEventListener('scroll', () => {
  document.querySelector('nav').style.boxShadow = window.scrollY > 60 ? '0 4px 24px rgba(0,0,0,0.08)' : 'none';
}, { passive: true });

/* HERO PARALLAX */
document.addEventListener('mousemove', e => {
  const cx=window.innerWidth/2, cy=window.innerHeight/2;
  const dx=(e.clientX-cx)/cx, dy=(e.clientY-cy)/cy;
  const shape=document.querySelector('.hero-bg-shape');
  if(shape) shape.style.transform=`translate(calc(-50% + ${dx*12}px), calc(-50% + ${dy*8}px))`;
});

/* TIMELINE: stagger each item as it enters viewport */
const timelineItems = document.querySelectorAll('.timeline-item');
const tlObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(e.isIntersecting) {
      e.target.classList.add('visible');
      tlObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.25, rootMargin:'0px 0px -30px 0px' });
timelineItems.forEach((item, i) => {
  item.style.transitionDelay = `${i * 0.06}s`;
  tlObserver.observe(item);
});

/* TIMELINE LINE GROW */
const track = document.getElementById('timelineTrack');
if(track) {
  const lineObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting) {
        const pct = Math.min(100, Math.round(e.intersectionRatio * 160));
        track.style.setProperty('--line-h', pct+'%');
      }
    });
  }, { threshold: Array.from({length:20}, (_,i)=>i/20) });
  lineObserver.observe(track);
}

/* STACK CARDS — scroll into view triggers each card in sequence */
const stackCards = document.querySelectorAll('.stack-card');
const stackObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(e.isIntersecting) {
      stackCards.forEach((card, i) => {
        setTimeout(() => card.classList.add('card-visible'), i * 140);
      });
      stackObserver.disconnect();
    }
  });
}, { threshold: 0.2 });
const stackWrapper = document.getElementById('stackWrapper');
if(stackWrapper) stackObserver.observe(stackWrapper);

/* ACHIEVEMENTS: mouse-tracking glow */
document.querySelectorAll('.achieve-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width * 100).toFixed(1);
    const y = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
    card.style.setProperty('--mx', x+'%');
    card.style.setProperty('--my', y+'%');
  });
});

/* ── TOOLBOX: sticky-stack entrance + covered fade + square fade-in ── */
(function() {
    const cards = Array.from(document.querySelectorAll('.toolbox-card'));
    const NAV_H = 88;
    const STACK_OFFSET = 18;

    /* 1. --cols per card */
    cards.forEach(card => {
        const grid = card.querySelector('.card-skills');
        const n = grid.querySelectorAll('.skill-square').length;
        let cols;
        if      (n <= 2) cols = 2;
        else if (n === 3) cols = 3;
        else if (n === 4) cols = 2;
        else if (n === 5) cols = 3;
        else if (n === 6) cols = 3;
        else              cols = 4;
        grid.style.setProperty('--cols', cols);
    });

    /* 2. sticky top + z-index cascade */
    cards.forEach((card, i) => {
        card.style.setProperty('--card-top', (NAV_H + i * STACK_OFFSET) + 'px');
        card.style.zIndex = 10 + i;
    });

    /* 3. entrance: slide up + stagger squares */
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const card = entry.target;
            card.classList.add('card-in');
            const squares = Array.from(card.querySelectorAll('.skill-square'));
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    squares.forEach((sq, i) => {
                        sq.style.transitionDelay = (0.38 + i * 0.07) + 's';
                        sq.classList.add('sq-in');
                    });
                });
            });
            io.unobserve(card);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

    cards.forEach(card => io.observe(card));

    /* 4. scroll: mark a card as "covered" once the NEXT card's top
          has scrolled past this card's sticky pin point              */
    function updateCovered() {
        cards.forEach((card, i) => {
            if (i === cards.length - 1) return; // last card never gets covered

            const nextCard = cards[i + 1];
            const nextRect = nextCard.getBoundingClientRect();
            const pinPoint = NAV_H + i * STACK_OFFSET;

            // next card's top has reached or passed this card's pin → cover it
            if (nextRect.top <= pinPoint + 10) {
                card.classList.add('card-covered');
            } else {
                card.classList.remove('card-covered');
            }
        });
    }

    window.addEventListener('scroll', updateCovered, { passive: true });
    updateCovered(); // run once on load
})();
