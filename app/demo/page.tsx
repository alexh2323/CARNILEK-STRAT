import { GradientBlur } from "@/components/ui/gradient-blur"

export default function DemoOne() {
  return (
    <div className="relative w-full h-screen overflow-hidden cursor-move">
      <GradientBlur />
      <h4 className="absolute left-0 top-2/5 w-full text-center text-6xl pointer-events-none">
        Gradient Blur
      </h4>
    </div>
  )
}


