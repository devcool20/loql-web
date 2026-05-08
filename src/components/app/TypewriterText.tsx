'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  texts: string[];
  className?: string;
  typingSpeed?: number;
  pauseDuration?: number;
  onCycleComplete?: (index: number) => void;
}

const TypewriterText = ({
  texts,
  className,
  typingSpeed = 100,
  pauseDuration = 3000,
  onCycleComplete,
}: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [textIndex, setTextIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let currentIndex = 0;
    const currentFullText = texts[textIndex];

    const startTyping = () => {
      setDisplayedText('');
      currentIndex = 0;
      setIsTyping(true);

      const typeChar = () => {
        if (currentIndex < currentFullText.length) {
          setDisplayedText(currentFullText.substring(0, currentIndex + 1));
          currentIndex++;
          timeoutRef.current = setTimeout(typeChar, typingSpeed);
        } else {
          setIsTyping(false);
          timeoutRef.current = setTimeout(() => {
            const nextIndex = (textIndex + 1) % texts.length;
            setTextIndex(nextIndex);
            if (onCycleComplete) onCycleComplete(nextIndex);
          }, pauseDuration);
        }
      };

      typeChar();
    };

    startTyping();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [textIndex, texts, typingSpeed, pauseDuration, onCycleComplete]);

  return (
    <span className={className}>
      {displayedText}
      {isTyping && <span className="typewriter-cursor">|</span>}
    </span>
  );
};

export default TypewriterText;
