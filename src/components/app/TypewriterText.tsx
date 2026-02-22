'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  className?: string;
  typingSpeed?: number;
  pauseDuration?: number;
}

const TypewriterText = ({
  text,
  className,
  typingSpeed = 100,
  pauseDuration = 3000,
}: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let currentIndex = 0;

    const startTyping = () => {
      setDisplayedText('');
      currentIndex = 0;
      setIsTyping(true);

      const typeChar = () => {
        if (currentIndex < text.length) {
          setDisplayedText(text.substring(0, currentIndex + 1));
          currentIndex++;
          timeoutRef.current = setTimeout(typeChar, typingSpeed);
        } else {
          setIsTyping(false);
          timeoutRef.current = setTimeout(startTyping, pauseDuration);
        }
      };

      typeChar();
    };

    startTyping();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, typingSpeed, pauseDuration]);

  return (
    <span className={className}>
      {displayedText}
      {isTyping && <span className="typewriter-cursor">|</span>}
    </span>
  );
};

export default TypewriterText;
