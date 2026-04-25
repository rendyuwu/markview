export function ExpiredOrNotFound() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
      <p className="text-lg text-stone font-body">
        This document is not found or has expired.
      </p>
    </div>
  );
}
