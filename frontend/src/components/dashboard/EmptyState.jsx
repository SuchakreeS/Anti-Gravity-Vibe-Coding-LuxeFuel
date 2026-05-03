import React from 'react';
import { motion } from 'framer-motion';

function EmptyState({ message = "Initialize vehicle selection to view telemetry", height = "h-[500px]" }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className={`${height} flex items-center justify-center bg-carbon border border-industrial-border border-dashed opacity-50 rounded-sm w-full text-text-secondary`}
    >
      <p className="font-black uppercase tracking-widest italic text-center px-4">
        {message}
      </p>
    </motion.div>
  );
}

export default EmptyState;
