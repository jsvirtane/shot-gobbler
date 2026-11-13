import shot_gobbler from "../../assets/shot_gobbler.svg";
import { Tab } from "../../types/Tab";

type NavBarProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "docs", icon: "📖", label: "Docs" },
  { id: "shots", icon: "⚽", label: "Shots" },
  { id: "touches", icon: "👟", label: "Touches" },
  { id: "pass-chains", icon: "🔗", label: "Chains" },
];

const focusRing =
  "rounded-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none";

/**
 * Phones: the tabs are a fixed bottom bar within thumb reach (3.75rem plus
 * the safe area, the same height as the old top bar) and the data tabs have
 * no top bar, so the pitch keeps its size; the logo header shows on Docs.
 * Wide screens (md+): one top bar with the logo and the tabs.
 */
const NavBar = ({ activeTab, setActiveTab }: NavBarProps) => {
  const isDocs = activeTab === "docs";
  return (
    <header
      className={`z-20 w-full shrink-0 bg-gray-100 md:sticky md:top-0 md:flex md:h-15 md:shadow-md ${
        isDocs ? "flex h-15 shadow-md" : ""
      }`}
    >
      <button
        type="button"
        aria-label="Shot Gobbler – home"
        className={`flex-1 cursor-pointer flex-col justify-center border-0 bg-transparent p-0 md:flex ${focusRing} ${
          isDocs ? "flex" : "hidden"
        }`}
        onClick={() => setActiveTab("docs")}
      >
        <img src={shot_gobbler} alt="" className="h-20 w-25" />
      </button>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 flex h-[calc(3.75rem+env(safe-area-inset-bottom))] flex-row items-stretch border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgba(0,0,0,0.06)] md:static md:h-auto md:flex-1 md:items-center md:border-0 md:bg-transparent md:pb-0 md:shadow-none"
      >
        {TABS.map(({ id, icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 cursor-pointer flex-col items-center justify-center border-0 bg-transparent p-0 ${focusRing} ${
                isActive ? "font-bold text-blue-500" : "text-gray-500"
              }`}
              onClick={() => setActiveTab(id)}
            >
              <span aria-hidden="true" className="mb-1 text-2xl leading-none">
                {icon}
              </span>
              <span className="text-xs">{label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};

export default NavBar;
