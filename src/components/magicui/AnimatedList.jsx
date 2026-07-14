"use client";

// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import { cn } from "../../lib/utils";

export function AnimatedList({
  className,
  children,
  delay = 100, // Reduced from 1000 to 100
}) {
  const [index, setIndex] = useState(0);
  const childrenArray = React.Children.toArray(children);

  useEffect(() => {
    if (index < childrenArray.length - 1) {
      const timeout = setTimeout(() => {
        setIndex((prevIndex) => prevIndex + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [index, childrenArray.length, delay]);

  const itemsToShow = useMemo(() => {
    return childrenArray.slice(0, index + 1).reverse();
  }, [index, childrenArray]);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <AnimatePresence>
        {itemsToShow.map((item) => (
          <AnimatedListItem key={item.key}>
            {item}
          </AnimatedListItem>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function AnimatedListItem({ children }) {
  const animations = {
    initial: { scale: 0, opacity: 0, y: 50 },
    animate: { scale: 1, opacity: 1, y: 0, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: "spring", stiffness: 350, damping: 40 },
  };

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  );
}
