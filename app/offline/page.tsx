export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
      <svg
        className="w-16 h-16 text-neutral-600 mb-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 17.657a9 9 0 010-12.728M9.172 14.828a5 5 0 010-7.071M12 12h.01"
        />
      </svg>
      <h1 className="text-xl font-bold text-white mb-2">You&apos;re offline</h1>
      <p className="text-neutral-400 text-sm">
        Check your connection and try again.
      </p>
    </div>
  );
}
