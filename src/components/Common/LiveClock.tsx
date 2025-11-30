import React, { useState, useEffect } from 'react';

const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Atualiza com maior frequência para exibir milésimos com fluidez
    const timerId = setInterval(() => setTime(new Date()), 50);
    return () => clearInterval(timerId);
  }, []);

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    return { hours, minutes, seconds, milliseconds };
  };

  const { hours, minutes, seconds, milliseconds } = formatTime(time);

  return (
    <div className="hidden lg:flex items-center text-xs font-mono text-jkd-text/70">
      <span>{hours}:{minutes}:{seconds}</span>
      <span className="text-church-primary">.{milliseconds}</span>
    </div>
  );
};

export default LiveClock;
