"use client"

import { useState, useEffect } from "react"
import Image, { type ImageProps } from "next/image"
import { cn } from "@/lib/utils"

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  fallbackSrc?: string
  lowQualitySrc?: string
  className?: string
  containerClassName?: string
  loadingClassName?: string
}

export default function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/placeholder.png",
  lowQualitySrc,
  className,
  containerClassName,
  loadingClassName,
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(!priority)
  const [imgSrc, setImgSrc] = useState(lowQualitySrc || src)
  const [isError, setIsError] = useState(false)

  // When src changes, reset loading state if not priority
  useEffect(() => {
    if (!priority) {
      setIsLoading(true)
    }
    setImgSrc(lowQualitySrc || src)
    setIsError(false)
  }, [src, lowQualitySrc, priority])

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {isLoading && !priority && (
        <div
          className={cn(
            "absolute inset-0 bg-gray-200 animate-pulse rounded-md flex items-center justify-center",
            loadingClassName,
          )}
        >
          <span className="sr-only">Loading image</span>
        </div>
      )}
      <Image
        src={isError ? fallbackSrc : imgSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoading && !priority ? "opacity-0" : "opacity-100",
          className,
        )}
        onLoad={() => {
          // If we were showing a low quality image, now load the high quality one
          if (lowQualitySrc && imgSrc === lowQualitySrc) {
            setImgSrc(src)
          } else {
            setIsLoading(false)
          }
        }}
        onError={() => {
          setIsError(true)
          setIsLoading(false)
        }}
        {...props}
      />
    </div>
  )
}
