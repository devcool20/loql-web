import React, { ReactNode } from "react";
import styles from "./AuroraBackground.module.css";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main>
      <div
        className={`${styles.auroraContainer} ${className || ""}`}
        {...props}
      >
        <div className={styles.auroraAbsolute}>
          <div className={`${styles.auroraGradientContainer} ${showRadialGradient ? styles.radialMask : ''}`}>
             <div className={styles.auroraEffect} />
          </div>
        </div>
        <div className={styles.zContent}>
           {children}
        </div>
      </div>
    </main>
  );
};
