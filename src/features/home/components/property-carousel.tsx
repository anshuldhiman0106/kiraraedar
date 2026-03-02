"use client";

import { useState } from "react";
import { Building, ChevronLeft, ChevronRight } from "lucide-react";

type PropertyCarouselProps = {
  images: string[];
};

export function PropertyCarousel({
  images,
  isNewProperty,
}: PropertyCarouselProps & { isNewProperty?: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images.length) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
        <Building className="h-16 w-16 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden group">
      <img
        src={images[currentIndex]}
        alt="Property"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90 group-hover:brightness-100"
        loading="lazy"
      />

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm rounded-full py-2 px-3">
          {images.map((_, index) => (
            <button
              type="button"
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-6 bg-white shadow-lg"
                  : "bg-white/50 hover:bg-white/70"
              }`}
              onClick={(event) => {
                event.stopPropagation();
                setCurrentIndex(index);
              }}
            />
          ))}
        </div>
      )}

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              prevSlide();
            }}
            className="absolute z-30 left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-2 rounded-full shadow-lg border transition-all hover:scale-110 opacity-0 group-hover:opacity-100 duration-300"
          >
            <ChevronLeft className="h-5 w-5 text-slate-800" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              nextSlide();
            }}
            className="absolute z-30 right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-2 rounded-full shadow-lg border transition-all hover:scale-110 opacity-0 group-hover:opacity-100 duration-300"
          >
            <ChevronRight className="h-5 w-5 text-slate-800" />
          </button>
        </>
      )}

      <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
        {images.length > 1 && (
          <div className=" bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {isNewProperty && (
          <div className="bg-amber-500/50 text-amber-900/80 font-semibold text-sm px-4 py-2 rounded-full backdrop-blur-3xl border border-amber-900/80 shadow-lg">
            Newly Listed
          </div>
        )}
      </div>
    </div>
  );
}
