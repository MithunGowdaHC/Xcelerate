export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="h-40 bg-muted rounded-2xl animate-pulse" />
        <div className="h-40 bg-muted rounded-2xl animate-pulse" />
        <div className="h-40 bg-muted rounded-2xl animate-pulse" />
      </div>
    </div>
  )
}
