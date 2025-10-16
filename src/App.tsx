import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import HoloCard from "./HoloCard"
import { Suspense } from "react"

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ stencil: true }}
      >
        <ambientLight intensity={1} />
        <directionalLight
          position={[2, 2, 5]}
          intensity={1}
        />
        <Suspense fallback={null}>
          <HoloCard />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default App
