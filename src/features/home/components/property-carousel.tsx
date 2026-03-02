"use client"

import { useState } from "react"
import { Building, ChevronLeft, ChevronRight } from "lucide-react"

type PropertyCarouselProps = {
  images: string[]
}

export function PropertyCarousel(  { images, isNewProperty }: PropertyCarouselProps & { isNewProperty?: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (!images.length) {
    return (
      <div className="w-full h-64 lg:h-80 bg-gradient-to-br from-slate-200 to-slate-300 rounded-t-xl flex items-center justify-center">
        <Building className="h-16 w-16 text-slate-400" />
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-t-xl group">
       

      <img
        src={images[currentIndex]}
        alt="Property"
        className="w-full h-64 lg:h-80 object-cover group-hover:scale-105 transition-transform duration-700 brightness-75 group-hover:brightness-100"
        loading="lazy"
      />

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm rounded-full py-2 px-3">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex ? "w-6 bg-white shadow-lg" : "bg-white/50 hover:bg-white/70"
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}

      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-2 rounded-full shadow-lg border transition-all hover:scale-110 opacity-0 group-hover:opacity-100 duration-300"
          >
            <ChevronLeft className="h-5 w-5 text-slate-800" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-2 rounded-full shadow-lg border transition-all hover:scale-110 opacity-0 group-hover:opacity-100 duration-300"
          >
            <ChevronRight className="h-5 w-5 text-slate-800" />
          </button>
        </>
      )}


     <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
      {images.length > 1 && (
        <div className=" bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {
        isNewProperty && (
          <div className="text-xs px-3 py-1 bg-yellow-500/60 text-amber-100 border-1 border-amber-400/80 rounded-full backdrop-blur-lg z-20">
            Newly Listed
          </div>
        )

      }

     </div>

    </div>
  )
}
