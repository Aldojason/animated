// 1. Initialize Smooth Scrolling (Lenis) - Cushioned and Ultra Smooth
const lenis = new Lenis({
    duration: 1.6, // Soft inertia scroll
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.95,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Link Lenis to GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

// 2. Preload Images & Setup Canvas Sequence
const canvas = document.getElementById("hero-lightpass");
const context = canvas.getContext("2d");
const loader = document.getElementById("loader");
const progress = document.getElementById("progress");
const progressText = document.getElementById("progress-text");

const frameCount = 200;
const currentFrame = index => (
    `assets/images/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`
);

const images = [];
const frame = { index: 0 };
let imagesLoaded = 0;

// Preload sequence images
const preloadImages = () => {
    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        img.onload = () => {
            imagesLoaded++;
            const percent = Math.round((imagesLoaded / frameCount) * 100);
            progress.style.width = `${percent}%`;
            progressText.innerText = `${percent}%`;
            loader.setAttribute("aria-valuenow", percent);

            if (imagesLoaded === frameCount) {
                setTimeout(() => {
                    gsap.to(loader, {
                        opacity: 0,
                        duration: 0.7,
                        ease: "power2.out",
                        onComplete: () => {
                            loader.style.display = 'none';
                            // Start Autoplay intro
                            startAutoplayIntro();
                            initGeneralScrollAnimations();
                        }
                    });
                }, 500);
            }
        };
        images.push(img);
    }
};

// Render current frame centered and scaled (cover) with DPR support
const render = (index) => {
    const img = images[index];
    if (img) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        context.clearRect(0, 0, w, h);

        const hRatio = w / img.width;
        const vRatio = h / img.height;
        const ratio = Math.max(hRatio, vRatio);
        const centerShift_x = (w - img.width * ratio) / 2;
        const centerShift_y = (h - img.height * ratio) / 2;

        context.drawImage(img,
            0, 0, img.width, img.height,
            centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
        );
    }
};

// High-DPI canvas resizing
const resizeCanvas = () => {
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual render resolution
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    
    // Set visible viewport size
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    
    // Normalize coordinates mapping
    context.scale(dpr, dpr);
    
    render(Math.floor(frame.index));
};

window.addEventListener('resize', resizeCanvas);
// Call once manually to initialize bounds
resizeCanvas();

// 3. Narrative Card Ranges & Updates
const cardsRange = {
    'card-intro': [0, 35],
    'card-source': [45, 85],
    'card-press': [95, 135],
    'card-splash': [145, 200]
};

const updateNarrative = (frameIndex) => {
    Object.entries(cardsRange).forEach(([id, [start, end]]) => {
        const card = document.getElementById(id);
        if (frameIndex >= start && frameIndex <= end) {
            if (!card.classList.contains("active")) {
                card.classList.add("active");
                gsap.fromTo(card, 
                    { opacity: 0, y: "40px" }, 
                    { opacity: 1, y: "0px", duration: 0.6, ease: "power2.out", overwrite: "auto" }
                );
            }
        } else {
            if (card.classList.contains("active")) {
                card.classList.remove("active");
                gsap.to(card, {
                    opacity: 0,
                    y: "-40px",
                    duration: 0.5,
                    ease: "power2.in",
                    overwrite: "auto"
                });
            }
        }
    });
};

// 4. Autoplay Timeline
const startAutoplayIntro = () => {
    // Initial Render frame 0
    render(0);

    // GSAP tween frame index automatically from 0 to 199
    gsap.to(frame, {
        index: frameCount - 1,
        duration: 8.5, // Luxurious length of playback to allow reading narration
        ease: "power1.inOut",
        onUpdate: () => {
            const idx = Math.floor(frame.index);
            render(idx);
            updateNarrative(idx);
        },
        onComplete: () => {
            // Fade in interactive hotspots on bottle completion
            const hotspotLayer = document.getElementById("hotspot-layer");
            gsap.to(hotspotLayer, {
                opacity: 1,
                duration: 0.8,
                onStart: () => {
                    hotspotLayer.style.pointerEvents = "auto";
                }
            });

            // Reveal scroll down indicator
            document.getElementById("hero-scroll-indicator").classList.add("visible");
        }
    });
};

