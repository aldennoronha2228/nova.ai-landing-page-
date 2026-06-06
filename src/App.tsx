import { useEffect, useRef, useState, type MouseEvent } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import Link from "next/link";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-120px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

const heroMotionProps = (delay: number, disabled: boolean) =>
  disabled
    ? {}
    : fadeUp(delay);

const alphaSuccessMessage =
  "You're on the NovaBoard AI Alpha waitlist. Thank you for your interest in NovaBoard AI — we've received your application and will reach out with Alpha invitations to selected testers soon.";
const alphaErrorMessage = "We couldn't process your request. Please try again.";
const alphaBackendMessage =
  "NovaBoard AI signup storage is not enabled yet. Please check the server configuration and try again.";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isValidEmail = (value: string): boolean => emailPattern.test(value);

const WordReveal = ({
  text,
  progress,
  highlightWords = [],
  rootClassName,
  highlightClassName,
}: {
  text: string;
  progress: MotionValue<number>;
  highlightWords?: string[];
  rootClassName?: string;
  highlightClassName?: string;
}) => {
  const words = text.split(" ");
  return (
    <p className={`word-reveal ${rootClassName ?? ""}`}>
      {words.map((word, index) => {
        const start = index / words.length;
        const end = start + 1 / words.length;
        const opacity = useTransform(progress, [start, end], [0.15, 1]);
        const cleanWord = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
        const isHighlight = highlightWords.includes(cleanWord);

        return (
          <motion.span
            key={`${word}-${index}`}
            style={{ opacity }}
            className={isHighlight ? highlightClassName : ""}
          >
            {word} {" "}
          </motion.span>
        );
      })}
    </p>
  );
};

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pipelineRef = useRef<HTMLDivElement | null>(null);
  const nodeStackRef = useRef<HTMLDivElement | null>(null);
  const nodeXRef = useRef<HTMLDivElement | null>(null);
  const nodeShieldRef = useRef<HTMLDivElement | null>(null);
  const beamAuraRef = useRef<SVGPathElement | null>(null);
  const beamRailRef = useRef<SVGPathElement | null>(null);
  const beamGlowRef = useRef<SVGPathElement | null>(null);
  const beamCoreRef = useRef<SVGPathElement | null>(null);
  const beamGradientRef = useRef<SVGLinearGradientElement | null>(null);
  const beamSparkARef = useRef<SVGCircleElement | null>(null);
  const beamSparkBRef = useRef<SVGCircleElement | null>(null);
  const beamSparkCRef = useRef<SVGCircleElement | null>(null);
  const splashRef = useRef<HTMLDivElement | null>(null);
  const heroViewportRef = useRef<HTMLDivElement | null>(null);
  const heroCardRef = useRef<HTMLElement | null>(null);
  const heroInnerRef = useRef<HTMLDivElement | null>(null);
  const whyRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: whyProgress } = useScroll({
    target: whyRef,
    offset: ["start center", "end center"],
  });

  const [disableMobileMotion, setDisableMobileMotion] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const updateMotion = () => {
      setDisableMobileMotion(
        typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
      );
    };

    updateMotion();
    window.addEventListener("resize", updateMotion);
    return () => window.removeEventListener("resize", updateMotion);
  }, []);

  useEffect(() => {
    const viewport = heroViewportRef.current;
    const card = heroCardRef.current;
    const inner = heroInnerRef.current;
    if (!viewport || !card || !inner) return;

    const fitHero = () => {
      inner.style.setProperty("--hero-scale", "1");
      const cardStyles = getComputedStyle(card);
      const padY =
        parseFloat(cardStyles.paddingTop) +
        parseFloat(cardStyles.paddingBottom);
      const available = card.clientHeight - padY;
      const needed = inner.scrollHeight;
      if (needed > available && available > 0) {
        let scale = Math.min(1, available / needed);
        inner.style.setProperty("--hero-scale", scale.toFixed(4));
        const scaledHeight = inner.getBoundingClientRect().height;
        if (scaledHeight > available) {
          scale = Math.min(1, scale * (available / scaledHeight));
          inner.style.setProperty("--hero-scale", scale.toFixed(4));
        }
      }
    };

    const ro = new ResizeObserver(fitHero);
    ro.observe(viewport);
    ro.observe(card);
    ro.observe(inner);
    window.addEventListener("resize", fitHero);
    void document.fonts?.ready?.then(fitHero);
    fitHero();
    const delayedFit = window.setTimeout(fitHero, 400);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fitHero);
      window.clearTimeout(delayedFit);
    };
  }, []);

  const scrollToWhy = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setMenuOpen(false);
    try {
      whyRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    } catch (err) {
      window.location.hash = "#why";
    }
  };

  useEffect(() => {
    const pipeline = pipelineRef.current;
    const nodeStack = nodeStackRef.current;
    const nodeX = nodeXRef.current;
    const nodeShield = nodeShieldRef.current;
    const beamAura = beamAuraRef.current;
    const beamRail = beamRailRef.current;
    const beamGlow = beamGlowRef.current;
    const beamCore = beamCoreRef.current;
    const sparkA = beamSparkARef.current;
    const sparkB = beamSparkBRef.current;
    const sparkC = beamSparkCRef.current;

    if (
      !pipeline ||
      !nodeStack ||
      !nodeX ||
      !nodeShield ||
      !beamAura ||
      !beamRail ||
      !beamGlow ||
      !beamCore ||
      !sparkA ||
      !sparkB ||
      !sparkC
    ) {
      return;
    }

    let totalLen = 0;

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const edgeFade = (t: number) => {
      const edge = 0.12;
      if (t < edge) return t / edge;
      if (t > 1 - edge) return (1 - t) / edge;
      return 1;
    };

    const updateBeamPath = () => {
      const pRect = pipeline.getBoundingClientRect();
      const sRect = nodeStack.getBoundingClientRect();
      const xRect = nodeX.getBoundingClientRect();
      const shRect = nodeShield.getBoundingClientRect();
      const startX = sRect.left + sRect.width / 2 - pRect.left;
      const startY = sRect.top + sRect.height / 2 - pRect.top;
      const midX = xRect.left + xRect.width / 2 - pRect.left;
      const midY = xRect.top + xRect.height / 2 - pRect.top;
      const endX = shRect.left + shRect.width / 2 - pRect.left;
      const endY = shRect.top + shRect.height / 2 - pRect.top;
      const d = `M ${startX},${startY} L ${midX},${midY} L ${endX},${endY}`;

      beamAura.setAttribute("d", d);
      beamRail.setAttribute("d", d);
      beamGlow.setAttribute("d", d);
      beamCore.setAttribute("d", d);

      try {
        totalLen = Math.max(1, Math.round(beamCore.getTotalLength()));
      } catch {
        totalLen = 0;
      }
    };

    updateBeamPath();
    window.addEventListener("resize", updateBeamPath);

    let rafId = 0;
    const cycleMs = 2400;
    const sparkEls = [sparkA, sparkB, sparkC];
    const sparkLags = [14, 28, 44];

    const animateBeam = (time: number) => {
      if (totalLen > 0) {
        const raw = (time % cycleMs) / cycleMs;
        const eased = easeInOutCubic(raw);
        const dist = eased * totalLen;
        const speedEnvelope = Math.sin(Math.PI * raw);
        const visibility = edgeFade(raw);

        const coreLen = Math.max(
          16,
          Math.min(58, totalLen * 0.06 * (0.84 + speedEnvelope * 0.66)),
        );
        const glowLen = Math.max(
          28,
          Math.min(116, coreLen * (1.7 + speedEnvelope * 0.45)),
        );

        beamCore.style.strokeDasharray = `${coreLen} ${Math.max(8, totalLen - coreLen)}`;
        beamGlow.style.strokeDasharray = `${glowLen} ${Math.max(8, totalLen - glowLen)}`;
        beamCore.style.strokeDashoffset = `${-dist}`;
        beamGlow.style.strokeDashoffset = `${-dist}`;

        beamCore.style.opacity = `${(0.38 + speedEnvelope * 0.42) * visibility}`;
        beamGlow.style.opacity = `${(0.2 + speedEnvelope * 0.52) * visibility}`;

        sparkEls.forEach((spark, index) => {
          const trailDist = Math.max(0, dist - sparkLags[index]);
          const p = beamCore.getPointAtLength(trailDist);
          spark.setAttribute("cx", `${p.x}`);
          spark.setAttribute("cy", `${p.y}`);
          spark.style.opacity = `${(0.2 + speedEnvelope * 0.42) * visibility * (1 - index * 0.28)}`;
        });
      }

      rafId = window.requestAnimationFrame(animateBeam);
    };

    rafId = window.requestAnimationFrame(animateBeam);

    return () => {
      window.removeEventListener("resize", updateBeamPath);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const revealItems = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal"),
    );
    const parallaxItems = Array.from(
      document.querySelectorAll<HTMLElement>("[data-parallax]"),
    );
    const staggerGroups = Array.from(
      document.querySelectorAll<HTMLElement>("[data-stagger]"),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.2 },
    );

    revealItems.forEach((item) => observer.observe(item));
    staggerGroups.forEach((group) => {
      Array.from(group.children).forEach((child, index) => {
        if (child instanceof HTMLElement) {
          child.style.setProperty("--stagger-index", index.toString());
        }
      });
    });

    let rafId = 0;
    const update = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
      root.style.setProperty("--scroll-progress", progress.toString());
      root.style.setProperty("--scroll-shift", `${progress * 100}%`);

      parallaxItems.forEach((item) => {
        const speed = Number(item.dataset.parallax ?? "0.08");
        const offset = scrollY * speed * -1;
        item.style.setProperty("--parallax-offset", `${offset}px`);
      });

      rafId = 0;
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <>
      <div className="hero-viewport" ref={heroViewportRef}>
        <nav className="nav-bar">
          <Link href="/" className="nav-brand">
            <img className="nav-logo" src="/nova-logo-n.png" alt="" />
            <div className="brand-stack">
              <span>WireUp</span>
              <small className="brand-byline">by NovaBoard AI</small>
            </div>
          </Link>
          <div className={`nav-menu ${menuOpen ? "active" : ""}`}>
            <ul className="nav-links">
              <li><a href="#features" onClick={() => setMenuOpen(false)}>Features</a></li>
              <li><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a></li>
              <li><a href="#waitlist" onClick={() => setMenuOpen(false)}>Waitlist</a></li>
              <li><a href="#about" onClick={() => setMenuOpen(false)}>About</a></li>
              <li><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a></li>
            </ul>
            <div className="mobile-menu-actions">
              <Link href="/alpha" className="mobile-menu-primary" onClick={() => setMenuOpen(false)}>
                Join Waitlist
              </Link>
            </div>
          </div>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/alpha" className="nav-login-button" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)', display: 'none' }}>
              Join Waitlist
            </Link>
            <button
              type="button"
              className={`menu-toggle ${menuOpen ? "active" : ""}`}
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
            </button>
          </div>
        </nav>

        <section className="hero-card" ref={heroCardRef}>
          <div
            className="scroll-glow hero-glow"
            data-parallax="0.12"
            aria-hidden="true"
          />
          <div className="hero-grid" data-parallax="0.06" />
          <div className="hero-card-inner" ref={heroInnerRef}>
            <div className="icon-pipeline" ref={pipelineRef}>
              <svg className="beam-svg" aria-hidden="true">
                <defs>
                  <filter id="beam-soft-glow">
                    <feGaussianBlur stdDeviation="2.8" result="soft" />
                    <feComposite
                      in="soft"
                      in2="SourceGraphic"
                      operator="over"
                    />
                  </filter>
                  <linearGradient
                    id="beam-gradient"
                    gradientUnits="objectBoundingBox"
                    ref={beamGradientRef}
                  >
                    <stop offset="0%" stopColor="#f6f4ff" stopOpacity="0.75" />
                    <stop offset="40%" stopColor="#f8f1ff" stopOpacity="1" />
                    <stop
                      offset="100%"
                      stopColor="#d9cbff"
                      stopOpacity="0.78"
                    />
                  </linearGradient>
                </defs>
                <path
                  ref={beamAuraRef}
                  className="beam-path beam-aura"
                  stroke="rgba(212, 196, 255, 0.28)"
                  strokeWidth="2.2"
                  fill="none"
                />
                <path
                  ref={beamRailRef}
                  className="beam-path beam-rail"
                  stroke="rgba(228, 224, 255, 0.3)"
                  strokeWidth="0.95"
                  fill="none"
                />
                <path
                  ref={beamGlowRef}
                  className="beam-path beam-glow"
                  stroke="url(#beam-gradient)"
                  strokeWidth="4"
                  filter="url(#beam-soft-glow)"
                  opacity="0"
                  fill="none"
                />
                <path
                  ref={beamCoreRef}
                  className="beam-path beam-core"
                  stroke="url(#beam-gradient)"
                  strokeWidth="1.6"
                  opacity="0"
                  fill="none"
                />
                <circle
                  ref={beamSparkARef}
                  className="beam-spark beam-spark-a"
                  r="1.7"
                  cx="0"
                  cy="0"
                />
                <circle
                  ref={beamSparkBRef}
                  className="beam-spark beam-spark-b"
                  r="1.35"
                  cx="0"
                  cy="0"
                />
                <circle
                  ref={beamSparkCRef}
                  className="beam-spark beam-spark-c"
                  r="1.05"
                  cx="0"
                  cy="0"
                />
              </svg>

              <div className="icon-node-wrap">
                <div
                  className="icon-node node-light-right"
                  id="node-stack"
                  ref={nodeStackRef}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <span className="icon-caption">Design</span>
              </div>

              <div className="pipeline-line" />

              <div className="center-wrap">
                <div className="splash" ref={splashRef} />
                <div className="icon-node-center" id="node-x" ref={nodeXRef}>
                  <svg viewBox="0 0 40 40" aria-hidden="true">
                    <path d="M10 8h6l4 6 4-6h6l-7 10 7 10h-6l-4-6-4 6h-6l7-10z" />
                  </svg>
                </div>
                <span className="icon-caption center">WireUp Core</span>
              </div>

              <div className="pipeline-line right" />

              <div className="icon-node-wrap">
                <div
                  className="icon-node node-light-left"
                  id="node-shield"
                  ref={nodeShieldRef}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <span className="icon-caption">Deployment</span>
              </div>
            </div>

            <div className="hero-content">
                <motion.span {...heroMotionProps(0.05, disableMobileMotion)} className="hero-kicker alpha-program-badge">
                  WIREUP BY NOVABOARD AI
                </motion.span>
                <motion.h1 {...heroMotionProps(0.15, disableMobileMotion)} className="hero-heading">
                  Design, simulate, and deploy
                  <br />
                  <span className="accent-serif">intelligent hardware</span> with WireUp.
                </motion.h1>
                <motion.p {...heroMotionProps(0.25, disableMobileMotion)} className="hero-sub">
                  WireUp combines circuit generation, embedded code intelligence, real-time simulation,
                  and edge deployment into one seamless workspace for modern hardware teams.
                </motion.p>
                <motion.div {...heroMotionProps(0.35, disableMobileMotion)} className="hero-actions">
                  <Link
                    href="/alpha"
                    className="btn-cta"
                  >
                    Join WireUp Waitlist
                  </Link>
                </motion.div>
                <motion.p 
                  {...heroMotionProps(0.45, disableMobileMotion)}
                  className="hero-support-text"
                  style={{ marginTop: '32px', opacity: 0.6, fontSize: '0.9rem' }}
                >
                  Built by NovaBoard AI for students, makers, hobbyists, engineers, and innovators.
                </motion.p>
                <motion.div {...heroMotionProps(0.55, disableMobileMotion)} className="hero-pills">
                <div className="hero-pills-track" aria-hidden="false">
                  <span>AI Circuit Generation</span>
                  <span>Real-Time Simulation</span>
                  <span>Embedded Code AI</span>
                  <span>Edge Deployment</span>
                  <span>Hardware Collaboration</span>
                  <span>Live Debugging</span>
                  <span>AI Circuit Generation</span>
                  <span>Real-Time Simulation</span>
                  <span>Embedded Code AI</span>
                  <span>Edge Deployment</span>
                  <span>Hardware Collaboration</span>
                  <span>Live Debugging</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>

      <div className="brands">
        <div className="brand-item">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <path fill="var(--bg)" d="M8 9h8v2H8zm0 4h6v2H8z" />
          </svg>
          <span>Expedia</span>
        </div>
        <div className="brand-item">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="7" r="4" fill="currentColor" />
            <circle cx="5" cy="16" r="3.5" fill="currentColor" />
            <circle cx="19" cy="16" r="3.5" fill="currentColor" />
          </svg>
          <span>asana</span>
        </div>
        <div className="brand-item">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <polyline points="4 8 20 8" fill="none" />
            <polyline points="8 12 16 12" fill="none" />
            <polyline points="4 16 20 16" fill="none" />
          </svg>
          <span>zenefits</span>
        </div>
        <div className="brand-item">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="15.5" cy="8.5" r="2.5" fill="currentColor" />
            <circle
              cx="8.5"
              cy="8.5"
              r="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M10.2 9.8l3.2 2.6m0 0H18m-4.6 0v4.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            HubSp
            <span className="hubspot-dot" />t
          </span>
        </div>
        <div className="brand-item">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>loom</span>
        </div>
      </div>

      {/* Core Features Section */}
      <section id="features" className="product-image-section">
        <div className="product-image-container">
          <img src="/features-bg.png" alt="WireUp Hardware Development" className="product-image" />
          <div className="product-image-overlay" />
          
          <div className="overlay-content">
            <motion.div {...fadeUp(0.1)} className="features-header">
              <span className="section-label">CORE FEATURES</span>
              <h2 className="accent-serif">Everything you need to build <i>intelligent hardware.</i></h2>
              <p>
                WireUp unifies circuit design, firmware generation, component selection, BOM
                creation, wiring diagrams, documentation, simulation, and deployment into one
                hardware-focused AI workspace.
              </p>
            </motion.div>

            <div className="feature-grid">
              <motion.article {...fadeUp(0.15)} className="feature-card">
                <h3>AI Circuit Generation</h3>
                <p>
                  Describe your idea in plain English and instantly generate
                  complete circuits, wiring layouts, and hardware architectures
                  powered by AI.
                </p>
                <ul>
                  <li>Smart component selection</li>
                  <li>Auto-generated schematics</li>
                  <li>Arduino & ESP32 support</li>
                </ul>
              </motion.article>

              <motion.article {...fadeUp(0.2)} className="feature-card">
                <h3>Real-Time Hardware Simulation</h3>
                <p>
                  Test and validate electronics projects directly in the browser
                  with live simulation, real-time signal updates, and instant
                  feedback loops.
                </p>
                <ul>
                  <li>Browser-based simulation</li>
                  <li>Live serial monitor</li>
                  <li>Interactive component testing</li>
                </ul>
              </motion.article>

              <motion.article {...fadeUp(0.25)} className="feature-card">
                <h3>Embedded Code Intelligence</h3>
                <p>
                  Generate, edit, optimize, and debug embedded firmware using AI
                  trained for hardware workflows and microcontroller systems.
                </p>
                <ul>
                  <li>AI firmware assistant</li>
                  <li>Instant code debugging</li>
                  <li>Multi-board compatibility</li>
                </ul>
              </motion.article>

              <motion.article {...fadeUp(0.3)} className="feature-card">
                <h3>One-Click Deployment</h3>
                <p>
                  Compile and push code directly to connected boards without
                  switching tools, terminals, or desktop applications.
                </p>
                <ul>
                  <li>Direct USB flashing</li>
                  <li>Board auto-detection</li>
                  <li>Fast compile pipeline</li>
                </ul>
              </motion.article>

              <motion.article {...fadeUp(0.35)} className="feature-card">
                <h3>Collaborative Hardware Workspace</h3>
                <p>
                  Work together in shared projects with synchronized circuits, live
                  editing, version history, and AI-assisted collaboration.
                </p>
                <ul>
                  <li>Multiplayer editing</li>
                  <li>Shared simulations</li>
                  <li>Version control support</li>
                </ul>
              </motion.article>

              <motion.article {...fadeUp(0.4)} className="feature-card">
                <h3>Edge AI Infrastructure</h3>
                <p>
                  Deploy intelligent hardware systems capable of autonomous
                  operation, local decision making, and offline execution at the edge.
                </p>
                <ul>
                  <li>Local AI workflows</li>
                  <li>Offline hardware logic</li>
                  <li>Edge-ready deployment</li>
                </ul>
              </motion.article>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="why-section" ref={whyRef}>
        <motion.div {...fadeUp(0.1)} className="why-card">
          <div>
            <span className="section-label">Why NovaBoard AI</span>
            <h2>Built for the next generation of hardware developers.</h2>
            <WordReveal
              text="Modern electronics development is fragmented across simulators, IDEs, component research, documentation, firmware tools, and deployment systems. NovaBoard AI brings everything into a single intelligent workflow designed for speed, experimentation, and real-world hardware development."
              progress={whyProgress}
              highlightWords={["intelligent", "speed", "deployment"]}
              rootClassName="why-reveal"
              highlightClassName="word-highlight"
            />
          </div>
          <div className="stats-grid">
            <motion.div {...fadeUp(0.2)} className="stat-card">
              <h3>10x Faster Prototyping</h3>
              <p>Real-time AI-assisted hardware workflows</p>
            </motion.div>
            <motion.div {...fadeUp(0.3)} className="stat-card">
              <h3>Arduino + ESP32 + NovaBoard AI support</h3>
              <p>Built for robotics, IoT, and embedded systems</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="how-it-works-bg-image" />
        <div className="how-it-works-bg-graphics" />
        
        <div className="overlay-content" style={{ padding: '80px 24px' }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '12px' }}>How WireUp Works</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>From concept to hardware in four simple steps</p>
          </div>
          <div className="how-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
            <div className="step-card" style={{ padding: '32px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', backdropFilter: 'blur(12px)' }}>
               <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '12px' }}>01</div>
               <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Describe your idea</h3>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4' }}>Tell WireUp what you want to build using natural language prompts.</p>
             </div>
             <div className="step-card" style={{ padding: '32px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', backdropFilter: 'blur(12px)' }}>
               <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '12px' }}>02</div>
               <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>AI Generation</h3>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4' }}>WireUp generates circuits, components, and code tailored to your project.</p>
             </div>
             <div className="step-card" style={{ padding: '32px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', backdropFilter: 'blur(12px)' }}>
               <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '12px' }}>03</div>
               <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Refine & Iterate</h3>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4' }}>Refine and iterate with AI assistance to perfect your design.</p>
             </div>
             <div className="step-card" style={{ padding: '32px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', backdropFilter: 'blur(12px)' }}>
               <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '12px' }}>04</div>
               <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Build Faster</h3>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4' }}>Build faster and smarter with complete documentation and firmware.</p>
             </div>
           </div>
          <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.4, fontSize: '0.75rem' }}>
            Powered by NovaBoard AI
          </div>
        </div>
      </section>

      <section className="beta-section">
        <div
          className="scroll-glow beta-glow"
          data-parallax="0.14"
          aria-hidden="true"
        />
        <div className="beta-grid" data-parallax="0.08" />
        <motion.div {...fadeUp(0.15)} className="beta-inner">
          <div className="beta-copy">
            <span className="beta-kicker">Alpha Waitlist</span>
            <h2 className="beta-heading">
              Join the NovaBoard AI Alpha Program.
            </h2>
            <p className="beta-sub">
              Help shape the future of AI-powered hardware development. We're inviting electronics enthusiasts, makers, students, ESP32 developers, Arduino users, and embedded engineers to test NovaBoard AI before public launch.
            </p>
            <div className="beta-highlights">
              <span className="beta-pill alpha-badge">Private Alpha</span>
              <span className="beta-pill">Direct Feedback Channels</span>
              <span className="beta-pill">Influence Product Development</span>
            </div>
          </div>
          <div className="beta-form" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', minWidth: '320px', zIndex: 1 }}>
            <h3 className="beta-heading">Apply for Alpha Access</h3>
            <p className="beta-sub" style={{ marginBottom: '24px' }}>
              We're selecting highly engaged builders and developers to test NovaBoard AI and provide feedback.
            </p>
            <Link href="/alpha" className="beta-submit">
              Apply for Alpha Access
            </Link>
          </div>
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section" style={{ padding: '60px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <span className="alpha-program-badge" style={{ marginBottom: '16px', fontSize: '0.7rem' }}>BUILT BY NOVABOARD AI</span>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: 600, letterSpacing: '-0.02em' }}>NovaBoard AI is the parent company of WireUp</h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.5', opacity: 0.8 }}>
            NovaBoard AI is building the future of AI-powered hardware development tools. Our first product, WireUp, helps makers, students, hobbyists, and engineers design and build electronics projects faster with AI.
          </p>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand-section">
            <div className="brand-stack">
              <div className="footer-logo-row">
                <img src="/nova-logo-n.png" alt="NovaBoard Logo" className="footer-logo-img" />
                <span className="footer-logo-text">WireUp</span>
              </div>
              <small className="brand-byline">by NovaBoard AI</small>
            </div>
            <p className="footer-desc">
              WireUp is an AI-powered hardware development platform created by NovaBoard AI.
            </p>
            <a href="mailto:novaboardai@gmail.com" className="footer-contact-email">
              novaboardai@gmail.com
            </a>
          </div>
          
          <div className="footer-nav-section">
            <div className="footer-link-group">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#waitlist">Waitlist</a>
            </div>
            <div className="footer-link-group">
              <h4>Company</h4>
              <a href="#about">About WireUp</a>
              <a href="https://novaboard.ai" target="_blank" rel="noopener">NovaBoard AI</a>
              <a href="/admin/login">Admin Login</a>
            </div>
            <div className="footer-link-group">
              <h4>Legal</h4>
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">© 2026 NovaBoard AI. All Rights Reserved.</p>
          <div className="footer-bottom-actions">
            <a 
              href="https://www.instagram.com/wireups.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="Follow us on Instagram"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a 
              href="https://youtube.com/@novaboard-s9b"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="Subscribe to our YouTube channel"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a href="/admin/login" className="discreet-admin-link">
              Admin
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
