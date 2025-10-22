import { useRef, useEffect } from "react"
import { useFrame, useLoader } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"
import "./shaders/HolofoilPatternMaterial"
import "./shaders/HolofoilNoiseMaterial"
import "./shaders/SparkleMaterial"
import "./shaders/BackgroundMaterial"
import "./shaders/GlareMaterial"

interface HoloCardProps {
  isMobile?: boolean
}

const HoloCard = ({ isMobile = false }: HoloCardProps) => {
  const cardRef = useRef<THREE.Mesh>(null)
  const stencilRef = useRef<THREE.Mesh>(null)
  const cherubimonRef = useRef<THREE.Mesh>(null)
  const ballsRef = useRef<THREE.Mesh>(null)
  const borderRef = useRef<THREE.Mesh>(null)
  const infoRef = useRef<THREE.Mesh>(null)
  // const goldenBallRef = useRef<THREE.Mesh>(null)
  const bgRef = useRef<THREE.Mesh>(null)
  // const sparklesRef = useRef<THREE.Mesh>(null)

  const mouseRef = useRef({ x: 0, y: 0 })
  const mousePosVector = useRef(new THREE.Vector2(0, 0))

  const cherubimonMaterialRef = useRef<any>(null)
  const bgMaterialRef = useRef<any>(null)

  // Track touch start
  const touchStart = useRef({ x: 0, y: 0 })
  const isTouching = useRef(false)

  // const maskTexture = useLoader(THREE.TextureLoader, "/holo-mask.png")
  const cherubimonTexture = useLoader(
    THREE.TextureLoader,
    "/cherubimon_main.png"
  )
  const ballsTexture = useLoader(THREE.TextureLoader, "/cherubimon_balls.png")
  // const goldenBallTexture = useLoader(
  //   THREE.TextureLoader,
  //   "/cherubimon_golden_ball.png"
  // )
  const borderTexture = useLoader(THREE.TextureLoader, "/cherubimon_border.png")
  // borderTexture.wrapS = THREE.ClampToEdgeWrapping
  // borderTexture.wrapT = THREE.ClampToEdgeWrapping
  // borderTexture.generateMipmaps = false // optional
  // borderTexture.minFilter = THREE.LinearFilter
  const infoTexture = useLoader(THREE.TextureLoader, "/cherubimon_info.png")

  const bgTexture = useLoader(THREE.TextureLoader, "/cosmic-bg.png")

  // Load the geo TODO: UVs are flipped - fix in blender
  const { nodes } = useGLTF("/card-plane.glb") as any
  const geo = nodes.Plane.geometry

  geo.computeBoundingBox()
  const bbox = geo.boundingBox!

  const geoWidth = bbox.max.x - bbox.min.x
  const geoHeight = bbox.max.y - bbox.min.y

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      isTouching.current = true
      touchStart.current.x = touch.clientX
      touchStart.current.y = touch.clientY
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault() // Prevent scrolling and browser UI changes
      const touch = e.touches[0]

      const deltaX = touch.clientX - touchStart.current.x
      const deltaY = touch.clientY - touchStart.current.y

      const sensitivity = 0.01
      mouseRef.current.x += deltaX * sensitivity
      mouseRef.current.y -= deltaY * sensitivity

      mouseRef.current.x = Math.max(-1, Math.min(1, mouseRef.current.x))
      mouseRef.current.y = Math.max(-1, Math.min(1, mouseRef.current.y))

      touchStart.current.x = touch.clientX
      touchStart.current.y = touch.clientY
    }

    const handleTouchEnd = () => {
      isTouching.current = false
    }

    window.addEventListener("touchstart", handleTouchStart)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleTouchEnd)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [])

  useFrame((state) => {
    if (!cardRef.current || !stencilRef.current) return

    if (isMobile && !isTouching.current) {
      mouseRef.current.x *= 0.95
      mouseRef.current.y *= 0.95
    }

    // Update mouse position vector for shader
    mousePosVector.current.set(mouseRef.current.x, mouseRef.current.y)

    // Update shader uniforms
    if (cherubimonMaterialRef.current) {
      cherubimonMaterialRef.current.uMousePos = mousePosVector.current
      cherubimonMaterialRef.current.uTime = state.clock.elapsedTime
    }
    if (bgMaterialRef.current) {
      bgMaterialRef.current.uMousePos = mousePosVector.current
      bgMaterialRef.current.uTime = state.clock.elapsedTime
    }

    // Animate card based on mouse with rotation limits
    // Reduce rotation sensitivity on mobile for smoother experience
    const sensitivity = 0.5
    const maxRotation = Math.PI / 6
    const lerpSpeed = 0.1

    const targetRotationY = THREE.MathUtils.clamp(
      mouseRef.current.x * sensitivity,
      -maxRotation,
      maxRotation
    )
    const targetRotationX = THREE.MathUtils.clamp(
      -mouseRef.current.y * sensitivity,
      -maxRotation,
      maxRotation
    )

    cardRef.current.rotation.y = THREE.MathUtils.lerp(
      cardRef.current.rotation.y,
      targetRotationY,
      lerpSpeed
    )
    cardRef.current.rotation.x = THREE.MathUtils.lerp(
      cardRef.current.rotation.x,
      targetRotationX,
      lerpSpeed
    )

    // if (borderRef.current && cardRef.current) {
    //   borderRef.current.rotation.copy(cardRef.current.rotation)
    // }

    // Animate stencil based on mouse
    stencilRef.current.rotation.copy(cardRef.current.rotation)

    // // Animate sparkle
    // sparklesRef.current.rotation.copy(cardRef.current.rotation)

    // Parallax with lerp
    if (bgRef.current) {
      bgRef.current.position.x = THREE.MathUtils.lerp(
        bgRef.current.position.x,
        targetRotationX * 0.1,
        0.1
      )
      bgRef.current.position.y = THREE.MathUtils.lerp(
        bgRef.current.position.y,
        targetRotationY * 0.1,
        0.1
      )
    }
  })

  return (
    <group>
      {/* <mesh
        ref={sparklesRef}
        geometry={geo}
        scale={[0.5, 0.5, 0.5]}
        position={[0, 0, 2]}
        renderOrder={9}
      >
        <sparkleMaterial
          uSize={0.2}
          uBrightness={2.0}
          uDensity={5.0}
          uBorderWidth={0.15}
          transparent
        />
      </mesh> */}
      {/* Stencil mesh */}
      <mesh
        ref={stencilRef}
        geometry={geo}
        scale={[0.5, 0.5, 0.5]}
        renderOrder={0}
      >
        <meshStandardMaterial
          depthWrite={false}
          depthTest={false}
          stencilWrite={true}
          stencilRef={1}
          stencilFunc={THREE.AlwaysStencilFunc}
          stencilZPass={THREE.ReplaceStencilOp}
        />
      </mesh>
      {/* Card mesh */}
      <group
        ref={cardRef}
        scale={[0.5, 0.5, 0.5]}
      >
        {/* Background mesh */}
        <mesh
          ref={bgRef}
          position={[0, 0, -2.3]}
          renderOrder={1}
        >
          <planeGeometry args={[23, 12]} />
          <holofoilNoiseMaterial
            ref={bgMaterialRef}
            uTexture={bgTexture}
            stencilWrite={true}
            stencilRef={1}
            stencilFunc={THREE.EqualStencilFunc}
            uBrightness={0.9}
            uDiagonalStrength={1.7}
          />
        </mesh>
        <mesh
          ref={cherubimonRef}
          position={[0, -0.1, -0.62]}
          scale={[1.1, 1.2, 1]}
          renderOrder={3}
        >
          <planeGeometry args={[geoWidth, geoHeight]} />
          <holofoilNoiseMaterial
            ref={cherubimonMaterialRef}
            uTexture={cherubimonTexture}
            uMousePos={mousePosVector.current}
            transparent
            depthTest={false}
            stencilWrite={true}
            stencilRef={1}
            stencilFunc={THREE.EqualStencilFunc}
            uDiagonalStrength={6.5}
            uBrightness={0.17}
          />
        </mesh>
        <mesh
          ref={ballsRef}
          position={[0, 0, 1.3]}
          scale={[1.05, 1.11, 1]}
          renderOrder={3}
          geometry={geo}
        >
          {/* <planeGeometry args={[geoWidth, geoHeight]} /> */}
          <glareMaterial
            uTexture={ballsTexture}
            uGlareIntensity={0.0}
            transparent
            stencilWrite={true}
            stencilRef={1}
            stencilFunc={THREE.EqualStencilFunc}
            depthTest={false}
          />
        </mesh>
        <mesh
          ref={infoRef}
          position={[0, -0.3, 0]}
          renderOrder={6}
          geometry={geo}
        >
          {/* <planeGeometry args={[geoWidth, geoHeight]} /> */}
          <glareMaterial
            uTexture={infoTexture}
            uGlareIntensity={0.05}
            transparent
            depthTest={false}
          />
        </mesh>
        {/* <mesh
          ref={goldenBallRef}
          position={[0, -0.1, 0]}
          renderOrder={3}
        >
          <planeGeometry args={[geoWidth, geoHeight]} />
          <meshStandardMaterial
            map={goldenBallTexture}
            transparent
            depthTest={false}
          />
        </mesh> */}
        {/* <mesh
          // ref={borderRef}
          position={[0, 0, 0]}
          scale={[1.0, 1.035, 1.0]}
          renderOrder={3}
          // geometry={geo}
        >
          <planeGeometry args={[geoWidth, geoHeight]} />
          <meshStandardMaterial
            map={borderTexture}
            transparent
            depthWrite={false}
          />
        </mesh> */}
        <mesh
          ref={borderRef}
          position={[0, 0, 0]}
          scale={[1.0, 1.035, 1.0]}
          renderOrder={4}
          geometry={geo}
        >
          {/* <planeGeometry args={[geoWidth, geoHeight]} /> */}
          <glareMaterial
            uTexture={borderTexture}
            // uGlareWidth={0.2}
            uGlareIntensity={0.2}
            // uGlareColor={new THREE.Color(0.1, 0.1, 0.1)}
            transparent={true}
            // blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  )
}

export default HoloCard