// Scroll triggers for standard landing page elements below hero
const initGeneralScrollAnimations = () => {
    gsap.registerPlugin(ScrollTrigger);

    // Hide/Show Header on scroll direction
    ScrollTrigger.create({
        start: "top -80px",
        onUpdate: (self) => {
            const header = document.querySelector(".header");
            if (self.direction === 1) {
                gsap.to(header, { y: "-100%", duration: 0.4, ease: "power2.inOut" });
            } else {
                gsap.to(header, { y: "0%", duration: 0.4, ease: "power2.inOut" });
            }
        }
    });

    // Reveal headers in general sections
    const revealElements = document.querySelectorAll(".section-header");
    revealElements.forEach(el => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none none"
            },
            opacity: 0,
            y: 50,
            duration: 1.2,
            ease: "power3.out"
        });
    });
};

// 5. Custom Cursor Movement & Interaction
const cursor = document.getElementById("custom-cursor");
const follower = document.getElementById("custom-cursor-follower");

document.addEventListener("mousemove", (e) => {
    gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
    gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.3, ease: "power2.out" });
});

const interactiveElements = "a, button, .select-btn, .pack-btn, .faq-trigger, .hotspot-btn, .process-tab-btn, .flavor-card";
document.addEventListener("mouseover", (e) => {
    if (e.target.closest(interactiveElements)) {
        cursor.classList.add("hover");
        follower.classList.add("hover");
    }
});

document.addEventListener("mouseout", (e) => {
    if (e.target.closest(interactiveElements)) {
        cursor.classList.remove("hover");
        follower.classList.remove("hover");
    }
});

// 6. Process Tabs Switching
const tabBtns = document.querySelectorAll(".process-tab-btn");
const tabContents = document.querySelectorAll(".process-tab-content");

tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-target");

        tabBtns.forEach(b => b.classList.remove("active"));
        tabContents.forEach(c => {
            c.classList.remove("active");
            gsap.set(c, { opacity: 0, y: 20 });
        });

        btn.classList.add("active");
        const activeContent = document.getElementById(target);
        activeContent.classList.add("active");
        gsap.to(activeContent, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
    });
});

// 7. Flavors Showcase Selection & Background Transitions
const flavorCards = document.querySelectorAll(".flavor-card");
const flavorsSection = document.getElementById("flavors-section");

const flavorThemes = {
    alphonso: {
        bg: "radial-gradient(circle at 50% 50%, #1a1208 0%, #030303 100%)",
        accent: "#ff9f1c"
    },
    chili: {
        bg: "radial-gradient(circle at 50% 50%, #20080a 0%, #030303 100%)",
        accent: "#e63946"
    },
    coconut: {
        bg: "radial-gradient(circle at 50% 50%, #15181a 0%, #030303 100%)",
        accent: "#a8dadc"
    }
};

flavorCards.forEach(card => {
    card.addEventListener("click", () => {
        const flavor = card.getAttribute("data-flavor");
        
        flavorCards.forEach(c => c.classList.remove("active"));
        card.classList.add("active");

        // Transition background theme
        const theme = flavorThemes[flavor];
        if (theme) {
            gsap.to(document.body, { backgroundImage: theme.bg, duration: 1.0 });
            
            // Highlight matching selector in the calculator
            const selectBtn = document.querySelector(`.select-btn[data-val="${flavor}"]`);
            if (selectBtn) selectBtn.click();
        }
    });
});

// 8. Interactive Order Pack Size Calculator
let currentFlavor = "alphonso";
let currentPackSize = 6;
let packPrice = 36.00;
let discountPercent = 0;
let currentQuantity = 1;

const flavorNames = {
    alphonso: "Alphonso Original",
    chili: "Spicy Chili",
    coconut: "Coconut Cream"
};

