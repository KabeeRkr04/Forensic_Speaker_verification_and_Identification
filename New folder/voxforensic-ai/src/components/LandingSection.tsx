import React from 'react';
import { motion } from 'motion/react';
import { Shield, Fingerprint, Activity, Cpu, MousePointer2 } from 'lucide-react';

export const LandingSection: React.FC = () => {
  return (
    <section className="relative min-h-[100vh] flex flex-col items-center justify-center text-[#E0E0E0] z-10 px-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="max-w-5xl text-center"
      >
        <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-md mb-12 bg-opacity-20 backdrop-blur-sm">
          <Shield className="w-4 h-4 text-[#00FF41]" />
          <span className="text-xs font-mono tracking-[3px] text-[#00FF41]">SPECIMEN_VERIFICATION_INIT</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none uppercase font-sans max-w-4xl mx-auto">
          Forensic Voice <br />
          <span className="text-[#00FF41] hacker-glow">Verification and Identification</span>
        </h1>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="pt-24 flex flex-col items-center gap-2 opacity-40"
        >
          <span className="text-xs font-mono tracking-widest uppercase">Scroll to Interface</span>
          <MousePointer2 className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  );
};
