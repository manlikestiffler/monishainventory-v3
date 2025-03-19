import { motion } from 'framer-motion';

const Logo = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative ${sizes[size]}`}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Modern abstract uniform shape */}
        <path
          d="M50 5L90 25V75L50 95L10 75V25L50 5Z"
          fill="#ED1515"
          className="drop-shadow-lg"
        />
        <path
          d="M50 5L90 25L50 45L10 25L50 5Z"
          fill="#FF3333"
        />
        <path
          d="M50 95V45L90 25V75L50 95Z"
          fill="#C41111"
        />
        <path
          d="M50 95V45L10 25V75L50 95Z"
          fill="#A31313"
        />
        {/* Uniform details */}
        <path
          d="M50 20L65 28V40L50 48L35 40V28L50 20Z"
          fill="white"
          fillOpacity="0.2"
        />
        <path
          d="M45 55H55V75H45V55Z"
          fill="white"
          fillOpacity="0.1"
        />
      </svg>
    </motion.div>
  );
};

export default Logo; 