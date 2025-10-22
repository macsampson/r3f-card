import { Canvas } from "@react-three/fiber"
import HoloCard from "./HoloCard"
import { Suspense, useEffect, useState } from "react"

function App() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    // Prevent iOS Safari from bouncing
    const preventBounce = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }

    document.addEventListener("touchmove", preventBounce, { passive: false })

    return () => {
      window.removeEventListener("resize", checkMobile)
      document.removeEventListener("touchmove", preventBounce)
    }
  }, [])

  return (
    <div style={{ width: "100%", height: "100%", touchAction: "none" }}>
      <Canvas
        camera={{
          position: [0, 0, isMobile ? 9 : 5],
          fov: isMobile ? 40 : 50,
        }}
        gl={{ stencil: true }}
      >
        <ambientLight intensity={3.0} />
        {/* <directionalLight position={[0, 0, 0]} /> */}
        <Suspense fallback={null}>
          <HoloCard isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default App
