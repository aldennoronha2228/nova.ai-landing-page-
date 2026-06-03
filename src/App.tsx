import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
      <div className="brands" aria-hidden={false}>
        <div className="brands-track" aria-hidden={false}>
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
              <span className="hubspot-dot" />
              t
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

        {/* duplicated track for seamless looping */}
        <div className="brands-track" aria-hidden={true}>
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
              <span className="hubspot-dot" />
              t
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
      </div>
    target: whyRef,
    offset: ["start center", "end center"],
  });

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

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

  const handleBetaSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingBeta) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    if (!name || !phone || !email) {
      setBetaStatus({
        type: "error",
        message: "Please enter your name, phone number, and email address.",
      });
      return;
    }

    if (!email) {
      setBetaStatus({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    try {
      setIsSubmittingBeta(true);
      setBetaStatus(null);

      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phone, email }),
      });

      const rawResponse = await response.text();
      let payload: {
        message?: string;
        saved?: boolean;
        emailed?: boolean;
        duplicate?: boolean;
      } = {};
      if (rawResponse) {
        try {
          payload = JSON.parse(rawResponse) as {
            message?: string;
            saved?: boolean;
            emailed?: boolean;
            duplicate?: boolean;
          };
        } catch {
          payload = {};
        }
      }

      if (response.status === 409 && payload.duplicate) {
        setBetaStatus({
          type: "success",
          message:
            payload.message ??
            "You have already applied for Nova AI Alpha access.",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to complete sign up.");
      }

      form.reset();
      setBetaStatus({
        type: "success",
        message:
          payload.message ??
          "You're on the alpha list! Check your inbox for a confirmation email from Nova AI.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Try again.";
      setBetaStatus({
        type: "error",
        message,
      });
    } finally {
      setIsSubmittingBeta(false);
    }
  };

  const scrollToBeta = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setMenuOpen(false);
    try {
      betaFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } catch (err) {
      window.location.hash = "#beta";
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
          <a className="nav-brand" href="#" aria-label="Nova AI home">
            <img className="nav-logo" src="/nova-logo-n.png" alt="" />
            <span>Nova AI</span>
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
              <a href="#" className="mobile-menu-secondary" onClick={() => setMenuOpen(false)}>
                Sign In
              </a>
              <a href="#beta" className="mobile-menu-primary" onClick={scrollToBeta}>
                Get Alpha Access
              </a>
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
                <span className="icon-caption">AI Circuit Design</span>
              </div>

              <div className="pipeline-line" />

              <div className="center-wrap">
                <div className="splash" ref={splashRef} />
                <div className="icon-node-center" id="node-x" ref={nodeXRef}>
                  <svg viewBox="0 0 40 40" aria-hidden="true">
                    <path d="M10 8h6l4 6 4-6h6l-7 10 7 10h-6l-4-6-4 6h-6l7-10z" />
                  </svg>
                </div>
                <span className="icon-caption center">Nova Neural Core</span>
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
                <span className="icon-caption">Secure Edge Deployment</span>
              </div>
            </div>

            <div className="hero-content">
              <motion.span {...fadeUp(0.05)} className="hero-kicker">
                AI-NATIVE HARDWARE PLATFORM
              </motion.span>
              <motion.h1 {...fadeUp(0.15)} className="hero-heading">
                Design, simulate, and deploy
                <br />
                <span className="accent-serif">intelligent hardware</span> with
                AI.
              </motion.h1>
              <motion.p {...fadeUp(0.25)} className="hero-sub">
                Nova AI combines circuit generation, embedded code intelligence,
                real-time simulation, and edge deployment into one seamless
                workspace for modern hardware teams.
              </motion.p>
              <motion.div {...fadeUp(0.35)} className="hero-actions">
                <a
                  href="#"
                  className="btn-cta"
                  onClick={scrollToBeta}
                >
                  Join the Alpha
                </a>
                <a href="#" className="btn-ghost">
                  View Platform
                </a>
              </motion.div>
              <p className="hero-note">
                Alpha users receive early access to upcoming features, direct
                feedback channels, and the opportunity to influence Nova AI's
                development.
              </p>
              <motion.div {...fadeUp(0.45)} className="hero-trust">
                <span>1,200+ early builders joined</span>
                <span>Private alpha now accepting applications</span>
                <span>
                  Alpha users help shape Nova AI's development
                </span>
              </motion.div>
              <motion.div {...fadeUp(0.55)} className="hero-pills">
                <span>AI Circuit Generation</span>
                <span>Real-Time Simulation</span>
                <span>Embedded Code AI</span>
                <span>Edge Deployment</span>
                <span>Hardware Collaboration</span>
                <span>Live Debugging</span>
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
            Nova AI unifies circuit design, embedded development, simulation,
            debugging, and deployment into one AI-native engineering workspace.
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

      <section className="why-section" ref={whyRef}>
        <motion.div {...fadeUp(0.1)} className="why-card">
          <div>
            <span className="section-label">Why Nova AI</span>
            <h2>Built for the next generation of hardware developers.</h2>
            <WordReveal
              text="Modern electronics development is fragmented across simulators, IDEs, documentation, AI tools, and deployment systems. Nova AI brings everything into a single intelligent workflow designed for speed, experimentation, and real-world deployment."
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
              <h3>Arduino + ESP32 + Nova AI support</h3>
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
            <span className="beta-kicker">Private Alpha Access</span>
            <h2 className="beta-heading">
              Join the Alpha Waitlist.
            </h2>
            <p className="beta-sub">
              Nova AI is currently in private alpha. Join the waitlist to gain
              early access and help us build the future of intelligent hardware
              development.
            </p>
            <div className="beta-highlights">
              <span className="beta-pill alpha-badge">Private Alpha</span>
              <span className="beta-pill">Direct Feedback Channels</span>
              <span className="beta-pill">Influence Product Development</span>
            </div>
          </div>
          <form
            ref={betaFormRef}
            id="beta"
            className="beta-form"
            onSubmit={handleBetaSignup}
          >
            <label className="beta-label" htmlFor="beta-email">
              Reserve your spot in the Nova AI Alpha.
            </label>
            <div className="beta-input-grid">
              <input
                id="beta-name"
                type="text"
                name="name"
                placeholder="Your name"
                required
                disabled={isSubmittingBeta}
              />
              <input
                id="beta-phone"
                type="tel"
                name="phone"
                placeholder="Phone number"
                required
                disabled={isSubmittingBeta}
              />
              <input
                id="beta-email"
                type="email"
                name="email"
                placeholder="you@company.com"
                required
                disabled={isSubmittingBeta}
              />
              <button
                type="submit"
                className="beta-submit"
                disabled={isSubmittingBeta}
              >
                {isSubmittingBeta ? "Sending..." : "Request Alpha Access"}
              </button>
            </div>
            {betaStatus ? (
              <p
                className={`beta-message beta-message-${betaStatus.type}`}
                role={betaStatus.type === "error" ? "alert" : "status"}
              >
                {betaStatus.message}
              </p>
            ) : null}
            <p className="beta-footnote">
              Alpha users receive early access to upcoming features, direct
              feedback channels, and the opportunity to influence Nova AI's
              development.
            </p>
          </form>
        </motion.div>
      </section>
    </>
  );
}

export default App;
