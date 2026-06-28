// client/src/components/Skeleton.js
// Skeleton loading components — replaces loading spinners for better UX
// Usage: <HotelCardSkeleton /> <BookingRowSkeleton /> <DashboardSkeleton />

const pulse = 'animate-pulse bg-gray-200 rounded';

// ─── Generic skeleton primitives ─────────────────────────────────────────────
export const SkeletonLine = ({ w = 'w-full', h = 'h-4', className = '' }) => (
  <div className={`${pulse} ${w} ${h} ${className}`} />
);

export const SkeletonBox = ({ className = '' }) => (
  <div className={`${pulse} ${className}`} />
);

// ─── Hotel card skeleton (matches Hotels.js card layout) ─────────────────────
export const HotelCardSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
    <SkeletonBox className="w-full h-48" />
    <div className="p-4 space-y-3">
      <SkeletonLine w="w-3/4" h="h-5" />
      <SkeletonLine w="w-1/2" h="h-4" />
      <div className="flex justify-between items-center pt-2">
        <SkeletonLine w="w-1/3" h="h-6" />
        <SkeletonBox className="w-24 h-9 rounded-lg" />
      </div>
    </div>
  </div>
);

// ─── Hotels grid skeleton ─────────────────────────────────────────────────────
export const HotelsGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }, (_, i) => <HotelCardSkeleton key={i} />)}
  </div>
);

// ─── Booking row skeleton ─────────────────────────────────────────────────────
export const BookingRowSkeleton = () => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 flex gap-4">
    <SkeletonBox className="w-20 h-20 rounded-lg flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <SkeletonLine w="w-1/2" h="h-5" />
      <SkeletonLine w="w-1/3" h="h-4" />
      <SkeletonLine w="w-1/4" h="h-4" />
    </div>
    <SkeletonBox className="w-24 h-8 rounded-lg flex-shrink-0" />
  </div>
);

// ─── Admin stat card skeleton ─────────────────────────────────────────────────
export const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 space-y-2">
    <SkeletonLine w="w-1/2" h="h-4" />
    <SkeletonLine w="w-1/3" h="h-8" />
  </div>
);

// ─── Dashboard overview skeleton ──────────────────────────────────────────────
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)}
    </div>
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      <SkeletonLine w="w-1/4" h="h-5" className="mb-4" />
      <SkeletonBox className="w-full h-48 rounded-lg" />
    </div>
  </div>
);

// ─── Hotel detail page skeleton ───────────────────────────────────────────────
export const HotelDetailSkeleton = () => (
  <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
    <SkeletonBox className="w-full h-72 rounded-2xl" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <SkeletonLine w="w-1/2" h="h-8" />
        <SkeletonLine w="w-1/3" h="h-5" />
        <SkeletonLine h="h-4" />
        <SkeletonLine w="w-5/6" h="h-4" />
        <SkeletonLine w="w-4/5" h="h-4" />
      </div>
      <div className="space-y-4">
        <SkeletonBox className="w-full h-48 rounded-xl" />
        <SkeletonBox className="w-full h-12 rounded-xl" />
      </div>
    </div>
  </div>
);
