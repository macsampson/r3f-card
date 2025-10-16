import { useRef, useState, useEffect } from "react"
import { useFrame, useLoader } from "@react-three/fiber"
import { MeshReflectorMaterial, useGLTF } from "@react-three/drei"
import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js"
import * as THREE from "three"
import { HolofoilMaterial } from "./HolofoilMaterial"
import { BackgroundMaterial } from "./BackgroundMaterial"

const HoloCard = () => {
  const cardRef = useRef<THREE.Mesh>(null)
  const stencilRef = useRef<THREE.Mesh>(null)
  const bgRef = useRef<THREE.Mesh>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const mousePosVector = useRef(new THREE.Vector2(0, 0))
  const materialRef = useRef<any>(null)

  const frontTexture = useLoader(THREE.TextureLoader, "/kerubi-t1.png")
  const maskTexture = useLoader(THREE.TextureLoader, "/holo-mask.png")

  const bgTexture = useLoader(THREE.TextureLoader, "/cosmic-bg.png")
  const cardMask = useLoader(THREE.TextureLoader, "/card-mask.png")

  frontTexture.flipY = false
  //   maskTexture.flipY = false

  // Load the geo
  const { nodes } = useGLTF("/card-plane.glb") as any
  const geo = nodes.Plane.geometry
  //   geo.computeBoundingBox()
  //   const bbox = geo.boundingBox!

  //   const cardWidth = (bbox.max.x - bbox.min.x) * 0.5
  //   const cardHeight = (bbox.max.y - bbox.min.y) * 0.5
  //   const bgWidth = 4.2 * 1.2
  //   const bgHeight = 3.3 * 1.2

  //   const scaleX = cardWidth / bgWidth
  //   const scaleY = cardHeight / bgHeight

  //   const maskScale = new THREE.Vector2(scaleX, scaleY)

  // console.log(cardWidth, cardHeight)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useFrame((state) => {
    if (!cardRef.current || !stencilRef.current) return

    // Update mouse position vector for shader
    mousePosVector.current.set(mouseRef.current.x, mouseRef.current.y)

    // Update shader uniforms
    if (materialRef.current) {
      materialRef.current.uMousePos = mousePosVector.current
      materialRef.current.uTime = state.clock.elapsedTime
    }

    // Animate card based on mouse
    const targetRotationY = mouseRef.current.x * 0.5
    const targetRotationX = -mouseRef.current.y * 0.5

    cardRef.current.rotation.y = THREE.MathUtils.lerp(
      cardRef.current.rotation.y,
      targetRotationY,
      0.1
    )
    cardRef.current.rotation.x = THREE.MathUtils.lerp(
      cardRef.current.rotation.x,
      targetRotationX,
      0.1
    )

    // Animate stencil based on mouse
    stencilRef.current.rotation.copy(cardRef.current.rotation)

    // Animate background based on mouse
    if (bgRef.current) {
      bgRef.current.rotation.y = THREE.MathUtils.lerp(
        bgRef.current.rotation.y,
        targetRotationY * 0.2,
        0.1
      )
      bgRef.current.rotation.x = THREE.MathUtils.lerp(
        bgRef.current.rotation.x,
        targetRotationX * 0.2,
        0.1
      )

      //   console.log("Card rotation: ", cardRef.current.rotation)
      //   console.log("Background rotation: ", bgRef.current.rotation)
    }
  })

  return (
    <group>
      {/* Stencil mesh */}
      <mesh
        ref={stencilRef}
        geometry={geo}
        scale={[0.5, 0.5, 0.5]}
        renderOrder={0}
      >
        <meshStandardMaterial
          ref={materialRef}
          depthWrite={false}
          depthTest={false}
          stencilWrite={true}
          stencilRef={1}
          stencilFunc={THREE.AlwaysStencilFunc}
          stencilZPass={THREE.ReplaceStencilOp}
        />
      </mesh>
      {/* Card mesh */}
      <mesh
        ref={cardRef}
        geometry={geo}
        scale={[0.5, 0.5, 0.5]}
        renderOrder={2}
      >
        <holofoilMaterial
          ref={materialRef}
          uMousePos={mousePosVector.current}
          uTexture={frontTexture}
          uMaskTexture={maskTexture}
          uTime={1}
          transparent
        />
        {/* Background mesh */}
        <mesh
          ref={bgRef}
          position={[0, 0, -1]}
          //   scale={[3, 3, 3]}
          renderOrder={1}
        >
          <planeGeometry args={[13, 10]} />
          <meshStandardMaterial
            map={bgTexture}
            stencilWrite={true}
            stencilRef={1}
            stencilFunc={THREE.EqualStencilFunc}
          />
        </mesh>
      </mesh>
    </group>
  )
}

export default HoloCard
