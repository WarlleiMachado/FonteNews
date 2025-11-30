import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { VideoNewsSettings } from '../../types';
import { useThrottle } from '../../hooks/useDebounce';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSettings: VideoNewsSettings;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  videoSettings,
}) => {
  const throttledOnClose = useThrottle(onClose, 300);
  const getYoutubeEmbedUrl = (url: string): string | null => {
    let videoId: string | null = null;
    try {
      const urlObj = new URL(url);
      const host = urlObj.hostname;
      const path = urlObj.pathname;

      // Support direct embed URLs
      if (host.includes('youtube.com') && path.startsWith('/embed/')) {
        // Ensure autoplay and rel params
        urlObj.searchParams.set('autoplay', '1');
        urlObj.searchParams.set('rel', '0');
        return urlObj.toString();
      }

      // Support live_stream embed by channel
      if (host.includes('youtube.com') && path === '/embed/live_stream') {
        urlObj.searchParams.set('autoplay', '1');
        urlObj.searchParams.set('rel', '0');
        return urlObj.toString();
      }

      if (host === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      } else if (host.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v');
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
    } catch (e) {
      // Handle cases where the URL is not valid, e.g., just the ID
      const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const match = url.match(regex);
      videoId = match ? match[1] : null;
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
    }
  };

  const renderVideo = () => {
    if (!videoSettings.url) {
        return <p className="text-white text-center p-4">Nenhuma URL de vídeo configurada.</p>;
    }

    if (videoSettings.sourceType === 'youtube') {
      const embedUrl = getYoutubeEmbedUrl(videoSettings.url);
      if (!embedUrl) {
        return <p className="text-white text-center p-4">URL do YouTube inválida.</p>;
      }
      return (
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      );
    }

    if (videoSettings.sourceType === 'url') {
      return (
        <video width="100%" height="100%" controls autoPlay>
          <source src={videoSettings.url} type="video/mp4" />
          Seu navegador não suporta a tag de vídeo.
        </video>
      );
    }

    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={throttledOnClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {renderVideo()}
            <button
              onClick={throttledOnClose}
              className="absolute -top-3 -right-3 h-8 w-8 bg-white rounded-full flex items-center justify-center text-black shadow-lg hover:scale-110 transition-transform"
              aria-label="Fechar vídeo"
            >
              <X size={20} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPlayerModal;
