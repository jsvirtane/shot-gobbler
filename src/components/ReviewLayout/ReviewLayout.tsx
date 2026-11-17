import React, { useContext } from "react";
import { createPortal } from "react-dom";
import { HeaderSlotContext } from "./headerSlotContext";

/**
 * Renders its children in the app header, under the match row, so the
 * match and the view switch read as one header. Without a header they are
 * rendered in place.
 */
export const HeaderSlot: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const slot = useContext(HeaderSlotContext);
  return slot ? createPortal(children, slot) : <>{children}</>;
};

interface ReviewCardProps {
  /** Left side of the top bar: the filter chips. */
  toolbar?: React.ReactNode;
  /** Right side of the top bar, e.g. the pitch size switch. */
  toolbarEnd?: React.ReactNode;
  /** The pitch; left out on the list and stats views. */
  children?: React.ReactNode;
  /** Bottom bar: the summary line. */
  footer?: React.ReactNode;
}

/**
 * One white card that holds a tab's filters, its pitch (with the legend)
 * and its summary, so they read as one block. On the list and stats views
 * it holds only the filters and the summary, above the content.
 */
export const ReviewCard: React.FC<ReviewCardProps> = ({
  toolbar,
  toolbarEnd,
  children,
  footer,
}) => (
  <section
    className="mb-3 flex shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm last:mb-0"
    data-testid="review-card"
  >
    {(toolbar || toolbarEnd) && (
      <div className="flex min-h-11 items-center gap-2 px-2.5 py-2">
        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
          {toolbar}
        </div>
        {toolbarEnd && (
          <div className="flex shrink-0 items-center gap-1.5">{toolbarEnd}</div>
        )}
      </div>
    )}
    {children && <div className="pb-2">{children}</div>}
    {footer && (
      <div className="border-t border-gray-100 px-3 py-2">{footer}</div>
    )}
  </section>
);

/** A small chip-shaped button for the card's top bar. */
export const CardChipButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ className = "", children, ...props }) => (
  <button
    type="button"
    className={`flex max-w-[9rem] items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold whitespace-nowrap text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${className}`}
    {...props}
  >
    {children}
  </button>
);
