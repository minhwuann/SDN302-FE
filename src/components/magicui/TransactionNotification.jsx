import React from "react";
import { cn } from "../../lib/utils";

export const TransactionNotification = ({ name, description, icon, color, time, amount }) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4",
        // animation styles
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // dark styles
        "transform-gpu dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: color,
          }}
        >
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden w-full">
          <figcaption className="flex flex-row items-center justify-between text-lg font-medium dark:text-white">
            <span className="text-sm sm:text-base truncate">{name}</span>
            <span className="text-sm font-bold ml-2 shrink-0">{amount}</span>
          </figcaption>
          <div className="flex flex-row items-center justify-between mt-1">
            <p className="text-xs font-normal dark:text-white/60 truncate">
              {description}
            </p>
            <span className="text-xs text-gray-500 shrink-0">{time}</span>
          </div>
        </div>
      </div>
    </figure>
  );
};
