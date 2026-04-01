import { motion } from 'framer-motion';
import ParticleCanvas from './components/ParticleCanvas';

function App() {
  return (
    <motion.div
      className="w-full h-full bg-background relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <ParticleCanvas />
      <motion.div
        className="absolute top-6 left-6 text-white/60 text-sm pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        Move your mouse • Click to burst
      </motion.div>
    </motion.div>
  );
}

export default App;
