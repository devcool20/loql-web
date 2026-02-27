'use client';
import React, { useRef } from 'react';
import { useScroll, useTransform, motion, useMotionValueEvent } from 'framer-motion';
import styles from './sticky-scroll-reveal.module.css';

export const StickyScroll = ({
  content,
  contentClassName,
  persistentContent,
}: {
  content: {
    title: string;
    description: string;
    content?: React.ReactNode | any;
  }[];
  contentClassName?: string;
  persistentContent?: React.ReactNode;
}) => {
  const [activeCard, setActiveCard] = React.useState(0);
  const ref = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const cardsBreakpoints = content.map((_, index) => index / cardLength);
    const closestBreakpointIndex = cardsBreakpoints.reduce(
      (acc, breakpoint, index) => {
        const distance = Math.abs(latest - breakpoint);
        if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
          return index;
        }
        return acc;
      },
      0
    );
    setActiveCard(closestBreakpointIndex);
  });

  return (
    <div
      className={styles.container}
      ref={ref}
    >
      <div className={styles.contentContainer}>
        <div className={styles.scrollableContent}>
          {content.map((item, index) => (
            <div
              key={item.title + index}
              className={`${styles.stepCard} ${activeCard === index ? styles.active : ''}`}
            >
              <h2 className={styles.stepTitle}>{item.title}</h2>
              <p className={styles.stepDescription}>{item.description}</p>
            </div>
          ))}
        </div>
        <div className={`${styles.stickyContainer} ${contentClassName}`}>
          {persistentContent ? persistentContent : (content[activeCard].content ?? null)}
        </div>
      </div>
    </div>
  );
};
