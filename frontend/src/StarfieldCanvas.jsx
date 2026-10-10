import React, { useEffect, useRef } from "react";
import { Box } from "@chakra-ui/react";

export const StarfieldCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const starCount = 120;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      baseAlpha: Math.random() * 0.7 + 0.3,
      blinkSpeed: 0.015 + Math.random() * 0.02,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.x += star.vx;
        star.y += star.vy;

        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        const currentAlpha =
          star.baseAlpha + Math.sin(Date.now() * star.blinkSpeed) * 0.25;
        const boundedAlpha = Math.max(0.1, Math.min(1, currentAlpha));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${boundedAlpha})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = "#ffffff";
        ctx.fill();

        for (let j = i + 1; j < stars.length; j++) {
          const starB = stars[j];
          const dist = Math.hypot(star.x - starB.x, star.y - starB.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(starB.x, starB.y);
            const lineOpacity = (1 - dist / 110) * 0.16;
            ctx.strokeStyle = `rgba(147, 197, 253, ${lineOpacity})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <Box
      as="canvas"
      ref={canvasRef}
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      pointerEvents="none"
      zIndex={0}
      background="radial-gradient(ellipse at bottom, #0f172a 0%, #030712 100%)"
    />
  );
};