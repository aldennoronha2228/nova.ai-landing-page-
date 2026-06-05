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
  "NovaBoard AI signup storage is not enabled yet. Please enable Cloud Firestore for this Firebase project, then try again.";
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
          <a className="nav-brand" href="#" aria-label="NovaBoard AI home">
            <img className="nav-logo" src="/nova-logo-n.png" alt="" />
            <span>NovaBoard AI</span>
          </a>
          <div className={`nav-menu ${menuOpen ? "active" : ""}`}>
            <ul className="nav-links">
              <li>
                <a href="#" onClick={() => setMenuOpen(false)}>
                  Platform
                </a>
              </li>
              <li>
                <a href="#core-features" onClick={() => setMenuOpen(false)}>
                  Features
                </a>
              </li>
              <li>
                <a href="#" onClick={() => setMenuOpen(false)}>
                  Docs
                </a>
              </li>
            </ul>
            <div className="mobile-menu-actions">
              <a href="/admin/login" className="mobile-menu-secondary" onClick={() => setMenuOpen(false)}>
                Sign In
              </a>
              <Link href="/alpha" className="mobile-menu-primary" onClick={() => setMenuOpen(false)}>
                Alpha Waitlist
              </Link>
            </div>
          </div>
          <button
            type="button"
            className={`menu-toggle ${menuOpen ? "active" : ""}`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
          </button>
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
                <span className="icon-caption center">NovaBoard Core</span>
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
              <motion.span {...heroMotionProps(0.05, disableMobileMotion)} className="hero-kicker">
                AI-NATIVE HARDWARE PLATFORM
              </motion.span>
              <motion.h1 {...heroMotionProps(0.15, disableMobileMotion)} className="hero-heading">
                Design, simulate, and deploy
                <br />
                <span className="accent-serif">intelligent hardware</span> with AI.
              </motion.h1>
              <motion.p {...heroMotionProps(0.25, disableMobileMotion)} className="hero-sub">
                Nova AI combines circuit generation, embedded code intelligence, real-time simulation,
                and edge deployment into one seamless workspace for modern hardware teams.
              </motion.p>
              <motion.div {...heroMotionProps(0.35, disableMobileMotion)} className="hero-actions">
                <Link
                  href="/alpha"
                  className="btn-cta"
                >
                  Join Alpha Waitlist
                </Link>
              </motion.div>
              <motion.div {...heroMotionProps(0.45, disableMobileMotion)} className="hero-trust">
                <span>Early builders are joining the Alpha waitlist</span>
                <span>Private Alpha applications are now open</span>
                <span>Selected testers help shape NovaBoard AI's development</span>
              </motion.div>
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

      <section className="features-section" id="core-features">
        <motion.div {...fadeUp(0.1)} className="features-header">
          <span className="section-label">Core Features</span>
          <h2>Everything you need to build intelligent hardware.</h2>
          <p>
            NovaBoard AI unifies circuit design, firmware generation, component
            selection, BOM creation, wiring diagrams, documentation, simulation,
            and deployment into one hardware-focused AI workspace.
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
              operation, local decision making, and offline execution at the
              edge.
            </p>
            <ul>
              <li>Local AI workflows</li>
              <li>Offline hardware logic</li>
              <li>Edge-ready deployment</li>
            </ul>
          </motion.article>
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

      <section className="how-section">
        <motion.div {...fadeUp(0.1)} className="features-header">
          <span className="section-label">How It Works</span>
          <h2>From idea to hardware in four steps.</h2>
        </motion.div>
        <div className="how-steps">
          <motion.div {...fadeUp(0.2)} className="step-card">
            <span>Step 1</span>
            <h3>Describe your hardware idea</h3>
          </motion.div>
          <motion.div {...fadeUp(0.25)} className="step-card">
            <span>Step 2</span>
            <h3>Generate circuits and firmware instantly</h3>
          </motion.div>
          <motion.div {...fadeUp(0.3)} className="step-card">
            <span>Step 3</span>
            <h3>Simulate and test in real time</h3>
          </motion.div>
          <motion.div {...fadeUp(0.35)} className="step-card">
            <span>Step 4</span>
            <h3>Deploy directly to hardware</h3>
          </motion.div>
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
            <Link href="/alpha" className="beta-submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Apply for Alpha Access
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="site-footer">
        <a href="/admin/login" className="nav-login-button">
          Admin login
        </a>
        <p className="site-footer-note">
          Secure admin access for internal team management and campaign analytics.
        </p>
      </footer>
    </>
  );
}

export default App;
