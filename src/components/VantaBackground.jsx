import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import BIRDS from "vanta/dist/vanta.birds.min";

/**
 * Component wrapper tái sử dụng hiệu ứng chim bay 3D của Vanta.js
 */
const VantaBackground = ({ children, className = "" }) => {
  const vantaRef = useRef(null);

  useEffect(() => {
    let effect = null;
    if (!effect && vantaRef.current) {
      effect = BIRDS({
        el: vantaRef.current,
        THREE: THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        backgroundColor: 0xfef3c7, // Vàng nhạt (Amber 50)
        color1: 0xf97316, // Orange 500
        color2: 0xca8a04, // Yellow 600
        birdSize: 1.5,
        wingSpan: 20,
        speedLimit: 4.0,
        separation: 50,
        alignment: 50,
        cohesion: 50,
      });
    }

    return () => {
      if (effect) effect.destroy();
    };
  }, []);

  return (
    <div ref={vantaRef} className={`min-h-screen relative ${className}`}>
      {/* Content wrapper để đè lên trên lớp Vanta */}
      <div className="relative z-10 w-full min-h-screen flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default VantaBackground;
