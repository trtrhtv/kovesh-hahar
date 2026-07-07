export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="rpm-loader" />
      <div className="font-mono text-xs text-textDim tracking-[0.3em]">טוען...</div>
    </div>
  );
}
