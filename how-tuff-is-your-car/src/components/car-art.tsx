import type { Car } from "@/types/car";

interface CarArtProps {
  car: Car;
  compact?: boolean;
}

export function CarArt({ car, compact = false }: CarArtProps) {
  return (
    <div
      className={`relative overflow-hidden ${compact ? "h-44 rounded-2xl" : "min-h-[320px] rounded-[2rem]"}`}
      style={{
        background: `radial-gradient(circle at 20% 15%, ${car.accent}55, transparent 30%), radial-gradient(circle at 85% 90%, ${car.accent2}44, transparent 38%), linear-gradient(145deg, #17191f 0%, #0b0c0f 58%, #17191f 100%)`,
      }}
    >
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
      <div className="absolute inset-x-[10%] bottom-[18%] h-[28%] rounded-[45%_58%_16%_18%/65%_72%_18%_20%] border border-white/20 bg-gradient-to-b from-white/18 to-black/40 shadow-[0_30px_80px_rgba(0,0,0,.65)] backdrop-blur-sm">
        <div className="absolute left-[12%] top-[-30%] h-[72%] w-[52%] skew-x-[-12deg] rounded-[80%_80%_25%_20%/100%_100%_10%_15%] border border-white/15 bg-white/10" />
        <div className="absolute -bottom-[23%] left-[10%] size-[28%] rounded-full border-[10px] border-[#07080a] bg-zinc-700 shadow-[inset_0_0_0_4px_#23252b]" />
        <div className="absolute -bottom-[23%] right-[10%] size-[28%] rounded-full border-[10px] border-[#07080a] bg-zinc-700 shadow-[inset_0_0_0_4px_#23252b]" />
        <div className="absolute right-[4%] top-[30%] h-[8%] w-[17%] rounded-full" style={{ backgroundColor: car.accent }} />
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Local vibe render</p>
          <p className={`font-black uppercase tracking-[-0.05em] text-white/95 ${compact ? "text-xl" : "text-3xl sm:text-5xl"}`}>
            {car.make}
          </p>
        </div>
        <span className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-xs font-bold text-white/60 backdrop-blur-md">
          {car.bodyStyle}
        </span>
      </div>
    </div>
  );
}
