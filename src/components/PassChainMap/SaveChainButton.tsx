export const SaveChainButton: React.FC<{
  onEndChain: () => void;
  className?: string;
}> = ({ onEndChain, className = "" }) => {
  return (
    <button
      type="button"
      onClick={onEndChain}
      className={`rounded-md border border-green-600 bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-green-700 ${className}`}
    >
      Save Chain
    </button>
  );
}