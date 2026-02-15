'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

export function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const increment = value / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-lg bg-card p-6 shadow-md hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{count}</p>
        </div>
        <div className={`rounded-full p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}
