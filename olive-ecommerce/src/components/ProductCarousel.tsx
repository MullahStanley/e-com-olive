'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../types';

interface ProductCarouselProps {
  products: Product[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  // Graceful fallback for empty data
  if (!products || products.length === 0) return null;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: 'start',
      slidesToScroll: 1,
    },
    [
      Autoplay({ 
        delay: 4000, 
        stopOnInteraction: true, // Let it stop if they click/touch
        stopOnMouseEnter: true,  // CRITICAL: Don't slide away when hovering to buy!
      })
    ]
  );

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, [emblaApi]);

  // Sync button states with Embla's internal state
  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative group">
      {/* Negative margins and positive padding prevent the overflow-hidden 
        from clipping the hover shadows on the ProductCards 
      */}
      <div className="overflow-hidden -mx-4 px-4 py-6" ref={emblaRef}>
        <div className="flex gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_33.33%] xl:flex-[0_0_25%]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons - Hidden on mobile, visible on desktop */}
      {!prevBtnDisabled && (
        <button
          onClick={scrollPrev}
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition z-10 text-gray-700 opacity-0 group-hover:opacity-100 focus:opacity-100 items-center justify-center"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} aria-hidden="true" />
        </button>
      )}

      {!nextBtnDisabled && (
        <button
          onClick={scrollNext}
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition z-10 text-gray-700 opacity-0 group-hover:opacity-100 focus:opacity-100 items-center justify-center"
          aria-label="Next slide"
        >
          <ChevronRight size={24} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}