const updateOrderSummary = () => {
    const summaryFlavor = document.getElementById("summary-flavor");
    const summaryPack = document.getElementById("summary-pack");
    const summaryBase = document.getElementById("summary-base");
    const summaryDiscount = document.getElementById("summary-discount");
    const discountRow = document.getElementById("discount-row");
    const summaryTotal = document.getElementById("summary-total");

    // Calculations
    const basePrice = packPrice * currentQuantity;
    const discountAmount = basePrice * (discountPercent / 100);
    const totalPrice = basePrice - discountAmount;

    // Display Updates
    summaryFlavor.innerText = flavorNames[currentFlavor];
    summaryPack.innerText = `${currentPackSize} Bottles x ${currentQuantity}`;
    summaryBase.innerText = `$${basePrice.toFixed(2)}`;

    if (discountPercent > 0) {
        summaryDiscount.innerText = `-$${discountAmount.toFixed(2)}`;
        discountRow.style.display = "flex";
    } else {
        discountRow.style.display = "none";
    }

    // Smooth counter update animation
    gsap.to(summaryTotal, {
        innerText: totalPrice,
        duration: 0.5,
        snap: { innerText: 0.01 },
        onUpdate: function() {
            summaryTotal.innerText = `$${parseFloat(summaryTotal.innerText).toFixed(2)}`;
        }
    });
};

// Select Flavor Listener
const orderFlavorBtns = document.querySelectorAll(".select-btn");
orderFlavorBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        orderFlavorBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        currentFlavor = btn.getAttribute("data-val");

        // Sync card active state in flavor grid
        const matchingCard = document.querySelector(`.flavor-card[data-flavor="${currentFlavor}"]`);
        if (matchingCard && !matchingCard.classList.contains("active")) {
            matchingCard.click();
        }

        updateOrderSummary();
    });
});

// Select Pack Size Listener
const orderPackBtns = document.querySelectorAll(".pack-btn");
orderPackBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        orderPackBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        currentPackSize = parseInt(btn.getAttribute("data-pack"));
        packPrice = parseFloat(btn.getAttribute("data-price"));
        discountPercent = parseInt(btn.getAttribute("data-discount"));

        updateOrderSummary();
    });
});

// Quantity Incrementor Listeners
const qtyInput = document.getElementById("qty-input");
const qtyMinus = document.getElementById("qty-minus");
const qtyPlus = document.getElementById("qty-plus");

qtyMinus.addEventListener("click", () => {
    if (currentQuantity > 1) {
        currentQuantity--;
        qtyInput.value = currentQuantity;
        updateOrderSummary();
    }
});

qtyPlus.addEventListener("click", () => {
    if (currentQuantity < 10) {
        currentQuantity++;
        qtyInput.value = currentQuantity;
        updateOrderSummary();
    }
});

// Order Placement & Confetti Trigger
const orderSubmitBtn = document.getElementById("order-submit-btn");
orderSubmitBtn.addEventListener("click", () => {
    // Blast confetti!
    confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff9f1c', '#ffb703', '#ffffff', '#e63946']
    });

    // Change button text briefly
    const oldText = orderSubmitBtn.innerText;
    orderSubmitBtn.innerText = "Pre-Order Placed! ✓";
    orderSubmitBtn.style.background = "#2a9d8f";
    orderSubmitBtn.style.color = "#fff";

    setTimeout(() => {
        orderSubmitBtn.innerText = oldText;
        orderSubmitBtn.style.background = "";
        orderSubmitBtn.style.color = "";
    }, 3000);
});

// 9. FAQ Accordion Toggle Logic
const faqItems = document.querySelectorAll(".faq-item");
faqItems.forEach(item => {
    const trigger = item.querySelector(".faq-trigger");
    const content = item.querySelector(".faq-content");

    trigger.addEventListener("click", () => {
        const isActive = item.classList.contains("active");

        // Close all other panels
        faqItems.forEach(i => {
            i.classList.remove("active");
            i.querySelector(".faq-content").style.maxHeight = null;
            i.querySelector(".faq-trigger").setAttribute("aria-expanded", "false");
        });

        // Toggle selected panel
        if (!isActive) {
            item.classList.add("active");
            content.style.maxHeight = content.scrollHeight + "px";
            trigger.setAttribute("aria-expanded", "true");
        }
    });
});

// Start preloading images sequence
preloadImages();
