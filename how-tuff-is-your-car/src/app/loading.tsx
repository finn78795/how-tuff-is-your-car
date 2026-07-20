export default function Loading() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="h-4 w-28 animate-pulse rounded-full bg-white/7" />
      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <div className="aspect-[16/10] animate-pulse rounded-[2rem] bg-white/[0.035]" />
        <div className="min-h-96 animate-pulse rounded-[2rem] bg-white/[0.035]" />
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-[1.4rem] bg-white/[0.03]" />)}</div>
    </main>
  );
}
